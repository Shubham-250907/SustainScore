import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, getDocs, addDoc, query,
  where, serverTimestamp, increment,
} from 'firebase/firestore';
import { db } from './config';

const getTime = (val) => {
  if (!val) return 0;
  if (typeof val.toMillis === 'function') return val.toMillis();
  if (typeof val.toDate === 'function') return val.toDate().getTime();
  if (val instanceof Date) return val.getTime();
  return new Date(val).getTime() || 0;
};

// ─── USERS ────────────────────────────────────────────────────────────────

export const createUserDoc = (uid, data) =>
  setDoc(doc(db, 'users', uid), {
    ...data,
    points: data.points ?? 0,
    streak: data.streak ?? 0,
    lastSubmissionDate: data.lastSubmissionDate ?? null,
    createdAt: serverTimestamp(),
  });

export const getUserDoc = async (uid) => {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? { userId: snap.id, ...snap.data() } : null;
  } catch (err) {
    console.error('getUserDoc error:', err);
    return null;
  }
};

export const getAllUsers = async () => {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => ({ userId: d.id, ...d.data() }));
  } catch (err) {
    console.error('getAllUsers error:', err);
    return [];
  }
};

export const updateUserPoints = (uid, pointsDelta) =>
  updateDoc(doc(db, 'users', uid), { points: increment(pointsDelta) });

export const updateUserStreak = (uid, streak, lastSubmissionDate) =>
  updateDoc(doc(db, 'users', uid), { streak, lastSubmissionDate });

// ─── TASKS ────────────────────────────────────────────────────────────────

export const getTasks = async () => {
  try {
    const snap = await getDocs(collection(db, 'tasks'));
    return snap.docs.map(d => ({ taskId: d.id, ...d.data() }));
  } catch (err) {
    console.error('getTasks error:', err);
    return [];
  }
};

export const createTask = (data) =>
  addDoc(collection(db, 'tasks'), data);

export const updateTask = (taskId, data) =>
  updateDoc(doc(db, 'tasks', taskId), data);

export const deleteTask = (taskId) =>
  deleteDoc(doc(db, 'tasks', taskId));

// ─── SUBMISSIONS ─────────────────────────────────────────────────────────

export const createSubmission = (data) =>
  addDoc(collection(db, 'submissions'), {
    ...data,
    createdAt: serverTimestamp(),
  });

export const getAllSubmissions = async () => {
  try {
    const snap = await getDocs(collection(db, 'submissions'));
    const list = snap.docs.map(d => ({ submissionId: d.id, ...d.data() }));
    return list.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
  } catch (err) {
    console.error('getAllSubmissions error:', err);
    return [];
  }
};

export const getUserSubmissions = async (uid) => {
  try {
    const snap = await getDocs(
      query(collection(db, 'submissions'), where('userId', '==', uid))
    );
    const list = snap.docs.map(d => ({ submissionId: d.id, ...d.data() }));
    return list.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
  } catch (err) {
    console.error('getUserSubmissions error:', err);
    return [];
  }
};

/** Approve submission: update status, award points, recalculate streak */
export const approveSubmission = async (submissionId, userId, points, taskCo2Impact) => {
  const today = new Date().toISOString().split('T')[0];

  // 1. Update submission status
  await updateDoc(doc(db, 'submissions', submissionId), {
    status: 'approved',
    approvedAt: serverTimestamp(),
  });

  // 2. Award points
  await updateUserPoints(userId, points);

  // 3. Update streak
  const userSnap = await getDoc(doc(db, 'users', userId));
  if (userSnap.exists()) {
    const user = userSnap.data();
    const last = user.lastSubmissionDate;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let newStreak = 1;
    if (last === yesterday || last === today) {
      newStreak = (user.streak || 0) + (last === today ? 0 : 1);
    }
    await updateUserStreak(userId, newStreak, today);
  }

  // 4. Update company stats doc if it exists
  await updateDoc(doc(db, 'company', 'stats'), {
    totalCO2Saved: increment(taskCo2Impact || 0),
    totalApproved: increment(1),
  }).catch(() => {});
};

export const rejectSubmission = (submissionId) =>
  updateDoc(doc(db, 'submissions', submissionId), {
    status: 'rejected',
    rejectedAt: serverTimestamp(),
  });

// ─── REWARDS ─────────────────────────────────────────────────────────────

export const getRewards = async () => {
  try {
    const snap = await getDocs(collection(db, 'rewards'));
    return snap.docs.map(d => ({ rewardId: d.id, ...d.data() }));
  } catch (err) {
    console.error('getRewards error:', err);
    return [];
  }
};

export const createReward = (data) =>
  addDoc(collection(db, 'rewards'), data);

export const updateReward = (rewardId, data) =>
  updateDoc(doc(db, 'rewards', rewardId), data);

export const deleteReward = (rewardId) =>
  deleteDoc(doc(db, 'rewards', rewardId));

// ─── REDEMPTIONS ─────────────────────────────────────────────────────────

export const createRedemption = (data) =>
  addDoc(collection(db, 'redemptions'), {
    ...data,
    redeemedAt: serverTimestamp(),
  });

export const getUserRedemptions = async (uid) => {
  try {
    const snap = await getDocs(
      query(collection(db, 'redemptions'), where('userId', '==', uid))
    );
    const list = snap.docs.map(d => ({ redemptionId: d.id, ...d.data() }));
    return list.sort((a, b) => getTime(b.redeemedAt) - getTime(a.redeemedAt));
  } catch (err) {
    console.error('getUserRedemptions error:', err);
    return [];
  }
};

export const getAllRedemptions = async () => {
  try {
    const snap = await getDocs(collection(db, 'redemptions'));
    const list = snap.docs.map(d => ({ redemptionId: d.id, ...d.data() }));
    return list.sort((a, b) => getTime(b.redeemedAt) - getTime(a.redeemedAt));
  } catch (err) {
    console.error('getAllRedemptions error:', err);
    return [];
  }
};

// ─── LEADERBOARD ─────────────────────────────────────────────────────────

export const getLeaderboard = async () => {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const allUsers = snap.docs.map(d => ({ userId: d.id, ...d.data() }));
    return allUsers
      .filter(u => u.role === 'employee')
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, 20);
  } catch (err) {
    console.error('getLeaderboard error:', err);
    return [];
  }
};

// ─── COMPANY SCORE ───────────────────────────────────────────────────────

/**
 * Recalculate and return the company sustainability score.
 */
export const computeCompanyScore = async () => {
  try {
    const [allUsers, allSubmissions] = await Promise.all([
      getAllUsers(),
      getAllSubmissions(),
    ]);

    const employees = allUsers.filter(u => u.role === 'employee');
    const totalEmployees = employees.length || 1;

    const thisMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-09"
    const approvedThisMonth = allSubmissions.filter(
      s => s.status === 'approved' && (s.date || '').startsWith(thisMonth)
    );

    const activeUserIds = new Set(approvedThisMonth.map(s => s.userId));
    const participationScore = Math.round((activeUserIds.size / totalEmployees) * 100);

    const totalPossible = totalEmployees * 5;
    const completionScore = Math.min(100, Math.round((approvedThisMonth.length / totalPossible) * 100));

    const totalCO2 = allSubmissions
      .filter(s => s.status === 'approved')
      .reduce((sum, s) => sum + (s.co2Impact || 0), 0);
    const impactScore = Math.min(100, Math.round((totalCO2 / 500) * 100));

    const score = Math.round(
      participationScore * 0.30 +
      completionScore   * 0.30 +
      impactScore       * 0.40
    );

    return {
      score,
      participationScore,
      completionScore,
      impactScore,
      totalCO2Saved: totalCO2,
      totalEmployees,
      activeEmployees: activeUserIds.size,
      tasksCompleted: approvedThisMonth.length,
    };
  } catch (err) {
    console.error('computeCompanyScore error:', err);
    return {
      score: 0,
      participationScore: 0,
      completionScore: 0,
      impactScore: 0,
      totalCO2Saved: 0,
      totalEmployees: 0,
      activeEmployees: 0,
      tasksCompleted: 0,
    };
  }
};
