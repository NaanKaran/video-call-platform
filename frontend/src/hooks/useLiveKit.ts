import { useState, useEffect, useCallback } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  RemoteParticipant,
  LocalParticipant,
  Participant,
  TrackPublication,
  ConnectionState,
  DisconnectReason,
} from 'livekit-client';
import type { MediaDevices } from '../types';
import api from '../config/api';

interface LiveKitTokenResponse {
  token: string;
  wsUrl: string;
  roomName: string;
}

export const useLiveKit = (sessionId: string, userId: string) => {
  const [room] = useState(() => new Room());
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaDevices, setMediaDevices] = useState<MediaDevices>({
    video: true,
    audio: true,
  });

  // Update participants list
  const updateParticipants = useCallback(() => {
    const remoteParticipants = Array.from(room.remoteParticipants.values());
    // Don't include local participant in the participants array since it's handled separately
    setParticipants(remoteParticipants);
  }, [room]);

  // Setup room event listeners
  useEffect(() => {
    const handleConnected = () => {
      console.log('Room connected!');
      setConnectionState(ConnectionState.Connected);
      setLocalParticipant(room.localParticipant);
      updateParticipants();
      setIsConnecting(false);
      setError(null);
    };

    const handleDisconnected = (reason?: DisconnectReason) => {
      setConnectionState(ConnectionState.Disconnected);
      setLocalParticipant(null);
      setParticipants([]);
      setIsConnecting(false);
      
      if (reason === DisconnectReason.UNKNOWN) {
        setError('Connection lost');
      }
    };

    const handleReconnecting = () => {
      setConnectionState(ConnectionState.Reconnecting);
    };

    const handleReconnected = () => {
      setConnectionState(ConnectionState.Connected);
      setError(null);
    };

    const handleParticipantConnected = (participant: RemoteParticipant) => {
      updateParticipants();
    };

    const handleParticipantDisconnected = (participant: RemoteParticipant) => {
      updateParticipants();
    };

    const handleTrackPublished = (publication: TrackPublication, participant: Participant) => {
      console.log('Track published:', publication.kind, 'by', participant.identity);
      updateParticipants();
    };

    const handleTrackUnpublished = (publication: TrackPublication, participant: Participant) => {
      console.log('Track unpublished:', publication.kind, 'by', participant.identity);
      updateParticipants();
    };

    const handleTrackMuted = (publication: TrackPublication, participant: Participant) => {
      updateParticipants();
      
      // Update local media devices state if it's the local participant
      if (participant === room.localParticipant) {
        if (publication.kind === Track.Kind.Video) {
          setMediaDevices(prev => ({ ...prev, video: false }));
        } else if (publication.kind === Track.Kind.Audio) {
          setMediaDevices(prev => ({ ...prev, audio: false }));
        }
      }
    };

    const handleTrackUnmuted = (publication: TrackPublication, participant: Participant) => {
      updateParticipants();
      
      // Update local media devices state if it's the local participant
      if (participant === room.localParticipant) {
        if (publication.kind === Track.Kind.Video) {
          setMediaDevices(prev => ({ ...prev, video: true }));
        } else if (publication.kind === Track.Kind.Audio) {
          setMediaDevices(prev => ({ ...prev, audio: true }));
        }
      }
    };

    // Add event listeners
    room.on(RoomEvent.Connected, handleConnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);
    room.on(RoomEvent.Reconnecting, handleReconnecting);
    room.on(RoomEvent.Reconnected, handleReconnected);
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    room.on(RoomEvent.TrackPublished, handleTrackPublished);
    room.on(RoomEvent.TrackUnpublished, handleTrackUnpublished);
    room.on(RoomEvent.TrackMuted, handleTrackMuted);
    room.on(RoomEvent.TrackUnmuted, handleTrackUnmuted);

    return () => {
      // Remove event listeners
      room.off(RoomEvent.Connected, handleConnected);
      room.off(RoomEvent.Disconnected, handleDisconnected);
      room.off(RoomEvent.Reconnecting, handleReconnecting);
      room.off(RoomEvent.Reconnected, handleReconnected);
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
      room.off(RoomEvent.TrackPublished, handleTrackPublished);
      room.off(RoomEvent.TrackUnpublished, handleTrackUnpublished);
      room.off(RoomEvent.TrackMuted, handleTrackMuted);
      room.off(RoomEvent.TrackUnmuted, handleTrackUnmuted);
    };
  }, [room, updateParticipants]);

  // Join the session
  const joinSession = async (): Promise<void> => {
    try {
      setIsConnecting(true);
      setError(null);

      console.log('Getting LiveKit token...');
      // Get LiveKit token from backend
      const response = await api.get<{ data: LiveKitTokenResponse }>(`/livekit/token/${sessionId}`);
      const { token, wsUrl } = response.data.data;

      console.log('Connecting to LiveKit room:', wsUrl);
      // Connect to LiveKit room
      await room.connect(wsUrl, token);

      console.log('Connected! Enabling camera and microphone...');
      // Enable camera and microphone after connection
      try {
        await room.localParticipant.enableCameraAndMicrophone();
        console.log('Camera and microphone enabled');
      } catch (mediaError) {
        console.error('Failed to enable camera/microphone:', mediaError);
        setError('Failed to access camera/microphone. Please check your permissions.');
      }
      
    } catch (error: any) {
      console.error('Failed to join LiveKit session:', error);
      setError(error.message || 'Failed to join session');
      setIsConnecting(false);
      throw error;
    }
  };

  // Leave the session
  const leaveSession = async (): Promise<void> => {
    try {
      await room.disconnect();
      setParticipants([]);
      setLocalParticipant(null);
      setError(null);
    } catch (error) {
      console.error('Error leaving session:', error);
    }
  };

  // Toggle video
  const toggleVideo = async (): Promise<void> => {
    try {
      if (room.localParticipant) {
        const enabled = !room.localParticipant.isCameraEnabled;
        await room.localParticipant.setCameraEnabled(enabled);
        setMediaDevices(prev => ({ ...prev, video: enabled }));
      }
    } catch (error) {
      console.error('Error toggling video:', error);
    }
  };

  // Toggle audio
  const toggleAudio = async (): Promise<void> => {
    try {
      if (room.localParticipant) {
        const enabled = !room.localParticipant.isMicrophoneEnabled;
        await room.localParticipant.setMicrophoneEnabled(enabled);
        setMediaDevices(prev => ({ ...prev, audio: enabled }));
      }
    } catch (error) {
      console.error('Error toggling audio:', error);
    }
  };

  // Toggle screen share
  const toggleScreenShare = async (): Promise<void> => {
    try {
      if (!room.localParticipant) {
        throw new Error('Not connected to room');
      }

      const isScreenShareEnabled = room.localParticipant.isScreenShareEnabled;
      
      if (isScreenShareEnabled) {
        // Stop screen sharing
        await room.localParticipant.setScreenShareEnabled(false);
      } else {
        // Start screen sharing - check for permission first
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          throw new Error('Screen sharing is not supported in this browser');
        }
        
        await room.localParticipant.setScreenShareEnabled(true);
      }
    } catch (error: any) {
      console.error('Error toggling screen share:', error);
      
      // Set user-friendly error messages
      if (error.name === 'NotAllowedError') {
        setError('Screen sharing permission denied. Please allow screen sharing and try again.');
      } else if (error.name === 'NotSupportedError') {
        setError('Screen sharing is not supported in this browser.');
      } else if (error.message?.includes('Permission denied')) {
        setError('Screen sharing permission denied. Please allow screen sharing and try again.');
      } else {
        setError('Failed to start screen sharing. Please try again.');
      }
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
      throw error;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (room.state === ConnectionState.Connected) {
        room.disconnect();
      }
    };
  }, [room]);

  return {
    room,
    participants,
    localParticipant,
    connectionState,
    isConnecting,
    error,
    mediaDevices,
    isScreenSharing: localParticipant?.isScreenShareEnabled ?? false,
    joinSession,
    leaveSession,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
  };
};