import { AuditInput, AuditOutput } from '../AuditAtom.js';
import { createLog } from '../helper_functions/createLog.js';

export const main = async (input: AuditInput): Promise<AuditOutput> => {
  return {
    logged: true,
    entry: createLog(input.action || 'DEFAULT_ACTION')
  };
};
