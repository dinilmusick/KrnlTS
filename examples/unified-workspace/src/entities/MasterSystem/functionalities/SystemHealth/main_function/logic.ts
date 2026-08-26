import { SystemHealthInput, SystemHealthOutput } from '../SystemHealthAtom.js';
import { checkSubsystems } from '../helper_functions/checkSubsystems.js';

export const main = async (input: SystemHealthInput, { state }: any): Promise<SystemHealthOutput> => {
  const activeSubsystems = checkSubsystems();
  const uptimeSeconds = Math.floor((Date.now() - (state?.bootTime || Date.now())) / 1000);

  return {
    status: 'ONLINE',
    activeSubsystems,
    uptimeSeconds,
    timestamp: Date.now()
  };
};
