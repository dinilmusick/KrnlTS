export interface KnownDevicePattern {
  pattern: RegExp;
  name: string;
  inChannels: number;
  outChannels: number;
  inNames?: Record<number, string>;
  outNames?: Record<string, string>;
}

export const KNOWN_PATTERNS: KnownDevicePattern[] = [
  {
    pattern: /scarlett\s*6i6/i,
    name: 'Focusrite Scarlett 6i6',
    inChannels: 6,
    outChannels: 6,
    inNames: {
      1: 'Mic 1 / Line 1 (Front Combo)',
      2: 'Inst 2 / Line 2 (Front Combo)',
      3: 'Line 3 (Rear Balanced)',
      4: 'Line 4 (Rear Balanced)',
      5: 'S/PDIF 5 (Digital In L)',
      6: 'S/PDIF 6 (Digital In R)',
    },
    outNames: {
      'Ch 1 / 2 (Main L/R)': 'Ch 1/2 (Main Monitor Out L/R)',
      'Ch 3 / 4 (Sub / Cue)': 'Ch 3/4 (Headphone 1 / Line Out 3-4)',
      'Ch 5 / 6 (Aux Out)': 'Ch 5/6 (Headphone 2 / S/PDIF Out 5-6)',
      'Ch 1 (Mono Left)': 'Ch 1 (Direct Monitor Left)',
      'Ch 2 (Mono Right)': 'Ch 2 (Direct Monitor Right)',
      'Ch 3 (Mono)': 'Ch 3 (Line Out 3 Direct)',
      'Ch 4 (Mono)': 'Ch 4 (Line Out 4 Direct)',
      'Ch 5 (Mono)': 'Ch 5 (S/PDIF Out L)',
      'Ch 6 (Mono)': 'Ch 6 (S/PDIF Out R)',
    },
  },
  {
    pattern: /scarlett\s*18i20/i,
    name: 'Focusrite Scarlett 18i20',
    inChannels: 18,
    outChannels: 20,
  },
  {
    pattern: /scarlett\s*18i8/i,
    name: 'Focusrite Scarlett 18i8',
    inChannels: 18,
    outChannels: 8,
  },
  {
    pattern: /scarlett\s*8i6/i,
    name: 'Focusrite Scarlett 8i6',
    inChannels: 8,
    outChannels: 6,
  },
  {
    pattern: /scarlett\s*4i4/i,
    name: 'Focusrite Scarlett 4i4',
    inChannels: 4,
    outChannels: 4,
  },
  {
    pattern: /scarlett\s*2i4/i,
    name: 'Focusrite Scarlett 2i4',
    inChannels: 2,
    outChannels: 4,
  },
  {
    pattern: /scarlett\s*(2i2|solo)/i,
    name: 'Focusrite Scarlett 2i2',
    inChannels: 2,
    outChannels: 2,
  },
  {
    pattern: /umc\s*1820/i,
    name: 'Behringer U-Phoria UMC1820',
    inChannels: 18,
    outChannels: 20,
  },
  {
    pattern: /umc\s*404(hd)?/i,
    name: 'Behringer U-Phoria UMC404HD',
    inChannels: 4,
    outChannels: 4,
  },
  {
    pattern: /umc\s*204(hd)?/i,
    name: 'Behringer U-Phoria UMC204HD',
    inChannels: 2,
    outChannels: 4,
  },
  {
    pattern: /apollo\s*(twin|x4|x8|x16)/i,
    name: 'Universal Audio Apollo',
    inChannels: 10,
    outChannels: 6,
  },
  {
    pattern: /motu\s*(m4|m2|ultralite)/i,
    name: 'MOTU Audio Interface',
    inChannels: 4,
    outChannels: 4,
  },
  {
    pattern: /komplete\s*audio\s*6/i,
    name: 'Native Instruments Komplete Audio 6',
    inChannels: 6,
    outChannels: 6,
  },
];
