import { AuditInput, AuditOutput } from '../AuditAtom.js';
import { createLogEntry } from '../helper_functions/createLogEntry.js';

export const main = async (input: AuditInput, { state, entity }: any): Promise<AuditOutput> => {
  const entry = createLogEntry(input.action || 'DEFAULT_ACTION');
  return {
    logged: true,
    entry
  };
};
