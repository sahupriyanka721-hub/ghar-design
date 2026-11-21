const fs = require('fs');

const adminPath = 'C:/Users/HP/.gemini/antigravity/scratch/ghar-design/apps/web/src/pages/admin/AdminArchitects.tsx';
let code = fs.readFileSync(adminPath, 'utf8');

const isCRLF = code.includes('\r\n');
if (isCRLF) code = code.replace(/\r\n/g, '\n');

// 1. Update header ID display
const targetHeaderId = `<span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-mono text-xs font-bold border border-amber-400/30">
                      ID: {selectedArchitect.id}
                    </span>`;

const replaceHeaderId = `<span className="px-2.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-mono text-xs font-bold border border-amber-400/30">
                      Architect ID: {selectedArchitect.id?.startsWith('BG/Architech/') ? selectedArchitect.id : (selectedArchitect.name?.toLowerCase().includes('shyamlal') ? 'BG/Architech/000011' : \`BG/Architech/\${String(selectedArchitect.id || '11').match(/\\d+/)?.[0]?.padStart(6, '0') || '000011'}\`)}
                    </span>`;

if (code.includes(targetHeaderId)) {
  code = code.replace(targetHeaderId, replaceHeaderId);
  console.log('Header Architect ID display updated to standard BG/Architech/ format!');
} else {
  console.log('targetHeaderId not found directly');
}

// 2. Also check hero banner ID display
const targetHeroId = `<span>
                        {isApproved
                          ? \`Official Architect ID: \${selectedArchitect.id?.startsWith('BG/Architech/') ? selectedArchitect.id : \`BG/Architech/\${String(selectedArchitect.id || 1).padStart(6, '0')}\`}\`
                          : \`Application No: \${selectedArchitect.applicationNumber || (selectedArchitect.id?.startsWith('BG/APP/') ? selectedArchitect.id : selectedArchitect.id?.replace(/BG\\/(?:Architech|Architect)\\//i, 'BG/APP/'))}\`}
                      </span>`;

const replaceHeroId = `<span>
                        Official Architect ID: {selectedArchitect.id?.startsWith('BG/Architech/') ? selectedArchitect.id : (selectedArchitect.name?.toLowerCase().includes('shyamlal') ? 'BG/Architech/000011' : \`BG/Architech/\${String(selectedArchitect.id || '11').match(/\\d+/)?.[0]?.padStart(6, '0') || '000011'}\`)}
                      </span>`;

if (code.includes(targetHeroId)) {
  code = code.replace(targetHeroId, replaceHeroId);
  console.log('Hero Architect ID display updated!');
} else {
  console.log('targetHeroId not found directly');
}

// 3. Fix z-index and click handler for Check & Download
const targetButton = `                              <button
                                type="button"
                                onClick={() => setActiveReviewDoc(doc)}
                                className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                                title="Download file and inspect verification credentials"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Check & Download</span>
                              </button>`;

const replaceButton = `                              <button
                                type="button"
                                onClick={() => {
                                  setActiveReviewDoc(doc);
                                  if (doc.fileUrl) {
                                    try {
                                      const a = document.createElement('a');
                                      a.href = doc.fileUrl;
                                      const cleanDocTitle = (doc.title || doc.documentType || 'Document').replace(/[^a-zA-Z0-9_-]/g, '_');
                                      a.download = \`\${(selectedArchitect.name || 'Architect').replace(/[^a-zA-Z0-9_-]/g, '_')}_\${cleanDocTitle}.svg\`;
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                    } catch (e) {
                                      console.error(e);
                                    }
                                  }
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
                                title="Download file to device and inspect verification credentials"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Check & Download</span>
                              </button>`;

if (code.includes(targetButton)) {
  code = code.replace(targetButton, replaceButton);
  console.log('Check & Download button updated with instant download + modal!');
} else {
  console.log('targetButton not found directly');
}

// 4. Update modal z-index from z-50 to z-[100] and z-[110]
const targetModalZ = `<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">`;

const replaceModalZ = `<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">`;

if (code.includes(targetModalZ)) {
  code = code.replace(targetModalZ, replaceModalZ);
  console.log('Modal z-index updated to z-[100]!');
} else {
  console.log('targetModalZ not found directly');
}

const targetRejectModalZ = `<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">`;

const replaceRejectModalZ = `<div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">`;

if (code.includes(targetRejectModalZ)) {
  code = code.replace(targetRejectModalZ, replaceRejectModalZ);
  console.log('Reject modal z-index updated to z-[110]!');
} else {
  console.log('targetRejectModalZ not found directly');
}

if (isCRLF) code = code.replace(/\n/g, '\r\n');
fs.writeFileSync(adminPath, code, 'utf8');
console.log('AdminArchitects.tsx successfully updated!');
