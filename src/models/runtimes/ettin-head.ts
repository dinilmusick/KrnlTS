const weightCache = new Map<string, ArrayBuffer>();

export type EttinHeadWeights = {
  w1: Float32Array;
  lnWeight: Float32Array;
  lnBias: Float32Array;
  w2: Float32Array;
  b2: Float32Array;
};

async function loadSafetensors(modelUri: string, subpath: string): Promise<Record<string, Float32Array>> {
  const url = `https://huggingface.co/${modelUri}/resolve/main/${subpath}`;
  let buf = weightCache.get(url);
  if (!buf) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download Ettin head weights from ${url}: ${res.statusText}`);
    buf = await res.arrayBuffer();
    weightCache.set(url, buf);
  }

  const view = new DataView(buf);
  const headerLen = Number(view.getBigUint64(0, true));
  const header = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 8, headerLen))) as Record<
    string,
    {data_offsets: [number, number]}
  >;
  const dataStart = 8 + headerLen;
  const tensors: Record<string, Float32Array> = {};
  for (const [key, meta] of Object.entries(header)) {
    if (key === "__metadata__") continue;
    const [start, end] = meta.data_offsets;
    tensors[key] = new Float32Array(buf.slice(dataStart + start, dataStart + end));
  }
  return tensors;
}

export async function loadEttinHeadWeights(modelUri: string): Promise<EttinHeadWeights> {
  const [t2, t3, t4] = await Promise.all([
    loadSafetensors(modelUri, "2_Dense/model.safetensors"),
    loadSafetensors(modelUri, "3_LayerNorm/model.safetensors"),
    loadSafetensors(modelUri, "4_Dense/model.safetensors"),
  ]);

  const w1 = t2["linear.weight"];
  const lnWeight = t3["norm.weight"];
  const lnBias = t3["norm.bias"];
  const w2 = t4["linear.weight"];
  const b2 = t4["linear.bias"];

  if (!w1 || !lnWeight || !lnBias || !w2 || !b2) {
    throw new Error(`Invalid Ettin head weights for ${modelUri}`);
  }
  return {w1, lnWeight, lnBias, w2, b2};
}

export function computeEttinHeadScores(
  hidden: {dims: readonly number[]; data: Float32Array},
  head: EttinHeadWeights,
): number[] {
  const [batchSize = 0, seqLen = 0, hiddenSize = 0] = hidden.dims;
  const {w1, lnWeight, lnBias, w2, b2} = head;
  const scores: number[] = [];
  const c = Math.sqrt(2 / Math.PI);

  for (let b = 0; b < batchSize; b += 1) {
    const clsOffset = b * seqLen * hiddenSize;
    const cls = hidden.data.subarray(clsOffset, clsOffset + hiddenSize);

    const y = new Float32Array(hiddenSize);
    for (let i = 0; i < hiddenSize; i += 1) {
      let sum = 0;
      const rowOffset = i * hiddenSize;
      for (let j = 0; j < hiddenSize; j += 1) {
        sum += (w1[rowOffset + j] ?? 0) * (cls[j] ?? 0);
      }
      y[i] = 0.5 * sum * (1 + Math.tanh(c * (sum + 0.044715 * sum * sum * sum)));
    }

    let mean = 0;
    for (let i = 0; i < hiddenSize; i += 1) mean += y[i] ?? 0;
    mean /= hiddenSize;
    let variance = 0;
    for (let i = 0; i < hiddenSize; i += 1) {
      const diff = (y[i] ?? 0) - mean;
      variance += diff * diff;
    }
    const invStd = 1 / Math.sqrt(variance / hiddenSize + 1e-5);
    for (let i = 0; i < hiddenSize; i += 1) {
      y[i] = ((y[i] ?? 0) - mean) * invStd * (lnWeight[i] ?? 1) + (lnBias[i] ?? 0);
    }

    let logit = b2[0] ?? 0;
    for (let i = 0; i < hiddenSize; i += 1) {
      logit += (w2[i] ?? 0) * (y[i] ?? 0);
    }
    scores.push(1 / (1 + Math.exp(-logit)));
  }
  return scores;
}
