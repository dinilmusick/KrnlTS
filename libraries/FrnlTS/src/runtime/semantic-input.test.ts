import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {z} from "zod";

const resolveSemanticInputMock = vi.fn();
const rankSemanticInputCandidatesMock = vi.fn();

vi.mock("@dinilmusick/gutts/semantic-input", () => ({
  resolveSemanticInput: (args: unknown) => resolveSemanticInputMock(args),
  rankSemanticInputCandidates: (input: string, candidates: readonly string[]) =>
    rankSemanticInputCandidatesMock(input, candidates),
}));

import {
  createDefaultFrnlInputContract,
  createFrnlInputContract,
  compileFrnlSemanticFormSchema,
  mergeFrnlSemanticContext,
  resolveFrnlFormInput,
  resolveFrnlInput,
  type FrnlInputContract,
} from "./semantic-input.js";

describe("FrnlTS universal semantic input", () => {
  it("covers canonical input types with framework-owned default semantic contracts", () => {
    const text = createDefaultFrnlInputContract({name: "notes", label: "Notes", inputType: "text"});
    const email = createDefaultFrnlInputContract({name: "email", label: "Email", inputType: "email"});
    const number = createDefaultFrnlInputContract({name: "count", label: "Count", inputType: "number"});
    const date = createDefaultFrnlInputContract({name: "dob", label: "Date of Birth", inputType: "date"});

    expect(text?.schema).toEqual({type: "string"});
    expect(email?.semanticType).toBe("email");
    expect(number?.schema).toEqual({type: "number"});
    expect(date?.schema).toEqual({type: "string", format: "date"});
    expect(createDefaultFrnlInputContract({name: "secret", label: "Secret", inputType: "password"})).toBeUndefined();
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("1. FrnlInputContract<T> carries schema + validator + context", () => {
    const ageValidator = z.number().int().min(0).max(120);
    const contract = createFrnlInputContract<number>({
      name: "userAge",
      label: "User Age",
      description: "Age in full completed years",
      semanticType: "age-number",
      schema: {type: "integer", minimum: 0, maximum: 120},
      validator: ageValidator,
      context: {
        page: "Onboarding",
        section: "Profile",
        constraints: ["Must be adult"],
      },
      transports: ["text", "voice"],
      preserveRawInput: false,
    });

    expect(contract.name).toBe("userAge");
    expect(contract.label).toBe("User Age");
    expect(contract.schema.type).toBe("integer");
    expect(contract.validator).toBe(ageValidator);
    expect(contract.context?.page).toBe("Onboarding");
    expect(contract.transports).toEqual(["text", "voice"]);
    expect(contract.preserveRawInput).toBe(false);
  });

  it("2. Natural language enters Needle-based structured resolution via GutTS", async () => {
    resolveSemanticInputMock.mockResolvedValueOnce({
      status: "resolved",
      value: 32,
      candidates: [],
      modelOutput: 32,
    });

    const contract: FrnlInputContract<number> = {
      name: "age",
      label: "Age",
      schema: {type: "integer"},
      validator: z.number().int(),
    };

    const result = await resolveFrnlInput(contract, "thirty two");

    expect(resolveSemanticInputMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: "thirty two",
        schema: {type: "integer"},
      }),
    );
    expect(result.status).toBe("resolved");
    expect(result.value).toBe(32);
  });

  it("3. Context from the field is included in resolution", async () => {
    resolveSemanticInputMock.mockResolvedValueOnce({
      status: "resolved",
      value: "May",
      candidates: [{value: "May", similarity: 0.9, relevance: 10}],
      modelOutput: "May",
    });

    const contract: FrnlInputContract<string> = {
      name: "birthMonth",
      label: "Birth Month",
      description: "Month of birth",
      semanticType: "calendar-month",
      schema: {type: "string"},
      validator: z.enum(["May", "March"]),
      vocabulary: ["May", "March"],
      examples: ["May"],
    };

    await resolveFrnlInput(contract, "mage");

    expect(resolveSemanticInputMock).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          field: "birthMonth",
          label: "Birth Month",
          description: "Month of birth",
          semanticType: "calendar-month",
          vocabulary: ["May", "March"],
          examples: ["May"],
        }),
      }),
    );
  });

  it("4. Shared page/section/application/workspace context is merged and available", async () => {
    resolveSemanticInputMock.mockResolvedValueOnce({
      status: "resolved",
      value: "Corporate",
      candidates: [],
      modelOutput: "Corporate",
    });

    const contract: FrnlInputContract<string> = {
      name: "tier",
      label: "Subscription Tier",
      schema: {type: "string"},
      validator: z.string(),
      context: {section: "BillingSection"},
    };

    const sharedContext = {
      page: "SettingsPage",
      application: "BillingApp",
      workspace: "ws-corp-99",
    };

    await resolveFrnlInput(contract, "top tier", sharedContext);

    expect(resolveSemanticInputMock).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          page: "SettingsPage",
          section: "BillingSection",
          field: "tier",
          label: "Subscription Tier",
        }),
      }),
    );
  });

  it("5. MiniLM + Ettin ranking is passed through vocabulary candidates", async () => {
    resolveSemanticInputMock.mockResolvedValueOnce({
      status: "resolved",
      value: "May",
      candidates: [
        {value: "May", similarity: 0.95, relevance: 12.0},
        {value: "March", similarity: 0.4, relevance: 2.0},
      ],
      modelOutput: "May",
    });

    const contract: FrnlInputContract<string> = {
      name: "month",
      label: "Month",
      schema: {type: "string"},
      validator: z.string(),
      vocabulary: ["May", "March"],
    };

    const result = await resolveFrnlInput(contract, "mage");

    expect(resolveSemanticInputMock).toHaveBeenCalledWith(
      expect.objectContaining({
        candidates: ["May", "March"],
      }),
    );
    expect(result.candidates[0]?.value).toBe("May");
  });

  it("6. Zod is ALWAYS applied after semantic extraction", async () => {
    // Model returned string "32" instead of number 32
    resolveSemanticInputMock.mockResolvedValueOnce({
      status: "resolved",
      value: "32",
      candidates: [],
      modelOutput: "32",
    });

    const contract: FrnlInputContract<number> = {
      name: "age",
      label: "Age",
      schema: {type: "integer"},
      validator: z.number().int(),
    };

    const result = await resolveFrnlInput(contract, "thirty two");

    // Zod rejects string "32" because z.number().int() requires number
    expect(result.status).toBe("invalid");
    expect(result.value).toBeUndefined();
    expect(result.validation?.success).toBe(false);
  });

  it("7. Structurally invalid output is rejected", async () => {
    resolveSemanticInputMock.mockResolvedValueOnce({
      status: "invalid",
      candidates: [],
      modelOutput: undefined,
    });

    const contract: FrnlInputContract<number> = {
      name: "rating",
      label: "Rating",
      schema: {type: "number"},
      validator: z.number(),
    };

    const result = await resolveFrnlInput(contract, "nonsense phrase");
    expect(result.status).toBe("invalid");
    expect(result.value).toBeUndefined();
  });

  it("8. Valid structured output is returned to caller", async () => {
    resolveSemanticInputMock.mockResolvedValueOnce({
      status: "resolved",
      value: 32,
      candidates: [],
      modelOutput: 32,
    });

    const contract: FrnlInputContract<number> = {
      name: "age",
      label: "Age",
      schema: {type: "integer"},
      validator: z.number().int(),
    };

    const result = await resolveFrnlInput(contract, "thirty two");
    expect(result.status).toBe("resolved");
    expect(result.value).toBe(32);
    expect(typeof result.value).toBe("number");
    expect(result.validation?.success).toBe(true);
  });

  it("9. Raw input is absent by default", async () => {
    resolveSemanticInputMock.mockResolvedValueOnce({
      status: "resolved",
      value: 32,
      candidates: [],
      modelOutput: 32,
    });

    const contract: FrnlInputContract<number> = {
      name: "age",
      label: "Age",
      schema: {type: "integer"},
      validator: z.number().int(),
    };

    const result = await resolveFrnlInput(contract, "thirty two");
    expect("rawInput" in result).toBe(false);
    expect(resolveSemanticInputMock).toHaveBeenCalledWith(
      expect.objectContaining({preserveRawInput: false}),
    );
  });

  it("10. Raw input is retained only when explicitly enabled", async () => {
    resolveSemanticInputMock.mockResolvedValueOnce({
      status: "resolved",
      value: 32,
      rawInput: "thirty two",
      candidates: [],
      modelOutput: 32,
    });

    const contract: FrnlInputContract<number> = {
      name: "age",
      label: "Age",
      schema: {type: "integer"},
      validator: z.number().int(),
      preserveRawInput: true,
    };

    const result = await resolveFrnlInput(contract, "thirty two");
    expect(result.rawInput).toBe("thirty two");
    expect(resolveSemanticInputMock).toHaveBeenCalledWith(
      expect.objectContaining({preserveRawInput: true}),
    );
  });

  it("11. Multiple transports can target the same semantic contract", () => {
    const contract = createFrnlInputContract<string>({
      name: "command",
      label: "Command",
      schema: {type: "string"},
      validator: z.string(),
      transports: ["text", "voice", "paste", "programmatic"],
    });

    expect(contract.transports).toContain("text");
    expect(contract.transports).toContain("voice");
    expect(contract.transports).toContain("paste");
    expect(contract.transports).toContain("programmatic");
  });

  it("12. Semantic context does not change data model into unvalidated string (numeric test: 'thirty two' -> 32)", async () => {
    resolveSemanticInputMock.mockResolvedValueOnce({
      status: "resolved",
      value: 32,
      candidates: [],
      modelOutput: 32,
    });

    const contract: FrnlInputContract<number> = {
      name: "age",
      label: "Age",
      schema: {type: "integer"},
      validator: z.number().int().min(18),
    };

    const result = await resolveFrnlInput(contract, "thirty two");

    expect(result.status).toBe("resolved");
    expect(result.value).toBe(32);
    expect(typeof result.value).toBe("number");
    expect(result.value).toBeGreaterThanOrEqual(18);
  });

  it("13. Enum/domain test: 'mage' -> 'May' using vocabulary/context contract", async () => {
    resolveSemanticInputMock.mockResolvedValueOnce({
      status: "resolved",
      value: "May",
      candidates: [{value: "May", similarity: 0.95, relevance: 11.2}],
      modelOutput: "May",
    });

    const contract: FrnlInputContract<"January" | "February" | "March" | "April" | "May"> = {
      name: "month",
      label: "Month",
      semanticType: "date-month",
      schema: {type: "string", enum: ["January", "February", "March", "April", "May"]},
      validator: z.enum(["January", "February", "March", "April", "May"]),
      vocabulary: ["January", "February", "March", "April", "May"],
    };

    const result = await resolveFrnlInput(contract, "mage");

    expect(result.status).toBe("resolved");
    expect(result.value).toBe("May");
    expect(result.candidates[0]?.value).toBe("May");
  });
  it("14. nested semantic contexts inherit and override parent scope", () => {
    const parent = {
      application: "registry",
      page: "users",
      section: "profile",
      form: "identity",
      locale: "en-IN",
    };
    const merged = mergeFrnlSemanticContext(parent, {
      section: "address",
      form: "address",
    });
    expect(merged.application).toBe("registry");
    expect(merged.page).toBe("users");
    expect(merged.section).toBe("address");
    expect(merged.form).toBe("address");
    expect(merged.locale).toBe("en-IN");
  });

  it("15. form resolution uses one schema and validates every field", async () => {
    resolveSemanticInputMock.mockResolvedValueOnce({
      status: "resolved",
      value: {name: "Monke", age: 32},
      candidates: [],
      modelOutput: {name: "Monke", age: 32},
    });

    const result = await resolveFrnlFormInput({
      fields: {
        name: {
          name: "name",
          label: "Name",
          schema: {type: "string"},
          validator: z.string().min(1),
        },
        age: {
          name: "age",
          label: "Age",
          schema: {type: "integer"},
          validator: z.number().int().nonnegative(),
        },
      },
      validator: z.object({name: z.string(), age: z.number().int()}),
    }, "Monke is 32");

    expect(result.status).toBe("resolved");
    expect(result.value).toEqual({name: "Monke", age: 32});
    expect(result.fields.name?.value).toBe("Monke");
    expect(result.fields.age?.value).toBe(32);
  });

  it("11. compiles a semantic form schema from canonical field contracts", () => {
    const schema = compileFrnlSemanticFormSchema({
      name: {
        name: "name",
        label: "Name",
        description: "Person name",
        schema: {type: "string"},
        validator: z.string(),
      },
      age: {
        name: "age",
        label: "Age",
        schema: {type: "integer"},
        validator: z.number().int(),
      },
    });
    expect(schema.properties?.name).toMatchObject({type: "string", description: "Person name"});
    expect(schema.properties?.age).toMatchObject({type: "integer", description: "Age"});
    expect(schema.required).toEqual(["name", "age"]);
  });

  it("12. forwards model policy and progressive callbacks", async () => {
    resolveSemanticInputMock.mockResolvedValueOnce({
      status: "resolved",
      value: 42,
      candidates: [],
      modelOutput: 42,
      provenance: {resolver: "GutTS.semantic-input", requestFingerprint: "x", modelPolicy: "accurate", models: ["Needle3", "MiniLM", "EttinReranker68M"], deterministic: false},
    });
    const progress = vi.fn();
    const contract: FrnlInputContract<number> = {
      name: "age",
      label: "Age",
      schema: {type: "integer"},
      validator: z.number().int(),
      modelPolicy: "accurate",
      onProgress: progress,
    };
    const result = await resolveFrnlInput(contract, "forty two");
    expect(result.provenance?.modelPolicy).toBe("accurate");
    expect(resolveSemanticInputMock).toHaveBeenCalledWith(expect.objectContaining({
      policy: expect.objectContaining({modelPolicy: "accurate"}),
      onProgress: progress,
    }));
  });

});
