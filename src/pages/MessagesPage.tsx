import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  subscribeToConversations,
  subscribeToMessages,
  sendMessage,
  markConversationRead,
  deleteMessage,
  archiveConversation,
  unarchiveConversation,
} from '../services/messageService';
import { getUserById } from '../services/userService';
import { emailNewMessage } from '../services/emailService';
import { useToast } from '../hooks/useToast';
import type { Conversation, Message } from '../types';

type Inbox = 'active' | 'archived';

export default function MessagesPage() {
  const { userProfile } = useAuth();
  const { show, ToastContainer } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [archivedConvs, setArchivedConvs] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<(Message & { deleted?: boolean })[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inbox, setInbox] = useState<Inbox>('active');
  const [otherUserEmail, setOtherUserEmail] = useState('');
  const [otherUserName, setOtherUserName] = useState('');
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [convMenuId, setConvMenuId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubMsgsRef = useRef<(() => void) | null>(null);
  const convMenuRef = useRef<HTMLDivElement>(null);

  const role = userProfile?.role === 'owner' ? 'owner' : 'tenant';

  // ── Subscriptions ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!userProfile) return;
    const unsub1 = subscribeToConversations(userProfile.id, role, convs => {
      setConversations(convs);
      setLoading(false);
    }, false);
    const unsub2 = subscribeToConversations(userProfile.id, role, setArchivedConvs, true);
    return () => { unsub1(); unsub2(); };
  }, [userProfile, role]);

  // Close conv menu on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (convMenuRef.current && !convMenuRef.current.contains(e.target as Node)) {
        setConvMenuId(null);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    if (!activeConv || !userProfile) return;
    const otherId = role === 'owner' ? activeConv.tenantId : activeConv.ownerId;
    getUserById(otherId).then(u => {
      if (u) { setOtherUserEmail(u.email); setOtherUserName(u.name); }
    });
  }, [activeConv, userProfile, role]);

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
    markConversationRead(conv.id, role);
  }, [role]);

  useEffect(() => () => { if (unsubMsgsRef.current) unsubMsgsRef.current(); }, []);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeConv || !userProfile || sending) return;
    setSending(true);
    const recipientRole = role === 'owner' ? 'tenant' : 'owner';
    try {
      await sendMessage(activeConv.id, userProfile.id, userProfile.name, text.trim(), recipientRole);
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

  const handleDeleteMessage = async (msgId: string) => {
    try {
      await deleteMessage(msgId);
      show('Message deleted.');
    } catch {
      show('Failed to delete message.', 'error');
    }
  };

  const handleArchive = async (conv: Conversation) => {
    await archiveConversation(conv.id, role);
    setConvMenuId(null);
    if (activeConv?.id === conv.id) setActiveConv(null);
    show('Conversation archived.');
  };

  const handleUnarchive = async (conv: Conversation) => {
    await unarchiveConversation(conv.id, role);
    setConvMenuId(null);
    show('Conversation restored to inbox.');
  };

  // ── Derived ─────────────────────────────────────────────────────────────
  const displayConvs = inbox === 'active' ? conversations : archivedConvs;
  const totalUnread = conversations.reduce((s, c) => s + (role === 'owner' ? c.unreadOwner : c.unreadTenant), 0);

  if (!userProfile) return null;

  return (
    <div className="container page" style={{ paddingBottom: 0 }}>
      <ToastContainer />

      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          Messages
          {totalUnread > 0 && <span style={S.unreadBadge}>{totalUnread}</span>}
        </h1>
        <p className="page-subtitle">Your conversations with {role === 'owner' ? 'tenants' : 'your landlord'}.</p>
      </div>

      <div style={S.layout}>
        {/* ── Sidebar ── */}
        <div style={S.sidebar}>

          {/* Inbox / Archived toggle */}
          <div style={{ display: 'flex', gap: 3, padding: '10px 12px', borderBottom: '1px solid var(--border)', background: '#fff' }}>
            {(['active', 'archived'] as Inbox[]).map(tab => (
              <button key={tab} onClick={() => setInbox(tab)}
                style={{ flex: 1, padding: '6px 0', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'var(--font-body)', fontWeight: inbox === tab ? 600 : 400, background: inbox === tab ? 'var(--terra-100)' : 'transparent', color: inbox === tab ? 'var(--terra-700)' : 'var(--text-muted)', transition: 'all 0.14s' }}>
                {tab === 'active' ? `Inbox${totalUnread > 0 ? ` (${totalUnread})` : ''}` : `Archived${archivedConvs.length > 0 ? ` (${archivedConvs.length})` : ''}`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : displayConvs.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }}>
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <p style={{ fontSize: '0.85rem' }}>{inbox === 'active' ? 'No conversations yet' : 'No archived conversations'}</p>
            </div>
          ) : (
            displayConvs.map(conv => {
              const unread = role === 'owner' ? conv.unreadOwner : conv.unreadTenant;
              const isActive = activeConv?.id === conv.id;
              const menuOpen = convMenuId === conv.id;

              return (
                <div key={conv.id} style={{ position: 'relative' }}>
                  <button onClick={() => openConversation(conv)} style={{
                    ...S.convItem,
                    background: isActive ? 'var(--terra-100)' : 'transparent',
                    borderLeft: isActive ? `3px solid var(--terra-600)` : '3px solid transparent',
                  }}>
                    <div style={S.convAvatar}>{role === 'owner' ? '👤' : '🏠'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: isActive ? 'var(--terra-700)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conv.propertyTitle}
                        </div>
                        {unread > 0 && <span style={S.unreadDot}>{unread}</span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                        {conv.lastMessage || 'No messages yet'}
                      </div>
                    </div>
                  </button>

                  {/* ⋯ menu button */}
                  <button
                    onClick={e => { e.stopPropagation(); setConvMenuId(menuOpen ? null : conv.id); }}
                    style={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1, opacity: isActive || menuOpen ? 1 : 0, transition: 'opacity 0.15s' }}
                    className="conv-menu-btn"
                    title="More options"
                  >
                    ⋯
                  </button>

                  {/* Dropdown */}
                  {menuOpen && (
                    <div ref={convMenuRef} style={S.convDropdown}>
                      {inbox === 'active' ? (
                        <button style={S.menuItem} onClick={() => handleArchive(conv)}>
                          <span>📦</span> Archive conversation
                        </button>
                      ) : (
                        <button style={S.menuItem} onClick={() => handleUnarchive(conv)}>
                          <span>📥</span> Restore to inbox
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Chat pane ── */}
        <div style={S.chatPane}>
          {!activeConv ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text-muted)', padding: 40 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ opacity: 0.4 }}>
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <p style={{ fontSize: '0.92rem' }}>Select a conversation to start chatting</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={S.chatHeader}>
                <div style={{ ...S.convAvatar, width: 36, height: 36 }}>{role === 'owner' ? '👤' : '🏠'}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--terra-900)' }}>{activeConv.propertyTitle}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {role === 'owner' ? `Tenant: ${otherUserName || '…'}` : `Owner: ${otherUserName || '…'}`}
                  </div>
                </div>

                {/* Archive from header */}
                {inbox === 'active' && (
                  <button
                    onClick={() => handleArchive(activeConv)}
                    title="Archive conversation"
                    style={{ marginLeft: 'auto', background: 'none', border: '1px solid var(--border-strong)', borderRadius: 8, cursor: 'pointer', padding: '6px 12px', fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}
                  >
                    📦 Archive
                  </button>
                )}
                {inbox === 'archived' && (
                  <button
                    onClick={() => handleUnarchive(activeConv)}
                    title="Restore to inbox"
                    style={{ marginLeft: 'auto', background: 'none', border: '1px solid var(--border-strong)', borderRadius: 8, cursor: 'pointer', padding: '6px 12px', fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}
                  >
                    📥 Restore
                  </button>
                )}
              </div>

              {/* Messages area */}
              <div style={S.messagesArea}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '40px 0' }}>
                    No messages yet — say hello! 👋
                  </div>
                )}

                {messages.map(msg => {
                  const isMine = msg.senderId === userProfile.id;
                  const isHovered = hoveredMsgId === msg.id;
                  const isDeleted = msg.deleted;

                  return (
                    <div
                      key={msg.id}
                      style={{ display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end', marginBottom: 12 }}
                      onMouseEnter={() => setHoveredMsgId(msg.id)}
                      onMouseLeave={() => setHoveredMsgId(null)}
                    >
                      <div style={{ ...S.msgAvatar, background: isMine ? 'var(--terra-600)' : 'var(--stone-100)', color: isMine ? '#fff' : 'var(--text-secondary)' }}>
                        {msg.senderName.charAt(0).toUpperCase()}
                      </div>

                      <div style={{ maxWidth: '68%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                        {isDeleted ? (
                          /* Deleted message tombstone */
                          <div style={{ ...S.bubble, background: 'var(--stone-100)', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.82rem', borderRadius: 12, border: '1px dashed var(--stone-300)' }}>
                            Message deleted
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: isMine ? 'row' : 'row-reverse' }}>
                            {/* Delete button — only own messages, only on hover */}
                            {isMine && isHovered && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                title="Delete message"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 6, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1, transition: 'color 0.12s', flexShrink: 0 }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                              >
                                🗑
                              </button>
                            )}
                            <div style={{ ...S.bubble, background: isMine ? 'var(--terra-600)' : '#fff', color: isMine ? '#fff' : 'var(--text-primary)', borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px', border: isMine ? 'none' : '1px solid var(--border)' }}>
                              {msg.text}
                            </div>
                          </div>
                        )}
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input — disabled for archived convs */}
              {inbox === 'archived' ? (
                <div style={{ ...S.inputRow, justifyContent: 'center', background: 'var(--stone-50)' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>This conversation is archived. Restore it to send messages.</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleUnarchive(activeConv)} style={{ marginLeft: 8 }}>Restore</button>
                </div>
              ) : (
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
                  <button type="submit" className="btn btn-primary" disabled={!text.trim() || sending}
                    style={{ borderRadius: 24, padding: '10px 20px' }}>
                    {sending ? '…' : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      {/* Hover hint — shown briefly to new users */}
      <style>{`
        .conv-menu-btn { opacity: 0 !important; }
        div:hover > .conv-menu-btn { opacity: 1 !important; }
      `}</style>
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
    height: 'calc(100vh - 210px)',
    minHeight: 480,
    boxShadow: 'var(--shadow)',
  },
  sidebar: {
    borderRight: '1px solid var(--border)',
    overflowY: 'auto' as const,
    background: 'var(--surface)',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  convItem: {
    width: '100%', padding: '13px 16px', border: 'none',
    cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start',
    transition: 'background 0.15s', textAlign: 'left' as const,
    fontFamily: 'var(--font-body)', borderBottom: '1px solid var(--border)',
  },
  convAvatar: {
    width: 36, height: 36, borderRadius: '50%',
    background: 'var(--terra-100)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.1rem', flexShrink: 0,
  },
  convDropdown: {
    position: 'absolute' as const, right: 8, top: '100%', zIndex: 50,
    background: '#fff', border: '1px solid var(--border)',
    borderRadius: 10, boxShadow: 'var(--shadow-lg)',
    minWidth: 200, padding: '4px 0',
  },
  menuItem: {
    width: '100%', padding: '10px 16px', border: 'none', background: 'none',
    cursor: 'pointer', textAlign: 'left' as const, fontSize: '0.88rem',
    color: 'var(--text-secondary)', fontFamily: 'var(--font-body)',
    display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.12s',
  },
  chatPane: {
    display: 'flex', flexDirection: 'column' as const, overflow: 'hidden',
  },
  chatHeader: {
    padding: '14px 20px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: 12, background: '#fff', flexShrink: 0,
  },
  messagesArea: {
    flex: 1, overflowY: 'auto' as const,
    padding: '20px 20px 8px',
    background: 'var(--surface)',
  },
  inputRow: {
    display: 'flex', gap: 10, padding: '14px 20px',
    background: '#fff', borderTop: '1px solid var(--border)',
    alignItems: 'center', flexShrink: 0,
  },
  bubble: {
    padding: '10px 14px', fontSize: '0.9rem', lineHeight: 1.5,
    boxShadow: '0 1px 3px rgba(44,28,8,0.06)',
  },
  msgAvatar: {
    width: 28, height: 28, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.75rem', fontWeight: 600, flexShrink: 0,
  },
  unreadBadge: {
    background: '#ef4444', color: '#fff', fontSize: '0.78rem',
    fontWeight: 600, padding: '2px 8px', borderRadius: 20,
  },
  unreadDot: {
    background: '#ef4444', color: '#fff', fontSize: '0.65rem',
    fontWeight: 700, padding: '1px 6px', borderRadius: 20, flexShrink: 0,
  },
};