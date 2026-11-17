import { ConnectionsConfig, NamedAudioBus } from "../../types/index.js";

export interface AudioDeviceInfo {
  deviceId: string;
  label: string;
  groupId: string;
  kind?: 'audioinput' | 'audiooutput';
  isAutoPaired?: boolean;
}

export const STORAGE_KEY = 'celestial_connections_config';

export function loadStoredConfig(
  defaultInputs: NamedAudioBus[],
  defaultDevId = 'default',
  defaultOutId = 'default'
): ConnectionsConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ConnectionsConfig;
      return {
        selectedAudioDeviceId: parsed.selectedAudioDeviceId || defaultDevId,
        selectedAudioOutputDeviceId: parsed.selectedAudioOutputDeviceId || defaultOutId,
        namedAudioInputs: Array.isArray(parsed.namedAudioInputs) && parsed.namedAudioInputs.length > 0
          ? parsed.namedAudioInputs.map((bus) => ({
              ...bus,
              busType: bus.busType || (bus.outputChannels ? 'output' : 'input'),
            }))
          : defaultInputs,
        selectedMidiDeviceId: null,
        midiConfigs: {},
      };
    }
  } catch (e) {
    console.warn('Could not read connections config from storage:', e);
  }

  return {
    selectedAudioDeviceId: defaultDevId,
    selectedAudioOutputDeviceId: defaultOutId,
    namedAudioInputs: defaultInputs,
    selectedMidiDeviceId: null,
    midiConfigs: {},
  };
}

export function saveStoredConfig(config: ConnectionsConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Could not save connections config:', e);
  }
}

export async function enumerateSystemAudioDevices(): Promise<{ inputs: AudioDeviceInfo[]; outputs: AudioDeviceInfo[] }> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
    return {
      inputs: [
        { deviceId: 'default', label: 'Default System Audio Input', groupId: '', kind: 'audioinput' }
      ],
      outputs: [
        { deviceId: 'default', label: 'Default System Audio Output', groupId: '', kind: 'audiooutput' }
      ],
    };
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();

    const inputs: AudioDeviceInfo[] = devices
      .filter((d) => d.kind === 'audioinput')
      .map((d, index) => ({
        deviceId: d.deviceId || `audioinput-${index}`,
        label: d.label || (index === 0 ? 'Default Audio Input / Mic' : `Hardware Audio Input ${index + 1}`),
        groupId: d.groupId || '',
        kind: 'audioinput' as const,
      }));

    const rawOutputs: AudioDeviceInfo[] = devices
      .filter((d) => d.kind === 'audiooutput')
      .map((d, index) => ({
        deviceId: d.deviceId || `audiooutput-${index}`,
        label: d.label || (index === 0 ? 'Default System Audio Output' : `Hardware Audio Output ${index + 1}`),
        groupId: d.groupId || '',
        kind: 'audiooutput' as const,
      }));

    if (inputs.length === 0) {
      inputs.push({ deviceId: 'default', label: 'Default System Audio Input / Interface', groupId: '', kind: 'audioinput' });
    }

    const outputs: AudioDeviceInfo[] = [...rawOutputs];

    inputs.forEach((input) => {
      if (!input.label) return;
      const isNotGeneric =
        !input.label.toLowerCase().startsWith('default') &&
        !input.label.toLowerCase().startsWith('hardware audio input');
      if (isNotGeneric) {
        const alreadyInOutputs = outputs.some(
          (o) =>
            o.groupId === input.groupId ||
            o.label.toLowerCase().includes(input.label.toLowerCase().replace(/input|mic/i, '').trim())
        );
        if (!alreadyInOutputs) {
          outputs.push({
            deviceId: input.deviceId,
            label: `${input.label} (Hardware Outputs / Monitors)`,
            groupId: input.groupId,
            kind: 'audiooutput',
            isAutoPaired: true,
          });
        }
      }
    });

    if (outputs.length === 0) {
      outputs.push(
        { deviceId: 'default', label: 'Default System Audio Output (Speakers / Headphones)', groupId: '', kind: 'audiooutput' },
        { deviceId: 'communications', label: 'Communications Audio Output', groupId: '', kind: 'audiooutput' }
      );
    }

    return { inputs, outputs };
  } catch (e) {
    console.warn('Failed to enumerate audio devices:', e);
    return {
      inputs: [
        { deviceId: 'default', label: 'Default Audio Input', groupId: '', kind: 'audioinput' }
      ],
      outputs: [
        { deviceId: 'default', label: 'Default Audio Output', groupId: '', kind: 'audiooutput' }
      ],
    };
  }
}
