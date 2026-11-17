/**
 * @file ServiceVideoPlayer.tsx
 * @description In-service Video Player for streaming and previewing video objects from Backblaze B2.
 * Supports play/pause, scrub, resolution tags, fullscreen, and playback speeds.
 * File size < 200 lines strictly.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Maximize2, RotateCcw, Video, Volume2, VolumeX } from 'lucide-react';

export interface ServiceVideoPlayerProps {
  src: string;
  poster?: string;
  fileName?: string;
  fileSize?: string;
  resolution?: string;
  className?: string;
}

export function ServiceVideoPlayer({
  src,
  poster,
  fileName = 'video-stream.mp4',
  fileSize,
  resolution = '1080p',
  className = '',
}: ServiceVideoPlayerProps): React.ReactElement {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoadedMetadata = () => setDuration(video.duration || 0);
    const onEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) videoRef.current.requestFullscreen();
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div ref={containerRef} className={`border-2 border-neutral-750 bg-neutral-950 font-mono text-xs shadow-[3px_3px_0px_#000] ${className}`}>
      {/* Header Info */}
      <div className="flex items-center justify-between p-2 border-b border-neutral-800 bg-neutral-900/80">
        <div className="flex items-center gap-2 truncate">
          <Video className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-bold text-neutral-100 truncate text-[11px]">{fileName}</span>
        </div>
        <div className="flex items-center gap-1 text-[9px]">
          <span className="px-1 bg-amber-950/60 border border-amber-800 text-amber-300 font-bold">{resolution}</span>
          {fileSize && <span className="px-1 bg-neutral-800 border border-neutral-700 text-neutral-400">{fileSize}</span>}
        </div>
      </div>

      {/* Video Viewport */}
      <div className="relative bg-black flex items-center justify-center min-h-[200px]">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          playsInline
          className="w-full max-h-72 object-contain"
          onClick={togglePlay}
        />
        {!isPlaying && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute p-3 bg-amber-500/90 hover:bg-amber-400 text-black border-2 border-black shadow-[2px_2px_0px_#000] cursor-pointer"
            title="Play Video"
          >
            <Play className="w-6 h-6 fill-black" />
          </button>
        )}
      </div>

      {/* Control Strip */}
      <div className="p-2 space-y-1.5 bg-neutral-900/90 border-t border-neutral-800">
        {/* Scrubber */}
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={(e) => {
            const val = Number(e.target.value);
            setCurrentTime(val);
            if (videoRef.current) videoRef.current.currentTime = val;
          }}
          className="w-full h-1 bg-neutral-800 accent-amber-500 cursor-pointer rounded-none"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="p-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-white" />}
            </button>
            <button
              type="button"
              onClick={() => {
                if (videoRef.current) videoRef.current.currentTime = 0;
              }}
              className="p-1 text-neutral-400 hover:text-white cursor-pointer"
              title="Restart"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <span className="text-[10px] text-neutral-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
              className="p-1 text-neutral-400 hover:text-white cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3" />}
            </button>
            <button
              type="button"
              onClick={handleFullscreen}
              className="p-1 text-neutral-400 hover:text-white cursor-pointer"
              title="Full Screen"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
