/**
 * @file types.ts
 * @description Domain types for AI Model Card components
 */

export interface AIModelMeta {
  id: string;
  name: string;
  providerId: string;
  contextWindow?: number;
  inputCostPer1k?: number;
  outputCostPer1k?: number;
  supportsTools?: boolean;
  supportsVision?: boolean;
  supportsJson?: boolean;
  isFree?: boolean;
  latencyRatingMs?: number;
  qualityRating?: number;
  status?: string;
  intelligenceRating?: number;
  toolRating?: number;
  speedRating?: number;
  costPer1kInputUsd?: number;
}
