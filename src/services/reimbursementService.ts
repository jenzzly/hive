import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDocs,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { ReimbursementRequest, ReimbursementStatus } from '../types';
import { resolveFileUrl } from '../utils/contentsUpload';

const COL = 'reimbursementRequests';

function normalize(snap: any): ReimbursementRequest {
  const d = snap.data();
  return {
    ...d,
    id: snap.id,
    receiptUrl: d.receiptUrl ? resolveFileUrl(d.receiptUrl) : undefined,
    createdAt: d.createdAt?.toDate?.()?.toISOString?.() ?? d.createdAt ?? '',
    resolvedAt: d.resolvedAt?.toDate?.()?.toISOString?.() ?? d.resolvedAt,
  } as ReimbursementRequest;
}

export const createReimbursementRequest = async (
  data: Omit<ReimbursementRequest, 'id' | 'createdAt' | 'resolvedAt'>
): Promise<string> => {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateReimbursementStatus = async (
  id: string,
  status: ReimbursementStatus,
  ownerNote?: string,
): Promise<void> => {
  const update: any = { status };
  if (ownerNote !== undefined) update.ownerNote = ownerNote;
  if (status === 'approved' || status === 'rejected' || status === 'paid')
    update.resolvedAt = serverTimestamp();
  await updateDoc(doc(db, COL, id), update);
};

export const getTenantReimbursements = async (tenantId: string): Promise<ReimbursementRequest[]> => {
  const q = query(collection(db, COL), where('tenantId', '==', tenantId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(normalize);
};

export const getOwnerReimbursements = async (ownerId: string): Promise<ReimbursementRequest[]> => {
  const q = query(collection(db, COL), where('ownerId', '==', ownerId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(normalize);
};

export const getAllReimbursements = async (): Promise<ReimbursementRequest[]> => {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(normalize);
};

export const updateReimbursement = async (id: string, data: Partial<ReimbursementRequest>): Promise<void> => {
  await updateDoc(doc(db, COL, id), data as any);
};

export const deleteReimbursement = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COL, id));
};
