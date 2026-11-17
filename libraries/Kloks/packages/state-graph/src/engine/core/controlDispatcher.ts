import { ControlElement, SpaceNode, NodeConnection } from "../types/index.js";

let configuredControlEngines: { synthEngine?: any; sequencerEngine?: any; audioClipEngine?: any } = {};

export function configureControlDispatcher(engines: {
  synthEngine?: any;
  sequencerEngine?: any;
  audioClipEngine?: any;
}): void {
  configuredControlEngines = { ...configuredControlEngines, ...engines };
  if (engines.synthEngine) {
    (globalThis as any).__KLOKS_SYNTH_ENGINE__ = engines.synthEngine;
    (globalThis as any).__QWNSR_SYNTH_ENGINE__ = engines.synthEngine;
  }
}

const synthEngine: any = new Proxy(
  {},
  {
    get(_target, prop) {
      const globalEngine =
        configuredControlEngines.synthEngine ||
        (globalThis as any).__KLOKS_SYNTH_ENGINE__ ||
        (globalThis as any).__QWNSR_SYNTH_ENGINE__;
      if (globalEngine && typeof globalEngine[prop] === 'function') {
        return globalEngine[prop].bind(globalEngine);
      }
      return () => true;
    },
  }
);

export interface DispatchFeedback {
  timestamp: number;
  elementId: string;
  payloadType: string;
  summary: string;
}

type FeedbackListener = (feedback: DispatchFeedback) => void;

class ControlDispatcher {
  private feedbackListeners: Set<FeedbackListener> = new Set();

  public addFeedbackListener(fn: FeedbackListener): () => void {
    this.feedbackListeners.add(fn);
    return () => this.feedbackListeners.delete(fn);
  }

  /**
   * Main dispatch entry point called whenever a user interacts with a ControlElement.
   * Modulations affect graph node parameters and exposed socket targets.
   * External hardware transmissions are strictly restricted to the Output Strip.
   */
  public dispatchElementPayload(
    element: ControlElement,
    value: number | string | boolean | [number, number],
    context: {
      nodes: SpaceNode[];
      connections: NodeConnection[];
      onUpdateNodes?: (nodes: SpaceNode[]) => void;
      onTriggerNode?: (nodeId: string) => void;
    }
  ): DispatchFeedback {
    const binding = element.binding;
    const now = Date.now();
    let summary = `Updated ${element.label} = ${JSON.stringify(value)}`;

    if (!binding) {
      const fb: DispatchFeedback = {
        timestamp: now,
        elementId: element.id,
        payloadType: 'none',
        summary,
      };
      this.notifyFeedback(fb);
      return fb;
    }

    const { payloadType, synthParam, targetNodeId } = binding;

    // 1. Direct Synth Engine Parameter Modulation
    if (payloadType === 'synth_param' && synthParam) {
      const numVal = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
      switch (synthParam) {
        case 'cutoff':
          (synthEngine as any).setMasterFilterCutoff?.(numVal);
          summary = `Synth Cutoff set to ${Math.round(numVal)} Hz`;
          break;
        case 'resonance':
          (synthEngine as any).setMasterFilterResonance?.(numVal);
          summary = `Synth Resonance set to ${numVal.toFixed(1)}`;
          break;
        case 'bpm':
          summary = `Transport BPM set to ${Math.round(numVal)}`;
          break;
        case 'volume':
        case 'masterVolume':
          synthEngine.setMasterVolume(Math.max(0, Math.min(2.0, numVal / 100)));
          summary = `Master Volume set to ${Math.round(numVal)}%`;
          break;
        default:
          summary = `Modulated ${synthParam} ➔ ${numVal}`;
          break;
      }
    }

    // 2. Trigger Pulse Emission
    else if (payloadType === 'trigger_pulse') {
      if (targetNodeId && context.onTriggerNode) {
        context.onTriggerNode(targetNodeId);
        summary = `Trigger pulse sent to node [${targetNodeId}]`;
      } else {
        synthEngine.playAuditionTestPulse();
        summary = `Master Trigger pulse fired`;
      }
    }

    // 3. MIDI CC Payload for internal graph routing
    else if (payloadType === 'midi_cc') {
      const channel = binding.midiChannel || 1;
      const ccNum = binding.midiCC ?? 1;
      const ccVal = typeof value === 'number' ? Math.round(value) : (value ? 127 : 0);
      summary = `MIDI CC #${ccNum} (Ch ${channel}) = ${ccVal}`;
    }

    // 4. MIDI Note Payload for internal graph routing
    else if (payloadType === 'midi_note') {
      const channel = binding.midiChannel || 1;
      const note = binding.midiNote || 60;
      const vel = binding.midiVelocity || (typeof value === 'number' ? Math.round(value) : 100);
      summary = `MIDI Note #${note} (Ch ${channel}) Vel ${vel}`;
    }

    // 5. CV Curve Value
    else if (payloadType === 'curve_value') {
      if (Array.isArray(value)) {
        summary = `XY Orbit = [${value[0].toFixed(2)}, ${value[1].toFixed(2)}]`;
      } else {
        summary = `CV Modulation = ${value}`;
      }
    }

    // 6. Custom JSON or String Payload
    else if (payloadType === 'raw_json' || payloadType === 'custom_string') {
      let templated = binding.dynamicTemplate || String(binding.staticPayload || '');
      templated = templated.replace(/\{value\}/g, String(value));
      summary = `Custom Payload: ${templated}`;
    }

    const feedback: DispatchFeedback = {
      timestamp: now,
      elementId: element.id,
      payloadType,
      summary,
    };

    this.notifyFeedback(feedback);
    return feedback;
  }

  private notifyFeedback(fb: DispatchFeedback): void {
    this.feedbackListeners.forEach((fn) => fn(fb));
  }
}

export const controlDispatcher = new ControlDispatcher();
