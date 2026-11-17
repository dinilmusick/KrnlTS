import { TriggerNode, TriggerType, ButtonNode } from "../../types/index.js";

export function createTriggerNode(
  index: number,
  position?: [number, number, number],
  triggerType: TriggerType = 'beats'
): TriggerNode {
  const isFraction = triggerType === 'beat_fractions';
  return {
    id: `trig-${Date.now()}`,
    type: 'trigger',
    name: isFraction ? `Fractions Sequencer ${index}` : `Beats Sequencer ${index}`,
    position: position || [
      (Math.random() - 0.5) * 8,
      0,
      (Math.random() - 0.5) * 8,
    ],
    triggerType,
    intervalBeats: isFraction ? 0.25 : 1,
    divisionMode: isFraction ? 'divisions' : 'every_beat',
    divisionsPerBeat: isFraction ? 64 : 1,
    stepsPerCycle: isFraction ? 64 : 4,
    activeSteps: [true, true, true, true],
    activeFractions: isFraction ? Array.from({ length: 64 }, (_, i) => i % 16 === 0) : undefined,
    active: true,
    color: '#fbbf24',
    label: isFraction ? 'Fractions Seq' : 'Beats Seq',
    acceptedEffects: ['repeater', 'delay'],
  };
}

export function createButtonNode(index: number, position?: [number, number, number]): ButtonNode {
  return {
    id: `btn-${Date.now()}`,
    type: 'button',
    name: `Button Trigger ${index}`,
    position: position || [
      (Math.random() - 0.5) * 8,
      0,
      (Math.random() - 0.5) * 8,
    ],
    active: true,
    color: '#34d399',
    radius: 1.0,
    label: 'Manual Trigger',
    buttonMode: 'momentary',
    buttonState: false,
  };
}
