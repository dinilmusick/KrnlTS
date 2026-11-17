import { describe, expect, it } from 'vitest';
import { MidiTimeline, MusicalTimeline } from './index.js';

describe('timeline components', () => {
  it('exports both global timeline components', () => {
    expect(MidiTimeline).toBeDefined();
    expect(MusicalTimeline).toBeDefined();
  });

  it('keeps timeline components app-agnostic', () => {
    expect(typeof MusicalTimeline).toBe('function');
    expect(typeof MidiTimeline).toBe('function');
  });
});
