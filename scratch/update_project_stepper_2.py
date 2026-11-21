prj_path = r"C:\Users\HP\.gemini\antigravity\scratch\ghar-design\apps\web\src\pages\admin\AdminProjects.tsx"
with open(prj_path, "r", encoding="utf-8") as f:
    txt = f.read()

# 1. Add ArrowRight to imports
if "ArrowRight," not in txt:
    txt = txt.replace("ArrowLeft,\n  Check,", "ArrowLeft,\n  ArrowRight,\n  Check,")

# 2. Add projectStep state
if "const [projectStep, setProjectStep]" not in txt:
    txt = txt.replace(
        "const [showCreateModal, setShowCreateModal] = useState(false);",
        "const [showCreateModal, setShowCreateModal] = useState(false);\n  const [projectStep, setProjectStep] = useState<number>(1);"
    )

old_start = "{/* MODAL: CREATE PROJECT */}\n      <AnimatePresence>\n        {showCreateModal && ("
old_end = "\n      </AnimatePresence>\n    </div>\n  );\n};"

start_idx = txt.find(old_start)
end_idx = txt.rfind(old_end)

if start_idx == -1 or end_idx == -1:
    print(f"Could not find markers: start={start_idx}, end={end_idx}")
else:
    new_modal = """{/* MODAL: CREATE PROJECT (Stepper Wizard) */}
      <AnimatePresence>
        {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-blue-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setProjectStep(1);
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
                  <Building className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Create New Construction Project
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Step {projectStep} of 3 • Civil Engineering Execution Project
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setProjectStep(1);
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
                  { step: 1, title: 'Project Typology', icon: Building },
                  { step: 2, title: 'Client & Location', icon: MapPin },
                  { step: 3, title: 'Budget & Launch', icon: DollarSign },
                ].map((item, idx, arr) => (
                  <div key={item.step} className="flex items-center flex-1 last:flex-none">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.step < projectStep) setProjectStep(item.step);
                      }}
                      className="flex flex-col items-center gap-1 group text-center cursor-pointer"
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition ${
                          projectStep === item.step
                            ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100'
                            : projectStep > item.step
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {projectStep > item.step ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <item.icon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-bold mt-1 transition ${
                          projectStep === item.step
                            ? 'text-blue-900'
                            : projectStep > item.step
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
                          projectStep > item.step ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stepper Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
              <form onSubmit={handleCreateProjectSubmit}>
                {/* STEP 1: TYPOLOGY */}
                {projectStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 1 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Project Name & Construction Typology
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Define project title, site identification, and building classification.
                      </p>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-blue-600" />
                          <span>Official Project Title</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Saxena Luxury Villa (Plot 48, DLF Phase 1)"
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="font-bold text-slate-800 text-sm block">
                          Building Typology <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { type: 'VILLA', label: 'Bespoke Villa', desc: 'Independent Luxury Residence' },
                            { type: 'FLOOR', label: 'Builder Floor', desc: 'Stilt + 4 Floors' },
                            { type: 'RENOVATION', label: 'Home Renovation', desc: 'Structural Modernization' },
                            { type: 'INTERIOR', label: 'Turnkey Interior', desc: 'Complete Spatial Fitout' },
                          ].map((t) => (
                            <button
                              key={t.type}
                              type="button"
                              onClick={() => setProjectType(t.type as any)}
                              className={`p-4 rounded-2xl border text-left transition ${
                                projectType === t.type
                                  ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-200'
                                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <span className="font-bold text-navy-950 text-xs block">{t.label}</span>
                              <span className="text-[10px] text-slate-500 mt-1 block">{t.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: CLIENT & LOCATION */}
                {projectStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 2 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Homeowner Client & Project Site Location
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Specify client contact and geographical site city for logistical matching.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-blue-600" />
                          <span>Homeowner Full Name</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Ramesh Chandra"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-blue-600" />
                          <span>Client Mobile Number</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-xs">+91</span>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            placeholder="10-digit mobile"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full pl-14 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span>Site City / District</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Gurugram / New Delhi / Noida"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: BUDGET & LAUNCH */}
                {projectStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 3 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Total Project Budget & Milestone Launch
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Set approved construction valuation. GharDesign will auto-generate 6 physical stage gates and escrow milestones.
                      </p>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-blue-600" />
                          <span>Estimated Construction Budget (₹)</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-3 text-slate-400 font-bold text-base">₹</span>
                          <input
                            type="number"
                            min={100000}
                            step={50000}
                            value={budgetRupees}
                            onChange={(e) => setBudgetRupees(Number(e.target.value))}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl font-mono text-base font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                        <p className="text-xs text-blue-800 font-semibold mt-1">
                          Formatted: {formatINR(budgetRupees * 100)}
                        </p>
                      </div>

                      {/* Project Manifest Preview */}
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Project Title</span>
                          <p className="text-sm font-bold text-navy-950 mt-0.5">{projectName || 'Not Entered'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Building Typology</span>
                          <p className="text-sm font-bold text-blue-900 mt-0.5">{projectType}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Client Contact</span>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">{customerName} (+91 {customerPhone})</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Site City</span>
                          <p className="text-xs font-semibold text-slate-700 mt-0.5">{city}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Footer */}
                <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-200 mt-6">
                  {projectStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setProjectStep(projectStep - 1)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition flex items-center gap-2 text-xs cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Previous Step</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-100 transition text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}

                  <div className="text-xs text-slate-400 font-mono hidden sm:block">
                    Step {projectStep} of 3
                  </div>

                  {projectStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (projectStep === 1) {
                          if (!projectName.trim()) {
                            error('Please enter the project name');
                            return;
                          }
                        } else if (projectStep === 2) {
                          if (!customerName.trim()) {
                            error('Please enter the customer name');
                            return;
                          }
                          const clean = customerPhone.replace(/\\D/g, '').slice(-10);
                          if (clean.length !== 10) {
                            error('Please enter a valid 10-digit mobile number');
                            return;
                          }
                        }
                        setProjectStep(projectStep + 1);
                      }}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <span>Proceed to Step {projectStep + 1}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Initialize & Launch Project</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
};"""

    txt = txt[:start_idx] + new_modal + txt[end_idx + len(old_end):]
    with open(prj_path, "w", encoding="utf-8") as f:
        f.write(txt)
    print("Successfully updated AdminProjects.tsx with Stepper Wizard!")
