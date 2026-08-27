import * as fs from 'fs';
import * as path from 'path';

export type FileChangeCallback = (change: { eventType: string; filename: string; fullPath: string }) => void;

export class StudioFileWatcher {
  private watcher: fs.FSWatcher | null = null;
  private rootDir: string;
  private listeners = new Set<FileChangeCallback>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = path.resolve(rootDir);
  }

  public start() {
    if (this.watcher) return;
    const srcDir = path.join(this.rootDir, 'src');
    if (!fs.existsSync(srcDir)) return;

    this.watcher = fs.watch(srcDir, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      if (
        filename.includes('node_modules') ||
        filename.includes('dist') ||
        filename.includes('.git') ||
        filename.endsWith('.d.ts') ||
        filename.endsWith('.log') ||
        filename.endsWith('.tmp') ||
        filename.includes('.krnl-graph') ||
        filename.includes('.DS_Store')
      ) {
        return;
      }

      const fullPath = path.join(srcDir, filename);

      if (this.debounceTimers.has(fullPath)) {
        clearTimeout(this.debounceTimers.get(fullPath)!);
      }

      const timer = setTimeout(() => {
        this.debounceTimers.delete(fullPath);
        for (const listener of this.listeners) {
          try {
            listener({ eventType, filename, fullPath });
          } catch (e) {}
        }
      }, 300);

      this.debounceTimers.set(fullPath, timer);
    });
  }

  public subscribe(cb: FileChangeCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}
