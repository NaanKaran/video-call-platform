import React, { useRef, useEffect, useState } from 'react';
import {
  Participant,
  LocalParticipant,
  Track,
} from 'livekit-client';
import { MicrophoneIcon as MicrophoneOffIcon, VideoCameraSlashIcon } from '@heroicons/react/24/solid';
import { UserGroupIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import userService from '../../services/userService';
import type { User } from '../../types';

interface LiveKitVideoGridProps {
  participants: Participant[];
  localParticipant: LocalParticipant | null;
  userMap?: Map<string, User>;
}

// Custom participant tile component
const CustomParticipantTile: React.FC<{ participant: Participant; userMap?: Map<string, User> }> = ({ participant, userMap }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Get tracks more reliably with null checks and proper subscription filtering
  const audioTrack = participant.audioTrackPublications 
    ? Array.from(participant.audioTrackPublications.values()).find(pub => pub.isSubscribed)
    : undefined;
    
  // Separate camera and screen share tracks
  const cameraTrack = participant.videoTrackPublications 
    ? Array.from(participant.videoTrackPublications.values()).find((pub: any) => 
        pub.isSubscribed && pub.source === Track.Source.Camera)
    : undefined;
    
  const screenShareTrack = participant.videoTrackPublications 
    ? Array.from(participant.videoTrackPublications.values()).find((pub: any) => 
        pub.isSubscribed && pub.source === Track.Source.ScreenShare)
    : undefined;
    
  // Use screen share track if available, otherwise use camera
  const videoTrack = screenShareTrack || cameraTrack;
  
  const isLocal = participant instanceof LocalParticipant;
  const isMuted = !audioTrack?.isEnabled;
  const isVideoOff = !videoTrack?.isEnabled;
  const isPresenting = !!screenShareTrack;

  // Get user name from backend data, fallback to participant name or identity
  const getUserDisplayName = (): string => {
    // Try to find user by identity (email or user ID)
    const backendUser = userMap?.get(participant.identity);
    if (backendUser) {
      return backendUser.name;
    }
    
    // Fallback to participant name or identity
    return participant.name || participant.identity;
  };

  const displayName = getUserDisplayName();

  // Debug logging with subscription status
  useEffect(() => {
    console.log('Participant:', participant.identity, {
      isLocal,
      isPresenting,
      cameraTrack: cameraTrack?.track,
      screenShareTrack: screenShareTrack?.track,
      videoTrack: videoTrack?.track,
      videoEnabled: videoTrack?.isEnabled,
      videoSubscribed: videoTrack?.isSubscribed,
      videoSource: videoTrack?.source,
      audioTrack: audioTrack?.track,
      audioEnabled: audioTrack?.isEnabled,
      audioSubscribed: audioTrack?.isSubscribed,
    });
  }, [participant.identity, isLocal, videoTrack, audioTrack, cameraTrack, screenShareTrack, isPresenting]);

  // Handle video track
  useEffect(() => {
    const video = videoRef.current;
    const track = videoTrack?.track;

    if (video && track && videoTrack?.isSubscribed) {
      console.log('Attaching video track for', participant.identity);
      track.attach(video);
      
      return () => {
        console.log('Detaching video track for', participant.identity);
        track.detach(video);
      };
    }
  }, [videoTrack?.track, videoTrack?.isSubscribed, participant.identity]);

  // Handle audio track (only for remote participants)
  useEffect(() => {
    const audio = audioRef.current;
    const track = audioTrack?.track;

    if (audio && track && !isLocal && audioTrack?.isSubscribed) {
      console.log('Attaching audio track for', participant.identity);
      track.attach(audio);
      
      return () => {
        console.log('Detaching audio track for', participant.identity);
        track.detach(audio);
      };
    }
  }, [audioTrack?.track, audioTrack?.isSubscribed, isLocal, participant.identity]);

  return (
    <div className={clsx(
      "relative bg-[#1e1e1e] rounded-lg overflow-hidden aspect-video border",
      isPresenting 
        ? "border-[#6264a7] border-2" 
        : "border-[#3a3a3a]"
    )}>
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Always mute local video to prevent feedback
        className={clsx(
          'w-full h-full object-cover',
          isVideoOff && 'hidden'
        )}
      />

      {/* Audio element (hidden, only for remote participants) */}
      {!isLocal && (
        <audio
          ref={audioRef}
          autoPlay
          playsInline
          className="hidden"
        />
      )}

      {/* Video off placeholder */}
      {isVideoOff && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#292929]">
          <div className="text-center">
            <div className="w-12 h-12 bg-[#6264a7] rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-lg font-semibold text-white">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-white text-xs font-medium">
              {displayName}
            </p>
            {isLocal && <p className="text-gray-400 text-xs mt-0.5">You</p>}
          </div>
        </div>
      )}

      {/* Teams-style name badge */}
      <div className="absolute bottom-2 left-2 bg-[#1e1e1e] bg-opacity-75 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
        <span>
          {displayName}
          {isLocal && <span className="text-gray-300"> (You)</span>}
        </span>
        {isPresenting && (
          <ComputerDesktopIcon className="h-3 w-3 text-[#6264a7]" />
        )}
      </div>

      {/* Teams-style status indicators */}
      <div className="absolute top-2 right-2 flex space-x-1">
        {/* Muted indicator */}
        {isMuted && (
          <div className="bg-[#c4314b] rounded-full p-1">
            <MicrophoneOffIcon className="h-2.5 w-2.5 text-white" />
          </div>
        )}
        
        {/* Video off indicator */}
        {isVideoOff && (
          <div className="bg-[#c4314b] rounded-full p-1">
            <VideoCameraSlashIcon className="h-2.5 w-2.5 text-white" />
          </div>
        )}
      </div>

      {/* Teams-style speaking indicator */}
      {participant.isSpeaking && (
        <div className="absolute inset-0 border-2 border-[#6264a7] rounded-lg pointer-events-none"></div>
      )}
    </div>
  );
};

export const LiveKitVideoGrid: React.FC<LiveKitVideoGridProps> = ({
  participants,
  localParticipant,
  userMap: providedUserMap,
}) => {
  const [userMap, setUserMap] = useState<Map<string, User>>(providedUserMap || new Map());

  // Fetch user data if not provided
  useEffect(() => {
    if (!providedUserMap) {
      userService.createUserMap()
        .then(setUserMap)
        .catch(error => {
          console.error('Failed to fetch user data:', error);
        });
    }
  }, [providedUserMap]);

  // Get all participants including local (ensure unique keys)
  const uniqueParticipants = new Map();
  
  if (localParticipant) {
    uniqueParticipants.set(localParticipant.identity, localParticipant);
  }
  
  participants.forEach(p => {
    if (!(p instanceof LocalParticipant)) {
      uniqueParticipants.set(p.identity, p);
    }
  });
  
  const allParticipants = Array.from(uniqueParticipants.values());
  const totalParticipants = allParticipants.length;
  
  // Find presenting participant (MS Teams style)
  const presentingParticipant = allParticipants.find(p => {
    const screenShareTrack = Array.from(p.videoTrackPublications.values()).find((pub: any) => 
      pub.isSubscribed && pub.source === Track.Source.ScreenShare);
    return !!screenShareTrack;
  });
  
  // Split participants: presenter vs others
  const otherParticipants = allParticipants.filter(p => p !== presentingParticipant);

  // Calculate grid layout
  const getGridLayout = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  const getGridRows = (count: number) => {
    if (count <= 2) return 'grid-rows-1';
    if (count <= 4) return 'grid-rows-2';
    if (count <= 6) return 'grid-rows-2';
    return 'grid-rows-3';
  };

  if (totalParticipants === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-[#1e1e1e] rounded-lg">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#6264a7] rounded-full flex items-center justify-center mx-auto mb-4">
            <UserGroupIcon className="h-8 w-8 text-white" />
          </div>
          <div className="text-gray-300 text-lg mb-2 font-medium">No one else is here</div>
          <p className="text-gray-400 text-sm">Share your meeting ID so others can join</p>
        </div>
      </div>
    );
  }

  // MS Teams-style presenter layout
  if (presentingParticipant) {
    return (
      <div className="h-full w-full flex gap-2 overflow-hidden">
        {/* Main presenter area (left side - takes most space) */}
        <div className="flex-1 min-w-0">
          <CustomParticipantTile
            key={presentingParticipant.identity}
            participant={presentingParticipant}
            userMap={userMap}
          />
        </div>
        
        {/* Sidebar for other participants (right side) */}
        {otherParticipants.length > 0 && (
          <div className="w-80 flex flex-col gap-2 overflow-y-auto">
            {otherParticipants.map((participant) => (
              <div key={participant.identity} className="flex-shrink-0 aspect-video">
                <CustomParticipantTile
                  participant={participant}
                  userMap={userMap}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Regular gallery view when no one is presenting
  return (
    <div className={clsx(
      'grid gap-2 h-full w-full',
      getGridLayout(totalParticipants),
      getGridRows(totalParticipants),
      'overflow-hidden'
    )}>
      {allParticipants.map((participant) => (
        <CustomParticipantTile
          key={participant.identity}
          participant={participant}
          userMap={userMap}
        />
      ))}
    </div>
  );
};