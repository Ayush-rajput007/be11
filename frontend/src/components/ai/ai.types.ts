export interface EscalationInfo {
  whatsappNumber: string;
  supportEmail: string;
  whatsappUrl: string;
  emailUrl: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  category?: string;
  escalationRequired?: boolean;
  escalationInfo?: EscalationInfo;
  dataPayload?: any;
  sources?: string[];
  isTyping?: boolean;
}

export interface PageContext {
  route: string;
  page: string;
  venueId?: string;
  matchId?: string;
  sport?: string;
}
