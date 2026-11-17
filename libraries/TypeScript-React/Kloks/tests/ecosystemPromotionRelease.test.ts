import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import packageJson from "../package.json";

describe("ecosystem promotion release metadata", () => {
  it("publishes the canonical KLOKS package identity", () => {
    expect(packageJson.name).toBe("@ultrst-armada/kloks");
    expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(packageJson.private).toBe(false);
  });
});


it("notifies FLOKS when a new KLOKS package version is published", () => {
  const workflow = readFileSync(".github/workflows/npm-release.yml", "utf8");
  expect(workflow).toContain("const consumers = ['Floks', 'Kult-Engine', 'Theta-Engine', 'Kelt-Engine', 'Skipo'];");
});

it("uses OIDC Trusted Publishing without a long-lived npm token", () => {
  const workflow = readFileSync(".github/workflows/npm-release.yml", "utf8");
  expect(workflow).toContain("id-token: write");
  expect(workflow).not.toContain("NPM_TOKEN");
});
