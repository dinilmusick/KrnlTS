import { UniversalSocketDefinition, SignalMedium, SignalDataType, SignalType } from "../../types/index.js";
import { CombinerNode, MultiplexerNode, ConverterNode } from "../../types/index.js";
import { createPackagedSocket, NodeSocketsResult } from "./socketUtils";

export function getCombinerSockets(node: CombinerNode): NodeSocketsResult {
    const cNode = node as CombinerNode;
    const count = Math.max(2, Math.min(8, cNode.inputCount || 3));
    const rawSig = cNode.signalType || 'trigger';
    const medium: SignalMedium =
      rawSig === 'audio' || rawSig === 'audio_stereo' ? 'audio_stereo' :
      rawSig === 'audio_mono' ? 'audio_mono' :
      rawSig === 'midi' ? 'midi' :
      rawSig === 'curve' ? 'curve' : 'trigger';
    const dataType: SignalDataType = medium === 'trigger' ? 'pulse' : 'stream';
    const sigType: SignalType =
      medium === 'trigger' ? 'trigger' :
      medium === 'midi' ? 'midi_stream' :
      medium === 'curve' ? 'curve_stream' :
      medium === 'audio_mono' ? 'audio_mono' : 'audio_stereo';

    const inputs: UniversalSocketDefinition[] = [];
    for (let i = 0; i < count; i++) {
      inputs.push(
        createPackagedSocket({
          socketId: `in_${i}`,
          label: `IN ${i + 1}`,
          polarity: 'input',
          medium,
          dataType,
          signalType: sigType,
          connectivity: 'single',
          socketIndex: i,
          description: `Input Port ${i + 1} for signal combination`,
        })
      );
    }

    const outputs: UniversalSocketDefinition[] = [
      createPackagedSocket({
        socketId: 'out_0',
        label: 'COMBINED',
        polarity: 'output',
        medium,
        dataType,
        signalType: sigType,
        connectivity: 'multi',
        socketIndex: 0,
        description: 'Combined Output: Merged or summed signal stream',
      }),
    ];

    return { inputs, outputs };
  }


export function getMultiplexerSockets(node: MultiplexerNode): NodeSocketsResult {
    const mNode = node as MultiplexerNode;
    const count = Math.max(2, Math.min(8, mNode.outputCount || 4));
    const rawSig = mNode.signalType || 'trigger';
    const medium: SignalMedium =
      rawSig === 'audio' || rawSig === 'audio_stereo' ? 'audio_stereo' :
      rawSig === 'audio_mono' ? 'audio_mono' :
      rawSig === 'midi' ? 'midi' :
      rawSig === 'curve' ? 'curve' : 'trigger';
    const dataType: SignalDataType = medium === 'trigger' ? 'pulse' : 'stream';
    const sigType: SignalType =
      medium === 'trigger' ? 'trigger' :
      medium === 'midi' ? 'midi_stream' :
      medium === 'curve' ? 'curve_stream' :
      medium === 'audio_mono' ? 'audio_mono' : 'audio_stereo';

    const inputs: UniversalSocketDefinition[] = [
      createPackagedSocket({
        socketId: 'in_0',
        label: 'INPUT',
        polarity: 'input',
        medium,
        dataType,
        signalType: sigType,
        connectivity: 'single',
        socketIndex: 0,
        description: 'Input Signal to distribute across output branches',
      }),
    ];

    const outputs: UniversalSocketDefinition[] = [];
    for (let i = 0; i < count; i++) {
      outputs.push(
        createPackagedSocket({
          socketId: `out_${i}`,
          label: `OUT ${i + 1}`,
          polarity: 'output',
          medium,
          dataType,
          signalType: sigType,
          connectivity: 'multi',
          socketIndex: i,
          description: `Output Branch ${i + 1}`,
        })
      );
    }

    return { inputs, outputs };
  }


export function getConverterSockets(node: ConverterNode): NodeSocketsResult {
    const conv = node as ConverterNode;
    const isStereoToMono = conv.converterType === 'stereo_to_mono';

    return {
      inputs: [
        createPackagedSocket({
          socketId: 'audio_in',
          label: isStereoToMono ? 'STEREO IN' : 'MONO IN',
          polarity: 'input',
          medium: isStereoToMono ? 'audio_stereo' : 'audio_mono',
          dataType: 'stream',
          signalType: isStereoToMono ? 'audio_stereo' : 'audio_mono',
          connectivity: 'single',
          socketIndex: 0,
          description: isStereoToMono ? 'Stereo Audio In for mono collapse' : 'Mono Audio In for stereo expansion',
        }),
      ],
      outputs: [
        createPackagedSocket({
          socketId: 'audio_out',
          label: isStereoToMono ? 'MONO OUT' : 'STEREO OUT',
          polarity: 'output',
          medium: isStereoToMono ? 'audio_mono' : 'audio_stereo',
          dataType: 'stream',
          signalType: isStereoToMono ? 'audio_mono' : 'audio_stereo',
          connectivity: 'multi',
          socketIndex: 0,
          description: isStereoToMono ? 'Collapsed Mono Output' : 'Expanded Stereo Output',
        }),
      ],
    };
  }

