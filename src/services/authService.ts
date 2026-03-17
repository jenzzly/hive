import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { User, UserRole } from '../types';

export const registerUser = async (
  email: string,
  password: string,
  name: string,
  role: UserRole = 'tenant'
): Promise<User> => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const { uid } = credential.user;

  const userData: User = {
    id: uid,
    name,
    email,
    role,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', uid), {
    ...userData,
    createdAt: serverTimestamp(),
  });

  return userData;
};

export const loginUser = async (email: string, password: string): Promise<FirebaseUser> => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
};

export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

export const getUserProfile = async (uid: string): Promise<User | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    ...data,
    id: snap.id,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt,
  } as User;
};

export const subscribeToAuthState = (
  callback: (user: FirebaseUser | null) => void
) => onAuthStateChanged(auth, callback);
