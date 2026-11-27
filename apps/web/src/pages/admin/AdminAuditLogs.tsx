import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  ShieldCheck,
  Clock,
  User,
  Activity,
  Layers,
  Eye,
  RefreshCw,
  X,
  Lock,
  Terminal,
  Compass,
  CreditCard,
  Building2,
  GitCommit,
  LogIn,
  AlertTriangle,
  Download,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

import { useToast } from '../../context/ToastContext.js';

import {
  AuditLogCategory,
  ComprehensiveAuditLogEntry,
  getComprehensiveAuditLogs,
  saveComprehensiveAuditLogs,
} from '../../data/auditTrailStore.js';

interface ViewTabMeta {
  key: AuditLogCategory;
  label: string;
  icon: any;
  shortDesc: string;
}

const VIEW_TABS: ViewTabMeta[] = [
  {
    key: 'ADMIN_ACTIVITY',
    label: 'Admin Activity',
    icon: Lock,
    shortDesc: 'Administrative actions, role mutations, commission schedule adjustments, and manual overrides',
  },
  {
    key: 'CUSTOMER_ACTIVITY',
    label: 'Customer Activity',
    icon: User,
    shortDesc: 'Homeowner requests, quotation approvals, design revision requests, and contract signings',
  },
  {
    key: 'ARCHITECT_ACTIVITY',
    label: 'Architect Activity',
    icon: Compass,
    shortDesc: 'Architect quotation submissions, 2D/3D CAD uploads, and milestone progress claims',
  },
  {
    key: 'PAYMENT_ACTIVITY',
    label: 'Payment Activity',
    icon: CreditCard,
    shortDesc: 'Escrow customer deposits, Razorpay/Cashfree gateway webhooks, payouts, and statutory TDS',
  },
  {
    key: 'PROJECT_ACTIVITY',
    label: 'Project Activity',
    icon: Building2,
    shortDesc: 'Project onboarding kickoffs, milestone inspection sign-offs, and timeline delay notices',
  },
  {
    key: 'STATUS_HISTORY',
    label: 'Status Change History',
    icon: GitCommit,
    shortDesc: 'State machine transitions for quotations, milestones, projects, and KYC applications',
  },
  {
    key: 'LOGIN_HISTORY',
    label: 'Login History',
    icon: LogIn,
    shortDesc: 'Authentication ledger across Admin, Architect, and Homeowner portals with IP and 2FA logs',
  },
];

export const AdminAuditLogs: React.FC = () => {
  const { success } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active View from URL (?view=)
  const rawView = searchParams.get('view') as AuditLogCategory | null;
  const activeView: AuditLogCategory = rawView && VIEW_TABS.some((t) => t.key === rawView)
    ? rawView
    : 'ADMIN_ACTIVITY';

  const setView = (newView: AuditLogCategory) => {
    setSearchParams({ view: newView });
  };

  const [logs, setLogs] = useState<ComprehensiveAuditLogEntry[]>(() => getComprehensiveAuditLogs());
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<ComprehensiveAuditLogEntry | null>(null);

  const refreshData = () => {
    setLogs(getComprehensiveAuditLogs());
    success('Audit logs refreshed from storage');
  };

  useEffect(() => {
    const handleUpdate = () => {
      setLogs(getComprehensiveAuditLogs());
    };
    window.addEventListener('AUDIT_TRAIL_UPDATED', handleUpdate);
    return () => window.removeEventListener('AUDIT_TRAIL_UPDATED', handleUpdate);
  }, []);

  // Filter logs for current view + search query + status
  const currentViewLogs = useMemo(() => {
    return logs.filter((l) => l.category === activeView);
  }, [logs, activeView]);

  const filteredLogs = useMemo(() => {
    return currentViewLogs.filter((log) => {
      const q = search.toLowerCase();
      const matchesSearch =
        log.actorName.toLowerCase().includes(q) ||
        log.actionCode.toLowerCase().includes(q) ||
        log.targetEntity.toLowerCase().includes(q) ||
        log.targetId.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.ipAddress.includes(search) ||
        (log.utrOrTxnId && log.utrOrTxnId.toLowerCase().includes(q));

      const matchesStatus = filterStatus === 'ALL' || log.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [currentViewLogs, search, filterStatus]);

  // Overall Statistics
  const stats = useMemo(() => {
    return {
      totalAcrossAll: logs.length,
      currentViewCount: currentViewLogs.length,
      successCount: currentViewLogs.filter((l) => l.status === 'SUCCESS').length,
      warningCount: currentViewLogs.filter((l) => l.status === 'WARNING').length,
      flaggedCount: currentViewLogs.filter((l) => l.status === 'FLAGGED' || l.status === 'FAILED').length,
    };
  }, [logs, currentViewLogs]);

  // Export JSON
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buildghar-audit-${activeView.toLowerCase()}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    success(`Exported ${filteredLogs.length} audit records as JSON`);
  };

  const activeMeta = VIEW_TABS.find((t) => t.key === activeView) || VIEW_TABS[0];

  return (
    <div className="space-y-6 pb-12">
      {/* -------------------------------------------------------------------- */}
      {/* 1. TOP HEADER & VIEW SWITCHER DROPDOWN                                */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-800 to-navy-950 text-white flex items-center justify-center shadow-md shadow-slate-900/20">
              <FileText className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-navy-950">21. Security Audit Trail</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Immutable Ledger
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Tamper-resistant operational records logging all admin decisions, customer actions, architect submissions, payments, and authentication events
              </p>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* View Selector Dropdown */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={activeView}
                onChange={(e) => setView(e.target.value as AuditLogCategory)}
                className="w-full sm:w-64 pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 cursor-pointer shadow-2xs"
              >
                {VIEW_TABS.map((tab, idx) => (
                  <option key={tab.key} value={tab.key}>
                    {idx + 1}. {tab.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportJson}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={refreshData}
              title="Refresh Audit Logs"
              className="p-2 border border-slate-300 hover:bg-slate-100 text-slate-600 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* HORIZONTAL PILL NAV BAR (ALL 7 VIEWS)                             */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100 scrollbar-none">
          {VIEW_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isCurrent = activeView === tab.key;
            const count = logs.filter((l) => l.category === tab.key).length;

            return (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                  isCurrent
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-navy-950'
                }`}
              >
                <TabIcon className={`w-3.5 h-3.5 ${isCurrent ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isCurrent ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* CONTEXTUAL FEATURE HEADER BANNER                                      */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-slate-900 via-navy-950 to-slate-900 rounded-2xl p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-navy-950 uppercase tracking-wider">
                Module 21
              </span>
              <h2 className="text-base font-bold text-white">{activeMeta.label}</h2>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">{activeMeta.shortDesc}</p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="flex items-center gap-4 text-center">
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/10">
              <div className="text-lg font-bold text-amber-300">{stats.currentViewCount}</div>
              <div className="text-[10px] text-slate-300 uppercase">View Events</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/10">
              <div className="text-lg font-bold text-emerald-300">{stats.successCount}</div>
              <div className="text-[10px] text-slate-300 uppercase">Success</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/10">
              <div className="text-lg font-bold text-sky-300">{stats.warningCount}</div>
              <div className="text-[10px] text-slate-300 uppercase">Warnings</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/10">
              <div className="text-lg font-bold text-rose-300">{stats.flaggedCount}</div>
              <div className="text-[10px] text-slate-300 uppercase">Flagged / Fail</div>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* SEARCH AND FILTER BAR                                                */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${activeMeta.label} by actor, action, entity, IP or details...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500 focus:bg-white transition"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none text-xs cursor-pointer"
            >
              <option value="ALL">All Outcomes</option>
              <option value="SUCCESS">Success Only</option>
              <option value="WARNING">Warnings</option>
              <option value="FAILED">Failures</option>
              <option value="FLAGGED">Flagged / Security</option>
            </select>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* AUDIT LOG TABLE (CONTEXTUAL FOR ALL 7 VIEWS)                         */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Timestamp (IST)</th>
                <th className="py-3.5 px-4">Actor & Role</th>
                <th className="py-3.5 px-4">Action Code</th>
                <th className="py-3.5 px-4">Target Entity</th>
                {activeView === 'PAYMENT_ACTIVITY' && <th className="py-3.5 px-4">Amount & Gateway Ref</th>}
                {activeView === 'STATUS_HISTORY' && <th className="py-3.5 px-4">State Mutation</th>}
                {activeView === 'LOGIN_HISTORY' && <th className="py-3.5 px-4">Device / Client</th>}
                <th className="py-3.5 px-4">Details / Summary</th>
                <th className="py-3.5 px-4">Outcome</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Terminal className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-sm">No audit records found matching your filters.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const formattedTime = new Date(log.timestamp).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      {/* Timestamp */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {formattedTime}
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-navy-950">{log.actorName}</div>
                        <span className="text-[10px] text-slate-500 font-mono">{log.actorRole}</span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-slate-900 text-white">
                          {log.actionCode}
                        </span>
                      </td>

                      {/* Target Entity */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 text-[11px]">{log.targetEntity}</div>
                        <span className="font-mono text-[10px] text-slate-400">{log.targetId}</span>
                      </td>

                      {/* Column for Payment Activity */}
                      {activeView === 'PAYMENT_ACTIVITY' && (
                        <td className="py-3 px-4 whitespace-nowrap">
                          {log.amountRupees !== undefined && (
                            <div className="font-bold text-blue-700">₹{log.amountRupees.toLocaleString('en-IN')}</div>
                          )}
                          <span className="font-mono text-[10px] text-slate-400">{log.utrOrTxnId || '—'}</span>
                        </td>
                      )}

                      {/* Column for Status Mutation */}
                      {activeView === 'STATUS_HISTORY' && (
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-[10px] font-mono">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {log.previousState || 'NONE'}
                            </span>
                            <span className="text-slate-400">→</span>
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                              {log.newState || 'UPDATED'}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Column for Login History */}
                      {activeView === 'LOGIN_HISTORY' && (
                        <td className="py-3 px-4 max-w-xs truncate text-[11px] text-slate-600">
                          <div>{log.deviceOrChannel}</div>
                          <span className="font-mono text-[10px] text-slate-400">{log.ipAddress}</span>
                        </td>
                      )}

                      {/* Details */}
                      <td className="py-3 px-4 text-slate-600 max-w-sm truncate text-[11px]">
                        {log.details}
                      </td>

                      {/* Outcome Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.status === 'WARNING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>

                      {/* Inspect Button */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 text-slate-600 hover:text-navy-950 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Inspect Audit Entry"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* MODAL: INSPECT FULL AUDIT ENTRY                                      */}
      {/* -------------------------------------------------------------------- */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-navy-950">Security Audit Record Inspector</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Audit Record ID</span>
                  <span className="font-mono text-slate-800">{selectedLog.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Category Domain</span>
                  <span className="font-bold text-blue-700">{selectedLog.category}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Timestamp (UTC/IST)</span>
                  <span className="font-mono text-slate-800">{selectedLog.timestamp}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Outcome Status</span>
                  <span className="font-bold text-emerald-700">{selectedLog.status}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Actor Name & Role</span>
                  <span className="font-bold text-navy-950">{selectedLog.actorName} ({selectedLog.actorRole})</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">IP Address</span>
                  <span className="font-mono text-slate-800">{selectedLog.ipAddress}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Action Trigger</span>
                  <span className="font-mono font-bold text-slate-900">{selectedLog.actionCode}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Target Entity & ID</span>
                  <span className="font-mono text-slate-800">{selectedLog.targetEntity} / {selectedLog.targetId}</span>
                </div>
              </div>

              {selectedLog.utrOrTxnId && (
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-blue-600 block font-semibold">Transaction Reference</span>
                    <span className="font-mono font-bold text-blue-900">{selectedLog.utrOrTxnId}</span>
                  </div>
                  {selectedLog.amountRupees && (
                    <div className="text-right">
                      <span className="text-[10px] text-blue-600 block font-semibold">Disbursed / Received</span>
                      <span className="text-sm font-extrabold text-blue-900">₹{selectedLog.amountRupees.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <span className="text-[10px] text-slate-400 block font-semibold mb-1">Audit Details & Cryptographic Trace</span>
                <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl whitespace-pre-wrap">
                  {selectedLog.details}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogs;
