import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/Layout';

interface Message {
  _id?: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const suggestedPrompts = [
    { emoji: '💪', text: 'Give me a quick 15-min home workout' },
    { emoji: '🍽️', text: 'Suggest a high-protein meal for lunch' },
    { emoji: '😴', text: 'I slept poorly last night, what should I do?' },
    { emoji: '🔥', text: 'I feel lazy today, motivate me!' },
    { emoji: '💧', text: 'How much water should I drink daily?' },
    { emoji: '🍕', text: "I want to eat pizza but I'm on a diet" },
  ];

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') fetchHistory();
  }, [status, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/chat?sessionId=default&limit=50');
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || sending) return;

    const userMessage: Message = {
      role: 'user',
      content: messageText,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, sessionId: 'default' }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [...prev, data.message]);
      } else {
        toast.error(data.message || 'Aura is having trouble right now');
        setMessages((prev) => prev.slice(0, -1));
      }
    } catch (error) {
      toast.error('Network error');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = async () => {
    if (!confirm('Clear all chat history? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/chat?sessionId=default', { method: 'DELETE' });
      if (res.ok) {
        setMessages([]);
        toast.success('Chat cleared');
      }
    } catch (error) {
      toast.error('Error clearing chat');
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (status === 'loading' || loading) {
    return (
      <Layout title="Chat with Aura">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: '20px' }}>
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ fontSize: '4rem' }}
          >
            🤖
          </motion.div>
          <p style={{ opacity: 0.7 }}>Waking up Aura...</p>
        </div>
      </Layout>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <Layout title="Chat with Aura - FitVerse AI">
      <section style={{ paddingTop: '100px', paddingBottom: '40px' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    '0 0 0 0 rgba(34,197,94,0.4)',
                    '0 0 0 12px rgba(34,197,94,0)',
                    '0 0 0 0 rgba(34,197,94,0)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #22C55E, #10B981)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  flexShrink: 0,
                }}
              >
                🤖
              </motion.div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>Aura</h1>
                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#22C55E',
                    display: 'inline-block',
                  }} />
                  Your AI Health Companion
                </p>
              </div>
            </div>

            <button
              onClick={clearChat}
              className="btn-outline"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              🗑 Clear Chat
            </button>
          </motion.div>

          {/* Chat Container */}
          <div
            className="glass"
            style={{
              padding: '0',
              borderRadius: '24px',
              height: 'calc(100vh - 300px)',
              minHeight: '450px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Messages Area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ textAlign: 'center', padding: '40px 20px', margin: 'auto' }}
                >
                  <motion.div
                    animate={{ y: [0, -12, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    style={{ fontSize: '5rem', marginBottom: '16px' }}
                  >
                    👋
                  </motion.div>
                  <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>
                    Hi {session?.user?.name?.split(' ')[0] || 'there'}!
                  </h2>
                  <p style={{ opacity: 0.7, marginBottom: '24px', maxWidth: '450px', margin: '0 auto 24px' }}>
                    I'm Aura, your all-in-one AI companion. Friend, trainer, nutritionist, motivator — what's on your mind today?
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '650px', margin: '0 auto' }}>
                    {suggestedPrompts.map((p, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => sendMessage(p.text)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '20px',
                          border: '1px solid rgba(34,197,94,0.25)',
                          background: 'rgba(34,197,94,0.05)',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>{p.emoji}</span>
                        {p.text}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={msg._id || `msg-${i}`}
                    initial={{ opacity: 0, y: 15, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '80%',
                        display: 'flex',
                        gap: '10px',
                        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          flexShrink: 0,
                          background:
                            msg.role === 'user'
                              ? 'linear-gradient(135deg, #3B82F6, #2563EB)'
                              : 'linear-gradient(135deg, #22C55E, #10B981)',
                          color: 'white',
                          fontWeight: '600',
                        }}
                      >
                        {msg.role === 'user' ? (session?.user?.name?.charAt(0)?.toUpperCase() || 'U') : '🤖'}
                      </div>

                      <div>
                        <div
                          style={{
                            padding: '12px 16px',
                            borderRadius:
                              msg.role === 'user'
                                ? '18px 18px 4px 18px'
                                : '18px 18px 18px 4px',
                            background:
                              msg.role === 'user'
                                ? 'linear-gradient(135deg, #3B82F6, #2563EB)'
                                : 'rgba(0,0,0,0.05)',
                            color: msg.role === 'user' ? 'white' : 'inherit',
                            fontSize: '0.95rem',
                            lineHeight: '1.5',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {msg.content}
                        </div>
                        <p
                          style={{
                            fontSize: '0.7rem',
                            opacity: 0.5,
                            margin: '4px 8px 0',
                            textAlign: msg.role === 'user' ? 'right' : 'left',
                          }}
                        >
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <AnimatePresence>
                {sending && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #22C55E, #10B981)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        flexShrink: 0,
                      }}
                    >
                      🤖
                    </div>
                    <div
                      style={{
                        padding: '14px 20px',
                        borderRadius: '18px 18px 18px 4px',
                        background: 'rgba(0,0,0,0.05)',
                        display: 'flex',
                        gap: '6px',
                        alignItems: 'center',
                      }}
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#22C55E',
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div
              style={{
                borderTop: '1px solid rgba(0,0,0,0.08)',
                padding: '16px 20px',
                background: 'rgba(255,255,255,0.3)',
              }}
            >
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Aura anything..."
                  rows={1}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '20px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    background: 'rgba(255,255,255,0.7)',
                    fontSize: '0.95rem',
                    resize: 'none',
                    fontFamily: 'inherit',
                    maxHeight: '120px',
                    minHeight: '46px',
                    outline: 'none',
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendMessage()}
                  disabled={sending || !input.trim()}
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    border: 'none',
                    background:
                      sending || !input.trim()
                        ? 'rgba(0,0,0,0.1)'
                        : 'linear-gradient(135deg, #22C55E, #10B981)',
                    color: 'white',
                    cursor: sending || !input.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    flexShrink: 0,
                  }}
                >
                  {sending ? '⏳' : '➤'}
                </motion.button>
              </div>
              <p style={{ fontSize: '0.7rem', opacity: 0.5, margin: '8px 4px 0' }}>
                💡 Aura is an AI assistant and not a medical professional.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}