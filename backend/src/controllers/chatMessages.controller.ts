import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { ChatMessageService } from '@services/chatMessages.service';

export class ChatMessageController {
  public chatMessageService = Container.get(ChatMessageService);

  public getChatMessagesBySession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId: string = req.params.sessionId;
      const limit: number = parseInt(req.query.limit as string) || 50;

      const chatMessages = await this.chatMessageService.getRecentChatMessages(sessionId, limit);

      res.status(200).json({ 
        data: chatMessages, 
        message: 'Chat messages retrieved successfully' 
      });
    } catch (error) {
      next(error);
    }
  };

  public getChatMessageCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId: string = req.params.sessionId;
      
      const count = await this.chatMessageService.getChatMessageCount(sessionId);

      res.status(200).json({ 
        data: { count }, 
        message: 'Chat message count retrieved successfully' 
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteChatMessagesBySession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId: string = req.params.sessionId;
      
      await this.chatMessageService.deleteChatMessagesBySession(sessionId);

      res.status(200).json({ 
        message: 'Chat messages deleted successfully' 
      });
    } catch (error) {
      next(error);
    }
  };
}