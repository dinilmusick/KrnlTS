export interface SystemHealthState {
  bootTime: number;
  checksPerformed: number;
}

export const initialState: SystemHealthState = {
  bootTime: Date.now(),
  checksPerformed: 0
};
