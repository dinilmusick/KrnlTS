import React from 'react';
import {
  Layers,
  Globe,
  Layout,
  Server,
  Zap,
  Cloud,
  ShieldAlert,
  Shield,
  Lock,
  Cpu,
  Boxes,
  Database,
  Terminal,
  Activity,
  Radio,
  Sliders,
  HardDrive,
  Workflow,
  Sparkles,
} from 'lucide-react';

export const ICON_MAP: Record<string, React.ElementType> = {
  Layers,
  Globe,
  Layout,
  Server,
  Zap,
  Cloud,
  ShieldAlert,
  Shield,
  Lock,
  Cpu,
  Boxes,
  Database,
  Terminal,
  Activity,
  Radio,
  Sliders,
  HardDrive,
  Workflow,
  Sparkles,
};

export function renderIcon(
  iconName: string | undefined,
  className = 'w-5 h-5'
): React.ReactElement {
  if (!iconName) return <Boxes className={className} />;
  const IconComponent = ICON_MAP[iconName] || Boxes;
  return <IconComponent className={className} />;
}
