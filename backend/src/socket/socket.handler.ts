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
} from '@interfaces/socket.interface';
import { SessionService } from '@services/sessions.service';
import { Container } from 'typedi';
import jwt from 'jsonwebtoken';
import { SECRET_KEY } from '@config';

export class SocketHandler {
  private io: SocketIOServer;
  private sessionService: SessionService;

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.sessionService = Container.get(SessionService);
    this.initializeHandlers();
  }

  private initializeHandlers(): void {
    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));
  }

  private async authenticateSocket(socket: AuthenticatedSocket, next: any): Promise<void> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, SECRET_KEY) as any;
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      
      next();
    } catch (error) {
      logger.error(`Socket authentication error: ${error.message}`);
      next(new Error('Authentication error: Invalid token'));
    }
  }

  private handleConnection(socket: AuthenticatedSocket): void {
    logger.info(`User ${socket.userId} connected via socket`);

    socket.on('join-session', this.handleJoinSession.bind(this, socket));
    socket.on('leave-session', this.handleLeaveSession.bind(this, socket));
    socket.on('webrtc-offer', this.handleWebRTCOffer.bind(this, socket));
    socket.on('webrtc-answer', this.handleWebRTCAnswer.bind(this, socket));
    socket.on('webrtc-ice-candidate', this.handleWebRTCIceCandidate.bind(this, socket));
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
      
      await socket.leave(sessionId);
      await this.sessionService.removeParticipant(sessionId, userId);
      
      socket.to(sessionId).emit('participant-left', { userId });
      socket.sessionId = undefined;

      logger.info(`User ${userId} left session ${sessionId}`);
    } catch (error) {
      logger.error(`Error leaving session: ${error.message}`);
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

  private async handleDisconnect(socket: AuthenticatedSocket): Promise<void> {
    try {
      if (socket.sessionId && socket.userId) {
        await this.sessionService.removeParticipant(socket.sessionId, socket.userId);
        socket.to(socket.sessionId).emit('participant-left', { userId: socket.userId });
      }

      logger.info(`User ${socket.userId} disconnected`);
    } catch (error) {
      logger.error(`Error handling disconnect: ${error.message}`);
    }
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}