import {
  collection, doc, addDoc, updateDoc, increment,
  query, where, orderBy, onSnapshot, serverTimestamp,
  getDoc, setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Conversation, Message } from '../types';

const CONVS = 'conversations';
const MSGS = 'messages';

// ─── Get or create a conversation ───────────────────────────────────────
export const getOrCreateConversation = async (
  propertyId: string,
  propertyTitle: string,
  ownerId: string,
  tenantId: string,
): Promise<string> => {
  const convId = `${propertyId}_${tenantId}`;
  const ref = doc(db, CONVS, convId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      propertyId,
      propertyTitle,
      ownerId,
      tenantId,
      lastMessage: '',
      lastMessageAt: null,
      unreadOwner: 0,
      unreadTenant: 0,
      createdAt: serverTimestamp(),
    });
  }
  return convId;
};

// ─── Send a message ──────────────────────────────────────────────────────
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  senderName: string,
  text: string,
  recipientRole: 'owner' | 'tenant',
): Promise<void> => {
  await addDoc(collection(db, MSGS), {
    conversationId,
    senderId,
    senderName,
    recipientRole,
    text,
    createdAt: serverTimestamp(),
  });

  const unreadField = recipientRole === 'owner' ? 'unreadOwner' : 'unreadTenant';
  await updateDoc(doc(db, CONVS, conversationId), {
    lastMessage: text.length > 80 ? text.slice(0, 80) + '…' : text,
    lastMessageAt: serverTimestamp(),
    [unreadField]: increment(1),
  });
};

// ─── Mark conversation read ──────────────────────────────────────────────
export const markConversationRead = async (
  conversationId: string,
  role: 'owner' | 'tenant',
): Promise<void> => {
  const field = role === 'owner' ? 'unreadOwner' : 'unreadTenant';
  await updateDoc(doc(db, CONVS, conversationId), { [field]: 0 });
};

// ─── Real-time subscriptions ─────────────────────────────────────────────
export const subscribeToConversations = (
  userId: string,
  role: 'owner' | 'tenant',
  callback: (convs: Conversation[]) => void,
): (() => void) => {
  const field = role === 'owner' ? 'ownerId' : 'tenantId';
  const q = query(collection(db, CONVS), where(field, '==', userId));
  return onSnapshot(q, snap => {
    const convs = snap.docs
      .map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          lastMessageAt: data.lastMessageAt?.toDate?.()?.toISOString?.() ?? data.lastMessageAt ?? '',
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? '',
        } as Conversation;
      })
      .sort((a, b) =>
        new Date(b.lastMessageAt || b.createdAt).getTime() -
        new Date(a.lastMessageAt || a.createdAt).getTime()
      );
    callback(convs);
  });
};

export const subscribeToMessages = (
  conversationId: string,
  callback: (msgs: Message[]) => void,
): (() => void) => {
  const q = query(
    collection(db, MSGS),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(q, snap => {
    const msgs = snap.docs.map(d => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? '',
      } as Message;
    });
    callback(msgs);
  });
};