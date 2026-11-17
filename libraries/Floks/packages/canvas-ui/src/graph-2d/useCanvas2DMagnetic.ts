import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { SpaceNode, NodeConnection } from '@floks/contracts';
import { MagneticGraphManager, Landmark } from '@floks/contracts';
import { Trace } from '@floks/contracts';
import { CameraState } from './types.js';

interface UseViewer2DMagneticProps {
  nodes: SpaceNode[];
  connections: NodeConnection[];
  camera: CameraState;
  setCameraPosition: (x: number, y: number, zoom?: number) => void;
  onMoveNode: (nodeId: string, position: [number, number, number]) => void;
  onConnectRequest: (
    fromNodeId: string,
    toNodeId: string,
    fromPort?: string,
    toPort?: string
  ) => void;
}

export function useCanvas2DMagnetic({
  nodes,
  connections,
  camera,
  setCameraPosition,
  onMoveNode,
  onConnectRequest,
}: UseViewer2DMagneticProps) {
  const manager = useMemo(() => new MagneticGraphManager(320), []);
  const [magneticEnabled, setMagneticEnabled] = useState(true);
  const [autoSolidifyEnabled, setAutoSolidifyEnabled] = useState(false);
  const [activeTraces, setActiveTraces] = useState<Trace[]>([]);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const onConnectRequestRef = useRef(onConnectRequest);
  onConnectRequestRef.current = onConnectRequest;

  // Update traces when nodes change
  useEffect(() => {
    if (!magneticEnabled) {
      setActiveTraces((prev) => (prev.length === 0 ? prev : []));
      return;
    }
    const traces = manager.computeTraces(nodes);
    setActiveTraces((prev) => {
      if (prev.length === 0 && traces.length === 0) return prev;
      if (
        prev.length === traces.length &&
        prev.every(
          (t, i) =>
            t.sourceNodeId === traces[i].sourceNodeId &&
            t.targetNodeId === traces[i].targetNodeId &&
            t.sourceHandleId === traces[i].sourceHandleId &&
            t.targetHandleId === traces[i].targetHandleId
        )
      ) {
        return prev;
      }
      return traces;
    });

    if (autoSolidifyEnabled && traces.length > 0) {
      const resolved = manager.resolveAutoSolidification(nodes, traces, connections);
      for (const res of resolved) {
        const alreadyExists = connections.some(
          (c) =>
            c.fromNodeId === res.sourceNodeId &&
            c.toNodeId === res.targetNodeId &&
            (c.fromSocketId === res.sourceHandleId || c.fromPort === res.sourceHandleId) &&
            (c.toSocketId === res.targetHandleId || c.toPort === res.targetHandleId)
        );
        if (!alreadyExists) {
          onConnectRequestRef.current(res.sourceNodeId, res.targetNodeId, res.sourceHandleId, res.targetHandleId);
        }
      }
    }
  }, [nodes, connections, magneticEnabled, autoSolidifyEnabled, manager]);

  const solidifyTrace = useCallback(
    (trace: Trace) => {
      onConnectRequestRef.current(trace.sourceNodeId, trace.targetNodeId, trace.sourceHandleId, trace.targetHandleId);
    },
    []
  );

  const saveLandmark = useCallback(
    (name: string) => {
      const lm = manager.saveLandmark(name, camera);
      setLandmarks(manager.getLandmarks());
      return lm;
    },
    [manager, camera]
  );

  const jumpToLandmark = useCallback(
    (landmark: Landmark) => {
      setCameraPosition(landmark.camera.x, landmark.camera.y, landmark.camera.zoom);
    },
    [setCameraPosition]
  );

  return {
    manager,
    magneticEnabled,
    setMagneticEnabled,
    autoSolidifyEnabled,
    setAutoSolidifyEnabled,
    activeTraces,
    solidifyTrace,
    landmarks,
    saveLandmark,
    jumpToLandmark,
  };
}
