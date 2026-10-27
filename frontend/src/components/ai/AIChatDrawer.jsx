import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import {
  IconX,
  IconTrash2,
  IconShoppingCart,
  IconMic,
  IconMicOff,
  IconArrowRight,
  IconCheckCircle2,
  IconAlertCircle,
  IconExternalLink,
  IconSparkles,
  IconBot,
  IconSend,
} from '../ui/icons.jsx';

import api from '../../api/axios.js';
import { setAiDrawer, clearAiInitialQuery } from '../../features/uiSlice.js';
import { addToCart } from '../../features/cartSlice.js';
import { formatPrice, imgUrl } from '../../utils/format.js';

const QUICK_PROMPTS = [
  'What is your return window and fee?',
  'Show me earbuds under ₹5,000',
  'What warranty covers Pulse & Nova electronics?',
  'What is the free shipping threshold?',
  'Compare running shoes vs earbuds',
];

export default function AIChatDrawer() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { aiDrawerOpen, aiInitialQuery } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('fs_ai_chat');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('fs_ai_session') || '');
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const speechRecognitionRef = useRef(null);

  // Sync chat history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('fs_ai_chat', JSON.stringify(messages));
    } catch {
      // Ignore storage quota
    }
  }, [messages]);

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('fs_ai_session', sessionId);
    }
  }, [sessionId]);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Handle external query injected via props or Redux
  useEffect(() => {
    if (aiDrawerOpen && aiInitialQuery) {
      handleSendMessage(aiInitialQuery);
      dispatch(clearAiInitialQuery());
    }
  }, [aiDrawerOpen, aiInitialQuery]);

  // Focus input when opened
  useEffect(() => {
    if (aiDrawerOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [aiDrawerOpen]);

  // Clean speech recognition on unmount
  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.abort();
      }
    };
  }, []);

  const handleSendMessage = async (customPrompt) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || loading) return;

    const userMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', {
        message: textToSend,
        sessionId: sessionId || undefined,
      });

      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
      }

      const botMessage = {
        role: 'assistant',
        content: data.reply || data.response || 'I could not find an exact match, but here is what I know.',
        products: data.products || [],
        citations: data.citations || [],
        abstention: data.abstention || { abstained: false },
        intent: data.intent,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Sorry, I encountered an issue connecting to the store copilot.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ ${errMsg}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('fs_ai_chat');
    localStorage.removeItem('fs_ai_session');
    setSessionId('');
    toast.success('Conversation cleared');
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice search is not supported in this browser.');
      return;
    }

    if (isListening) {
      speechRecognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    speechRecognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast('Listening...', { icon: '🎙️' });
    };

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      handleSendMessage(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Could not detect speech.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleAddToCart = async (product) => {
    try {
      await dispatch(addToCart({ productId: product._id, quantity: 1 })).unwrap();
      toast.success(`${product.name} added to cart!`);
    } catch (err) {
      toast.error(err || 'Failed to add item to cart');
    }
  };

  return (
    <>
      {/* Floating launcher button in bottom-right corner in emerald */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          onClick={() => dispatch(setAiDrawer(true))}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group relative flex items-center gap-2.5 rounded-full bg-[#087F65] hover:bg-[#066B55] p-3.5 sm:px-5 sm:py-3.5 font-bold text-white shadow-[0_8px_24px_rgba(8,127,101,0.35)] ring-2 ring-white/60 transition-all"
          aria-label="Open Store Shopping Assistant"
        >
          <IconSparkles size={20} className="text-white" />
          <span className="hidden sm:inline font-bold tracking-wide text-sm">Store Shopping Assistant</span>
        </motion.button>
      </div>

      {/* Slide-out / Modal Drawer Panel */}
      <AnimatePresence>
        {aiDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => dispatch(setAiDrawer(false))}
              className="fixed inset-0 z-50 bg-[#202923]/40 backdrop-blur-xs"
            />

            {/* Main drawer container */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white border-l border-[#E4EAE6] text-[#202923] shadow-2xl sm:w-[480px]"
            >
              {/* Deep Emerald Header */}
              <div className="bg-[#075E4B] px-5 py-4 text-white shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-white">
                      <IconSparkles size={20} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold leading-tight">Store Shopping Assistant</h2>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#DDEBE3]">
                        <span className="h-2 w-2 rounded-full bg-[#168764]" />
                        <span className="font-medium">Online & Ready</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {messages.length > 0 && (
                      <button
                        onClick={clearChat}
                        className="rounded-lg p-2 text-[#DDEBE3] hover:bg-white/15 hover:text-white transition-colors"
                        title="Clear Conversation"
                        aria-label="Clear Conversation"
                      >
                        <IconTrash2 size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => dispatch(setAiDrawer(false))}
                      className="rounded-lg p-2 text-[#DDEBE3] hover:bg-white/15 hover:text-white transition-colors"
                      title="Close Assistant"
                      aria-label="Close Assistant"
                    >
                      <IconX size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Chat Message Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#F1F7F4]/40">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF4EF] text-[#075E4B] mb-4 shadow-sm border border-[#DDEBE3]">
                      <IconBot size={32} className="text-[#087F65]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#202923]">
                      Welcome to FlashShop Copilot
                    </h3>
                    <p className="mt-2 text-sm text-[#65716A] max-w-xs leading-relaxed">
                      Ask about products under your budget, compare specs, or get verified customer review summaries.
                    </p>

                    <div className="mt-6 w-full space-y-2 text-left">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#65716A] px-1">
                        Try asking:
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {QUICK_PROMPTS.map((prompt, i) => (
                          <button
                            key={i}
                            onClick={() => handleSendMessage(prompt)}
                            className="group flex items-center justify-between rounded-xl border border-[#E4EAE6] bg-white p-3 text-xs font-medium text-[#202923] hover:border-[#087F65] hover:bg-[#EAF4EF] hover:text-[#087F65] shadow-sm transition-all"
                          >
                            <span>{prompt}</span>
                            <IconArrowRight size={14} className="opacity-0 group-hover:opacity-100 text-[#087F65] transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      {/* Message Bubble */}
                      <div
                        className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-[#087F65] text-white rounded-tr-xs font-medium'
                            : 'bg-white text-[#202923] border border-[#E4EAE6] rounded-tl-xs'
                        }`}
                      >
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="mb-2 list-disc pl-4 space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-2 list-decimal pl-4 space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="text-[#65716A]">{children}</li>,
                            strong: ({ children }) => <strong className="font-bold text-[#075E4B]">{children}</strong>,
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                onClick={(e) => {
                                  if (href?.startsWith('product://')) {
                                    e.preventDefault();
                                    navigate(`/product/${href.replace('product://', '')}`);
                                    dispatch(setAiDrawer(false));
                                  }
                                }}
                                className="underline font-bold text-[#087F65] hover:text-[#066B55]"
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>

                      {/* Verified Citations Drawer Card */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-2.5 max-w-[95%] rounded-xl border border-[#DDEBE3] bg-[#EAF4EF] p-3 shadow-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#075E4B]">
                              <IconCheckCircle2 size={16} className="text-[#087F65]" />
                              <span>Verified Citations ({msg.citations.length})</span>
                            </div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-[#075E4B] bg-[#DDEBE3] px-2 py-0.5 rounded-full">
                              Verified Grounding
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {msg.citations.map((cite) => (
                              <div
                                key={cite.citationId}
                                className="rounded-lg border border-[#E4EAE6] bg-white p-2.5 text-xs shadow-xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-[#075E4B] flex items-center gap-1.5 line-clamp-1">
                                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#EAF4EF] text-[10px] font-black text-[#087F65] flex-shrink-0">
                                      {cite.marker?.replace(/[\[\]]/g, '') || '•'}
                                    </span>
                                    <span>{cite.title}</span>
                                  </span>
                                  {cite.url && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigate(cite.url);
                                        dispatch(setAiDrawer(false));
                                      }}
                                      className="text-[11px] font-semibold text-[#087F65] hover:underline flex items-center gap-1 flex-shrink-0"
                                      title="Open verified source document"
                                    >
                                      <span>Source</span>
                                      <IconExternalLink size={12} />
                                    </button>
                                  )}
                                </div>
                                {cite.snippet && (
                                  <p className="mt-1 text-[11px] leading-relaxed text-[#65716A] border-l-2 border-[#087F65] pl-2 italic">
                                    "{cite.snippet}"
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Abstention notice when query falls outside curated catalog */}
                      {msg.abstention?.abstained && (
                        <div className="mt-2 max-w-[90%] rounded-xl border border-[#DDEBE3] bg-[#EAF4EF] p-2.5 text-xs text-[#075E4B] flex items-center gap-2">
                          <IconAlertCircle size={16} className="text-[#087F65] flex-shrink-0" />
                          <span>Curated catalog notice: FlashShop carries select premium electronics and audio categories only.</span>
                        </div>
                      )}

                      {/* Recommended Products Container */}
                      {msg.products && msg.products.length > 0 && (
                        <div className="mt-3.5 w-full rounded-xl bg-white p-4 border border-[#E4EAE6] shadow-sm space-y-3">
                          <p className="text-xs font-bold text-[#202923] tracking-wide">
                            Recommended Products
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            {msg.products.map((p) => (
                              <div
                                key={p._id}
                                className="flex flex-col justify-between rounded-lg border border-[#E4EAE6] bg-[#F1F7F4] p-2.5 transition-all hover:border-[#087F65] shadow-xs"
                              >
                                <div>
                                  <div className="h-24 w-full rounded-md bg-white flex items-center justify-center p-2 overflow-hidden border border-[#E4EAE6]/60">
                                    <img
                                      src={imgUrl(p.images?.[0]?.url)}
                                      alt={p.name}
                                      className="h-full w-full object-contain"
                                    />
                                  </div>
                                  <button
                                    onClick={() => {
                                      navigate(`/product/${p.slug}`);
                                      dispatch(setAiDrawer(false));
                                    }}
                                    className="mt-2 text-left font-bold text-xs text-[#202923] hover:text-[#087F65] line-clamp-2 transition-colors"
                                  >
                                    {p.name}
                                  </button>
                                </div>
                                <div className="mt-2">
                                  <p className="text-xs font-bold text-[#087F65]">
                                    {formatPrice(p.price)}
                                  </p>
                                  <button
                                    onClick={() => handleAddToCart(p)}
                                    className="mt-2 w-full rounded-md bg-[#087F65] hover:bg-[#066B55] py-1.5 text-[11px] font-bold text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                                  >
                                    <IconShoppingCart size={13} /> Add to cart
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}

                {/* Thinking / loading indicator */}
                {loading && (
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#075E4B] text-white shadow-sm">
                      <IconSparkles size={16} className="text-white" />
                    </div>
                    <div className="rounded-2xl rounded-tl-xs bg-white border border-[#E4EAE6] px-4 py-3 text-xs text-[#65716A] flex items-center gap-2 shadow-xs">
                      <span className="h-2 w-2 rounded-full bg-[#087F65] animate-ping" />
                      <span>Consulting catalog & specs with Gemini...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Pill Input & Circle Arrow */}
              <div className="border-t border-[#E4EAE6] bg-white p-4">
                {/* Horizontal Quick Action Chips */}
                <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                  <button
                    onClick={() => handleSendMessage('Recommend products under ₹5,000')}
                    className="whitespace-nowrap rounded-full border border-[#E4EAE6] bg-[#F1F7F4] px-3 py-1 font-medium text-[#202923] hover:border-[#087F65] hover:bg-[#EAF4EF] hover:text-[#087F65]"
                  >
                    💰 Under ₹5,000
                  </button>
                  <button
                    onClick={() => handleSendMessage('Compare running shoes vs earbuds')}
                    className="whitespace-nowrap rounded-full border border-[#E4EAE6] bg-[#F1F7F4] px-3 py-1 font-medium text-[#202923] hover:border-[#087F65] hover:bg-[#EAF4EF] hover:text-[#087F65]"
                  >
                    ⚖️ Compare Specs
                  </button>
                  <button
                    onClick={() => handleSendMessage('What are customers saying about Nova Earbuds?')}
                    className="whitespace-nowrap rounded-full border border-[#E4EAE6] bg-[#F1F7F4] px-3 py-1 font-medium text-[#202923] hover:border-[#087F65] hover:bg-[#EAF4EF] hover:text-[#087F65]"
                  >
                    ⭐ Review Summary
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2.5"
                >
                  <div className="relative flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={isListening ? 'Listening...' : 'Ask a question or search products'}
                      disabled={loading}
                      className="w-full rounded-full border border-[#E4EAE6] bg-[#F1F7F4] px-5 py-3 pr-10 text-sm text-[#202923] placeholder-[#89938D] focus:bg-white focus:border-[#087F65] focus:outline-none focus:ring-1 focus:ring-[#087F65] disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={toggleVoiceInput}
                      className={`absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-sm ${
                        isListening ? 'text-[#B42318] animate-pulse' : 'text-[#65716A] hover:text-[#087F65]'
                      }`}
                      title={isListening ? 'Stop listening' : 'Voice search'}
                      aria-label={isListening ? 'Stop listening' : 'Voice search'}
                    >
                      {isListening ? <IconMicOff size={18} /> : <IconMic size={18} />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#087F65] hover:bg-[#066B55] text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Send query"
                    aria-label="Send query"
                  >
                    <IconSend size={18} />
                  </button>
                </form>

                <p className="mt-2 text-center text-[10px] text-[#89938D]">
                  Real-time catalog grounding • Verified prices & inventory
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
