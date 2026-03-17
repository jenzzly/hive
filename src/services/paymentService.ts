import {
  collection, doc, addDoc, updateDoc, getDocs,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { RentPayment, PaymentStatus } from '../types';

const COL = 'rentPayments';

function normalize(snap: any): RentPayment {
  const d = snap.data();
  return {
    ...d,
    id: snap.id,
    createdAt: d.createdAt?.toDate?.()?.toISOString?.() ?? d.createdAt ?? '',
    verifiedAt: d.verifiedAt?.toDate?.()?.toISOString?.() ?? d.verifiedAt,
  } as RentPayment;
}

export const createRentPayment = async (
  data: Omit<RentPayment, 'id' | 'createdAt' | 'verifiedAt'>
): Promise<string> => {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const updatePaymentStatus = async (
  id: string,
  status: PaymentStatus,
): Promise<void> => {
  const update: any = { status };
  if (status === 'verified') update.verifiedAt = serverTimestamp();
  await updateDoc(doc(db, COL, id), update);
};

export const getTenantPayments = async (tenantId: string): Promise<RentPayment[]> => {
  const q = query(collection(db, COL), where('tenantId', '==', tenantId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(normalize);
};

export const getPropertyPayments = async (propertyId: string): Promise<RentPayment[]> => {
  const q = query(collection(db, COL), where('propertyId', '==', propertyId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(normalize);
};

export const getOwnerPayments = async (ownerId: string): Promise<RentPayment[]> => {
  const q = query(collection(db, COL), where('ownerId', '==', ownerId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(normalize);
};

export const getAllPayments = async (): Promise<RentPayment[]> => {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(normalize);
};
