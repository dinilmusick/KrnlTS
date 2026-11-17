import { SpaceNode, CodeNode, UniversalSocketDefinition } from "../../types/index.js";
import { generateCodeNodeSockets } from '../../functions/codeNodeParser';
import { NodeSocketsResult } from './types';
import { createPackagedSocket } from './createPackagedSocket';

export function getPrimitiveSockets(node: SpaceNode): NodeSocketsResult | null {
  if (node.type === 'trigger') {
    return {
      inputs: [
        createPackagedSocket({
          socketId: 'trigger_in',
          label: 'SYNC IN',
          polarity: 'input',
          medium: 'trigger',
          dataType: 'stream',
          signalType: 'trigger_stream',
          connectivity: 'single',
          socketIndex: 0,
          description: 'Sync In: External pulse resets or triggers clock phase',
          iconName: 'zap',
        }),
      ],
      outputs: [
        createPackagedSocket({
          socketId: 'trigger_out',
          label: 'TRIG STR OUT',
          polarity: 'output',
          medium: 'trigger',
          dataType: 'stream',
          signalType: 'trigger_stream',
          connectivity: 'multi',
          socketIndex: 0,
          description: 'Trigger Stream Out: Quantized tempo clock trigger pulse stream carrying timing in bars, beats, and fractions',
          iconName: 'zap',
        }),
      ],
    };
  }

  if (node.type === 'code') {
    const codeNode = node as CodeNode;
    return generateCodeNodeSockets(codeNode.code || '', createPackagedSocket);
  }

  if (node.type === 'primitive_string') {
    return {
      inputs: [
        createPackagedSocket({
          socketId: 'in_str',
          label: 'STR IN',
          polarity: 'input',
          medium: 'data',
          dataType: 'stream',
          signalType: 'string',
          connectivity: 'single',
          socketIndex: 0,
          description: 'String Input: External text to set or override string primitive',
          iconName: 'file-text',
        }),
      ],
      outputs: [
        createPackagedSocket({
          socketId: 'out_str',
          label: 'STR OUT',
          polarity: 'output',
          medium: 'data',
          dataType: 'stream',
          signalType: 'string',
          connectivity: 'multi',
          socketIndex: 0,
          description: 'String Output: Emits primitive string text for filenames, labels, and parameters',
          iconName: 'file-text',
        }),
      ],
    };
  }

  if (node.type === 'primitive_number') {
    return {
      inputs: [
        createPackagedSocket({
          socketId: 'in_num',
          label: 'NUM IN',
          polarity: 'input',
          medium: 'data',
          dataType: 'stream',
          signalType: 'number',
          connectivity: 'single',
          socketIndex: 0,
          description: 'Number Input: External value to set numeric parameter',
          iconName: 'hash',
        }),
      ],
      outputs: [
        createPackagedSocket({
          socketId: 'out_num',
          label: 'NUM OUT',
          polarity: 'output',
          medium: 'data',
          dataType: 'stream',
          signalType: 'number',
          connectivity: 'multi',
          socketIndex: 0,
          description: 'Number Output: Emits primitive numeric value',
          iconName: 'hash',
        }),
      ],
    };
  }

  if (node.type === 'primitive_boolean') {
    return {
      inputs: [
        createPackagedSocket({
          socketId: 'in_bool',
          label: 'BOOL IN',
          polarity: 'input',
          medium: 'data',
          dataType: 'stream',
          signalType: 'boolean',
          connectivity: 'single',
          socketIndex: 0,
          description: 'Boolean Input: Sets true/false boolean parameter flag',
          iconName: 'toggle-left',
        }),
      ],
      outputs: [
        createPackagedSocket({
          socketId: 'out_bool',
          label: 'BOOL OUT',
          polarity: 'output',
          medium: 'data',
          dataType: 'stream',
          signalType: 'boolean',
          connectivity: 'multi',
          socketIndex: 0,
          description: 'Boolean Output: Emits boolean true/false toggle state',
          iconName: 'toggle-left',
        }),
      ],
    };
  }

  if (node.type === 'primitive_object') {
    return {
      inputs: [
        createPackagedSocket({
          socketId: 'in_obj',
          label: 'OBJ IN',
          polarity: 'input',
          medium: 'data',
          dataType: 'stream',
          signalType: 'object',
          connectivity: 'single',
          socketIndex: 0,
          description: 'Object Input: Ingests dictionary/object payload',
          iconName: 'braces',
        }),
      ],
      outputs: [
        createPackagedSocket({
          socketId: 'out_obj',
          label: 'OBJ OUT',
          polarity: 'output',
          medium: 'data',
          dataType: 'stream',
          signalType: 'object',
          connectivity: 'multi',
          socketIndex: 0,
          description: 'Object Output: Emits structured JSON dictionary object',
          iconName: 'braces',
        }),
      ],
    };
  }

  if (node.type === 'folder_path') {
    return {
      inputs: [
        createPackagedSocket({
          socketId: 'select_in',
          label: 'SELECT IN',
          polarity: 'input',
          medium: 'data',
          dataType: 'stream',
          signalType: 'string',
          connectivity: 'single',
          socketIndex: 0,
          description: 'Select In: Programmatically select active folder name from incoming string or object',
          iconName: 'folder',
        }),
      ],
      outputs: [
        createPackagedSocket({
          socketId: 'folders_obj',
          label: 'FOLDERS OBJ',
          polarity: 'output',
          medium: 'data',
          dataType: 'stream',
          signalType: 'object',
          connectivity: 'multi',
          socketIndex: 0,
          description: 'Folders Object Output: Emits structured object containing user-defined folders list, selected folder, and base path',
          iconName: 'braces',
        }),
        createPackagedSocket({
          socketId: 'folder_str',
          label: 'FOLDER PATH',
          polarity: 'output',
          medium: 'data',
          dataType: 'stream',
          signalType: 'string',
          connectivity: 'multi',
          socketIndex: 1,
          description: 'Folder Path Output: Emits selected user-defined folder path string to configure Containers or Code nodes',
          iconName: 'folder',
        }),
        createPackagedSocket({
          socketId: 'folders_list',
          label: 'FOLDERS LIST',
          polarity: 'output',
          medium: 'data',
          dataType: 'stream',
          signalType: 'array',
          connectivity: 'multi',
          socketIndex: 2,
          description: 'Folders List Output: Emits list of user-defined folder names as an array',
          iconName: 'layers',
        }),
      ],
    };
  }

  if (node.type === 'button') {
    return {
      inputs: [],
      outputs: [
        createPackagedSocket({
          socketId: 'trigger_out',
          label: 'PULSE OUT',
          polarity: 'output',
          medium: 'trigger',
          dataType: 'pulse',
          signalType: 'trigger',
          connectivity: 'multi',
          socketIndex: 0,
          description: 'Pulse Out: Sends manual trigger pulse on press/state change',
          iconName: 'zap',
        }),
      ],
    };
  }

  return null;
}
