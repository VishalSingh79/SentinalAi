import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from 'lucide-react';
import { Severity } from '../../types';

export interface Incident {
  id: string;
  timestamp: string;
  seconds: number;
  severity: Severity;
  description: string;
}

interface VideoPlayerProps {
  videoUrl: string;
  incidents: Incident[];
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  seekTo: { time: number; timestamp: number } | null;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoUrl, 
  incidents, 
  currentTime, 
  onTimeUpdate, 
  onDurationChange,
  seekTo
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    if (seekTo && videoRef.current) {
      videoRef.current.currentTime = seekTo.time;
      if (videoRef.current.paused) {
        videoRef.current.play().catch(e => console.error("Auto-play blocked", e));
        setIsPlaying(true);
      } else {
        setIsPlaying(true);
      }
    }
  }, [seekTo]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) onTimeUpdate(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const d = videoRef.current.duration;
      setDuration(d);
      onDurationChange(d);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      onTimeUpdate(time);
    }
  };

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case Severity.HIGH: return 'bg-red-600 border border-white shadow-[0_0_8px_rgba(220,38,38,0.8)]';
      case Severity.MEDIUM: return 'bg-yellow-400 border border-white shadow-[0_0_8px_rgba(250,204,21,0.8)]';
      case Severity.LOW: return 'bg-emerald-500 border border-white shadow-[0_0_8px_rgba(16,185,129,0.8)]';
      default: return 'bg-gray-400 border border-white';
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  return (
    <div 
      className="relative w-full h-full bg-black group overflow-hidden rounded-3xl"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
      />

      {/* Floating Control Bar - Light Theme */}
      <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 w-[95%] transition-all duration-300 ${showControls || !isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="bg-white/80 backdrop-blur-md border border-white/50 p-4 rounded-2xl shadow-lg">
          
          {/* Timeline */}
          <div className="relative w-full h-6 flex items-center mb-2 group/timeline">
            {/* Markers */}
            <div className="absolute inset-0 z-10 w-full h-1 top-[11px] pointer-events-none">
               {incidents.map((incident) => {
                 const leftPos = (incident.seconds / duration) * 100;
                 if (isNaN(leftPos)) return null;
                 return (
                   <div
                     key={incident.id}
                     className={`absolute w-2.5 h-2.5 rounded-full transform -translate-x-1/2 -mt-[3px] ${getSeverityColor(incident.severity)} transition-all duration-300 group-hover/timeline:scale-150 z-30`}
                     style={{ left: `${leftPos}%` }}
                     title={`${incident.severity}: ${incident.timestamp}`}
                   />
                 );
               })}
            </div>

            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="absolute z-20 w-full h-1 bg-slate-200/50 rounded-lg appearance-none cursor-pointer 
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
              [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-slate-200
              [&::-webkit-slider-thumb]:rounded-full 
              [&::-webkit-slider-thumb]:shadow-md
              [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
            />
            {/* Progress Fill */}
            <div 
              className="absolute h-1 bg-slate-800 rounded-l-lg top-[11px] pointer-events-none"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between text-slate-700 px-1">
            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-800">
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              </button>
              
              <div className="flex items-center gap-2 text-slate-500">
                <button onClick={() => skip(-5)} className="hover:text-slate-800 transition-colors"><SkipBack size={18} /></button>
                <button onClick={() => skip(5)} className="hover:text-slate-800 transition-colors"><SkipForward size={18} /></button>
              </div>

              <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                {formatTime(currentTime)} <span className="text-slate-300">/</span> {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = !isMuted;
                    setIsMuted(!isMuted);
                  }
                }} 
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-800"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <button 
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-800"
                onClick={() => videoRef.current?.requestFullscreen()}
              >
                 <Maximize size={18} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const formatTime = (time: number) => {
  if (isNaN(time)) return "00:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default VideoPlayer;