import { Service } from 'typedi';
import { ChatMessage, ChatMessageModel } from '@models/chatMessages.model';
import { HttpException } from '@exceptions/HttpException';

export interface CreateChatMessageDto {
  sessionId: string;
  userId: string;
  userName: string;
  message: string;
  type?: 'text' | 'system';
}

@Service()
export class ChatMessageService {
  /**
   * Create a new chat message
   */
  public async createChatMessage(messageData: CreateChatMessageDto): Promise<ChatMessage> {
    try {
      const chatMessage = await ChatMessageModel.create({
        ...messageData,
        timestamp: new Date(),
      });

      return chatMessage;
    } catch (error: any) {
      throw new HttpException(400, `Failed to create chat message: ${error.message}`);
    }
  }

  /**
   * Get chat messages for a session
   */
  public async getChatMessagesBySession(sessionId: string, limit: number = 100): Promise<ChatMessage[]> {
    try {
      const chatMessages = await ChatMessageModel
        .find({ sessionId })
        .sort({ timestamp: 1 })
        .limit(limit)
        .lean();

      return chatMessages as ChatMessage[];
    } catch (error: any) {
      throw new HttpException(400, `Failed to fetch chat messages: ${error.message}`);
    }
  }

  /**
   * Get recent chat messages for a session
   */
  public async getRecentChatMessages(sessionId: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const chatMessages = await ChatMessageModel
        .find({ sessionId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

      // Reverse to get chronological order
      return (chatMessages as ChatMessage[]).reverse();
    } catch (error: any) {
      throw new HttpException(400, `Failed to fetch recent chat messages: ${error.message}`);
    }
  }

  /**
   * Delete all chat messages for a session
   */
  public async deleteChatMessagesBySession(sessionId: string): Promise<void> {
    try {
      await ChatMessageModel.deleteMany({ sessionId });
    } catch (error: any) {
      throw new HttpException(400, `Failed to delete chat messages: ${error.message}`);
    }
  }

  /**
   * Get chat message count for a session
   */
  public async getChatMessageCount(sessionId: string): Promise<number> {
    try {
      return await ChatMessageModel.countDocuments({ sessionId });
    } catch (error: any) {
      throw new HttpException(400, `Failed to count chat messages: ${error.message}`);
    }
  }

  /**
   * Delete old chat messages (cleanup utility)
   */
  public async deleteOldChatMessages(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await ChatMessageModel.deleteMany({
        createdAt: { $lt: cutoffDate },
      });

      return result.deletedCount || 0;
    } catch (error: any) {
      throw new HttpException(400, `Failed to delete old chat messages: ${error.message}`);
    }
  }
}