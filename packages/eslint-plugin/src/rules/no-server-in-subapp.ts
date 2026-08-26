export const noServerInSubappRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Sub-apps must not instantiate HTTP or WebSocket servers directly; Krnl handles network ingress.',
      recommended: true,
    },
    messages: {
      noServer: "Sub-apps must NEVER start HTTP/WebSocket servers directly ('{{callee}}'). Krnl provides unified network ingress.",
    },
  },
  create(context: any) {
    const filename = context.filename || context.getFilename?.() || '';
    const isSubApp = filename.includes('subapps/') || filename.includes('subapp');

    if (!isSubApp) return {};

    return {
      CallExpression(node: any) {
        let calleeText = '';
        if (node.callee.type === 'MemberExpression') {
          const obj = node.callee.object.name || '';
          const prop = node.callee.property.name || '';
          calleeText = `${obj}.${prop}`;
        }

        if (['http.createServer', 'https.createServer', 'app.listen', 'server.listen'].includes(calleeText)) {
          context.report({
            node,
            messageId: 'noServer',
            data: { callee: calleeText },
          });
        }
      },
    };
  },
};
