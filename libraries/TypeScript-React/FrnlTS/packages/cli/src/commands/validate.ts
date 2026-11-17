import { formatValidation, validateFrnlWorkspace } from '@ultrst-armada/frnlts-validate';

export function runValidate(root: string = process.cwd()): number {
  const result = validateFrnlWorkspace(root);
  console.log(formatValidation(result));
  return result.passed ? 0 : 1;
}
