import { useState, useEffect, useMemo, useCallback } from 'react';
import type {SpaceNode, NodeConnection, PredictiveGhostNode} from '@floks/contracts';
import {computePredictiveGraph} from '@floks/contracts';

export interface UsePredictiveGraph2DProps {
  nodes: SpaceNode[];
  connections: NodeConnection[];
  selectedNodeId: string | null;
  selectedNodeIds?: string[];
  onSolidifyPredictiveNodes?: (ghosts: PredictiveGhostNode[]) => void;
}

export type UseViewer2DPredictiveProps = UsePredictiveGraph2DProps;

export function usePredictiveGraph2D({
  nodes,
  connections,
  selectedNodeId,
  selectedNodeIds = [],
  onSolidifyPredictiveNodes,
}: UsePredictiveGraph2DProps) {

  const [isActive, setIsActive] = useState<boolean>(false);
  const [scenarioIndex, setScenarioIndex] = useState<number>(0);

  // Compute selected nodes from both single and multi-selection
  const targetNodes = useMemo(() => {
    const idSet = new Set<string>(selectedNodeIds || []);
    if (selectedNodeId) idSet.add(selectedNodeId);
    return nodes.filter((n) => idSet.has(n.id));
  }, [nodes, selectedNodeId, selectedNodeIds]);

  // If selection is cleared, deactivate predictive mode
  useEffect(() => {
    if (targetNodes.length === 0 && isActive) {
      setIsActive(false);
      setScenarioIndex(0);
    }
  }, [targetNodes.length, isActive]);

  // Compute current ghost nodes and traces
  const { ghostNodes, traces, selectedNodesWithGhosts } = useMemo(() => {
    if (!isActive || targetNodes.length === 0) {
      return {
        ghostNodes: [] as PredictiveGhostNode[],
        traces: [],
        selectedNodesWithGhosts: new Map<string, PredictiveGhostNode[]>(),
      };
    }
    return computePredictiveGraph(targetNodes, connections, scenarioIndex);
  }, [isActive, targetNodes, connections, scenarioIndex]);

  // Keyboard shortcut controller
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName)) {
        return;
      }

      // 1. Activate / Toggle predictive mode: Tab, P, G, Backquote, Ctrl+P, Alt+P, Ctrl+Tab, Cmd+Tab
      const isExplicitToggleKey =
        ((e.ctrlKey || e.metaKey || e.altKey) && ['Tab', 'p', 'P', 'g', 'G'].includes(e.key)) ||
        ['p', 'P', 'g', 'G', '`', '~'].includes(e.key);

      if (!isActive && targetNodes.length > 0 && (e.key === 'Tab' || isExplicitToggleKey)) {
        e.preventDefault();
        e.stopPropagation();
        setIsActive(true);
        return;
      }

      if (isActive && isExplicitToggleKey) {
        e.preventDefault();
        e.stopPropagation();
        setIsActive((prev) => !prev);
        return;
      }

      // 2. Cycle scenarios when active: Tab (forward) or Shift+Tab (backward)
      if (isActive && e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        if (e.shiftKey) {
          setScenarioIndex((i) => (i <= 0 ? 12 : i - 1));
        } else {
          setScenarioIndex((i) => i + 1);
        }
        return;
      }

      // 3. Escape key closes predictive mode
      if (isActive && e.key === 'Escape') {
        e.preventDefault();
        setIsActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [isActive, targetNodes.length]);

  const toggleActive = useCallback(() => {
    if (targetNodes.length > 0) {
      setIsActive((prev) => !prev);
    }
  }, [targetNodes.length]);

  const nextScenario = useCallback(() => {
    setScenarioIndex((i) => i + 1);
  }, []);

  const prevScenario = useCallback(() => {
    setScenarioIndex((i) => (i <= 0 ? 12 : i - 1));
  }, []);

  const solidifyGhost = useCallback(
    (ghost: PredictiveGhostNode) => {
      onSolidifyPredictiveNodes?.([ghost]);
    },
    [onSolidifyPredictiveNodes]
  );

  const solidifyAllForNode = useCallback(
    (parentNodeId: string) => {
      const ghosts = selectedNodesWithGhosts.get(parentNodeId);
      if (ghosts && ghosts.length > 0) {
        onSolidifyPredictiveNodes?.(ghosts);
      }
    },
    [selectedNodesWithGhosts, onSolidifyPredictiveNodes]
  );

  const solidifyAll = useCallback(() => {
    if (ghostNodes.length > 0) {
      onSolidifyPredictiveNodes?.(ghostNodes);
    }
  }, [ghostNodes, onSolidifyPredictiveNodes]);

  return {
    isActive,
    scenarioIndex,
    targetNodes,
    ghostNodes,
    traces,
    selectedNodesWithGhosts,
    toggleActive,
    nextScenario,
    prevScenario,
    solidifyGhost,
    solidifyAllForNode,
    solidifyAll,
    close: () => setIsActive(false),
  };
}
