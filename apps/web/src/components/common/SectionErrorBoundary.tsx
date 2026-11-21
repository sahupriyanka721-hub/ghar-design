import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Wrench, AlertTriangle, ArrowLeft } from 'lucide-react';
import { selfHealStorage } from '../../lib/dataSanitizer.js';

interface Props {
  children: ReactNode;
  sectionName?: string;
  fallbackUrl?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SectionErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[SectionErrorBoundary: ${this.props.sectionName || 'Section'}] Caught error:`, error, errorInfo);
    // Automatically sanitize storage in the background to resolve corrupted state
    selfHealStorage();
  }

  private handleAutoRepair = () => {
    selfHealStorage();
    this.setState({ hasError: false, error: null });
  };

  private handleGoFallback = () => {
    if (this.props.fallbackUrl) {
      window.location.href = this.props.fallbackUrl;
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-xl mx-auto my-8 bg-white border border-amber-200 rounded-3xl shadow-sm space-y-4 text-center font-sans">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-navy-950">
              {this.props.sectionName ? `${this.props.sectionName} Temporarily Unavailable` : 'Section Data Issue'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              A temporary data inconsistency occurred while loading this view. You can auto-repair the data safely without losing your account.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={this.handleAutoRepair}
              className="w-full sm:w-auto px-5 py-2.5 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Wrench className="w-4 h-4 text-gold-400" />
              <span>Auto-Repair & Retry</span>
            </button>

            <button
              onClick={this.handleGoFallback}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Go Back</span>
            </button>
          </div>

          {this.state.error && (
            <details className="text-left mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-500 font-mono">
              <summary className="cursor-pointer font-bold text-slate-600">Technical Details</summary>
              <div className="mt-1 break-all">{this.state.error.message}</div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
