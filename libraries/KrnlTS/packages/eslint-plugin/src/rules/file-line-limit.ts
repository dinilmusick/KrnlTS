export const fileLineLimitRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce max 200 lines per file for Krnl codebases.',
      recommended: true,
    },
    schema: [
      {
        type: 'object',
        properties: {
          max: { type: 'number', default: 200 },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      fileLineLimitExceeded: "File has {{lines}} lines, which exceeds the strict Krnl limit of {{max}} lines. Decompose into sub-components, custom hooks, quad-units, or concept libraries.",
    },
  },
  create(context: any) {
    const max = context.options[0]?.max ?? 200;
    const sourceCode = context.sourceCode || context.getSourceCode();
    const lines = sourceCode.lines.length;

    return {
      Program(node: any) {
        if (lines > max) {
          context.report({
            node,
            messageId: 'fileLineLimitExceeded',
            data: { lines, max },
          });
        }
      },
    };
  },
};
