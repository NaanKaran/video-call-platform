import { model, Schema, Document } from 'mongoose';

export interface ChatMessage extends Document {
  _id: string;
  sessionId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'system';
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    type: {
      type: String,
      enum: ['text', 'system'],
      default: 'text',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Index for efficient queries
ChatMessageSchema.index({ sessionId: 1, timestamp: 1 });

export const ChatMessageModel = model<ChatMessage>('ChatMessage', ChatMessageSchema);