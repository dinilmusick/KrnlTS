import { generateComponent, generateEvent, generateLibrary, generateState } from './generators/componentGenerator.js';
import { generateOrchestration } from './generators/orchestrationGenerator.js';
import { generatePage } from './generators/pageGenerator.js';
import { runBuild } from './commands/build.js';
import { runDev } from './commands/dev.js';
import { inspectComponent } from './commands/inspect.js';
import { runValidate } from './commands/validate.js';
import { runWatch } from './commands/watch.js';

export { generateComponent, generateState, generateEvent, generateLibrary, generateOrchestration, generatePage, runBuild, runDev, inspectComponent, runValidate, runWatch };

export async function runFrnlCli(rawArgv: string[] = process.argv.slice(2)): Promise<number> {
  const argv = rawArgv[0] === '--' ? rawArgv.slice(1) : rawArgv;
  const [command, type, name, ...rest] = argv;
  const root = process.cwd();

  if (command === 'generate' && type === 'component') {
    const states = rest.filter((arg) => arg.startsWith('--state=')).map((arg) => arg.slice(8));
    const events = rest.filter((arg) => arg.startsWith('--event=')).map((arg) => arg.slice(8));
    generateComponent(name, root, { states, events });
    console.log('Created Frnl component ' + name + '.');
    return 0;
  }

  if (command === 'generate' && type === 'state' && name && rest[0]) {
    generateState(name, rest[0], root);
    return 0;
  }
  if (command === 'generate' && type === 'event' && name && rest[0] && rest[1]) {
    generateEvent(name, rest[0], rest[1], root);
    return 0;
  }
  if (command === 'generate' && type === 'library' && name && rest[0] && rest[1] && ['functions', 'data', 'structs'].includes(rest[0])) {
    generateLibrary(name, rest[0] as 'functions' | 'data' | 'structs', rest[1], root);
    return 0;
  }
  if (command === 'generate' && type === 'orchestration' && name && rest[0]) {
    generateOrchestration(name, rest[0], root);
    return 0;
  }

  if (command === 'generate' && type === 'page' && name) {
    generatePage(name, root);
    console.log('Created Frnl page ' + name + '.');
    return 0;
  }

  if (command === 'validate') return runValidate(root);
  if (command === 'build') return runBuild(root);
  if (command === 'dev') return runDev(root);
  if (command === 'watch') {
    runWatch(root);
    return 0;
  }
  if (command === 'inspect' && type === 'component' && name) {
    inspectComponent(name, root);
    return 0;
  }

  console.error('Usage: frnl generate component <Name> [--state=Idle] [--event=Click] | frnl generate state <Component> <State> | frnl generate event <Component> <State> <Event> | frnl generate library <Component> <functions|data|structs> <Name> | frnl generate orchestration <Page> <Orchestration> | frnl generate page <Page> | frnl validate | frnl build | frnl dev | frnl watch | frnl inspect component <Name>');
  return 1;
}
