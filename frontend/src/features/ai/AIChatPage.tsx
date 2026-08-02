/**
 * Aegis AI – AI Chat Assistant Page
 *
 * Intelligent chatbot for health queries and emergency guidance.
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, User, AlertTriangle, Loader2 } from 'lucide-react';
import { useAppSelector } from '@/store';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isEmergency?: boolean;
}

export default function AIChatPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello ${user?.full_name || 'there'}! I am Aegis, your AI medical assistant. How can I help you today? You can ask me about symptoms, first aid, or our platform features.`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Mock AI Response generation
    setTimeout(() => {
      let aiContent = "I'm sorry, I'm currently operating in mock mode, but I'm designed to help you with medical and platform queries.";
      let isEmergency = false;
      const lowerInput = userMsg.content.toLowerCase();
      
      if (lowerInput.includes('chest pain') || lowerInput.includes('heart attack')) {
        aiContent = "Based on your symptoms, this could be a life-threatening emergency (e.g., Cardiac Arrest). Please use the Emergency SOS button immediately to dispatch an ambulance!";
        isEmergency = true;
      } else if (lowerInput.includes('fever') || lowerInput.includes('headache')) {
        aiContent = "A fever or headache can have many causes. It's usually best to stay hydrated, rest, and monitor your temperature. If it persists for more than 3 days, please schedule an appointment with a doctor.";
      } else if (lowerInput.includes('ambulance') || lowerInput.includes('track')) {
        aiContent = "You can track your dispatched ambulance in real-time from the 'Emergencies' tab in your dashboard.";
      } else if (lowerInput.includes('report') || lowerInput.includes('ocr')) {
        aiContent = "You can upload your medical reports on the 'Medical Reports' page. I will analyze them and extract key metrics for you automatically.";
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date(),
        isEmergency
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center gap-4 mb-6 flex-shrink-0">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--primary-500)]/10 text-[var(--primary-400)] shadow-[0_0_20px_rgba(59,130,246,0.15)]">
          <Bot size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Assistant</h1>
          <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Online and ready to help
          </p>
        </div>
      </div>

      <div className="flex-1 glass-card overflow-hidden flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'thin' }}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                msg.role === 'user' 
                  ? 'bg-[var(--accent-500)] text-white' 
                  : 'bg-[var(--primary-500)] text-white'
              }`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>

              {/* Message Bubble */}
              <div className={`p-4 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-[var(--accent-600)] text-white rounded-tr-sm'
                  : msg.isEmergency 
                    ? 'bg-rose-500/20 border border-rose-500/30 text-rose-50 rounded-tl-sm'
                    : 'bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-gray-200 rounded-tl-sm'
              }`}>
                {msg.isEmergency && (
                  <div className="flex items-center gap-2 text-rose-400 font-bold mb-2">
                    <AlertTriangle size={18} />
                    CRITICAL ALERT
                  </div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <span className={`text-[10px] mt-2 block ${msg.role === 'user' ? 'text-accent-200 text-right' : 'text-gray-500'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 max-w-[85%]"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-[var(--primary-500)] text-white">
                <Bot size={20} />
              </div>
              <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-gray-200 rounded-tl-sm flex items-center gap-3">
                <Loader2 size={16} className="animate-spin text-[var(--primary-400)]" />
                <span className="text-sm text-gray-400">Aegis is typing...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about symptoms, platform usage, or medical advice..."
              className="w-full pl-4 pr-14 py-4 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--primary-500)]"
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 p-2.5 rounded-lg bg-[var(--primary-500)] text-white disabled:opacity-50 hover:bg-[var(--primary-400)] transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
          <p className="text-center text-[11px] text-gray-500 mt-3">
            Aegis AI can make mistakes. For severe emergencies, please use the SOS button immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
