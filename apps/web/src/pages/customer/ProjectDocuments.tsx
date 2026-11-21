import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { getPlatformRequests, PlatformProjectRequest } from '../../data/customerStore.js';
import {
  FolderOpen,
  FileText,
  Download,
  History,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Plus,
  X,
  Upload,
  Trash2,
} from 'lucide-react';

export interface CustomerStoredDoc {
  id: string;
  projectId: string;
  documentCode: string;
  title: string;
  category: 'DRAWING' | 'BOQ' | 'AGREEMENT' | 'SPECIFICATION' | 'SITE_REPORT' | 'HANDOVER';
  fileSize: string;
  currentVersion: string;
  uploadedAt: string;
  versions: { version: string; uploadedAt: string; notes?: string }[];
}

export const ProjectDocuments: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [requests, setRequests] = useState<PlatformProjectRequest[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [documents, setDocuments] = useState<CustomerStoredDoc[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      const upper = cat.toUpperCase();
      if (['DRAWING', 'BOQ', 'AGREEMENT', 'SPECIFICATION', 'SITE_REPORT', 'HANDOVER'].includes(upper)) {
        setSelectedCategory(upper);
      } else if (upper === 'INTERIOR') {
        setSelectedCategory('SPECIFICATION');
      }
    }
  }, [searchParams]);


  // Upload Document Modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<CustomerStoredDoc['category']>('DRAWING');
  const [docNotes, setDocNotes] = useState('');

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

  // Load documents for selected project
  useEffect(() => {
    if (!selectedProjectId) {
      setDocuments([]);
      return;
    }
    try {
      const stored = localStorage.getItem(`customer_project_docs_${selectedProjectId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setDocuments(parsed);
          return;
        }
      }
    } catch {}
    setDocuments([]);
  }, [selectedProjectId]);

  const categories = ['ALL', 'DRAWING', 'BOQ', 'AGREEMENT', 'SPECIFICATION', 'SITE_REPORT', 'HANDOVER'];

  const filteredDocs = documents.filter((d) => {
    if (selectedCategory === 'ALL') return true;
    return d.category === selectedCategory;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !selectedProjectId) {
      error('Please enter a document title');
      return;
    }

    const newDoc: CustomerStoredDoc = {
      id: `doc-${Date.now()}`,
      projectId: selectedProjectId,
      documentCode: `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
      title: docTitle.trim(),
      category: docCategory,
      fileSize: `${(Math.random() * 4 + 1.5).toFixed(1)} MB`,
      currentVersion: 'v1.0',
      uploadedAt: new Date().toISOString(),
      versions: [
        {
          version: 'v1.0',
          uploadedAt: new Date().toISOString(),
          notes: docNotes.trim() || 'Initial verified document upload',
        },
      ],
    };

    const updated = [newDoc, ...documents];
    setDocuments(updated);
    localStorage.setItem(`customer_project_docs_${selectedProjectId}`, JSON.stringify(updated));
    success(`Document "${newDoc.title}" archived successfully!`);
    setUploadModalOpen(false);
    setDocTitle('');
    setDocNotes('');
  };

  const handleDeleteDocument = (id: string) => {
    const updated = documents.filter((d) => d.id !== id);
    setDocuments(updated);
    if (selectedProjectId) {
      localStorage.setItem(`customer_project_docs_${selectedProjectId}`, JSON.stringify(updated));
    }
    success('Document removed from archive.');
  };

  return (
    <div className="space-y-6 text-xs font-sans">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gold-600 font-bold uppercase tracking-wider text-[11px] mb-1">
            <FolderOpen className="w-4 h-4" />
            <span>Secure Project Vault & Blueprint Archive</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
            Project Documents, BOQs & Sanctioned Blueprints
          </h1>
          <p className="text-slate-500 mt-1">
            Access certified engineering drawings, structural calculations, signed contracts, and material test reports with revision audit trails.
          </p>
        </div>

        {requests.length > 0 && (
          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2.5 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-2xs space-y-3 max-w-md mx-auto">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm font-display">No Active Construction Project Found</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Once you submit a project quotation request or confirm an contractor booking, your certified drawings, BOQs, and agreements will be managed here.
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
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Select Project:</span>
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

            {/* Category Pills */}
            <div className="flex gap-1.5 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition ${
                    selectedCategory === cat
                      ? 'bg-navy-950 text-gold-400 shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Documents Grid */}
          {filteredDocs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-2xs space-y-2">
              <FolderOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-sm">No Documents in This Category</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click "Upload Document" to archive sanctioned floor plans, soil test reports, or work agreements.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-slate-400">{doc.documentCode}</span>
                      <span className="px-2 py-0.5 rounded-md bg-gold-50 border border-gold-200 font-bold text-gold-800 text-[10px]">
                        Version {doc.currentVersion}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-navy-900" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm leading-snug">{doc.title}</h3>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Category: <strong className="text-slate-700">{doc.category}</strong> • Size: {doc.fileSize}
                        </div>
                      </div>
                    </div>

                    {/* Version History Drawer */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[10px] uppercase">
                        <History className="w-3.5 h-3.5 text-slate-400" />
                        <span>Revision Audit Log</span>
                      </div>
                      {(doc.versions || []).map((ver, idx) => (
                        <div key={idx} className="flex justify-between items-center text-slate-600 text-[10px] pt-1">
                          <span className="font-mono font-semibold text-slate-800">{ver.version}</span>
                          <span className="text-slate-400 truncate max-w-[120px]">{ver.notes || 'Uploaded'}</span>
                          <span>{new Date(ver.uploadedAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => success(`Downloading verified file: ${doc.title}`)}
                      className="flex-1 py-2 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-2 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-xl transition"
                      title="Delete Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Upload Document Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 flex items-center justify-center">
            <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm" onClick={() => setUploadModalOpen(false)} />
            <div className="relative bg-white rounded-2xl max-w-md w-full p-6 text-left shadow-2xl border border-slate-100 space-y-4 z-10 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-navy-950 text-sm">Upload Project Document</h3>
                <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Document Title *</label>
                  <input
                    type="text"
                    required
                    placeholder=""
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Document Category</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none bg-white font-medium"
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value as any)}
                  >
                    <option value="DRAWING">Engineering / Structural Drawing</option>
                    <option value="BOQ">Bill of Quantities (BOQ)</option>
                    <option value="AGREEMENT">Contract & Agreement</option>
                    <option value="SPECIFICATION">Material Specification</option>
                    <option value="SITE_REPORT">Site Inspection Report</option>
                    <option value="HANDOVER">Handover Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Revision Notes</label>
                  <input
                    type="text"
                    placeholder=""
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none"
                    value={docNotes}
                    onChange={(e) => setDocNotes(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-navy-950 text-gold-400 font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload & Archive</span>
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
