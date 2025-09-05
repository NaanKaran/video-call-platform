export interface SessionRecording {
  fileName: string;
  url: string;
  duration: number;
  size: number;
  uploadedAt: Date;
}

export interface Session {
  _id?: string;
  name: string;
  educator_id: string;
  scheduled_time: Date;
  status: 'scheduled' | 'active' | 'ended';
  participants: string[];
  session_code: string;
  duration: number;
  recordings?: SessionRecording[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateSessionDto {
  name: string;
  scheduled_time: Date;
  duration?: number;
}

export interface JoinSessionDto {
  session_code: string;
}

export interface SessionParticipant {
  user_id: string;
  name: string;
  role: 'educator' | 'child';
  joined_at: Date;
  is_connected: boolean;
}