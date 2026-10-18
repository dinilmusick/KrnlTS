export const noPollingRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prohibit setInterval and polling in favor of reactive event streams.',
      recommended: true,
    },
    messages: {
      noPolling: "Prohibited use of '{{callee}}'. Krnl systems must use reactive events (facade.emitEvent / facade.on) instead of polling.",
    },
  },
  create(context: any) {
    return {
      CallExpression(node: any) {
        let calleeName = '';
        if (node.callee.type === 'Identifier') {
          calleeName = node.callee.name;
        } else if (node.callee.type === 'MemberExpression' && node.callee.property.type === 'Identifier') {
          calleeName = node.callee.property.name;
        }

        if (calleeName === 'setInterval') {
          context.report({
            node,
            messageId: 'noPolling',
            data: { callee: calleeName },
          });
        }
      },
    };
  },
};
