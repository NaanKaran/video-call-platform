import React, { useRef, useEffect } from 'react';
import {
  Track,
  Participant,
  LocalParticipant,
  RemoteParticipant,
} from 'livekit-client';
import { MicrophoneIcon as MicrophoneOffIcon, VideoCameraSlashIcon } from '@heroicons/react/24/solid';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface LiveKitVideoGridProps {
  participants: Participant[];
  localParticipant: LocalParticipant | null;
}

// Custom participant tile component
const CustomParticipantTile: React.FC<{ participant: Participant }> = ({ participant }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Get tracks more reliably with null checks
  const audioTrack = participant.audioTrackPublications 
    ? Array.from(participant.audioTrackPublications.values())[0] 
    : undefined;
  const videoTrack = participant.videoTrackPublications 
    ? Array.from(participant.videoTrackPublications.values())[0] 
    : undefined;
  
  const isLocal = participant instanceof LocalParticipant;
  const isMuted = !audioTrack?.isEnabled;
  const isVideoOff = !videoTrack?.isEnabled;

  // Debug logging
  useEffect(() => {
    console.log('Participant:', participant.identity, {
      isLocal,
      videoTrack: videoTrack?.track,
      videoEnabled: videoTrack?.isEnabled,
      audioTrack: audioTrack?.track,
      audioEnabled: audioTrack?.isEnabled,
    });
  }, [participant.identity, isLocal, videoTrack, audioTrack]);

  // Handle video track
  useEffect(() => {
    const video = videoRef.current;
    const track = videoTrack?.track;

    if (video && track) {
      console.log('Attaching video track for', participant.identity);
      track.attach(video);
      
      return () => {
        console.log('Detaching video track for', participant.identity);
        track.detach(video);
      };
    }
  }, [videoTrack, participant.identity]);

  // Handle audio track (only for remote participants)
  useEffect(() => {
    const audio = audioRef.current;
    const track = audioTrack?.track;

    if (audio && track && !isLocal) {
      console.log('Attaching audio track for', participant.identity);
      track.attach(audio);
      
      return () => {
        console.log('Detaching audio track for', participant.identity);
        track.detach(audio);
      };
    }
  }, [audioTrack, isLocal, participant.identity]);

  return (
    <div className="relative bg-[#1e1e1e] rounded-lg overflow-hidden aspect-video border border-[#3a3a3a]">
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
                {participant.name?.charAt(0).toUpperCase() || participant.identity.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-white text-xs font-medium">
              {participant.name || participant.identity}
            </p>
            {isLocal && <p className="text-gray-400 text-xs mt-0.5">You</p>}
          </div>
        </div>
      )}

      {/* Teams-style name badge */}
      <div className="absolute bottom-2 left-2 bg-[#1e1e1e] bg-opacity-75 text-white px-2 py-1 rounded-full text-xs font-medium">
        {participant.name || participant.identity}
        {isLocal && <span className="text-gray-300"> (You)</span>}
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
}) => {
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
        />
      ))}
    </div>
  );
};