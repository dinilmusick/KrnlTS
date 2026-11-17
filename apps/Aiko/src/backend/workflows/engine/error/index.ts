import { WorkflowError, ErrorCategory, Severity } from "../types/graph.js";

export class ErrorCollector {
  private errors: WorkflowError[] = [];
  private warnings: WorkflowError[] = [];
  private retryHistory: Array<{ nodeId: string; attempt: number; timestamp: number; error: any }> = [];
  private failedNodes: Set<string> = new Set();
  private stackTrace: string[] = [];

  addError(error: WorkflowError): void {
    this.errors.push(error);
    if (error.nodeId) {
      this.failedNodes.add(error.nodeId);
    }
  }

  addWarning(warning: WorkflowError): void {
    this.warnings.push(warning);
  }

  addRetry(nodeId: string, attempt: number, error: any): void {
    this.retryHistory.push({
      nodeId,
      attempt,
      timestamp: Date.now(),
      error
    });
  }

  pushStack(element: string): void {
    this.stackTrace.push(element);
  }

  popStack(): void {
    this.stackTrace.pop();
  }

  getStackTrace(): string[] {
    return [...this.stackTrace];
  }

  getErrors(): WorkflowError[] {
    return [...this.errors];
  }

  getWarnings(): WorkflowError[] {
    return [...this.warnings];
  }

  getRetryHistory() {
    return [...this.retryHistory];
  }

  getFailedNodes(): string[] {
    return Array.from(this.failedNodes);
  }

  clear(): void {
    this.errors = [];
    this.warnings = [];
    this.retryHistory = [];
    this.failedNodes.clear();
    this.stackTrace = [];
  }
}

export function normalizeError(
  err: any,
  nodeId?: string,
  graphId?: string,
  defaultCategory = ErrorCategory.Runtime,
  defaultSeverity = Severity.Error
): WorkflowError {
  const timestamp = Date.now();
  const id = Math.random().toString(36).substring(2, 9);
  
  if (err && typeof err === "object" && "category" in err && "severity" in err && "code" in err) {
    return {
      id: err.id || id,
      code: err.code,
      category: err.category,
      severity: err.severity,
      nodeId: err.nodeId || nodeId,
      graphId: err.graphId || graphId,
      message: err.message,
      details: err.details,
      timestamp: err.timestamp || timestamp,
      retryable: err.retryable !== undefined ? err.retryable : isRetryable(err.code),
      stack: err.stack,
      technicalMessage: err.technicalMessage || err.message,
      userMessage: err.userMessage || getUserFriendlyMessage(err.code, err.message)
    };
  }

  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  
  let code = "RUNTIME_ERROR";
  let category = defaultCategory;
  let severity = defaultSeverity;
  
  if (message.includes("timeout") || message.includes("Timeout")) {
    code = "NETWORK_TIMEOUT";
    category = ErrorCategory.Network;
  } else if (message.includes("not found") || message.includes("ENOENT")) {
    code = "FILE_NOT_FOUND";
    category = ErrorCategory.FileSystem;
  } else if (message.includes("permission") || message.includes("EACCES")) {
    code = "PERMISSION_DENIED";
    category = ErrorCategory.FileSystem;
  } else if (message.includes("query") || message.includes("database") || message.includes("SQL")) {
    code = "DB_QUERY_FAILED";
    category = ErrorCategory.Database;
  } else if (message.includes("JSON") || message.includes("parse")) {
    code = "JSON_PARSE_FAILED";
    category = ErrorCategory.Validation;
  } else if (message.includes("rate limit") || message.includes("429")) {
    code = "AI_RATE_LIMITED";
    category = ErrorCategory.AI;
  }

  return {
    id,
    code,
    category,
    severity,
    nodeId,
    graphId,
    message,
    timestamp,
    retryable: isRetryable(code),
    stack,
    technicalMessage: message,
    userMessage: getUserFriendlyMessage(code, message)
  };
}

function isRetryable(code: string): boolean {
  const retryableCodes = [
    "NETWORK_TIMEOUT",
    "AI_RATE_LIMITED",
    "DB_LOCK_FAILURE",
    "TEMPORARY_NETWORK_FAILURE"
  ];
  return retryableCodes.includes(code);
}

function getUserFriendlyMessage(code: string, techMessage: string): string {
  switch (code) {
    case "NETWORK_TIMEOUT":
      return "The server did not respond in time. Please check your connection and try again.";
    case "FILE_NOT_FOUND":
      return "The requested file could not be found.";
    case "PERMISSION_DENIED":
      return "Access denied. You do not have permission to access this resource.";
    case "DB_QUERY_FAILED":
      return "A database error occurred. Your request could not be processed.";
    case "JSON_PARSE_FAILED":
      return "Failed to parse data format correctly.";
    case "AI_RATE_LIMITED":
      return "The AI service is temporarily busy. We are retrying or waiting before attempting again.";
    default:
      return techMessage || "An unexpected error occurred during execution.";
  }
}
