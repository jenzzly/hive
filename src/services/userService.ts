import {
  collection, doc, getDocs, updateDoc, deleteDoc,
  query, orderBy, getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { User, UserRole, Language } from '../types';

const COL = 'users';

export const getAllUsers = async (): Promise<User[]> => {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return { ...data, id: d.id, createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? '' } as User;
  });
};

export const updateUserRole = async (userId: string, role: UserRole): Promise<void> => {
  await updateDoc(doc(db, COL, userId), { role });
};

export const updateUserProfile = async (
  userId: string,
  data: Partial<User>
): Promise<void> => {
  await updateDoc(doc(db, COL, userId), data);
};

export const deleteUserDoc = async (userId: string): Promise<void> => {
  await deleteDoc(doc(db, COL, userId));
};

export const getUserById = async (userId: string): Promise<User | null> => {
  const snap = await getDoc(doc(db, COL, userId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { ...data, id: snap.id, createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? '' } as User;
};
