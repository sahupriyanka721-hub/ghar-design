import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowLeft,
  Lock,
  ArrowRight,
  Terminal,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import {
  PlatformAuditLog,
  getPlatformAuditLogs,
} from '../../data/adminStore.js';

export const AdminAuditLogs: React.FC = () => {
  const { success } = useToast();
  const [logs, setLogs] = useState<PlatformAuditLog[]>(() => getPlatformAuditLogs());
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [activeLog, setActiveLog] = useState<PlatformAuditLog | null>(null);

  const refreshData = () => {
    setLogs(getPlatformAuditLogs());
    success('Audit logs refreshed from storage');
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = search.toLowerCase();
      const matchesSearch =
        log.action.toLowerCase().includes(q) ||
        log.adminName.toLowerCase().includes(q) ||
        log.entity.toLowerCase().includes(q) ||
        log.module.toLowerCase().includes(q) ||
        log.ipAddress.includes(search);

      const matchesModule = selectedModule === 'ALL' || log.module === selectedModule;
      return matchesSearch && matchesModule;
    });
  }, [logs, search, selectedModule]);

  const stats = useMemo(() => {
    return {
      total: logs.length,
      financial: logs.filter((l) => l.module.includes('FINANCIAL') || l.action.includes('PAYOUT')).length,
      kyc: logs.filter((l) => l.action.includes('APPROVE') || l.action.includes('VERIF') || l.action.includes('KYC')).length,
      config: logs.filter((l) => l.module.includes('CONFIG') || l.module.includes('SETTINGS')).length,
    };
  }, [logs]);

  const uniqueModules = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.module)));
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-navy-950">Security Audit Trail & Activity Ledger</h1>
              <p className="text-xs text-slate-500">
                Tamper-resistant operational logs recording all administrative decisions, payout releases, and state mutations
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Immutable Trail Active</span>
          </span>
          <button
            onClick={refreshData}
            title="Refresh Logs"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Audit Events</p>
          <p className="text-2xl font-black text-navy-950 mt-1">{stats.total}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Recorded administrative changes</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Financial Mutations</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.financial}</p>
          <p className="text-[10px] text-emerald-600/70 mt-0.5">Payouts, UTRs & Escrow releases</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-sky-200/80 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">KYC & Team Assignments</p>
          <p className="text-2xl font-black text-sky-600 mt-1">{stats.kyc}</p>
          <p className="text-[10px] text-sky-600/70 mt-0.5">Stakeholder verifications & matching</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-purple-200/80 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Config & Policy Changes</p>
          <p className="text-2xl font-black text-purple-600 mt-1">{stats.config}</p>
          <p className="text-[10px] text-purple-600/70 mt-0.5">Platform rates & global switches</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail by action, officer, entity, or IP address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none text-xs"
            >
              <option value="ALL">All Modules</option>
              {uniqueModules.map((m) => (
                <option key={m} value={m}>
                  {m.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Timestamp (IST)</th>
                <th className="py-3.5 px-4">Action Code</th>
                <th className="py-3.5 px-4">Module</th>
                <th className="py-3.5 px-4">Target Entity / Subject</th>
                <th className="py-3.5 px-4">Previous Value</th>
                <th className="py-3.5 px-4">New Value</th>
                <th className="py-3.5 px-4">Performed By</th>
                <th className="py-3.5 px-4">IP Address</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Terminal className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-sm">No audit records match your filters.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-slate-900 text-white">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold text-sky-800 uppercase">
                        {log.module.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">
                      {log.entity}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-red-700 font-mono max-w-xs truncate">
                      {log.previousValue || '—'}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-emerald-700 font-mono font-bold max-w-xs truncate">
                      {log.newValue || '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                      {log.adminName}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {log.ipAddress}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setActiveLog(log)}
                        className="p-1 text-slate-400 hover:text-sky-600 rounded transition"
                        title="View Detailed Payload"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full-Screen Log Inspection Dossier */}
      {activeLog && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setActiveLog(null)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back to Audit Trail</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <Terminal className="w-5 h-5 text-sky-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Audit Event Payload & Trace
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Event ID: {activeLog.id} • Module: {activeLog.module}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveLog(null)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1200px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl space-y-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Action Code</p>
                  <p className="font-mono font-bold text-navy-950 mt-1 text-sm">{activeLog.action}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Module</p>
                  <p className="font-bold text-sky-700 mt-1 text-sm">{activeLog.module}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Timestamp</p>
                  <p className="font-mono text-slate-700 mt-1 text-xs">
                    {new Date(activeLog.timestamp).toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Admin / IP Address</p>
                  <p className="font-mono text-slate-700 mt-1 text-xs">{activeLog.adminName} ({activeLog.ipAddress})</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-600 uppercase mb-2">Target Subject / Entity</p>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-navy-950 text-sm">
                  {activeLog.entity}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-red-600 uppercase mb-2">Prior State (Before)</p>
                  <div className="p-4 bg-red-50/70 border border-red-200 rounded-2xl font-mono text-xs text-red-900 break-words whitespace-pre-wrap">
                    {activeLog.previousValue || 'N/A (Initial State)'}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase mb-2">New State (After)</p>
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl font-mono text-xs font-bold text-emerald-900 break-words whitespace-pre-wrap">
                    {activeLog.newValue || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogs;
