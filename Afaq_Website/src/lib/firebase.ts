import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBLyelU9R3OEj2YxS-K6pIfgtBGGb-L7Ss",
  authDomain: "afaqplatform.firebaseapp.com",
  projectId: "afaqplatform",
  storageBucket: "afaqplatform.firebasestorage.app",
  messagingSenderId: "683175801278",
  appId: "1:683175801278:web:7733139a097568bc4b49ef",
  measurementId: "G-B74LGVE4MH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth functions...
export async function loginUser(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signupUser(email: string, password: string, name: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'users', result.user.uid), {
    name,
    email,
    plan: 'free',
    completedModules: [],
    quizScores: {},
    curriculum: null,
    createdAt: serverTimestamp(),
  }, { merge: true });
  return result.user;
}

export async function logoutUser() {
  await signOut(auth);
}

// Data functions...
export async function getUserData(uid: string) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.error("Firestore Fetch Error:", e);
    return null;
  }
}

export async function ensureUserData(uid: string, email: string, name?: string) {
  try {
    await setDoc(doc(db, 'users', uid), {
      name: name || email.split('@')[0] || 'مستخدم',
      email,
      plan: 'free',
      completedModules: [],
      quizScores: {},
      curriculum: null,
      createdAt: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.error('Error ensuring user data:', e);
  }
}

export async function saveStudyPlans(uid: string, plans: object[]) {
  await setDoc(doc(db, 'users', uid), { studyPlans: plans }, { merge: true });
}

export async function saveCurriculum(uid: string, curriculum: object) {
  await setDoc(doc(db, 'users', uid), { curriculum }, { merge: true });
}

export async function saveProgress(
  uid: string,
  planId: string,
  completedModules: string[],
  quizScores: Record<string, number>
) {
  await setDoc(doc(db, 'users', uid), {
    [`plans.${planId}.completedModules`]: completedModules,
    [`plans.${planId}.quizScores`]: quizScores,
  }, { merge: true });
}

export { onAuthStateChanged, type FirebaseUser };