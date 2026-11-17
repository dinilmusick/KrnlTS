import { UniversalSocketDefinition, SignalMedium, SignalDataType, SignalType } from "../../types/index.js";
import { SamplerNode, AudioPadsNode } from "../../types/index.js";
import { createPackagedSocket, NodeSocketsResult } from "./socketUtils";

export function getSamplerSockets(node: SamplerNode): NodeSocketsResult {
    return {
      inputs: [
        createPackagedSocket({
          socketId: 'store_in',
          label: 'STORE IN',
          polarity: 'input',
          medium: 'audio_stereo',
          dataType: 'packet',
          signalType: 'audio_packet',
          connectivity: 'multi',
          socketIndex: 0,
          description: 'Store In: Connects to Audio Containers (mono and stereo) to load sample zones',
          iconName: 'box',
          customMeta: { acceptsAnyAudioFormat: true, legacySocketId: 'packet_in' },
        }),
        createPackagedSocket({
          socketId: 'midi_in',
          label: 'MIDI IN',
          polarity: 'input',
          medium: 'midi',
          dataType: 'stream',
          signalType: 'midi_stream',
          connectivity: 'single',
          socketIndex: 1,
          description: 'MIDI In: Stream input for triggering samples with pitch shift across mapped note zones',
          iconName: 'music',
        }),
      ],
      outputs: [
        createPackagedSocket({
          socketId: 'stream_out',
          label: 'AUDIO OUT (STEREO)',
          polarity: 'output',
          medium: 'audio_stereo',
          dataType: 'stream',
          signalType: 'audio_stereo',
          connectivity: 'multi',
          socketIndex: 0,
          description: 'Audio Out: High quality stereo multisample audio stream',
          iconName: 'volume_2',
        }),
      ],
    };
  }


export function getAudioPadsSockets(node: AudioPadsNode): NodeSocketsResult {
    const padNode = node as AudioPadsNode;
    const inputs: UniversalSocketDefinition[] = [
      createPackagedSocket({
        socketId: 'store_in',
        label: 'STORE IN',
        polarity: 'input',
        medium: 'audio_stereo',
        dataType: 'packet',
        signalType: 'audio_packet',
        connectivity: 'multi',
        socketIndex: 0,
        description: 'Store In: Connects to Audio Containers (mono and stereo) to load sample pads',
        iconName: 'box',
        customMeta: { acceptsAnyAudioFormat: true, legacySocketId: 'packet_in' },
      }),
      createPackagedSocket({
        socketId: 'midi_in',
        label: 'MIDI IN',
        polarity: 'input',
        medium: 'midi',
        dataType: 'stream',
        signalType: 'midi_stream',
        connectivity: 'single',
        socketIndex: 1,
        description: 'MIDI In: Stream input for triggering assigned sample drum pads',
        iconName: 'music',
      }),
    ];

    let outputs: UniversalSocketDefinition[] = [];
    if (padNode.pads && padNode.pads.length > 0) {
      outputs = padNode.pads.map((pad, idx) => {
        const isMono = pad.audioFormat === 'mono';
        const formatLabel = isMono ? 'MONO' : 'STEREO';
        return createPackagedSocket({
          socketId: `out_${pad.id}`,
          label: `${pad.name.toUpperCase()} (${formatLabel})`,
          polarity: 'output',
          medium: isMono ? 'audio_mono' : 'audio_stereo',
          dataType: 'stream',
          signalType: isMono ? 'audio_mono' : 'audio_stereo',
          connectivity: 'multi',
          socketIndex: idx,
          description: `Direct Audio Out for pad ${pad.name} (${formatLabel})`,
          iconName: 'volume_2',
        });
      });
    } else {
      outputs = [
        createPackagedSocket({
          socketId: 'stream_out',
          label: 'AUDIO OUT (STEREO)',
          polarity: 'output',
          medium: 'audio_stereo',
          dataType: 'stream',
          signalType: 'audio_stereo',
          connectivity: 'multi',
          socketIndex: 0,
          description: 'Audio Out: Direct audio output',
          iconName: 'volume_2',
        }),
      ];
    }

    return { inputs, outputs };
  }

