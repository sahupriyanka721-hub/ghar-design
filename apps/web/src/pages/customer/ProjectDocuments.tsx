import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { getPlatformRequests, PlatformProjectRequest } from '../../data/customerStore.js';
import { getExecutionProjects } from '../../data/projectExecutionStore.js';
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
  FileCheck,
  Compass,
} from 'lucide-react';

export interface CustomerStoredDoc {
  id: string;
  projectId: string;
  documentCode: string;
  title: string;
  category: 'AGREEMENT' | 'ARCHITECTURAL' | 'STRUCTURAL' | 'INTERIOR' | 'BOQ' | 'SITE_REPORT' | 'HANDOVER' | 'SPECIFICATION';
  fileSize: string;
  currentVersion: string;
  uploadedAt: string;
  versions: { version: string; uploadedAt: string; notes?: string }[];
}

const DEFAULT_PROJECT_DOCS: Omit<CustomerStoredDoc, 'id' | 'projectId'>[] = [
  {
    documentCode: 'DOC-AGR-001',
    title: 'Turnkey Construction Contract Agreement & Escrow Terms',
    category: 'AGREEMENT',
    fileSize: '2.4 MB',
    currentVersion: 'v1.0',
    uploadedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    versions: [
      { version: 'v1.0', uploadedAt: new Date(Date.now() - 86400000 * 12).toISOString(), notes: 'Digitally signed contract with Milestone Escrow schedule' },
    ],
  },
  {
    documentCode: 'DOC-ARC-102',
    title: 'Sanctioned Master Architectural Floor Plan & Elevation Blueprints',
    category: 'ARCHITECTURAL',
    fileSize: '8.2 MB',
    currentVersion: 'v1.2',
    uploadedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    versions: [
      { version: 'v1.0', uploadedAt: new Date(Date.now() - 86400000 * 10).toISOString(), notes: 'Initial 2D layout draft' },
      { version: 'v1.2', uploadedAt: new Date(Date.now() - 86400000 * 8).toISOString(), notes: 'Municipal setback clearance and room dimension approval' },
    ],
  },
  {
    documentCode: 'DOC-STR-204',
    title: 'IS 456 Structural Reinforcement Schedule & Column Grid',
    category: 'STRUCTURAL',
    fileSize: '4.6 MB',
    currentVersion: 'v1.0',
    uploadedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    versions: [
      { version: 'v1.0', uploadedAt: new Date(Date.now() - 86400000 * 7).toISOString(), notes: 'Chartered structural engineer vetted RCC drawings for Fe550D rebar' },
    ],
  },
  {
    documentCode: 'DOC-BOQ-301',
    title: 'Approved Detailed Bill of Quantities (BOQ) & Item Rate Schedule',
    category: 'BOQ',
    fileSize: '3.1 MB',
    currentVersion: 'v2.0',
    uploadedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    versions: [
      { version: 'v1.0', uploadedAt: new Date(Date.now() - 86400000 * 9).toISOString(), notes: 'Initial estimated material quantities' },
      { version: 'v2.0', uploadedAt: new Date(Date.now() - 86400000 * 6).toISOString(), notes: 'Locked price item rates with 18% GST breakdown' },
    ],
  },
  {
    documentCode: 'DOC-GEO-401',
    title: 'Soil Investigation & Safe Bearing Capacity (SBC) Test Report',
    category: 'STRUCTURAL',
    fileSize: '5.8 MB',
    currentVersion: 'v1.0',
    uploadedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    versions: [
      { version: 'v1.0', uploadedAt: new Date(Date.now() - 86400000 * 14).toISOString(), notes: 'Core drilling bore log test results (SBC 190 kN/m2)' },
    ],
  },
  {
    documentCode: 'DOC-INT-502',
    title: 'Interior Finishes, Lighting & Material Palette Schedule',
    category: 'INTERIOR',
    fileSize: '6.4 MB',
    currentVersion: 'v1.1',
    uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    versions: [
      { version: 'v1.1', uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(), notes: 'Italian marble, false ceiling lighting, and veneer mood boards' },
    ],
  },
  {
    documentCode: 'DOC-REP-601',
    title: 'Site Excavation & Foundation Quality Inspection Report',
    category: 'SITE_REPORT',
    fileSize: '3.5 MB',
    currentVersion: 'v1.0',
    uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    versions: [
      { version: 'v1.0', uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(), notes: 'Foundation trench depth verification and PCC bed test' },
    ],
  },
  {
    documentCode: 'DOC-WAR-701',
    title: '10-Year RCC Superstructure Structural Warranty Certificate',
    category: 'HANDOVER',
    fileSize: '1.8 MB',
    currentVersion: 'v1.0',
    uploadedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    versions: [
      { version: 'v1.0', uploadedAt: new Date(Date.now() - 86400000 * 1).toISOString(), notes: 'Certified warranty deed issued by BuildGhar Tech' },
    ],
  },
];

export const ProjectDocuments: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [projectsList, setProjectsList] = useState<{ id: string; title: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [documents, setDocuments] = useState<CustomerStoredDoc[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      const upper = cat.toUpperCase();
      if (['AGREEMENT', 'ARCHITECTURAL', 'STRUCTURAL', 'INTERIOR', 'BOQ', 'SITE_REPORT', 'HANDOVER'].includes(upper)) {
        setSelectedCategory(upper);
      } else if (upper === 'DRAWING' || upper === 'ARCHITECTURAL') {
        setSelectedCategory('ARCHITECTURAL');
      } else if (upper === 'INTERIOR') {
        setSelectedCategory('INTERIOR');
      }
    }
  }, [searchParams]);

  // Upload Document Modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<CustomerStoredDoc['category']>('ARCHITECTURAL');
  const [docNotes, setDocNotes] = useState('');

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

  // Load documents for selected project
  useEffect(() => {
    if (!selectedProjectId) return;
    try {
      const stored = localStorage.getItem(`customer_project_docs_${selectedProjectId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDocuments(parsed);
          return;
        }
      }
    } catch {}

    // Seed default realistic project documents
    const seeded: CustomerStoredDoc[] = DEFAULT_PROJECT_DOCS.map((d, idx) => ({
      ...d,
      id: `doc-${selectedProjectId}-${idx + 1}`,
      projectId: selectedProjectId,
    }));
    setDocuments(seeded);
    try {
      localStorage.setItem(`customer_project_docs_${selectedProjectId}`, JSON.stringify(seeded));
    } catch {}
  }, [selectedProjectId]);

  const categories = [
    { id: 'ALL', label: 'All Documents' },
    { id: 'AGREEMENT', label: '7.4 Agreements' },
    { id: 'ARCHITECTURAL', label: '7.1 Architectural' },
    { id: 'STRUCTURAL', label: '7.1 Structural RCC' },
    { id: 'INTERIOR', label: '7.2 Interior Designs' },
    { id: 'BOQ', label: '7.4 BOQ & Rates' },
    { id: 'SITE_REPORT', label: '3.11 Site Reports' },
    { id: 'HANDOVER', label: '3.12 Handover & Warranty' },
  ];

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
    if (selectedProjectId) {
      localStorage.setItem(`customer_project_docs_${selectedProjectId}`, JSON.stringify(updated));
    }
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

  const downloadDoc = (doc: CustomerStoredDoc) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      success(`Downloading ${doc.title} (${doc.currentVersion})...`);
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>${doc.title} - ${doc.documentCode}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #0f172a; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 25px; }
            .title { font-size: 20px; font-weight: 800; color: #0a1128; }
            .badge { background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: bold; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
            .label { color: #64748b; font-weight: 600; }
            .val { font-weight: 700; }
            .footer { border-top: 1px dashed #cbd5e1; padding-top: 15px; font-size: 11px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">BUILDGHAR CERTIFIED PROJECT DOCUMENT</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Verified Vault Document &bull; ${doc.category}</div>
            </div>
            <div style="text-align: right;">
              <span class="badge">VERSION ${doc.currentVersion}</span>
              <div style="font-family: monospace; font-size: 13px; font-weight: bold; margin-top: 6px;">${doc.documentCode}</div>
            </div>
          </div>
          <div class="box">
            <div class="row"><span class="label">Document Title:</span><span class="val">${doc.title}</span></div>
            <div class="row"><span class="label">Category:</span><span class="val">${doc.category}</span></div>
            <div class="row"><span class="label">File Size:</span><span class="val">${doc.fileSize}</span></div>
            <div class="row"><span class="label">Archive Date:</span><span class="val">${new Date(doc.uploadedAt).toLocaleString()}</span></div>
          </div>
          <div class="box">
            <div style="font-size: 12px; font-weight: bold; margin-bottom: 8px; color: #334155;">REVISION HISTORY AUDIT</div>
            ${(doc.versions || [])
              .map(
                (v) => `
              <div style="display: flex; justify-content: space-between; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 6px; margin-top: 6px;">
                <span><strong>${v.version}</strong>: ${v.notes || 'Document verified'}</span>
                <span style="color: #64748b;">${new Date(v.uploadedAt).toLocaleDateString()}</span>
              </div>
            `
              )
              .join('')}
          </div>
          <div class="footer">
            BuildGhar Technologies Pvt Ltd &bull; 100% Quality & Compliance Guarantee &bull; support@buildghar.in
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="space-y-6 text-xs font-sans">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gold-600 font-bold uppercase tracking-wider text-[11px] mb-1">
            <FolderOpen className="w-4 h-4" />
            <span>Section 7.4 & 3.11 &bull; Secure Project Vault & Blueprint Archive</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
            Project Documents, BOQs & Sanctioned Blueprints
          </h1>
          <p className="text-slate-500 mt-1">
            Access certified engineering drawings, structural calculations, signed contracts, and material test reports with revision audit trails.
          </p>
        </div>

        <button
          onClick={() => setUploadModalOpen(true)}
          className="px-4 py-2.5 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Project Switcher Bar & Category Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">Select Project:</span>
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

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition ${
                selectedCategory === cat.id
                  ? 'bg-navy-950 text-gold-400 shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
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
                      Category: <strong className="text-slate-700">{doc.category}</strong> &bull; Size: {doc.fileSize}
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
                  onClick={() => downloadDoc(doc)}
                  className="flex-1 py-2 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download / Print</span>
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
                    placeholder="e.g. Sanctioned Floor Plan v1.3"
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
                    <option value="AGREEMENT">7.4 Contract & Agreement</option>
                    <option value="ARCHITECTURAL">7.1 Architectural 2D/3D Drawing</option>
                    <option value="STRUCTURAL">7.1 Structural RCC Drawing / Schedule</option>
                    <option value="INTERIOR">7.2 Interior Design / Material Palette</option>
                    <option value="BOQ">7.4 Bill of Quantities (BOQ) & Rate Schedule</option>
                    <option value="SITE_REPORT">3.11 Site Inspection & Test Report</option>
                    <option value="HANDOVER">3.12 Handover & Warranty Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Revision Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Approved setback modifications"
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
