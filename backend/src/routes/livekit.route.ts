import { Router } from 'express';
import { LiveKitController } from '@controllers/livekit.controller';
import type { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@middlewares/auth.middleware';

export class LiveKitRoute implements Routes {
  public path = '/livekit';
  public router = Router();
  public livekit = new LiveKitController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/token/:sessionId`, AuthMiddleware, this.livekit.generateToken);
    this.router.delete(`${this.path}/room/:sessionId`, AuthMiddleware, this.livekit.deleteRoom);
    
    // Recording endpoints
    this.router.post(`${this.path}/recording/:sessionId/start`, AuthMiddleware, this.livekit.startRecording);
    this.router.post(`${this.path}/recording/stop`, AuthMiddleware, this.livekit.stopRecording);
    this.router.get(`${this.path}/recording/:egressId/status`, AuthMiddleware, this.livekit.getRecordingStatus);
  }
}