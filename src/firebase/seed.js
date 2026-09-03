import {
  doc, setDoc, collection, addDoc, getDocs, writeBatch
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { db, auth } from './config';

// ============================================================
// Seed Script — Authenticates FIRST, then writes to Firestore
// ============================================================

const TASKS = [
  { title: 'Use Public Transport',   description: 'Commute using bus, metro, or train instead of a private car.', points: 30, category: 'Transport', frequency: 'daily', co2Impact: 2.1 },
  { title: 'Switch Off Lights',      description: 'Turn off all lights and monitors when leaving your workspace.', points: 10, category: 'Energy',    frequency: 'daily', co2Impact: 0.2 },
  { title: 'Use Reusable Bottle',    description: 'Bring and use a reusable water bottle instead of single-use plastic.', points: 15, category: 'Waste', frequency: 'daily', co2Impact: 0.1 },
  { title: 'Cycle or Walk to Work',  description: 'Commute by cycling or walking — zero emissions, great for health!', points: 35, category: 'Transport', frequency: 'daily', co2Impact: 1.8 },
  { title: 'Reduce Paper Usage',     description: 'Go digital: avoid printing unless absolutely necessary.', points: 15, category: 'Waste',     frequency: 'daily', co2Impact: 0.3 },
  { title: 'Vegetarian Lunch',       description: 'Choose a plant-based meal for lunch today.', points: 20, category: 'Food',      frequency: 'daily', co2Impact: 0.5 },
  { title: 'Carpool to Office',      description: 'Share your ride with a colleague to reduce per-capita emissions.', points: 25, category: 'Transport', frequency: 'daily', co2Impact: 1.2 },
  { title: 'Use Stairs',             description: 'Skip the elevator and take the stairs — saves energy, boosts fitness.', points: 10, category: 'Energy', frequency: 'daily', co2Impact: 0.05 },
  { title: 'Bring Reusable Bag',     description: 'Use your own bag when shopping or carrying lunch.', points: 10, category: 'Waste', frequency: 'daily', co2Impact: 0.08 },
];

const REWARDS = [
  { name: '☕ Coffee Voucher',      description: 'A hot brew on us! Redeem at any partner café.', pointsRequired: 500 },
  { name: '🌳 Plant-a-Tree',        description: 'We plant a tree in your name via our NGO partner.', pointsRequired: 750 },
  { name: '🎬 Movie Voucher',       description: 'Two tickets to any movie of your choice.', pointsRequired: 1000 },
  { name: '🛍️ Eco Store Discount',  description: '20% off at GreenCart — eco-friendly products.', pointsRequired: 600 },
];

const DEMO_USERS = [
  { name: 'Arjun Mehta',  email: 'arjun@sustain.co',  password: 'demo1234', department: 'IT',        role: 'employee', points: 1240, streak: 7 },
  { name: 'Priya Sharma', email: 'priya@sustain.co',  password: 'demo1234', department: 'HR',        role: 'employee', points: 980,  streak: 5 },
  { name: 'Rohit Kumar',  email: 'rohit@sustain.co',  password: 'demo1234', department: 'Finance',   role: 'employee', points: 760,  streak: 3 },
  { name: 'Sneha Patel',  email: 'sneha@sustain.co',  password: 'demo1234', department: 'Marketing', role: 'employee', points: 1100, streak: 6 },
  { name: 'Vikram Singh', email: 'vikram@sustain.co', password: 'demo1234', department: 'IT',        role: 'employee', points: 890,  streak: 4 },
  { name: 'Ananya Rao',   email: 'ananya@sustain.co', password: 'demo1234', department: 'HR',        role: 'employee', points: 650,  streak: 2 },
  { name: 'Meera Joshi',  email: 'meera@sustain.co',  password: 'demo1234', department: 'Finance',   role: 'employee', points: 420,  streak: 1 },
  // Admin last — we sign in as admin to do all Firestore writes
  { name: 'Dev Ladha',    email: 'dev@sustain.co',    password: 'demo1234', department: 'IT',        role: 'admin',    points: 0,    streak: 0 },
];

async function clearCollection(collName) {
  const snap = await getDocs(collection(db, collName));
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
}

/** Create or sign-in a Firebase Auth user, return uid */
async function ensureAuthUser(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user.uid;
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return cred.user.uid;
    }
    throw err;
  }
}

export async function runSeed(onLog) {
  const log = onLog || console.log;

  try {
    // ── STEP 1: Create/sign-in ALL Auth accounts first ──────────────────────
    log('👤 Creating Auth accounts...');
    const userIds = [];
    for (const u of DEMO_USERS) {
      try {
        const uid = await ensureAuthUser(u.email, u.password);
        userIds.push({ uid, ...u });
        log(`  ✓ ${u.name}`);
      } catch (err) {
        log(`  ⚠️ ${u.name}: ${err.message}`);
      }
    }

    // ── STEP 2: Sign in as admin so all Firestore writes are authenticated ───
    const admin = userIds.find(u => u.role === 'admin');
    if (!admin) throw new Error('Admin user not created — cannot proceed.');

    log('🔑 Signing in as admin for Firestore writes...');
    await signInWithEmailAndPassword(auth, admin.email, admin.password);
    log('  ✓ Signed in as admin');

    // ── STEP 3: Write user docs ──────────────────────────────────────────────
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    log('👥 Writing user profiles...');
    for (const u of userIds) {
      await setDoc(doc(db, 'users', u.uid), {
        name:                 u.name,
        email:                u.email,
        department:           u.department,
        role:                 u.role,
        points:               u.points,
        streak:               u.streak,
        lastSubmissionDate:   u.streak > 0 ? yesterday : null,
      });
    }
    log(`✅ ${userIds.length} user profiles written`);

    // ── STEP 4: Seed tasks ───────────────────────────────────────────────────
    log('🌱 Clearing and seeding tasks...');
    await clearCollection('tasks');
    const taskIds = [];
    for (const task of TASKS) {
      const ref = await addDoc(collection(db, 'tasks'), task);
      taskIds.push(ref.id);
    }
    log(`✅ ${TASKS.length} tasks seeded`);

    // ── STEP 5: Seed rewards ─────────────────────────────────────────────────
    log('🎁 Clearing and seeding rewards...');
    await clearCollection('rewards');
    for (const reward of REWARDS) {
      await addDoc(collection(db, 'rewards'), reward);
    }
    log(`✅ ${REWARDS.length} rewards seeded`);

    // ── STEP 6: Seed submissions ─────────────────────────────────────────────
    log('📋 Clearing and seeding submissions...');
    await clearCollection('submissions');
    await clearCollection('redemptions');

    const today     = new Date().toISOString().split('T')[0];
    const employees = userIds.filter(u => u.role === 'employee');

    if (employees.length >= 2 && taskIds.length >= 6) {
      const seedSubs = [
        { userId: employees[0].uid, taskId: taskIds[0], status: 'approved', points: 30, co2Impact: 2.1,  date: today,     aiVerified: true,  aiConfidence: 0.92 },
        { userId: employees[1].uid, taskId: taskIds[3], status: 'approved', points: 35, co2Impact: 1.8,  date: today,     aiVerified: true,  aiConfidence: 0.88 },
        { userId: employees[2].uid, taskId: taskIds[2], status: 'pending',  points: 0,  co2Impact: 0,    date: today,     aiVerified: false, aiConfidence: 0.45 },
        { userId: employees[3].uid, taskId: taskIds[5], status: 'approved', points: 20, co2Impact: 0.5,  date: today,     aiVerified: true,  aiConfidence: 0.81 },
        { userId: employees[4].uid, taskId: taskIds[1], status: 'rejected', points: 0,  co2Impact: 0,    date: yesterday, aiVerified: false, aiConfidence: 0.21 },
        { userId: employees[0].uid, taskId: taskIds[7], status: 'approved', points: 10, co2Impact: 0.05, date: yesterday, aiVerified: true,  aiConfidence: 0.95 },
        { userId: employees[1].uid, taskId: taskIds[4], status: 'pending',  points: 0,  co2Impact: 0,    date: today,     aiVerified: false, aiConfidence: 0.62 },
      ];

      for (const sub of seedSubs) {
        await addDoc(collection(db, 'submissions'), {
          ...sub,
          proofImageBase64: null,
          proofImageUrl:    null,
          createdAt:        new Date(),
        });
      }
      log(`✅ ${seedSubs.length} submissions seeded`);

      // Sample redemption
      await addDoc(collection(db, 'redemptions'), {
        userId:       employees[0].uid,
        rewardId:     'sample',
        rewardName:   '☕ Coffee Voucher',
        voucherCode:  'SS-CAF-X7K2MN',
        pointsSpent:  500,
        employeeName: employees[0].name,
        redeemedAt:   new Date(),
      });
      log('✅ 1 sample redemption seeded');
    }

    log('');
    log('🎉 Seed complete! Demo credentials:');
    log('   Employee: arjun@sustain.co / demo1234');
    log('   Admin:    dev@sustain.co   / demo1234');
    return { success: true };

  } catch (err) {
    log(`❌ Seed failed: ${err.message}`);
    console.error('[Seed Error]', err);
    return { success: false, error: err.message };
  }
}
