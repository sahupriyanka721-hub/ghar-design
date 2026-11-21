pay_path = r"C:\Users\HP\.gemini\antigravity\scratch\ghar-design\apps\web\src\pages\admin\AdminPayments.tsx"
with open(pay_path, "r", encoding="utf-8") as f:
    txt = f.read()

# 1. Add ArrowRight to imports
if "ArrowRight," not in txt:
    txt = txt.replace("ArrowLeft,\n  FileText,", "ArrowLeft,\n  ArrowRight,\n  FileText,")

# 2. Add paymentStep state
if "const [paymentStep, setPaymentStep]" not in txt:
    txt = txt.replace(
        "const [isAddModalOpen, setIsAddModalOpen] = useState(false);",
        "const [isAddModalOpen, setIsAddModalOpen] = useState(false);\n  const [paymentStep, setPaymentStep] = useState<number>(1);"
    )

old_start = "{/* Record Manual Payment Full-Screen Modal */}\n      {isAddModalOpen && ("
old_end = "\n    </div>\n  );\n};"

start_idx = txt.find(old_start)
end_idx = txt.rfind(old_end)

if start_idx == -1 or end_idx == -1:
    print(f"Could not find markers: start={start_idx}, end={end_idx}")
else:
    new_modal = """{/* Record Manual Payment Full-Screen Modal (Stepper Wizard) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setPaymentStep(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back / Cancel</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Record Manual Payment & Escrow Receipt
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Step {paymentStep} of 3 • Escrow Banking Audit Desk
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setPaymentStep(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1100px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Stepper Header */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-blue-200/80 shadow-sm">
              <div className="flex items-center justify-between max-w-xl mx-auto">
                {[
                  { step: 1, title: 'Payer & Purpose', icon: User },
                  { step: 2, title: 'Amount & Banking UTR', icon: CreditCard },
                  { step: 3, title: 'Verify & Issue Receipt', icon: CheckCircle2 },
                ].map((item, idx, arr) => (
                  <div key={item.step} className="flex items-center flex-1 last:flex-none">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.step < paymentStep) setPaymentStep(item.step);
                      }}
                      className="flex flex-col items-center gap-1 group text-center cursor-pointer"
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition ${
                          paymentStep === item.step
                            ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100'
                            : paymentStep > item.step
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {paymentStep > item.step ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <item.icon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-bold mt-1 transition ${
                          paymentStep === item.step
                            ? 'text-blue-900'
                            : paymentStep > item.step
                            ? 'text-emerald-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {item.title}
                      </span>
                    </button>
                    {idx < arr.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-3 mb-5 transition ${
                          paymentStep > item.step ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stepper Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
              <form onSubmit={handleRecordPayment}>
                {/* STEP 1: PAYER & PURPOSE */}
                {paymentStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 1 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Customer Identification & Transaction Purpose
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Identify customer depositing funds and designate transaction purpose for audit trail.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <User className="w-4 h-4 text-blue-600" />
                          <span>Customer Full Name</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Ramesh Kumar"
                          value={newPayment.customerName}
                          onChange={(e) => setNewPayment({ ...newPayment, customerName: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Customer Mobile Number</label>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="10-digit mobile"
                          value={newPayment.phone}
                          onChange={(e) => setNewPayment({ ...newPayment, phone: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Official Purpose / Account</label>
                        <select
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          value={newPayment.purpose}
                          onChange={(e: any) => setNewPayment({ ...newPayment, purpose: e.target.value })}
                        >
                          <option value="REQUEST_FEE">Quotation Request Fee (₹499)</option>
                          <option value="BOOKING_ADVANCE">Service Booking Milestone / Advance</option>
                          <option value="MATERIAL_PURCHASE">Wholesale Building Material Purchase</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: AMOUNT & BANKING UTR */}
                {paymentStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 2 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Receipt Value & Corporate Banking Reference
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Enter amount collected and bank reference / IMPS UTR number for account reconciliation.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-blue-600" />
                          <span>Amount Received (₹)</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-3 text-slate-400 font-bold text-base">₹</span>
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="e.g. 499"
                            value={newPayment.amountRupees}
                            onChange={(e) => setNewPayment({ ...newPayment, amountRupees: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl font-mono text-base font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Bank Reference / UTR Number</label>
                        <input
                          type="text"
                          placeholder="e.g. UTR29384729"
                          value={newPayment.referenceId}
                          onChange={(e) => setNewPayment({ ...newPayment, referenceId: e.target.value.toUpperCase() })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono uppercase text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="font-bold text-slate-800 text-sm">Associated Project / Description Notes</label>
                        <input
                          type="text"
                          placeholder="e.g. Turnkey Civil Construction Package - Sector 45"
                          value={newPayment.notes}
                          onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: VERIFY & ISSUE RECEIPT */}
                {paymentStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 3 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Audit Confirmation & Escrow Receipt Issuance
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Review recorded escrow receipt details and broadcast platform ledger update.
                      </p>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Customer</span>
                        <p className="text-sm font-bold text-navy-950 mt-0.5">{newPayment.customerName || 'Not Entered'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Transaction Purpose</span>
                        <p className="text-sm font-bold text-blue-900 mt-0.5">{newPayment.purpose}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Bank UTR Reference</span>
                        <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">{newPayment.referenceId || 'Manual Admin Cash/Cheque'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Project Note</span>
                        <p className="text-xs font-semibold text-slate-700 mt-0.5">{newPayment.notes || 'Recorded by Admin Desk'}</p>
                      </div>
                    </div>

                    <div className="p-5 bg-navy-950 text-white rounded-2xl flex items-center justify-between shadow-lg">
                      <div>
                        <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">Total Recorded Escrow Value</span>
                        <span className="text-xs text-slate-300">Method: Bank Transfer / RTGS / Admin Receipt</span>
                      </div>
                      <strong className="text-2xl font-mono font-black text-amber-400">
                        {formatINR(Number(newPayment.amountRupees || 0) * 100)}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Navigation Footer */}
                <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-200 mt-6">
                  {paymentStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setPaymentStep(paymentStep - 1)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition flex items-center gap-2 text-xs cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Previous Step</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-100 transition text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}

                  <div className="text-xs text-slate-400 font-mono hidden sm:block">
                    Step {paymentStep} of 3
                  </div>

                  {paymentStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (paymentStep === 1) {
                          if (!newPayment.customerName.trim()) {
                            error('Please enter the customer name');
                            return;
                          }
                        } else if (paymentStep === 2) {
                          const amt = parseFloat(newPayment.amountRupees);
                          if (isNaN(amt) || amt <= 0) {
                            error('Please enter a valid amount');
                            return;
                          }
                        }
                        setPaymentStep(paymentStep + 1);
                      }}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <span>Proceed to Step {paymentStep + 1}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Record Payment & Issue Receipt</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};"""

    txt = txt[:start_idx] + new_modal + txt[end_idx + len(old_end):]
    with open(pay_path, "w", encoding="utf-8") as f:
        f.write(txt)
    print("Successfully updated AdminPayments.tsx with Stepper Wizard!")
