import { Router } from 'express';
import { SessionsController } from '@controllers/sessions.controller';
import { CreateSessionDto, JoinSessionDto } from '@dtos/sessions.dto';
import { Routes } from '@interfaces/routes.interface';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { AuthMiddleware } from '@middlewares/auth.middleware';

export class SessionsRoute implements Routes {
  public path = '/sessions';
  public router = Router();
  public session = new SessionsController();

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
  }
}