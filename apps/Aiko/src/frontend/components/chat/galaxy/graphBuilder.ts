/**
 * ASCII Architecture Flowchart: graphBuilder
 *
 *   ┌──────────────────────────────────┐
 *   │     Initialize graphBuilder      │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │       buildExecutionGraph        │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            isRunning             │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │             lastMsg              │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import { ChatMessage } from '../../views/DirectChatView/types.js';
import { ExecutionNode, ExecutionEdge } from './executionTypes.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

interface BuildGraphOptions {
  messages: ChatMessage[];
  loading: boolean;
  selectedModel: string;
  selectedProvider: string;
  keys: any[];
  height: number;
  existingNodes: ExecutionNode[];
}


// ════ GRAPHBUILDER IMPLEMENTATION ═════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export function buildExecutionGraph({
  messages,
  loading,
  selectedModel,
  selectedProvider,
  keys,
  height,
  existingNodes
}: BuildGraphOptions) {
  const isRunning = loading;
  const lastMsg = messages[messages.length - 1];
  const userMsg = [...messages].reverse().find(m => m.role === 'user');

  const tempNodes: ExecutionNode[] = [];
  const tempEdges: ExecutionEdge[] = [];

  const addNode = (n: Omit<ExecutionNode, 'x' | 'y' | 'vx' | 'vy'>, tx: number, ty: number) => {
    const existing = existingNodes.find(old => old.id === n.id);
    tempNodes.push({
      ...n,
      x: existing ? existing.x : tx + (Math.random() - 0.5) * 20,
      y: existing ? existing.y : ty + (Math.random() - 0.5) * 20,
      vx: existing ? existing.vx : 0,
      vy: existing ? existing.vy : 0
    });
  };

  // Phase 0: User & Master Agent Node
  addNode({ id: 'user', type: 'user', label: 'USER', radius: 15 }, 80, height / 2);
  addNode({
    id: 'aiko-agent',
    type: 'agent',
    label: 'AIKO AGENT',
    model: selectedModel,
    provider: selectedProvider,
    radius: 18,
    status: isRunning ? 'running' : 'success'
  }, 200, height / 2);

  tempEdges.push({
    id: 'edge-user-aiko',
    source: 'user',
    target: 'aiko-agent',
    type: 'message',
    metadata: { task: { taskId: 'prompt', instruction: userMsg?.content || 'User Prompt' }, timestamp: userMsg?.timestamp }
  });

  // Phase 1: API Key Node & Access Edge
  const matchedKey = keys.find(k => k.providerId === selectedProvider && k.status === 'active') || keys[0];
  const keyLabel = matchedKey ? matchedKey.label || matchedKey.id : 'Google Key';
  addNode({ id: 'api-key', type: 'key', label: keyLabel, provider: selectedProvider, radius: 12 }, 200, 50);

  tempEdges.push({
    id: 'edge-access-key',
    source: 'aiko-agent',
    target: 'api-key',
    type: 'access',
    metadata: { status: 'authorized', timestamp: new Date().toLocaleTimeString() }
  });

  // Phase 2: Enricher Node
  addNode({ id: 'aiko-enricher', type: 'enricher', label: 'AIKO ENRICHER', radius: 14, status: 'success' }, 310, height / 2);
  tempEdges.push({
    id: 'edge-aiko-enricher',
    source: 'aiko-agent',
    target: 'aiko-enricher',
    type: 'message',
    metadata: { task: { taskId: 'enrich', instruction: 'Analyze and decompose prompt' } }
  });

  // Phase 3 & onwards: Tools & Endpoints from actual execution trace
  const exeState = lastMsg?.role === 'assistant' ? lastMsg.agentExecution : undefined;
  const toolsTrace = exeState?.tools || [];
  const activeTools = toolsTrace.length > 0
    ? toolsTrace
    : (userMsg?.toolMentions || []).map(m => ({ toolName: m.toolName, status: 'running' as const, features: [] }));

  activeTools.forEach((t, tIdx) => {
    const tId = `tool-${t.toolName}`;
    const ty = height / 2 + (tIdx - (activeTools.length - 1) / 2) * 80;
    addNode({ id: tId, type: 'tool', label: t.toolName.toUpperCase(), status: t.status, radius: 16 }, 430, ty);

    tempEdges.push({
      id: `edge-enrich-${tId}`,
      source: 'aiko-enricher',
      target: tId,
      type: 'message',
      metadata: { task: { taskId: `task-${t.toolName}`, instruction: `Orchestrate ${t.toolName}` } }
    });

    // Phase 4: Endpoint Agent Nodes
    const features = t.features || [];
    features.forEach((f, fIdx) => {
      const fId = `endpoint-${t.toolName}-${f.featureName}`;
      const fy = ty + (fIdx - (features.length - 1) / 2) * 50;
      addNode({ id: fId, type: 'endpoint', label: f.featureName, status: f.status, radius: 13 }, 550, fy);

      tempEdges.push({
        id: `edge-tool-endpoint-${fId}`,
        source: tId,
        target: fId,
        type: 'message',
        metadata: { task: { taskId: `feat-${f.featureName}`, instruction: f.instruction || 'Execute Feature' } }
      });

      // Phase 5: Zod Validator & Executor Nodes
      const zodId = `zod-${t.toolName}-${f.featureName}`;
      const exeId = `exe-${t.toolName}-${f.featureName}`;

      addNode({ id: zodId, type: 'zod', label: 'ZOD VALIDATOR', radius: 11, status: f.status }, 650, fy - 15);
      addNode({ id: exeId, type: 'executor', label: 'EXECUTOR', radius: 12, status: f.status }, 720, fy);

      tempEdges.push({ id: `edge-zod-${fId}`, source: fId, target: zodId, type: 'message', metadata: { task: { taskId: 'zod', instruction: 'Validate parameters' } } });
      tempEdges.push({ id: `edge-exe-${zodId}`, source: zodId, target: exeId, type: 'message', metadata: { task: { taskId: 'exe', instruction: 'Submit to runtime API' } } });

      const backEdgeType = f.status === 'success' ? 'success' : 'failure';
      tempEdges.push({
        id: `edge-back-${exeId}`,
        source: exeId,
        target: tId,
        type: backEdgeType,
        metadata: {
          status: f.status,
          result: f.status === 'success' ? { success: true, data: { feature: f.featureName, status: 'active' } } : undefined,
          error: f.status === 'failed' ? { code: 'EXECUTION_FAILED', source: 'ENDPOINT', message: 'API validation failed' } : undefined
        }
      });
    });
  });

  return { nodes: tempNodes, edges: tempEdges };
}