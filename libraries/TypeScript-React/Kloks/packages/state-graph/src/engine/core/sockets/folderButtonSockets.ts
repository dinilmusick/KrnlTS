import { UniversalSocketDefinition, SignalMedium, SignalDataType, SignalType } from "../../types/index.js";
import { FolderPathNode, ButtonNode } from "../../types/index.js";
import { createPackagedSocket, NodeSocketsResult } from "./socketUtils";

export function getFolderPathSockets(node: FolderPathNode): NodeSocketsResult {
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


export function getButtonSockets(node: ButtonNode): NodeSocketsResult {
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

