'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { sendDM, getMyThreads, markRead } from '@/server/actions/dm';
import { formatDistanceToNow } from 'date-fns';

export default function MessagesPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [threads, setThreads] = useState<any[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch threads
  useEffect(() => {
    async function loadThreads() {
      const res = await getMyThreads();
      if (res.success && res.threads) {
        setThreads(res.threads);
      }
      setLoading(false);
    }
    loadThreads();
  }, []);

  // Fetch messages and set up SSE when active thread changes
  useEffect(() => {
    if (!activeThreadId || !userId) return;

    // Load initial messages
    async function loadMessages() {
      try {
        const res = await fetch(`/api/dm/${activeThreadId}`);
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
          scrollToBottom();
          // Mark as read
          await markRead(activeThreadId!);
          setThreads(prev => prev.map(t => t.id === activeThreadId ? { ...t, unreadCount: 0 } : t));
        }
      } catch (e) {
        console.error('Failed to load messages', e);
      }
    }
    loadMessages();

    // Set up SSE
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`/api/sse/dm/${activeThreadId}`);
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'dm' && data.data) {
          const msg = data.data;
          setMessages((prev) => {
            if (prev.find((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          scrollToBottom();
          
          // If we receive a message while viewing, mark it read immediately
          if (msg.senderId !== userId) {
            markRead(activeThreadId);
          }
        }
      } catch (e) {}
    };

    eventSourceRef.current = es;

    return () => {
      es.close();
    };
  }, [activeThreadId, userId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeThreadId) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage(''); // optimistic clear
    
    try {
      const res = await fetch(`/api/dm/${activeThreadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed to send');
      
      // Update thread list to bubble this thread up
      setThreads(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(t => t.id === activeThreadId);
        if (idx > -1) {
          const t = updated.splice(idx, 1)[0];
          t.lastMessageAt = new Date().toISOString();
          t.messages = [{ content, sender: { id: userId, name: session?.user?.name } }];
          updated.unshift(t);
        }
        return updated;
      });
    } catch (e) {
      console.error(e);
      setNewMessage(content); // restore on fail
    } finally {
      setSending(false);
    }
  };

  const activeThread = threads.find(t => t.id === activeThreadId);

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] animate-fade-in-up">
      <div className="surface-glass rounded-2xl border border-white/10 h-full flex overflow-hidden shadow-2xl">
        
        {/* Sidebar - Threads */}
        <div className="w-full md:w-80 border-r border-white/10 flex flex-col bg-surface-base/50">
          <div className="p-4 border-b border-white/10">
            <h2 className="font-display-xl text-xl font-extrabold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">chat</span>
              Messages
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 flex justify-center">
                <span className="material-symbols-outlined animate-spin text-primary">refresh</span>
              </div>
            ) : threads.length === 0 ? (
              <div className="p-6 text-center text-text-muted font-body-sm">
                No messages yet. Start a conversation with someone who follows you!
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {threads.map((thread) => {
                  const other = thread.otherParticipant;
                  const lastMsg = thread.messages?.[0];
                  const isActive = thread.id === activeThreadId;
                  
                  return (
                    <button
                      key={thread.id}
                      onClick={() => setActiveThreadId(thread.id)}
                      className={`w-full p-4 flex items-start gap-3 text-left transition-colors hover:bg-surface-variant/30 ${
                        isActive ? 'bg-primary/10 border-l-2 border-primary' : 'border-l-2 border-transparent'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden relative bg-surface-3 flex-shrink-0">
                        {other?.image ? (
                          <Image src={other.image} alt={other.name || ''} fill sizes="40px" className="object-cover" />
                        ) : (
                          <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-text-muted">person</span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-semibold text-sm text-text-base truncate">{other?.name || 'Unknown'}</span>
                          {thread.lastMessageAt && (
                            <span className="text-[10px] text-text-muted whitespace-nowrap ml-2">
                              {formatDistanceToNow(new Date(thread.lastMessageAt), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <p className={`text-xs truncate ${thread.unreadCount > 0 ? 'text-text-base font-medium' : 'text-text-muted'}`}>
                            {lastMsg ? (lastMsg.senderId === userId ? `You: ${lastMsg.content}` : lastMsg.content) : 'No messages'}
                          </p>
                          {thread.unreadCount > 0 && (
                            <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2">
                              {thread.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Main Area - Chat */}
        <div className={`flex-1 flex flex-col ${!activeThreadId ? 'hidden md:flex' : 'flex'}`}>
          {!activeThreadId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-text-muted p-6">
              <div className="w-20 h-20 rounded-full bg-surface-2 flex items-center justify-center mb-4 border border-white/5 shadow-inner">
                <span className="material-symbols-outlined text-4xl text-primary/50">forum</span>
              </div>
              <h3 className="text-xl font-headline-md font-bold text-text-base mb-2">Your Messages</h3>
              <p className="text-center max-w-sm">Select a conversation from the sidebar or find a user's profile to start a new chat.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-surface-base/80 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveThreadId(null)} className="md:hidden p-2 rounded-lg hover:bg-surface-3 mr-1">
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <Link href={`/profile/${activeThread.otherParticipant.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="w-10 h-10 rounded-full overflow-hidden relative bg-surface-3">
                      {activeThread.otherParticipant.image ? (
                        <Image src={activeThread.otherParticipant.image} alt="" fill sizes="40px" className="object-cover" />
                      ) : (
                        <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center">person</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-text-base">{activeThread.otherParticipant.name || 'Unknown'}</h3>
                      <p className="text-xs text-primary/80 font-label-mono">@{activeThread.otherParticipant.username}</p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-text-muted text-sm">
                    This is the beginning of your conversation.
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.senderId === userId;
                    const showHeader = i === 0 || messages[i-1].senderId !== msg.senderId || (new Date(msg.createdAt).getTime() - new Date(messages[i-1].createdAt).getTime() > 5 * 60000);
                    
                    return (
                      <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {showHeader && (
                          <div className="text-[10px] font-label-mono text-text-muted mb-1 mt-2">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                        <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                          isMe 
                            ? 'bg-primary text-white rounded-br-sm shadow-glow-primary/20' 
                            : 'bg-surface-3 text-text-base rounded-bl-sm border border-white/5'
                        }`}>
                          <p className="whitespace-pre-wrap break-words text-sm">{msg.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-white/10 bg-surface-base/80 backdrop-blur-sm">
                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Type a message..."
                      className="w-full bg-surface-2 border border-white/10 rounded-xl pl-4 pr-4 py-3 text-sm text-text-base focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none max-h-32 min-h-[44px]"
                      rows={1}
                      disabled={sending}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="h-[44px] w-[44px] rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-all shadow-glow-primary shrink-0"
                  >
                    <span className="material-symbols-outlined text-[20px]">{sending ? 'hourglass_empty' : 'send'}</span>
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
        
      </div>
    </div>
  );
}
