import { Router } from 'express';
import { ChatMessageController } from '@controllers/chatMessages.controller';
import { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@middlewares/auth.middleware';

export class ChatMessageRoute implements Routes {
  public path = '/chat';
  public router = Router();
  public chatMessageController = new ChatMessageController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Get chat messages for a session
    this.router.get(
      `${this.path}/session/:sessionId`, 
      AuthMiddleware,
      this.chatMessageController.getChatMessagesBySession
    );

    // Get chat message count for a session
    this.router.get(
      `${this.path}/session/:sessionId/count`, 
      AuthMiddleware,
      this.chatMessageController.getChatMessageCount
    );

    // Delete chat messages for a session (educators only)
    this.router.delete(
      `${this.path}/session/:sessionId`, 
      AuthMiddleware,
      this.chatMessageController.deleteChatMessagesBySession
    );
  }
}