export const helperPurityRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Layer 1 helper purity: helper functions cannot import state or I/O modules directly.',
      recommended: true,
    },
    messages: {
      impureImport: "Helper functions (Layer 1) cannot import I/O or state module '{{module}}'. Delegate to Layer 0 libraries or Entity context.",
    },
  },
  create(context: any) {
    const filename = context.filename || context.getFilename?.() || '';
    const isHelper = filename.includes('helper_functions') || filename.includes('/helpers/');

    if (!isHelper) return {};

    return {
      ImportDeclaration(node: any) {
        const source = node.source.value;
        if (['fs', 'node:fs', 'http', 'node:http', 'ws'].includes(source) || /state(\.js)?$/.test(source)) {
          context.report({
            node,
            messageId: 'impureImport',
            data: { module: source },
          });
        }
      },
    };
  },
};
