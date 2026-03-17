import {
  doc, getDoc, setDoc, collection, getDocs,
  query, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { PlatformSettings, Contract, Property } from '../types';

// ─── Platform Settings ───────────────────────────────────────────────
export const getPlatformSettings = async (): Promise<PlatformSettings | null> => {
  try {
    const snap = await getDoc(doc(db, 'platform', 'settings'));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      ...d,
      updatedAt: d.updatedAt?.toDate?.()?.toISOString?.() ?? d.updatedAt ?? '',
    } as PlatformSettings;
  } catch {
    return null;
  }
};

export const savePlatformSettings = async (
  settings: Omit<PlatformSettings, 'updatedAt'> & { updatedBy: string },
): Promise<void> => {
  await setDoc(doc(db, 'platform', 'settings'), {
    ...settings,
    updatedAt: serverTimestamp(),
  });
};

// ─── Helpers ─────────────────────────────────────────────────────────
export const calcFee = (price: number, s: PlatformSettings | null): number => {
  if (!s) return 0;
  if (s.serviceFeeType === 'percent')
    return Math.round(price * s.serviceFeePercent / 100 * 100) / 100;
  return s.serviceFeeFixed;
};

export const calcNet = (price: number, s: PlatformSettings | null): number =>
  Math.max(0, price - calcFee(price, s));

function normProp(d: any): Property {
  const data = d.data();
  return { ...data, id: d.id, createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? '' } as Property;
}

function normContract(d: any): Contract {
  const data = d.data();
  return { ...data, id: d.id, createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? '' } as Contract;
}

// ─── Owner Analytics ─────────────────────────────────────────────────
export interface OwnerAnalytics {
  properties: Property[];
  contracts: Contract[];
  serviceFee: PlatformSettings | null;
}

export const getOwnerAnalytics = async (ownerId: string): Promise<OwnerAnalytics> => {
  // NO orderBy — avoids composite index requirement which triggers a false "permissions" error
  const [propSnap, contractSnap, fee] = await Promise.all([
    getDocs(query(collection(db, 'properties'), where('ownerId', '==', ownerId))),
    getDocs(query(collection(db, 'contracts'), where('ownerId', '==', ownerId))),
    getPlatformSettings(),
  ]);

  // Sort client-side
  const properties = propSnap.docs.map(normProp)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const contracts = contractSnap.docs.map(normContract)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return { properties, contracts, serviceFee: fee };
};

// ─── Platform Analytics (admin / superAdmin) ─────────────────────────
export interface PlatformAnalytics {
  properties: Property[];
  contracts: Contract[];
  totalUsers: number;
  serviceFee: PlatformSettings | null;
}

export const getPlatformAnalytics = async (): Promise<PlatformAnalytics> => {
  const [propSnap, contractSnap, userSnap, fee] = await Promise.all([
    getDocs(collection(db, 'properties')),
    getDocs(collection(db, 'contracts')),
    getDocs(collection(db, 'users')),
    getPlatformSettings(),
  ]);

  const properties = propSnap.docs.map(normProp);
  const contracts = contractSnap.docs.map(normContract);

  return { properties, contracts, totalUsers: userSnap.size, serviceFee: fee };
};