if (typeof window !== 'undefined') {
  let needsMock = false;
  try {
    if (!window.AudioContext) {
      needsMock = true;
    } else {
      new (window.AudioContext as any)();
    }
  } catch {
    needsMock = true;
  }

  if (needsMock) {
    (window as any).AudioContext = class MockAudioContext {
      state = 'running';
      sampleRate = 44100;
      currentTime = 0;
      destination = {};
      constructor() {}
      close() { return Promise.resolve(); }
      suspend() { return Promise.resolve(); }
      resume() { return Promise.resolve(); }
      createOscillator() {
        return {
          connect: () => {},
          start: () => {},
          stop: () => {},
          frequency: { value: 440 },
          type: 'sine',
        };
      }
      createGain() {
        return {
          connect: () => {},
          gain: { value: 1 },
        };
      }
      createAnalyser() {
        return {
          connect: () => {},
          fftSize: 2048,
          getByteFrequencyData: () => {},
          getByteTimeDomainData: () => {},
        };
      }
      createBiquadFilter() {
        return {
          connect: () => {},
          frequency: { value: 350 },
          Q: { value: 1 },
          type: 'lowpass',
        };
      }
      createBufferSource() {
        return {
          connect: () => {},
          start: () => {},
          stop: () => {},
          buffer: null,
          loop: false,
        };
      }
      createBuffer() {
        return {
          getChannelData: () => new Float32Array(1024),
        };
      }
      decodeAudioData() {
        return Promise.resolve({
          duration: 1,
          length: 44100,
          sampleRate: 44100,
          numberOfChannels: 2,
          getChannelData: () => new Float32Array(1024),
        });
      }
    };
    (window as any).webkitAudioContext = (window as any).AudioContext;
  }
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

