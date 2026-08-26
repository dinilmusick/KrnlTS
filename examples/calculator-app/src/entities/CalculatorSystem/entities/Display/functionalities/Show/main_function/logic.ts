import { ShowInput, ShowOutput } from '../ShowAtom.js';
import { renderText } from '../helper_functions/renderText.js';

export const main = async (input: ShowInput, { state, entity }: any): Promise<ShowOutput> => {
  const displayed = renderText(input.text || 'READY');
  return {
    displayed,
    status: 'rendered'
  };
};
