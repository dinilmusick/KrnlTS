export interface ActiveTrackPlayback {
  trackId?: string;
  source?: AudioBufferSourceNode;
  sourceNode?: AudioBufferSourceNode;
  gainNode?: GainNode;
  startTime: number;
  startSec?: number;
  duration?: number;
  playDuration: number;
  secPerBeat: number;
  loop?: boolean;
  [key: string]: any;
}

export interface ActiveAuditionPlayback {
  url?: string;
  source: AudioBufferSourceNode;
  sourceNode?: AudioBufferSourceNode;
  gainNode?: GainNode;
  startTime: number;
  duration: number;
  [key: string]: any;
}
