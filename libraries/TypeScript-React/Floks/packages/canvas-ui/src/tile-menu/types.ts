export interface TileConfig {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  badges?: string[];
  data?: Record<string, unknown>;
}

export interface TileAction {
  id: string;
  label: string;
  icon?: string;
  onClick: (tileId: string) => void;
}
