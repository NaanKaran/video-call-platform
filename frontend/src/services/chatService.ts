import { io, Socket } from 'socket.io-client';
import type { ChatMessage, SendChatMessageData } from '../types';
import authService from './authService';

class ChatService {
  private socket: Socket | null = null;
  private chatMessages: ChatMessage[] = [];
  private messageCallbacks: ((message: ChatMessage) => void)[] = [];
  private historyCallbacks: ((messages: ChatMessage[]) => void)[] = [];

  // Initialize socket connection
  initializeSocket(sessionId: string, userId: string, userName: string): void {
    if (this.socket?.connected) {
      this.disconnect();
    }

    this.socket = io('http://localhost:3000', {
      auth: {
        token: authService.getToken(),
      },
    });

    this.setupSocketListeners();
    
    // Join the chat room once connected
    this.socket.on('connect', () => {
      this.socket!.emit('join-chat', { sessionId, userId, userName });
    });
  }

  // Setup socket event listeners
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Listen for incoming chat messages
    this.socket.on('chat-message', (message: ChatMessage) => {
      this.addMessage(message);
    });

    // Listen for chat history
    this.socket.on('chat-history', (messages: ChatMessage[]) => {
      this.chatMessages = messages;
      // Notify all registered history callbacks
      this.historyCallbacks.forEach(callback => {
        callback(messages);
      });
    });

    // Listen for chat errors
    this.socket.on('chat-error', (error: { message: string }) => {
      console.error('Chat error:', error.message);
    });

    // Listen for user joined/left events to show system messages
    this.socket.on('user-joined', (data: { userId: string; name: string }) => {
      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}-${data.userId}`,
        sessionId: '',
        userId: 'system',
        userName: 'System',
        message: `${data.name} joined the meeting`,
        timestamp: new Date().toISOString(),
        type: 'system',
      };
      this.addMessage(systemMessage);
    });

    this.socket.on('user-left', (data: { userId: string; name?: string }) => {
      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}-${data.userId}`,
        sessionId: '',
        userId: 'system',
        userName: 'System',
        message: `${data.name || 'User'} left the meeting`,
        timestamp: new Date().toISOString(),
        type: 'system',
      };
      this.addMessage(systemMessage);
    });

    // Handle connection events
    this.socket.on('connect', () => {
      console.log('Chat socket connected successfully');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Chat socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Chat socket connection error:', error);
    });

    // Listen for session errors
    this.socket.on('session-error', (error: { message: string }) => {
      console.error('Session error:', error.message);
    });
  }

  // Send a chat message
  sendMessage(sessionId: string, message: string): void {
    console.log('Attempting to send message:', message, 'to session:', sessionId);
    
    if (!this.socket?.connected) {
      console.error('Socket not connected, cannot send message');
      return;
    }

    const chatData: SendChatMessageData = {
      sessionId,
      message: message.trim(),
    };

    if (chatData.message) {
      console.log('Sending chat message via socket:', chatData);
      this.socket.emit('send-chat-message', chatData);
    } else {
      console.warn('Empty message, not sending');
    }
  }

  // Add message to local storage and notify callbacks
  private addMessage(message: ChatMessage): void {
    this.chatMessages.push(message);
    
    // Notify all registered callbacks
    this.messageCallbacks.forEach(callback => {
      callback(message);
    });
  }

  // Subscribe to new messages
  onMessage(callback: (message: ChatMessage) => void): () => void {
    this.messageCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.messageCallbacks.indexOf(callback);
      if (index > -1) {
        this.messageCallbacks.splice(index, 1);
      }
    };
  }

  // Subscribe to chat history loading
  onHistoryLoaded(callback: (messages: ChatMessage[]) => void): () => void {
    this.historyCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.historyCallbacks.indexOf(callback);
      if (index > -1) {
        this.historyCallbacks.splice(index, 1);
      }
    };
  }

  // Get all chat messages
  getMessages(): ChatMessage[] {
    return [...this.chatMessages];
  }

  // Clear chat messages
  clearMessages(): void {
    this.chatMessages = [];
  }

  // Disconnect socket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.clearMessages();
    this.messageCallbacks = [];
    this.historyCallbacks = [];
  }

  // Check if socket is connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default new ChatService();