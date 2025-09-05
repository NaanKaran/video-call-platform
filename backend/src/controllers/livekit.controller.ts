import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { LiveKitService } from '@services/livekit.service';
import { LIVEKIT_WS_URL } from '@config';

export class LiveKitController {
  public livekit = Container.get(LiveKitService);

  public generateToken = async (req: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const { userId, name } = req.user;

      if (!sessionId) {
        response.status(400).json({ message: 'Session ID is required' });
        return;
      }

      // Create room if it doesn't exist
      await this.livekit.createRoom(sessionId);

      // Generate access token
      const token = await this.livekit.generateAccessToken({
        roomName: sessionId,
        participantName: name || `User ${userId}`,
        participantId: userId,
      });

      response.status(200).json({
        data: {
          token,
          wsUrl: LIVEKIT_WS_URL,
          roomName: sessionId,
        },
        message: 'token_generated',
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteRoom = async (req: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const { role } = req.user;

      // Only educators can delete rooms
      if (role !== 'educator') {
        response.status(403).json({ message: 'Only educators can delete rooms' });
        return;
      }

      await this.livekit.deleteRoom(sessionId);
      
      response.status(200).json({
        message: 'room_deleted',
      });
    } catch (error) {
      next(error);
    }
  };

  public startRecording = async (req: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const { role } = req.user;

      // Only educators can start recordings
      if (role !== 'educator') {
        response.status(403).json({ message: 'Only educators can start recordings' });
        return;
      }

      const { filename } = req.body;
      const result = await this.livekit.startRecording(sessionId, filename);
      
      response.status(200).json({
        data: result,
        message: 'recording_started',
      });
    } catch (error) {
      next(error);
    }
  };

  public stopRecording = async (req: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { role } = req.user;

      // Only educators can stop recordings
      if (role !== 'educator') {
        response.status(403).json({ message: 'Only educators can stop recordings' });
        return;
      }

      const { egressId } = req.body;
      await this.livekit.stopRecording(egressId);
      
      response.status(200).json({
        message: 'recording_stopped',
      });
    } catch (error) {
      next(error);
    }
  };

  public getRecordingStatus = async (req: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { egressId } = req.params;
      const { role } = req.user;

      // Only educators can check recording status
      if (role !== 'educator') {
        response.status(403).json({ message: 'Only educators can check recording status' });
        return;
      }

      const status = await this.livekit.getRecordingStatus(egressId);
      
      response.status(200).json({
        data: status,
        message: 'recording_status_retrieved',
      });
    } catch (error) {
      next(error);
    }
  };
}