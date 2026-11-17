export interface MagneticTraceRecord {
  id: string;
  sourceNodeId: string;
  sourceSocketId: string;
  targetNodeId: string;
  targetSocketId: string;
  wireType: string;
  color: string;
  pathD: string;
  midpoint: { x: number; y: number };
  distance: number;
}
