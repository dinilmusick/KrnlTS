import { NodeRegistry, NodeDefinition } from "../registry/index.js";

export class FloatNumber {
  constructor(public value: number) {}
  valueOf() { return this.value; }
  toString() { return String(this.value); }
  toJSON() { return this.value; }
}

export function isFloat(val: any): boolean {
  if (val instanceof FloatNumber) return true;
  if (typeof val === "object" && val !== null && "value" in val) {
    return true;
  }
  if (typeof val === "number" && !Number.isInteger(val)) return true;
  return false;
}

export function getNumberValue(val: any): number {
  if (val instanceof FloatNumber) return val.value;
  if (typeof val === "object" && val !== null && "value" in val) {
    return Number((val as any).value);
  }
  return Number(val);
}

// Helper to validate and convert a value to a number
function checkNumeric(val: any, name: string): number {
  if (val === undefined || val === null || val === "") {
    throw new Error(`Input '${name}' must be a valid number, received: empty value`);
  }
  const num = getNumberValue(val);
  if (isNaN(num)) {
    throw new Error(`Input '${name}' must be a valid number, received: ${val}`);
  }
  return num;
}

// Helper to validate and retrieve an array of numbers from inputs
function getNumericArray(inputs: Record<string, any>, name: string, ignoreInvalid: boolean = false): number[] {
  let val = inputs[name];
  if (typeof val === "string") {
    try {
      val = JSON.parse(val);
    } catch {
      // Fallback: split by comma if string is comma-separated
      val = val.split(",").map((s: string) => s.trim());
    }
  }
  
  if (!Array.isArray(val)) {
    if (val !== undefined && val !== null && val !== "") {
      val = [val];
    } else {
      val = [];
    }
  }

  const result: number[] = [];
  for (const item of val) {
    if (item === undefined || item === null || item === "") {
      if (!ignoreInvalid) {
        throw new Error(`Input array '${name}' contains empty or invalid number.`);
      }
      continue;
    }
    const num = getNumberValue(item);
    if (isNaN(num)) {
      if (!ignoreInvalid) {
        throw new Error(`Input array '${name}' contains an invalid number: ${item}`);
      }
    } else {
      result.push(num);
    }
  }
  return result;
}

// Seedable Pseudo-Random Number Generator (Linear Congruential Generator)
function lcg(seed: number): number {
  const m = 0x80000000; // 2**31
  const a = 1103515245;
  const c = 12345;
  const nextSeed = (a * seed + c) % m;
  return nextSeed / (m - 1);
}

// 1. Add Node
export const AddNode: NodeDefinition = {
  metadata: {
    type: "math/add",
    category: "math",
    displayName: "Add",
    description: "Adds two numbers together"
  },
  inputs: {
    addend: { type: "number", label: "Addend", defaultValue: 0 }
  },
  outputs: {
    result: { type: "number", label: "Result" }
  },
  async execute(inputs) {
    const addends = getNumericArray(inputs, "addend");
    if (addends.length === 0) return { result: 0 };
    const rawResult = addends.reduce((sum, val) => sum + val, 0);
    const isFloatOp = addends.some(isFloat);
    return { result: isFloatOp ? new FloatNumber(rawResult) : Math.trunc(rawResult) };
  }
};

// 2. Subtract Node
export const SubtractNode: NodeDefinition = {
  metadata: {
    type: "math/subtract",
    category: "math",
    displayName: "Subtract",
    description: "Subtracts B from A"
  },
  inputs: {
    minuend: { type: "number", label: "Minuend", defaultValue: 0 },
    subtrahend: { type: "number", label: "Subtrahend", defaultValue: 0 }
  },
  outputs: {
    result: { type: "number", label: "Result" }
  },
  async execute(inputs) {
    const aVal = inputs.minuend !== undefined ? inputs.minuend : 0;
    const bVal = inputs.subtrahend !== undefined ? inputs.subtrahend : 0;
    const isFloatOp = isFloat(aVal) || isFloat(bVal);
    const a = checkNumeric(aVal, "Minuend");
    const b = checkNumeric(bVal, "Subtrahend");
    const rawResult = a - b;
    return { result: isFloatOp ? new FloatNumber(rawResult) : Math.trunc(rawResult) };
  }
};

// 3. Multiply Node
export const MultiplyNode: NodeDefinition = {
  metadata: {
    type: "math/multiply",
    category: "math",
    displayName: "Multiply",
    description: "Multiplies A by B"
  },
  inputs: {
    factor: { type: "number", label: "Factor", defaultValue: 1 }
  },
  outputs: {
    result: { type: "number", label: "Result" }
  },
  async execute(inputs) {
    const factors = getNumericArray(inputs, "factor");
    if (factors.length === 0) return { result: 1 };
    const rawResult = factors.reduce((prod, val) => prod * val, 1);
    const isFloatOp = factors.some(isFloat);
    return { result: isFloatOp ? new FloatNumber(rawResult) : Math.trunc(rawResult) };
  }
};

// 4. Divide Node
export const DivideNode: NodeDefinition = {
  metadata: {
    type: "math/divide",
    category: "math",
    displayName: "Divide",
    description: "Divides A by B"
  },
  inputs: {
    dividend: { type: "number", label: "Dividend", defaultValue: 0 },
    divisor: { type: "number", label: "Divisor", defaultValue: 1 }
  },
  outputs: {
    result: { type: "number", label: "Result" }
  },
  async execute(inputs) {
    const aVal = inputs.dividend !== undefined ? inputs.dividend : 0;
    const bVal = inputs.divisor !== undefined ? inputs.divisor : 1;
    const isFloatOp = isFloat(aVal) || isFloat(bVal);
    const a = checkNumeric(aVal, "Dividend");
    const b = checkNumeric(bVal, "Divisor");
    if (b === 0) {
      throw new Error("Division by zero");
    }
    const rawResult = a / b;
    return { result: isFloatOp ? new FloatNumber(rawResult) : Math.trunc(rawResult) };
  }
};

// 5. Modulo Node
export const ModuloNode: NodeDefinition = {
  metadata: {
    type: "math/modulo",
    category: "math",
    displayName: "Modulo",
    description: "Calculates the remainder of A divided by B (A % B)"
  },
  inputs: {
    a: { type: "number", label: "A", defaultValue: 0 },
    b: { type: "number", label: "B", defaultValue: 1 }
  },
  outputs: {
    result: { type: "number", label: "Result" }
  },
  async execute(inputs) {
    const aVal = inputs.a !== undefined ? inputs.a : 0;
    const bVal = inputs.b !== undefined ? inputs.b : 1;
    const isFloatOp = isFloat(aVal) || isFloat(bVal);
    const a = checkNumeric(aVal, "A");
    const b = checkNumeric(bVal, "B");
    if (b === 0) {
      throw new Error("Division by zero in Modulo node");
    }
    const rawResult = a % b;
    return { result: isFloatOp ? new FloatNumber(rawResult) : Math.trunc(rawResult) };
  }
};

// 6. Power Node
export const PowerNode: NodeDefinition = {
  metadata: {
    type: "math/power",
    category: "math",
    displayName: "Power",
    description: "Raises base A to the exponent power B (A ^ B)"
  },
  inputs: {
    a: { type: "number", label: "A (Base)", defaultValue: 1 },
    b: { type: "number", label: "B (Exponent)", defaultValue: 1 }
  },
  outputs: {
    result: { type: "number", label: "Result" }
  },
  async execute(inputs) {
    const aVal = inputs.a !== undefined ? inputs.a : 1;
    const bVal = inputs.b !== undefined ? inputs.b : 1;
    const isFloatOp = isFloat(aVal) || isFloat(bVal);
    const a = checkNumeric(aVal, "A");
    const b = checkNumeric(bVal, "B");
    const rawResult = Math.pow(a, b);
    return { result: isFloatOp ? new FloatNumber(rawResult) : Math.trunc(rawResult) };
  }
};

// 7. Square Root Node
export const SqrtNode: NodeDefinition = {
  metadata: {
    type: "math/sqrt",
    category: "math",
    displayName: "Square Root",
    description: "Calculates the square root of a value"
  },
  inputs: {
    value: { type: "number", label: "Value", defaultValue: 0 }
  },
  outputs: {
    result: { type: "number", label: "Result" }
  },
  async execute(inputs) {
    const valInput = inputs.value !== undefined ? inputs.value : 0;
    const isFloatOp = isFloat(valInput);
    const val = checkNumeric(valInput, "Value");
    if (val < 0) {
      throw new Error("Square root of a negative number is not a real number");
    }
    const rawResult = Math.sqrt(val);
    return { result: isFloatOp ? new FloatNumber(rawResult) : Math.trunc(rawResult) };
  }
};

// 8. Absolute Node
export const AbsoluteNode: NodeDefinition = {
  metadata: {
    type: "math/absolute",
    category: "math",
    displayName: "Absolute",
    description: "Calculates the absolute value of a number"
  },
  inputs: {
    value: { type: "number", label: "Value", defaultValue: 0 }
  },
  outputs: {
    result: { type: "number", label: "Result" }
  },
  async execute(inputs) {
    const valInput = inputs.value !== undefined ? inputs.value : 0;
    const isFloatOp = isFloat(valInput);
    const val = checkNumeric(valInput, "Value");
    const rawResult = Math.abs(val);
    return { result: isFloatOp ? new FloatNumber(rawResult) : Math.trunc(rawResult) };
  }
};

// 9. Negate Node
export const NegateNode: NodeDefinition = {
  metadata: {
    type: "math/negate",
    category: "math",
    displayName: "Negate",
    description: "Negates a number (multiplies by -1)"
  },
  inputs: {
    value: { type: "number", label: "Value", defaultValue: 0 }
  },
  outputs: {
    result: { type: "number", label: "Result" }
  },
  async execute(inputs) {
    const valInput = inputs.value !== undefined ? inputs.value : 0;
    const isFloatOp = isFloat(valInput);
    const val = checkNumeric(valInput, "Value");
    const rawResult = -val;
    return { result: isFloatOp ? new FloatNumber(rawResult) : Math.trunc(rawResult) };
  }
};

// 10. Min Node
export const MinNode: NodeDefinition = {
  metadata: {
    type: "math/min",
    category: "math",
    displayName: "Minimum",
    description: "Finds the minimum value in an array"
  },
  inputs: {
    values: { type: "array", label: "Values", defaultValue: [] }
  },
  outputs: {
    result: { type: "number", label: "Result" }
  },
  async execute(inputs) {
    const ignoreInvalid = inputs.ignoreInvalid !== undefined ? !!inputs.ignoreInvalid : false;
    const array = getNumericArray(inputs, "values", ignoreInvalid);
    if (array.length === 0) {
      throw new Error("Cannot find minimum of an empty list");
    }
    return { result: Math.min(...array) };
  }
};

// 11. Max Node
export const MaxNode: NodeDefinition = {
  metadata: {
    type: "math/max",
    category: "math",
    displayName: "Maximum",
    description: "Finds the maximum value in an array"
  },
  inputs: {
    values: { type: "array", label: "Values", defaultValue: [] }
  },
  outputs: {
    result: { type: "number", label: "Result" }
  },
  async execute(inputs) {
    const ignoreInvalid = inputs.ignoreInvalid !== undefined ? !!inputs.ignoreInvalid : false;
    const array = getNumericArray(inputs, "values", ignoreInvalid);
    if (array.length === 0) {
      throw new Error("Cannot find maximum of an empty list");
    }
    return { result: Math.max(...array) };
  }
};

// 12. Clamp Node
export const ClampNode: NodeDefinition = {
  metadata: {
    type: "math/clamp",
    category: "math",
    displayName: "Clamp",
    description: "Clamps value between minimum and maximum"
  },
  inputs: {
    value: { type: "number", label: "Value", defaultValue: 0 },
    min: { type: "number", label: "Min", defaultValue: 0 },
    max: { type: "number", label: "Max", defaultValue: 100 }
  },
  outputs: {
    result: { type: "number", label: "Result" }
  },
  async execute(inputs) {
    const val = checkNumeric(inputs.value ?? 0, "Value");
    const min = checkNumeric(inputs.min ?? 0, "Min");
    const max = checkNumeric(inputs.max ?? 100, "Max");
    if (min > max) {
      throw new Error(`Clamp validation failed: Minimum (${min}) must be less than or equal to Maximum (${max}).`);
    }
    return { result: Math.min(Math.max(val, min), max) };
  }
};

// 13. Round Node
export const RoundNode: NodeDefinition = {
  metadata: {
    type: "math/round",
    category: "math",
    displayName: "Round",
    description: "Rounds a number according to mode and precision decimal places"
  },
  inputs: {
    value: { type: "number", label: "Value", defaultValue: 0 }
  },
  outputs: {
    result: { type: "number", label: "Result" }
  },
  async execute(inputs) {
    const val = checkNumeric(inputs.value ?? 0, "Value");
    const mode = String(inputs.mode ?? "Nearest").toLowerCase();
    const decimalPlaces = inputs.decimalPlaces !== undefined ? Math.max(0, Math.floor(Number(inputs.decimalPlaces))) : 0;
    
    const factor = Math.pow(10, decimalPlaces);
    const scaled = val * factor;
    let rounded: number;

    if (mode === "floor") {
      rounded = Math.floor(scaled);
    } else if (mode === "ceiling" || mode === "ceil") {
      rounded = Math.ceil(scaled);
    } else if (mode === "truncate" || mode === "trunc") {
      rounded = Math.trunc(scaled);
    } else {
      rounded = Math.round(scaled);
    }

    return { result: rounded / factor };
  }
};

// 14. Floor Node
export const FloorNode: NodeDefinition = {
  metadata: {
    type: "math/floor",
    category: "math",
    displayName: "Floor",
    description: "Returns the largest integer less than or equal to a given number"
  },
  inputs: {
    value: { type: "number", label: "Value", defaultValue: 0 }
  },
  outputs: {
    result: { type: "number", label: "Result" }
  },
  async execute(inputs) {
    const val = checkNumeric(inputs.value ?? 0, "Value");
    return { result: Math.floor(val) };
  }
};

// 15. Ceiling Node
export const CeilingNode: NodeDefinition = {
  metadata: {
    type: "math/ceiling",
    category: "math",
    displayName: "Ceiling",
    description: "Returns the smallest integer greater than or equal to a given number"
  },
  inputs: {
    value: { type: "number", label: "Value", defaultValue: 0 }
  },
  outputs: {
    result: { type: "number", label: "Result" }
  },
  async execute(inputs) {
    const val = checkNumeric(inputs.value ?? 0, "Value");
    return { result: Math.ceil(val) };
  }
};

// 16. Average Node
export const AverageNode: NodeDefinition = {
  metadata: {
    type: "math/average",
    category: "math",
    displayName: "Average",
    description: "Calculates the mathematical average of an array of numbers"
  },
  inputs: {
    values: { type: "array", label: "Values", defaultValue: [] }
  },
  outputs: {
    result: { type: "number", label: "Result" }
  },
  async execute(inputs) {
    const ignoreInvalid = inputs.ignoreInvalid !== undefined ? !!inputs.ignoreInvalid : false;
    const array = getNumericArray(inputs, "values", ignoreInvalid);
    if (array.length === 0) {
      throw new Error("Average array must contain at least one value.");
    }
    const sum = array.reduce((acc, curr) => acc + curr, 0);
    return { result: sum / array.length };
  }
};

// 18. Random Number Node
export const RandomNumberNode: NodeDefinition = {
  metadata: {
    type: "math/random",
    category: "math",
    displayName: "Random Number",
    description: "Generates a pseudo-random number within a range"
  },
  inputs: {
    seed: { type: "number", label: "Optional Seed" }
  },
  outputs: {
    result: { type: "number", label: "Result" }
  },
  async execute(inputs) {
    const min = Number(inputs.minimum ?? 0);
    const max = Number(inputs.maximum ?? 1);
    const integerOnly = !!inputs.integerOnly;
    const seedVal = inputs.seed !== undefined && inputs.seed !== "" ? Number(inputs.seed) : undefined;

    let rand = 0;
    if (seedVal !== undefined && !isNaN(seedVal)) {
      rand = lcg(seedVal);
    } else {
      rand = Math.random();
    }

    let result = min + rand * (max - min);
    if (integerOnly) {
      result = Math.floor(result);
    }
    return { result };
  }
};

// 19. Sine Node
export const SineNode: NodeDefinition = {
  metadata: {
    type: "math/sine",
    category: "math",
    displayName: "Sine",
    description: "Calculates the sine of an angle"
  },
  inputs: {
    angle: { type: "number", label: "Angle", defaultValue: 0 }
  },
  outputs: {
    result: { type: "number", label: "Result" }
  },
  async execute(inputs) {
    let angle = checkNumeric(inputs.angle ?? 0, "Angle");
    const unit = String(inputs.unit ?? "Radians").toLowerCase();
    if (unit === "degrees" || unit === "degree") {
      angle = angle * (Math.PI / 180);
    }
    return { result: Math.sin(angle) };
  }
};

// 20. Cosine Node
export const CosineNode: NodeDefinition = {
  metadata: {
    type: "math/cosine",
    category: "math",
    displayName: "Cosine",
    description: "Calculates the cosine of an angle"
  },
  inputs: {
    angle: { type: "number", label: "Angle", defaultValue: 0 }
  },
  outputs: {
    result: { type: "number", label: "Result" }
  },
  async execute(inputs) {
    let angle = checkNumeric(inputs.angle ?? 0, "Angle");
    const unit = String(inputs.unit ?? "Radians").toLowerCase();
    if (unit === "degrees" || unit === "degree") {
      angle = angle * (Math.PI / 180);
    }
    return { result: Math.cos(angle) };
  }
};

// 21. Tangent Node
export const TangentNode: NodeDefinition = {
  metadata: {
    type: "math/tangent",
    category: "math",
    displayName: "Tangent",
    description: "Calculates the tangent of an angle"
  },
  inputs: {
    angle: { type: "number", label: "Angle", defaultValue: 0 }
  },
  outputs: {
    result: { type: "number", label: "Result" }
  },
  async execute(inputs) {
    let angle = checkNumeric(inputs.angle ?? 0, "Angle");
    const unit = String(inputs.unit ?? "Radians").toLowerCase();
    if (unit === "degrees" || unit === "degree") {
      angle = angle * (Math.PI / 180);
    }
    return { result: Math.tan(angle) };
  }
};

// 22. Arc Sine Node
export const ArcSineNode: NodeDefinition = {
  metadata: {
    type: "math/asin",
    category: "math",
    displayName: "Arc Sine",
    description: "Calculates the inverse sine (arc sine) of a value"
  },
  inputs: {
    value: { type: "number", label: "Value", defaultValue: 0 }
  },
  outputs: {
    angle: { type: "number", label: "Angle" }
  },
  async execute(inputs) {
    const val = checkNumeric(inputs.value ?? 0, "Value");
    if (val < -1 || val > 1) {
      throw new Error(`Arc Sine input value must be between -1 and 1. Received: ${val}`);
    }
    let angle = Math.asin(val);
    const unit = String(inputs.unit ?? "Radians").toLowerCase();
    if (unit === "degrees" || unit === "degree") {
      angle = angle * (180 / Math.PI);
    }
    return { angle };
  }
};

// 23. Arc Cosine Node
export const ArcCosineNode: NodeDefinition = {
  metadata: {
    type: "math/acos",
    category: "math",
    displayName: "Arc Cosine",
    description: "Calculates the inverse cosine (arc cosine) of a value"
  },
  inputs: {
    value: { type: "number", label: "Value", defaultValue: 0 }
  },
  outputs: {
    angle: { type: "number", label: "Angle" }
  },
  async execute(inputs) {
    const val = checkNumeric(inputs.value ?? 0, "Value");
    if (val < -1 || val > 1) {
      throw new Error(`Arc Cosine input value must be between -1 and 1. Received: ${val}`);
    }
    let angle = Math.acos(val);
    const unit = String(inputs.unit ?? "Radians").toLowerCase();
    if (unit === "degrees" || unit === "degree") {
      angle = angle * (180 / Math.PI);
    }
    return { angle };
  }
};

// 24. Arc Tangent Node
export const ArcTangentNode: NodeDefinition = {
  metadata: {
    type: "math/atan",
    category: "math",
    displayName: "Arc Tangent",
    description: "Calculates the inverse tangent (arc tangent) of a value"
  },
  inputs: {
    value: { type: "number", label: "Value", defaultValue: 0 }
  },
  outputs: {
    angle: { type: "number", label: "Angle" }
  },
  async execute(inputs) {
    const val = checkNumeric(inputs.value ?? 0, "Value");
    let angle = Math.atan(val);
    const unit = String(inputs.unit ?? "Radians").toLowerCase();
    if (unit === "degrees" || unit === "degree") {
      angle = angle * (180 / Math.PI);
    }
    return { angle };
  }
};

// 25. Logarithm Node
export const LogarithmNode: NodeDefinition = {
  metadata: {
    type: "math/log",
    category: "math",
    displayName: "Logarithm",
    description: "Calculates the logarithm of a value to a specified base"
  },
  inputs: {
    value: { type: "number", label: "Value", defaultValue: 1 }
  },
  outputs: {
    result: { type: "number", label: "Result" }
  },
  async execute(inputs) {
    const val = checkNumeric(inputs.value ?? 1, "Value");
    const base = Number(inputs.base !== undefined && inputs.base !== "" ? inputs.base : 10);
    if (val <= 0) {
      throw new Error(`Logarithm value must be greater than zero. Received: ${val}`);
    }
    if (base <= 0 || base === 1) {
      throw new Error(`Logarithm base must be greater than zero and not equal to 1. Received: ${base}`);
    }
    return { result: Math.log(val) / Math.log(base) };
  }
};

// 26. Exponential Node
export const ExponentialNode: NodeDefinition = {
  metadata: {
    type: "math/exp",
    category: "math",
    displayName: "Exponential",
    description: "Calculates Euler's number e raised to the power of a value (e^x)"
  },
  inputs: {
    value: { type: "number", label: "Value", defaultValue: 0 }
  },
  outputs: {
    result: { type: "number", label: "Result" }
  },
  async execute(inputs) {
    const val = checkNumeric(inputs.value ?? 0, "Value");
    return { result: Math.exp(val) };
  }
};

// 27. Pi Node
export const PiNode: NodeDefinition = {
  metadata: {
    type: "math/pi",
    category: "math",
    displayName: "Pi Constant",
    description: "Outputs the value of Pi (π)"
  },
  inputs: {},
  outputs: {
    value: { type: "number", label: "Value" }
  },
  async execute() {
    return { value: Math.PI };
  }
};

// 28. Euler Node
export const EulerNode: NodeDefinition = {
  metadata: {
    type: "math/euler",
    category: "math",
    displayName: "Euler Constant",
    description: "Outputs the mathematical constant e (Euler's number)"
  },
  inputs: {},
  outputs: {
    value: { type: "number", label: "Value" }
  },
  async execute() {
    return { value: Math.E };
  }
};

// 29. Infinity Node
export const InfinityNode: NodeDefinition = {
  metadata: {
    type: "math/infinity",
    category: "math",
    displayName: "Infinity Constant",
    description: "Outputs the value representing Infinity (∞)"
  },
  inputs: {},
  outputs: {
    value: { type: "number", label: "Value" }
  },
  async execute() {
    return { value: Infinity };
  }
};

export function registerMathNodes(registry: NodeRegistry) {
  registry.register(AddNode, true);
  registry.register(SubtractNode, true);
  registry.register(MultiplyNode, true);
  registry.register(DivideNode, true);
  registry.register(ModuloNode, true);
  registry.register(PowerNode, true);
  registry.register(SqrtNode, true);
  registry.register(AbsoluteNode, true);
  registry.register(NegateNode, true);
  registry.register(MinNode, true);
  registry.register(MaxNode, true);
  registry.register(ClampNode, true);
  registry.register(RoundNode, true);
  registry.register(FloorNode, true);
  registry.register(CeilingNode, true);
  registry.register(AverageNode, true);
  registry.register(RandomNumberNode, true);
  registry.register(SineNode, true);
  registry.register(CosineNode, true);
  registry.register(TangentNode, true);
  registry.register(ArcSineNode, true);
  registry.register(ArcCosineNode, true);
  registry.register(ArcTangentNode, true);
  registry.register(LogarithmNode, true);
  registry.register(ExponentialNode, true);
  registry.register(PiNode, true);
  registry.register(EulerNode, true);
  registry.register(InfinityNode, true);
}
