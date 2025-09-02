import { model, Schema, Document } from 'mongoose';
import { Session } from '@interfaces/sessions.interface';

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
  },
  {
    timestamps: true,
  },
);

export const SessionModel = model<Session & Document>('Session', SessionSchema);