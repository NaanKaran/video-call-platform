import { io, Socket } from 'socket.io-client';
import type { SocketEvents } from '../types';
import config from '../config/environment';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  // Connect to socket server
  connect(userId: string): void {
    if (this.socket?.connected) return;

    this.socket = io(config.SOCKET_BASE_URL, {
      auth: {
        userId,
        token: localStorage.getItem('token'),
      },
      transports: ['websocket', 'polling'], // Ensure both transports are allowed
    });

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  // Disconnect from socket server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Join a room (session)
  joinRoom(sessionId: string, userId: string): void {
    if (this.socket) {
      this.socket.emit('join-room', { sessionId, userId });
    }
  }

  // Leave a room (session)
  leaveRoom(sessionId: string, userId: string): void {
    if (this.socket) {
      this.socket.emit('leave-room', { sessionId, userId });
    }
  }

  // Send WebRTC offer
  sendOffer(offer: RTCSessionDescriptionInit, targetUserId: string): void {
    if (this.socket) {
      this.socket.emit('offer', { offer, userId: targetUserId });
    }
  }

  // Send WebRTC answer
  sendAnswer(answer: RTCSessionDescriptionInit, targetUserId: string): void {
    if (this.socket) {
      this.socket.emit('answer', { answer, userId: targetUserId });
    }
  }

  // Send ICE candidate
  sendIceCandidate(candidate: RTCIceCandidate, targetUserId: string): void {
    if (this.socket) {
      this.socket.emit('ice-candidate', { candidate, userId: targetUserId });
    }
  }

  // Toggle video status
  toggleVideo(userId: string, enabled: boolean): void {
    if (this.socket) {
      this.socket.emit('toggle-video', { userId, enabled });
    }
  }

  // Toggle audio status
  toggleAudio(userId: string, enabled: boolean): void {
    if (this.socket) {
      this.socket.emit('toggle-audio', { userId, enabled });
    }
  }

  // Listen for events
  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  // Remove event listeners
  off<K extends keyof SocketEvents>(event: K, callback?: SocketEvents[K]): void {
    if (this.socket) {
      this.socket.off(event, callback as any);
    }
  }

  // Check if connected
  isSocketConnected(): boolean {
    return this.isConnected;
  }

  // Get socket instance
  getSocket(): Socket | null {
    return this.socket;
  }
}

export default new SocketService();