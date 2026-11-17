import * as fs from 'node:fs';
import * as path from 'node:path';
import type { FrnlValidationDiagnostic } from './types.js';

function files(root: string): string[] {
  const result: string[] = [];
  const ignored = new Set(['node_modules', '.git', 'dist', 'build', '.next']);
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ignored.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) result.push(full);
    }
  };
  walk(root);
  return result;
}

export function checkComponentScaffolds(root: string): FrnlValidationDiagnostic[] {
  const diagnostics: FrnlValidationDiagnostic[] = [];
  const components: string[] = [];
  const walk = (dir: string) => {
    if (path.basename(dir) === 'node_modules') return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (!entry.isDirectory()) continue;
      if (fs.existsSync(path.join(full, `${entry.name}.tsx`))) components.push(full);
      walk(full);
    }
  };
  walk(root);
  for (const component of components) {
    const states = path.join(component, 'States');
    const libraries = path.join(component, 'Libraries');
    if (!fs.existsSync(states)) diagnostics.push({ ruleId:'frnl/component-states-scaffold', filePath:component, message:'Frnl component is missing States/. Generate the component through the Frnl CLI.', severity:'error' });
    if (!fs.existsSync(libraries)) diagnostics.push({ ruleId:'frnl/component-libraries-scaffold', filePath:component, message:'Frnl component is missing Libraries/. Generate the component through the Frnl CLI.', severity:'error' });
    if (fs.existsSync(states)) {
      for (const state of fs.readdirSync(states, {withFileTypes:true}).filter(e=>e.isDirectory())) {
        const events = path.join(states, state.name, 'Events');
        if (!fs.existsSync(events)) diagnostics.push({ruleId:'frnl/state-events-scaffold',filePath:path.join(states,state.name),message:`State '${state.name}' is missing Events/.`,severity:'error'});
      }
    }
  }
  return diagnostics;
}

export function checkFrnlPageArchitecture(root: string): FrnlValidationDiagnostic[] {
  const diagnostics: FrnlValidationDiagnostic[] = [];
  const frontend = path.join(root, 'src', 'frontend');
  if (!fs.existsSync(frontend) || !fs.statSync(frontend).isDirectory()) return diagnostics;

  for (const forbidden of ['frontend-state', 'layouts', 'layout']) {
    const candidate = path.join(frontend, forbidden);
    if (fs.existsSync(candidate)) {
      diagnostics.push({
        ruleId: 'frnl/frontend-boundary',
        filePath: candidate,
        message: `Frnl frontend cannot contain '${forbidden}/'; use only pages/ and components/ at the frontend root.`,
        severity: 'error',
      });
    }
  }

  for (const entry of fs.readdirSync(frontend, { withFileTypes: true })) {
    if (entry.isDirectory() && !['pages', 'components'].includes(entry.name)) {
      diagnostics.push({
        ruleId: 'frnl/frontend-boundary',
        filePath: path.join(frontend, entry.name),
        message: 'Frnl frontend may contain only pages/ and components/ directories.',
        severity: 'error',
      });
    }
  }

  const pages = path.join(frontend, 'pages');
  if (!fs.existsSync(pages)) return diagnostics;
  for (const pageEntry of fs.readdirSync(pages, { withFileTypes: true })) {
    if (!pageEntry.isDirectory() || pageEntry.name.startsWith('.')) continue;
    const pageDir = path.join(pages, pageEntry.name);
    const pageFile = path.join(pageDir, 'page.tsx');
    if (!fs.existsSync(pageFile)) {
      diagnostics.push({
        ruleId: 'frnl/page-entry-required',
        filePath: pageDir,
        message: 'Every route-scoped Frnl page directory must contain page.tsx.',
        severity: 'error',
      });
      continue;
    }

    const pageSource = fs.readFileSync(pageFile, 'utf8');
    if (!/components[\\/]components(?:\.js)?['"]/.test(pageSource)) {
      diagnostics.push({
        ruleId: 'frnl/page-component-facade',
        filePath: pageFile,
        message: 'Pages must import UI through components/components.ts.',
        severity: 'error',
      });
    }

    const orchestrationDir = path.join(pageDir, 'orchestrations');
    if (fs.existsSync(orchestrationDir)) {
      for (const orchestration of fs.readdirSync(orchestrationDir, { withFileTypes: true })) {
        if (!orchestration.isFile() || !orchestration.name.endsWith('.ts')) continue;
        const filePath = path.join(orchestrationDir, orchestration.name);
        const source = fs.readFileSync(filePath, 'utf8');
        if (!source.includes('defineFrnlOrchestration(')) {
          diagnostics.push({
            ruleId: 'frnl/orchestration-definition-required',
            filePath,
            message: 'Page orchestration files must define a Frnl orchestration.',
            severity: 'error',
          });
        }
      }
    }
  }

  return diagnostics;
}

export function collectWorkspaceFiles(root: string): string[] {
  return files(root);
}
