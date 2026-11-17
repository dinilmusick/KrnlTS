export interface Learning { id: string; content: string; }
export interface EndpointDefinition { method?: string; url?: string; path?: string; headers?: Record<string,string>; payload?: Record<string,unknown>; }
export interface FeatureDefinition {
  id?: string; name: string; description?: string; endpoint?: EndpointDefinition;
  learnings?: Learning[]; intelligenceSpecId?: string; agent?: any; agentDefinition?: any; [key: string]: any;
}
export interface ToolDefinition {
  id?: string; name: string; description?: string; endpoint?: EndpointDefinition;
  features?: FeatureDefinition[]; learnings?: Learning[]; agent?: any; agentDefinition?: any; intelligenceSpecId?: string;
  [key: string]: any;
}
