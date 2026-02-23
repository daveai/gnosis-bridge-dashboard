"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="bg-surface-card border border-border rounded-lg p-5 text-center">
            <p className="text-text-muted text-sm">Unable to load data</p>
            <p className="text-text-muted text-xs mt-1">Start the indexer and refresh</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
