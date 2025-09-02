# MVP Plan: Create & Join Video Sessions

## Project Overview
Build a basic video calling platform where educators can create sessions and children can join them. This MVP focuses on core video functionality without AI features initially.

## Tech Stack
- **Frontend**: React with TypeScript
- **Backend**: Node.js/Express
- **Database**: MongoDB + Redis
- **Real-time**: Socket.io + WebRTC
- **Cloud**: Azure Blob Storage

## MVP Features (Phase 1)

### 1. User Authentication
- Simple login with email/password
- Two user types: **Educator** (host) and **Child** (participant)
- JWT token-based authentication

### 2. Session Management
- **Create Session**: Educator creates a session with:
  - Session name
  - Scheduled date/time
  - Unique session ID/link
- **Join Session**: Child joins using session ID or link
- Sessions stored in MongoDB

### 3. Video Calling
- **WebRTC** for peer-to-peer video/audio
- **Socket.io** for signaling server
- Basic controls: mute/unmute, camera on/off
- Simple grid view for participants

## Database Schema

### Sessions Collection (MongoDB)
```json
{
  "_id": "session_id",
  "name": "Math Session with John",
  "educator_id": "educator_123",
  "scheduled_time": "2025-09-15T10:00:00Z",
  "status": "scheduled|active|ended",
  "participants": ["child_456"],
  "created_at": "timestamp"
}
```

### Users Collection (MongoDB)
```json
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@email.com",
  "role": "educator|child",
  "password_hash": "hashed_password",
  "created_at": "timestamp"
}
```

### Active Sessions (Redis)
```json
{
  "session_123": {
    "participants": ["user1", "user2"],
    "status": "active",
    "started_at": "timestamp"
  }
}
```


## Key API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Sessions
- `POST /api/sessions` - Create session (educator only)
- `GET /api/sessions` - List sessions
- `POST /api/sessions/:id/join` - Join session
- `GET /api/sessions/:id` - Get session details

### WebSocket Events
- `create-room` - Educator creates room
- `join-room` - Participant joins
- `offer` - WebRTC offer signal
- `answer` - WebRTC answer signal
- `ice-candidate` - ICE candidate exchange

## Success Criteria
1. Educator can create a session in under 30 seconds
2. Child can join session using simple link/ID
3. Stable video/audio connection for 30+ minutes
4. Works on Chrome, Firefox, Safari, mobile
5. Responsive on desktop and tablet

## Next Phase (AI Integration)
After MVP completion, integrate TensorFlow.js and MediaPipe for:
- Attention tracking
- Emotion detection
- Basic behavior analysis

This MVP provides a solid foundation for the full AI-powered assessment platform.