/** Node-only persistent filesystem cache. Import from @kloks/functions/node. */
import fs from 'node:fs';
import path from 'node:path';

export class FileCache<T> {
  private cacheDir: string;

  constructor(cacheDir: string) {
    this.cacheDir = cacheDir;
    try {
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
    } catch (e) {}
  }

  private getFilePath(key: string): string {
    return path.join(this.cacheDir, `${encodeURIComponent(key)}.json`);
  }

  get(key: string): T | null {
    const file = this.getFilePath(key);
    if (!fs.existsSync(file)) return null;
    try {
      const content = fs.readFileSync(file, "utf8");
      return JSON.parse(content) as T;
    } catch (e) {
      return null;
    }
  }

  set(key: string, value: T): void {
    const file = this.getFilePath(key);
    try {
      fs.writeFileSync(file, JSON.stringify(value, null, 2), "utf8");
    } catch (e) {}
  }

  delete(key: string): void {
    const file = this.getFilePath(key);
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
      } catch (e) {}
    }
  }

  clear(): void {
    try {
      const files = fs.readdirSync(this.cacheDir);
      for (const file of files) {
        fs.unlinkSync(path.join(this.cacheDir, file));
      }
    } catch (e) {}
  }
}
