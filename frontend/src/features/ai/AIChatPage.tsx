/**
 * Aegis AI – AI Clinical Assistant Page
 *
 * Intelligent medical assistant for clinical triage guidance, symptoms explanation, and platform queries.
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Bot,
  Send,
  User,
  RotateCcw,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { useAppSelector } from '@/store';
import { aiAPI } from '@/api/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isEmergency?: boolean;
  isError?: boolean;
}

const SUGGESTED_PROMPTS = [
  'What should I do for acute chest pain?',
  'What are the key clinical signs of a stroke?',
  'How can I find the nearest emergency hospital?',
  'How does the Aegis Emergency SOS dispatch work?',
];

export default function AIChatPage() {
  const { user } = useAppSelector((state) => state.auth);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello ${
        user?.full_name || 'there'
      }! I am Aegis, your AI clinical assistant. How can I assist with your health queries or emergency questions today?`,
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ============================================================
     SCROLL
     ============================================================ */

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  /* ============================================================
     TEXTAREA AUTO HEIGHT
     ============================================================ */

  useEffect(() => {
    if (!textareaRef.current) return;

    textareaRef.current.style.height = 'auto';

    const nextHeight = Math.min(
      textareaRef.current.scrollHeight,
      140
    );

    textareaRef.current.style.height = `${nextHeight}px`;
  }, [input]);

  /* ============================================================
     SEND MESSAGE
     ============================================================ */

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!input.trim() || isTyping) return;

    const userText = input.trim();

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await aiAPI.chat({
        message: userText,
      });

      const aiContent =
        response.data?.data?.reply ||
        "I didn't receive a valid response from the clinical model.";

      const isEmergency =
        aiContent.includes('CRITICAL:') ||
        aiContent.includes('EMERGENCY:') ||
        aiContent.includes('IMMEDIATE MEDICAL ATTENTION');

      const aiMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: aiContent,
        timestamp: new Date(),
        isEmergency,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('Failed to get AI response:', error);

      let errorContent =
        'The clinical assistant is temporarily unavailable. Please try again or utilize the Emergency SOS page if you need urgent care.';

      if (
        error?.response?.data?.detail?.includes(
          'OpenAI API key'
        )
      ) {
        errorContent =
          'The AI service is not configured correctly on the server. Please contact your system administrator.';
      }

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  /* ============================================================
     KEYBOARD
     ============================================================ */

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ============================================================
     SUGGESTED PROMPT
     ============================================================ */

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);

    window.setTimeout(() => {
      textareaRef.current?.focus();
    }, 20);
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto h-[calc(100vh-var(--navbar-height)-42px)] min-h-[500px] overflow-hidden">
      {/* ========================================================
          PAGE HEADER
          ======================================================== */}
      <div className="flex items-center justify-between gap-4 mb-3 flex-shrink-0 pb-2 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex-shrink-0 shadow-xs">
            <Activity size={22} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[var(--text-primary)] leading-tight">
                AI Clinical Assistant
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Assistant Ready
              </span>
            </div>

            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Decision support, clinical triage suggestions, and platform assistance
            </p>
          </div>
        </div>

        {messages.length > 1 && (
          <button
            type="button"
            onClick={() =>
              setMessages([
                {
                  id: '1',
                  role: 'assistant',
                  content: `Hello ${
                    user?.full_name || 'there'
                  }! How can I assist with your health queries today?`,
                  timestamp: new Date(),
                },
              ])
            }
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <RotateCcw size={13} />
            <span>Reset Chat</span>
          </button>
        )}
      </div>

      {/* ========================================================
          CHAT CARD
          ======================================================== */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
        {/* ======================================================
            MESSAGE AREA
            ====================================================== */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-5">
          {/* ====================================================
              WELCOME / SUGGESTIONS
              ==================================================== */}
          {messages.length === 1 && (
            <div className="text-center my-4 max-w-xl mx-auto space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                <Bot size={28} />
              </div>

              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  How can I assist your clinical workflow?
                </h2>

                <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                  Ask regarding emergency first aid protocols, triage evaluations, or system capabilities.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSuggestedPrompt(prompt)}
                    className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:border-blue-500/40 hover:bg-[var(--bg-hover)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all shadow-2xs text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ====================================================
              MESSAGES LIST
              ==================================================== */}
          <div className="space-y-4 w-full">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`flex items-start gap-2.5 w-full ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* AI AVATAR */}
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      <Bot size={17} />
                    </div>
                  )}

                  {/* MESSAGE BODY */}
                  <div
                    className={`flex flex-col min-w-0 max-w-[85%] sm:max-w-[78%] ${
                      isUser ? 'items-end' : 'items-start'
                    }`}
                  >
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] mb-1 px-1">
                      {isUser ? user?.full_name || 'You' : 'Aegis Clinical AI'}
                    </span>

                    <div
                      className={`p-3.5 sm:p-4 rounded-2xl text-sm leading-relaxed break-words overflow-hidden shadow-xs ${
                        isUser
                          ? 'bg-[var(--primary-600)] text-white rounded-tr-xs'
                          : msg.isError
                          ? 'bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 rounded-tl-xs'
                          : msg.isEmergency
                          ? 'bg-rose-500/10 border-2 border-rose-500/40 text-[var(--text-primary)] rounded-tl-xs'
                          : 'bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-tl-xs'
                      }`}
                    >
                      {/* EMERGENCY ALERT BADGE */}
                      {msg.isEmergency && !msg.isError && (
                        <div className="inline-flex items-center gap-1.5 mb-2.5 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">
                          <AlertTriangle size={14} />
                          <span>Critical Emergency Guidance</span>
                        </div>
                      )}

                      {/* ERROR ALERT BADGE */}
                      {msg.isError && (
                        <div className="inline-flex items-center gap-1.5 mb-2 text-rose-600 dark:text-rose-400 text-xs font-bold">
                          <AlertTriangle size={14} />
                          <span>Service Notice</span>
                        </div>
                      )}

                      {isUser ? (
                        <div className="whitespace-pre-wrap font-normal">
                          {msg.content}
                        </div>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-inherit text-[13.5px]">
                          <ReactMarkdown
                            components={{
                              p: ({ node: _node, ...props }) => (
                                <p className="mb-2 last:mb-0 leading-relaxed" {...props} />
                              ),
                              ul: ({ node: _node, ...props }) => (
                                <ul className="list-disc ml-5 mb-2 space-y-1" {...props} />
                              ),
                              ol: ({ node: _node, ...props }) => (
                                <ol className="list-decimal ml-5 mb-2 space-y-1" {...props} />
                              ),
                              li: ({ node: _node, ...props }) => (
                                <li className="leading-snug" {...props} />
                              ),
                              h1: ({ node: _node, ...props }) => (
                                <h1 className="text-base font-bold mb-2 text-[var(--text-primary)]" {...props} />
                              ),
                              h2: ({ node: _node, ...props }) => (
                                <h2 className="text-sm font-bold mb-1.5 text-[var(--text-primary)]" {...props} />
                              ),
                              h3: ({ node: _node, ...props }) => (
                                <h3 className="text-xs font-bold mb-1 text-[var(--text-primary)] uppercase tracking-wide" {...props} />
                              ),
                              strong: ({ node: _node, ...props }) => (
                                <strong className="font-bold text-[var(--text-primary)]" {...props} />
                              ),
                              code: ({ node: _node, inline, children, ...props }: any) => {
                                if (inline) {
                                  return (
                                    <code className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] font-mono text-xs text-[var(--primary-500)]" {...props}>
                                      {children}
                                    </code>
                                  );
                                }
                                return (
                                  <div className="p-3 my-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-x-auto font-mono text-xs">
                                    <code {...props}>{children}</code>
                                  </div>
                                );
                              },
                              blockquote: ({ node: _node, ...props }) => (
                                <blockquote className="pl-3 border-l-2 border-[var(--primary-500)] my-2 text-[var(--text-muted)] italic" {...props} />
                              ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] text-[var(--text-muted)] mt-1 px-1">
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* USER AVATAR */}
                  {isUser && (
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 bg-[var(--primary-600)] text-white shadow-xs">
                      <User size={16} />
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/* TYPING INDICATOR */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5"
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Bot size={17} />
                </div>

                <div className="flex flex-col items-start">
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] mb-1 px-1">
                    Aegis Clinical AI
                  </span>

                  <div className="p-3.5 rounded-2xl rounded-tl-xs bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center gap-2 text-xs text-[var(--text-muted)] font-medium">
                    <div className="flex gap-1">
                      {[0, 0.2, 0.4].map((delay, index) => (
                        <motion.span
                          key={index}
                          className="w-1.5 h-1.5 rounded-full bg-[var(--primary-500)]"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ repeat: Infinity, duration: 0.9, delay }}
                        />
                      ))}
                    </div>
                    <span>Analyzing clinical query...</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} className="h-2" />
          </div>
        </div>

        {/* ========================================================
            COMPOSER INPUT
            ======================================================== */}
        <div className="p-3 sm:p-4 bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
          <form onSubmit={handleSend} className="flex gap-2 items-end">
            <div className="relative flex-1 min-w-0 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl focus-within:ring-2 focus-within:ring-[var(--primary-500)]/20 focus-within:border-[var(--primary-500)] transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about symptoms, emergency procedures, or platform queries..."
                rows={1}
                disabled={isTyping}
                className="block w-full py-2.5 pl-3.5 pr-12 rounded-xl bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm outline-none resize-none overflow-y-auto leading-relaxed"
              />

              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                title="Send query"
                aria-label="Send message"
                className="absolute right-1.5 bottom-1.5 w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--primary-600)] text-white hover:bg-[var(--primary-500)] disabled:opacity-40 disabled:hover:bg-[var(--primary-600)] disabled:cursor-not-allowed transition-all shadow-xs"
              >
                <Send size={14} />
              </button>
            </div>
          </form>

          <p className="text-[11px] text-center text-[var(--text-muted)] mt-2">
            Aegis AI offers automated clinical guidance and triage support. In active life hazards, trigger <strong className="text-rose-600 dark:text-rose-400 font-semibold">Emergency SOS</strong> immediately.
          </p>
        </div>
      </div>
    </div>
  );
}