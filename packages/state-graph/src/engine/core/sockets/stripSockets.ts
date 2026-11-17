import { UniversalSocketDefinition, SignalMedium, SignalDataType, SignalType, InputStripNode, OutputStripNode } from "../../types/index.js";
import { createDefaultMapIoConfig } from "../../types/stripsTypes";
import { createPackagedSocket, NodeSocketsResult } from "./socketUtils";

export function getInputStripSockets(node: InputStripNode): NodeSocketsResult {
    const ioCfg = (node as any).mapIoConfig || createDefaultMapIoConfig();
    const inputsList: any[] = ioCfg?.inputs && Array.isArray(ioCfg.inputs)
      ? ioCfg.inputs
      : [];

    const outputs: UniversalSocketDefinition[] = inputsList.map((ch: any, idx: number) => {
      let medium: SignalMedium = 'audio_stereo';
      let signalType: SignalType = 'audio_stereo';
      let dataType: SignalDataType = 'stream';

      if (ch.type === 'trigger' || ch.signalType === 'trigger') {
        medium = 'trigger';
        signalType = 'trigger';
        dataType = 'pulse';
      } else if (ch.type === 'audio') {
        const isMono = ch.signalType === 'audio_mono' || ch.audioFormat === 'mono';
        medium = isMono ? 'audio_mono' : 'audio_stereo';
        signalType = isMono ? 'audio_mono' : 'audio_stereo';
        dataType = ch.signalType === 'audio_packet' ? 'packet' : 'stream';
      } else if (ch.type === 'midi') {
        medium = 'midi';
        signalType = ch.signalType || 'midi_stream';
        dataType = ch.signalType === 'midi_packet' ? 'packet' : 'stream';
      } else if (ch.type === 'osc') {
        medium = 'curve';
        signalType = ch.signalType || 'curve_stream';
        dataType = ch.signalType === 'curve_packet' ? 'packet' : 'stream';
      }

      const formatBadge = ch.type === 'audio' ? (signalType === 'audio_mono' ? ' [MONO]' : ' [STEREO]') : '';
      const displayLabel = `${ch.name.toUpperCase()}${formatBadge}`;

      return createPackagedSocket({
        socketId: `out-${ch.id}`,
        label: displayLabel,
        polarity: 'output',
        medium,
        dataType,
        signalType,
        connectivity: 'multi',
        socketIndex: idx,
        description: `Input Strip Source: ${ch.name} (${signalType.toUpperCase()})`,
        customMeta: { color: ch.color, audioFormat: ch.audioFormat },
        iconName: ch.type === 'trigger' ? 'zap' : ch.type === 'audio' ? 'mic' : ch.type === 'midi' ? 'music' : 'activity',
      });
    });

    return { inputs: [], outputs };
  }


export function getOutputStripSockets(node: OutputStripNode): NodeSocketsResult {
    const ioCfg = (node as any).mapIoConfig || createDefaultMapIoConfig();
    const outputsList: any[] = ioCfg?.outputs && Array.isArray(ioCfg.outputs)
      ? ioCfg.outputs
      : [];

    const inputs: UniversalSocketDefinition[] = outputsList.map((ch: any, idx: number) => {
      let medium: SignalMedium = 'audio_stereo';
      let signalType: SignalType = 'audio_stereo';
      let dataType: SignalDataType = 'stream';

      if (ch.type === 'trigger' || ch.signalType === 'trigger') {
        medium = 'trigger';
        signalType = 'trigger';
        dataType = 'pulse';
      } else if (ch.type === 'audio') {
        const isMono = ch.signalType === 'audio_mono' || ch.audioFormat === 'mono';
        medium = isMono ? 'audio_mono' : 'audio_stereo';
        signalType = isMono ? 'audio_mono' : 'audio_stereo';
        dataType = ch.signalType === 'audio_packet' ? 'packet' : 'stream';
      } else if (ch.type === 'midi') {
        medium = 'midi';
        signalType = ch.signalType || 'midi_stream';
        dataType = ch.signalType === 'midi_packet' ? 'packet' : 'stream';
      } else if (ch.type === 'osc') {
        medium = 'curve';
        signalType = ch.signalType || 'curve_stream';
        dataType = ch.signalType === 'curve_packet' ? 'packet' : 'stream';
      }

      const formatBadge = ch.type === 'audio' ? (signalType === 'audio_mono' ? ' [MONO]' : ' [STEREO]') : '';
      const displayLabel = `${ch.name.toUpperCase()}${formatBadge}`;

      return createPackagedSocket({
        socketId: `in-${ch.id}`,
        label: displayLabel,
        polarity: 'input',
        medium,
        dataType,
        signalType,
        connectivity: 'single',
        socketIndex: idx,
        description: `Output Strip Destination: ${ch.name} (${signalType.toUpperCase()})`,
        customMeta: { color: ch.color, audioFormat: ch.audioFormat },
        iconName: ch.type === 'trigger' ? 'zap' : ch.type === 'audio' ? 'volume-2' : ch.type === 'midi' ? 'disc' : 'activity',
      });
    });

    return { inputs, outputs: [] };
  }

