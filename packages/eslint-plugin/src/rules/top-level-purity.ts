export const topLevelPurityRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Top-Level File Purity: top-level files (App.tsx, main.ts, server.ts, etc.) must only import and compose components/modules without raw HTML/JSX markup, hooks, or route handlers.',
      recommended: true,
    },
    messages: {
      topLevelRawMarkup: "Top-level file '{{filename}}' violates Top-Level Purity Law. Raw JSX/HTML tag '<{{tag}}>' is strictly forbidden. Top-level files must ONLY import and compose React components.",
      topLevelHook: "Top-level file '{{filename}}' violates Top-Level Purity Law. React hook '{{hook}}' is forbidden in top-level files. Encapsulate state and effects inside dedicated component files.",
      topLevelBackendRoute: "Backend entry file '{{filename}}' violates Entry Purity Law. Inline route definition '{{route}}' is forbidden. Delegate to dedicated route/controller modules.",
    },
  },
  create(context: any) {
    const filename = context.filename || context.getFilename?.() || '';
    const normalized = filename.replace(/\\/g, '/');
    const baseName = normalized.split('/').pop() || '';

    const isUiTopLevel = /^(App|main|index|_app|root)\.(tsx|jsx)$/i.test(baseName);
    const isBackendTopLevel = /^(server|app|main|index)\.(ts|js)$/i.test(baseName) &&
      (normalized.endsWith(`/${baseName}`) || normalized.includes('/src/') || !normalized.includes('/'));

    if (!isUiTopLevel && !isBackendTopLevel) return {};

    return {
      JSXOpeningElement(node: any) {
        if (!isUiTopLevel) return;
        const tagName = getTagName(node.name);
        if (tagName && /^[a-z]/.test(tagName)) {
          context.report({
            node,
            messageId: 'topLevelRawMarkup',
            data: { filename: baseName, tag: tagName },
          });
        }
      },
      JSXSelfClosingElement(node: any) {
        if (!isUiTopLevel) return;
        const tagName = getTagName(node.name);
        if (tagName && /^[a-z]/.test(tagName)) {
          context.report({
            node,
            messageId: 'topLevelRawMarkup',
            data: { filename: baseName, tag: tagName },
          });
        }
      },
      CallExpression(node: any) {
        // Check UI hooks
        if (isUiTopLevel) {
          let calleeName = '';
          if (node.callee.type === 'Identifier') {
            calleeName = node.callee.name;
          } else if (node.callee.type === 'MemberExpression' && node.callee.property.type === 'Identifier') {
            calleeName = node.callee.property.name;
          }

          if (
            ['useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useReducer', 'useContext', 'useLayoutEffect'].includes(calleeName) ||
            (/^use[A-Z]/.test(calleeName) && calleeName !== 'use')
          ) {
            context.report({
              node,
              messageId: 'topLevelHook',
              data: { filename: baseName, hook: calleeName },
            });
          }
        }

        // Check backend routes
        if (isBackendTopLevel) {
          if (node.callee.type === 'MemberExpression') {
            const objName = node.callee.object.name || '';
            const propName = node.callee.property.name || '';
            const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
            if (['app', 'router', 'server'].includes(objName) && httpMethods.includes(propName.toLowerCase())) {
              context.report({
                node,
                messageId: 'topLevelBackendRoute',
                data: { filename: baseName, route: `${objName}.${propName}` },
              });
            }
          }
        }
      },
    };
  },
};

function getTagName(nameNode: any): string | null {
  if (!nameNode) return null;
  if (nameNode.type === 'JSXIdentifier') return nameNode.name;
  if (nameNode.type === 'JSXMemberExpression') return `${getTagName(nameNode.object)}.${nameNode.property.name}`;
  return null;
}
