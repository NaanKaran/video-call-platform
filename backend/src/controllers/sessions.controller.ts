import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { Session } from '@interfaces/sessions.interface';
import { SessionService } from '@services/sessions.service';
import { CreateSessionDto, JoinSessionDto } from '@dtos/sessions.dto';

export class SessionsController {
  public session = Container.get(SessionService);

  public getSessions = async (req: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { role, userId } = req.user;
      let findAllSessionsData: Session[];

      if (role === 'educator') {
        findAllSessionsData = await this.session.findSessionsByEducator(userId);
      } else {
        findAllSessionsData = await this.session.findSessionsByParticipant(userId);
      }

      response.status(200).json({ data: findAllSessionsData, message: 'findAll' });
    } catch (error) {
      next(error);
    }
  };

  public getSessionById = async (req: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId: string = req.params.id;
      const findOneSessionData: Session = await this.session.findSessionById(sessionId);

      response.status(200).json({ data: findOneSessionData, message: 'findOne' });
    } catch (error) {
      next(error);
    }
  };

  public getSessionByCode = async (req: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionCode: string = req.params.code;
      const findSessionData: Session = await this.session.findSessionByCode(sessionCode);

      response.status(200).json({ data: findSessionData, message: 'findByCode' });
    } catch (error) {
      next(error);
    }
  };

  public createSession = async (req: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionData: CreateSessionDto = req.body;
      const { userId, role } = req.user;

      if (role !== 'educator') {
        response.status(403).json({ message: 'Only educators can create sessions' });
        return;
      }

      const createSessionData: Session = await this.session.createSession(userId, sessionData);

      response.status(201).json({ data: createSessionData, message: 'created' });
    } catch (error) {
      next(error);
    }
  };

  public joinSession = async (req: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const joinData: JoinSessionDto = req.body;
      const { userId } = req.user;

      const joinedSessionData: Session = await this.session.joinSession(userId, joinData);

      response.status(200).json({ data: joinedSessionData, message: 'joined' });
    } catch (error) {
      next(error);
    }
  };

  public updateSessionStatus = async (req: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId: string = req.params.id;
      const { status } = req.body;
      const { userId, role } = req.user;

      // Check if user is the educator of this session
      const session = await this.session.findSessionById(sessionId);
      if (role !== 'educator' || session.educator_id["_id"]?.toString() !== userId) {
        response.status(403).json({ message: 'Not authorized to update this session' });
        return;
      }

      const updateSessionData: Session = await this.session.updateSessionStatus(sessionId, status);

      response.status(200).json({ data: updateSessionData, message: 'updated' });
    } catch (error) {
      next(error);
    }
  };

  public deleteSession = async (req: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId: string = req.params.id;
      const { userId } = req.user;

      const deleteSessionData: Session = await this.session.deleteSession(sessionId, userId);

      response.status(200).json({ data: deleteSessionData, message: 'deleted' });
    } catch (error) {
      next(error);
    }
  };
}