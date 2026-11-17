/**
 * ASCII Architecture Flowchart: ErrorBoundary
 *
 *   ┌──────────────────────────────────────┐
 *   │       Initialize ErrorBoundary       │
 *   └──────────────────────────────────────┘
 *                      │
 *                      ▼
 *   ┌──────────────────────────────────────┐
 *   │  Execute Component / Pipeline Logic  │
 *   └──────────────────────────────────────┘
 *                      │
 *                      ▼
 *   ┌──────────────────────────────────────┐
 *   │    Return State / Result Payload     │
 *   └──────────────────────────────────────┘
 */

import * as React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { BaseButton } from '@ultrst-armada/floks';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  tabName?: string;
  onReset?: () => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[Aiko Gateway ErrorBoundary Catch - ${this.props.tabName || 'App'}]:`, error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-6 bg-slate-900/90 text-slate-100 font-mono">
          <div className="max-w-xl w-full p-6 rounded-lg bg-slate-950 border-2 border-red-500 shadow-[4px_4px_0px_0px_rgba(239,68,68,0.9)] space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle size={24} className="shrink-0 animate-pulse" />
              <div>
                <h2 className="text-lg font-black tracking-wide">
                  COMPONENT FAULT DETECTED
                </h2>
                <p className="text-xs text-slate-400">
                  Target View: {this.props.tabName ? this.props.tabName.toUpperCase() : 'UI VIEW'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-red-950/40 border border-red-800/80 rounded text-xs text-red-200 font-mono break-words">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </div>

            {this.state.error?.stack && (
              <details className="text-[10px] text-slate-400 cursor-pointer">
                <summary className="font-bold text-slate-300 hover:underline mb-1">
                  VIEW STACK TRACE
                </summary>
                <pre className="p-2 bg-slate-900 rounded overflow-x-auto text-[9px] leading-tight text-slate-400 max-h-40 overflow-y-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <BaseButton
                variant="warning"
                size="sm"
                onClick={this.handleRetry}
                icon={<RefreshCw size={13} />}
              >
                RETRY VIEW
              </BaseButton>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}