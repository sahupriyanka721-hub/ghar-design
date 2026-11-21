import fs from 'fs';

const filePath = 'C:/Users/HP/.gemini/antigravity/scratch/ghar-design/apps/web/src/pages/admin/AdminArchitects.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The block to remove
const bankSectionSnippet = `                {/* 6. Bank Details & Cancelled Cheque */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="font-bold text-navy-950 flex items-center justify-between text-xs uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-700" />
                      <span>Bank Account & Cancelled Cheque</span>
                    </div>
                    {selectedArchitect.bankDetails?.isChequeAccepted && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Cheque Accepted
                      </span>
                    )}
                  </div>
                  {selectedArchitect.bankDetails?.accountNumber ? (
                    <div className="space-y-2 text-slate-700">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>Bank Name: <strong className="text-navy-950">{selectedArchitect.bankDetails.bankName || 'Not specified'}</strong></div>
                        <div>Account Holder: <strong className="text-navy-950">{selectedArchitect.bankDetails.accountHolderName || selectedArchitect.name}</strong></div>
                        <div>Account Number: <strong className="text-navy-950 font-mono">•••• {selectedArchitect.bankDetails.accountNumber.slice(-4)}</strong></div>
                        <div>IFSC Code: <strong className="text-navy-950 font-mono">{selectedArchitect.bankDetails.ifscCode}</strong></div>
                        <div>Account Type: <strong className="text-navy-950">{selectedArchitect.bankDetails.accountType || 'CURRENT'}</strong></div>
                        <div>Branch / City: <strong className="text-navy-950">{selectedArchitect.bankDetails.branch || selectedArchitect.city || 'Main Branch'}</strong></div>
                      </div>
                      {/* Cancelled Cheque Display */}
                      <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                        <div className="text-[11px] text-slate-600">
                          Cancelled Cheque: <strong className="text-navy-950">{selectedArchitect.bankDetails.cancelledChequeFileName || 'Attached Cheque'}</strong>
                        </div>
                        {selectedArchitect.bankDetails.cancelledChequeUrl && selectedArchitect.bankDetails.cancelledChequeUrl !== '#' ? (
                          <a
                            href={selectedArchitect.bankDetails.cancelledChequeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition inline-flex items-center gap-1 shadow-2xs"
                          >
                            <span>View Cheque</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No cheque file attached</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic py-1">
                      Bank details not provided during registration.
                    </div>
                  )}
                </div>\n`;

// Remove all occurrences
while (content.includes(bankSectionSnippet)) {
  content = content.replace(bankSectionSnippet, '');
}

// Now insert it exactly once after:
//                   </div>
//                 </div>
// 
//                 {/* Current Admin Remarks if any */}
const targetAnchor = `                  </div>
                </div>

                {/* Current Admin Remarks if any */}`;

const replacementAnchor = `                  </div>
                </div>

${bankSectionSnippet}
                {/* Current Admin Remarks if any */}`;

content = content.replace(targetAnchor, replacementAnchor);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Cleaned and placed Bank section exactly once in AdminArchitects.tsx');
