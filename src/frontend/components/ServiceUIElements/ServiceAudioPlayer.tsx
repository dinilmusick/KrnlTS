/**
 * @file ServiceAudioPlayer.tsx
 * @description In-service Audio Player for rendering fetched sound files from Backblaze B2.
 * Supports play/pause, time tracking, audio waveforms, volume, and playback state.
 * File size < 200 lines strictly.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Music, RotateCcw } from 'lucide-react';

export interface ServiceAudioPlayerProps {
  src: string;
  fileName?: string;
  fileSize?: string;
  bitrate?: string;
  className?: string;
}

export function ServiceAudioPlayer({
  src,
  fileName = 'audio-sample.mp3',
  fileSize,
  bitrate = '320kbps',
  className = '',
}: ServiceAudioPlayerProps): React.ReactElement {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={`border-2 border-neutral-750 bg-neutral-950 font-mono text-xs shadow-[3px_3px_0px_#000] p-3 space-y-2.5 ${className}`}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <Music className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-bold text-neutral-100 truncate text-[11px]">{fileName}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-neutral-400">
          <span className="px-1 bg-neutral-900 border border-neutral-800 text-amber-300">{bitrate}</span>
          {fileSize && <span className="px-1 bg-neutral-900 border border-neutral-800">{fileSize}</span>}
        </div>
      </div>

      {/* Waveform Visualization Bars */}
      <div className="flex items-center gap-0.5 h-7 px-2 bg-neutral-900/80 border border-neutral-800">
        {Array.from({ length: 32 }).map((_, i) => {
          const progressPercent = duration > 0 ? (currentTime / duration) * 32 : 0;
          const isActive = i <= progressPercent;
          const height = isPlaying ? Math.sin(i * 0.4 + currentTime * 5) * 12 + 14 : ((i * 7) % 16) + 4;

          return (
            <div
              key={i}
              style={{ height: `${Math.max(4, Math.min(24, height))}px` }}
              className={`flex-1 transition-all duration-75 ${
                isActive ? 'bg-amber-400' : 'bg-neutral-750'
              }`}
            />
          );
        })}
      </div>

      {/* Progress Track */}
      <div className="space-y-1">
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-neutral-800 accent-amber-500 cursor-pointer rounded-none"
        />
        <div className="flex justify-between text-[10px] text-neutral-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Transport Controls */}
      <div className="flex items-center justify-between pt-1 border-t border-neutral-850">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="p-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black border border-amber-400 cursor-pointer shadow-[1px_1px_0px_#000]"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-black" />}
          </button>
          <button
            type="button"
            onClick={() => {
              if (audioRef.current) audioRef.current.currentTime = 0;
            }}
            className="p-1.5 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 cursor-pointer"
            title="Restart"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.muted = !isMuted;
              setIsMuted(!isMuted);
            }
          }}
          className="p-1.5 text-neutral-400 hover:text-white cursor-pointer"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
