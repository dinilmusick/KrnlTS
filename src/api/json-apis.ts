import {defineApi} from "./define-api.js";
import type {ApiDefinition} from "./api-types.js";

const json = {type: "object", description: "A JSON-compatible value."};

export const jsonApis: readonly ApiDefinition[] = [
  defineApi({id: "gutts.json.isJsonValue", name: "isJsonValue", category: "json", description: "Checks whether an unknown value can be represented as a finite JSON value.", parameters: [{name: "value", description: "The value to validate as JSON-compatible data.", required: true, schema: {}}], output: {type: "boolean", description: "True when the value is a valid JSON value."}, semantics: {deterministic: true, pure: true, sideEffects: false}}),
  defineApi({id: "gutts.json.parseJson", name: "parseJson", category: "json", description: "Parses a JSON text string into a JSON-compatible value.", parameters: [{name: "text", description: "The JSON document to parse.", required: true, schema: {type: "string"}}], output: json, semantics: {deterministic: true, pure: true, sideEffects: false}, errors: ["Throws SyntaxError when text is not valid JSON."]}),
  defineApi({id: "gutts.json.tryParseJson", name: "tryParseJson", category: "json", description: "Attempts to parse JSON text and returns undefined instead of throwing when parsing fails.", parameters: [{name: "text", description: "The JSON document to parse.", required: true, schema: {type: "string"}}], output: {description: "The parsed JSON value, or undefined when parsing fails."}, semantics: {deterministic: true, pure: true, sideEffects: false}}),
  defineApi({id: "gutts.json.stringifyJson", name: "stringifyJson", category: "json", description: "Serializes a JSON-compatible value into JSON text, optionally using indentation.", parameters: [{name: "value", description: "The JSON-compatible value to serialize.", required: true, schema: {}}, {name: "space", description: "Optional number of indentation spaces to use in the serialized output.", required: false, schema: {type: "number"}}], output: {type: "string", description: "The serialized JSON text."}, semantics: {deterministic: true, pure: true, sideEffects: false}, errors: ["Throws TypeError when the value cannot be serialized as JSON."]}),
];
