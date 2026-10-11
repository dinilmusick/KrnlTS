/**
 * @file K_LIB_Krnl_App_Config.ts
 * @description Code-as-Configuration application entry point specification for KrnlTS.
 * Replaces static krnl.json with a type-safe declarative app definition.
 */

import type { Entity } from "./K_ENT_Entity.js";

export interface HttpProtocolOptions {
  port?: number;
  prefix?: string;
  cors?: boolean;
}

export interface WebSocketProtocolOptions {
  port?: number;
  path?: string;
}

export interface McpProtocolOptions {
  name: string;
  version?: string;
  description?: string;
}

export interface SseProtocolOptions {
  port?: number;
  endpoint?: string;
}

export type ProtocolType = "HTTP" | "WebSocket" | "MCP" | "SSE";

export interface ProtocolDescriptor {
  type: ProtocolType;
  options: Record<string, any>;
}

export const Protocols = {
  HTTP: (options: HttpProtocolOptions = {}): ProtocolDescriptor => ({
    type: "HTTP",
    options: {
      port: options.port ?? 8080,
      prefix: options.prefix ?? "/api",
      cors: options.cors ?? true,
    }
  }),

  WebSocket: (options: WebSocketProtocolOptions = {}): ProtocolDescriptor => ({
    type: "WebSocket",
    options: {
      port: options.port ?? 8081,
      path: options.path ?? "/ws",
    }
  }),

  MCP: (options: McpProtocolOptions): ProtocolDescriptor => ({
    type: "MCP",
    options: {
      name: options.name,
      version: options.version ?? "1.0.0",
      description: options.description ?? "Krnl MCP Agent Tools",
    }
  }),

  SSE: (options: SseProtocolOptions = {}): ProtocolDescriptor => ({
    type: "SSE",
    options: {
      port: options.port ?? 8082,
      endpoint: options.endpoint ?? "/events",
    }
  })
};

export interface KrnlFrontendAppConfig {
  rootEntity?: string;
  variant?: number;
  theme?: string;
}

export interface KrnlBackendAppConfig {
  controlPlane?: "sqlite" | "hosted" | "custom";
  dataPlane?: "local" | "s3" | "icloud" | "supabase";
}

export type EntityConstructor = new (...args: any[]) => Entity;

export interface KrnlAppConfig {
  name: string;
  version?: string;
  description?: string;
  protocols?: ProtocolDescriptor[];
  entities: (EntityConstructor | Entity)[];
  frontend?: KrnlFrontendAppConfig;
  backend?: KrnlBackendAppConfig;
}

export interface KrnlAppInstance {
  config: KrnlAppConfig;
  boot(): Promise<void>;
  stop(): Promise<void>;
  isEntityIncluded(entityName: string): boolean;
  getActiveProtocols(): ProtocolDescriptor[];
}

/**
 * Type-safe application factory creating a runnable Krnl application instance
 * from declarative code-as-config.
 */
export function defineApp(config: KrnlAppConfig): KrnlAppInstance {
  const activeProtocols = config.protocols ?? [Protocols.HTTP()];

  const entityNames = new Set<string>();
  for (const item of config.entities) {
    if (typeof item === "function") {
      entityNames.add(item.name);
    } else if (item && typeof item === "object" && "id" in item) {
      entityNames.add(String((item as any).id));
    }
  }

  return {
    config,
    async boot(): Promise<void> {
      console.log(`🚀 [KrnlApp: ${config.name}] Booting application with ${entityNames.size} entity/entities...`);
      for (const proto of activeProtocols) {
        console.log(`   📡 Protocol enabled: ${proto.type} on options:`, proto.options);
      }
    },
    async stop(): Promise<void> {
      console.log(`🛑 [KrnlApp: ${config.name}] Stopped.`);
    },
    isEntityIncluded(name: string): boolean {
      return entityNames.has(name);
    },
    getActiveProtocols(): ProtocolDescriptor[] {
      return activeProtocols;
    }
  };
}
