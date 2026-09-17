import React from 'react';
import { MessageSquare, Mail, PhoneCall } from 'lucide-react';
import { EscalationInfo } from './ai.types.js';

interface AiEscalationCardProps {
  escalationInfo?: EscalationInfo;
}

export const AiEscalationCard: React.FC<AiEscalationCardProps> = ({ escalationInfo }) => {
  const whatsappUrl = escalationInfo?.whatsappUrl || 'https://wa.me/918700190843';
  const emailUrl = escalationInfo?.emailUrl || 'mailto:support@be11.in?subject=BE11%20Support%20Request';

  return (
    <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-br from-[#001a49]/5 via-[#FF8C1A]/5 to-[#001a49]/5 border border-[#FF8C1A]/20 space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-[#FF8C1A]/10 text-[#FF8C1A]">
          <PhoneCall className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-[#001a49]">BE11 Human Support Desk</h4>
          <p className="text-[10px] text-gray-500">24x7 Direct Operational Assistance</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366] text-white text-xs font-semibold hover:bg-[#20bd5a] transition-all shadow-sm active:scale-95"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>WhatsApp</span>
        </a>

        <a
          href={emailUrl}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#001a49] text-white text-xs font-semibold hover:bg-[#0a2e6e] transition-all shadow-sm active:scale-95"
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Email Support</span>
        </a>
      </div>

      <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-100">
        <span>WhatsApp: +91 87001 90843</span>
        <span>support@be11.in</span>
      </div>
    </div>
  );
};
