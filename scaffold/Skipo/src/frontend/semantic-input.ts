import {Whistle} from "@dinilmusick/gutts";
import {
  resolveFrnlFormInput,
  resolveFrnlInput,
  type FrnlInputContract,
  type FrnlResolvedInput,
  type FrnlResolvedForm,
  type FrnlSemanticFormContract,
} from "@ultrst-armada/frnlts";

export type SkipoInputContract<T> = FrnlInputContract<T> & {
  application?: string;
  workspace?: string;
};

export type SkipoFormContract<T> = FrnlSemanticFormContract<T>;

export async function transcribeVoiceInput(
  audio: Uint8Array,
  language?: string,
): Promise<string> {
  return new Whistle().transcribe({audio, language});
}

export async function resolveSkipoInput<T>(
  contract: SkipoInputContract<T> | null,
  input: {text?: string; audio?: Uint8Array; language?: string},
): Promise<FrnlResolvedInput<T>> {
  if (!contract) {
    return {
      status: "invalid",
      value: undefined,
      candidates: [],
      modelOutput: undefined,
    };
  }

  let text = input.text;
  if (text === undefined && input.audio) {
    try {
      text = await transcribeVoiceInput(input.audio, input.language);
    } catch {
      return {
        status: "invalid",
        value: undefined,
        candidates: [],
        modelOutput: undefined,
        ...(contract.preserveRawInput ? {rawInput: "[audio]"} : {}),
        error: {
          code: "MODEL_FAILURE",
          message: "Voice transcription failed before semantic resolution.",
        },
      };
    }
  }

  if (!text || !text.trim()) {
    return {
      status: "invalid",
      value: undefined,
      candidates: [],
      modelOutput: undefined,
      ...(contract.preserveRawInput ? {rawInput: text ?? ""} : {}),
      error: {
        code: "EMPTY_INPUT",
        message: "Semantic input is empty.",
      },
    };
  }

  return resolveFrnlInput(contract, text, {
    application: contract.application,
    workspace: contract.workspace,
    ...contract.context,
  });
}

export async function resolveSkipoFormInput<T>(
  contract: SkipoFormContract<T>,
  input: {text?: string; audio?: Uint8Array; language?: string},
): Promise<FrnlResolvedForm<T>> {
  let text = input.text;
  if (text === undefined && input.audio) {
    text = await transcribeVoiceInput(input.audio, input.language);
  }
  if (!text || !text.trim()) {
    return {
      status: "invalid",
      fields: {},
      modelOutput: undefined,
      candidates: [],
      ...(contract.preserveRawInput ? {rawInput: text ?? ""} : {}),
      error: {
        code: "EMPTY_INPUT",
        message: "Semantic form input is empty.",
      },
    };
  }
  return resolveFrnlFormInput(contract, text);
}
