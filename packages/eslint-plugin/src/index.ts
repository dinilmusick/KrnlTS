import { fileLineLimitRule } from './rules/file-line-limit.js';
import { importSuffixRule } from './rules/import-suffix.js';
import { helperPurityRule } from './rules/helper-purity.js';
import { noPollingRule } from './rules/no-polling.js';
import { contextDestructuringRule } from './rules/context-destructuring.js';
import { topLevelPurityRule } from './rules/top-level-purity.js';
import { oneComponentPerFileRule } from './rules/one-component-per-file.js';

const rules = {
  'file-line-limit': fileLineLimitRule,
  'import-suffix': importSuffixRule,
  'helper-purity': helperPurityRule,
  'no-polling': noPollingRule,
  'context-destructuring': contextDestructuringRule,
  'top-level-purity': topLevelPurityRule,
  'one-component-per-file': oneComponentPerFileRule,
};

const plugin = {
  meta: {
    name: '@ultrst-armada/eslint-plugin-krnl',
    version: '1.0.2',
  },
  rules,
  configs: {
    recommended: {
      plugins: {
        '@ultrst-armada/krnl': { rules },
      },
      rules: {
        '@ultrst-armada/krnl/file-line-limit': 'error',
        '@ultrst-armada/krnl/import-suffix': 'error',
        '@ultrst-armada/krnl/helper-purity': 'error',
        '@ultrst-armada/krnl/no-polling': 'error',
        '@ultrst-armada/krnl/context-destructuring': 'error',
        '@ultrst-armada/krnl/top-level-purity': 'error',
        '@ultrst-armada/krnl/one-component-per-file': 'error',
      },
    },
  },
};

export default plugin;
