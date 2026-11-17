export type ApplicationAssetKind = "service" | "ui" | "theme" | "page" | "workflow" | "application";

export interface AIApplicationWorkspace {
  id: string;
  name: string;
  repositories: readonly string[];
  assets: readonly ApplicationAsset[];
  verification: readonly string[];
}

export interface ApplicationAsset {
  id: string;
  kind: ApplicationAssetKind;
  source: "kult" | "theta" | "kelt" | "kloks" | "floks" | "app";
  reference: string;
  version?: string;
}

export interface AIApplicationOperation {
  operation: "discover" | "compose" | "modify" | "verify" | "package" | "promote";
  workspaceId: string;
  inputs: Readonly<Record<string, unknown>>;
}

export const skipoAIApplicationContract = {
  id: "skipo.ai-application-workspace",
  operations: ["discover", "compose", "modify", "verify", "package", "promote"],
  producers: ["kult", "theta", "kelt"],
} as const;
