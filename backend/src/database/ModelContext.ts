import { DatabaseConnectionManager } from './DatabaseConnectionManager';
import { User } from '@interfaces/users.interface';
import { Session } from '@interfaces/sessions.interface';
import { Document, Model } from 'mongoose';
import { Schema } from 'mongoose';

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

// Import schemas
const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['educator', 'child'],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const SessionSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    educator_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scheduled_time: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'ended'],
      default: 'scheduled',
    },
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    session_code: {
      type: String,
      required: true,
      unique: true,
    },
    duration: {
      type: Number,
      default: 60,
    },
    recordings: [{
      fileName: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      duration: {
        type: Number,
        default: 0,
      },
      size: {
        type: Number,
        required: true,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
  },
);

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

class ModelContext {
  private static instance: ModelContext;
  private userModel: Model<User & Document> | null = null;
  private sessionModel: Model<Session & Document> | null = null;
  private chatMessageModel: Model<ChatMessage & Document> | null = null;

  public static getInstance(): ModelContext {
    if (!ModelContext.instance) {
      ModelContext.instance = new ModelContext();
    }
    return ModelContext.instance;
  }

  public async getUserModel(): Promise<Model<User & Document>> {
    if (this.userModel) {
      return this.userModel;
    }

    const dbManager = DatabaseConnectionManager.getInstance();
    await dbManager.connect();

    this.userModel = dbManager.primaryDbConnection.model<User & Document>('User', UserSchema);
    return this.userModel;
  }

  public async getSessionModel(): Promise<Model<Session & Document>> {
    if (this.sessionModel) {
      return this.sessionModel;
    }

    const dbManager = DatabaseConnectionManager.getInstance();
    await dbManager.connect();

    this.sessionModel = dbManager.primaryDbConnection.model<Session & Document>('Session', SessionSchema);
    return this.sessionModel;
  }

  public async getChatMessageModel(): Promise<Model<ChatMessage & Document>> {
    if (this.chatMessageModel) {
      return this.chatMessageModel;
    }

    const dbManager = DatabaseConnectionManager.getInstance();
    await dbManager.connect();

    this.chatMessageModel = dbManager.primaryDbConnection.model<ChatMessage & Document>('ChatMessage', ChatMessageSchema);
    return this.chatMessageModel;
  }
}

export default ModelContext;