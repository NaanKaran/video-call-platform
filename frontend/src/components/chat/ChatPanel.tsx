import React, { useState, useEffect, useRef } from 'react';
import { PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import chatService from '../../services/chatService';
import chatApiService from '../../services/chatApiService';
import { useAuth } from '../../hooks/useAuth';
import type { ChatMessage } from '../../types';

interface ChatPanelProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ sessionId, isOpen, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load chat history from backend API
  const loadChatHistory = async () => {
    if (!sessionId) return;
    
    setIsLoadingHistory(true);
    try {
      const history = await chatApiService.getChatHistory(sessionId, 50);
      console.log('Loaded chat history:', history);
      setMessages(history);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Initialize chat service and load existing messages
  useEffect(() => {
    if (isOpen && user && !isInitialized) {
      console.log('Initializing chat for session:', sessionId);
      
      // Load chat history first
      loadChatHistory();
      
      // Initialize socket connection
      chatService.initializeSocket(sessionId, user._id, user.name);
      setIsInitialized(true);

      // Subscribe to new messages
      const unsubscribe = chatService.onMessage((message: ChatMessage) => {
        console.log('Received new message:', message);
        setMessages(prev => {
          // Replace optimistic message with real message, or add new message
          const existingIndex = prev.findIndex(msg => 
            msg.id === message.id || // Same ID (real message)
            (msg.id.startsWith('temp-') && msg.message === message.message && msg.userId === message.userId) // Optimistic message to replace
          );
          
          if (existingIndex !== -1) {
            // Replace existing message (optimistic -> real)
            const newMessages = [...prev];
            newMessages[existingIndex] = message;
            return newMessages;
          }
          
          // Add new message if not found
          return [...prev, message];
        });
      });

      // Subscribe to chat history from socket (real-time)
      const unsubscribeHistory = chatService.onHistoryLoaded((history: ChatMessage[]) => {
        console.log('Received chat history from socket:', history);
        if (history.length > 0) {
          setMessages(history);
        }
      });

      return () => {
        unsubscribe();
        unsubscribeHistory();
      };
    }
  }, [isOpen, sessionId, user, isInitialized]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle sending message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;

    // Create optimistic message to show immediately
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`, // Temporary ID
      sessionId,
      userId: user._id,
      userName: user.name,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      type: 'text',
    };

    // Add message optimistically to UI
    setMessages(prev => [...prev, optimisticMessage]);

    // Send message via socket
    chatService.sendMessage(sessionId, newMessage);
    setNewMessage('');
  };

  // Handle key press (Enter to send, Shift+Enter for new line)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Check if message is from current user
  const isOwnMessage = (message: ChatMessage): boolean => {
    return message.userId === user?._id;
  };

  // Render messages content based on state
  const renderMessagesContent = () => {
    if (isLoadingHistory) {
      return (
        <div className="text-center text-gray-400 text-sm mt-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto mb-2"></div>
          <p>Loading chat history...</p>
        </div>
      );
    }

    if (messages.length === 0) {
      return (
        <div className="text-center text-gray-400 text-sm mt-8">
          <div className="mb-2">💬</div>
          <p>No messages yet</p>
          <p className="text-xs mt-1">Send a message to start the conversation</p>
        </div>
      );
    }

    return (
      <>
        {messages.map((message) => (
          <div key={message.id}>
            {message.type === 'system' ? (
              <div className="text-center">
                <span className="text-xs text-gray-400 bg-[#3a3a3a] px-2 py-1 rounded">
                  {message.message}
                </span>
              </div>
            ) : (
              <div
                className={clsx(
                  'flex flex-col',
                  isOwnMessage(message) ? 'items-end' : 'items-start'
                )}
              >
                <div
                  className={clsx(
                    'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                    isOwnMessage(message)
                      ? 'bg-[#6264a7] text-white'
                      : 'bg-[#3a3a3a] text-white'
                  )}
                >
                  {!isOwnMessage(message) && (
                    <div className="text-xs text-gray-300 mb-1 font-medium">
                      {message.userName}
                    </div>
                  )}
                  <div className="break-words">{message.message}</div>
                </div>
                <div className="text-xs text-gray-500 mt-1 px-1">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#292929] border-l border-[#3a3a3a] flex flex-col z-10">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#3a3a3a]">
        <h3 className="text-white font-medium text-sm">Meeting chat</h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white hover:bg-[#3a3a3a] rounded transition-colors"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {renderMessagesContent()}
      </div>

      {/* Message Input */}
      <div className="p-3 border-t border-[#3a3a3a]">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyUp={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-3 py-2 bg-[#3a3a3a] text-white text-sm border border-[#4a4a4a] rounded-lg focus:outline-none focus:border-[#6264a7] resize-none"
              maxLength={500}
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              newMessage.trim()
                ? 'bg-[#6264a7] hover:bg-[#5a5c9e] text-white'
                : 'bg-[#3a3a3a] text-gray-500 cursor-not-allowed'
            )}
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        </form>
        <div className="text-xs text-gray-500 mt-1">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};