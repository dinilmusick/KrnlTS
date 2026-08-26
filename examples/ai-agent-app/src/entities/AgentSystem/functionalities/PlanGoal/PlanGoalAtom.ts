export interface PlanGoalInput {
  goal: string;
}

export interface PlanGoalOutput {
  goal: string;
  steps: string[];
  confidence: number;
}
