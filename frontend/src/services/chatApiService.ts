import api from '../config/api';
import type { ChatMessage, ApiResponse } from '../types';

class ChatApiService {
  // Get chat messages for a session
  async getChatHistory(sessionId: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const response = await api.get<ApiResponse<ChatMessage[]>>(
        `/chat/session/${sessionId}?limit=${limit}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to load chat history:', error);
      // Return empty array on error rather than throwing
      return [];
    }
  }

  // Get chat message count for a session
  async getChatMessageCount(sessionId: string): Promise<number> {
    try {
      const response = await api.get<ApiResponse<{ count: number }>>(
        `/chat/session/${sessionId}/count`
      );
      return response.data.data.count;
    } catch (error: any) {
      console.error('Failed to get chat message count:', error);
      return 0;
    }
  }

  // Delete chat messages for a session (educators only)
  async deleteChatHistory(sessionId: string): Promise<void> {
    try {
      await api.delete(`/chat/session/${sessionId}`);
    } catch (error: any) {
      console.error('Failed to delete chat history:', error);
      throw error;
    }
  }
}

export default new ChatApiService();