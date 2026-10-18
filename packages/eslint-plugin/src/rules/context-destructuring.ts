export const contextDestructuringRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent the { state, system } destructuring trap; require { state, facade } or { state, service } in functionality handlers.',
      recommended: true,
    },
    messages: {
      destructureSystem: "Functionality context parameter destructures 'system'. Functionality passes { state, facade }. Destructure 'facade' or 'service'.",
    },
  },
  create(context: any) {
    return {
      FunctionDeclaration(node: any) {
        checkParams(node, context);
      },
      ArrowFunctionExpression(node: any) {
        checkParams(node, context);
      },
      FunctionExpression(node: any) {
        checkParams(node, context);
      },
    };
  },
};

function checkParams(node: any, context: any) {
  if (node.params && node.params.length >= 2) {
    const ctxParam = node.params[1];
    if (ctxParam && ctxParam.type === 'ObjectPattern') {
      let hasSystem = false;
      let hasValidContext = false;
      for (const prop of ctxParam.properties) {
        if (prop.type === 'Property' && prop.key.type === 'Identifier') {
          if (prop.key.name === 'system') hasSystem = true;
          if (['facade', 'service', 'orchestration'].includes(prop.key.name)) hasValidContext = true;
        }
      }
      if (hasSystem && !hasValidContext) {
        context.report({
          node: ctxParam,
          messageId: 'destructureSystem',
        });
      }
    }
  }
}
