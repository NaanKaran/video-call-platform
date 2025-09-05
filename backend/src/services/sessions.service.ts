import { Service } from 'typedi';
import { HttpException } from '@exceptions/HttpException';
import { Session, SessionRecording } from '@interfaces/sessions.interface';
import { User } from '@interfaces/users.interface';
import { getSessionModel } from '@models/sessions.model';
import { getUserModel } from '@models/users.model';
import { CreateSessionDto, JoinSessionDto } from '@dtos/sessions.dto';
import { nanoid } from 'nanoid';
import { isEmpty } from '@utils/util';

@Service()
export class SessionService {
  public async findAllSessions(): Promise<Session[]> {
    const SessionModel = await getSessionModel();
    const sessions: Session[] = await SessionModel.find()
      .populate('educator_id', 'name email')
      .populate('participants', 'name email role');
    return sessions;
  }

  public async findSessionById(sessionId: string): Promise<Session> {
    if (isEmpty(sessionId)) throw new HttpException(400, 'Session ID is empty');

    const SessionModel = await getSessionModel();
    const findSession: Session = await SessionModel.findById(sessionId)
      .populate('educator_id', 'name email')
      .populate('participants', 'name email role').lean().exec();
    if (!findSession) throw new HttpException(409, 'Session not found');

    return findSession;
  }

  public async findSessionByCode(sessionCode: string): Promise<Session> {
    if (isEmpty(sessionCode)) throw new HttpException(400, 'Session code is empty');

    const SessionModel = await getSessionModel();
    const findSession: Session = await SessionModel.findOne({ session_code: sessionCode })
      .populate('educator_id', 'name email')
      .populate('participants', 'name email role');
    if (!findSession) throw new HttpException(409, 'Session not found');

    return findSession;
  }

  public async findSessionsByEducator(educatorId: string): Promise<Session[]> {
    if (isEmpty(educatorId)) throw new HttpException(400, 'Educator ID is empty');

    const SessionModel = await getSessionModel();
    const sessions: Session[] = await SessionModel.find({ educator_id: educatorId })
      .populate('educator_id', 'name email')
      .populate('participants', 'name email role')
      .sort({ scheduled_time: -1 });

    return sessions;
  }

  public async findSessionsByParticipant(participantId: string): Promise<Session[]> {
    if (isEmpty(participantId)) throw new HttpException(400, 'Participant ID is empty');

    const SessionModel = await getSessionModel();
    const sessions: Session[] = await SessionModel.find({ 
      participants: participantId,
      status: { $in: ['scheduled', 'active'] }
    })
      .populate('educator_id', 'name email')
      .populate('participants', 'name email role')
      .sort({ scheduled_time: -1 });

    return sessions;
  }

  public async createSession(educatorId: string, sessionData: CreateSessionDto): Promise<Session> {
    if (isEmpty(sessionData)) throw new HttpException(400, 'Session data is empty');

    const UserModel = await getUserModel();
    const SessionModel = await getSessionModel();
    
    // Verify educator exists
    const findEducator: User = await UserModel.findById(educatorId);
    if (!findEducator) throw new HttpException(409, 'Educator not found');
    if (findEducator.role !== 'educator') throw new HttpException(403, 'Only educators can create sessions');

    // Handle participant invitations by email
    let participantIds: string[] = [];
    if (sessionData.participant_emails && sessionData.participant_emails.length > 0) {
      const participantUsers: User[] = await UserModel.find({
        email: { $in: sessionData.participant_emails },
        role: 'child' // Only allow inviting children/students
      }).select('_id email');

      participantIds = participantUsers.map(user => user._id.toString());

      // Log which emails were not found (for debugging, can be removed in production)
      const foundEmails = participantUsers.map(user => user.email);
      const notFoundEmails = sessionData.participant_emails.filter(email => !foundEmails.includes(email));
      if (notFoundEmails.length > 0) {
        console.log(`Warning: The following emails were not found as registered users: ${notFoundEmails.join(', ')}`);
      }
    }

    // Generate unique session code
    let sessionCode: string;
    let isUnique = false;
    do {
      sessionCode = nanoid(8).toUpperCase();
      const existingSession = await SessionModel.findOne({ session_code: sessionCode });
      isUnique = !existingSession;
    } while (!isUnique);

    const createSessionData: Session = {
      ...sessionData,
      educator_id: educatorId,
      session_code: sessionCode,
      scheduled_time: new Date(sessionData.scheduled_time),
      duration: sessionData.duration || 60,
      participants: participantIds,
      status: 'scheduled',
    };

    const createdSession: Session = await SessionModel.create(createSessionData);
    
    // Populate the created session before returning
    const populatedSession: Session = await SessionModel.findById(createdSession._id)
      .populate('educator_id', 'name email')
      .populate('participants', 'name email role');
      
    return populatedSession;
  }

  public async joinSession(participantId: string, joinData: JoinSessionDto): Promise<Session> {
    if (isEmpty(joinData)) throw new HttpException(400, 'Join data is empty');

    const UserModel = await getUserModel();
    const SessionModel = await getSessionModel();
    
    // Verify participant exists
    const findParticipant: User = await UserModel.findById(participantId);
    if (!findParticipant) throw new HttpException(409, 'User not found');

    // Find session by code
    const findSession: Session = await this.findSessionByCode(joinData.session_code);
    
    // Check if session is active or scheduled
    if (findSession.status === 'ended') {
      throw new HttpException(400, 'Session has ended');
    }

    // Check if user is already a participant
    if (findSession.participants.includes(participantId)) {
      return findSession;
    }

    // Add participant to session
    const updatedSession: Session = await SessionModel.findByIdAndUpdate(
      findSession._id,
      { $addToSet: { participants: participantId } },
      { new: true }
    )
      .populate('educator_id', 'name email')
      .populate('participants', 'name email role');

    return updatedSession;
  }

  public async updateSessionStatus(sessionId: string, status: 'scheduled' | 'active' | 'ended'): Promise<Session> {
    if (isEmpty(sessionId)) throw new HttpException(400, 'Session ID is empty');

    const SessionModel = await getSessionModel();
    const updatedSession: Session = await SessionModel.findByIdAndUpdate(
      sessionId,
      { status },
      { new: true }
    )
      .populate('educator_id', 'name email')
      .populate('participants', 'name email role');

    if (!updatedSession) throw new HttpException(409, 'Session not found');

    return updatedSession;
  }

  public async addParticipant(sessionId: string, participantId: string): Promise<void> {
    const SessionModel = await getSessionModel();
    await SessionModel.findByIdAndUpdate(
      sessionId,
      { $addToSet: { participants: participantId } }
    );
  }

  public async removeParticipant(sessionId: string, participantId: string): Promise<void> {
    const SessionModel = await getSessionModel();
    await SessionModel.findByIdAndUpdate(
      sessionId,
      { $pull: { participants: participantId } }
    );
  }

  public async getSessionParticipants(sessionId: string): Promise<User[]> {
    const SessionModel = await getSessionModel();
    const session = await SessionModel.findById(sessionId)
      .populate('participants', 'name email role');
    
    if (!session) throw new HttpException(409, 'Session not found');
    
    return session.participants as unknown as User[];
  }

  public async deleteSession(sessionId: string, educatorId: string): Promise<Session> {
    if (isEmpty(sessionId)) throw new HttpException(400, 'Session ID is empty');

    const SessionModel = await getSessionModel();
    const findSession: Session = await SessionModel.findById(sessionId);
    if (!findSession) throw new HttpException(409, 'Session not found');
    if (findSession.educator_id !== educatorId) throw new HttpException(403, 'Not authorized to delete this session');

    const deletedSession: Session = await SessionModel.findByIdAndDelete(sessionId);
    return deletedSession;
  }

  public async addRecording(sessionId: string, recordingData: Omit<SessionRecording, '_id'>): Promise<Session> {
    if (isEmpty(sessionId)) throw new HttpException(400, 'Session ID is empty');

    const SessionModel = await getSessionModel();
    const updatedSession: Session = await SessionModel.findByIdAndUpdate(
      sessionId,
      { 
        $push: { 
          recordings: recordingData 
        } 
      },
      { new: true }
    )
      .populate('educator_id', 'name email')
      .populate('participants', 'name email role');

    if (!updatedSession) throw new HttpException(409, 'Session not found');

    return updatedSession;
  }

  public async getSessionRecordings(sessionId: string): Promise<SessionRecording[]> {
    if (isEmpty(sessionId)) throw new HttpException(400, 'Session ID is empty');

    const SessionModel = await getSessionModel();
    const session: Session = await SessionModel.findById(sessionId).select('recordings');
    
    if (!session) throw new HttpException(409, 'Session not found');
    
    return session.recordings || [];
  }
}