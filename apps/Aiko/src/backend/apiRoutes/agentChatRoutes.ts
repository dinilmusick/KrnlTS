/**
 * ASCII Architecture Flowchart: agentChatRoutes
 *
 *   ┌──────────────────────────────────┐
 *   │    Initialize agentChatRoutes    │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │         agentChatRouter          │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │               repo               │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            aikoAgent             │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ AIKO CHAT AGENT EXECUTION ROUTE ══════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { Router } from 'express';
import { WorkspaceRepository } from '../storage/workspaceRepository.js';
import { workspaceFS } from '../storage/workspaceFileSystem.js';
import { AikoAgent } from '../agentic/aikoAgent/AikoAgent.js';
import { ChatExecutionBridge } from '../agentic/chat/chatExecutionBridge.js';

export const agentChatRouter = Router();

const repo = new WorkspaceRepository(workspaceFS);
const aikoAgent = new AikoAgent(undefined, repo);
const bridge = new ChatExecutionBridge(aikoAgent);

// ════ POST /chat/agent - MAIN ENTRY POINT FOR AIKO AGENT CHAT ═══════════════════════
agentChatRouter.post('/chat/agent', async (req, res) => {
  try {
    const { query, workspace, chatHistory, selectedProvider, selectedModel } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, error: 'Query is required.' });
    }
    if (typeof workspace !== 'string' || !workspace.trim()) {
      return res.status(400).json({ success: false, error: 'An explicit workspace ID is required.' });
    }
    const targetWs = workspace.trim();
    const result = await bridge.executeChat({
      query,
      workspace: targetWs,
      userId: (req as any).userId,
      roles: (req as any).aikoPrincipal?.role ? [(req as any).aikoPrincipal.role] : ['user'],
      chatHistory,
      selectedProvider,
      selectedModel
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { kind: 'EXECUTION_FAILED', message: err.message || String(err) }
    });
  }
});