import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import {
  FiX,
  FiTrash2,
  FiShoppingBag,
  FiMic,
  FiMicOff,
  FiStar,
  FiArrowRight,
  FiArrowUpRight,
  FiCheck,
  FiExternalLink,
} from 'react-icons/fi';
import { BsStars, BsRobot } from 'react-icons/bs';

import api from '../../api/axios.js';
import { setAiDrawer, clearAiInitialQuery } from '../../features/uiSlice.js';
import { addToCart } from '../../features/cartSlice.js';
import { formatPrice, imgUrl } from '../../utils/format.js';

const QUICK_PROMPTS = [
  'Show me earbuds under ₹5,000',
  'Compare running shoes & sneakers',
  'Summarize customer reviews for Nova Earbuds',
  'Smartwatches with AMOLED & GPS',
  'Best memory foam pillows for neck pain',
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

  // Auto-scroll on new messages
  useEffect(() => {
    if (aiDrawerOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, aiDrawerOpen]);

  // Persist messages to local storage
  useEffect(() => {
    try {
      localStorage.setItem('fs_ai_chat', JSON.stringify(messages.slice(-30)));
    } catch {
      /* ignore */
    }
  }, [messages]);

  // Handle initial queries triggered from buttons across the site
  useEffect(() => {
    if (aiDrawerOpen && aiInitialQuery) {
      handleSendMessage(aiInitialQuery);
      dispatch(clearAiInitialQuery());
    }
  }, [aiDrawerOpen, aiInitialQuery]);

  // Focus input when drawer opens
  useEffect(() => {
    if (aiDrawerOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [aiDrawerOpen]);

  // Setup Web Speech API for voice assistant input
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast.error('Could not detect voice. Please try again.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!speechRecognitionRef.current) {
      toast.error('Voice input is not supported in this browser');
      return;
    }
    if (isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        speechRecognitionRef.current.start();
        setIsListening(true);
        toast('Listening for product query...', { icon: '🎙️' });
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    setInput('');
    const userMsg = { role: 'user', content: query, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', {
        message: query,
        sessionId: sessionId || undefined,
        history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      });

      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem('fs_ai_session', data.sessionId);
      }

      const botMsg = {
        role: 'assistant',
        content: data.reply,
        products: data.products || [],
        intent: data.intent,
        budgetDetected: data.budgetDetected,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      toast.error(err.message || 'Assistant temporarily unavailable');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Here are the strongest matches from our FlashShop catalog. You can compare variants, add to cart, or ask a follow-up.',
          products: [],
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    setMessages([]);
    localStorage.removeItem('fs_ai_chat');
    if (user) {
      await api.delete('/ai/history').catch(() => {});
    }
    toast.success('Conversation cleared');
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
      {/* Floating launcher button in bottom-right corner */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          onClick={() => dispatch(setAiDrawer(true))}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group relative flex items-center gap-2.5 rounded-full bg-[#703080] hover:bg-[#5b1e6d] p-3.5 sm:px-5 sm:py-3.5 font-bold text-white shadow-xl shadow-purple-950/40 ring-2 ring-white/20 transition-all hover:shadow-purple-700/40"
          aria-label="Open Store Shopping Assistant"
        >
          {/* Animated subtle halo */}
          <span className="absolute -inset-1 -z-10 animate-pulse rounded-full bg-purple-600 opacity-60 blur-md group-hover:opacity-100" />
          <BsStars className="text-xl sm:text-lg text-amber-300" />
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
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm sm:bg-black/40"
            />

            {/* Main drawer container */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-2xl sm:w-[480px]"
            >
              {/* Purple Header matching user screenshot */}
              <div className="bg-[#703080] px-5 py-4 text-white shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-amber-300">
                      <BsStars className="text-xl" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold leading-tight">Store Shopping Assistant</h2>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-purple-200">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-medium">Online & Ready</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {messages.length > 0 && (
                      <button
                        onClick={clearChat}
                        className="rounded-lg p-2 text-purple-200 hover:bg-white/15 hover:text-white transition-colors"
                        title="Clear Conversation"
                      >
                        <FiTrash2 className="text-lg" />
                      </button>
                    )}
                    <button
                      onClick={() => dispatch(setAiDrawer(false))}
                      className="rounded-lg p-2 text-purple-200 hover:bg-white/15 hover:text-white transition-colors"
                      title="Close Assistant"
                    >
                      <FiX className="text-xl" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Chat Message Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/60 dark:bg-slate-950/60">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-950/40 text-[#703080] dark:text-purple-300 mb-4 shadow-sm border border-purple-200 dark:border-purple-800">
                      <BsStars className="text-3xl text-amber-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Welcome to FlashShop Copilot
                    </h3>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                      Ask about products under your budget, compare specs, or get verified customer review summaries.
                    </p>

                    <div className="mt-6 w-full space-y-2 text-left">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                        Try asking:
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {QUICK_PROMPTS.map((prompt, i) => (
                          <button
                            key={i}
                            onClick={() => handleSendMessage(prompt)}
                            className="group flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 p-3 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-[#703080] hover:text-[#703080] dark:hover:text-purple-300 shadow-sm transition-all"
                          >
                            <span>{prompt}</span>
                            <FiArrowUpRight className="opacity-0 group-hover:opacity-100 text-[#703080] dark:text-purple-400 text-sm transition-opacity" />
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
                            ? 'bg-[#703080] text-white rounded-tr-xs font-medium'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-xs'
                        }`}
                      >
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="mb-2 list-disc pl-4 space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-2 list-decimal pl-4 space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="text-slate-600 dark:text-slate-300">{children}</li>,
                            strong: ({ children }) => <strong className="font-bold text-[#703080] dark:text-purple-300">{children}</strong>,
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
                                className="underline font-bold text-[#703080] dark:text-amber-300 hover:opacity-80"
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>

                      {/* Recommended Products Container (matches user screenshot) */}
                      {msg.products && msg.products.length > 0 && (
                        <div className="mt-3.5 w-full rounded-2xl bg-white dark:bg-slate-850 p-4 border border-slate-200 dark:border-slate-750 shadow-sm space-y-3">
                          <p className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">
                            Recommended Products
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            {msg.products.map((p) => (
                              <div
                                key={p._id}
                                className="flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/80 dark:bg-slate-800/50 p-2.5 transition-all hover:border-[#703080]/60 shadow-xs"
                              >
                                <div>
                                  {/* Soft pastel image container */}
                                  <div className="h-28 w-full rounded-xl bg-[#edf2f7] dark:bg-slate-800 flex items-center justify-center p-2 overflow-hidden">
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
                                    className="mt-2 text-left font-bold text-xs text-slate-900 dark:text-white hover:text-[#703080] dark:hover:text-purple-300 line-clamp-2 transition-colors"
                                  >
                                    {p.name}
                                  </button>
                                </div>

                                <div className="mt-2">
                                  <p className="text-xs font-black text-[#703080] dark:text-purple-300">
                                    {formatPrice(p.price)}
                                  </p>
                                  <button
                                    onClick={() => handleAddToCart(p)}
                                    className="mt-2 w-full rounded-lg bg-[#703080] hover:bg-[#5b1e6d] py-1.5 text-[11px] font-bold text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                                  >
                                    <FiShoppingBag className="text-xs" /> Add to cart
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
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#703080] text-white shadow-sm">
                      <BsStars className="text-sm text-amber-300" />
                    </div>
                    <div className="rounded-2xl rounded-tl-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 text-xs text-slate-500 dark:text-slate-300 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-purple-600 animate-ping" />
                      <span>Consulting catalog & specs with Gemini...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Pill Input & Purple Circle Arrow */}
              <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                {/* Horizontal Quick Action Chips */}
                <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                  <button
                    onClick={() => handleSendMessage('Recommend products under ₹5,000')}
                    className="whitespace-nowrap rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-1 font-medium text-slate-700 dark:text-slate-300 hover:border-[#703080]"
                  >
                    💰 Under ₹5,000
                  </button>
                  <button
                    onClick={() => handleSendMessage('Compare running shoes vs earbuds')}
                    className="whitespace-nowrap rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-1 font-medium text-slate-700 dark:text-slate-300 hover:border-[#703080]"
                  >
                    ⚖️ Compare Specs
                  </button>
                  <button
                    onClick={() => handleSendMessage('What are customers saying about Nova Earbuds?')}
                    className="whitespace-nowrap rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-1 font-medium text-slate-700 dark:text-slate-300 hover:border-[#703080]"
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
                      className="w-full rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 py-3 pr-10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#703080] focus:outline-none focus:ring-1 focus:ring-[#703080] disabled:opacity-50 shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={toggleVoiceInput}
                      className={`absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-sm ${
                        isListening ? 'text-rose-500 animate-pulse' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                      }`}
                      title={isListening ? 'Stop listening' : 'Voice search'}
                    >
                      {isListening ? <FiMicOff /> : <FiMic />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#703080] hover:bg-[#5b1e6d] text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Send query"
                  >
                    <FiArrowUpRight className="text-xl" />
                  </button>
                </form>

                <p className="mt-2 text-center text-[10px] text-slate-400">
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
