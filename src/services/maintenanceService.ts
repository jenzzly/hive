import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { MaintenanceRequest } from '../types';

const COL = 'maintenanceRequests';

export const createMaintenanceRequest = async (
  data: Omit<MaintenanceRequest, 'id' | 'createdAt' | 'resolvedAt' | 'status'>
): Promise<string> => {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    status: 'open',
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateMaintenanceRequest = async (
  id: string,
  data: Partial<MaintenanceRequest>
): Promise<void> => {
  const update: any = { ...data };
  if (data.status === 'resolved') {
    update.resolvedAt = serverTimestamp();
  }
  await updateDoc(doc(db, COL, id), update);
};

export const getTenantRequests = async (tenantId: string): Promise<MaintenanceRequest[]> => {
  const q = query(
    collection(db, COL),
    where('tenantId', '==', tenantId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(normalize);
};

export const getPropertyRequests = async (propertyId: string): Promise<MaintenanceRequest[]> => {
  const q = query(
    collection(db, COL),
    where('propertyId', '==', propertyId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(normalize);
};

export const getOwnerRequests = async (propertyIds: string[]): Promise<MaintenanceRequest[]> => {
  if (!propertyIds.length) return [];
  const q = query(
    collection(db, COL),
    where('propertyId', 'in', propertyIds),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(normalize);
};

function normalize(snap: any): MaintenanceRequest {
  const data = snap.data();
  return {
    ...data,
    id: snap.id,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? '',
    resolvedAt: data.resolvedAt?.toDate?.()?.toISOString?.() ?? data.resolvedAt,
  } as MaintenanceRequest;
}
