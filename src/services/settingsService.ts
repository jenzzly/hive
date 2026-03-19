import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { Currency } from '../types';

export interface PlatformConfig {
  defaultCurrency: Currency;
  updatedAt: any;
}

const COL = 'platformSettings';
const DOC_ID = 'config';

export const getPlatformConfig = async (): Promise<PlatformConfig> => {
  const snap = await getDoc(doc(db, COL, DOC_ID));
  if (snap.exists()) {
    return snap.data() as PlatformConfig;
  }
  // Default fallback
  return { defaultCurrency: 'USD', updatedAt: null };
};

export const updatePlatformConfig = async (config: Partial<PlatformConfig>): Promise<void> => {
  await setDoc(doc(db, COL, DOC_ID), {
    ...config,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};
