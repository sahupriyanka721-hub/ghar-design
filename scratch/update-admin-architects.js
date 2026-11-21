const fs = require('fs');

const filePath = 'C:/Users/HP/.gemini/antigravity/scratch/ghar-design/apps/web/src/pages/admin/AdminArchitects.tsx';
let code = fs.readFileSync(filePath, 'utf8');

const isCRLF = code.includes('\r\n');
if (isCRLF) code = code.replace(/\r\n/g, '\n');

// 1. Add Download to lucide-react imports if missing
if (!code.includes('  Download,')) {
  code = code.replace('  FileCheck2,', '  FileCheck2,\n  Download,');
}

// 2. Add updateArchitectDocumentStatus to architectStore imports
if (!code.includes('updateArchitectDocumentStatus')) {
  code = code.replace('  updateArchitectStatus,', '  updateArchitectStatus,\n  updateArchitectDocumentStatus,');
}

// 3. Add state variables inside AdminArchitects component
const stateTarget = `  const [selectedArchitect, setSelectedArchitect] = useState<ArchitectAccount | null>(null);`;
const stateReplace = `  const [selectedArchitect, setSelectedArchitect] = useState<ArchitectAccount | null>(null);
  const [activeReviewDoc, setActiveReviewDoc] = useState<ArchitectKycDocument | null>(null);
  const [showDocRejectModal, setShowDocRejectModal] = useState<ArchitectKycDocument | null>(null);
  const [docRejectReason, setDocRejectReason] = useState('Document scan illegible / Details do not match registration');`;

if (code.includes(stateTarget)) {
  code = code.replace(stateTarget, stateReplace);
  console.log('State variables added!');
} else {
  console.log('stateTarget not found');
}

// 4. Add document handler functions before loadData
const handlersCode = `
  const handleDocumentApprove = (docId: string) => {
    if (!selectedArchitect) return;
    const updated = updateArchitectDocumentStatus(selectedArchitect.id, docId, 'VERIFIED');
    if (updated) {
      setSelectedArchitect({ ...updated });
      loadData();
      if (activeReviewDoc?.id === docId) {
        setActiveReviewDoc({ ...activeReviewDoc, status: 'VERIFIED' });
      }
      success('Document verified and approved successfully!');
    }
  };

  const handleDocumentReject = (docId: string, reason?: string) => {
    if (!selectedArchitect) return;
    const finalReason = reason || docRejectReason || 'Cancelled by admin';
    const updated = updateArchitectDocumentStatus(selectedArchitect.id, docId, 'REJECTED', finalReason);
    if (updated) {
      setSelectedArchitect({ ...updated });
      loadData();
      if (activeReviewDoc?.id === docId) {
        setActiveReviewDoc({ ...activeReviewDoc, status: 'REJECTED', rejectionReason: finalReason });
      }
      setShowDocRejectModal(null);
      success('Document marked as cancelled / rejected.');
    }
  };
`;

const loadDataTarget = `  const loadData = () => {`;
if (code.includes(loadDataTarget)) {
  code = code.replace(loadDataTarget, `${handlersCode}\n  const loadData = () => {`);
  console.log('Document handlers added!');
} else {
  console.log('loadDataTarget not found');
}

// 5. Replace KYC Document Section in AdminArchitects.tsx
const oldDocSection = `                  {/* Step 5: KYC Verification Documents */}
                  <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                    <div className="font-extrabold text-navy-950 text-sm font-display flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-sky-600" />
                        <span>Statutory KYC Verification Documents</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                        {selectedArchitect.documents?.length || 0} Documents Uploaded
                      </span>
                    </div>
                    {selectedArchitect.documents && selectedArchitect.documents.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedArchitect.documents.map((doc, idx) => (
                          <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-bold text-navy-950">{doc.title}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{doc.documentType} • {doc.fileSize || 'PDF Document'}</div>
                            </div>
                            {doc.fileUrl && doc.fileUrl !== '#' ? (
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition shadow-2xs"
                              >
                                <span>Inspect</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">File Pending</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">No statutory KYC documents attached.</p>
                    )}
                  </div>`;

const newDocSection = `                  {/* Step 5: KYC Verification Documents */}
                  <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                    <div className="font-extrabold text-navy-950 text-sm font-display flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-sky-600" />
                        <span>Statutory KYC Verification Documents</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                          {selectedArchitect.documents?.length || 0} Documents Attached
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-xs">
                          {selectedArchitect.documents?.filter((d) => d.status === 'VERIFIED').length || 0} Verified
                        </span>
                      </div>
                    </div>

                    {selectedArchitect.documents && selectedArchitect.documents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedArchitect.documents.map((doc, idx) => (
                          <div
                            key={idx}
                            className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200 space-y-3 transition shadow-2xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-bold text-navy-950 text-xs sm:text-sm">{doc.title}</div>
                                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                  {doc.documentType} • {doc.fileSize || 'PDF Document (2.4 MB)'}
                                </div>
                              </div>
                              {doc.status === 'VERIFIED' && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shrink-0">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Approved ✓</span>
                                </span>
                              )}
                              {doc.status === 'REJECTED' && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 shrink-0">
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  <span>Cancelled ✕</span>
                                </span>
                              )}
                              {(!doc.status || doc.status === 'PENDING') && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 shrink-0">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Pending Review</span>
                                </span>
                              )}
                            </div>

                            {doc.status === 'REJECTED' && doc.rejectionReason && (
                              <div className="text-[11px] text-rose-700 bg-rose-50/80 p-2 rounded-xl border border-rose-200 font-medium">
                                <strong>Rejection Reason:</strong> {doc.rejectionReason}
                              </div>
                            )}

                            {/* Action Buttons: Download/Inspect, Approval, Cancel */}
                            <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-200/60">
                              <button
                                type="button"
                                onClick={() => setActiveReviewDoc(doc)}
                                className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                                title="Download file and inspect verification credentials"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Check & Download</span>
                              </button>

                              <button
                                type="button"
                                disabled={doc.status === 'VERIFIED'}
                                onClick={() => handleDocumentApprove(doc.id)}
                                className={\`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition shadow-2xs \${
                                  doc.status === 'VERIFIED'
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 cursor-default opacity-80'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-98'
                                }\`}
                                title="Approve this statutory document"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{doc.status === 'VERIFIED' ? 'Approved' : 'Approve'}</span>
                              </button>

                              <button
                                type="button"
                                disabled={doc.status === 'REJECTED'}
                                onClick={() => {
                                  setShowDocRejectModal(doc);
                                  setDocRejectReason('Document copy illegible / COA number verification failed');
                                }}
                                className={\`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition shadow-2xs \${
                                  doc.status === 'REJECTED'
                                    ? 'bg-rose-100 text-rose-900 border border-rose-300 cursor-default opacity-80'
                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer active:scale-98'
                                }\`}
                                title="Cancel or reject this document"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>{doc.status === 'REJECTED' ? 'Cancelled' : 'Cancel / Reject'}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">No statutory KYC documents attached.</p>
                    )}
                  </div>`;

if (code.includes(oldDocSection)) {
  code = code.replace(oldDocSection, newDocSection);
  console.log('KYC Document section successfully updated!');
} else {
  console.log('oldDocSection not found directly');
}

// 6. Add Document Review Modal & Document Reject Prompt Modal before ending of component
const modalCode = `
      {/* ---------------- MODAL: DOCUMENT REVIEW & INSPECTION (WITH APPROVE / CANCEL) ---------------- */}
      {activeReviewDoc && selectedArchitect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-navy-950 text-base">{activeReviewDoc.title}</h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {activeReviewDoc.documentType} • Applicant: <strong className="text-slate-800">{selectedArchitect.name}</strong> ({selectedArchitect.id})
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveReviewDoc(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Visual Preview Card */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-center overflow-hidden">
              {activeReviewDoc.fileUrl ? (
                <img
                  src={activeReviewDoc.fileUrl}
                  alt={activeReviewDoc.title}
                  className="max-h-[380px] mx-auto rounded-xl shadow-xs border border-slate-200 object-contain bg-white"
                />
              ) : (
                <div className="py-12 text-slate-400 text-xs">No visual document preview available.</div>
              )}
            </div>

            {/* File Info Bar & Download */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-sky-50/70 rounded-2xl border border-sky-200 text-xs">
              <div>
                <div className="font-bold text-navy-950">Audit Verification Status:</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {activeReviewDoc.status === 'VERIFIED' && (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Document Verified &amp; Approved</span>
                    </span>
                  )}
                  {activeReviewDoc.status === 'REJECTED' && (
                    <span className="text-rose-700 font-bold flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Cancelled / Rejected: {activeReviewDoc.rejectionReason}</span>
                    </span>
                  )}
                  {(!activeReviewDoc.status || activeReviewDoc.status === 'PENDING') && (
                    <span className="text-amber-700 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Pending Super Admin Review</span>
                    </span>
                  )}
                </div>
              </div>

              {activeReviewDoc.fileUrl && (
                <a
                  href={activeReviewDoc.fileUrl}
                  download={\`\${selectedArchitect.name.replace(/\\s+/g, '_')}_\${activeReviewDoc.documentType}.svg\`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-navy-950 font-bold rounded-xl border border-slate-300 shadow-2xs inline-flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-sky-600" />
                  <span>Download File to Device</span>
                </a>
              )}
            </div>

            {/* Modal Bottom Actions: Approval & Cancel/Reject */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveReviewDoc(null)}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
              >
                Close Preview
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = activeReviewDoc;
                    setActiveReviewDoc(null);
                    setShowDocRejectModal(target);
                    setDocRejectReason('Document copy illegible / COA number verification failed');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Cancel / Reject Document (रद्द करें)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleDocumentApprove(activeReviewDoc.id);
                    setActiveReviewDoc(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs inline-flex items-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Approve Document (अनुमोदन करें)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODAL: DOCUMENT REJECT / CANCEL PROMPT ---------------- */}
      {showDocRejectModal && selectedArchitect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-navy-950 text-sm">Cancel / Reject Document</h4>
                <div className="text-[11px] text-slate-500">{showDocRejectModal.title}</div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Specify Reason for Cancellation / Rejection:
              </label>
              <textarea
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-rose-500"
                value={docRejectReason}
                onChange={(e) => setDocRejectReason(e.target.value)}
                placeholder="e.g. Document image is blurry / Council of Architecture number not matching official records"
              />
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {[
                  'Scan copy blurry',
                  'COA number mismatch',
                  'Expired registration',
                  'Name spelling error',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setDocRejectReason(chip)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDocRejectModal(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => handleDocumentReject(showDocRejectModal.id, docRejectReason)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition cursor-pointer shadow-sm"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
`;

const lastDivTarget = `    </div>
  );
};`;

if (code.includes(lastDivTarget)) {
  code = code.replace(lastDivTarget, `${modalCode}\n    </div>\n  );\n};`);
  console.log('Modals added before end of AdminArchitects component!');
} else {
  console.log('lastDivTarget not found directly');
}

if (isCRLF) code = code.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, code, 'utf8');
console.log('AdminArchitects.tsx successfully updated!');
