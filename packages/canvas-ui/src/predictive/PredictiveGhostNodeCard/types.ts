import type {PredictiveGhostNode} from '@floks/contracts';

export interface PredictiveGhostNodeCardProps {
  ghost: PredictiveGhostNode;
  screenPos: {x: number; y: number};
  zoom: number;
  onSolidify: (ghost: PredictiveGhostNode) => void;
  isHovered?: boolean;
  onHoverChange?: (hovered: boolean) => void;
}
