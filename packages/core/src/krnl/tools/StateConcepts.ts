/**
 * @file StateConcepts.ts
 * @role component
 * @description Polymorphic generic templates for Finite State Machine transitions and action reducers.
 */

export interface FsmTransitionResult<TState> {
  allowed: boolean;
  nextState?: TState;
  reason?: string;
}

/**
 * Validates and executes a state transition in a Finite State Machine.
 */
export function transitionFSM<TState extends string, TEvent extends string>(
  matrix: Record<TState, Partial<Record<TEvent, TState>>>,
  currentState: TState,
  event: TEvent
): FsmTransitionResult<TState> {
  const allowedEvents = matrix[currentState];
  if (!allowedEvents) {
    return {
      allowed: false,
      reason: `[FSM_UNKNOWN_STATE] Current state '${currentState}' is not defined in transition matrix.`
    };
  }

  const nextState = allowedEvents[event];
  if (!nextState) {
    return {
      allowed: false,
      reason: `[FSM_INVALID_TRANSITION] Event '${event}' is not permitted from state '${currentState}'.`
    };
  }

  return {
    allowed: true,
    nextState
  };
}

/**
 * Creates a type-safe action reducer mapping action types to handler functions.
 */
export function createReducer<TState, TAction extends { type: string }>(
  handlers: { [K in TAction["type"]]?: (state: TState, action: Extract<TAction, { type: K }>) => TState },
  fallback?: (state: TState, action: TAction) => TState
): (state: TState, action: TAction) => TState {
  return (state: TState, action: TAction): TState => {
    const handler = handlers[action.type as TAction["type"]];
    if (handler) {
      return handler(state, action as any);
    }
    return fallback ? fallback(state, action) : state;
  };
}
