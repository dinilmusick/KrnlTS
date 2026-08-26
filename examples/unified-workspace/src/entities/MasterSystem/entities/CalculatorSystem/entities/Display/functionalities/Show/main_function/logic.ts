import { ShowInput, ShowOutput } from '../ShowAtom.js';
import { renderScreen } from '../helper_functions/renderScreen.js';

export const main = async (input: ShowInput): Promise<ShowOutput> => {
  return {
    screenOutput: renderScreen(input.text || 'IDLE'),
    status: 'rendered'
  };
};
