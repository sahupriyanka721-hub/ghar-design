contr_path = r"C:\Users\HP\.gemini\antigravity\scratch\ghar-design\apps\web\src\pages\admin\AdminContractors.tsx"
with open(contr_path, "r", encoding="utf-8") as f:
    txt = f.read()

# 1. Add ArrowRight to imports
if "ArrowRight," not in txt:
    txt = txt.replace("ArrowLeft,\n  Check,", "ArrowLeft,\n  ArrowRight,\n  Check,")

# 2. Add contractorStep state
if "const [contractorStep, setContractorStep]" not in txt:
    txt = txt.replace(
        "const [showAddModal, setShowAddModal] = useState(false);",
        "const [showAddModal, setShowAddModal] = useState(false);\n  const [contractorStep, setContractorStep] = useState<number>(1);"
    )

# 3. Replace the entire showAddModal block
old_start = "{/* MODAL: REGISTER NEW CONTRACTOR */}\n      <AnimatePresence>\n        {showAddModal && ("
old_end = "\n      </AnimatePresence>\n    </div>\n  );\n};"

start_idx = txt.find(old_start)
end_idx = txt.rfind(old_end)

if start_idx == -1 or end_idx == -1:
    print(f"Could not find markers: start={start_idx}, end={end_idx}")
else:
    new_modal = """{/* MODAL: REGISTER NEW CONTRACTOR (Stepper Wizard) */}
      <AnimatePresence>
        {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setContractorStep(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back / Cancel</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <HardHat className="w-5 h-5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Register New Contractor Firm
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Step {contractorStep} of 4 • Certified Civil Contractor Onboarding
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setContractorStep(1);
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
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                {[
                  { step: 1, title: 'Firm Identity', icon: Building },
                  { step: 2, title: 'Location & Exp', icon: MapPin },
                  { step: 3, title: 'Licenses & Scope', icon: ShieldCheck },
                  { step: 4, title: 'Review & Onboard', icon: CheckCircle2 },
                ].map((item, idx, arr) => (
                  <div key={item.step} className="flex items-center flex-1 last:flex-none">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.step < contractorStep) setContractorStep(item.step);
                      }}
                      className="flex flex-col items-center gap-1 group text-center cursor-pointer"
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition ${
                          contractorStep === item.step
                            ? 'bg-amber-500 text-white shadow-md ring-4 ring-amber-100'
                            : contractorStep > item.step
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {contractorStep > item.step ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <item.icon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-bold mt-1 transition ${
                          contractorStep === item.step
                            ? 'text-amber-900'
                            : contractorStep > item.step
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
                          contractorStep > item.step ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stepper Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
              <form onSubmit={handleCreateContractor}>
                {/* STEP 1: FIRM IDENTITY */}
                {contractorStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
                        <span>Step 1 of 4</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Firm Name & Managing Contractor Identity
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Register contracting company legal name and primary civil engineer / director contact.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-amber-600" />
                          <span>Contracting Firm / Business Name</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Apex Civil Infraworks Pvt Ltd"
                          value={firmName}
                          onChange={(e) => setFirmName(e.target.value)}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <User className="w-4 h-4 text-amber-600" />
                          <span>Managing Contractor / Lead Engineer</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rajesh Kumar Verma"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-amber-600" />
                          <span>Primary Contact Mobile</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-xs">+91</span>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            placeholder="10-digit mobile number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full pl-14 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-amber-600" />
                          <span>Official Email Address</span>
                        </label>
                        <input
                          type="email"
                          placeholder="e.g. apex.infra@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: LOCATION & EXPERIENCE */}
                {contractorStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
                        <span>Step 2 of 4</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Operational Territory & Construction Track Record
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Select operational city, state, and years of civil construction execution experience.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Operating City <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Gurugram"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">State / Union Territory <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Haryana"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Experience (Years) <span className="text-rose-500">*</span></label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={experienceYears}
                          onChange={(e) => setExperienceYears(Number(e.target.value))}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: LICENSES & SPECIALIZATIONS */}
                {contractorStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
                        <span>Step 3 of 4</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Statutory Licensing & Specialized Civil Trades
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Enter contractor municipal / PWD registration and select civil execution capabilities.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">
                          License / Registration Number
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. PWD-CL-1-2024-904"
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">
                          GST Number (GSTIN)
                        </label>
                        <input
                          type="text"
                          maxLength={15}
                          placeholder="e.g. 06AAAAA0000A1Z5"
                          value={gstNumber}
                          onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="font-bold text-slate-800 text-sm block">
                        Select Specialized Execution Capabilities
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {[
                          'Civil Construction',
                          'Foundation & RMC',
                          'Structure & RCC',
                          'Masonry & Plaster',
                          'Waterproofing',
                          'Electrical & Plumbing (MEP)',
                          'Flooring & Tiling',
                          'Turnkey House Building',
                        ].map((spec) => {
                          const checked = selectedSpecializations.includes(spec);
                          return (
                            <label
                              key={spec}
                              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition ${
                                checked
                                  ? 'bg-amber-50/80 border-amber-300 text-amber-950 shadow-xs'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSpecializations([...selectedSpecializations, spec]);
                                  } else {
                                    setSelectedSpecializations(
                                      selectedSpecializations.filter((s) => s !== spec)
                                    );
                                  }
                                }}
                                className="rounded text-amber-600 focus:ring-amber-500"
                              />
                              <span>{spec}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: REVIEW & ONBOARD */}
                {contractorStep === 4 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
                        <span>Step 4 of 4</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Compliance Summary & Final Onboarding
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Confirm contractor registration. This contractor will be immediately available in project milestone allocation.
                      </p>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Firm Legal Name</span>
                        <p className="text-base font-bold text-navy-950 mt-0.5">{firmName || 'Not Entered'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Managing Contractor</span>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">{name || 'Not Entered'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Contact Info</span>
                        <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">+91 {phone} {email && `• ${email}`}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Jurisdiction & Track Record</span>
                        <p className="text-xs font-semibold text-slate-700 mt-0.5">{city}, {state} • {experienceYears} Years Civil Exp</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Statutory IDs</span>
                        <p className="text-xs font-mono text-slate-700 mt-0.5">Lic: {licenseNumber || 'N/A'} • GST: {gstNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Verified Trades ({selectedSpecializations.length})</span>
                        <p className="text-xs font-semibold text-amber-900 mt-0.5">{selectedSpecializations.join(', ') || 'General Civil'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Footer */}
                <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-200 mt-6">
                  {contractorStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setContractorStep(contractorStep - 1)}
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
                    Step {contractorStep} of 4
                  </div>

                  {contractorStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (contractorStep === 1) {
                          if (!firmName.trim() || !name.trim()) {
                            error('Please enter Firm Name and Contractor Name');
                            return;
                          }
                          const clean = phone.replace(/\\D/g, '').slice(-10);
                          if (clean.length !== 10) {
                            error('Please enter a valid 10-digit mobile number');
                            return;
                          }
                        }
                        setContractorStep(contractorStep + 1);
                      }}
                      className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <span>Proceed to Step {contractorStep + 1}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm & Register Contractor</span>
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
    with open(contr_path, "w", encoding="utf-8") as f:
        f.write(txt)
    print("Successfully updated AdminContractors.tsx with Stepper Wizard!")
