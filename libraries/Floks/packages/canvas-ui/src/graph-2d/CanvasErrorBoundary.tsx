import React, { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class CanvasErrorBoundary extends (Component as { new(props: Props): any }) {
  props: Props;
  state: State = { hasError: false, errorMessage: '' };

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message || 'Unknown render error' };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('2D Node Graph Viewer encountered an error:', error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-6 text-center text-slate-300">
          <div className="max-w-md p-5 rounded-xl border border-red-500/30 bg-red-950/20 backdrop-blur-md">
            <h3 className="text-sm font-semibold text-red-400 mb-2">2D Graph View Recovered</h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">{this.state.errorMessage}</p>
            <button
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
              className="px-4 py-1.5 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 transition-colors"
            >
              Reload 2D View
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
