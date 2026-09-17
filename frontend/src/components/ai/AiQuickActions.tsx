import React from 'react';
import { Calendar, Trophy, DollarSign, XCircle, CreditCard, Shirt, Package, HelpCircle } from 'lucide-react';

interface AiQuickActionsProps {
  onSelectAction: (prompt: string) => void;
  disabled?: boolean;
}

const QUICK_ACTIONS = [
  { label: 'How do I book a venue?', icon: Calendar, prompt: 'How do I book a venue on BE11?' },
  { label: 'Find a live match', icon: Trophy, prompt: 'Are there any open cricket live matches available?' },
  { label: 'Venue pricing', icon: DollarSign, prompt: 'What are the pricing rates for RRR, Playnow, and AB Cricket Ground?' },
  { label: 'How do I cancel a booking?', icon: XCircle, prompt: 'How do I cancel a booking and what is the refund policy?' },
  { label: 'How do payments work?', icon: CreditCard, prompt: 'How do payments and wallet work on BE11?' },
  { label: 'Jersey Builder', icon: Shirt, prompt: 'What is Jersey Builder and how can I customize team jerseys?' },
  { label: 'Kit Builder', icon: Package, prompt: 'What is Kit Builder and what packages are available?' },
  { label: 'Contact support', icon: HelpCircle, prompt: 'I want to talk to human support' },
];

export const AiQuickActions: React.FC<AiQuickActionsProps> = ({ onSelectAction, disabled }) => {
  return (
    <div className="py-2">
      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">
        Quick Questions
      </div>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_ACTIONS.map((action, idx) => {
          const Icon = action.icon;
          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => onSelectAction(action.prompt)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 text-[#001a49] text-xs font-medium hover:border-[#FF8C1A] hover:bg-[#FF8C1A]/5 hover:text-[#FF8C1A] active:scale-95 transition-all text-left shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon className="w-3.5 h-3.5 text-[#FF8C1A] shrink-0" />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
