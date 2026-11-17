import { TriggerNode, TriggerDivisionMode } from "../types/index.js";

export interface TriggerStepInfo {
  stepDuration: number;
  stepsPerCycle: number;
  divisionsPerBeat: number;
  currentStep: number;
}

export function getTriggerStepDuration(node: TriggerNode): { stepDuration: number; totalSteps: number; divisionsPerBeat: number } {
  const mode: TriggerDivisionMode = node.divisionMode || 'every_beat';
  const divisions = Math.max(2, Math.min(64, node.divisionsPerBeat || 4));

  switch (mode) {
    case 'every_bar':
      return { stepDuration: 4.0, totalSteps: 1, divisionsPerBeat: 1 };
    case 'every_beat':
      return { stepDuration: 1.0, totalSteps: 4, divisionsPerBeat: 1 };
    case 'divisions':
      return {
        stepDuration: 1.0 / divisions,
        totalSteps: 4 * divisions,
        divisionsPerBeat: divisions,
      };
    case '4_4':
      return { stepDuration: 1.0, totalSteps: 4, divisionsPerBeat: 1 };
    case '2_4':
      return { stepDuration: 1.0, totalSteps: 2, divisionsPerBeat: 1 };
    case '16th':
      return { stepDuration: 0.25, totalSteps: 16, divisionsPerBeat: 4 };
    case '32nd':
      return { stepDuration: 0.125, totalSteps: 16, divisionsPerBeat: 8 };
    case '64th':
      return { stepDuration: 0.0625, totalSteps: 16, divisionsPerBeat: 16 };
    case 'selected_beats':
      return { stepDuration: node.intervalBeats || 1.0, totalSteps: node.stepsPerCycle || 4, divisionsPerBeat: 1 };
    case 'custom':
      return {
        stepDuration: 1.0 / divisions,
        totalSteps: 4 * divisions,
        divisionsPerBeat: divisions,
      };
    default:
      return { stepDuration: node.intervalBeats || 1.0, totalSteps: 4, divisionsPerBeat: 1 };
  }
}

export function shouldTriggerFireAtClock(
  node: TriggerNode,
  prevBeat: number,
  currBeat: number
): boolean {
  if (!node.active) return false;

  const isFractions = node.triggerType === 'beat_fractions' || node.divisionMode === 'divisions' || node.divisionMode === 'custom';

  if (isFractions) {
    const divs = Math.max(2, Math.min(64, node.divisionsPerBeat || 64));
    const stepDuration = 1.0 / divs;

    const prevStep = Math.floor(prevBeat / stepDuration);
    const currStep = Math.floor(currBeat / stepDuration);
    if (currStep <= prevStep) return false;

    // Check fraction index in the beat
    const fractionIndex = ((currStep % divs) + divs) % divs;
    if (node.activeFractions && node.activeFractions.length > 0) {
      const fracIndex = fractionIndex % node.activeFractions.length;
      return !!node.activeFractions[fracIndex];
    }
    return true;
  }

  const mode = node.divisionMode || 'every_beat';

  if (mode === 'every_bar') {
    const prevBar = Math.floor(prevBeat / 4.0);
    const currBar = Math.floor(currBeat / 4.0);
    return currBar > prevBar;
  }

  // Default: 4-step 1-bar Beats Sequencer
  const prevStep = Math.floor(prevBeat);
  const currStep = Math.floor(currBeat);
  if (currStep <= prevStep) return false;

  const beatIndex = ((currStep % 4) + 4) % 4;

  if (node.activeSteps && node.activeSteps.length > 0) {
    const maskIndex = beatIndex % node.activeSteps.length;
    return !!node.activeSteps[maskIndex];
  }
  return true;
}

export function getDefaultActiveSteps(mode: TriggerDivisionMode, totalSteps: number): boolean[] {
  switch (mode) {
    case 'every_bar':
      return [true];
    case 'every_beat':
      return [true, true, true, true];
    case 'divisions':
      return [true, true, true, true];
    default:
      return Array(totalSteps).fill(true);
  }
}

export function getDefaultActiveFractions(divisions: number): boolean[] {
  return Array(divisions).fill(true);
}
