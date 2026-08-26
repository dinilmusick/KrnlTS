export interface AgentState {
  activePlan: string[];
  completedSteps: number;
}

export const initialState: AgentState = {
  activePlan: [],
  completedSteps: 0
};
