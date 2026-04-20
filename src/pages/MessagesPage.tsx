import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  subscribeToConversations, subscribeToMessages, sendMessage,
  markConversationRead, deleteMessage, deleteConversation,
  archiveConversation, unarchiveConversation,
} from '../services/messageService';
import { getUserById } from '../services/userService';
import { emailNewMessage } from '../services/emailService';
import { useToast } from '../hooks/useToast';
import { MessagesIcon, ArchiveIcon, TrashIcon, SendIcon, ChevronLeftIcon } from '../components/Icons';
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
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 800);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubMsgsRef = useRef<(() => void) | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const role = userProfile?.role === 'owner' ? 'owner' : 'tenant';

  useEffect(() => {
    if (!userProfile) return;
    const u1 = subscribeToConversations(userProfile.id, role, c => { setConversations(c); setLoading(false); }, false);
    const u2 = subscribeToConversations(userProfile.id, role, setArchivedConvs, true);
    return () => { u1(); u2(); };
  }, [userProfile, role]);

  useEffect(() => {
    const r = () => setIsMobileView(window.innerWidth <= 800);
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeConv || !userProfile || sending) return;
    setSending(true);
    try {
      await sendMessage(activeConv.id, userProfile.id, userProfile.name, text.trim(), role === 'owner' ? 'tenant' : 'owner');
      if (otherUserEmail) {
        emailNewMessage({ recipientEmail: otherUserEmail, recipientName: otherUserName, senderName: userProfile.name, propertyTitle: activeConv.propertyTitle, messageText: text.trim() });
      }
      setText('');
      textareaRef.current?.focus();
    } catch (err: any) {
      show(err.message || 'Failed to send', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('Delete this message? This cannot be undone.')) return;
    try { await deleteMessage(msgId); }
    catch { show('Failed to delete message.', 'error'); }
  };

  const handleArchive = async (conv: Conversation) => {
    await archiveConversation(conv.id, role);
    if (activeConv?.id === conv.id) setActiveConv(null);
    show('Conversation archived.');
  };

  const handleUnarchive = async (conv: Conversation) => {
    await unarchiveConversation(conv.id, role);
    show('Conversation restored to inbox.');
  };

  const handleDeleteConversation = async (conv: Conversation) => {
    if (!confirm('Permanently delete this entire conversation for both parties?')) return;
    try {
      await deleteConversation(conv.id);
      if (activeConv?.id === conv.id) setActiveConv(null);
      show('Conversation deleted.');
    } catch { show('Failed to delete.', 'error'); }
  };

  const displayConvs = inbox === 'active' ? conversations : archivedConvs;
  const totalUnread = conversations.reduce((s, c) => s + (role === 'owner' ? c.unreadOwner : c.unreadTenant), 0);

  if (!userProfile) return null;

  const showSidebar = !isMobileView || !activeConv;
  const showChat = !isMobileView || !!activeConv;

  return (
    <div style={{ background: '#f2f2f2', minHeight: 'calc(100vh - 56px)' }}>
      <ToastContainer />

      {/* Page header */}
      <div style={{ background: '#003580', padding: '18px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <MessagesIcon size={22} color="#fff" />
          <div>
            <h1 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.3px' }}>
              Messages
              {totalUnread > 0 && (
                <span style={{ background: '#febb02', color: '#003580', fontSize: '0.72rem', fontWeight: 800, padding: '1px 7px', borderRadius: 10, marginLeft: 10, verticalAlign: 'middle' }}>
                  {totalUnread}
                </span>
              )}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', marginTop: 2 }}>
              Conversations with {role === 'owner' ? 'tenants' : 'your landlord'}
            </p>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="container" style={{ paddingTop: 16, paddingBottom: 40 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: showSidebar && showChat ? '300px 1fr' : '1fr',
          gap: 0,
          background: '#fff',
          border: '1px solid #e7e7e7',
          borderRadius: 8,
          overflow: 'hidden',
          height: 'calc(100vh - 210px)',
          minHeight: 500,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}>

          {/* ── Sidebar ── */}
          {showSidebar && (
            <div style={{
              borderRight: '1px solid #e7e7e7',
              display: 'flex', flexDirection: 'column',
              background: '#fafafa', overflowY: 'auto',
            }}>
              {/* Tab bar */}
              <div style={{ display: 'flex', borderBottom: '1px solid #e7e7e7', background: '#fff' }}>
                {(['active', 'archived'] as Inbox[]).map(tab => (
                  <button key={tab} onClick={() => setInbox(tab)} style={{
                    flex: 1, padding: '12px 0', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 600,
                    background: 'transparent',
                    color: inbox === tab ? '#003580' : '#737373',
                    borderBottom: inbox === tab ? '2px solid #003580' : '2px solid transparent',
                    transition: 'all 0.15s',
                  }}>
                    {tab === 'active'
                      ? `Inbox${totalUnread > 0 ? ` (${totalUnread})` : ''}`
                      : `Archived${archivedConvs.length > 0 ? ` (${archivedConvs.length})` : ''}`
                    }
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
              ) : displayConvs.length === 0 ? (
                <div style={{ padding: '48px 20px', textAlign: 'center', color: '#a0a0a0' }}>
                  <MessagesIcon size={36} color="#d4d4d4" />
                  <p style={{ fontSize: '0.84rem', marginTop: 12 }}>
                    {inbox === 'active' ? 'No conversations yet' : 'No archived conversations'}
                  </p>
                </div>
              ) : (
                displayConvs.map(conv => {
                  const unread = role === 'owner' ? conv.unreadOwner : conv.unreadTenant;
                  const isActive = activeConv?.id === conv.id;
                  return (
                    <div key={conv.id} style={{ position: 'relative', group: 'yes' } as any}>
                      <button
                        onClick={() => openConversation(conv)}
                        style={{
                          width: '100%', padding: '14px 16px',
                          border: 'none', borderBottom: '1px solid #f0f0f0',
                          cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start',
                          textAlign: 'left', fontFamily: 'var(--font-body)',
                          background: isActive ? '#eff6ff' : '#fff',
                          borderLeft: `3px solid ${isActive ? '#0071c2' : 'transparent'}`,
                          transition: 'all 0.12s',
                        }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f9fafb'; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = '#fff'; }}
                      >
                        {/* Avatar */}
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%',
                          background: isActive ? '#003580' : '#e7e7e7',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, fontSize: '0.85rem', fontWeight: 700,
                          color: isActive ? '#fff' : '#737373',
                        }}>
                          {(role === 'owner' ? conv.propertyTitle : conv.propertyTitle)?.[0]?.toUpperCase() || '?'}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                            <span style={{
                              fontWeight: 700, fontSize: '0.84rem',
                              color: isActive ? '#003580' : '#1a1a1a',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              flex: 1,
                            }}>
                              {conv.propertyTitle}
                            </span>
                            {unread > 0 && (
                              <span style={{
                                background: '#0071c2', color: '#fff',
                                fontSize: '0.62rem', fontWeight: 800,
                                padding: '1px 6px', borderRadius: 10, flexShrink: 0,
                              }}>
                                {unread}
                              </span>
                            )}
                          </div>
                          <p style={{
                            fontSize: '0.76rem', color: '#737373',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0,
                          }}>
                            {conv.lastMessage || 'No messages yet'}
                          </p>
                        </div>
                      </button>

                      {/* Actions row — on hover */}
                      <div style={{
                        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                        display: 'flex', gap: 2,
                      }} className="conv-actions">
                        {inbox === 'active' ? (
                          <button onClick={e => { e.stopPropagation(); handleArchive(conv); }}
                            title="Archive" style={S.convActionBtn}>
                            <ArchiveIcon size={13} color="#737373" />
                          </button>
                        ) : (
                          <button onClick={e => { e.stopPropagation(); handleUnarchive(conv); }}
                            title="Restore" style={S.convActionBtn}>
                            <ArchiveIcon size={13} color="#0071c2" />
                          </button>
                        )}
                        <button onClick={e => { e.stopPropagation(); handleDeleteConversation(conv); }}
                          title="Delete" style={{ ...S.convActionBtn }}>
                          <TrashIcon size={13} color="#cc0000" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── Chat pane ── */}
          {showChat && (
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>
              {!activeConv ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: '#a0a0a0', padding: 40 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessagesIcon size={28} color="#d4d4d4" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontWeight: 600, color: '#595959', fontSize: '0.95rem' }}>Select a conversation</p>
                    <p style={{ fontSize: '0.82rem', marginTop: 4 }}>Choose from your inbox to start chatting</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div style={{
                    padding: '12px 20px', borderBottom: '1px solid #e7e7e7',
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: '#fff', flexShrink: 0,
                  }}>
                    {isMobileView && (
                      <button onClick={() => setActiveConv(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px 0 0', display: 'flex', alignItems: 'center', color: '#0071c2' }}>
                        <ChevronLeftIcon size={22} color="#0071c2" />
                      </button>
                    )}
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%', background: '#003580',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0,
                    }}>
                      {activeConv.propertyTitle?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {activeConv.propertyTitle}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#737373', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#008009', display: 'inline-block' }} />
                        {role === 'owner' ? (otherUserName || 'Tenant') : (otherUserName || 'Landlord')}
                      </div>
                    </div>
                    {/* Header actions */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      {inbox === 'active' ? (
                        <button onClick={() => handleArchive(activeConv)} style={S.headerBtn} title="Archive">
                          <ArchiveIcon size={15} color="#737373" />
                          {!isMobileView && <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#595959' }}>Archive</span>}
                        </button>
                      ) : (
                        <button onClick={() => handleUnarchive(activeConv)} style={S.headerBtn} title="Restore">
                          <ArchiveIcon size={15} color="#0071c2" />
                          {!isMobileView && <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0071c2' }}>Restore</span>}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Messages area */}
                  <div style={{
                    flex: 1, overflowY: 'auto',
                    padding: '20px 24px 12px',
                    background: '#f9fafb',
                    display: 'flex', flexDirection: 'column', gap: 2,
                  }}>
                    {messages.length === 0 && (
                      <div style={{ textAlign: 'center', color: '#a0a0a0', fontSize: '0.84rem', padding: '40px 0' }}>
                        No messages yet — say hello! 👋
                      </div>
                    )}

                    {messages.map((msg, idx) => {
                      const isMine = msg.senderId === userProfile.id;
                      const prevMsg = messages[idx - 1];
                      const showDate = !prevMsg || new Date(prevMsg.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div style={{ textAlign: 'center', margin: '20px 0 14px' }}>
                              <span style={{
                                background: '#e7e7e7', padding: '3px 12px',
                                borderRadius: 20, fontSize: '0.7rem',
                                color: '#595959', fontWeight: 600, letterSpacing: '0.3px',
                              }}>
                                {new Date(msg.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          )}

                          <div
                            style={{ display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end', marginBottom: 8 }}
                            onMouseEnter={() => setHoveredMsgId(msg.id)}
                            onMouseLeave={() => setHoveredMsgId(null)}
                          >
                            {/* Avatar */}
                            <div style={{
                              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                              background: isMine ? '#003580' : '#e7e7e7',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.65rem', fontWeight: 700,
                              color: isMine ? '#fff' : '#595959',
                            }}>
                              {msg.senderName.charAt(0).toUpperCase()}
                            </div>

                            <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', gap: 3 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexDirection: isMine ? 'row-reverse' : 'row' }}>
                                {/* Bubble */}
                                <div style={{
                                  padding: '9px 14px', fontSize: '0.88rem', lineHeight: 1.5,
                                  borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                  background: isMine ? '#003580' : '#fff',
                                  color: isMine ? '#fff' : '#1a1a1a',
                                  boxShadow: isMine ? '0 1px 4px rgba(0,53,128,0.2)' : '0 1px 3px rgba(0,0,0,0.06)',
                                  border: isMine ? 'none' : '1px solid #e7e7e7',
                                  wordBreak: 'break-word',
                                }}>
                                  {msg.text}
                                </div>

                                {/* Delete button */}
                                {isMine && hoveredMsgId === msg.id && (
                                  <button
                                    onClick={e => { e.stopPropagation(); handleDeleteMessage(msg.id); }}
                                    title="Delete"
                                    style={{
                                      background: '#fff', border: '1px solid #e7e7e7', cursor: 'pointer',
                                      width: 26, height: 26, borderRadius: '50%',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      color: '#cc0000', boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                                    }}
                                  >
                                    <TrashIcon size={12} color="#cc0000" />
                                  </button>
                                )}
                              </div>

                              {/* Time */}
                              <span style={{ fontSize: '0.62rem', color: '#a0a0a0', paddingLeft: isMine ? 0 : 4, paddingRight: isMine ? 4 : 0 }}>
                                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  {inbox === 'archived' ? (
                    <div style={{ padding: '14px 20px', background: '#fafafa', borderTop: '1px solid #e7e7e7', display: 'flex', alignItems: 'center', gap: 10. }}>
                      <p style={{ fontSize: '0.82rem', color: '#737373' }}>This conversation is archived.</p>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleUnarchive(activeConv)}>Restore</button>
                    </div>
                  ) : (
                    <form onSubmit={handleSend} style={{
                      padding: '12px 16px', background: '#fff',
                      borderTop: '1px solid #e7e7e7',
                      display: 'flex', gap: 10, alignItems: 'flex-end', flexShrink: 0,
                    }}>
                      <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                        placeholder="Type a message…"
                        disabled={sending}
                        rows={1}
                        style={{
                          flex: 1, resize: 'none', border: '1.5px solid #e7e7e7',
                          borderRadius: 20, padding: '9px 16px',
                          fontFamily: 'var(--font-body)', fontSize: '0.9rem',
                          color: '#1a1a1a', outline: 'none', lineHeight: 1.5,
                          transition: 'border-color 0.15s', minHeight: 40, maxHeight: 120,
                          background: '#fafafa',
                        }}
                        onFocus={e => (e.target.style.borderColor = '#0071c2')}
                        onBlur={e => (e.target.style.borderColor = '#e7e7e7')}
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={!text.trim() || sending}
                        style={{
                          width: 40, height: 40, borderRadius: '50%', border: 'none',
                          background: text.trim() ? '#0071c2' : '#e7e7e7',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: text.trim() ? 'pointer' : 'not-allowed',
                          transition: 'all 0.15s', flexShrink: 0,
                          boxShadow: text.trim() ? '0 2px 8px rgba(0,113,194,0.3)' : 'none',
                        }}
                      >
                        <SendIcon size={16} color={text.trim() ? '#fff' : '#a0a0a0'} />
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .conv-actions { opacity: 0; transition: opacity 0.15s; }
        div:hover > .conv-actions { opacity: 1; }
      `}</style>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  convActionBtn: {
    background: '#fff', border: '1px solid #e7e7e7', cursor: 'pointer',
    width: 26, height: 26, borderRadius: 6, display: 'flex',
    alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s',
  },
  headerBtn: {
    background: '#f5f5f5', border: '1px solid #e7e7e7', borderRadius: 6,
    cursor: 'pointer', padding: '6px 12px', display: 'flex', alignItems: 'center',
    gap: 6, transition: 'all 0.15s', fontFamily: 'var(--font-body)',
  },
};