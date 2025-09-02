// User types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'educator' | 'child';
  createdAt?: string;
  updatedAt?: string;
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role: 'educator' | 'child';
}

export interface AuthResponse {
  data: {
    user: User;
    token: string;
  };
  message: string;
}

// Session types
export interface Session {
  _id: string;
  name: string;
  session_code: string;
  educator_id: string | User;
  participants: (string | User)[];
  scheduled_time: string;
  duration: number;
  status: 'scheduled' | 'active' | 'ended';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSessionData {
  name: string;
  scheduled_time: string;
  duration?: number;
}

export interface JoinSessionData {
  session_code: string;
}

// WebRTC types
export interface MediaDevices {
  video: boolean;
  audio: boolean;
}

export interface Participant {
  userId: string;
  name: string;
  stream?: MediaStream;
  videoEnabled: boolean;
  audioEnabled: boolean;
}

// Socket events
export interface SocketEvents {
  // Room events
  'join-room': (data: { sessionId: string; userId: string }) => void;
  'leave-room': (data: { sessionId: string; userId: string }) => void;
  'user-joined': (data: { userId: string; name: string }) => void;
  'user-left': (data: { userId: string }) => void;
  
  // WebRTC signaling
  'offer': (data: { offer: RTCSessionDescriptionInit; userId: string }) => void;
  'answer': (data: { answer: RTCSessionDescriptionInit; userId: string }) => void;
  'ice-candidate': (data: { candidate: RTCIceCandidate; userId: string }) => void;
  
  // Media controls
  'toggle-video': (data: { userId: string; enabled: boolean }) => void;
  'toggle-audio': (data: { userId: string; enabled: boolean }) => void;
}

// API Response types
export interface ApiResponse<T = any> {
  data: T;
  message: string;
}

export interface ApiError {
  message: string;
  status: number;
}