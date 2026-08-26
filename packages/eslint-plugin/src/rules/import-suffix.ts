export const importSuffixRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce .js extension on relative imports for NodeNext compatibility.',
      recommended: true,
    },
    fixable: 'code',
    messages: {
      missingSuffix: "Relative import '{{path}}' must end with '.js' or '.json' for NodeNext resolution.",
    },
  },
  create(context: any) {
    return {
      ImportDeclaration(node: any) {
        const value = node.source.value;
        if (typeof value === 'string' && value.startsWith('.')) {
          if (!value.endsWith('.js') && !value.endsWith('.json') && !value.endsWith('.css')) {
            context.report({
              node: node.source,
              messageId: 'missingSuffix',
              data: { path: value },
              fix(fixer: any) {
                return fixer.replaceText(node.source, `'${value}.js'`);
              },
            });
          }
        }
      },
    };
  },
};
