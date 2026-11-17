import * as fs from 'node:fs';
import * as path from 'node:path';

export interface PageGenerationOptions {
  frontendRoot?: string;
}

function write(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

export function generatePage(pageName: string, projectRoot: string, options: PageGenerationOptions = {}): string {
  if (!/^[a-z][a-z0-9-]*$/i.test(pageName)) {
    throw new Error('Page name must be alphanumeric with optional hyphens.');
  }

  const frontendRoot =
    options.frontendRoot ??
    (fs.existsSync(path.join(projectRoot, 'src', 'frontend'))
      ? path.join(projectRoot, 'src', 'frontend')
      : projectRoot);
  const pageDir = path.join(frontendRoot, 'pages', pageName);
  const file = path.join(pageDir, 'page.tsx');
  if (fs.existsSync(file)) throw new Error('Page already exists: ' + file);

  const componentName =
    pageName
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('') + 'Page';

  write(
    file,
    `import { FrnlPage } from '../../components/components.js';

export function ${componentName}() {
  return <FrnlPage />;
}

export default ${componentName};
`,
  );
  write(path.join(pageDir, 'orchestrations', '.gitkeep'), '');
  return file;
}
