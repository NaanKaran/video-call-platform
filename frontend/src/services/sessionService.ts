import api from '../config/api';
import type { Session, CreateSessionData, JoinSessionData, ApiResponse } from '../types';

class SessionService {
  // Get all sessions (filtered by user role)
  async getSessions(): Promise<Session[]> {
    const response = await api.get<ApiResponse<Session[]>>('/sessions');
    return response.data.data;
  }

  // Get session by ID
  async getSessionById(sessionId: string): Promise<Session> {
    const response = await api.get<ApiResponse<Session>>(`/sessions/${sessionId}`);
    return response.data.data;
  }

  // Get session by code
  async getSessionByCode(sessionCode: string): Promise<Session> {
    const response = await api.get<ApiResponse<Session>>(`/sessions/code/${sessionCode}`);
    return response.data.data;
  }

  // Create new session (educators only)
  async createSession(sessionData: CreateSessionData): Promise<Session> {
    const response = await api.post<ApiResponse<Session>>('/sessions', sessionData);
    return response.data.data;
  }

  // Join session by code
  async joinSession(joinData: JoinSessionData): Promise<Session> {
    const response = await api.post<ApiResponse<Session>>('/sessions/join', joinData);
    return response.data.data;
  }

  // Update session status
  async updateSessionStatus(sessionId: string, status: 'scheduled' | 'active' | 'ended'): Promise<Session> {
    const response = await api.patch<ApiResponse<Session>>(`/sessions/${sessionId}/status`, { status });
    return response.data.data;
  }

  // Delete session
  async deleteSession(sessionId: string): Promise<void> {
    await api.delete(`/sessions/${sessionId}`);
  }
}

export default new SessionService();