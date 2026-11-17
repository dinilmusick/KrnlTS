import { UniversalSocketDefinition, SignalMedium, SignalDataType, SignalType } from "../../types/index.js";
import { CodeNode, StringNode, NumberNode, BooleanNode, ObjectNode } from "../../types/index.js";
import { generateCodeNodeSockets } from "../../functions/codeNodeParser";
import { createPackagedSocket, NodeSocketsResult } from "./socketUtils";

export function getCodeSockets(node: CodeNode): NodeSocketsResult {
    const codeNode = node as CodeNode;
    return generateCodeNodeSockets(codeNode.code || '', createPackagedSocket);
  }


export function getPrimitiveStringSockets(node: StringNode): NodeSocketsResult {
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


export function getPrimitiveNumberSockets(node: NumberNode): NodeSocketsResult {
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


export function getPrimitiveBooleanSockets(node: BooleanNode): NodeSocketsResult {
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


export function getPrimitiveObjectSockets(node: ObjectNode): NodeSocketsResult {
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

