import React, { useState, useRef, useEffect } from 'react';
import { Send, Minus, X, Sparkles } from 'lucide-react';
import { ChatMessage, PageContext } from './ai.types.js';
import { AiMessageItem } from './AiMessageItem.js';
import { AiQuickActions } from './AiQuickActions.js';
import { sendAiMessage } from '../../services/ai.service.js';

interface AiChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  pageContext: PageContext;
}

export const AiChatWindow: React.FC<AiChatWindowProps> = ({
  isOpen,
  onClose,
  onMinimize,
  pageContext,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'assistant',
      text: `👋 Hi! I'm the **BE11 AI Assistant**.\n\nI can help you with **venues, bookings, live matches, payments, account questions, jerseys, kits, coaches** and more.\n\nWhat can I help you with today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isSending) return;

    setInputValue('');

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const typingIndicator: ChatMessage = {
      id: `typing_${Date.now()}`,
      sender: 'assistant',
      text: '',
      timestamp: '',
      isTyping: true,
    };

    setMessages((prev) => [...prev, userMessage, typingIndicator]);
    setIsSending(true);

    try {
      const response = await sendAiMessage({
        message: text,
        pageContext,
      });

      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        sender: 'assistant',
        text: response.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: response.category,
        escalationRequired: response.escalationRequired,
        escalationInfo: response.escalationInfo,
        dataPayload: response.dataPayload,
        sources: response.sources,
      };

      setMessages((prev) => prev.filter((m) => !m.isTyping).concat(assistantMessage));
    } catch (err) {
      console.error('AI chat error:', err);
      const fallbackErrorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: `BE11 AI is temporarily unavailable.\n\nPlease contact our direct human support desk for immediate assistance:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        escalationRequired: true,
        escalationInfo: {
          whatsappNumber: '+91 87001 90843',
          supportEmail: 'support@be11.in',
          whatsappUrl: 'https://wa.me/918700190843?text=Hi%20BE11%20Support%2C%20I%20need%20assistance.',
          emailUrl: 'mailto:support@be11.in?subject=BE11%20Support%20Request',
        },
      };

      setMessages((prev) => prev.filter((m) => !m.isTyping).concat(fallbackErrorMessage));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="BE11 AI Assistant Chat"
      className="fixed bottom-20 right-4 sm:right-6 w-[92vw] sm:w-[390px] h-[560px] max-h-[82vh] bg-[#f8fafc] rounded-3xl shadow-[0_20px_60px_rgba(0,26,73,0.22)] border border-gray-200 flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#001a49] via-[#0a2e6e] to-[#102A56] text-white p-4 flex items-center justify-between border-b border-[#0a2e6e]/60 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FF8C1A] text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm tracking-tight text-white font-poppins">BE11 AI ASSISTANT</h3>
              <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-light">Your smart guide to BE11</p>
          </div>
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-1 text-slate-300">
          <button
            type="button"
            onClick={onMinimize}
            className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            aria-label="Minimize Chat"
            title="Minimize"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            aria-label="Close Chat"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Page Context Badge */}
      {pageContext.page && pageContext.page !== 'Home' && (
        <div className="bg-[#001a49]/5 border-b border-gray-200/80 px-4 py-1.5 text-[10px] text-gray-500 flex items-center justify-between">
          <span>
            Viewing: <strong className="text-[#001a49]">{pageContext.page}</strong>
          </span>
          <span className="text-[#FF8C1A] font-medium">Context Active</span>
        </div>
      )}

      {/* Conversation Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2">
        {messages.map((message) => (
          <AiMessageItem key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Suggestions (Only shown when few messages) */}
      {messages.length <= 3 && (
        <div className="px-4 pb-1 border-t border-gray-200/60 bg-white/70 backdrop-blur-xs">
          <AiQuickActions onSelectAction={handleSendMessage} disabled={isSending} />
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-gray-200 flex items-center gap-2 shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          disabled={isSending}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isSending ? 'BE11 AI is typing...' : 'Ask about venues, matches, prices, jerseys...'}
          className="flex-1 text-xs px-3 py-2.5 rounded-xl border border-gray-200 bg-[#f8fafc] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FF8C1A] focus:bg-white transition-all disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={!inputValue.trim() || isSending}
          className="p-2.5 rounded-xl bg-gradient-to-r from-[#FF8C1A] to-[#FF9933] text-white hover:opacity-95 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer shrink-0"
          aria-label="Send Message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
