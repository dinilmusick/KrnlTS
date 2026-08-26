import { fileLineLimitRule } from './rules/file-line-limit.js';
import { importSuffixRule } from './rules/import-suffix.js';
import { helperPurityRule } from './rules/helper-purity.js';
import { noPollingRule } from './rules/no-polling.js';
import { contextDestructuringRule } from './rules/context-destructuring.js';
import { noServerInSubappRule } from './rules/no-server-in-subapp.js';

const rules = {
  'file-line-limit': fileLineLimitRule,
  'import-suffix': importSuffixRule,
  'helper-purity': helperPurityRule,
  'no-polling': noPollingRule,
  'context-destructuring': contextDestructuringRule,
  'no-server-in-subapp': noServerInSubappRule,
};

const plugin = {
  meta: {
    name: '@dinilmusick/eslint-plugin-krnl',
    version: '1.0.0',
  },
  rules,
  configs: {
    recommended: {
      plugins: {
        '@dinilmusick/krnl': { rules },
      },
      rules: {
        '@dinilmusick/krnl/file-line-limit': 'error',
        '@dinilmusick/krnl/import-suffix': 'error',
        '@dinilmusick/krnl/helper-purity': 'error',
        '@dinilmusick/krnl/no-polling': 'error',
        '@dinilmusick/krnl/context-destructuring': 'error',
        '@dinilmusick/krnl/no-server-in-subapp': 'error',
      },
    },
  },
};

export default plugin;
