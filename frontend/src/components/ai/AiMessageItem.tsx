import React, { useState } from 'react';
import { Copy, Check, User, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ChatMessage } from './ai.types.js';
import { AiEscalationCard } from './AiEscalationCard.js';

interface AiMessageItemProps {
  message: ChatMessage;
}

/**
 * Safe markdown parser for formatting bold text, bullet points, numbered lists, and clickable links.
 */
function renderSafeMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    if (!line.trim()) {
      elements.push(<div key={`spacer-${index}`} className="h-1.5" />);
      return;
    }

    // Bullet points
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const content = line.substring(2);
      elements.push(
        <div key={`li-${index}`} className="flex items-start gap-1.5 pl-1 my-0.5">
          <span className="text-[#FF8C1A] font-bold text-xs mt-0.5">•</span>
          <span className="flex-1">{formatInline(content)}</span>
        </div>
      );
      return;
    }

    // Numbered lists
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={`num-${index}`} className="flex items-start gap-1.5 pl-1 my-0.5">
          <span className="text-[#001a49] font-bold text-xs shrink-0">{numMatch[1]}.</span>
          <span className="flex-1">{formatInline(numMatch[2])}</span>
        </div>
      );
      return;
    }

    // Standard paragraph
    elements.push(
      <p key={`p-${index}`} className="my-0.5 leading-relaxed">
        {formatInline(line)}
      </p>
    );
  });

  return <div className="space-y-0.5 text-xs">{elements}</div>;
}

/**
 * Helper to format inline markdown (bold **text** and links [label](url)).
 */
function formatInline(content: string): React.ReactNode[] {
  // Regex to match [label](url) or **bold**
  const regex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*)/g;
  const parts = content.split(regex);

  return parts.map((part, i) => {
    if (!part) return null;

    // Link: [label](url)
    if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const label = part.substring(1, part.indexOf(']('));
      const url = part.substring(part.indexOf('](') + 2, part.length - 1);

      if (url.startsWith('/')) {
        return (
          <Link
            key={i}
            to={url}
            className="text-[#FF8C1A] font-semibold underline underline-offset-2 hover:text-[#001a49] transition-colors"
          >
            {label}
          </Link>
        );
      }
      return (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#FF8C1A] font-semibold underline underline-offset-2 hover:text-[#001a49] transition-colors"
        >
          {label}
        </a>
      );
    }

    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const boldText = part.substring(2, part.length - 2);
      return (
        <strong key={i} className="font-bold text-[#001a49]">
          {boldText}
        </strong>
      );
    }

    return part;
  });
}

export const AiMessageItem: React.FC<AiMessageItemProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.sender === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className={`flex gap-2.5 my-3 ${isAssistant ? 'items-start' : 'items-end flex-row-reverse'}`}>
      {/* Avatar Icon */}
      <div
        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
          isAssistant
            ? 'bg-gradient-to-br from-[#001a49] to-[#0a2e6e] text-white border border-[#FF8C1A]/30'
            : 'bg-[#FF8C1A] text-white'
        }`}
      >
        {isAssistant ? <Sparkles className="w-3.5 h-3.5 text-[#FF9933]" /> : <User className="w-3.5 h-3.5" />}
      </div>

      {/* Message Bubble Container */}
      <div className={`max-w-[85%] group relative ${isAssistant ? 'text-left' : 'text-right'}`}>
        <div
          className={`rounded-2xl p-3.5 shadow-xs transition-all ${
            isAssistant
              ? 'bg-white text-gray-800 border border-gray-150 rounded-tl-sm'
              : 'bg-gradient-to-br from-[#001a49] to-[#0a2e6e] text-white rounded-tr-sm'
          }`}
        >
          {message.isTyping ? (
            <div className="flex items-center gap-1.5 py-1 px-0.5">
              <span className="w-2 h-2 rounded-full bg-[#FF8C1A] animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 rounded-full bg-[#FF8C1A] animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 rounded-full bg-[#FF8C1A] animate-bounce"></span>
            </div>
          ) : (
            <>
              {isAssistant ? renderSafeMarkdown(message.text) : <p className="text-xs whitespace-pre-wrap">{message.text}</p>}
              {message.escalationRequired && <AiEscalationCard escalationInfo={message.escalationInfo} />}
            </>
          )}
        </div>

        {/* Footer info: timestamp & copy button */}
        {!message.isTyping && (
          <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-gray-400">
            <span>{message.timestamp}</span>
            {isAssistant && (
              <button
                type="button"
                onClick={handleCopy}
                className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-gray-600 flex items-center gap-0.5 cursor-pointer"
                title="Copy response"
              >
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
