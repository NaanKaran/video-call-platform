import { useState, useEffect, useRef } from 'react';
import type { Participant, MediaDevices } from '../types';
import socketService from '../services/socketService';

// Custom hook for managing WebRTC connections
export const useWebRTC = (sessionId: string, userId: string) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [mediaDevices, setMediaDevices] = useState<MediaDevices>({
    video: true,
    audio: true,
  });
  const [isConnecting, setIsConnecting] = useState(false);

  // Store peer connections for each participant
  const peerConnections = useRef<{ [userId: string]: RTCPeerConnection }>({});
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // ICE servers configuration (you can add STUN/TURN servers here)
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    // Add TURN servers for production
  ];

  // Initialize local media stream
  const initializeLocalStream = async () => {
    try {
      setIsConnecting(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: mediaDevices.video,
        audio: mediaDevices.audio,
      });

      setLocalStream(stream);
      
      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error('Failed to access media devices:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  // Create peer connection for a specific user
  const createPeerConnection = (targetUserId: string): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection({
      iceServers,
    });

    // Add local stream tracks to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle incoming stream from remote peer
    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setParticipants(prev => 
        prev.map(p => 
          p.userId === targetUserId 
            ? { ...p, stream: remoteStream }
            : p
        )
      );
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.sendIceCandidate(event.candidate, targetUserId);
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with ${targetUserId}:`, peerConnection.connectionState);
    };

    peerConnections.current[targetUserId] = peerConnection;
    return peerConnection;
  };

  // Handle incoming offer
  const handleOffer = async (offer: RTCSessionDescriptionInit, fromUserId: string) => {
    const peerConnection = createPeerConnection(fromUserId);
    
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    socketService.sendAnswer(answer, fromUserId);
  };

  // Handle incoming answer
  const handleAnswer = async (answer: RTCSessionDescriptionInit, fromUserId: string) => {
    const peerConnection = peerConnections.current[fromUserId];
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  // Handle incoming ICE candidate
  const handleIceCandidate = async (candidate: RTCIceCandidate, fromUserId: string) => {
    const peerConnection = peerConnections.current[fromUserId];
    if (peerConnection) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  // Create offer for new participant
  const createOffer = async (targetUserId: string) => {
    const peerConnection = createPeerConnection(targetUserId);
    
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    socketService.sendOffer(offer, targetUserId);
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        const enabled = !videoTrack.enabled;
        videoTrack.enabled = enabled;
        setMediaDevices(prev => ({ ...prev, video: enabled }));
        socketService.toggleVideo(userId, enabled);
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        const enabled = !audioTrack.enabled;
        audioTrack.enabled = enabled;
        setMediaDevices(prev => ({ ...prev, audio: enabled }));
        socketService.toggleAudio(userId, enabled);
      }
    }
  };

  // Join the session
  const joinSession = async () => {
    try {
      const stream = await initializeLocalStream();
      socketService.joinRoom(sessionId, userId);
      return stream;
    } catch (error) {
      console.error('Failed to join session:', error);
      throw error;
    }
  };

  // Leave the session
  const leaveSession = () => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Close all peer connections
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};

    // Leave socket room
    socketService.leaveRoom(sessionId, userId);
    
    // Clear participants
    setParticipants([]);
  };

  // Set up socket event listeners
  useEffect(() => {
    if (!sessionId || !userId) return;

    // Handle user joined
    socketService.on('user-joined', ({ userId: newUserId, name }) => {
      setParticipants(prev => [...prev, {
        userId: newUserId,
        name,
        videoEnabled: true,
        audioEnabled: true,
      }]);
      
      // Create offer for new user
      createOffer(newUserId);
    });

    // Handle user left
    socketService.on('user-left', ({ userId: leftUserId }) => {
      setParticipants(prev => prev.filter(p => p.userId !== leftUserId));
      
      // Close peer connection
      if (peerConnections.current[leftUserId]) {
        peerConnections.current[leftUserId].close();
        delete peerConnections.current[leftUserId];
      }
    });

    // Handle WebRTC signaling
    socketService.on('offer', ({ offer, userId: fromUserId }) => {
      handleOffer(offer, fromUserId);
    });

    socketService.on('answer', ({ answer, userId: fromUserId }) => {
      handleAnswer(answer, fromUserId);
    });

    socketService.on('ice-candidate', ({ candidate, userId: fromUserId }) => {
      handleIceCandidate(candidate, fromUserId);
    });

    // Handle media control updates
    socketService.on('toggle-video', ({ userId: participantId, enabled }) => {
      setParticipants(prev =>
        prev.map(p =>
          p.userId === participantId ? { ...p, videoEnabled: enabled } : p
        )
      );
    });

    socketService.on('toggle-audio', ({ userId: participantId, enabled }) => {
      setParticipants(prev =>
        prev.map(p =>
          p.userId === participantId ? { ...p, audioEnabled: enabled } : p
        )
      );
    });

    // Cleanup
    return () => {
      socketService.off('user-joined');
      socketService.off('user-left');
      socketService.off('offer');
      socketService.off('answer');
      socketService.off('ice-candidate');
      socketService.off('toggle-video');
      socketService.off('toggle-audio');
    };
  }, [sessionId, userId, localStream]);

  // Update video element when localStream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveSession();
    };
  }, []);

  return {
    participants,
    localStream,
    localVideoRef,
    mediaDevices,
    isConnecting,
    joinSession,
    leaveSession,
    toggleVideo,
    toggleAudio,
  };
};