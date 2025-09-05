import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MicrophoneIcon, 
  VideoCameraIcon,
  PhoneXMarkIcon,
  ArrowLeftIcon,
  UserGroupIcon,
  ComputerDesktopIcon,
  ChatBubbleLeftIcon,
  HandRaisedIcon,
  EllipsisHorizontalIcon,
  Cog6ToothIcon,
  VideoCameraSlashIcon,
  PlayIcon,
  StopIcon
} from '@heroicons/react/24/outline';
import { 
  MicrophoneIcon as MicrophoneOffIcon, 
  VideoCameraIcon as VideoCameraOffIcon 
} from '@heroicons/react/24/solid';
import { ConnectionState } from 'livekit-client';
import { useAuth } from '../../hooks/useAuth';
import { useLiveKit } from '../../hooks/useLiveKit';
import { LiveKitVideoGrid } from '../video/LiveKitVideoGrid';
import { ChatPanel } from '../chat/ChatPanel';
import type { Session } from '../../types';
import sessionService from '../../services/sessionService';
import chatService from '../../services/chatService';
import api from '../../config/api';
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null);

  // LiveKit hook
  const {
    participants,
    localParticipant,
    connectionState,
    isConnecting,
    error: liveKitError,
    mediaDevices,
    isScreenSharing,
    joinSession,
    leaveSession,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
  } = useLiveKit(sessionId || '', user?._id || '');

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

  // Handle LiveKit errors
  useEffect(() => {
    if (liveKitError) {
      setError(liveKitError);
    }
  }, [liveKitError]);

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
    chatService.disconnect();
    setHasJoinedCall(false);
    
    // Navigate back to dashboard
    navigate('/dashboard');
  };

  // End session (educators only)
  const handleEndSession = async () => {
    if (!confirm('Are you sure you want to end this session for everyone?')) return;

    try {
      // Stop recording if active
      if (isRecording) {
        await handleStopRecording();
      }
      
      await sessionService.updateSessionStatus(sessionId!, 'ended');
      handleLeaveCall();
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  // Start recording
  const handleStartRecording = async () => {
    try {
      // Get display media for screen recording
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const recordedBlob = new Blob(chunks, { type: 'video/webm' });
        
        // Upload to server
        await uploadRecording(recordedBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start(1000); // Record in 1-second chunks
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingStartTime(new Date());
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError('Failed to start recording. Please check screen sharing permissions.');
    }
  };

  // Stop recording
  const handleStopRecording = async () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      setRecordingStartTime(null);
    }
  };

  // Upload recording to server
  const uploadRecording = async (recordingBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('recording', recordingBlob, `session-${sessionId}-${Date.now()}.webm`);
      formData.append('sessionId', sessionId!);
      formData.append('duration', recordingStartTime ? 
        Math.floor((Date.now() - recordingStartTime.getTime()) / 1000).toString() : '0'
      );

      const response = await api.post('/sessions/upload-recording', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Recording uploaded successfully:', response.data);
    } catch (error: any) {
      console.error('Failed to upload recording:', error);
      setError(error.response?.data?.message || 'Failed to save recording. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center">
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
      <div className="h-full bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">Session not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#1e1e1e] flex flex-col overflow-hidden">
      {/* Teams-style Header */}
      <div className="bg-[#292929] border-b border-[#3a3a3a] px-3 py-1.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-[#3a3a3a] transition-colors"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-[#6264a7] rounded flex items-center justify-center">
              <VideoCameraIcon className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <h1 className="text-xs font-medium text-white truncate max-w-48">{session.name}</h1>
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <span>{connectionState === ConnectionState.Connected ? participants.length + (localParticipant ? 1 : 0) : 0} people</span>
                {isScreenSharing && (
                  <>
                    <span>•</span>
                    <span className="text-[#6264a7] flex items-center space-x-1">
                      <ComputerDesktopIcon className="h-3 w-3" />
                      <span>You're presenting</span>
                    </span>
                  </>
                )}
                {isRecording && (
                  <>
                    <span>•</span>
                    <span className="text-red-500 flex items-center space-x-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span>Recording</span>
                    </span>
                  </>
                )}
                <span>•</span>
                <span className="truncate">{session.session_code}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {/* Teams-style top controls */}
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={clsx(
              'p-1.5 rounded transition-colors',
              isChatOpen 
                ? 'text-[#6264a7] bg-[#3a3a3a]' 
                : 'text-gray-400 hover:text-white hover:bg-[#3a3a3a]'
            )}
            title="Toggle chat"
          >
            <ChatBubbleLeftIcon className="h-3.5 w-3.5" />
          </button>
          <button className="p-1.5 text-gray-400 hover:text-white hover:bg-[#3a3a3a] rounded transition-colors">
            <UserGroupIcon className="h-3.5 w-3.5" />
          </button>
          <button className="p-1.5 text-gray-400 hover:text-white hover:bg-[#3a3a3a] rounded transition-colors">
            <EllipsisHorizontalIcon className="h-3.5 w-3.5" />
          </button>
          
          {/* End session button (educators only) */}
          {user?.role === 'educator' && hasJoinedCall && (
            <button
              onClick={handleEndSession}
              className="ml-1 px-2 py-1 bg-[#c4314b] text-white text-xs font-medium rounded hover:bg-[#a92e46] transition-colors"
            >
              End
            </button>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!hasJoinedCall ? (
          /* Teams-style Pre-join screen */
          <div className="flex-1 flex items-center justify-center bg-[#1e1e1e] p-4">
            <div className="max-w-md w-full mx-auto">
              {/* Preview area */}
              <div className="bg-[#292929] rounded-lg p-4 mb-4">
                <div className="aspect-video bg-[#3a3a3a] rounded-lg mb-3 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-[#6264a7] rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-lg font-semibold text-white">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs">Your camera is off</p>
                  </div>
                </div>
                
                {/* Pre-join controls */}
                <div className="flex items-center justify-center space-x-2">
                  <button className="p-2.5 bg-[#3a3a3a] hover:bg-[#4a4a4a] rounded-full transition-colors">
                    <MicrophoneOffIcon className="h-4 w-4 text-white" />
                  </button>
                  <button className="p-2.5 bg-[#3a3a3a] hover:bg-[#4a4a4a] rounded-full transition-colors">
                    <VideoCameraSlashIcon className="h-4 w-4 text-white" />
                  </button>
                  <button className="p-2.5 bg-[#3a3a3a] hover:bg-[#4a4a4a] rounded-full transition-colors">
                    <Cog6ToothIcon className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Meeting info */}
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold text-white mb-1 truncate">{session.name}</h2>
                <p className="text-gray-400 text-sm mb-0.5 truncate">
                  {typeof session.educator_id === 'object' 
                    ? `Hosted by ${session.educator_id.name}` 
                    : 'Meeting'}
                </p>
                <p className="text-gray-500 text-xs">ID: {session.session_code}</p>
              </div>

              {/* Join button */}
              <button
                onClick={handleJoinCall}
                disabled={isConnecting}
                className="w-full py-2.5 bg-[#6264a7] text-white rounded-lg hover:bg-[#5a5c9e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium text-sm"
              >
                {isConnecting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                    </svg>
                    Joining...
                  </>
                ) : (
                  'Join now'
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Teams-style Video call interface */
          <div className="flex-1 flex relative min-h-0">
            {/* Main video area */}
            <div className={clsx(
              'flex-1 flex flex-col relative min-h-0',
              isChatOpen && 'pr-80'
            )}>
              <div className="flex-1 p-2 pb-16 min-h-0">
                <LiveKitVideoGrid 
                  participants={participants}
                  localParticipant={localParticipant}
                />
              </div>
            </div>

            {/* Chat Panel */}
            {sessionId && (
              <ChatPanel
                sessionId={sessionId}
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
              />
            )}

            {/* Teams-style Control Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-[#292929] border-t border-[#3a3a3a] px-4 py-3 flex-shrink-0">
              <div className="flex items-center justify-between max-w-6xl mx-auto">
                {/* Left controls */}
                <div className="flex items-center space-x-2">
                  {/* Audio toggle */}
                  <button
                    onClick={toggleAudio}
                    className={clsx(
                      'p-2.5 rounded-full transition-colors relative',
                      mediaDevices.audio
                        ? 'bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white'
                        : 'bg-[#c4314b] hover:bg-[#a92e46] text-white'
                    )}
                    title={mediaDevices.audio ? 'Mute' : 'Unmute'}
                  >
                    {mediaDevices.audio ? (
                      <MicrophoneIcon className="h-4 w-4" />
                    ) : (
                      <MicrophoneOffIcon className="h-4 w-4" />
                    )}
                    {!mediaDevices.audio && (
                      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full" />
                    )}
                  </button>

                  {/* Video toggle */}
                  <button
                    onClick={toggleVideo}
                    className={clsx(
                      'p-2.5 rounded-full transition-colors relative',
                      mediaDevices.video
                        ? 'bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white'
                        : 'bg-[#c4314b] hover:bg-[#a92e46] text-white'
                    )}
                    title={mediaDevices.video ? 'Turn off camera' : 'Turn on camera'}
                  >
                    {mediaDevices.video ? (
                      <VideoCameraIcon className="h-4 w-4" />
                    ) : (
                      <VideoCameraOffIcon className="h-4 w-4" />
                    )}
                    {!mediaDevices.video && (
                      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full" />
                    )}
                  </button>

                  {/* MS Teams-style Screen share toggle */}
                  <button
                    onClick={toggleScreenShare}
                    className={clsx(
                      'p-2.5 rounded-full transition-colors relative group',
                      isScreenSharing
                        ? 'bg-[#6264a7] hover:bg-[#5a5c9e] text-white'
                        : 'bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white'
                    )}
                    title={isScreenSharing ? 'Stop presenting' : 'Share content'}
                  >
                    <ComputerDesktopIcon className="h-4 w-4" />
                    {isScreenSharing && (
                      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#6264a7] rounded-full animate-pulse" />
                    )}
                    
                    {/* MS Teams-style tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {isScreenSharing ? 'Stop presenting' : 'Share content'}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black"></div>
                    </div>
                  </button>
                </div>

                {/* Center controls */}
                <div className="flex items-center space-x-2">
                  <button className="p-2.5 bg-[#3a3a3a] hover:bg-[#4a4a4a] rounded-full text-white transition-colors">
                    <HandRaisedIcon className="h-4 w-4" />
                  </button>
                  
                  {/* Recording button (educators only) */}
                  {user?.role === 'educator' && (
                    <button
                      onClick={isRecording ? handleStopRecording : handleStartRecording}
                      className={clsx(
                        'p-2.5 rounded-full text-white transition-colors relative group',
                        isRecording
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-[#3a3a3a] hover:bg-[#4a4a4a]'
                      )}
                      title={isRecording ? 'Stop recording' : 'Start recording'}
                    >
                      {isRecording ? (
                        <StopIcon className="h-4 w-4" />
                      ) : (
                        <PlayIcon className="h-4 w-4" />
                      )}
                      {isRecording && (
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                      )}
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {isRecording ? 'Stop recording' : 'Start recording'}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black"></div>
                      </div>
                    </button>
                  )}
                  <button 
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className={clsx(
                      'p-2.5 rounded-full text-white transition-colors',
                      isChatOpen
                        ? 'bg-[#6264a7] hover:bg-[#5a5c9e]'
                        : 'bg-[#3a3a3a] hover:bg-[#4a4a4a]'
                    )}
                    title="Toggle chat"
                  >
                    <ChatBubbleLeftIcon className="h-4 w-4" />
                  </button>
                  <button className="p-2.5 bg-[#3a3a3a] hover:bg-[#4a4a4a] rounded-full text-white transition-colors">
                    <UserGroupIcon className="h-4 w-4" />
                  </button>
                  <button className="p-2.5 bg-[#3a3a3a] hover:bg-[#4a4a4a] rounded-full text-white transition-colors">
                    <EllipsisHorizontalIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Right controls */}
                <div className="flex items-center">
                  {/* Leave call */}
                  <button
                    onClick={handleLeaveCall}
                    className="px-3 py-2 bg-[#c4314b] hover:bg-[#a92e46] rounded text-white text-xs font-medium transition-colors flex items-center space-x-1.5"
                    title="Leave"
                  >
                    <PhoneXMarkIcon className="h-3.5 w-3.5" />
                    <span>Leave</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


export default VideoSession;