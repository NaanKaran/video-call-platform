import { Router } from 'express';
import { SessionsController } from '@controllers/sessions.controller';
import { CreateSessionDto, JoinSessionDto } from '@dtos/sessions.dto';
import { Routes } from '@interfaces/routes.interface';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import multer from 'multer';

export class SessionsRoute implements Routes {
  public path = '/sessions';
  public router = Router();
  public session = new SessionsController();
  
  // Configure multer for file uploads
  private upload = multer({
    storage: multer.memoryStorage(), // Store files in memory for Azure upload
    limits: {
      fileSize: 500 * 1024 * 1024, // 500MB limit
    },
    fileFilter: (req, file, cb) => {
      // Only allow video files
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed'), false);
      }
    }
  });

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, AuthMiddleware, this.session.getSessions);
    this.router.get(`${this.path}/:id`, AuthMiddleware, this.session.getSessionById);
    this.router.get(`${this.path}/code/:code`, AuthMiddleware, this.session.getSessionByCode);
    this.router.post(`${this.path}`, AuthMiddleware, ValidationMiddleware(CreateSessionDto), this.session.createSession);
    this.router.post(`${this.path}/join`, AuthMiddleware, ValidationMiddleware(JoinSessionDto), this.session.joinSession);
    this.router.patch(`${this.path}/:id/status`, AuthMiddleware, this.session.updateSessionStatus);
    this.router.delete(`${this.path}/:id`, AuthMiddleware, this.session.deleteSession);
    
    // Recording routes
    this.router.post(`${this.path}/upload-recording`, AuthMiddleware, this.upload.single('recording'), this.session.uploadRecording);
    this.router.get(`${this.path}/:id/recordings`, AuthMiddleware, this.session.getSessionRecordings);
  }
}