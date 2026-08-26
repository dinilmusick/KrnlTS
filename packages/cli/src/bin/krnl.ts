#!/usr/bin/env node
import * as path from 'path';
import * as fs from 'fs';
import { runValidate } from '../commands/validate.js';
import { runGenerate } from '../commands/generate.js';
import { generateMagneticDeclarations } from '../commands/watch.js';

const args = process.argv.slice(2);
const command = args[0] || 'help';

async function main() {
  switch (command) {
    case 'validate': {
      const valid = await runValidate(process.cwd());
      process.exit(valid ? 0 : 1);
      break;
    }
    case 'generate': {
      const type = args[1];
      const name = args[2];
      const parent = args[3];
      await runGenerate(type, name, parent, process.cwd());
      break;
    }
    case 'watch': {
      generateMagneticDeclarations(process.cwd());
      if (args.includes('--watch') || args.includes('-w')) {
        console.log('[Krnl Watch] Continuous watcher enabled.');
        fs.watch(process.cwd(), { recursive: true }, (evt, filename) => {
          if (filename && (filename.endsWith('.ts') || filename.endsWith('.js')) && !filename.includes('krnl-magnetic.d.ts')) {
            try {
              generateMagneticDeclarations(process.cwd());
            } catch (e) {}
          }
        });
      }
      break;
    }
    case 'build': {
      console.log('🏗️  [Krnl Build] Validating and building project...');
      const valid = await runValidate(process.cwd());
      if (!valid) {
        console.error('❌ Build aborted due to validation errors.');
        process.exit(1);
      }
      generateMagneticDeclarations(process.cwd());
      console.log('✅ [Krnl Build] Compilation completed successfully.');
      break;
    }
    case 'dev': {
      console.log('⚡ [Krnl Dev] Starting unified Krnl development runtime...');
      generateMagneticDeclarations(process.cwd());
      console.log('📡 [Krnl Dev] Unified port gateway active.');
      break;
    }
    case 'help':
    default: {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                      Krnl Framework CLI                       ║
╚═══════════════════════════════════════════════════════════════╝

Usage: krnl <command> [options]

Commands:
  dev               Start unified dev server (API, UI, WS RPC, HMR)
  build             Validate and build project for production
  validate          Run deep AST & 4-layer function purity validation
  watch             Generate ambient TypeScript declarations (krnl-magnetic.d.ts)
  generate          Scaffold entities, functionalities, libraries, subapps
                    Examples:
                      krnl generate entity UserSystem
                      krnl generate functionality UserSystem CreateProfile
                      krnl generate library Math
                      krnl generate subapp BillingEngine

Options:
  --watch, -w       Enable continuous file watcher (for watch command)
  --help, -h        Show this help message
`);
      break;
    }
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
