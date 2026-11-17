import { UniversalSocketDefinition, SignalMedium, SignalDataType, SignalType } from "../../types/index.js";
import { RecorderNode, PlayerNode } from "../../types/index.js";
import { createPackagedSocket, NodeSocketsResult } from "./socketUtils";

export function getRecorderSockets(node: RecorderNode): NodeSocketsResult {
    const rec = node as RecorderNode;
    const recType = rec.recorderType || 'audio_mono';
    const isAudioMono = recType === 'audio_mono' || recType === 'audio';
    const isAudioStereo = recType === 'audio_stereo';
    const isCurve = recType === 'curve';
    const medium: SignalMedium = isAudioMono ? 'audio_mono' : isAudioStereo ? 'audio_stereo' : isCurve ? 'curve' : 'midi';
    const streamSig: SignalType = isAudioMono ? 'audio_mono' : isAudioStereo ? 'audio_stereo' : isCurve ? 'curve_stream' : 'midi_stream';
    const packetSig: SignalType = isAudioMono || isAudioStereo ? 'audio_packet' : isCurve ? 'curve_packet' : 'midi_packet';

    const streamLabel = isAudioMono ? 'AUDIO IN (MONO)' : isAudioStereo ? 'AUDIO IN (STEREO)' : isCurve ? 'CV STREAM IN' : 'MIDI STREAM IN';
    const isRetro = rec.recordingMode === 'retrospective';
    const trigLabel = isRetro ? 'CAPTURE TRIG' : 'REC TRIG';
    const trigDesc = isRetro
      ? 'Capture Trigger: Pulse triggers retrospective snapshot capture of rolling buffer take into container'
      : 'Rec Trigger: Clock pulse to arm or start/stop quantized packet recording';

    const inputs: UniversalSocketDefinition[] = [
      createPackagedSocket({
        socketId: 'stream_in',
        label: streamLabel,
        polarity: 'input',
        medium,
        dataType: 'stream',
        signalType: streamSig,
        connectivity: 'single',
        socketIndex: 0,
        description: 'Stream In: Continuous live stream signal to capture and package',
        iconName: isAudioStereo || isAudioMono ? 'activity' : isCurve ? 'trending_up' : 'music',
      }),
      createPackagedSocket({
        socketId: 'arm_in',
        label: 'ARM TRIG',
        polarity: 'input',
        medium: 'trigger',
        dataType: 'pulse',
        signalType: 'trigger',
        connectivity: 'single',
        socketIndex: 1,
        description: 'Arm Trigger: Pulse arms or disarms recorder input monitoring and preview waveform state',
        iconName: 'disc',
      }),
      createPackagedSocket({
        socketId: 'trigger_in',
        label: trigLabel,
        polarity: 'input',
        medium: 'trigger',
        dataType: 'pulse',
        signalType: 'trigger',
        connectivity: 'single',
        socketIndex: 2,
        description: trigDesc,
        iconName: 'zap',
      }),
    ];

    const outputs: UniversalSocketDefinition[] = [
      createPackagedSocket({
        socketId: 'packet_out',
        label: 'PACKET OUT',
        polarity: 'output',
        medium,
        dataType: 'packet',
        signalType: packetSig,
        connectivity: 'multi',
        socketIndex: 0,
        description: 'Packet Out: Multi-connect packet output that pushes recorded packets to containers',
        customMeta: { isPacketHandle: true, isRecorderOutput: true, legacySocketId: 'store' },
        iconName: 'box',
      }),
    ];

    return { inputs, outputs };
  }


export function getPlayerSockets(node: PlayerNode): NodeSocketsResult {
    const ply = node as PlayerNode;
    const plyType = ply.playerType || 'audio_stereo';
    const isAudioMono = plyType === 'audio_mono';
    const isAudioStereo = plyType === 'audio_stereo' || plyType === 'audio';
    const isCurve = plyType === 'curve';
    const medium: SignalMedium = isAudioMono ? 'audio_mono' : isAudioStereo ? 'audio_stereo' : isCurve ? 'curve' : 'midi';
    const packetSig: SignalType = (isAudioMono || isAudioStereo) ? 'audio_packet' : isCurve ? 'curve_packet' : 'midi_packet';
    const streamSig: SignalType = isAudioMono ? 'audio_mono' : isAudioStereo ? 'audio_stereo' : isCurve ? 'curve_stream' : 'midi_stream';
    const streamLabel = isAudioMono ? 'AUDIO OUT (MONO)' : isAudioStereo ? 'AUDIO OUT (STEREO)' : isCurve ? 'CV OUT' : 'MIDI OUT';

    const inputs: UniversalSocketDefinition[] = [
      createPackagedSocket({
        socketId: 'packet_in',
        label: 'PACKET IN',
        polarity: 'input',
        medium,
        dataType: 'packet',
        signalType: packetSig,
        connectivity: 'single',
        socketIndex: 0,
        description: 'Packet In: Connects to Container PACKET OUT to load stored packets for playback',
        customMeta: { isPacketHandle: true, legacySocketId: 'retrieve' },
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
        description: 'Play Trigger: Clock or pulse to start/retrigger quantized stream playback',
        iconName: 'zap',
      }),
    ];

    if (isAudioStereo || isAudioMono || plyType === 'midi') {
      inputs.push(
        createPackagedSocket({
          socketId: 'midi_in',
          label: 'MIDI IN',
          polarity: 'input',
          medium: 'midi',
          dataType: 'stream',
          signalType: 'midi_stream',
          connectivity: 'single',
          socketIndex: 2,
          description: 'MIDI In: Note pitch and velocity for chromatic/polyphonic sample or synth playback',
          iconName: 'music',
        })
      );
    }

    const outputs: UniversalSocketDefinition[] = [
      createPackagedSocket({
        socketId: 'stream_out',
        label: streamLabel,
        polarity: 'output',
        medium,
        dataType: 'stream',
        signalType: streamSig,
        connectivity: 'multi',
        socketIndex: 0,
        description: 'Stream Out: Continuous playback audio/MIDI stream',
        iconName: isAudioStereo || isAudioMono ? 'volume_2' : isCurve ? 'trending_up' : 'music',
      }),
    ];

    return { inputs, outputs };
  }

