import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Unit } from '../types';

const COL = 'units';

function normalize(snap: any): Unit {
  const d = snap.data();
  return {
    ...d,
    id: snap.id,
    createdAt: d.createdAt?.toDate?.()?.toISOString?.() ?? d.createdAt ?? '',
  } as Unit;
}

export const getPropertyUnits = async (propertyId: string): Promise<Unit[]> => {
  const q = query(
    collection(db, COL),
    where('propertyId', '==', propertyId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(normalize);
};

export const getUnit = async (id: string): Promise<Unit | null> => {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return normalize(snap);
};

export const createUnit = async (
  data: Omit<Unit, 'id' | 'createdAt'>,
): Promise<string> => {
  const ref = await addDoc(collection(db, COL), cleanData({
    ...data,
    createdAt: serverTimestamp(),
  }));
  return ref.id;
};

export const updateUnit = async (id: string, data: Partial<Unit>): Promise<void> => {
  await updateDoc(doc(db, COL, id), cleanData(data as any));
};

export const deleteUnit = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COL, id));
};
