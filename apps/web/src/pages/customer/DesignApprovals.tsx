import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { getPlatformRequests, PlatformProjectRequest } from '../../data/customerStore.js';
import {
  Eye,
  CheckCircle2,
  RotateCcw,
  ThumbsUp,
  Download,
  History,
  Sparkles,
  AlertCircle,
  FileCheck2,
  X,
  MessageSquare,
  Building,
} from 'lucide-react';

export interface CustomerDesignApprovalItem {
  id: string;
  projectId: string;
  documentTitle: string;
  documentVersion: string;
  previewUrl: string;
  status: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED';
  submittedAt: string;
  history: { version: string; comment: string; timestamp: string }[];
}

export const DesignApprovals: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [requests, setRequests] = useState<PlatformProjectRequest[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [approvals, setApprovals] = useState<CustomerDesignApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Approval Modal
  const [selectedApproval, setSelectedApproval] = useState<CustomerDesignApprovalItem | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REQUEST_CHANGES'>('APPROVE');
  const [comments, setComments] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Load user's real projects
  useEffect(() => {
    const rawUserPhone = user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : '';
    const myReqs = getPlatformRequests().filter((r) => {
      if (r.customerId === 'usr-cust-1' || r.customerName?.toLowerCase().includes('vikram') || r.customerPhone?.includes('9876543220')) return false;
      if (user?.id && r.customerId === user.id) return true;
      if (rawUserPhone && r.customerPhone) {
        return r.customerPhone.replace(/\D/g, '').slice(-10) === rawUserPhone;
      }
      return !user?.id && !rawUserPhone;
    });

    setRequests(myReqs);
    if (myReqs.length > 0) {
      setSelectedProjectId(myReqs[0].id);
    }
    setLoading(false);
  }, [user]);

  // Load approvals for selected project
  useEffect(() => {
    if (!selectedProjectId) {
      setApprovals([]);
      return;
    }
    try {
      const stored = localStorage.getItem(`customer_approvals_${selectedProjectId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setApprovals(parsed);
          return;
        }
      }
    } catch {}
    setApprovals([]);
  }, [selectedProjectId]);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApproval) return;
    setSubmittingAction(true);

    const newStatus = actionType === 'APPROVE' ? 'APPROVED' : 'CHANGES_REQUESTED';
    const newHistoryEntry = {
      version: selectedApproval.documentVersion,
      comment: comments.trim() || (actionType === 'APPROVE' ? 'Approved by homeowner.' : 'Changes requested by homeowner.'),
      timestamp: new Date().toISOString(),
    };

    const updated = approvals.map((a) =>
      a.id === selectedApproval.id
        ? {
            ...a,
            status: newStatus as any,
            history: [newHistoryEntry, ...a.history],
          }
        : a
    );

    setApprovals(updated);
    if (selectedProjectId) {
      localStorage.setItem(`customer_approvals_${selectedProjectId}`, JSON.stringify(updated));
    }

    success(`Design ${actionType === 'APPROVE' ? 'Approved' : 'Change Request Recorded'} successfully!`);
    setSelectedApproval(null);
    setComments('');
    setSubmittingAction(false);
  };

  return (
    <div className="space-y-6 text-xs font-sans">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gold-600 font-bold uppercase tracking-wider text-[11px] mb-1">
            <Eye className="w-4 h-4" />
            <span>Engineering & 3D Deliverables Sign-off Gateway</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
            Customer Design Approvals & Revision Workflow
          </h1>
          <p className="text-slate-500 mt-1">
            Review submitted 2D drawings, 3D structural elevations, and material palettes. Approve designs or submit precise change requests before construction casting.
          </p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-2xs space-y-3 max-w-md mx-auto">
          <Eye className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm font-display">No Active Design Project Found</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Engineering 2D blueprints, photorealistic 3D elevations, and structural layouts submitted by your assigned professional will appear here for your review and sign-off.
          </p>
          <div className="pt-2">
            <Link
              to="/dashboard/create-request"
              className="btn-gold text-xs py-2 px-4 font-bold rounded-xl inline-block"
            >
              Get New Quotation
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Project Switcher Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Project Scope:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-navy-900 bg-white"
              >
                {requests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.requestCode} - {r.propertyType} ({r.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Approvals Grid */}
          {approvals.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-2xs space-y-2">
              <Eye className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-sm">No Design Deliverables Pending Approval</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Your assigned contractor is currently preparing 2D layouts and 3D renderings. You will receive an operational notification as soon as new drafts are published for review.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {approvals.map((appr) => (
                <div
                  key={appr.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-64 bg-slate-100 overflow-hidden group">
                      <img
                        src={appr.previewUrl}
                        alt={appr.documentTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-navy-950/90 text-gold-400 font-bold text-xs shadow-md">
                        Version {appr.documentVersion}
                      </div>
                      <div
                        className={`absolute top-3 right-3 px-2.5 py-1 rounded-md font-bold text-xs shadow-md ${
                          appr.status === 'APPROVED'
                            ? 'bg-emerald-500 text-white'
                            : appr.status === 'CHANGES_REQUESTED'
                            ? 'bg-amber-500 text-white'
                            : 'bg-gold-500 text-navy-950'
                        }`}
                      >
                        {appr.status === 'PENDING' ? 'AWAITING APPROVAL' : appr.status}
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <h3 className="font-bold text-base text-slate-900 leading-snug">{appr.documentTitle}</h3>

                      {/* Revision Audit History */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase">
                          <History className="w-3.5 h-3.5" />
                          <span>Version History & Notes</span>
                        </div>
                        {(appr.history || []).map((h, idx) => (
                          <div key={idx} className="flex justify-between items-start text-slate-600 pt-1 border-t border-slate-100 first:border-0 first:pt-0">
                            <div>
                              <span className="font-mono font-bold text-slate-900">{h.version}</span>: {h.comment}
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                              {new Date(h.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex gap-2">
                    <button
                      onClick={() => success(`Downloading high-resolution render ${appr.documentVersion}...`)}
                      className="px-3.5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedApproval(appr);
                        setActionType('REQUEST_CHANGES');
                      }}
                      className="flex-1 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-xl flex items-center justify-center gap-1.5 border border-amber-200 transition"
                    >
                      <RotateCcw className="w-4 h-4 text-amber-700" />
                      <span>Request Revision</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedApproval(appr);
                        setActionType('APPROVE');
                      }}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Action Dialog Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 flex items-center justify-center">
            <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm" onClick={() => setSelectedApproval(null)} />
            <div className="relative bg-white rounded-2xl max-w-md w-full p-6 text-left shadow-2xl border border-slate-100 space-y-4 z-10 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-navy-950 text-sm">
                  {actionType === 'APPROVE' ? 'Approve Project Deliverable' : 'Request Design Revision'}
                </h3>
                <button onClick={() => setSelectedApproval(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="font-bold text-slate-800">{selectedApproval.documentTitle}</div>
                <div className="text-[11px] text-slate-500">Deliverable Version: {selectedApproval.documentVersion}</div>
              </div>

              <form onSubmit={handleActionSubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {actionType === 'APPROVE' ? 'Approval Comments / Notes (Optional)' : 'Specify Required Modifications *'}
                  </label>
                  <textarea
                    rows={4}
                    required={actionType === 'REQUEST_CHANGES'}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder={
                      actionType === 'APPROVE'
                        ? 'e.g. Dimensions and window placements approved for G+2 superstructure casting.'
                        : 'e.g. Please widen kitchen balcony window by 1.5 ft and relocate staircase landing.'
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedApproval(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className={`px-5 py-2 font-bold rounded-xl flex items-center gap-1.5 shadow-2xs text-white ${
                      actionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    {actionType === 'APPROVE' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    <span>{actionType === 'APPROVE' ? 'Confirm Approval' : 'Submit Revision Request'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
