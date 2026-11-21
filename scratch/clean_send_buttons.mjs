import fs from 'fs';
import path from 'path';

const projectRoot = 'C:/Users/HP/.gemini/antigravity/scratch/ghar-design';
const file = path.join(projectRoot, 'apps/web/src/pages/admin/AdminArchitects.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Remove quickSendArch state
content = content.replace(
  "  const [quickSendArch, setQuickSendArch] = useState<ArchitectAccount | null>(null);",
  ""
);

// 2. Remove handleOpenQuickSend function
const quickSendFuncTarget = `  // ---------------- Send to Customer Handler ----------------
  const handleOpenQuickSend = (arch: ArchitectAccount) => {
    const defaultCust = customers[0];
    const discountCode = arch.specialDiscount?.enabled ? arch.specialDiscount.code : 'BGARCH10';
    const discountApplied = arch.specialDiscount?.enabled
      ? (arch.specialDiscount.type === 'PERCENTAGE' ? \`\${arch.specialDiscount.amount}% OFF\` : \`₹\${arch.specialDiscount.amount} OFF\`)
      : '10% Platform Discount';

    setSendForm({
      selectedCustomerId: defaultCust?.id || '',
      discountCode,
      discountApplied,
      customNote: \`Our Central Engineering Desk specifically recommends Architect \${arch.name} (\${arch.firmName}) for your architectural blueprints, structural design, and 3D elevation.\`,
      channel: 'ALL',
    });
    setQuickSendArch(arch);
  };`;

content = content.replace(quickSendFuncTarget, "");

// 3. Remove [Send] button from table row
const tableSendButton = `                          {/* Send to Customer CTA */}
                          <button
                            onClick={() => handleOpenQuickSend(arch)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                            title="Dispatch recommendation to registered homeowner"
                          >
                            <SendHorizontal className="w-3.5 h-3.5" />
                            <span>Send</span>
                            {sharesCount > 0 && (
                              <span className="px-1 py-0.2 rounded-full bg-white/20 text-white text-[9px] font-mono">
                                {sharesCount}
                              </span>
                            )}
                          </button>`;

content = content.replace(tableSendButton, "");

// 4. Remove [Send to Customer] button from modal top header
const headerSendButton = `                <button
                  onClick={() => setActiveDossierTab('SEND_CUSTOMER')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <SendHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send to Customer</span>
                </button>`;

content = content.replace(headerSendButton, "");

// 5. Remove quickSendArch popup modal
const quickSendModalTarget = `      {/* ---------------- QUICK STANDALONE SEND MODAL (Direct from Table Row) ---------------- */}
      {quickSendArch && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-navy-950 flex items-center gap-2">
                  <SendHorizontal className="w-4 h-4 text-emerald-600" />
                  <span>Recommend Architect to Homeowner</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  {quickSendArch.name} ({quickSendArch.firmName}) • {quickSendArch.id}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setQuickSendArch(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Select Registered Customer:</label>
                <select
                  value={sendForm.selectedCustomerId}
                  onChange={(e) => setSendForm({ ...sendForm, selectedCustomerId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="">-- Choose Homeowner --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) • {c.city} [{c.id}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Coupon Code</label>
                  <input
                    type="text"
                    value={sendForm.discountCode}
                    onChange={(e) => setSendForm({ ...sendForm, discountCode: e.target.value.toUpperCase() })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-amber-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discount Tag</label>
                  <input
                    type="text"
                    value={sendForm.discountApplied}
                    onChange={(e) => setSendForm({ ...sendForm, discountApplied: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Recommendation Note</label>
                <textarea
                  rows={2}
                  value={sendForm.customNote}
                  onChange={(e) => setSendForm({ ...sendForm, customNote: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Delivery Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ALL', 'WHATSAPP', 'PORTAL'] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setSendForm({ ...sendForm, channel: ch })}
                      className={\`p-1.5 rounded-lg font-bold transition text-center cursor-pointer \${
                        sendForm.channel === ch ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                      }\`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuickSendArch(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDispatchToCustomer(quickSendArch)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <SendHorizontal className="w-3.5 h-3.5" />
                <span>Dispatch Recommendation</span>
              </button>
            </div>
          </div>
        </div>
      )}`;

content = content.replace(quickSendModalTarget, "");

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully cleaned up extra Send and Send to Customer buttons!');
