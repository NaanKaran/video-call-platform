import { Service } from 'typedi';
import { 
  AccessToken, 
  RoomServiceClient, 
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
  AzureBlobUpload,
  EncodingOptionsPreset,
  RoomCompositeEgressRequest
} from 'livekit-server-sdk';
import { LIVEKIT_API_KEY, LIVEKIT_SECRET_KEY, LIVEKIT_WS_URL, AZURE_STORAGE_CONNECTION_STRING, AZURE_STORAGE_CONTAINER_NAME } from '@config';
import { logger } from '@utils/logger';

export interface LiveKitTokenParams {
  roomName: string;
  participantName: string;
  participantId: string;
}

@Service()
export class LiveKitService {
  private roomService: RoomServiceClient;
  private egressClient: EgressClient;

  constructor() {
    const wsUrl = LIVEKIT_WS_URL || '';
    const apiKey = LIVEKIT_API_KEY || '';
    const secretKey = LIVEKIT_SECRET_KEY || '';
    
    logger.info(`Initializing LiveKit clients with server: ${wsUrl}`);
    
    this.roomService = new RoomServiceClient(wsUrl, apiKey, secretKey);
    this.egressClient = new EgressClient(wsUrl, apiKey, secretKey);
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

  public async startRecording(roomName: string, outputFilename?: string): Promise<{ egressId: string; filename: string }> {
    try {
      logger.info(`Starting recording for room: ${roomName} using LiveKit Node.js SDK`);
      
      const filename = outputFilename || `session-${roomName}-${Date.now()}.mp4`;
      
      // Create the encoded file output with proper Azure Blob structure
      let fileOutput: EncodedFileOutput;
      
      if (AZURE_STORAGE_CONNECTION_STRING && AZURE_STORAGE_CONTAINER_NAME) {
        // Use Azure Blob storage with proper case/value structure
        fileOutput = new EncodedFileOutput({
          fileType: EncodedFileType.MP4,
          filepath: filename,
          output: {
            case: 'azure',
            value: {
              accountName: this.extractAccountNameFromConnectionString(AZURE_STORAGE_CONNECTION_STRING),
              accountKey: this.extractAccountKeyFromConnectionString(AZURE_STORAGE_CONNECTION_STRING),
              containerName: AZURE_STORAGE_CONTAINER_NAME,
            },
          },
        });
        logger.info(`Recording will be saved to Azure Blob container: ${AZURE_STORAGE_CONTAINER_NAME}`);
      } else {
        // Use local file storage
        fileOutput = new EncodedFileOutput({
          fileType: EncodedFileType.MP4,
          filepath: filename,
        });
        logger.info(`Recording will be saved to local storage: ${filename}`);
      }

      // Create outputs object using the newer API format
      const outputs = {
        file: fileOutput,
      };

      logger.info('Egress outputs object:', JSON.stringify(outputs, null, 2));

      // Start room composite egress using the newer method signature
      const egressInfo = await this.egressClient.startRoomCompositeEgress(roomName, outputs, {
        layout: 'grid',
        encodingOptions: EncodingOptionsPreset.H264_720P_30,
        audioOnly: false,
      });
      
      logger.info(`Started LiveKit recording for room ${roomName}, egress ID: ${egressInfo.egressId}`);
      
      return {
        egressId: egressInfo.egressId,
        filename
      };
    } catch (error: any) {
      logger.error(`Failed to start LiveKit recording:`, {
        message: error.message,
        stack: error.stack,
        details: error.details || error.response || error,
      });
      throw error;
    }
  }

  public async stopRecording(egressId: string): Promise<void> {
    try {
      logger.info(`Stopping recording with egress ID: ${egressId}`);
      
      await this.egressClient.stopEgress(egressId);
      logger.info(`Stopped LiveKit recording: ${egressId}`);
    } catch (error: any) {
      logger.error(`Failed to stop LiveKit recording: ${error.message}`);
      throw error;
    }
  }

  public async getRecordingStatus(egressId: string) {
    try {
      logger.info(`Getting recording status for egress ID: ${egressId}`);
      
      const egressInfo = await this.egressClient.listEgress({ egressId });
      return egressInfo;
    } catch (error: any) {
      logger.error(`Failed to get recording status: ${error.message}`);
      throw error;
    }
  }

  private extractAccountNameFromConnectionString(connectionString: string): string {
    const accountNameMatch = connectionString.match(/AccountName=([^;]+)/);
    return accountNameMatch ? accountNameMatch[1] : '';
  }

  private extractAccountKeyFromConnectionString(connectionString: string): string {
    const accountKeyMatch = connectionString.match(/AccountKey=([^;]+)/);
    return accountKeyMatch ? accountKeyMatch[1] : '';
  }
}