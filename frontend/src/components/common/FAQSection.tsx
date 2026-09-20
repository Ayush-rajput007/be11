import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQSectionProps {
  title?: string;
  subtitle?: string;
  items: FAQItem[];
  className?: string;
}

export const FAQSection: React.FC<FAQSectionProps> = ({
  title = 'Frequently Asked Questions',
  subtitle = 'Find direct answers to common questions about BE11 sports facilities, bookings, and services.',
  items,
  className = '',
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  if (!items || items.length === 0) return null;

  return (
    <section className={`py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto ${className}`} aria-labelledby="faq-section-heading">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Factual Knowledge & Answers</span>
        </div>
        <h2 id="faq-section-heading" className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="border border-zinc-800/80 rounded-xl bg-zinc-900/60 backdrop-blur-sm overflow-hidden transition-all duration-200 hover:border-zinc-700"
            >
              <button
                type="button"
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                onClick={() => toggleItem(idx)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${idx}`}
                id={`faq-question-${idx}`}
              >
                <span className="text-base sm:text-lg font-medium text-zinc-100">
                  {item.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-emerald-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div
                  id={`faq-answer-${idx}`}
                  role="region"
                  aria-labelledby={`faq-question-${idx}`}
                  className="px-5 pb-4 pt-1 text-sm sm:text-base text-zinc-300 border-t border-zinc-800/40 leading-relaxed"
                >
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
