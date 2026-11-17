import {
  SpaceNode,
  CombinerNode,
  MultiplexerNode,
  ConverterNode,
  ModuleNode,
  EffectNode,
  ArrangementNode,
  UniversalSocketDefinition,
  SignalMedium,
  SignalDataType,
  SignalType,
} from "../../types/index.js";
import { NodeSocketsResult } from './types';
import { createPackagedSocket } from './createPackagedSocket';

export function getProcessorSockets(node: SpaceNode): NodeSocketsResult | null {
  if (node.type === 'combiner') {
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

  if (node.type === 'multiplexer') {
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

  if (node.type === 'converter') {
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

  if (node.type === 'module') {
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

  if (node.type === 'effect') {
    const eNode = node as EffectNode;
    const isTrigger = eNode.effectType === 'repeater';
    const isMidi = eNode.effectType === 'velocity';
    const inSig: SignalType = isTrigger ? 'trigger' : isMidi ? 'midi' : 'audio_stereo';
    const medium: SignalMedium = isTrigger ? 'trigger' : isMidi ? 'midi' : 'audio_stereo';
    const dataType: SignalDataType = isTrigger ? 'pulse' : 'stream';

    const inputs: UniversalSocketDefinition[] = [
      createPackagedSocket({
        socketId: 'in_0',
        label: isTrigger ? 'TRIG IN' : isMidi ? 'MIDI IN' : 'AUDIO IN',
        polarity: 'input',
        medium,
        dataType,
        signalType: inSig,
        connectivity: 'single',
        socketIndex: 0,
        description: `${eNode.name || eNode.effectType} Primary Signal Input`,
        iconName: isTrigger ? 'zap' : isMidi ? 'music' : 'volume_2',
      }),
    ];

    if (eNode.effectType === 'compressor' || eNode.effectType === 'multiband_compressor') {
      inputs.push(
        createPackagedSocket({
          socketId: 'sidechain_in',
          label: 'SIDECHAIN IN',
          polarity: 'input',
          medium: 'audio_stereo',
          dataType: 'stream',
          signalType: 'audio_stereo',
          connectivity: 'single',
          socketIndex: 1,
          description: 'Sidechain Key In: External audio signal driving dynamic ducking attenuation',
          iconName: 'split',
        })
      );
    }

    const outputs: UniversalSocketDefinition[] = [
      createPackagedSocket({
        socketId: 'out_0',
        label: isTrigger ? 'TRIG OUT' : isMidi ? 'MIDI OUT' : 'AUDIO OUT',
        polarity: 'output',
        medium,
        dataType,
        signalType: inSig,
        connectivity: 'multi',
        socketIndex: 0,
        description: `${eNode.name || eNode.effectType} Processed Signal Output`,
        iconName: isTrigger ? 'zap' : isMidi ? 'music' : 'volume_2',
      }),
    ];

    return { inputs, outputs };
  }

  if (node.type === 'control') {
    return {
      inputs: [
        createPackagedSocket({
          socketId: 'sync_in',
          label: 'SYNC IN',
          polarity: 'input',
          medium: 'trigger',
          dataType: 'pulse',
          signalType: 'trigger',
          connectivity: 'single',
          socketIndex: 0,
          description: 'Sync In: External trigger or clock to pulse or advance control parameters',
          iconName: 'zap',
        }),
        createPackagedSocket({
          socketId: 'cv_in',
          label: 'CV / MOD IN',
          polarity: 'input',
          medium: 'curve',
          dataType: 'stream',
          signalType: 'curve_stream',
          connectivity: 'single',
          socketIndex: 1,
          description: 'CV Modulation In: External CV stream to modulate mapped UI parameters',
          iconName: 'trending-up',
        }),
      ],
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
          description: 'Pulse Out: Triggers fired from UI buttons, pads, and sequence triggers',
          iconName: 'zap',
        }),
        createPackagedSocket({
          socketId: 'midi_out',
          label: 'MIDI OUT',
          polarity: 'output',
          medium: 'midi',
          dataType: 'stream',
          signalType: 'midi',
          connectivity: 'multi',
          socketIndex: 1,
          description: 'MIDI Out: Live CC and Note stream generated by sliders, knobs, and pads',
          iconName: 'music',
        }),
        createPackagedSocket({
          socketId: 'cv_out',
          label: 'CV OUT',
          polarity: 'output',
          medium: 'curve',
          dataType: 'stream',
          signalType: 'curve_stream',
          connectivity: 'multi',
          socketIndex: 2,
          description: 'CV Out: Continuous normalized modulation voltage (0.0 to 1.0)',
          iconName: 'activity',
        }),
      ],
    };
  }

  if (node.type === 'arrangement') {
    const arrNode = node as ArrangementNode;
    const tracks = arrNode.tracks || [];

    const inputs: UniversalSocketDefinition[] = [
      createPackagedSocket({
        socketId: 'omni_packet_in',
        label: 'OMNI PACKET IN',
        polarity: 'input',
        medium: 'omni',
        dataType: 'packet',
        signalType: 'omni_packet',
        connectivity: 'multi',
        socketIndex: 0,
        isOmni: true,
        description: 'Universal Omni Packet Ingest Handle: Multi-connect receptacle accepting packets of any signal type (Audio, MIDI, Curve)',
        customMeta: { acceptsAnySignal: true, isArrangementIngest: true, isOmni: true, isPacketHandle: true, legacySocketId: 'container_in' },
        iconName: 'box',
      }),
      createPackagedSocket({
        socketId: 'trigger_in',
        label: 'PLAY TRIG',
        polarity: 'input',
        medium: 'trigger',
        dataType: 'pulse',
        signalType: 'trigger',
        connectivity: 'single',
        socketIndex: 1,
        description: 'Arrangement Play Trigger: Pulse or clock trigger to start and play arrangement timeline from beginning',
        iconName: 'zap',
      }),
    ];

    const outputs: UniversalSocketDefinition[] = [];

    tracks.forEach((t) => {
      const isMonoAudio = t.signalType === 'audio_mono';
      const isStereoAudio = t.signalType === 'audio_stereo' || t.signalType === 'audio';
      const isAud = isMonoAudio || isStereoAudio;
      const isMid = t.signalType.includes('midi');
      const isTrig = t.signalType === 'trigger';

      const medium: SignalMedium = isMonoAudio
        ? 'audio_mono'
        : isStereoAudio
        ? 'audio_stereo'
        : isMid
        ? 'midi'
        : isTrig
        ? 'trigger'
        : 'curve';

      const sigType: SignalType = isMonoAudio
        ? 'audio_mono'
        : isStereoAudio
        ? 'audio_stereo'
        : isMid
        ? 'midi_stream'
        : isTrig
        ? 'trigger'
        : 'curve_stream';

      const dType: SignalDataType = isTrig ? 'pulse' : 'stream';

      outputs.push(
        createPackagedSocket({
          socketId: `out_track_${t.id}`,
          label: `${t.name.toUpperCase()} OUT`,
          polarity: 'output',
          medium,
          dataType: dType,
          signalType: sigType,
          connectivity: 'multi',
          socketIndex: outputs.length,
          description: `Track ${t.name} Dedicated Output (${sigType.toUpperCase()})`,
          customMeta: { color: t.color, trackId: t.id },
          iconName: isAud ? (isMonoAudio ? 'volume-1' : 'volume-2') : isMid ? 'disc' : isTrig ? 'zap' : 'activity',
        })
      );
    });

    return { inputs, outputs };
  }

  return null;
}
