export interface ComponentNode {
  id: string;
  type: string; // e.g. 'KrnlButton', 'KrnlTextInput', 'KrnlDropdown', 'KrnlTile', 'Container'
  props: Record<string, any>;
  children?: ComponentNode[];
}

export class VanJSCodeGenerator {
  /**
   * Generates production-ready VanJS TypeScript source code from a component tree.
   */
  static generateCode(root: ComponentNode, componentName: string = 'GeneratedView'): string {
    const usedAtoms = new Set<string>();
    this.collectUsedAtoms(root, usedAtoms);

    const atomImports = Array.from(usedAtoms)
      .filter(a => a !== 'Container' && a.startsWith('Krnl'))
      .join(', ');

    let code = `import van from 'vanjs-core';\n`;
    if (atomImports.length > 0) {
      code += `import { ${atomImports} } from '@dinilmusick/krnl-ui';\n`;
    }
    code += `\n`;
    code += `export function ${componentName}({ state, entity }: any): HTMLElement {\n`;
    code += `  const { div } = van.tags;\n\n`;
    code += `  return ${this.renderNodeToCode(root, 2)};\n`;
    code += `}\n\n`;
    code += `export default ${componentName};\n`;

    return code;
  }

  private static renderNodeToCode(node: ComponentNode, indentLevel: number): string {
    const indent = ' '.repeat(indentLevel);
    const childIndent = ' '.repeat(indentLevel + 2);

    if (node.type === 'Container') {
      const childCode = (node.children || [])
        .map(c => this.renderNodeToCode(c, indentLevel + 2))
        .join(',\n');

      return `div(\n${childIndent}{ class: '${node.props.class || 'krnl-container'}' }${childCode ? `,\n${childCode}` : ''}\n${indent})`;
    }

    // KrnlUI Atom Node
    const propEntries = Object.entries(node.props)
      .map(([k, v]) => {
        if (typeof v === 'string' && (v.startsWith('state.') || v.startsWith('entity.'))) {
          return `${k}: ${v}`;
        }
        if (k.startsWith('on') && typeof v === 'string') {
          return `${k}: () => { ${v} }`;
        }
        return `${k}: ${JSON.stringify(v)}`;
      })
      .join(', ');

    return `${node.type}({ ${propEntries} })`;
  }

  private static collectUsedAtoms(node: ComponentNode, atoms: Set<string>) {
    atoms.add(node.type);
    if (node.children) {
      for (const c of node.children) {
        this.collectUsedAtoms(c, atoms);
      }
    }
  }
}
