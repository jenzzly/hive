import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  subscribeToConversations,
  subscribeToMessages,
  sendMessage,
  markConversationRead,
} from '../services/messageService';
import { getUserById } from '../services/userService';
import { emailNewMessage } from '../services/emailService';
import { useToast } from '../hooks/useToast';
import type { Conversation, Message } from '../types';

export default function MessagesPage() {
  const { userProfile } = useAuth();
  const { show, ToastContainer } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [otherUserEmail, setOtherUserEmail] = useState<string>('');
  const [otherUserName, setOtherUserName] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubMsgsRef = useRef<(() => void) | null>(null);

  const role = userProfile?.role === 'owner' ? 'owner' : 'tenant';

  // Subscribe to conversations
  useEffect(() => {
    if (!userProfile) return;
    const unsub = subscribeToConversations(userProfile.id, role, convs => {
      setConversations(convs);
      setLoading(false);
    });
    return unsub;
  }, [userProfile, role]);

  // Load other user info when active conversation changes
  useEffect(() => {
    if (!activeConv || !userProfile) return;
    const otherId = role === 'owner' ? activeConv.tenantId : activeConv.ownerId;
    getUserById(otherId).then(u => {
      if (u) { setOtherUserEmail(u.email); setOtherUserName(u.name); }
    });
  }, [activeConv, userProfile, role]);

  // Subscribe to messages for active conversation
  const openConversation = useCallback((conv: Conversation) => {
    setActiveConv(conv);
    setMessages([]);
    setText('');

    if (unsubMsgsRef.current) unsubMsgsRef.current();
    const unsub = subscribeToMessages(conv.id, msgs => {
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    });
    unsubMsgsRef.current = unsub;

    // Mark as read
    markConversationRead(conv.id, role);
  }, [role]);

  useEffect(() => () => { if (unsubMsgsRef.current) unsubMsgsRef.current(); }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeConv || !userProfile || sending) return;
    setSending(true);
    const recipientRole = role === 'owner' ? 'tenant' : 'owner';
    try {
      await sendMessage(activeConv.id, userProfile.id, userProfile.name, text.trim(), recipientRole);
      // Email notification (fire-and-forget)
      if (otherUserEmail) {
        emailNewMessage({
          recipientEmail: otherUserEmail,
          recipientName: otherUserName,
          senderName: userProfile.name,
          propertyTitle: activeConv.propertyTitle,
          messageText: text.trim(),
        });
      }
      setText('');
    } catch (err: any) {
      show(err.message || 'Failed to send', 'error');
    } finally {
      setSending(false);
    }
  };

  const totalUnread = conversations.reduce((sum, c) =>
    sum + (role === 'owner' ? c.unreadOwner : c.unreadTenant), 0);

  if (!userProfile) return null;

  return (
    <div className="container page" style={{ paddingBottom: 0 }}>
      <ToastContainer />
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          Messages
          {totalUnread > 0 && (
            <span style={S.unreadBadge}>{totalUnread}</span>
          )}
        </h1>
        <p className="page-subtitle">Your conversations with {role === 'owner' ? 'tenants' : 'your landlord'}.</p>
      </div>

      <div style={S.layout}>
        {/* ── Sidebar ── */}
        <div style={S.sidebar}>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ margin: '0 auto 12px', display: 'block' }}>
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <p style={{ fontSize: '0.88rem' }}>No conversations yet</p>
            </div>
          ) : (
            conversations.map(conv => {
              const unread = role === 'owner' ? conv.unreadOwner : conv.unreadTenant;
              const isActive = activeConv?.id === conv.id;
              return (
                <button key={conv.id} onClick={() => openConversation(conv)} style={{
                  ...S.convItem,
                  background: isActive ? 'var(--teal-light)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--teal)' : '3px solid transparent',
                }}>
                  <div style={S.convAvatar}>
                    {role === 'owner' ? '👤' : '🏠'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: isActive ? 'var(--teal-dark)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.propertyTitle}
                      </div>
                      {unread > 0 && <span style={S.unreadDot}>{unread}</span>}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                      {conv.lastMessage || 'No messages yet'}
                    </div>
                    {conv.lastMessageAt && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>
                        {new Date(conv.lastMessageAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* ── Chat pane ── */}
        <div style={S.chatPane}>
          {!activeConv ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-muted)', padding: 40 }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <p style={{ fontSize: '1rem', fontWeight: 500 }}>Select a conversation</p>
              <p style={{ fontSize: '0.85rem' }}>Choose one from the left to start chatting.</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={S.chatHeader}>
                <div style={S.convAvatar}>🏠</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{activeConv.propertyTitle}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {role === 'owner' ? `Tenant: ${otherUserName || '…'}` : `Owner: ${otherUserName || '…'}`}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={S.messagesArea}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '40px 0' }}>
                    No messages yet — say hello! 👋
                  </div>
                )}
                {messages.map(msg => {
                  const isMine = msg.senderId === userProfile.id;
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end', marginBottom: 12 }}>
                      <div style={{ ...S.msgAvatar, background: isMine ? 'var(--teal)' : 'var(--surface2)', color: isMine ? '#fff' : 'var(--text-secondary)' }}>
                        {msg.senderName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ maxWidth: '70%' }}>
                        <div style={{ ...S.bubble, background: isMine ? 'var(--teal)' : '#fff', color: isMine ? '#fff' : 'var(--text-primary)', borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px', border: isMine ? 'none' : '1px solid var(--border)' }}>
                          {msg.text}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4, textAlign: isMine ? 'right' : 'left' }}>
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} style={S.inputRow}>
                <input
                  className="form-input"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Type a message…"
                  disabled={sending}
                  style={{ flex: 1, borderRadius: 24, padding: '10px 18px' }}
                  autoFocus
                />
                <button type="submit" className="btn btn-primary" disabled={!text.trim() || sending} style={{ borderRadius: 24, padding: '10px 20px' }}>
                  {sending ? '…' : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  layout: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: 0,
    background: '#fff',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    height: 'calc(100vh - 200px)',
    minHeight: 480,
    boxShadow: 'var(--shadow)',
  },
  sidebar: {
    borderRight: '1px solid var(--border)',
    overflowY: 'auto',
    background: 'var(--surface)',
  },
  convItem: {
    width: '100%',
    padding: '14px 16px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    transition: 'background 0.15s',
    textAlign: 'left',
    fontFamily: 'var(--font-body)',
    borderBottom: '1px solid var(--border)',
  },
  convAvatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'var(--teal-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.1rem',
    flexShrink: 0,
  },
  chatPane: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  chatHeader: {
    padding: '14px 20px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#fff',
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 20px 8px',
    background: 'var(--surface)',
  },
  inputRow: {
    display: 'flex',
    gap: 10,
    padding: '14px 20px',
    background: '#fff',
    borderTop: '1px solid var(--border)',
    alignItems: 'center',
  },
  bubble: {
    padding: '10px 14px',
    fontSize: '0.9rem',
    lineHeight: 1.5,
    boxShadow: '0 1px 3px rgba(4,52,44,0.06)',
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 600,
    flexShrink: 0,
  },
  unreadBadge: {
    background: '#ef4444',
    color: '#fff',
    fontSize: '0.78rem',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 20,
  },
  unreadDot: {
    background: '#ef4444',
    color: '#fff',
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '1px 6px',
    borderRadius: 20,
    flexShrink: 0,
  },
};
