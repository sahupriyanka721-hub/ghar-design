cust_path = r"C:\Users\HP\.gemini\antigravity\scratch\ghar-design\apps\web\src\pages\admin\AdminCustomers.tsx"
with open(cust_path, "r", encoding="utf-8") as f:
    txt = f.read()

# 1. Add Check, ArrowRight to lucide imports if not present
if "ArrowRight," not in txt:
    txt = txt.replace("UserPlus,\n  ArrowLeft,", "UserPlus,\n  ArrowLeft,\n  ArrowRight,\n  Check,")

# 2. Add addCustomerStep state
if "const [addCustomerStep, setAddCustomerStep]" not in txt:
    txt = txt.replace(
        "const [showAddModal, setShowAddModal] = useState(false);",
        "const [showAddModal, setShowAddModal] = useState(false);\n  const [addCustomerStep, setAddCustomerStep] = useState<number>(1);"
    )

# 3. Replace the inner form in showAddModal
old_modal_start = '{/* Manual Customer Creation Full-Screen View for Admin */}\n      {showAddModal && ('
old_modal_end = '\n    </div>\n  );\n};'

modal_idx = txt.find(old_modal_start)
if modal_idx == -1:
    print("Could not find old_modal_start!")
else:
    end_idx = txt.rfind(old_modal_end)
    print(f"Found modal from {modal_idx} to {end_idx}")

    new_modal = """{/* Manual Customer Creation Full-Screen View for Admin (Stepper Wizard) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setAddCustomerStep(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back to Customer Directory</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <UserPlus className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Add New Registered Customer
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Step {addCustomerStep} of 3 • Homeowner Registration Wizard
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setAddCustomerStep(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1100px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Stepper Progress Bar */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-blue-200/80 shadow-sm">
              <div className="flex items-center justify-between max-w-xl mx-auto">
                {[
                  { step: 1, title: 'Identity & Contact', icon: User },
                  { step: 2, title: 'Site Location', icon: MapPin },
                  { step: 3, title: 'Account Verification', icon: ShieldCheck },
                ].map((item, idx, arr) => (
                  <div key={item.step} className="flex items-center flex-1 last:flex-none">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.step < addCustomerStep) setAddCustomerStep(item.step);
                      }}
                      className="flex flex-col items-center gap-1 group text-center cursor-pointer"
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition ${
                          addCustomerStep === item.step
                            ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100'
                            : addCustomerStep > item.step
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {addCustomerStep > item.step ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <item.icon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-bold mt-1 transition ${
                          addCustomerStep === item.step
                            ? 'text-blue-900'
                            : addCustomerStep > item.step
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
                          addCustomerStep > item.step ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Card Content */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
              <form onSubmit={handleCreateCustomer}>
                {/* STEP 1: IDENTITY & CONTACT */}
                {addCustomerStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 1 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Customer Identity & Mobile Verification
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Enter primary homeowner identity for instant SMS alerts and quotation dispatches.
                      </p>
                    </div>

                    <div className="space-y-4 text-xs text-slate-700">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <User className="w-4 h-4 text-blue-600" />
                          <span>Customer Full Name</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Ramesh Chandra / Sunita Verma"
                          value={newCustForm.name}
                          onChange={(e) => setNewCustForm({ ...newCustForm, name: e.target.value })}
                          className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            <Phone className="w-4 h-4 text-blue-600" />
                            <span>Primary Mobile Number</span>
                            <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-xs">+91</span>
                            <input
                              type="tel"
                              required
                              maxLength={10}
                              placeholder="10-digit mobile number"
                              value={newCustForm.phone}
                              onChange={(e) => setNewCustForm({ ...newCustForm, phone: e.target.value })}
                              className="w-full pl-14 pr-4 py-3.5 text-xs bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                          </div>
                          <span className="text-[10px] text-slate-400">Used for customer OTP authentication & WhatsApp order status.</span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            <Mail className="w-4 h-4 text-blue-600" />
                            <span>Email Address (Optional)</span>
                          </label>
                          <input
                            type="email"
                            placeholder="e.g. ramesh.chandra@gmail.com"
                            value={newCustForm.email}
                            onChange={(e) => setNewCustForm({ ...newCustForm, email: e.target.value })}
                            className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                          <span className="text-[10px] text-slate-400">Receives official BOQ estimations, PDF invoices, and escrow receipts.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: SITE ADDRESS & GEO-LOCATION */}
                {addCustomerStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 2 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Plot / Site Address & Jurisdiction
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Specify exact site location where civil engineering, architectural design, or materials will be dispatched.
                      </p>
                    </div>

                    <div className="space-y-4 text-xs text-slate-700">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            <Building className="w-4 h-4 text-blue-600" />
                            <span>House / Plot / Survey No.</span>
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Plot No. 42 / Flat 301, Tower B"
                            value={newCustForm.housePlotNumber}
                            onChange={(e) => setNewCustForm({ ...newCustForm, housePlotNumber: e.target.value })}
                            className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span>Street / Locality / Sector</span>
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Sector 57, Golf Course Extension"
                            value={newCustForm.streetLocality}
                            onChange={(e) => setNewCustForm({ ...newCustForm, streetLocality: e.target.value })}
                            className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-sm">City / District <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Gurugram"
                            value={newCustForm.city}
                            onChange={(e) => setNewCustForm({ ...newCustForm, city: e.target.value })}
                            className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-sm">State <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Haryana"
                            value={newCustForm.state}
                            onChange={(e) => setNewCustForm({ ...newCustForm, state: e.target.value })}
                            className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-sm">PIN Code <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            placeholder="e.g. 122002"
                            value={newCustForm.pinCode}
                            onChange={(e) => setNewCustForm({ ...newCustForm, pinCode: e.target.value })}
                            className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: ACCOUNT VERIFICATION & FINAL REVIEW */}
                {addCustomerStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 3 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Verification Status & Account Activation
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Review homeowner credentials and select account privileges before creating live platform identity.
                      </p>
                    </div>

                    <div className="space-y-4 text-xs">
                      {/* Review Card */}
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Customer Full Name</span>
                          <p className="text-sm font-bold text-navy-950 mt-0.5">{newCustForm.name || 'Not Entered'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Mobile Number</span>
                          <p className="text-sm font-mono font-bold text-navy-950 mt-0.5">+91 {newCustForm.phone || '0000000000'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Official Email</span>
                          <p className="text-xs font-semibold text-slate-700 mt-0.5">{newCustForm.email || 'None (SMS Notifications only)'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Site Location</span>
                          <p className="text-xs font-semibold text-slate-700 mt-0.5">
                            {newCustForm.housePlotNumber}, {newCustForm.streetLocality}, {newCustForm.city}, {newCustForm.state} ({newCustForm.pinCode})
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="font-bold text-slate-800 text-sm block">
                          Initial Verification Level <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label
                            onClick={() => setNewCustForm({ ...newCustForm, status: 'VERIFIED' })}
                            className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                              newCustForm.status === 'VERIFIED'
                                ? 'bg-emerald-50 border-emerald-400 shadow-sm'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="radio"
                              name="custStatus"
                              checked={newCustForm.status === 'VERIFIED'}
                              onChange={() => {}}
                              className="mt-1"
                            />
                            <div>
                              <span className="font-bold text-navy-950 text-xs block">VERIFIED (Instant Full Access)</span>
                              <span className="text-[11px] text-slate-500">
                                Pre-authenticated homeowner. Allowed to book instant consultations and order cement/steel without OTP holds.
                              </span>
                            </div>
                          </label>

                          <label
                            onClick={() => setNewCustForm({ ...newCustForm, status: 'ACTIVE' })}
                            className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                              newCustForm.status === 'ACTIVE'
                                ? 'bg-blue-50 border-blue-400 shadow-sm'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="radio"
                              name="custStatus"
                              checked={newCustForm.status === 'ACTIVE'}
                              onChange={() => {}}
                              className="mt-1"
                            />
                            <div>
                              <span className="font-bold text-navy-950 text-xs block">ACTIVE (Standard Customer)</span>
                              <span className="text-[11px] text-slate-500">
                                Requires standard OTP on first inquiry submission. Can browse rates and calculate construction estimates.
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step Navigation Footer */}
                <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-200 mt-6">
                  {addCustomerStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setAddCustomerStep(addCustomerStep - 1)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition flex items-center gap-2 text-xs cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Previous Step</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-100 transition text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}

                  <div className="text-xs text-slate-400 font-mono hidden sm:block">
                    Step {addCustomerStep} of 3
                  </div>

                  {addCustomerStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (addCustomerStep === 1) {
                          if (!newCustForm.name.trim()) {
                            error('Please enter the customer full name');
                            return;
                          }
                          const clean = newCustForm.phone.replace(/\\D/g, '').slice(-10);
                          if (clean.length !== 10) {
                            error('Please enter a valid 10-digit mobile number');
                            return;
                          }
                        }
                        setAddCustomerStep(addCustomerStep + 1);
                      }}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <span>Proceed to Step {addCustomerStep + 1}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Complete & Create Customer</span>
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

    txt = txt[:modal_idx] + new_modal + txt[end_idx + len(old_modal_end):]
    with open(cust_path, "w", encoding="utf-8") as f:
        f.write(txt)
    print("Successfully updated AdminCustomers.tsx with Stepper Wizard!")
