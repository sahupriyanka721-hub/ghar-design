req_path = r"C:\Users\HP\.gemini\antigravity\scratch\ghar-design\apps\web\src\pages\admin\AdminRequests.tsx"
with open(req_path, "r", encoding="utf-8") as f:
    txt = f.read()

# 1. Add ArrowRight, Check to imports
if "ArrowRight," not in txt:
    txt = txt.replace("ArrowLeft, Building,", "ArrowLeft, ArrowRight, Check, Building,")

# 2. Add requestStep state
if "const [requestStep, setRequestStep]" not in txt:
    txt = txt.replace(
        "const [showAddModal, setShowAddModal] = useState(false);",
        "const [showAddModal, setShowAddModal] = useState(false);\n  const [requestStep, setRequestStep] = useState<number>(1);"
    )

old_start = "{/* Manual Request Creation Modal */}\n      {showAddModal && ("
old_end = "\n    </div>\n  );\n};"

start_idx = txt.find(old_start)
end_idx = txt.rfind(old_end)

if start_idx == -1 or end_idx == -1:
    print(f"Could not find markers: start={start_idx}, end={end_idx}")
else:
    new_modal = """{/* Manual Request Creation Modal (Stepper Wizard) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setRequestStep(1);
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
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Create Customer Quotation Request
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Step {requestStep} of 3 • Civil Planning & Quotation Intake Wizard
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setRequestStep(1);
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
                  { step: 1, title: 'Customer & Category', icon: User },
                  { step: 2, title: 'Property & Dimensions', icon: Building },
                  { step: 3, title: 'Scope & Budget', icon: Layers },
                ].map((item, idx, arr) => (
                  <div key={item.step} className="flex items-center flex-1 last:flex-none">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.step < requestStep) setRequestStep(item.step);
                      }}
                      className="flex flex-col items-center gap-1 group text-center cursor-pointer"
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition ${
                          requestStep === item.step
                            ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100'
                            : requestStep > item.step
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {requestStep > item.step ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <item.icon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-bold mt-1 transition ${
                          requestStep === item.step
                            ? 'text-blue-900'
                            : requestStep > item.step
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
                          requestStep > item.step ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stepper Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
              <form onSubmit={handleCreateRequest}>
                {/* STEP 1: CUSTOMER & CATEGORY */}
                {requestStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 1 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Client Identity & Primary Engineering Service
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Enter client contact and select core architectural or civil construction package.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <User className="w-4 h-4 text-blue-600" />
                          <span>Customer Full Name</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Ramesh Chandra"
                          value={newReq.customerName}
                          onChange={(e) => setNewReq({ ...newReq, customerName: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-blue-600" />
                          <span>Customer Mobile Number</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-xs">+91</span>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            placeholder="10-digit mobile"
                            value={newReq.customerPhone}
                            onChange={(e) => setNewReq({ ...newReq, customerPhone: e.target.value })}
                            className="w-full pl-14 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="font-bold text-slate-800 text-sm">Primary Service Category <span className="text-rose-500">*</span></label>
                        <select
                          value={newReq.categorySlug}
                          onChange={(e) => setNewReq({ ...newReq, categorySlug: e.target.value })}
                          className="w-full p-3.5 border border-slate-300 rounded-2xl font-bold text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs"
                        >
                          <option value="new-house-construction">Complete Turnkey New House Construction</option>
                          <option value="home-renovation">Whole Home Renovation & Remodeling</option>
                          <option value="house-map-planning">Architectural House Map & 3D Spatial Planning</option>
                          <option value="structural-engineering">Structural Engineering & RCC Drawings</option>
                          <option value="interior-designing">Luxury Interior Architecture & Styling</option>
                          <option value="complete-construction-package">Complete Construction & Material Supply Package</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: PROPERTY & DIMENSIONS */}
                {requestStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 2 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Property Typology & Site Geometry
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Specify building type, plot area dimensions, and site location.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Property Type <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Residential Villa, G+3 Stilt"
                          value={newReq.propertyType}
                          onChange={(e) => setNewReq({ ...newReq, propertyType: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Plot Area (Sq. Ft) <span className="text-rose-500">*</span></label>
                        <input
                          type="number"
                          min={100}
                          value={newReq.plotArea}
                          onChange={(e) => setNewReq({ ...newReq, plotArea: Number(e.target.value) })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span>City / District</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Gurugram"
                          value={newReq.city}
                          onChange={(e) => setNewReq({ ...newReq, city: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Locality / Sector</label>
                        <input
                          type="text"
                          placeholder="e.g. Sector 57 / DLF Phase 2"
                          value={newReq.locality}
                          onChange={(e) => setNewReq({ ...newReq, locality: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: SCOPE & BUDGET */}
                {requestStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 3 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Budget Range, Notes & Request Publishing
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Review customer scope and publish request to architects and contractor bidding desks.
                      </p>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-sm">Budget Range <span className="text-rose-500">*</span></label>
                          <select
                            value={newReq.budgetRange}
                            onChange={(e) => setNewReq({ ...newReq, budgetRange: e.target.value })}
                            className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          >
                            <option value="₹25 - ₹50 Lakhs">₹25 - ₹50 Lakhs</option>
                            <option value="₹50 Lakhs - ₹1 Crore">₹50 Lakhs - ₹1 Crore</option>
                            <option value="₹1 Crore - ₹2.5 Crores">₹1 Crore - ₹2.5 Crores</option>
                            <option value="Above ₹2.5 Crores">Above ₹2.5 Crores</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-sm">Initial Verification Status</label>
                          <select
                            value={newReq.status}
                            onChange={(e) => setNewReq({ ...newReq, status: e.target.value })}
                            className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          >
                            <option value="VERIFIED">VERIFIED (Technical Scope Approved & Open for Quotes)</option>
                            <option value="UNDER_REVIEW">UNDER REVIEW (Vetting Pending)</option>
                            <option value="SUBMITTED">SUBMITTED (Raw Homeowner Lead)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Scope Description / Engineering Notes</label>
                        <textarea
                          rows={4}
                          placeholder="e.g. Modern minimalist villa with basement, Vastu compliance, RCC raft foundation specs..."
                          value={newReq.description}
                          onChange={(e) => setNewReq({ ...newReq, description: e.target.value })}
                          className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      {/* Request Summary Preview */}
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Customer</span>
                          <p className="text-sm font-bold text-navy-950 mt-0.5">{newReq.customerName || 'Not Entered'} (+91 {newReq.customerPhone})</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Selected Service</span>
                          <p className="text-sm font-bold text-blue-900 mt-0.5">{newReq.categorySlug}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Site Footprint</span>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">{newReq.plotArea} Sq. Ft ({newReq.propertyType})</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Site Location</span>
                          <p className="text-xs font-semibold text-slate-700 mt-0.5">{newReq.locality ? `${newReq.locality}, ` : ''}{newReq.city}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Footer */}
                <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-200 mt-6">
                  {requestStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setRequestStep(requestStep - 1)}
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
                    Step {requestStep} of 3
                  </div>

                  {requestStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (requestStep === 1) {
                          if (!newReq.customerName.trim()) {
                            error('Please enter the customer name');
                            return;
                          }
                          const clean = newReq.customerPhone.replace(/\\D/g, '').slice(-10);
                          if (clean.length !== 10) {
                            error('Please enter a valid 10-digit mobile number');
                            return;
                          }
                        } else if (requestStep === 2) {
                          if (!newReq.city.trim()) {
                            error('Please enter the city');
                            return;
                          }
                        }
                        setRequestStep(requestStep + 1);
                      }}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <span>Proceed to Step {requestStep + 1}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Publish Quotation Request</span>
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
    with open(req_path, "w", encoding="utf-8") as f:
        f.write(txt)
    print("Successfully updated AdminRequests.tsx with Stepper Wizard!")
