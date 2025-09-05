import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '@utils/logger';
import {
  AuthenticatedSocket,
  WebRTCOffer,
  WebRTCAnswer,
  WebRTCIceCandidate,
  JoinRoomData,
  LeaveRoomData,
  ParticipantInfo,
  ChatMessage,
  SendChatMessageData,
} from '@interfaces/socket.interface';
import { SessionService } from '@services/sessions.service';
import { ChatMessageService } from '@services/chatMessages.service';
import { Container } from 'typedi';
import jwt from 'jsonwebtoken';
import { SECRET_KEY } from '@config';

export class SocketHandler {
  private io: SocketIOServer;
  private sessionService: SessionService;
  private chatMessageService: ChatMessageService;
  private userSessions: Map<string, { userId: string; userName: string; sessionId: string }> = new Map();

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: [
          'https://mindbrigeui.z30.web.core.windows.net',
          'http://localhost:3000',
          'http://localhost:5173' // Vite dev server default
        ],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'], // Support both transports
    });

    this.sessionService = Container.get(SessionService);
    this.chatMessageService = Container.get(ChatMessageService);
    this.initializeHandlers();
  }

  private initializeHandlers(): void {
    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));
  }

  private async authenticateSocket(socket: AuthenticatedSocket, next: any): Promise<void> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      logger.info(`Socket authentication attempt for socket ${socket.id}, token present: ${!!token}`);
      
      if (!token) {
        logger.error('Socket authentication failed: No token provided');
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, SECRET_KEY) as any;
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      
      logger.info(`Socket authenticated successfully for user ${socket.userId}`);
      next();
    } catch (error) {
      logger.error(`Socket authentication error: ${error.message}`);
      next(new Error('Authentication error: Invalid token'));
    }
  }

  private handleConnection(socket: AuthenticatedSocket): void {
    logger.info(`User ${socket.userId} connected via socket`);

    socket.on('join-session', this.handleJoinSession.bind(this, socket));
    socket.on('join-chat', this.handleJoinChat.bind(this, socket));
    socket.on('leave-session', this.handleLeaveSession.bind(this, socket));
    socket.on('webrtc-offer', this.handleWebRTCOffer.bind(this, socket));
    socket.on('webrtc-answer', this.handleWebRTCAnswer.bind(this, socket));
    socket.on('webrtc-ice-candidate', this.handleWebRTCIceCandidate.bind(this, socket));
    socket.on('send-chat-message', this.handleSendChatMessage.bind(this, socket));
    socket.on('disconnect', this.handleDisconnect.bind(this, socket));
  }

  private async handleJoinSession(socket: AuthenticatedSocket, data: JoinRoomData): Promise<void> {
    try {
      const { sessionId, userId, userName, userRole } = data;
      
      // Verify session exists and user can join
      const session = await this.sessionService.findSessionById(sessionId);
      if (!session) {
        socket.emit('session-error', { message: 'Session not found' });
        return;
      }

      // Join socket room
      socket.sessionId = sessionId;
      await socket.join(sessionId);

      // Store user session info for chat
      this.userSessions.set(socket.id, { userId, userName, sessionId });

      // Add participant to session
      await this.sessionService.addParticipant(sessionId, userId);

      // Notify other participants
      const participantInfo: ParticipantInfo = {
        userId,
        userName,
        userRole,
        isConnected: true,
        joinedAt: new Date(),
      };

      socket.to(sessionId).emit('participant-joined', participantInfo);
      
      // Send system message for user joined
      try {
        const savedSystemMessage = await this.chatMessageService.createChatMessage({
          sessionId,
          userId: 'system',
          userName: 'System',
          message: `${userName} joined the meeting`,
          type: 'system',
        });

        const joinMessage: ChatMessage = {
          id: savedSystemMessage._id,
          sessionId: savedSystemMessage.sessionId,
          userId: savedSystemMessage.userId,
          userName: savedSystemMessage.userName,
          message: savedSystemMessage.message,
          timestamp: savedSystemMessage.timestamp,
          type: savedSystemMessage.type,
        };
        
        this.io.to(sessionId).emit('chat-message', joinMessage);
      } catch (error) {
        logger.error(`Failed to create join system message: ${error.message}`);
      }
      
      // Send current participants to new user
      const participants = await this.sessionService.getSessionParticipants(sessionId);
      socket.emit('session-joined', { sessionId, participants });

      logger.info(`User ${userId} joined session ${sessionId}`);
    } catch (error) {
      logger.error(`Error joining session: ${error.message}`);
      socket.emit('session-error', { message: 'Failed to join session' });
    }
  }

  private async handleLeaveSession(socket: AuthenticatedSocket, data: LeaveRoomData): Promise<void> {
    try {
      const { sessionId, userId } = data;
      const userSession = this.userSessions.get(socket.id);
      
      await socket.leave(sessionId);
      await this.sessionService.removeParticipant(sessionId, userId);
      
      // Send system message for user left
      if (userSession) {
        try {
          const savedSystemMessage = await this.chatMessageService.createChatMessage({
            sessionId,
            userId: 'system',
            userName: 'System',
            message: `${userSession.userName} left the meeting`,
            type: 'system',
          });

          const leaveMessage: ChatMessage = {
            id: savedSystemMessage._id,
            sessionId: savedSystemMessage.sessionId,
            userId: savedSystemMessage.userId,
            userName: savedSystemMessage.userName,
            message: savedSystemMessage.message,
            timestamp: savedSystemMessage.timestamp,
            type: savedSystemMessage.type,
          };
          
          socket.to(sessionId).emit('chat-message', leaveMessage);
        } catch (error) {
          logger.error(`Failed to create leave system message: ${error.message}`);
        }
      }
      
      socket.to(sessionId).emit('participant-left', { userId });
      socket.sessionId = undefined;
      this.userSessions.delete(socket.id);

      logger.info(`User ${userId} left session ${sessionId}`);
    } catch (error) {
      logger.error(`Error leaving session: ${error.message}`);
    }
  }

  private async handleJoinChat(socket: AuthenticatedSocket, data: { sessionId: string; userId: string; userName: string }): Promise<void> {
    try {
      const { sessionId, userId, userName } = data;
      
      logger.info(`User ${userId} (${userName}) attempting to join chat for session ${sessionId}`);
      
      // Verify session exists
      const session = await this.sessionService.findSessionById(sessionId);
      if (!session) {
        logger.error(`Session ${sessionId} not found`);
        socket.emit('session-error', { message: 'Session not found' });
        return;
      }

      // Join socket room for chat
      socket.sessionId = sessionId;
      await socket.join(sessionId);

      // Store user session info for chat
      this.userSessions.set(socket.id, { userId, userName, sessionId });

      logger.info(`User ${userId} successfully joined chat room ${sessionId}`);

      // Send chat history to the user
      try {
        const chatHistory = await this.chatMessageService.getRecentChatMessages(sessionId, 50);
        logger.info(`Sending ${chatHistory.length} chat messages to user ${userId}`);
        socket.emit('chat-history', chatHistory);
      } catch (error) {
        logger.error(`Failed to load chat history: ${error.message}`);
      }

      logger.info(`User ${userId} joined chat for session ${sessionId}`);
    } catch (error) {
      logger.error(`Error joining chat: ${error.message}`);
      socket.emit('session-error', { message: 'Failed to join chat' });
    }
  }

  private handleWebRTCOffer(socket: AuthenticatedSocket, data: WebRTCOffer): void {
    const { offer, from, to } = data;
    
    // Forward offer to specific participant
    socket.to(data.to).emit('webrtc-offer', {
      offer,
      from: socket.userId,
      to,
    });

    logger.debug(`WebRTC offer forwarded from ${from} to ${to}`);
  }

  private handleWebRTCAnswer(socket: AuthenticatedSocket, data: WebRTCAnswer): void {
    const { answer, from, to } = data;
    
    // Forward answer to specific participant
    socket.to(data.to).emit('webrtc-answer', {
      answer,
      from: socket.userId,
      to,
    });

    logger.debug(`WebRTC answer forwarded from ${from} to ${to}`);
  }

  private handleWebRTCIceCandidate(socket: AuthenticatedSocket, data: WebRTCIceCandidate): void {
    const { candidate, from, to } = data;
    
    // Forward ICE candidate to specific participant
    socket.to(data.to).emit('webrtc-ice-candidate', {
      candidate,
      from: socket.userId,
      to,
    });

    logger.debug(`ICE candidate forwarded from ${from} to ${to}`);
  }

  private async handleSendChatMessage(socket: AuthenticatedSocket, data: SendChatMessageData): Promise<void> {
    try {
      logger.info(`Received chat message from socket ${socket.id}:`, data);
      
      const userSession = this.userSessions.get(socket.id);
      
      if (!userSession || !socket.sessionId) {
        logger.error(`User session not found for socket ${socket.id}. userSession:`, userSession, 'sessionId:', socket.sessionId);
        socket.emit('chat-error', { message: 'Not connected to chat session' });
        return;
      }

      const { sessionId, message } = data;
      const { userId, userName } = userSession;

      logger.info(`Processing message from ${userName} (${userId}) in session ${sessionId}`);

      // Validate message
      if (!message || message.trim().length === 0) {
        logger.warn('Empty message received, ignoring');
        return;
      }

      // Store message in database
      const savedMessage = await this.chatMessageService.createChatMessage({
        sessionId,
        userId,
        userName,
        message: message.trim(),
        type: 'text',
      });

      logger.info(`Message saved to database with ID: ${savedMessage._id}`);

      // Create chat message for broadcast
      const chatMessage: ChatMessage = {
        id: savedMessage._id,
        sessionId: savedMessage.sessionId,
        userId: savedMessage.userId,
        userName: savedMessage.userName,
        message: savedMessage.message,
        timestamp: savedMessage.timestamp,
        type: savedMessage.type,
      };

      // Broadcast message to all participants in the session (including sender)
      this.io.to(sessionId).emit('chat-message', chatMessage);

      logger.info(`Chat message broadcast to session ${sessionId} from ${userName}: ${message.substring(0, 50)}...`);
    } catch (error) {
      logger.error(`Error handling chat message: ${error.message}`);
      socket.emit('chat-error', { message: 'Failed to send message' });
    }
  }

  private async handleDisconnect(socket: AuthenticatedSocket): Promise<void> {
    try {
      if (socket.sessionId && socket.userId) {
        const userSession = this.userSessions.get(socket.id);
        
        await this.sessionService.removeParticipant(socket.sessionId, socket.userId);
        
        // Send system message for user disconnected
        if (userSession) {
          try {
            const savedSystemMessage = await this.chatMessageService.createChatMessage({
              sessionId: socket.sessionId,
              userId: 'system',
              userName: 'System',
              message: `${userSession.userName} left the meeting`,
              type: 'system',
            });

            const disconnectMessage: ChatMessage = {
              id: savedSystemMessage._id,
              sessionId: savedSystemMessage.sessionId,
              userId: savedSystemMessage.userId,
              userName: savedSystemMessage.userName,
              message: savedSystemMessage.message,
              timestamp: savedSystemMessage.timestamp,
              type: savedSystemMessage.type,
            };
            
            socket.to(socket.sessionId).emit('chat-message', disconnectMessage);
          } catch (error) {
            logger.error(`Failed to create disconnect system message: ${error.message}`);
          }
        }
        
        socket.to(socket.sessionId).emit('participant-left', { userId: socket.userId });
      }

      // Clean up user session
      this.userSessions.delete(socket.id);

      logger.info(`User ${socket.userId} disconnected`);
    } catch (error) {
      logger.error(`Error handling disconnect: ${error.message}`);
    }
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}