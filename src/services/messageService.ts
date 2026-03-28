import {
  collection, doc, addDoc, updateDoc, deleteDoc, increment,
  query, where, orderBy, onSnapshot, serverTimestamp,
  getDoc, setDoc, getDocs
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
      archivedByOwner: false,
      archivedByTenant: false,
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
    deleted: false,
    createdAt: serverTimestamp(),
  });

  const unreadField = recipientRole === 'owner' ? 'unreadOwner' : 'unreadTenant';
  // Sending a message un-archives the conversation for both sides
  await updateDoc(doc(db, CONVS, conversationId), {
    lastMessage: text.length > 80 ? text.slice(0, 80) + '…' : text,
    lastMessageAt: serverTimestamp(),
    [unreadField]: increment(1),
    archivedByOwner: false,
    archivedByTenant: false,
  });
};

// ─── Delete a single message (Hard delete) ───────────────────────────────
export const deleteMessage = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, MSGS, id));
};

// ─── Delete a conversation and all its messages ──────────────────────────
export const deleteConversation = async (convId: string): Promise<void> => {
  // Delete all messages in this conversation first
  const q = query(collection(db, MSGS), where('conversationId', '==', convId));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
  // Delete the conversation document itself
  await deleteDoc(doc(db, CONVS, convId));
};

// ─── Archive / unarchive a conversation for one party ───────────────────
export const archiveConversation = async (
  conversationId: string,
  role: 'owner' | 'tenant',
): Promise<void> => {
  const field = role === 'owner' ? 'archivedByOwner' : 'archivedByTenant';
  await updateDoc(doc(db, CONVS, conversationId), { [field]: true });
};

export const unarchiveConversation = async (
  conversationId: string,
  role: 'owner' | 'tenant',
): Promise<void> => {
  const field = role === 'owner' ? 'archivedByOwner' : 'archivedByTenant';
  await updateDoc(doc(db, CONVS, conversationId), { [field]: false });
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

/** Subscribe to all conversations for a user.
 *  showArchived = true to show the archived inbox. */
export const subscribeToConversations = (
  userId: string,
  role: 'owner' | 'tenant',
  callback: (convs: Conversation[]) => void,
  showArchived = false,
): (() => void) => {
  const field = role === 'owner' ? 'ownerId' : 'tenantId';
  const q = query(collection(db, CONVS), where(field, '==', userId));

  return onSnapshot(q, snap => {
    const archivedField = role === 'owner' ? 'archivedByOwner' : 'archivedByTenant';

    const convs = snap.docs
      .map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          lastMessageAt: data.lastMessageAt?.toDate?.()?.toISOString?.() ?? data.lastMessageAt ?? '',
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? '',
        } as Conversation & { archivedByOwner?: boolean; archivedByTenant?: boolean };
      })
      // Filter: show archived inbox or normal inbox
      .filter(c => showArchived ? !!(c as any)[archivedField] : !(c as any)[archivedField])
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
      } as Message & { deleted?: boolean };
    });
    callback(msgs);
  });
};