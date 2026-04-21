import {
  collection, doc, getDocs, updateDoc, deleteDoc,
  query, orderBy, getDoc, where, limit,
} from 'firebase/firestore';
import { db } from './firebase';
import type { User, UserRole, Language } from '../types';
import { resolveFileUrl } from '../utils/contentsUpload';

const COL = 'users';

export const getAllUsers = async (): Promise<User[]> => {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return { 
      ...data, 
      id: d.id, 
      photoURL: data.photoURL ? resolveFileUrl(data.photoURL) : undefined,
      idDocumentUrl: data.idDocumentUrl ? resolveFileUrl(data.idDocumentUrl) : undefined,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? '' 
    } as unknown as User;
  });
};

export const updateUserRole = async (userId: string, role: UserRole): Promise<void> => {
  await updateDoc(doc(db, COL, userId), { role });
};

import { cleanData } from '../utils/db';

export const updateUserProfile = async (
  userId: string,
  data: Partial<User>
): Promise<void> => {
  await updateDoc(doc(db, COL, userId), cleanData(data));
};

export const deleteUserDoc = async (userId: string): Promise<void> => {
  await deleteDoc(doc(db, COL, userId));
};

export const getUserById = async (userId: string): Promise<User | null> => {
  const snap = await getDoc(doc(db, COL, userId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { 
    ...data, 
    id: snap.id, 
    photoURL: data.photoURL ? resolveFileUrl(data.photoURL) : undefined,
    idDocumentUrl: data.idDocumentUrl ? resolveFileUrl(data.idDocumentUrl) : undefined,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? '' 
  } as unknown as User;
};

export const getUserBySlug = async (slug: string): Promise<User | null> => {
  const q = query(collection(db, COL), where('ownerSettings.slug', '==', slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data();
  return { 
    ...data, 
    id: d.id, 
    photoURL: data.photoURL ? resolveFileUrl(data.photoURL) : undefined,
    idDocumentUrl: data.idDocumentUrl ? resolveFileUrl(data.idDocumentUrl) : undefined,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? '' 
  } as unknown as User;
};
