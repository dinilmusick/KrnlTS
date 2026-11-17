import { SourceFile, SyntaxKind } from 'ts-morph';
import { ValidationError } from '../types.js';

/**
 * Enforces Service Boundary Laws:
 * - Cross-service library imports are strictly forbidden.
 * - Service B cannot import Service A's libraries via direct filesystem paths (e.g. `../../ServiceA/libraries/...`).
 * - Libraries must be consumed through the owning ServiceFacade (e.g. `ServiceAFacade.libraries.userValidation`).
 */
export function checkServiceBoundaries(
  sf: SourceFile
): { errors: ValidationError[]; warnings: ValidationError[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const filePath = sf.getFilePath().replace(/\\/g, '/');

  // Check if current file is inside a service directory: .../services/<CurrentService>/...
  const serviceMatch = filePath.match(/\/services\/([^/]+)\//);
  if (!serviceMatch) {
    return { errors, warnings };
  }
  const currentService = serviceMatch[1];

  const imports = sf.getImportDeclarations();
  for (const imp of imports) {
    const spec = imp.getModuleSpecifierValue();
    // Check if the import path targets another service's internal libraries
    // e.g. ../../ServiceA/libraries/... or /services/ServiceA/libraries/...
    const crossServiceLibMatch = spec.match(/(?:^|\/|\.\.\/)services\/([^/]+)\/libraries\//) ||
      spec.match(/\.\.\/(?:(?:\.\.\/)+)?([^/]+)\/libraries\//);

    if (crossServiceLibMatch) {
      const targetService = crossServiceLibMatch[1];
      if (targetService !== currentService && targetService !== '.' && targetService !== '..') {
        errors.push({
          ruleId: 'krnl/no-cross-service-library-imports',
          filePath,
          line: imp.getStartLineNumber(),
          message: `Cross-service library import forbidden: '${spec}'. Service '${currentService}' cannot import '${targetService}' libraries directly via filesystem. Access libraries through the '${targetService}' ServiceFacade (e.g. ${targetService}Facade.libraries).`,
          severity: 'error',
        });
      }
    }
  }

  return { errors, warnings };
}
