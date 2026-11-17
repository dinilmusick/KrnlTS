import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@kloks/functions/base': path.resolve(__dirname, 'packages/functions/dist/base.js'),
      '@kloks/functions/portable': path.resolve(__dirname, 'packages/functions/dist/portable.js'),
      '@kloks/functions': path.resolve(__dirname, 'packages/functions/dist/index.js'),
      '@kloks/state-graph': path.resolve(__dirname, 'packages/state-graph/dist/index.js'),
      '@kloks/audio-midi': path.resolve(__dirname, 'packages/audio-midi/dist/index.js'),
      '@kloks/services': path.resolve(__dirname, 'packages/services/dist/index.js'),
      '@kloks/backend/node': path.resolve(__dirname, 'packages/backend/dist/node.js'),
      '@kloks/backend': path.resolve(__dirname, 'packages/backend/dist/index.js'),
      '@kloks/orchestrations': path.resolve(__dirname, 'packages/orchestrations/dist/index.js'),
      '@kloks/contracts': path.resolve(__dirname, 'packages/contracts/dist/index.js'),
      '@ultrst-armada/kloks/functions/base': path.resolve(__dirname, 'packages/functions/dist/base.js'),
      '@ultrst-armada/kloks/functions/portable': path.resolve(__dirname, 'packages/functions/dist/portable.js'),
      '@ultrst-armada/kloks/functions': path.resolve(__dirname, 'packages/functions/dist/index.js'),
      '@ultrst-armada/kloks/state-graph': path.resolve(__dirname, 'packages/state-graph/dist/index.js'),
      '@ultrst-armada/kloks/audio-midi/services': path.resolve(__dirname, 'packages/audio-midi/dist/services/index.js'),
      '@ultrst-armada/kloks/audio-midi': path.resolve(__dirname, 'packages/audio-midi/dist/index.js'),
      '@ultrst-armada/kloks/clock': path.resolve(__dirname, 'packages/audio-midi/dist/clock/index.js'),
      '@ultrst-armada/kloks/midi': path.resolve(__dirname, 'packages/audio-midi/dist/midi/index.js'),
      '@ultrst-armada/kloks/osc/node': path.resolve(__dirname, 'packages/audio-midi/dist/osc/node-udp.js'),
      '@ultrst-armada/kloks/osc': path.resolve(__dirname, 'packages/audio-midi/dist/osc/index.js'),
      '@ultrst-armada/kloks/services': path.resolve(__dirname, 'packages/services/dist/index.js'),
      '@ultrst-armada/kloks/backend': path.resolve(__dirname, 'packages/backend/dist/index.js'),
      '@ultrst-armada/kloks/orchestrations': path.resolve(__dirname, 'packages/orchestrations/dist/index.js'),
      '@ultrst-armada/kloks/contracts': path.resolve(__dirname, 'packages/contracts/dist/index.js'),
    },
  },
  test: {
    testTimeout: 15000,
  },
});
