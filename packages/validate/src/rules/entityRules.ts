import * as path from 'path';
import { SourceFile, SyntaxKind, Node } from 'ts-morph';
import { ValidationError } from '../types.js';

export function checkEntityRules(
  sf: SourceFile
): { errors: ValidationError[]; warnings: ValidationError[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const filePath = sf.getFilePath();
  const sourceText = sf.getText();
  const baseName = path.basename(filePath);
  const calls = sf.getDescendantsOfKind(SyntaxKind.CallExpression);

  // 1. Anti-Polling
  for (const call of calls) {
    const exprText = call.getExpression().getText();
    if (exprText === 'setInterval' || exprText === 'window.setInterval') {
      errors.push({
        ruleId: 'krnl/no-polling',
        filePath,
        line: call.getStartLineNumber(),
        message: `Prohibited use of 'setInterval'. Krnl applications must use reactive event streams (entity.emitEvent / entity.on).`,
        severity: 'error',
      });
    }
  }

  // 2. Context Destructuring
  if (sourceText.includes('main = async') || sourceText.includes('export const main = async')) {
    const match = sourceText.match(/main\s*=\s*async\s*\([^,]+,\s*\{([^}]*)\}\s*\)/);
    if (match) {
      const destructured = match[1];
      if (/\bsystem\b/.test(destructured) && !/\bentity\b/.test(destructured)) {
        errors.push({
          ruleId: 'krnl/context-destructuring',
          filePath,
          message: `Functionality context parameter destructures 'system'. Functionality passes { state, entity }. Always destructure 'entity'.`,
          severity: 'error',
        });
      }
    }
  }

  // 3. Entity Class Checks
  const isEntityClass = sf.getClasses().some((c) => {
    const ext = c.getExtends();
    return ext && (ext.getText().includes('Entity') || ext.getText().includes('krnlEntityBase'));
  });

  if (isEntityClass) {
    for (const decl of sf.getImportDeclarations()) {
      const spec = decl.getModuleSpecifierValue();
      if (spec.includes('libraries/') || spec.includes('Concepts')) {
        errors.push({
          ruleId: 'krnl/entity-no-libraries',
          filePath,
          line: decl.getStartLineNumber(),
          message: `Entity class violates Library Calling Invariant. Entities must not call or import libraries directly ('${spec}'). Only functionalities in 'src/functionalities/' are permitted to call shared libraries.`,
          severity: 'error',
        });
      }
    }

    let loadAllLine = -1;
    const addLocalLines: Array<{ line: number; hasUiSpec: boolean; id: string }> = [];

    for (const call of calls) {
      const txt = call.getText();
      if (txt.includes('MagneticLoader.loadAll') || txt.includes('KrnlMagneticLoader.loadAll')) {
        loadAllLine = call.getStartLineNumber();
      } else if (txt.startsWith('this.addLocal(')) {
        const hasUiSpec = txt.includes('uiSpec');
        const idMatch = txt.match(/id\s*:\s*["']([^"']+)["']/);
        addLocalLines.push({
          line: call.getStartLineNumber(),
          hasUiSpec,
          id: idMatch ? idMatch[1] : 'unknown',
        });
      }
    }

    if (loadAllLine !== -1) {
      for (const al of addLocalLines) {
        if (al.hasUiSpec && al.line > loadAllLine) {
          errors.push({
            ruleId: 'krnl/boot-order',
            filePath,
            line: al.line,
            message: `addLocal('${al.id}') with uiSpec at line ${al.line} appears AFTER loadAll() at line ${loadAllLine}. All addLocal() with UI must precede loadAll().`,
            severity: 'error',
          });
        }
      }
    }

    for (const cls of sf.getClasses()) {
      const ext = cls.getExtends();
      if (ext && (ext.getText().includes('Entity') || ext.getText().includes('krnlEntityBase'))) {
        const loops = [
          ...cls.getDescendantsOfKind(SyntaxKind.ForStatement),
          ...cls.getDescendantsOfKind(SyntaxKind.ForOfStatement),
          ...cls.getDescendantsOfKind(SyntaxKind.ForInStatement),
          ...cls.getDescendantsOfKind(SyntaxKind.WhileStatement),
          ...cls.getDescendantsOfKind(SyntaxKind.DoStatement),
        ];

        for (const loop of loops) {
          errors.push({
            ruleId: 'krnl/entity-purity',
            filePath,
            line: loop.getStartLineNumber(),
            message: `Entity '${cls.getName() || 'Anonymous'}' violates Entity Purity Law. Loops and procedural algorithms are prohibited inside entities. Move logic to a functionality or a global library function.`,
            severity: 'error',
          });
        }

        for (const method of cls.getMethods()) {
          const methodName = method.getName();
          if (!['boot', 'init', 'dispose'].includes(methodName)) {
            errors.push({
              ruleId: 'krnl/entity-purity',
              filePath,
              line: method.getStartLineNumber(),
              message: `Entity '${cls.getName() || 'Anonymous'}' defines custom method '${methodName}'. Entities are purely declarative compositors/orchestrators. Define capabilities as functionalities or global library functions.`,
              severity: 'error',
            });
          }
        }
      }
    }

    for (const call of calls) {
      const callText = call.getText();
      if (callText.startsWith('this.orchestration(') || callText.startsWith('this.flow(')) {
        let currentExpr: any = call;
        const chainCalls: Array<{ name: string; node: any; argText?: string }> = [];

        while (currentExpr && Node.isCallExpression(currentExpr)) {
          const propAccess = currentExpr.getExpression();
          if (Node.isPropertyAccessExpression(propAccess)) {
            const methodName = propAccess.getName();
            const args = currentExpr.getArguments();
            const argText = args.length > 0 ? args[0].getText() : undefined;
            chainCalls.unshift({ name: methodName, node: currentExpr, argText });
            currentExpr = propAccess.getExpression();
          } else {
            break;
          }
        }

        let chainId = 'orchestration';
        for (const step of chainCalls) {
          if (step.name === 'orchestration' || step.name === 'flow') {
            chainId = step.argText ? step.argText.replace(/['"]/g, '') : 'orchestration';
          } else if (step.name === 'thenFunction') {
            errors.push({
              ruleId: 'krnl/entity-no-direct-library-calls',
              filePath,
              line: step.node.getStartLineNumber(),
              message: `Orchestration chain '${chainId}' violates Entity Purity Law. Entities cannot chain direct library functions via thenFunction(). Entities must only orchestrate functionalities (thenFunctionality) and orchestrations from other entities (thenEntityOrchestration).`,
              severity: 'error',
            });
          }
        }
      }
    }
  }

  return { errors, warnings };
}
