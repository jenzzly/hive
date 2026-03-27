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

// ─── write ──────────────────────────────────────────────────────────
export const createProperty = async (
  data: Omit<Property, 'id' | 'createdAt'>,
): Promise<string> => {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateProperty = async (id: string, data: Partial<Property>): Promise<void> => {
  await updateDoc(doc(db, COL, id), data as any);
};

export const deleteProperty = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COL, id));
};
