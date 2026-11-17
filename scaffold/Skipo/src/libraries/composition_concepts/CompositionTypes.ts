/**
 * @file CompositionTypes.ts
 * @description Core data definitions for Skipo application composition concepts.
 * Single-asset purity: data structures & interfaces only.
 * Conforms to L9 (Lines <= 200).
 */

export interface SkipoCompositionDescriptor {
  readonly appId: string;
  readonly appName: string;
  readonly version: string;
  readonly planes: {
    readonly frontend: string;
    readonly backend: string;
    readonly libraries: string;
    readonly frontendState: string;
  };
  readonly activeServices: readonly string[];
  readonly conceptLibraries: readonly string[];
}

export type AppCompositionDescriptor = SkipoCompositionDescriptor;

export interface SkipoCompositionValidationResult {
  readonly valid: boolean;
  readonly score: number;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly inspectedAt: number;
}

export type CompositionValidationResult = SkipoCompositionValidationResult;
