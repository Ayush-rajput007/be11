import { api } from '../lib/api.js';
import { PageContext } from '../components/ai/ai.types.js';

export interface SendMessagePayload {
  message: string;
  conversationId?: string;
  pageContext?: PageContext;
}

export const sendAiMessage = async (payload: SendMessagePayload) => {
  const response = await api.post('/ai/chat', payload);
  return response.data.data;
};

export const getAiHealth = async () => {
  const response = await api.get('/ai/health');
  return response.data;
};
