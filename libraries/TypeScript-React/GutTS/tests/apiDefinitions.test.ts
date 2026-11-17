import {describe, expect, it} from "vitest";
import * as arrays from "../src/arrays/array-concepts.js";
import * as json from "../src/json/json-concepts.js";
import * as numbers from "../src/numbers/number-concepts.js";
import * as objects from "../src/objects/object-concepts.js";
import * as strings from "../src/strings/string-concepts.js";
import * as urls from "../src/urls/url-concepts.js";
import {guttsApiById, guttsApiDefinitions} from "../src/api/index.js";

const runtimeApiNames = [
  ...Object.keys(arrays),
  ...Object.keys(json).filter((name) => typeof json[name as keyof typeof json] === "function"),
  ...Object.keys(numbers),
  ...Object.keys(objects),
  ...Object.keys(strings),
  ...Object.keys(urls),
].sort();

describe("GutTS semantic API definitions", () => {
  it("defines every currently exported runtime API exactly once", () => {
    const utilityApis = guttsApiDefinitions.filter((api) => api.category !== "models");
    const definitionNames = utilityApis.map((api) => api.name).sort();

    expect(definitionNames).toEqual(runtimeApiNames);
    expect(new Set(guttsApiDefinitions.map((api) => api.id)).size).toBe(guttsApiDefinitions.length);
    expect(utilityApis.every((api) => api.id.startsWith("gutts."))).toBe(true);
  });

  it("provides complete machine-readable contracts", () => {
    for (const api of guttsApiDefinitions) {
      expect(api.name.length).toBeGreaterThan(0);
      expect(api.category.length).toBeGreaterThan(0);
      expect(api.description.length).toBeGreaterThan(20);
      expect(api.inputSchema.type).toBe("object");
      expect(api.inputSchema.additionalProperties).toBe(false);
      expect(api.inputSchema.properties).toBeDefined();
      expect(api.inputSchema.required).toEqual(
        api.parameters.filter((parameter) => parameter.required).map((parameter) => parameter.name),
      );
      expect(api.output).toBeDefined();
      if (api.category === "models") {
        expect(api.semantics.sideEffects).toBe(false);
      } else {
        expect(api.semantics).toEqual({deterministic: true, pure: true, sideEffects: false});
      }

      for (const parameter of api.parameters) {
        expect(parameter.name.length).toBeGreaterThan(0);
        expect(parameter.description.length).toBeGreaterThan(10);
        expect(parameter.schema).toBeDefined();
        expect(api.inputSchema.properties?.[parameter.name]).toEqual({
          ...parameter.schema,
          description: parameter.description,
        });
      }
    }
  });

  it("indexes definitions by stable identifier", () => {
    expect(guttsApiById["gutts.numbers.clamp"]?.name).toBe("clamp");
    expect(guttsApiById["gutts.strings.truncateWords"]?.name).toBe("truncateWords");
    expect(guttsApiById["gutts.urls.setQueryParam"]?.name).toBe("setQueryParam");
  });
});