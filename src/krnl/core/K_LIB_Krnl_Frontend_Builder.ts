import fs from 'fs';
import path from 'path';

export class KrnlFrontendBuilder {
  private static activeContexts = new Map<string, any>();

  /**
   * Bundles frontend/src/index.tsx -> frontend/dist/bundle.js
   */
  static async build(frontendDir: string): Promise<boolean> {
    const entryFile = path.join(frontendDir, 'src', 'index.tsx');
    if (!fs.existsSync(entryFile)) {
      return false;
    }

    const distDir = path.join(frontendDir, 'dist');
    fs.mkdirSync(distDir, { recursive: true });

    try {
      const esbuild = await import('esbuild');
      console.log(`[KrnlFrontendBuilder] Bundling ${entryFile} -> ${distDir}/bundle.js...`);
      await esbuild.build({
        entryPoints: [entryFile],
        bundle: true,
        outfile: path.join(distDir, 'bundle.js'),
        loader: {
          '.css': 'css',
          '.tsx': 'tsx',
          '.ts': 'ts',
          '.js': 'jsx',
          '.jsx': 'jsx'
        },
        jsx: 'automatic',
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

    const entryFile = path.join(frontendDir, 'src', 'index.tsx');
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
          '.tsx': 'tsx',
          '.ts': 'ts',
          '.js': 'jsx',
          '.jsx': 'jsx'
        },
        jsx: 'automatic',
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
