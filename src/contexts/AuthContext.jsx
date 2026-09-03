import { createContext, useContext, useState, useEffect } from 'react';
import { signIn, signOut, onAuthStateChanged } from '../firebase/auth';
import { signUp as firebaseSignUp } from '../firebase/auth';
import { createUserDoc, getUserDoc } from '../firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Single source of truth — onAuthStateChanged handles ALL user state
  useEffect(() => {
    const unsub = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          let userDoc = await getUserDoc(firebaseUser.uid);
          // Auto-create doc if it doesn't exist (e.g. seed partially failed)
          if (!userDoc) {
            await createUserDoc(firebaseUser.uid, {
              name: firebaseUser.email.split('@')[0],
              email: firebaseUser.email,
              department: 'IT',
              role: 'employee',
            });
            userDoc = await getUserDoc(firebaseUser.uid);
          }
          setCurrentUser(userDoc);
        } catch {
          // Firestore read failed (rules not set yet?) — use minimal user object
          setCurrentUser({
            userId: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.email.split('@')[0],
            role: 'employee',
            points: 0,
            streak: 0,
            department: 'IT',
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // login just calls signIn — onAuthStateChanged handles the rest
  const login = async (email, password) => {
    try {
      await signIn(email, password);
      // State is set by onAuthStateChanged listener above
      return { success: true };
    } catch (err) {
      return { success: false, error: friendlyError(err.code) };
    }
  };

  const signup = async (name, email, password, department, role) => {
    try {
      const cred = await firebaseSignUp(email, password);
      await createUserDoc(cred.user.uid, { name, email, department, role });
      // onAuthStateChanged will pick up the new user automatically
      return { success: true };
    } catch (err) {
      return { success: false, error: friendlyError(err.code) };
    }
  };

  const logout = async () => {
    await signOut();
    // onAuthStateChanged sets currentUser to null
  };

  const refreshUser = async () => {
    if (!currentUser?.userId) return;
    try {
      const updated = await getUserDoc(currentUser.userId);
      if (updated) setCurrentUser(updated);
    } catch { /* ignore */ }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, signup, logout, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

function friendlyError(code) {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
