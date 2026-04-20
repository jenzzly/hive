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
import type { BookingRequest, BookingStatus } from '../types';

import { cleanData } from '../utils/db';

const COL = 'bookingRequests';

export const createBookingRequest = async (
  data: Omit<BookingRequest, 'id' | 'createdAt' | 'status'>
): Promise<string> => {
  const ref = await addDoc(collection(db, COL), cleanData({
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  }));
  return ref.id;
};

export const updateBookingStatus = async (id: string, status: BookingStatus): Promise<void> => {
  await updateDoc(doc(db, COL, id), { status });
};

export const deleteBooking = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COL, id));
};

export const getTenantBookings = async (tenantId: string): Promise<BookingRequest[]> => {
  const q = query(collection(db, COL), where('tenantId', '==', tenantId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(normalize);
};

export const getOwnerBookings = async (ownerId: string): Promise<BookingRequest[]> => {
  const q = query(collection(db, COL), where('ownerId', '==', ownerId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(normalize);
};

function normalize(snap: any): BookingRequest {
  const data = snap.data();
  return {
    ...data,
    id: snap.id,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? '',
  } as BookingRequest;
}