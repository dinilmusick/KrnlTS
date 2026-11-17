import {describe, expect, it, vi, beforeEach} from "vitest";
import {z} from "zod";
import {createDefaultFrnlInputContract} from "@ultrst-armada/frnlts";

const transcribeMock = vi.fn(async () => "thirty two");
const resolveFrnlFormInputMock = vi.fn();

vi.mock("@dinilmusick/gutts", () => ({
  Whistle: class {
    async transcribe(opts: {audio: Uint8Array; language?: string}) {
      return transcribeMock(opts as any);
    }
  },
}));

const resolveFrnlInputMock = vi.fn(async (contract: any, input: string) => {
  contract.onProgress?.({phase: "started"});
  const rawValue = input === "thirty two" ? 32 : input === "forty two" ? 42 : input === "invalid text" ? -50 : input;
  const parsed = contract.validator ? contract.validator.safeParse(rawValue) : {success: true, data: rawValue};
  contract.onProgress?.({phase: "completed"});
  return {
    status: parsed.success ? "resolved" : "invalid",
    value: parsed.success ? parsed.data : undefined,
    candidates: [],
    modelOutput: rawValue,
    ...(contract.preserveRawInput ? {rawInput: input} : {}),
  };
});

vi.mock("@ultrst-armada/frnlts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ultrst-armada/frnlts")>();
  return {
    ...actual,
    resolveFrnlInput: (...args: unknown[]) => resolveFrnlInputMock(...args as [any, string, any?]),
    resolveFrnlFormInput: (...args: unknown[]) => resolveFrnlFormInputMock(...args as [any, string]),
  };
});

import {resolveSkipoFormInput, resolveSkipoInput, transcribeVoiceInput, type SkipoInputContract} from "./semantic-input.js";

describe("Skipo universal semantic input regression matrix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. text input canonical resolution", async () => {
    const contract: SkipoInputContract<string> = {
      name: "fullName",
      label: "Full Name",
      schema: {type: "string"},
      validator: z.string().min(1),
    };
    const res = await resolveSkipoInput(contract, {text: "John Doe"});
    expect(res.status).toBe("resolved");
    expect(res.value).toBe("John Doe");
    expect(resolveFrnlInputMock).toHaveBeenCalledTimes(1);
  });

  it("2. date input natural language resolution", async () => {
    const contract: SkipoInputContract<string> = {
      name: "dob",
      label: "Date of Birth",
      semanticType: "date",
      schema: {type: "string", format: "date"},
      validator: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    };
    const res = await resolveSkipoInput(contract, {text: "1994-05-23"});
    expect(res.status).toBe("resolved");
    expect(res.value).toBe("1994-05-23");
  });

  it("3. number input natural language resolution", async () => {
    const contract: SkipoInputContract<number> = {
      name: "age",
      label: "Age",
      semanticType: "number",
      schema: {type: "integer", minimum: 0},
      validator: z.number().int().min(0),
    };
    const res = await resolveSkipoInput(contract, {text: "thirty two"});
    expect(res.status).toBe("resolved");
    expect(res.value).toBe(32);
  });

  it("4. email input natural language resolution", async () => {
    const contract: SkipoInputContract<string> = {
      name: "email",
      label: "Email",
      semanticType: "email",
      schema: {type: "string", format: "email"},
      validator: z.string().email(),
    };
    const res = await resolveSkipoInput(contract, {text: "dev@example.com"});
    expect(res.status).toBe("resolved");
    expect(res.value).toBe("dev@example.com");
  });

  it("5. url input natural language resolution", async () => {
    const contract: SkipoInputContract<string> = {
      name: "website",
      label: "Website",
      semanticType: "url",
      schema: {type: "string", format: "uri"},
      validator: z.string().url(),
    };
    const res = await resolveSkipoInput(contract, {text: "https://example.com"});
    expect(res.status).toBe("resolved");
    expect(res.value).toBe("https://example.com");
  });

  it("6. voice transcription input flow", async () => {
    const audioBytes = new Uint8Array([1, 2, 3]);
    const contract: SkipoInputContract<number> = {
      name: "age",
      label: "Age",
      schema: {type: "integer"},
      validator: z.number().int(),
    };
    const res = await resolveSkipoInput(contract, {audio: audioBytes, language: "en"});
    expect(res.status).toBe("resolved");
    expect(res.value).toBe(32);
    expect(res.rawInput).toBeUndefined();
    expect(resolveFrnlInputMock).toHaveBeenCalledWith(contract, "thirty two", {
      application: undefined,
      workspace: undefined,
    });
  });

  it("7. voice transcription failure preserves input & does not execute resolver", async () => {
    transcribeMock.mockRejectedValueOnce(new Error("Microphone decode error"));
    const contract: SkipoInputContract<number> = {
      name: "age",
      label: "Age",
      schema: {type: "integer"},
      validator: z.number(),
      preserveRawInput: true,
    };
    const res = await resolveSkipoInput(contract, {audio: new Uint8Array([9, 9])});
    expect(res.status).toBe("invalid");
    expect(res.rawInput).toBe("[audio]");
    expect(resolveFrnlInputMock).not.toHaveBeenCalled();
  });

  it("8. empty / whitespace natural language does not execute resolver", async () => {
    const contract: SkipoInputContract<string> = {
      name: "notes",
      label: "Notes",
      schema: {type: "string"},
      validator: z.string(),
    };
    const res = await resolveSkipoInput(contract, {text: "   \t\n   "});
    expect(res.status).toBe("invalid");
    expect(resolveFrnlInputMock).not.toHaveBeenCalled();
  });

  it("9. explicit semanticInput takes precedence over default contract", async () => {
    const defaultContract = createDefaultFrnlInputContract({
      name: "notes",
      label: "Notes",
      inputType: "text",
    });
    expect(defaultContract?.semanticType).toBe("text");

    const explicitContract: SkipoInputContract<string> = {
      name: "customNotes",
      label: "Custom",
      schema: {type: "string", minLength: 10},
      validator: z.string().min(10),
    };
    const res = await resolveSkipoInput(explicitContract, {text: "valid long custom text"});
    expect(res.status).toBe("resolved");
    expect(resolveFrnlInputMock).toHaveBeenCalledWith(explicitContract, "valid long custom text", expect.anything());
  });

  it("10. explicit opt-out (semanticInput={null}) disables semantic resolution", async () => {
    const res = await resolveSkipoInput(null, {text: "raw text bypass"});
    expect(res.status).toBe("invalid");
    expect(res.value).toBeUndefined();
    expect(resolveFrnlInputMock).not.toHaveBeenCalled();
  });
  it("11. multi-field natural-language input delegates to the canonical Frnl form runtime", async () => {
    resolveFrnlFormInputMock.mockResolvedValueOnce({
      status: "resolved",
      value: {name: "Monke", age: 32},
      fields: {
        name: {status: "resolved", value: "Monke", candidates: [], modelOutput: "Monke"},
        age: {status: "resolved", value: 32, candidates: [], modelOutput: 32},
      },
      candidates: [],
      modelOutput: {name: "Monke", age: 32},
    });

    const result = await resolveSkipoFormInput({
      fields: {
        name: {
          name: "name",
          label: "Name",
          schema: {type: "string"},
          validator: z.string(),
        },
        age: {
          name: "age",
          label: "Age",
          schema: {type: "integer"},
          validator: z.number().int(),
        },
      },
      validator: z.object({name: z.string(), age: z.number().int()}),
    }, {text: "Monke is 32"});

    expect(result.status).toBe("resolved");
    expect(result.value).toEqual({name: "Monke", age: 32});
    expect(resolveFrnlFormInputMock).toHaveBeenCalledTimes(1);
  });

  it("12. semantic policy and progressive lifecycle remain application-visible", async () => {
    const progress: string[] = [];
    const contract: SkipoInputContract<number> = {
      name: "age",
      label: "Age",
      schema: {type: "integer"},
      validator: z.number().int(),
      modelPolicy: "accurate",
      onProgress: ({phase}: {phase: string}) => progress.push(phase),
    };
    const result = await resolveSkipoInput(contract, {text: "forty two"});
    expect(result.status).toBe("resolved");
    expect(progress.length).toBeGreaterThan(0);
  });

});
