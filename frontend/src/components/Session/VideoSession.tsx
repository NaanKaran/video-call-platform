import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MicrophoneIcon, 
  VideoCameraIcon,
  PhoneXMarkIcon,
  ArrowLeftIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { 
  MicrophoneIcon as MicrophoneOffIcon, 
  VideoCameraIcon as VideoCameraOffIcon 
} from '@heroicons/react/24/solid';
import { useAuth } from '../../hooks/useAuth';
import { useWebRTC } from '../../hooks/useWebRTC';
import { Session, Participant } from '../../types';
import sessionService from '../../services/sessionService';
import socketService from '../../services/socketService';
import { clsx } from 'clsx';

// Video session component for conducting video calls
const VideoSession: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasJoinedCall, setHasJoinedCall] = useState(false);

  // WebRTC hook
  const {
    participants,
    localStream,
    localVideoRef,
    mediaDevices,
    isConnecting,
    joinSession,
    leaveSession,
    toggleVideo,
    toggleAudio,
  } = useWebRTC(sessionId || '', user?._id || '');

  // Load session details
  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId) {
        setError('Session ID not provided');
        setLoading(false);
        return;
      }

      try {
        const sessionData = await sessionService.getSessionById(sessionId);
        setSession(sessionData);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId]);

  // Connect to socket when component mounts
  useEffect(() => {
    if (user?._id) {
      socketService.connect(user._id);
    }

    return () => {
      socketService.disconnect();
    };
  }, [user]);

  // Join the video call
  const handleJoinCall = async () => {
    try {
      await joinSession();
      setHasJoinedCall(true);
      
      // Update session status to active if user is educator
      if (user?.role === 'educator' && session?.status === 'scheduled') {
        await sessionService.updateSessionStatus(sessionId!, 'active');
        setSession(prev => prev ? { ...prev, status: 'active' } : null);
      }
    } catch (error) {
      console.error('Failed to join call:', error);
      setError('Failed to access camera/microphone. Please check your permissions.');
    }
  };

  // Leave the video call
  const handleLeaveCall = async () => {
    leaveSession();
    setHasJoinedCall(false);
    
    // Navigate back to dashboard
    navigate('/dashboard');
  };

  // End session (educators only)
  const handleEndSession = async () => {
    if (!confirm('Are you sure you want to end this session for everyone?')) return;

    try {
      await sessionService.updateSessionStatus(sessionId!, 'ended');
      handleLeaveCall();
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-600 rounded-full p-3 mx-auto w-16 h-16 flex items-center justify-center mb-4">
            <PhoneXMarkIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Session Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">Session not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            
            <div>
              <h1 className="text-lg font-semibold text-white">{session.name}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>Code: {session.session_code}</span>
                <div className="flex items-center space-x-1">
                  <UserGroupIcon className="h-4 w-4" />
                  <span>{participants.length + (hasJoinedCall ? 1 : 0)} participants</span>
                </div>
                <span className={clsx(
                  'px-2 py-1 text-xs font-medium rounded-full',
                  session.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'
                )}>
                  {session.status}
                </span>
              </div>
            </div>
          </div>

          {/* End session button (educators only) */}
          {user?.role === 'educator' && hasJoinedCall && (
            <button
              onClick={handleEndSession}
              className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              End Session
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4">
        {!hasJoinedCall ? (
          /* Pre-join screen */
          <div className="max-w-md mx-auto mt-16">
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                  <VideoCameraIcon className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Ready to join?</h2>
                <p className="text-gray-400">
                  Click the button below to join the video session
                </p>
              </div>

              <div className="space-y-4">
                <div className="text-sm text-gray-400">
                  <p><strong>Session:</strong> {session.name}</p>
                  <p><strong>Educator:</strong> {
                    typeof session.educator_id === 'object' 
                      ? session.educator_id.name 
                      : 'Educator'
                  }</p>
                  <p><strong>Your name:</strong> {user?.name}</p>
                </div>

                <button
                  onClick={handleJoinCall}
                  disabled={isConnecting}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isConnecting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                      </svg>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <VideoCameraIcon className="h-5 w-5 mr-2" />
                      Join Video Call
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Video call interface */
          <div className="h-full flex flex-col">
            {/* Video grid */}
            <div className="flex-1 mb-4">
              <VideoGrid 
                localVideoRef={localVideoRef}
                localStream={localStream}
                participants={participants}
                currentUser={user}
                mediaDevices={mediaDevices}
              />
            </div>

            {/* Controls */}
            <div className="flex justify-center">
              <div className="flex items-center space-x-4 bg-gray-800 rounded-lg px-6 py-3">
                {/* Audio toggle */}
                <button
                  onClick={toggleAudio}
                  className={clsx(
                    'p-3 rounded-full transition-colors',
                    mediaDevices.audio
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  )}
                  title={mediaDevices.audio ? 'Mute microphone' : 'Unmute microphone'}
                >
                  {mediaDevices.audio ? (
                    <MicrophoneIcon className="h-5 w-5" />
                  ) : (
                    <MicrophoneOffIcon className="h-5 w-5" />
                  )}
                </button>

                {/* Video toggle */}
                <button
                  onClick={toggleVideo}
                  className={clsx(
                    'p-3 rounded-full transition-colors',
                    mediaDevices.video
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  )}
                  title={mediaDevices.video ? 'Turn off camera' : 'Turn on camera'}
                >
                  {mediaDevices.video ? (
                    <VideoCameraIcon className="h-5 w-5" />
                  ) : (
                    <VideoCameraOffIcon className="h-5 w-5" />
                  )}
                </button>

                {/* Leave call */}
                <button
                  onClick={handleLeaveCall}
                  className="p-3 bg-red-600 hover:bg-red-700 rounded-full text-white transition-colors"
                  title="Leave session"
                >
                  <PhoneXMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Video grid component
interface VideoGridProps {
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  localStream: MediaStream | null;
  participants: Participant[];
  currentUser: any;
  mediaDevices: { video: boolean; audio: boolean };
}

const VideoGrid: React.FC<VideoGridProps> = ({
  localVideoRef,
  localStream,
  participants,
  currentUser,
  mediaDevices,
}) => {
  const totalParticipants = participants.length + 1; // +1 for local user

  // Calculate grid layout
  const getGridLayout = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  return (
    <div className={clsx(
      'grid gap-4 h-full',
      getGridLayout(totalParticipants)
    )}>
      {/* Local user video */}
      <div className="relative bg-gray-800 rounded-lg overflow-hidden">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className={clsx(
            'w-full h-full object-cover',
            !mediaDevices.video && 'hidden'
          )}
        />
        
        {/* User info overlay */}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          {currentUser?.name} (You)
        </div>

        {/* Muted indicator */}
        {!mediaDevices.audio && (
          <div className="absolute top-2 right-2 bg-red-600 rounded-full p-1">
            <MicrophoneOffIcon className="h-4 w-4 text-white" />
          </div>
        )}

        {/* Video off placeholder */}
        {!mediaDevices.video && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-xl font-semibold text-white">
                  {currentUser?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-white text-sm">{currentUser?.name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Remote participants */}
      {participants.map((participant) => (
        <ParticipantVideo 
          key={participant.userId} 
          participant={participant}
        />
      ))}
    </div>
  );
};

// Individual participant video component
interface ParticipantVideoProps {
  participant: Participant;
}

const ParticipantVideo: React.FC<ParticipantVideoProps> = ({ participant }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Set video stream when participant stream changes
  React.useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={clsx(
          'w-full h-full object-cover',
          !participant.videoEnabled && 'hidden'
        )}
      />
      
      {/* User info overlay */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
        {participant.name}
      </div>

      {/* Muted indicator */}
      {!participant.audioEnabled && (
        <div className="absolute top-2 right-2 bg-red-600 rounded-full p-1">
          <MicrophoneOffIcon className="h-4 w-4 text-white" />
        </div>
      )}

      {/* Video off placeholder */}
      {!participant.videoEnabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl font-semibold text-white">
                {participant.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-white text-sm">{participant.name}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoSession;