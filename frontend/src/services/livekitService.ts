import api from '../config/api';

export interface RecordingResponse {
  egressId: string;
  filename: string;
}

export interface RecordingStatus {
  egressId: string;
  status: string;
  roomName: string;
  startedAt?: number;
  endedAt?: number;
  error?: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
}

class LiveKitService {
  async startRecording(sessionId: string, filename?: string): Promise<RecordingResponse> {
    try {
      const response = await api.post<ApiResponse<RecordingResponse>>(
        `/livekit/recording/${sessionId}/start`,
        { filename }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      throw new Error(error.response?.data?.message || 'Failed to start recording');
    }
  }

  async stopRecording(egressId: string): Promise<void> {
    try {
      await api.post('/livekit/recording/stop', { egressId });
    } catch (error: any) {
      console.error('Failed to stop recording:', error);
      throw new Error(error.response?.data?.message || 'Failed to stop recording');
    }
  }

  async getRecordingStatus(egressId: string): Promise<RecordingStatus> {
    try {
      const response = await api.get<ApiResponse<RecordingStatus>>(
        `/livekit/recording/${egressId}/status`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get recording status:', error);
      throw new Error(error.response?.data?.message || 'Failed to get recording status');
    }
  }
}

export default new LiveKitService();