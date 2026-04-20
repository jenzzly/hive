import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDocs,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { RentPayment, PaymentStatus } from '../types';
import { resolveFileUrl } from '../utils/contentsUpload';

const COL = 'rentPayments';

function normalize(snap: any): RentPayment {
  const d = snap.data();
  return {
    ...d,
    id: snap.id,
    proofUrl: d.proofUrl ? resolveFileUrl(d.proofUrl) : undefined,
    ebmUrl: d.ebmUrl ? resolveFileUrl(d.ebmUrl) : undefined,
    createdAt: d.createdAt?.toDate?.()?.toISOString?.() ?? d.createdAt ?? '',
    verifiedAt: d.verifiedAt?.toDate?.()?.toISOString?.() ?? d.verifiedAt,
  } as RentPayment;
}

import { cleanData } from '../utils/db';

export const createRentPayment = async (
  data: Omit<RentPayment, 'id' | 'createdAt' | 'verifiedAt'>
): Promise<string> => {
  const ref = await addDoc(collection(db, COL), cleanData({
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  }));
  return ref.id;
};

export const updatePaymentStatus = async (
  id: string,
  status: PaymentStatus,
): Promise<void> => {
  const update: any = { status };
  if (status === 'verified') update.verifiedAt = serverTimestamp();
  await updateDoc(doc(db, COL, id), cleanData(update));
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

export const updatePayment = async (id: string, data: Partial<RentPayment>): Promise<void> => {
  await updateDoc(doc(db, COL, id), cleanData(data as any));
};

export const deletePayment = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COL, id));
};
