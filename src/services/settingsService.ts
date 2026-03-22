import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { PlatformSettings } from '../types';

const COL = 'platform';
const DOC_ID = 'settings';

export const getPlatformConfig = async (): Promise<PlatformSettings> => {
  const snap = await getDoc(doc(db, COL, DOC_ID));
  if (snap.exists()) {
    const data = snap.data();
    return {
      ...data,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? data.updatedAt ?? '',
    } as PlatformSettings;
  }
  // Default fallback
  return { 
    serviceFeePercent: 0, 
    serviceFeeFixed: 0, 
    serviceFeeType: 'percent', 
    defaultCurrency: 'USD', 
    defaultLanguage: 'en',
    updatedAt: '',
    updatedBy: 'system'
  };
};

export const updatePlatformConfig = async (config: Partial<PlatformSettings>): Promise<void> => {
  await setDoc(doc(db, COL, DOC_ID), {
    ...config,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};
