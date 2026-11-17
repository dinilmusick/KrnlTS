import * as fs from 'node:fs';
import * as path from 'node:path';

export interface OrchestrationGenerationOptions {
  frontendRoot?: string;
}

function write(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

export function generateOrchestration(pageName: string, orchestrationName: string, projectRoot: string, options: OrchestrationGenerationOptions = {}): string {
  if (!/^[a-z][a-z0-9-]*$/i.test(pageName)) throw new Error('Page name must be alphanumeric with optional hyphens.');
  if (!/^[A-Z][A-Za-z0-9]*$/.test(orchestrationName)) throw new Error('Orchestration name must be PascalCase.');
  const frontendRoot = options.frontendRoot ?? (fs.existsSync(path.join(projectRoot, 'src', 'frontend')) ? path.join(projectRoot, 'src', 'frontend') : projectRoot);
  const file = path.join(frontendRoot, 'pages', pageName, 'orchestrations', orchestrationName + '.ts');
  if (fs.existsSync(file)) throw new Error('Orchestration already exists: ' + file);
  write(file, `import { defineFrnlOrchestration } from '@ultrst-armada/frnlts';

export const ${orchestrationName} = defineFrnlOrchestration({
  id: '${pageName}.${orchestrationName}',
  name: '${orchestrationName}',
  version: '1.0.0',
  setup: ({ onEvent, event, library }) => {
    // Wire page-scoped component events here.
    // Put reusable logic in the page/component Libraries, not here.
    void onEvent;
    void event;
    void library;
  },
});
`);
  return file;
}