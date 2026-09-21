import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQSectionProps {
  title?: string;
  subtitle?: string; // Kept for backwards-compatibility with existing props, but intentionally not rendered to keep the UI clean and noise-free
  items: FAQItem[];
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
  isDark?: boolean;
}

export const FAQSection: React.FC<FAQSectionProps> = ({
  title = 'Frequently Asked Questions',
  items,
  className = '',
  theme = 'auto',
  isDark: isDarkProp,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  if (!items || items.length === 0) return null;

  // Detect dark mode from prop, theme string, or className
  const isDark =
    isDarkProp === true ||
    theme === 'dark' ||
    className.includes('bg-zinc') ||
    className.includes('bg-[#0') ||
    className.includes('bg-black') ||
    className.includes('dark');

  // Simplify any "Guide & FAQs" title into clean "Frequently Asked Questions"
  const displayTitle =
    !title || title.includes('Guide & FAQs') || title.includes('About BE11')
      ? 'Frequently Asked Questions'
      : title;

  return (
    <section
      className={`w-full py-12 sm:py-16 lg:py-20 px-4 sm:px-6 transition-colors duration-200 ${className}`}
      aria-labelledby="faq-section-heading"
    >
      <div className="max-w-[900px] mx-auto">
        {/* Simple, Pure, Center-aligned Heading */}
        <h2
          id="faq-section-heading"
          className={`text-2xl sm:text-3xl font-bold tracking-tight text-center mb-7 sm:mb-8 ${
            isDark ? 'text-white' : 'text-[#001A49]'
          }`}
        >
          {displayTitle}
        </h2>

        {/* Accordion Cards List */}
        <div className="space-y-2.5 sm:space-y-3">
          {items.map((item, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className={`w-full rounded-[14px] transition-all duration-200 overflow-hidden ${
                  isDark
                    ? isOpen
                      ? 'bg-[#16171d] border border-emerald-500/40 shadow-sm'
                      : 'bg-[#111217] border border-white/10 hover:border-white/20'
                    : isOpen
                    ? 'bg-[#FFFFFF] border border-[#44af33]/60 shadow-[0_6px_20px_rgba(0,26,73,0.06)]'
                    : 'bg-[#FFFFFF] border border-[#E6EAF0] shadow-[0_1px_3px_rgba(0,26,73,0.02)] hover:border-slate-300'
                }`}
              >
                <button
                  type="button"
                  className="w-full min-h-[64px] px-[20px] sm:px-[22px] py-[18px] sm:py-[20px] text-left flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#44af33] rounded-[14px] cursor-pointer select-none transition-colors"
                  onClick={() => toggleItem(idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  id={`faq-question-${idx}`}
                >
                  <span
                    className={`text-[15px] sm:text-[17px] font-semibold tracking-tight transition-colors duration-200 leading-snug flex-1 pr-3 ${
                      isDark
                        ? isOpen
                          ? 'text-white'
                          : 'text-white/90 hover:text-white'
                        : isOpen
                        ? 'text-[#001A49]'
                        : 'text-[#001A49] hover:text-[#001A49]'
                    }`}
                  >
                    {item.question}
                  </span>

                  {/* Subtle BE11 Green Chevron Icon */}
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 transition-transform duration-250 ${
                      isDark ? 'text-[#44af33]' : 'text-[#44af33]'
                    } ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                {/* Answer Container */}
                <div
                  id={`faq-answer-${idx}`}
                  role="region"
                  aria-labelledby={`faq-question-${idx}`}
                  className={`grid transition-[grid-template-rows,opacity] duration-250 ease-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div
                      className={`px-[20px] sm:px-[22px] pb-[20px] pt-1 text-[15px] sm:text-[16px] leading-[1.7] border-t ${
                        isDark
                          ? 'text-slate-300 border-white/5'
                          : 'text-[#475569] border-slate-100'
                      }`}
                    >
                      <p className="pt-2">{item.answer}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
