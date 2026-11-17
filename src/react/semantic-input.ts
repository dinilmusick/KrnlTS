import {createContext, createElement, type ReactNode, useContext} from "react";
import {
  mergeFrnlSemanticContext,
  type FrnlSemanticContext,
} from "../runtime/semantic-input.js";

const FrnlSemanticContextValue = createContext<FrnlSemanticContext>({});

export function FrnlSemanticContextProvider({
  value,
  children,
}: {
  value: FrnlSemanticContext;
  children?: ReactNode;
}) {
  const parent = useContext(FrnlSemanticContextValue);
  return createElement(
    FrnlSemanticContextValue.Provider,
    {value: mergeFrnlSemanticContext(parent, value)},
    children,
  );
}

export const FrnlSemanticInputProvider = FrnlSemanticContextProvider;

export function useFrnlSemanticInputContext(): FrnlSemanticContext {
  return useContext(FrnlSemanticContextValue);
}
