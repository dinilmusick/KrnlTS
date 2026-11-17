import { SignalType } from "../../types/index.js";

export interface ExposedVariableDef {
  name: string;
  direction: 'input' | 'output';
  defaultValue?: any;
  inferredType: 'number' | 'string' | 'boolean' | 'object' | 'any';
  signalType: SignalType;
  rawDeclaration: string;
}

export interface ExposedFunctionDef {
  name: string;
  params: string[];
  paramCount: number;
  isVoid: boolean;
  rawSignature: string;
  rawBody: string;
  hasInputTrigger: boolean;
  acceptsPrimitiveOrObject: boolean;
  acceptsObjectSignature: boolean;
  inferredReturnType?: 'number' | 'string' | 'boolean' | 'object' | 'void' | 'any';
  returnSignalType?: SignalType;
}

export interface CodeNodeParsedIO {
  variables: ExposedVariableDef[];
  functions: ExposedFunctionDef[];
}
