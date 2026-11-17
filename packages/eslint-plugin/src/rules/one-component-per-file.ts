export const oneComponentPerFileRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce strictly one React component per file in .tsx/.jsx files.',
      recommended: true,
    },
    messages: {
      multipleComponents: "File '{{filename}}' defines multiple React components ({{components}}). Krnl enforces strictly ONE component per file. Decompose into sub-component files.",
    },
  },
  create(context: any) {
    const filename = context.filename || context.getFilename?.() || '';
    if (!filename.endsWith('.tsx') && !filename.endsWith('.jsx')) return {};

    const baseName = filename.replace(/\\/g, '/').split('/').pop() || '';
    const componentDeclarations: Array<{ name: string; node: any }> = [];

    function hasJsx(node: any): boolean {
      if (!node) return false;
      if (node.type === 'JSXElement' || node.type === 'JSXFragment') return true;
      if (node.type === 'ReturnStatement') return hasJsx(node.argument);
      if (node.type === 'BlockStatement') {
        return node.body.some((stmt: any) => hasJsx(stmt));
      }
      if (node.type === 'IfStatement') {
        return hasJsx(node.consequent) || hasJsx(node.alternate);
      }
      return false;
    }

    return {
      FunctionDeclaration(node: any) {
        const name = node.id?.name;
        if (name && /^[A-Z]/.test(name) && hasJsx(node.body)) {
          componentDeclarations.push({ name, node });
        }
      },
      VariableDeclarator(node: any) {
        const name = node.id?.name;
        if (!name || !/^[A-Z]/.test(name)) return;

        const isFcType = node.id.typeAnnotation?.typeAnnotation?.typeName?.name === 'FC' ||
          node.id.typeAnnotation?.typeAnnotation?.typeName?.right?.name === 'FC' ||
          node.id.typeAnnotation?.typeAnnotation?.typeName?.right?.name === 'FunctionComponent';

        if (node.init && (node.init.type === 'ArrowFunctionExpression' || node.init.type === 'FunctionExpression')) {
          if (isFcType || hasJsx(node.init.body)) {
            componentDeclarations.push({ name, node });
          }
        }
      },
      ClassDeclaration(node: any) {
        const name = node.id?.name;
        if (name && node.superClass) {
          const superName = node.superClass.name || node.superClass.property?.name;
          if (['Component', 'PureComponent'].includes(superName)) {
            componentDeclarations.push({ name, node });
          }
        }
      },
      'Program:exit'() {
        if (componentDeclarations.length > 1) {
          const names = componentDeclarations.map(c => c.name).join(', ');
          for (let i = 1; i < componentDeclarations.length; i++) {
            context.report({
              node: componentDeclarations[i].node,
              messageId: 'multipleComponents',
              data: { filename: baseName, components: names },
            });
          }
        }
      },
    };
  },
};
