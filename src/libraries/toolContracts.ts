export interface FeatureDefinition { id?: string; name: string; description?: string; endpoint?: { method?: string; path?: string; url?: string; headers?: Record<string,string>; payload?: any }; [key:string]: any; }
export interface ToolDefinition { id?: string; name: string; description?: string; features?: FeatureDefinition[]; [key:string]: any; }
