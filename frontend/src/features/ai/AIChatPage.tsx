/**
 * Aegis AI – AI Chat Assistant Page
 *
 * Intelligent chatbot for health queries and emergency guidance.
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Bot,
  Send,
  User,
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
  'What should I do for chest pain?',
  'What are the signs of a stroke?',
  'How can I find the nearest hospital?',
  'How does Emergency SOS work?',
];

export default function AIChatPage() {
  const { user } = useAppSelector((state) => state.auth);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello ${
        user?.full_name || 'there'
      }! I am Aegis, your AI medical assistant. How can I help you today?`,
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
      160
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
        "I didn't receive a valid response.";

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
        'The AI service is temporarily unavailable. Please try again later or contact support.';

      if (
        error?.response?.data?.detail?.includes(
          'OpenAI API key'
        )
      ) {
        errorContent =
          'The AI service is not configured correctly on the server. Please contact the administrator.';
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

  /* ============================================================
     COLORS
     Explicit colors are used for message bubbles so they do not
     disappear because of missing CSS variables.
     ============================================================ */

  const USER_BUBBLE = '#2563eb';
  const USER_BUBBLE_BORDER = 'rgba(96, 165, 250, 0.45)';

  const AI_BUBBLE = '#111c31';
  const AI_BUBBLE_BORDER = 'rgba(71, 85, 105, 0.55)';

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '980px',
        height:
          'calc(100vh - var(--navbar-height) - 48px)',
        minHeight: '520px',
        margin: '0 auto',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* ========================================================
          PAGE HEADER
          ======================================================== */}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginBottom: '16px',
          flexShrink: 0,
        }}
      >
        {/* AI Icon */}

        <div
          style={{
            width: '50px',
            height: '50px',
            flexShrink: 0,
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              'linear-gradient(135deg, rgba(37,99,235,0.20), rgba(14,165,233,0.10))',
            border:
              '1px solid rgba(59,130,246,0.22)',
            color: '#38bdf8',
            boxShadow:
              '0 8px 24px rgba(37,99,235,0.12)',
          }}
        >
          <Activity size={25} strokeWidth={2} />
        </div>

        <div
          style={{
            minWidth: 0,
          }}
        >
          <h1
            style={{
              margin: 0,
              color: 'var(--text-primary)',
              fontSize: '1.4rem',
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}
          >
            Aegis AI
          </h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              marginTop: '5px',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                flexShrink: 0,
                borderRadius: '50%',
                background: '#10b981',
                boxShadow:
                  '0 0 10px rgba(16,185,129,0.55)',
              }}
            />

            <span>
              Your Emergency Healthcare Assistant
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          CHAT CARD
          ======================================================== */}

      <div
        style={{
          flex: '1 1 0',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '20px',
          background:
            'linear-gradient(180deg, rgba(9,18,34,0.98), rgba(6,13,26,0.98))',
          border:
            '1px solid rgba(51,65,85,0.75)',
          boxShadow:
            '0 20px 50px rgba(0,0,0,0.20)',
        }}
      >
        {/* ======================================================
            MESSAGE AREA
            ====================================================== */}

        <div
          style={{
            flex: '1 1 0',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '24px',
            scrollbarWidth: 'thin',
            boxSizing: 'border-box',
          }}
        >
          {/* ====================================================
              WELCOME SCREEN
              ==================================================== */}

          {messages.length === 1 && (
            <div
              style={{
                textAlign: 'center',
                marginTop: '8px',
                marginBottom: '34px',
              }}
            >
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  margin: '0 auto 18px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background:
                    'rgba(37,99,235,0.12)',
                  border:
                    '1px solid rgba(59,130,246,0.22)',
                  color: '#60a5fa',
                }}
              >
                <Bot size={34} />
              </div>

              <h2
                style={{
                  margin: '0 0 8px',
                  color: 'var(--text-primary)',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                }}
              >
                How can I help you today?
              </h2>

              <p
                style={{
                  maxWidth: '430px',
                  margin: '0 auto 24px',
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                }}
              >
                I can provide guidance on symptoms, first
                aid, or help you navigate the Aegis
                platform.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '10px',
                  maxWidth: '650px',
                  margin: '0 auto',
                }}
              >
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() =>
                      handleSuggestedPrompt(prompt)
                    }
                    style={{
                      padding: '13px 15px',
                      borderRadius: '12px',
                      border:
                        '1px solid rgba(51,65,85,0.8)',
                      background:
                        'rgba(15,27,47,0.9)',
                      color: '#a8bdd8',
                      textAlign: 'left',
                      fontSize: '0.84rem',
                      lineHeight: 1.45,
                      cursor: 'pointer',
                      transition:
                        'all 160ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        'rgba(37,99,235,0.14)';
                      e.currentTarget.style.borderColor =
                        'rgba(59,130,246,0.45)';
                      e.currentTarget.style.color =
                        '#e5f0ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        'rgba(15,27,47,0.9)';
                      e.currentTarget.style.borderColor =
                        'rgba(51,65,85,0.8)';
                      e.currentTarget.style.color =
                        '#a8bdd8';
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ====================================================
              MESSAGES
              ==================================================== */}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '22px',
              width: '100%',
            }}
          >
            {messages.map((msg) => {
              const isUser = msg.role === 'user';

              return (
                <motion.div
                  key={msg.id}
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                  style={{
                    display: 'flex',
                    width: '100%',
                    minWidth: 0,
                    gap: '10px',
                    alignItems: 'flex-start',
                    justifyContent: isUser
                      ? 'flex-end'
                      : 'flex-start',
                  }}
                >
                  {/* =================================================
                      AI AVATAR
                      ================================================= */}

                  {!isUser && (
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        flexShrink: 0,
                        marginTop: '20px',
                        borderRadius: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background:
                          'linear-gradient(135deg, #2563eb, #3b82f6)',
                        color: '#ffffff',
                        boxShadow:
                          '0 5px 18px rgba(37,99,235,0.25)',
                      }}
                    >
                      <Bot
                        size={17}
                        strokeWidth={2}
                      />
                    </div>
                  )}

                  {/* =================================================
                      MESSAGE CONTENT
                      ================================================= */}

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser
                        ? 'flex-end'
                        : 'flex-start',
                      minWidth: 0,
                      maxWidth: isUser
                        ? '78%'
                        : '84%',
                    }}
                  >
                    {/* AI NAME */}

                    {!isUser && (
                      <span
                        style={{
                          marginLeft: '3px',
                          marginBottom: '5px',
                          color: '#7f9abb',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                        }}
                      >
                        Aegis AI
                      </span>
                    )}

                    {/* =================================================
                        ACTUAL MESSAGE BUBBLE
                        ================================================= */}

                    <div
                      style={{
                        width: 'fit-content',
                        maxWidth: '100%',
                        minWidth: isUser
                          ? '70px'
                          : '0',
                        boxSizing: 'border-box',

                        padding: isUser
                          ? '12px 16px'
                          : '14px 17px',

                        borderRadius: isUser
                          ? '18px 18px 5px 18px'
                          : '18px 18px 18px 5px',

                        background: isUser
                          ? USER_BUBBLE
                          : msg.isError
                            ? 'rgba(127,29,29,0.22)'
                            : msg.isEmergency
                              ? 'rgba(127,29,29,0.24)'
                              : AI_BUBBLE,

                        border: isUser
                          ? `1px solid ${USER_BUBBLE_BORDER}`
                          : msg.isError
                            ? '1px solid rgba(248,113,113,0.30)'
                            : msg.isEmergency
                              ? '1px solid rgba(251,113,133,0.40)'
                              : `1px solid ${AI_BUBBLE_BORDER}`,

                        boxShadow: isUser
                          ? '0 8px 24px rgba(37,99,235,0.18)'
                          : '0 5px 18px rgba(0,0,0,0.14)',

                        color: isUser
                          ? '#ffffff'
                          : '#e8eef7',

                        fontSize: '0.93rem',
                        lineHeight: 1.65,

                        overflowWrap:
                          'anywhere',
                        wordBreak:
                          'break-word',
                      }}
                    >
                      {/* EMERGENCY LABEL */}

                      {msg.isEmergency &&
                        !msg.isError && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '7px',
                              width: 'fit-content',
                              marginBottom: '10px',
                              padding: '6px 9px',
                              borderRadius: '8px',
                              background:
                                'rgba(244,63,94,0.12)',
                              border:
                                '1px solid rgba(244,63,94,0.20)',
                              color: '#fb7185',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                            }}
                          >
                            <AlertTriangle
                              size={15}
                            />
                            CRITICAL ALERT
                          </div>
                        )}

                      {/* ERROR LABEL */}

                      {msg.isError && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '8px',
                            color: '#fb7185',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                          }}
                        >
                          <AlertTriangle
                            size={14}
                          />
                          Service Issue
                        </div>
                      )}

                      {/* USER MESSAGE */}

                      {isUser ? (
                        <div
                          style={{
                            whiteSpace:
                              'pre-wrap',
                            color: '#ffffff',
                            fontWeight: 500,
                          }}
                        >
                          {msg.content}
                        </div>
                      ) : (
                        /* AI MARKDOWN */
                        <div
                          style={{
                            minWidth: 0,
                          }}
                        >
                          <ReactMarkdown
                            components={{
                              p: ({
                                node: _node,
                                ...props
                              }) => (
                                <p
                                  style={{
                                    margin:
                                      '0 0 10px',
                                    lineHeight: 1.65,
                                  }}
                                  {...props}
                                />
                              ),

                              ul: ({
                                node: _node,
                                ...props
                              }) => (
                                <ul
                                  style={{
                                    margin:
                                      '6px 0 12px',
                                    paddingLeft:
                                      '22px',
                                  }}
                                  {...props}
                                />
                              ),

                              ol: ({
                                node: _node,
                                ...props
                              }) => (
                                <ol
                                  style={{
                                    margin:
                                      '6px 0 12px',
                                    paddingLeft:
                                      '22px',
                                  }}
                                  {...props}
                                />
                              ),

                              li: ({
                                node: _node,
                                ...props
                              }) => (
                                <li
                                  style={{
                                    marginBottom:
                                      '5px',
                                    lineHeight: 1.6,
                                  }}
                                  {...props}
                                />
                              ),

                              h1: ({
                                node: _node,
                                ...props
                              }) => (
                                <h1
                                  style={{
                                    margin:
                                      '0 0 12px',
                                    fontSize:
                                      '1.2rem',
                                    fontWeight: 700,
                                    color:
                                      '#ffffff',
                                  }}
                                  {...props}
                                />
                              ),

                              h2: ({
                                node: _node,
                                ...props
                              }) => (
                                <h2
                                  style={{
                                    margin:
                                      '14px 0 9px',
                                    fontSize:
                                      '1.08rem',
                                    fontWeight: 700,
                                    color:
                                      '#ffffff',
                                  }}
                                  {...props}
                                />
                              ),

                              h3: ({
                                node: _node,
                                ...props
                              }) => (
                                <h3
                                  style={{
                                    margin:
                                      '12px 0 8px',
                                    fontSize:
                                      '0.98rem',
                                    fontWeight: 650,
                                    color:
                                      '#f1f5f9',
                                  }}
                                  {...props}
                                />
                              ),

                              strong: ({
                                node: _node,
                                ...props
                              }) => (
                                <strong
                                  style={{
                                    color:
                                      '#ffffff',
                                    fontWeight: 700,
                                  }}
                                  {...props}
                                />
                              ),

                              em: ({
                                node: _node,
                                ...props
                              }) => (
                                <em
                                  style={{
                                    color:
                                      '#cbd5e1',
                                  }}
                                  {...props}
                                />
                              ),

                              code: ({
                                node: _node,
                                inline,
                                children,
                                ...props
                              }: any) => {
                                if (inline) {
                                  return (
                                    <code
                                      style={{
                                        padding:
                                          '2px 6px',
                                        borderRadius:
                                          '5px',
                                        background:
                                          'rgba(2,6,23,0.65)',
                                        border:
                                          '1px solid rgba(71,85,105,0.5)',
                                        color:
                                          '#7dd3fc',
                                        fontFamily:
                                          'monospace',
                                        fontSize:
                                          '0.82rem',
                                      }}
                                      {...props}
                                    >
                                      {children}
                                    </code>
                                  );
                                }

                                return (
                                  <div
                                    style={{
                                      margin:
                                        '12px 0',
                                      padding:
                                        '13px 15px',
                                      overflowX:
                                        'auto',
                                      borderRadius:
                                        '10px',
                                      background:
                                        'rgba(2,6,23,0.75)',
                                      border:
                                        '1px solid rgba(71,85,105,0.45)',
                                    }}
                                  >
                                    <code
                                      style={{
                                        display:
                                          'block',
                                        color:
                                          '#dbeafe',
                                        fontFamily:
                                          'monospace',
                                        fontSize:
                                          '0.81rem',
                                        lineHeight:
                                          1.55,
                                        whiteSpace:
                                          'pre',
                                      }}
                                      {...props}
                                    >
                                      {children}
                                    </code>
                                  </div>
                                );
                              },

                              a: ({
                                node: _node,
                                ...props
                              }) => (
                                <a
                                  style={{
                                    color:
                                      '#60a5fa',
                                    textDecoration:
                                      'underline',
                                    textUnderlineOffset:
                                      '2px',
                                    overflowWrap:
                                      'anywhere',
                                  }}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  {...props}
                                />
                              ),

                              blockquote: ({
                                node: _node,
                                ...props
                              }) => (
                                <blockquote
                                  style={{
                                    margin:
                                      '12px 0',
                                    padding:
                                      '7px 12px',
                                    borderLeft:
                                      '3px solid #3b82f6',
                                    background:
                                      'rgba(59,130,246,0.06)',
                                    color:
                                      '#b8c7d9',
                                    borderRadius:
                                      '0 7px 7px 0',
                                  }}
                                  {...props}
                                />
                              ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {/* =================================================
                        TIMESTAMP
                        ================================================= */}

                    <span
                      style={{
                        marginTop: '5px',
                        padding:
                          isUser
                            ? '0 3px'
                            : '0 3px',
                        color: isUser
                          ? '#6f9fe8'
                          : '#667d9a',
                        fontSize: '0.67rem',
                        fontWeight: 500,
                      }}
                    >
                      {msg.timestamp.toLocaleTimeString(
                        [],
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </span>
                  </div>

                  {/* =================================================
                      USER AVATAR
                      ================================================= */}

                  {isUser && (
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        flexShrink: 0,
                        marginTop: '20px',
                        borderRadius: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background:
                          'linear-gradient(135deg, #059669, #10b981)',
                        color: '#ffffff',
                        boxShadow:
                          '0 5px 18px rgba(16,185,129,0.18)',
                      }}
                    >
                      <User
                        size={17}
                        strokeWidth={2}
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/* ======================================================
                TYPING INDICATOR
                ====================================================== */}

            {isTyping && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    flexShrink: 0,
                    marginTop: '20px',
                    borderRadius: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background:
                      'linear-gradient(135deg, #2563eb, #3b82f6)',
                    color: '#ffffff',
                  }}
                >
                  <Bot size={17} />
                </div>

                <div>
                  <span
                    style={{
                      display: 'block',
                      marginBottom: '5px',
                      marginLeft: '3px',
                      color: '#7f9abb',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                    }}
                  >
                    Aegis AI
                  </span>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 16px',
                      borderRadius:
                        '18px 18px 18px 5px',
                      background: AI_BUBBLE,
                      border:
                        `1px solid ${AI_BUBBLE_BORDER}`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: '5px',
                      }}
                    >
                      {[0, 0.2, 0.4].map(
                        (delay, index) => (
                          <motion.span
                            key={index}
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background:
                                '#60a5fa',
                            }}
                            animate={{
                              y: [0, -5, 0],
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 1,
                              delay,
                            }}
                          />
                        )
                      )}
                    </div>

                    <span
                      style={{
                        color: '#91a4bc',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                      }}
                    >
                      Thinking...
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            <div
              ref={messagesEndRef}
              style={{
                height: '4px',
              }}
            />
          </div>
        </div>

        {/* ========================================================
            COMPOSER
            ======================================================== */}

        <div
          style={{
            flexShrink: 0,
            padding: '15px 20px 13px',
            background:
              'rgba(7,16,30,0.98)',
            borderTop:
              '1px solid rgba(51,65,85,0.65)',
          }}
        >
          <form
            onSubmit={handleSend}
            style={{
              display: 'flex',
              width: '100%',
              gap: '10px',
              alignItems: 'flex-end',
            }}
          >
            <div
              style={{
                position: 'relative',
                flex: '1 1 0',
                minWidth: 0,
                borderRadius: '14px',
                background:
                  '#0d1a2d',
                border:
                  '1px solid rgba(71,85,105,0.7)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.02)',
              }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) =>
                  setInput(e.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Ask about symptoms, medical guidance, or how to use Aegis..."
                rows={1}
                disabled={isTyping}
                style={{
                  display: 'block',
                  width: '100%',
                  minWidth: 0,
                  maxHeight: '160px',
                  boxSizing: 'border-box',
                  padding:
                    '12px 52px 12px 16px',
                  resize: 'none',
                  outline: 'none',
                  border: 'none',
                  background:
                    'transparent',
                  color:
                    '#edf4ff',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  lineHeight: 1.55,
                  overflowY: 'auto',
                  scrollbarWidth: 'none',
                }}
              />

              <button
                type="submit"
                disabled={
                  !input.trim() || isTyping
                }
                title="Send message"
                style={{
                  position: 'absolute',
                  right: '7px',
                  bottom: '7px',
                  width: '36px',
                  height: '36px',
                  border: 'none',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background:
                    !input.trim() || isTyping
                      ? '#17243a'
                      : '#2563eb',
                  color:
                    !input.trim() || isTyping
                      ? '#64748b'
                      : '#ffffff',
                  cursor:
                    !input.trim() || isTyping
                      ? 'not-allowed'
                      : 'pointer',
                  transition:
                    'all 150ms ease',
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </form>

          <p
            style={{
              margin:
                '9px 0 0',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '0.66rem',
              lineHeight: 1.5,
            }}
          >
            Aegis AI provides guidance based on
            medical knowledge but can make mistakes.
            For life-threatening emergencies,{' '}
            <strong
              style={{
                color: '#fb7185',
                fontWeight: 600,
              }}
            >
              use the SOS button immediately.
            </strong>
          </p>
        </div>
      </div>
    </div>
  );
}