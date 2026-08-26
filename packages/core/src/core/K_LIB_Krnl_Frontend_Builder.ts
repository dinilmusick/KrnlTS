import fs from 'fs';
import path from 'path';

export class KrnlFrontendBuilder {
  private static activeContexts = new Map<string, any>();

  /**
   * Bundles frontend/src/index.ts -> frontend/dist/bundle.js
   */
  static async build(frontendDir: string): Promise<boolean> {
    const entryFileTs = path.join(frontendDir, 'src', 'index.ts');
    const entryFileTsx = path.join(frontendDir, 'src', 'index.tsx');
    const entryFile = fs.existsSync(entryFileTs) ? entryFileTs : entryFileTsx;

    if (!fs.existsSync(entryFile)) {
      return false;
    }

    const distDir = path.join(frontendDir, 'dist');
    fs.mkdirSync(distDir, { recursive: true });

    // Sync atoms from library to app's frontend/src/atoms if present in node_modules
    try {
      const candidates = [
        // When running from inside KrnlTS dist (relative to __dirname)
        path.resolve(__dirname, '..', '..', 'frontend', 'atoms'),
        path.resolve(__dirname, '..', 'frontend', 'atoms'),
        // Scoped package (@dinilmusick/krnlts) installed in consuming app
        path.resolve(process.cwd(), 'node_modules', '@dinilmusick', 'krnlts', 'dist', 'frontend', 'atoms'),
        path.resolve(process.cwd(), 'node_modules', '@dinilmusick', 'krnlts', 'src', 'krnl', 'frontend', 'atoms'),
        // Unscoped fallback (krnlts)
        path.resolve(process.cwd(), 'node_modules', 'krnlts', 'dist', 'frontend', 'atoms'),
        path.resolve(process.cwd(), 'node_modules', 'krnlts', 'src', 'krnl', 'frontend', 'atoms')
      ];
      const nodeModulesAtoms = candidates.find((c) => fs.existsSync(c));
      const srcAtoms = path.join(frontendDir, 'src', 'atoms');
      if (nodeModulesAtoms) {
        fs.mkdirSync(srcAtoms, { recursive: true });
        fs.cpSync(nodeModulesAtoms, srcAtoms, { recursive: true, force: true });
        console.log(`[KrnlFrontendBuilder] Atoms synced from ${nodeModulesAtoms}`);
      } else {
        console.warn(`[KrnlFrontendBuilder] No atoms source found in any candidate path.`);
      }
    } catch (e) {}

    try {
      const esbuild = await import('esbuild');
      console.log(`[KrnlFrontendBuilder] Bundling ${entryFile} -> ${distDir}/bundle.js...`);
      await esbuild.build({
        entryPoints: [entryFile],
        bundle: true,
        outfile: path.join(distDir, 'bundle.js'),
        loader: {
          '.css': 'css',
          '.ts': 'ts',
          '.js': 'js'
        },
        sourcemap: process.env.NODE_ENV !== 'production',
        minify: process.env.NODE_ENV === 'production',
        logLevel: 'warning'
      });
      console.log(`[KrnlFrontendBuilder] Bundle build successful.`);
      return true;
    } catch (err: any) {
      if (err.code === 'ERR_MODULE_NOT_FOUND' || err.message?.includes('Cannot find module')) {
        console.warn(`[KrnlFrontendBuilder] esbuild peer dependency not found. Skipping build. Run 'npm i esbuild' to enable in-process UI compilation.`);
      } else {
        console.error(`[KrnlFrontendBuilder] Build failed:`, err.message || err);
      }
      return false;
    }
  }

  /**
   * Starts esbuild watch mode for live updates during development
   */
  static async watch(frontendDir: string): Promise<void> {
    if (this.activeContexts.has(frontendDir)) {
      return;
    }

    const entryFileTs = path.join(frontendDir, 'src', 'index.ts');
    const entryFileTsx = path.join(frontendDir, 'src', 'index.tsx');
    const entryFile = fs.existsSync(entryFileTs) ? entryFileTs : entryFileTsx;

    if (!fs.existsSync(entryFile)) {
      return;
    }

    try {
      const esbuild = await import('esbuild');
      const ctx = await esbuild.context({
        entryPoints: [entryFile],
        bundle: true,
        outfile: path.join(frontendDir, 'dist', 'bundle.js'),
        loader: {
          '.css': 'css',
          '.ts': 'ts',
          '.js': 'js'
        },
        logLevel: 'warning'
      });
      await ctx.watch();
      this.activeContexts.set(frontendDir, ctx);
      console.log(`[KrnlFrontendBuilder] esbuild watching ${frontendDir}/src for changes.`);
    } catch (err: any) {
      // Ignore if esbuild is missing
    }
  }

  static stop(frontendDir: string): void {
    const ctx = this.activeContexts.get(frontendDir);
    if (ctx) {
      ctx.dispose();
      this.activeContexts.delete(frontendDir);
    }
  }
}
