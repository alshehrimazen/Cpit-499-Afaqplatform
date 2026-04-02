import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';

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

export async function loginUser(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signupUser(email: string, password: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export { onAuthStateChanged, type User };