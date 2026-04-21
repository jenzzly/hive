import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Property } from '../types';
import { resolveFileUrl } from '../utils/contentsUpload';

const COL = 'properties';

// ─── helpers ────────────────────────────────────────────────────────
function normalize(snap: any): Property {
  const d = snap.data();
  return {
    ...d,
    id: snap.id,
    images: (d.images || []).map(resolveFileUrl),
    contractTemplate: d.contractTemplate ? resolveFileUrl(d.contractTemplate) : undefined,
    createdAt: d.createdAt?.toDate?.()?.toISOString?.() ?? d.createdAt ?? '',
  } as Property;
}

// ─── public read (no auth) ───────────────────────────────────────────
// We fetch ALL docs that match BOTH conditions separately in memory to
// avoid a composite-index requirement that can cause permission issues
// when the index isn't deployed yet.
export const getPublicProperties = async (): Promise<Property[]> => {
  // Firestore rule allows read when isPublic==true && status=='available'
  // so we query only on isPublic first (single-field index, always exists)
  const q = query(
    collection(db, COL),
    where('isPublic', '==', true),
    where('status', '==', 'available'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(normalize);
};

// ─── single property (public or authed) ─────────────────────────────
export const getProperty = async (id: string): Promise<Property | null> => {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return normalize(snap);
};

// ─── owner ──────────────────────────────────────────────────────────
export const getOwnerProperties = async (ownerId: string): Promise<Property[]> => {
  const q = query(
    collection(db, COL),
    where('ownerId', '==', ownerId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(normalize);
};

export const getOwnerPublicProperties = async (ownerId: string): Promise<Property[]> => {
  // Must include isPublic and status in the query itself or Firestore will
  // reject it with 'Missing or insufficient permissions' for unauthenticated users.
  const q = query(
    collection(db, COL),
    where('ownerId', '==', ownerId),
    where('isPublic', '==', true),
    where('status', '==', 'available')
  );
  try {
    const snap = await getDocs(q);
    // Sort in memory to avoid needing a composite index
    const props = snap.docs.map(normalize);
    return props.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('[getOwnerPublicProperties] Error:', err);
    throw err;
  }
};

// ─── tenant ─────────────────────────────────────────────────────────
export const getTenantProperty = async (tenantId: string): Promise<Property | null> => {
  const q = query(collection(db, COL), where('tenantId', '==', tenantId));
  const snap = await getDocs(q);
  return snap.empty ? null : normalize(snap.docs[0]);
};

// ─── admin / superAdmin ─────────────────────────────────────────────
export const getAllProperties = async (): Promise<Property[]> => {
  const snap = await getDocs(query(collection(db, COL), orderBy('createdAt', 'desc')));
  return snap.docs.map(normalize);
};

import { cleanData } from '../utils/db';

// ─── write ──────────────────────────────────────────────────────────
export const createProperty = async (
  data: Omit<Property, 'id' | 'createdAt'>,
): Promise<string> => {
  const ref = await addDoc(collection(db, COL), cleanData({
    ...data,
    createdAt: serverTimestamp(),
  }));
  return ref.id;
};

export const updateProperty = async (id: string, data: Partial<Property>): Promise<void> => {
  await updateDoc(doc(db, COL, id), cleanData(data as any));
};

export const deleteProperty = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COL, id));
};

export const archiveProperty = async (propertyId: string): Promise<void> => {
  // 1. Archive the property itself
  await updateDoc(doc(db, COL, propertyId), { status: 'archived' });

  // 2. Define related collections
  const relatedCols = [
    'units',
    'maintenanceRequests',
    'bookings',
    'contracts',
    'rentPayments',
    'reimbursementRequests'
  ];

  // 3. Batch archive related items (for simplicity without complex batch logic, 
  // we'll fetch and update. In a real large scale app, this would be a cloud function)
  for (const colName of relatedCols) {
    const q = query(collection(db, colName), where('propertyId', '==', propertyId));
    const snap = await getDocs(q);
    const promises = snap.docs.map(d => updateDoc(doc(db, colName, d.id), { status: 'archived' }));
    await Promise.all(promises);
  }
};
