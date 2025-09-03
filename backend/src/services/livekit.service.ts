import { Service } from 'typedi';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { LIVEKIT_API_KEY, LIVEKIT_SECRET_KEY, LIVEKIT_WS_URL } from '@config';
import { logger } from '@utils/logger';

export interface LiveKitTokenParams {
  roomName: string;
  participantName: string;
  participantId: string;
}

@Service()
export class LiveKitService {
  private roomService: RoomServiceClient;

  constructor() {
    this.roomService = new RoomServiceClient(
      LIVEKIT_WS_URL || '',
      LIVEKIT_API_KEY || '',
      LIVEKIT_SECRET_KEY || ''
    );
  }

  public async generateAccessToken(params: LiveKitTokenParams): Promise<string> {
    try {
      const { roomName, participantName, participantId } = params;

      if (!LIVEKIT_API_KEY || !LIVEKIT_SECRET_KEY) {
        throw new Error('LiveKit API credentials not configured');
      }

      const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_SECRET_KEY, {
        identity: participantId,
        name: participantName,
      });

      token.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });

      const jwt = await token.toJwt();
      logger.info(`Generated LiveKit token for ${participantName} in room ${roomName}`);
      
      return jwt;
    } catch (error) {
      logger.error(`Failed to generate LiveKit token: ${error.message}`);
      throw error;
    }
  }

  public async createRoom(roomName: string): Promise<void> {
    try {
      await this.roomService.createRoom({
        name: roomName,
        maxParticipants: 50,
        emptyTimeout: 300, // 5 minutes
      });
      
      logger.info(`Created LiveKit room: ${roomName}`);
    } catch (error) {
      // Room might already exist, which is fine
      if (!error.message.includes('already exists')) {
        logger.error(`Failed to create LiveKit room: ${error.message}`);
        throw error;
      }
    }
  }

  public async deleteRoom(roomName: string): Promise<void> {
    try {
      await this.roomService.deleteRoom(roomName);
      logger.info(`Deleted LiveKit room: ${roomName}`);
    } catch (error) {
      logger.error(`Failed to delete LiveKit room: ${error.message}`);
      throw error;
    }
  }
}