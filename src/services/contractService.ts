import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Contract } from '../types';

const COL = 'contracts';

export const createContract = async (
  data: Omit<Contract, 'id' | 'createdAt'>
): Promise<string> => {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateContract = async (
  id: string,
  data: Partial<Contract>
): Promise<void> => {
  await updateDoc(doc(db, COL, id), data);
};

export const deleteContract = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COL, id));
};

export const getTenantContracts = async (tenantId: string): Promise<Contract[]> => {
  const q = query(
    collection(db, COL),
    where('tenantId', '==', tenantId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(normalize);
};

export const getOwnerContracts = async (ownerId: string): Promise<Contract[]> => {
  const q = query(
    collection(db, COL),
    where('ownerId', '==', ownerId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(normalize);
};

export const getPropertyContracts = async (propertyId: string): Promise<Contract[]> => {
  const q = query(collection(db, COL), where('propertyId', '==', propertyId));
  const snap = await getDocs(q);
  return snap.docs.map(normalize);
};

function normalize(snap: any): Contract {
  const data = snap.data();
  return {
    ...data,
    id: snap.id,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? '',
  } as Contract;
}