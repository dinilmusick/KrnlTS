import * as fs from 'node:fs';
import * as path from 'node:path';

export function inspectComponent(name: string, root: string = process.cwd()): void {
  const dir = path.join(root, 'components', name);
  if (!fs.existsSync(dir)) throw new Error('Unknown Frnl component: ' + name);
  const walk = (current: string, indent = '') => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      console.log(indent + entry.name + (entry.isDirectory() ? '/' : ''));
      if (entry.isDirectory()) walk(path.join(current, entry.name), indent + '  ');
    }
  };
  console.log(name + '/');
  walk(dir, '  ');
}
