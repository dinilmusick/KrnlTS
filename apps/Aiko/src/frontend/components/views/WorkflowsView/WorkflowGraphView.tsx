import React, { useCallback, useEffect, useState } from 'react';
import { ReactFlow, Background, Controls, MiniMap, addEdge, useEdgesState, useNodesState, type Connection, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, Play, Save, Plus, RefreshCw } from 'lucide-react';
import { BaseButton } from '@ultrst-armada/floks';
import { apiClient } from '../../../../libraries/apiClient.js';
import type { AikoWorkflow } from '../../../../libraries/workflowContracts.js';

type CatalogNode = { metadata: { type: string; displayName: string; description: string; category: string }; inputs: Record<string, unknown>; outputs: Record<string, unknown> };
type GraphNode = Node<{ nodeType: string; label?: string; [key: string]: unknown }>;
const toEditorNode = (node: any): GraphNode => ({ ...node, type: 'default', data: { ...(node.data || {}), nodeType: node.type, label: node.data?.label || node.data?.title || node.type } });
const toEngineNode = (node: GraphNode) => ({ ...node, type: node.data.nodeType, data: { ...node.data, title: node.data.label || node.data.nodeType } });

export function WorkflowGraphView({ workflow, onBack }: { workflow: AikoWorkflow; onBack: () => void }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<GraphNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [catalog, setCatalog] = useState<CatalogNode[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [graphResult, catalogResult] = await Promise.all([
        apiClient.getWorkflowGraph(workflow.workspaceId, workflow.id),
        apiClient.getWorkflowNodeCatalog(workflow.workspaceId),
      ]);
      const graph = graphResult.graph || { nodes: [], edges: [] };
      setNodes((graph.nodes || []).map(toEditorNode));
      setEdges(graph.edges || []);
      setCatalog(catalogResult.nodes || []);
    } finally { setBusy(false); }
  }, [workflow.id, workflow.workspaceId, setNodes, setEdges]);

  useEffect(() => { void load(); }, [load]);

  const onConnect = useCallback((connection: Connection) => setEdges(current => addEdge({ ...connection, animated: true }, current)), [setEdges]);

  const addNode = (definition: CatalogNode) => {
    const id = definition.metadata.type.replace(/[^a-zA-Z0-9_-]/g, '-') + '-' + crypto.randomUUID().slice(0, 8);
    setNodes(current => [...current, {
      id, type: 'default', position: { x: 120 + current.length * 30, y: 120 + current.length * 24 },
      data: { nodeType: definition.metadata.type, label: definition.metadata.displayName },
    }]);
  };

  const save = async () => {
    setBusy(true); setMessage('');
    try {
      const graph = { nodes: nodes.map(toEngineNode), edges, metadata: { workflowId: workflow.id, name: workflow.name } };
      const result = await apiClient.saveWorkflowGraph(workflow.workspaceId, workflow.id, graph);
      setMessage(result.success === false ? result.error || 'Save failed' : 'Saved');
    } finally { setBusy(false); }
  };

  const execute = async () => {
    await save(); setBusy(true); setMessage('Running…');
    try {
      const result = await apiClient.executeWorkflow(workflow.workspaceId, workflow.id, {}, {});
      setMessage(result.success ? 'Execution succeeded' : (result.errors || ['Execution failed']).join('; '));
    } finally { setBusy(false); }
  };

  const categories = ['all', ...new Set(catalog.map(item => item.metadata.category))];
  const visible = catalog.filter(item => selectedCategory === 'all' || item.metadata.category === selectedCategory);

  return (
    <div className="w-full h-full flex flex-col text-[var(--skipo-text,#f8fafc)]">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--skipo-border-color)] p-3">
        <div className="flex items-center gap-2"><BaseButton size="sm" variant="secondary" onClick={onBack} icon={<ArrowLeft size={14} />}>Workflows</BaseButton><strong>{workflow.name}</strong></div>
        <div className="flex gap-2"><BaseButton size="sm" variant="ghost" onClick={() => void load()} disabled={busy} icon={<RefreshCw size={13} />}>Reload</BaseButton><BaseButton size="sm" variant="secondary" onClick={() => void save()} disabled={busy} icon={<Save size={13} />}>Save</BaseButton><BaseButton size="sm" variant="accent" onClick={() => void execute()} disabled={busy} icon={<Play size={13} />}>Run</BaseButton></div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="w-64 shrink-0 overflow-y-auto border-r border-[var(--skipo-border-color)] p-2">
          <div className="flex flex-wrap gap-1 mb-2">{categories.map(category => <button key={category} className="px-2 py-1 text-[10px] uppercase rounded border border-[var(--skipo-border-color)]" onClick={() => setSelectedCategory(category)}>{category}</button>)}</div>
          {visible.map(item => <button key={item.metadata.type} className="w-full text-left p-2 mb-1 rounded border border-[var(--skipo-border-color)] hover:bg-[var(--skipo-surface)]" onClick={() => addNode(item)}><div className="text-xs font-bold">{item.metadata.displayName}</div><div className="text-[10px] opacity-60">{item.metadata.type}</div></button>)}
          <button className="w-full mt-2 p-2 text-xs border border-dashed rounded" onClick={() => setNodes(current => [...current, { id: 'note-' + crypto.randomUUID().slice(0,8), type:'default', position:{x:300,y:200}, data:{nodeType:'core/primitive',label:'New Node'} }])}><Plus size={12} className="inline mr-1" />Add Node</button>
        </aside>
        <main className="relative min-w-0 flex-1"><ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} fitView><Background /><Controls /><MiniMap /></ReactFlow>{message && <div className="absolute bottom-3 left-3 rounded border border-[var(--skipo-border-color)] bg-[var(--skipo-surface,#111827)] px-3 py-2 text-xs">{message}</div>}</main>
      </div>
    </div>
  );
}
export default WorkflowGraphView;
