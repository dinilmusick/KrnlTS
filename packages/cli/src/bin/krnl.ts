#!/usr/bin/env node
import * as path from 'path';
import * as fs from 'fs';
import { runValidate } from '../commands/validate.js';
import { runGenerate } from '../commands/generate.js';
import { generateMagneticDeclarations } from '../commands/watch.js';
import { StudioServer } from '@dinilmusick/krnl-studio';

const args = process.argv.slice(2);
const command = args[0] || 'help';

async function main() {
  switch (command) {
    case 'validate': {
      const targetDir = args[1] && !args[1].startsWith('-') ? path.resolve(process.cwd(), args[1]) : process.cwd();
      const valid = await runValidate(targetDir);
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
      const portArgIdx = args.indexOf('--port');
      const port = portArgIdx !== -1 ? parseInt(args[portArgIdx + 1], 10) : 8080;

      console.log('⚡ [Krnl Dev] Initializing Krnl Studio visual workspace...');
      generateMagneticDeclarations(process.cwd());

      const server = new StudioServer({
        port,
        projectRoot: process.cwd()
      });

      await server.start();
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
  dev               Start Krnl Studio visual node IDE & dev server (API, UI, WS RPC)
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
  --port <number>   Specify port for Krnl Studio dev server (default: 8080)
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
