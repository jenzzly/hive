import {
  collection, doc, addDoc, updateDoc, getDocs, getDoc,
  query, where, orderBy, onSnapshot, serverTimestamp, increment,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Conversation, Message } from '../types';

const CONV_COL = 'conversations';
const MSG_COL = 'messages';

// ── Conversations ──────────────────────────────────────────────────────────

export const getOrCreateConversation = async (
  propertyId: string,
  propertyTitle: string,
  ownerId: string,
  tenantId: string,
): Promise<string> => {
  // check if one already exists
  const q = query(
    collection(db, CONV_COL),
    where('propertyId', '==', propertyId),
    where('tenantId', '==', tenantId),
    where('ownerId', '==', ownerId),
  );
  const snap = await getDocs(q);
  if (!snap.empty) return snap.docs[0].id;

  const ref = await addDoc(collection(db, CONV_COL), {
    propertyId,
    propertyTitle,
    ownerId,
    tenantId,
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    unreadOwner: 0,
    unreadTenant: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getOwnerConversations = async (ownerId: string): Promise<Conversation[]> => {
  const q = query(collection(db, CONV_COL), where('ownerId', '==', ownerId));
  const snap = await getDocs(q);
  const convs = snap.docs.map(normalizeConv);
  return convs.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
};

export const getTenantConversations = async (tenantId: string): Promise<Conversation[]> => {
  const q = query(collection(db, CONV_COL), where('tenantId', '==', tenantId));
  const snap = await getDocs(q);
  const convs = snap.docs.map(normalizeConv);
  return convs.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
};

export const subscribeToConversations = (
  userId: string,
  role: 'owner' | 'tenant',
  cb: (convs: Conversation[]) => void,
) => {
  const field = role === 'owner' ? 'ownerId' : 'tenantId';
  const q = query(collection(db, CONV_COL), where(field, '==', userId));
  return onSnapshot(q, snap => {
    const convs = snap.docs.map(normalizeConv);
    convs.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    cb(convs);
  });
};

export const markConversationRead = async (convId: string, role: 'owner' | 'tenant') => {
  const field = role === 'owner' ? 'unreadOwner' : 'unreadTenant';
  await updateDoc(doc(db, CONV_COL, convId), { [field]: 0 });
};

// ── Messages ───────────────────────────────────────────────────────────────

export const sendMessage = async (
  convId: string,
  senderId: string,
  senderName: string,
  text: string,
  recipientRole: 'owner' | 'tenant',
): Promise<void> => {
  const unreadField = recipientRole === 'owner' ? 'unreadOwner' : 'unreadTenant';
  await addDoc(collection(db, MSG_COL), {
    conversationId: convId,
    senderId,
    senderName,
    text,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, CONV_COL, convId), {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
    [unreadField]: increment(1),
  });
};

export const subscribeToMessages = (
  convId: string,
  cb: (msgs: Message[]) => void,
) => {
  const q = query(
    collection(db, MSG_COL),
    where('conversationId', '==', convId)
  );
  return onSnapshot(q, snap => {
    const msgs = snap.docs.map(normalizeMsg);
    msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    cb(msgs);
  });
};

// ── Normalizers ────────────────────────────────────────────────────────────

function normalizeConv(snap: any): Conversation {
  const d = snap.data();
  return {
    ...d,
    id: snap.id,
    lastMessageAt: d.lastMessageAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    createdAt: d.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  } as Conversation;
}

function normalizeMsg(snap: any): Message {
  const d = snap.data();
  return {
    ...d,
    id: snap.id,
    createdAt: d.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  } as Message;
}
