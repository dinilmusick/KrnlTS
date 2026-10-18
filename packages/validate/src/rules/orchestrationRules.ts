import * as path from 'path';
import { SourceFile, SyntaxKind, Node } from 'ts-morph';
import { ValidationError } from '../types.js';

export function checkOrchestrationRules(
  sf: SourceFile
): { errors: ValidationError[]; warnings: ValidationError[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const filePath = sf.getFilePath();
  const sourceText = sf.getText();
  const calls = sf.getDescendantsOfKind(SyntaxKind.CallExpression);

  // 1. Anti-Polling
  for (const call of calls) {
    const exprText = call.getExpression().getText();
    if (exprText === 'setInterval' || exprText === 'window.setInterval') {
      errors.push({
        ruleId: 'krnl/no-polling',
        filePath,
        line: call.getStartLineNumber(),
        message: `Prohibited use of 'setInterval'. Krnl applications must use reactive event streams or triggers.`,
        severity: 'error',
      });
    }
  }

  // 2. Context Destructuring
  if (sourceText.includes('main = async') || sourceText.includes('export const main = async')) {
    const match = sourceText.match(/main\s*=\s*async\s*\([^,]+,\s*\{([^}]*)\}\s*\)/);
    if (match) {
      const destructured = match[1];
      if (/\bsystem\b/.test(destructured)) {
        errors.push({
          ruleId: 'krnl/context-destructuring',
          filePath,
          message: `Functionality context parameter destructures 'system'. Functionality passes { state, orchestration } or service context.`,
          severity: 'error',
        });
      }
    }
  }

  // 3. Orchestration Class Checks
  const isOrchestrationClass = sf.getClasses().some((c) => {
    const ext = c.getExtends();
    return ext && (ext.getText().includes('Orchestration') || ext.getText().includes('krnlOrchestrationBase'));
  });

  if (isOrchestrationClass) {
    for (const decl of sf.getImportDeclarations()) {
      const spec = decl.getModuleSpecifierValue();
      if (spec.includes('libraries/') || spec.includes('Concepts')) {
        errors.push({
          ruleId: 'krnl/orchestration-no-libraries',
          filePath,
          line: decl.getStartLineNumber(),
          message: `Orchestration class violates Library Calling Invariant. Orchestrations must not call or import libraries directly ('${spec}'). Only functionalities are permitted to call shared libraries.`,
          severity: 'error',
        });
      }
    }

    for (const cls of sf.getClasses()) {
      const ext = cls.getExtends();
      if (ext && (ext.getText().includes('Orchestration') || ext.getText().includes('krnlOrchestrationBase'))) {
        const loops = [
          ...cls.getDescendantsOfKind(SyntaxKind.ForStatement),
          ...cls.getDescendantsOfKind(SyntaxKind.ForOfStatement),
          ...cls.getDescendantsOfKind(SyntaxKind.ForInStatement),
          ...cls.getDescendantsOfKind(SyntaxKind.WhileStatement),
          ...cls.getDescendantsOfKind(SyntaxKind.DoStatement),
        ];

        for (const loop of loops) {
          errors.push({
            ruleId: 'krnl/orchestration-purity',
            filePath,
            line: loop.getStartLineNumber(),
            message: `Orchestration '${cls.getName() || 'Anonymous'}' violates Orchestration Purity Law. Loops and procedural algorithms are prohibited inside orchestrations. Move logic to a functionality or a global library function.`,
            severity: 'error',
          });
        }

        for (const method of cls.getMethods()) {
          const methodName = method.getName();
          if (!['flow', 'getFlow', 'listFlows', 'clearFlows'].includes(methodName)) {
            errors.push({
              ruleId: 'krnl/orchestration-purity',
              filePath,
              line: method.getStartLineNumber(),
              message: `Orchestration '${cls.getName() || 'Anonymous'}' defines custom method '${methodName}'. Orchestrations are purely declarative compositors. Define capabilities as functionalities or global library functions.`,
              severity: 'error',
            });
          }
        }
      }
    }

    for (const call of calls) {
      const callText = call.getText();
      if (callText.startsWith('this.flow(') || callText.startsWith('orchestration.flow(')) {
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
          if (step.name === 'flow') {
            chainId = step.argText ? step.argText.replace(/['"]/g, '') : 'orchestration';
          } else if (step.name === 'thenFunction') {
            errors.push({
              ruleId: 'krnl/orchestration-no-direct-library-calls',
              filePath,
              line: step.node.getStartLineNumber(),
              message: `Orchestration flow '${chainId}' violates Orchestration Purity Law. Orchestrations cannot chain direct library functions via thenFunction(). Orchestrations must only sequence functionalities (thenFunctionality) and peer orchestrations (thenOrchestration).`,
              severity: 'error',
            });
          }
        }
      }
    }
  }

  return { errors, warnings };
}
