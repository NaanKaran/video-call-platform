import { Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  sessionId?: string;
  userRole?: 'educator' | 'child';
}

export interface WebRTCOffer {
  offer: RTCSessionDescriptionInit;
  from: string;
  to: string;
}

export interface WebRTCAnswer {
  answer: RTCSessionDescriptionInit;
  from: string;
  to: string;
}

export interface WebRTCIceCandidate {
  candidate: RTCIceCandidateInit;
  from: string;
  to: string;
}

export interface JoinRoomData {
  sessionId: string;
  userId: string;
  userName: string;
  userRole: 'educator' | 'child';
}

export interface LeaveRoomData {
  sessionId: string;
  userId: string;
}

export interface ParticipantInfo {
  userId: string;
  userName: string;
  userRole: 'educator' | 'child';
  isConnected: boolean;
  joinedAt: Date;
}