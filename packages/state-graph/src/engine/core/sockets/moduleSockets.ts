import { UniversalSocketDefinition, SignalMedium, SignalDataType, SignalType } from "../../types/index.js";
import { ModuleNode } from "../../types/index.js";
import { createPackagedSocket, NodeSocketsResult } from "./socketUtils";

export function getModuleSockets(node: ModuleNode): NodeSocketsResult {
    const mNode = node as ModuleNode;
    const exposedInputs = mNode.exposedInputs || [];
    const exposedOutputs = mNode.exposedOutputs || [];

    const inputs: UniversalSocketDefinition[] =
      exposedInputs.length === 0
        ? [
            createPackagedSocket({
              socketId: 'in_0',
              label: 'Module In',
              polarity: 'input',
              medium: 'trigger',
              dataType: 'pulse',
              signalType: 'trigger',
              connectivity: 'single',
              socketIndex: 0,
              description: 'Default Sub-Graph Module Input',
            }),
          ]
        : exposedInputs.map((mapping, idx) => {
            const sig = mapping.signalType || 'trigger';
            const isPkt = sig.includes('packet');
            const isPulse = sig === 'trigger';
            const medium: SignalMedium =
              sig.includes('audio') ? 'audio_stereo' :
              sig.includes('midi') ? 'midi' :
              sig.includes('curve') ? 'curve' : 'trigger';
            const dataType: SignalDataType = isPkt ? 'packet' : isPulse ? 'pulse' : 'stream';

            return createPackagedSocket({
              socketId: mapping.innerPortId || `in_${idx}`,
              label: mapping.label || `In ${idx + 1}`,
              polarity: 'input',
              medium,
              dataType,
              signalType: sig,
              connectivity: 'single',
              socketIndex: mapping.moduleSocketIndex ?? idx,
              description: `Exposed Sub-Graph Input: ${mapping.label}`,
            });
          });

    const outputs: UniversalSocketDefinition[] =
      exposedOutputs.length === 0
        ? [
            createPackagedSocket({
              socketId: 'out_0',
              label: 'Module Out',
              polarity: 'output',
              medium: 'midi',
              dataType: 'stream',
              signalType: 'midi',
              connectivity: 'multi',
              socketIndex: 0,
              description: 'Default Sub-Graph Module Output',
            }),
          ]
        : exposedOutputs.map((mapping, idx) => {
            const sig = mapping.signalType || 'midi';
            const isPkt = sig.includes('packet');
            const isPulse = sig === 'trigger';
            const medium: SignalMedium =
              sig.includes('audio') ? 'audio_stereo' :
              sig.includes('midi') ? 'midi' :
              sig.includes('curve') ? 'curve' : 'trigger';
            const dataType: SignalDataType = isPkt ? 'packet' : isPulse ? 'pulse' : 'stream';

            return createPackagedSocket({
              socketId: mapping.innerPortId || `out_${idx}`,
              label: mapping.label || `Out ${idx + 1}`,
              polarity: 'output',
              medium,
              dataType,
              signalType: sig,
              connectivity: 'multi',
              socketIndex: mapping.moduleSocketIndex ?? idx,
              description: `Exposed Sub-Graph Output: ${mapping.label}`,
            });
          });

    return { inputs, outputs };
  }

