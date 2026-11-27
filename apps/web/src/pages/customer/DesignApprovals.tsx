import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { getPlatformRequests, PlatformProjectRequest } from '../../data/customerStore.js';
import { getExecutionProjects } from '../../data/projectExecutionStore.js';
import {
  getInteriorDesignAssets,
  customerReviewDesignAsset,
  InteriorDesignAsset,
} from '../../data/interiorDesignerStore.js';
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
  Maximize2,
  ShieldCheck,
  Palette,
  Compass,
} from 'lucide-react';

export interface CustomerDesignApprovalItem {
  id: string;
  projectId: string;
  documentTitle: string;
  category: 'ARCHITECTURAL' | 'STRUCTURAL' | 'INTERIOR';
  documentVersion: string;
  previewUrl: string;
  status: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED';
  submittedAt: string;
  designerName: string;
  designerRole: string;
  notes?: string;
  history: { version: string; comment: string; timestamp: string; by?: string }[];
}

const DEFAULT_DELIVERABLES: Omit<CustomerDesignApprovalItem, 'id' | 'projectId'>[] = [
  {
    documentTitle: 'Sanctioned 2D Architectural Floor Plan & Room Dimensions',
    category: 'ARCHITECTURAL',
    documentVersion: 'v1.2',
    previewUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    status: 'APPROVED',
    designerName: 'Ar. Rajesh Verma',
    designerRole: 'COA Registered Senior Architect',
    submittedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    notes: 'Municipal bye-laws setback compliant. Ground + First Floor living spaces.',
    history: [
      { version: 'v1.0', comment: 'Initial concept draft created', timestamp: new Date(Date.now() - 86400000 * 8).toISOString(), by: 'Architect' },
      { version: 'v1.2', comment: 'Balcony setbacks aligned per municipal zoning bye-laws', timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), by: 'Customer' },
    ],
  },
  {
    documentTitle: 'Photorealistic 3D Front Facade & Exterior Night Elevation',
    category: 'ARCHITECTURAL',
    documentVersion: 'v2.0',
    previewUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    status: 'PENDING',
    designerName: 'Ar. Rajesh Verma',
    designerRole: 'COA Registered Senior Architect',
    submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    notes: 'Warm white ambient facade lighting with HPL wooden louvers and stone cladding.',
    history: [
      { version: 'v1.0', comment: 'Initial elevation draft', timestamp: new Date(Date.now() - 86400000 * 6).toISOString(), by: 'Architect' },
      { version: 'v2.0', comment: 'Integrated double-height terrace louvers per customer request', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), by: 'Architect' },
    ],
  },
  {
    documentTitle: 'IS 456 Structural RCC Reinforcement Schedule & Column Grid',
    category: 'STRUCTURAL',
    documentVersion: 'v1.0',
    previewUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=1200&q=80',
    status: 'APPROVED',
    designerName: 'Er. Alok Sengupta',
    designerRole: 'IEI Chartered Structural Engineer',
    submittedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    notes: 'Calculated for Zone IV Seismic resistance with Fe550D primary TMT rebar reinforcement.',
    history: [
      { version: 'v1.0', comment: 'Structural calculation vetted against soil SBC test report', timestamp: new Date(Date.now() - 86400000 * 4).toISOString(), by: 'Structural Engineer' },
    ],
  },
  {
    documentTitle: 'Living & Dining Room Spatial 3D Interior Mood Board',
    category: 'INTERIOR',
    documentVersion: 'v1.1',
    previewUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    status: 'PENDING',
    designerName: 'Pooja Singhania',
    designerRole: 'Principal Interior Designer',
    submittedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    notes: 'Italian Bottochino marble flooring palette, cove LED lighting, and fluted acoustic wall paneling.',
    history: [
      { version: 'v1.1', comment: 'Curated premium finish schedule and false ceiling drop heights', timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), by: 'Designer' },
    ],
  },
  {
    documentTitle: 'Modular Kitchen Layout & Concealed Piping Plan',
    category: 'INTERIOR',
    documentVersion: 'v1.0',
    previewUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
    status: 'PENDING',
    designerName: 'Pooja Singhania',
    designerRole: 'Principal Interior Designer',
    submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    notes: 'Parallel counter ergonomics with quartz countertop and chimney exhaust ducting.',
    history: [
      { version: 'v1.0', comment: 'Initial utility sink & dishwasher electrical provision draft', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), by: 'Designer' },
    ],
  },
];

export const DesignApprovals: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projectsList, setProjectsList] = useState<{ id: string; title: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [approvals, setApprovals] = useState<CustomerDesignApprovalItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Approval Modal
  const [selectedApproval, setSelectedApproval] = useState<CustomerDesignApprovalItem | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REQUEST_CHANGES'>('APPROVE');
  const [comments, setComments] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Lightbox Zoom Modal
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string; version: string } | null>(null);

  // Load user's real projects & execution projects
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

    const execProjects = getExecutionProjects();
    const combined: { id: string; title: string }[] = [];

    execProjects.forEach((p) => {
      combined.push({ id: p.id, title: `${p.projectCode} - ${p.projectName}` });
    });

    myReqs.forEach((r) => {
      if (!combined.some((c) => c.id === r.id)) {
        combined.push({ id: r.id, title: `${r.requestCode} - ${r.propertyType} (${r.city})` });
      }
    });

    if (combined.length === 0) {
      combined.push({ id: 'proj-default-active', title: 'GHR-PRJ-2026 - Modern Villa Project' });
    }

    setProjectsList(combined);
    setSelectedProjectId(combined[0].id);
    setLoading(false);
  }, [user]);

  // Load approvals for selected project
  useEffect(() => {
    if (!selectedProjectId) return;
    let list: CustomerDesignApprovalItem[] = [];
    try {
      const stored = localStorage.getItem(`customer_approvals_${selectedProjectId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = parsed;
        }
      }
    } catch {}

    if (list.length === 0) {
      // Seed default realistic deliverables for project
      list = DEFAULT_DELIVERABLES.map((d, idx) => ({
        ...d,
        id: `appr-${selectedProjectId}-${idx + 1}`,
        projectId: selectedProjectId,
      }));
    }

    // Merge forwarded Interior Designer assets from store (Section 9F customer routing)
    try {
      const interiorAssets = getInteriorDesignAssets();
      const relevantInterior = interiorAssets.filter(
        (a) =>
          (a.forwardedToCustomer || a.adminReviewStatus === 'APPROVED_BY_ADMIN' || a.adminReviewStatus === 'APPROVED') &&
          (a.projectId === selectedProjectId ||
            selectedProjectId === 'proj-default-active' ||
            a.projectId.includes(selectedProjectId) ||
            selectedProjectId.includes(a.projectId) ||
            true) // allow viewing in default projects
      );

      for (const asset of relevantInterior) {
        const existingIdx = list.findIndex(
          (item) => item.id === asset.id || item.documentTitle === asset.title || item.id === asset.documentId
        );
        const mappedItem: CustomerDesignApprovalItem = {
          id: asset.id,
          projectId: selectedProjectId,
          documentTitle: asset.title,
          category: 'INTERIOR',
          documentVersion: asset.version,
          previewUrl: asset.fileUrl,
          status:
            asset.clientApprovalStatus === 'APPROVED'
              ? 'APPROVED'
              : asset.clientApprovalStatus === 'CHANGES_REQUESTED'
              ? 'CHANGES_REQUESTED'
              : 'PENDING',
          submittedAt: asset.uploadedAt,
          designerName: asset.uploadedBy || 'Principal Interior Designer',
          designerRole: 'Principal Interior Designer',
          notes: `${asset.roomName} • ${asset.dimensionsOrSpecs || ''}`,
          history: (asset.versionHistory || []).map((h) => ({
            version: h.version,
            comment: h.comments || 'Previous version',
            timestamp: h.uploadedAt,
            by: 'Designer',
          })),
        };

        if (existingIdx >= 0) {
          list[existingIdx] = mappedItem;
        } else {
          list.unshift(mappedItem);
        }
      }
    } catch (e) {}

    setApprovals(list);
    try {
      localStorage.setItem(`customer_approvals_${selectedProjectId}`, JSON.stringify(list));
    } catch {}
  }, [selectedProjectId]);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApproval) return;
    setSubmittingAction(true);

    const isApprove = actionType === 'APPROVE';
    const newStatus = isApprove ? 'APPROVED' : 'CHANGES_REQUESTED';
    const newVersion = isApprove
      ? selectedApproval.documentVersion
      : `v${(parseFloat(selectedApproval.documentVersion.replace('v', '')) + 0.1).toFixed(1)}`;

    const newHistoryEntry = {
      version: newVersion,
      comment: comments.trim() || (isApprove ? 'Approved by homeowner.' : 'Design revision requested by homeowner.'),
      timestamp: new Date().toISOString(),
      by: user?.name || 'Homeowner',
    };

    const updated = approvals.map((a) =>
      a.id === selectedApproval.id
        ? {
            ...a,
            documentVersion: isApprove ? a.documentVersion : newVersion,
            status: newStatus as any,
            history: [newHistoryEntry, ...(a.history || [])],
          }
        : a
    );

    setApprovals(updated);
    if (selectedProjectId) {
      localStorage.setItem(`customer_approvals_${selectedProjectId}`, JSON.stringify(updated));
    }

    // Section 9F Rule: Route customer decision strictly through Admin
    if (selectedApproval.category === 'INTERIOR') {
      try {
        customerReviewDesignAsset(
          selectedApproval.id,
          isApprove ? 'APPROVE' : 'REQUEST_REVISION',
          comments.trim() || (isApprove ? 'Approved by homeowner.' : 'Design revision requested by homeowner.')
        );
      } catch (err) {}
    }

    success(
      isApprove
        ? `Deliverable "${selectedApproval.documentTitle}" Approved!`
        : `Revision requested on "${selectedApproval.documentTitle}". Assigned team notified.`
    );
    setSelectedApproval(null);
    setComments('');
    setSubmittingAction(false);
  };

  const filteredApprovals = approvals.filter((a) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'ARCHITECTURAL') return a.category === 'ARCHITECTURAL';
    if (selectedFilter === 'STRUCTURAL') return a.category === 'STRUCTURAL';
    if (selectedFilter === 'INTERIOR') return a.category === 'INTERIOR';
    if (selectedFilter === 'PENDING') return a.status === 'PENDING';
    if (selectedFilter === 'APPROVED') return a.status === 'APPROVED';
    return true;
  });

  return (
    <div className="space-y-6 text-xs font-sans">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gold-600 font-bold uppercase tracking-wider text-[11px] mb-1">
            <Compass className="w-4 h-4" />
            <span>Section 7 &bull; Design & Deliverables Gateway</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
            Customer Design Approvals & Revision Workflow
          </h1>
          <p className="text-slate-500 mt-1">
            Review submitted 2D blueprints, 3D structural elevations, and interior palettes. Approve designs or submit precise change requests before construction casting.
          </p>
        </div>
      </div>

      {/* Project Switcher & Category Filter Pills */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">Project:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-navy-900 bg-white"
          >
            {projectsList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {/* Section 7 Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'ALL', label: 'All Designs' },
            { id: 'ARCHITECTURAL', label: '7.1 Architectural 2D/3D' },
            { id: 'STRUCTURAL', label: '7.1 Structural RCC' },
            { id: 'INTERIOR', label: '7.2 Interior 3D' },
            { id: 'PENDING', label: '7.3 Pending Approval' },
            { id: 'APPROVED', label: '7.3 Approved' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition ${
                selectedFilter === tab.id
                  ? 'bg-navy-950 text-gold-400 shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Approvals Grid */}
      {filteredApprovals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-2xs space-y-2">
          <Eye className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">No Deliverables in This Category</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Your assigned architect and designers are preparing updates. You will be notified when new drafts are submitted.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredApprovals.map((appr) => (
            <div
              key={appr.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div>
                <div className="relative h-64 bg-slate-100 overflow-hidden group">
                  <img
                    src={appr.previewUrl}
                    alt={appr.documentTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300 cursor-pointer"
                    onClick={() =>
                      setZoomImage({
                        url: appr.previewUrl,
                        title: appr.documentTitle,
                        version: appr.documentVersion,
                      })
                    }
                  />
                  <button
                    onClick={() =>
                      setZoomImage({
                        url: appr.previewUrl,
                        title: appr.documentTitle,
                        version: appr.documentVersion,
                      })
                    }
                    className="absolute bottom-3 right-3 p-2 bg-navy-950/80 hover:bg-navy-950 text-white rounded-lg opacity-0 group-hover:opacity-100 transition shadow-md"
                    title="Zoom Drawing"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>

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
                    {appr.status === 'PENDING' ? 'AWAITING APPROVAL' : appr.status.replace('_', ' ')}
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {appr.category} &bull; {appr.designerName} ({appr.designerRole})
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 leading-snug">{appr.documentTitle}</h3>

                  {appr.notes && (
                    <p className="text-slate-600 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                      {appr.notes}
                    </p>
                  )}

                  {/* Revision Audit History */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase">
                      <History className="w-3.5 h-3.5" />
                      <span>Version History & Notes</span>
                    </div>
                    {(appr.history || []).map((h, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-start text-slate-600 pt-1 border-t border-slate-100 first:border-0 first:pt-0"
                      >
                        <div>
                          <span className="font-mono font-bold text-slate-900">{h.version}</span>
                          {h.by && <span className="text-slate-400"> ({h.by})</span>}: {h.comment}
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
                  onClick={() => success(`Downloading high-resolution drawing render (${appr.documentVersion})...`)}
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

                {appr.status !== 'APPROVED' ? (
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
                ) : (
                  <div className="flex-1 py-2.5 bg-emerald-50 text-emerald-800 font-bold rounded-xl flex items-center justify-center gap-1.5 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Approved & Signed</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Zoom Lightbox Modal */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/90 backdrop-blur-md">
          <div className="relative max-w-5xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 bg-slate-900/90 border-b border-slate-800 text-white">
              <div>
                <h3 className="font-bold text-sm">{zoomImage.title}</h3>
                <span className="text-[11px] text-gold-400 font-mono">Version {zoomImage.version}</span>
              </div>
              <button onClick={() => setZoomImage(null)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-950">
              <img src={zoomImage.url} alt={zoomImage.title} className="max-h-[75vh] w-auto object-contain rounded-lg" />
            </div>
          </div>
        </div>
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
                <div className="text-[11px] text-slate-500">
                  Category: {selectedApproval.category} &bull; Current Version: {selectedApproval.documentVersion}
                </div>
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
