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
import type { MaintenanceRequest } from '../types';

const COL = 'maintenanceRequests';

import { cleanData } from '../utils/db';

export const createMaintenanceRequest = async (
  data: Omit<MaintenanceRequest, 'id' | 'createdAt' | 'resolvedAt' | 'status'>
): Promise<string> => {
  const ref = await addDoc(collection(db, COL), cleanData({
    ...data,
    status: 'open',
    createdAt: serverTimestamp(),
  }));
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
  await updateDoc(doc(db, COL, id), cleanData(update));
};

export const deleteMaintenanceRequest = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COL, id));
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

import { resolveFileUrl } from '../utils/contentsUpload';

function normalize(snap: any): MaintenanceRequest {
  const data = snap.data();
  return {
    ...data,
    id: snap.id,
    images: (data.images || []).map(resolveFileUrl),
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? '',
    resolvedAt: data.resolvedAt?.toDate?.()?.toISOString?.() ?? data.resolvedAt,
  } as MaintenanceRequest;
}
