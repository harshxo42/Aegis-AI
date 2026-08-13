/**
 * Aegis AI – AI Chat Assistant Page
 *
 * Intelligent chatbot for health queries and emergency guidance.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, User, AlertTriangle, Activity } from 'lucide-react';
import { useAppSelector } from '@/store';
import { aiAPI } from '@/api/client';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isEmergency?: boolean;
  isError?: boolean;
}

const SUGGESTED_PROMPTS = [
  "What should I do for chest pain?",
  "What are the signs of a stroke?",
  "How can I find the nearest hospital?",
  "How does Emergency SOS work?"
];

export default function AIChatPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello ${user?.full_name || 'there'}! I am Aegis, your AI medical assistant. How can I help you today?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await aiAPI.chat({ message: userText });
      const aiContent = response.data?.data?.reply || "I didn't receive a valid response.";
      
      const isEmergency = aiContent.toLowerCase().includes('emergency') || 
                          aiContent.toLowerCase().includes('critical') || 
                          aiContent.toLowerCase().includes('immediate');

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date(),
        isEmergency
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      console.error('Failed to get AI response:', error);
      
      let errorContent = "The AI service is temporarily unavailable. Please try again later or contact support.";
      
      // Keep technical details available but not overwhelming
      if (error?.response?.data?.detail?.includes('OpenAI API key')) {
        errorContent = "The AI service is not configured correctly on the server. Please contact the administrator.";
      }
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 10);
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] flex flex-col pt-2 md:pt-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4 md:mb-6 px-4 md:px-0 flex-shrink-0">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--primary-500)]/10 text-[var(--primary-400)] shadow-[0_0_20px_rgba(59,130,246,0.15)]">
          <Activity size={24} />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Aegis AI</h1>
          <p className="text-gray-400 text-xs md:text-sm mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            Your Emergency Healthcare Assistant
          </p>
        </div>
      </div>

      <div className="flex-1 glass-card overflow-hidden flex flex-col border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 rounded-2xl md:rounded-3xl shadow-xl mx-2 md:mx-0">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8" style={{ scrollbarWidth: 'thin' }}>
          {messages.length === 1 && (
            <div className="mt-8 flex flex-col items-center justify-center text-center opacity-80 mb-12">
              <div className="w-20 h-20 rounded-full bg-[var(--primary-500)]/10 flex items-center justify-center text-[var(--primary-400)] mb-6 shadow-lg">
                <Bot size={40} />
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-2">How can I help you today?</h2>
              <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto mb-8">
                I can provide guidance on symptoms, first aid procedures, or help you navigate the Aegis platform.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedPrompt(prompt)}
                    className="p-3 md:p-4 text-left text-sm md:text-base bg-[var(--bg-tertiary)] hover:bg-[var(--primary-500)]/20 border border-[var(--border-color)] hover:border-[var(--primary-500)]/50 rounded-xl transition-all text-gray-300 hover:text-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 md:gap-4 w-full ${
                msg.role === 'user' 
                  ? 'max-w-[95%] md:max-w-[75%] ml-auto flex-row-reverse' 
                  : 'max-w-[95%] md:max-w-[85%]'
              }`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md ${
                msg.role === 'user' 
                  ? 'bg-[var(--accent-500)] text-white' 
                  : 'bg-[var(--primary-500)] text-white'
              }`}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>

              {/* Message Bubble */}
              <div className={`flex flex-col min-w-0 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.role === 'assistant' && (
                  <span className="text-xs text-gray-400 font-medium mb-1 ml-1">Aegis AI</span>
                )}
                
                <div className={`p-4 md:p-5 rounded-2xl w-full break-words overflow-wrap-anywhere ${
                  msg.role === 'user'
                    ? 'bg-[var(--accent-600)] text-white rounded-tr-sm shadow-md'
                    : msg.isError
                      ? 'bg-rose-500/10 border border-rose-500/20 text-gray-200 rounded-tl-sm'
                      : msg.isEmergency 
                        ? 'bg-rose-500/20 border border-rose-500/30 text-rose-50 rounded-tl-sm shadow-md'
                        : 'bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-gray-200 rounded-tl-sm shadow-sm'
                }`}>
                  {msg.isEmergency && !msg.isError && (
                    <div className="flex items-center gap-2 text-rose-400 font-bold mb-3 bg-rose-500/10 p-2 rounded-lg inline-flex">
                      <AlertTriangle size={18} />
                      CRITICAL ALERT
                    </div>
                  )}
                  {msg.isError && (
                    <div className="flex items-center gap-2 text-rose-400 font-semibold mb-2">
                      <AlertTriangle size={16} />
                      Service Issue
                    </div>
                  )}
                  
                  <div className={`text-[15px] md:text-base leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'text-white' : 'text-gray-200'}`}>
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <ReactMarkdown
                        components={{
                          p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 last:mb-0 space-y-1.5" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 last:mb-0 space-y-1.5" {...props} />,
                          li: ({node, ...props}) => <li className="" {...props} />,
                          h1: ({node, ...props}) => <h1 className="text-xl md:text-2xl font-bold mb-4 mt-6 first:mt-0 text-white" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-lg md:text-xl font-bold mb-3 mt-5 first:mt-0 text-white" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-base md:text-lg font-bold mb-2 mt-4 first:mt-0 text-gray-100" {...props} />,
                          code: ({node, inline, className, children, ...props}: any) => {
                            return inline ? (
                              <code className="bg-black/30 rounded px-1.5 py-0.5 font-mono text-[13px] md:text-sm text-[var(--primary-300)]" {...props}>
                                {children}
                              </code>
                            ) : (
                              <div className="bg-black/40 rounded-xl p-4 mb-4 overflow-x-auto border border-white/5 my-4">
                                <code className="font-mono text-[13px] md:text-sm whitespace-pre block text-gray-300" {...props}>
                                  {children}
                                </code>
                              </div>
                            )
                          },
                          strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
                          a: ({node, ...props}) => <a className="text-[var(--primary-400)] hover:text-[var(--primary-300)] hover:underline break-words" target="_blank" rel="noopener noreferrer" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-[var(--primary-500)]/50 pl-4 py-1 my-4 italic text-gray-400 bg-[var(--primary-500)]/5 rounded-r-lg" {...props} />
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
                
                <span className={`text-[11px] mt-1.5 block font-medium ${msg.role === 'user' ? 'text-[var(--accent-300)]' : 'text-gray-500 ml-1'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 md:gap-4 w-full max-w-[95%] md:max-w-[85%]"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-[var(--primary-500)] text-white shadow-md">
                <Bot size={18} />
              </div>
              <div className="flex flex-col items-start min-w-0">
                <span className="text-xs text-gray-400 font-medium mb-1 ml-1">Aegis AI</span>
                <div className="p-4 md:p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-gray-200 rounded-tl-sm flex items-center gap-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <motion.div className="w-2 h-2 rounded-full bg-[var(--primary-400)]" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} />
                    <motion.div className="w-2 h-2 rounded-full bg-[var(--primary-400)]" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} />
                    <motion.div className="w-2 h-2 rounded-full bg-[var(--primary-400)]" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} />
                  </div>
                  <span className="text-sm font-medium text-gray-400 ml-2">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} className="h-2" />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-5 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] shrink-0 rounded-b-2xl md:rounded-b-3xl">
          <form onSubmit={handleSend} className="relative flex items-end gap-3 max-w-4xl mx-auto">
            <div className="relative flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl focus-within:ring-2 focus-within:ring-[var(--primary-500)]/50 focus-within:border-[var(--primary-500)] transition-all shadow-inner">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about symptoms, medical guidance, or how to use Aegis..."
                className="w-full pl-4 md:pl-5 pr-12 md:pr-14 py-3.5 md:py-4 bg-transparent text-[15px] md:text-base outline-none resize-none max-h-[200px] text-gray-100 placeholder-gray-500"
                style={{ scrollbarWidth: 'none' }}
                disabled={isTyping}
                rows={1}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                onClick={(e) => handleSend(e as unknown as React.FormEvent)}
                className="absolute right-2 md:right-3 bottom-2 md:bottom-2.5 p-2 md:p-2.5 rounded-xl bg-[var(--primary-500)] text-white disabled:opacity-50 disabled:bg-gray-600 hover:bg-[var(--primary-400)] transition-all shadow-md active:scale-95"
                title="Send message"
              >
                <Send size={18} className={!input.trim() ? "opacity-50" : "opacity-100"} />
              </button>
            </div>
          </form>
          <div className="flex justify-center mt-3 mb-1">
            <p className="text-[11px] md:text-xs text-gray-500 text-center max-w-lg leading-relaxed px-4">
              Aegis AI provides guidance based on medical knowledge but can make mistakes. For life-threatening emergencies, please use the <strong className="text-rose-400/80 font-semibold">SOS button</strong> immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

