export type FloksPromotionKind = "component" | "theme" | "theme-pack";

export interface FloksPromotionRequest {
  assetId: string;
  kind: FloksPromotionKind;
  sourceRepository: string;
  sourceCommit: string;
  verificationId: string;
  files: readonly string[];
}

export interface FloksPromotionResult {
  assetId: string;
  status: "accepted" | "rejected";
  canonicalReference?: string;
  reason?: string;
}

export const floksPromotionContract = {
  id: "floks.krusbl-promotion",
  requiredEvidence: ["sourceRepository", "sourceCommit", "verificationId"],
} as const;
