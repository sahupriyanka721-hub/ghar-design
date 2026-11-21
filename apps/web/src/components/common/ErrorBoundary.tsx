import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BrandLogo } from './BrandLogo.js';
import { Home, LayoutDashboard, RefreshCw, Wrench, ShieldCheck } from 'lucide-react';
import { selfHealStorage } from '../../lib/dataSanitizer.js';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GharDesign Root ErrorBoundary] Caught Component Error:', error, errorInfo);
    // Automatically sanitize and repair corrupted storage data in the background
    selfHealStorage();
  }

  private handleAutoRepair = () => {
    selfHealStorage();
    this.setState({ hasError: false, error: null });
  };

  private handleGoHome = () => {
    selfHealStorage();
    window.location.replace('/');
  };

  private handleGoAdmin = () => {
    selfHealStorage();
    window.location.replace('/admin');
  };

  private handleGoDashboard = () => {
    selfHealStorage();
    window.location.replace('/dashboard');
  };

  private handleReload = () => {
    selfHealStorage();
    window.location.reload();
  };

  private handleResetStorage = () => {
    try {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');
      localStorage.clear();
      sessionStorage.clear();
      if (savedUser) localStorage.setItem('user', savedUser);
      if (savedToken) localStorage.setItem('token', savedToken);
      selfHealStorage();
      window.location.replace('/dashboard');
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
          <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-5">
            <div className="flex justify-center">
              <BrandLogo size="md" />
            </div>

            <div className="space-y-1.5 pt-2">
              <h1 className="text-xl sm:text-2xl font-display font-bold text-navy-950">
                Updating Your Workspace
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Refreshing components to display the latest real-time construction data.
              </p>
            </div>

            {/* Seamless Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                onClick={this.handleAutoRepair}
                className="w-full py-3 px-4 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Wrench className="w-4 h-4 text-gold-400" />
                <span>Auto-Repair Data & Continue</span>
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                {isAdminRoute ? (
                  <button
                    onClick={this.handleGoAdmin}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-navy-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Admin Center</span>
                  </button>
                ) : (
                  <button
                    onClick={this.handleGoDashboard}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-navy-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Go to Dashboard</span>
                  </button>
                )}

                <button
                  onClick={this.handleGoHome}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5 text-slate-600" />
                  <span>Home Page</span>
                </button>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-center gap-4 text-[11px] text-slate-500">
              <button
                onClick={this.handleReload}
                className="hover:text-navy-950 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 text-slate-400" />
                <span>Refresh Now</span>
              </button>
              <button
                onClick={this.handleResetStorage}
                className="text-slate-400 hover:text-rose-600 hover:underline cursor-pointer"
              >
                Reset Cache & Reload
              </button>
            </div>

            {/* Diagnostic Details (Collapsible) */}
            {this.state.error && (
              <details className="text-left mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 font-mono">
                <summary className="cursor-pointer text-slate-500 hover:text-slate-800 font-sans font-semibold">
                  Technical Details
                </summary>
                <div className="mt-2 text-rose-700 whitespace-pre-wrap break-all font-mono text-[10px]">
                  {this.state.error.message}
                </div>
                {this.state.error.stack && (
                  <pre className="mt-1 text-[9px] text-slate-400 overflow-x-auto max-h-32">
                    {this.state.error.stack}
                  </pre>
                )}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
