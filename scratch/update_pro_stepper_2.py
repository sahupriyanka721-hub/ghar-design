pro_path = r"C:\Users\HP\.gemini\antigravity\scratch\ghar-design\apps\web\src\pages\admin\AdminProfessionals.tsx"
with open(pro_path, "r", encoding="utf-8") as f:
    txt = f.read()

# 1. Add ArrowRight to imports
if "ArrowRight," not in txt:
    txt = txt.replace("ArrowLeft,\n  Award,", "ArrowLeft,\n  ArrowRight,\n  Award,")

# 2. Add proStep state
if "const [proStep, setProStep]" not in txt:
    txt = txt.replace(
        "const [showProModal, setShowProModal] = useState(false);",
        "const [showProModal, setShowProModal] = useState(false);\n  const [proStep, setProStep] = useState<number>(1);"
    )

old_start = "{/* Onboard Professional Modal */}\n      {showProModal && ("
end_marker = "export const AdminBookings: React.FC = () => {"

start_idx = txt.find(old_start)
end_idx = txt.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print(f"Could not find markers: start={start_idx}, end={end_idx}")
else:
    # Find the closing tag before export const AdminBookings
    slice_to_replace = txt[start_idx:end_idx]
    # In slice_to_replace, find the last "      )}"
    last_close = slice_to_replace.rfind("      )}")
    actual_end = start_idx + last_close + len("      )}")
    print(f"Replacing from {start_idx} to {actual_end}")

    new_modal = """{/* Onboard Professional Modal (Stepper Wizard) */}
      {showProModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-blue-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setShowProModal(false);
                  setProStep(1);
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
                  <UserCheck className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Onboard Professional Firm
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Step {proStep} of 4 • Engineers & Architects Accreditation
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowProModal(false);
                  setProStep(1);
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
                  { step: 1, title: 'Discipline & Firm', icon: Building },
                  { step: 2, title: 'Contact & Territory', icon: MapPin },
                  { step: 3, title: 'Accreditation', icon: Award },
                  { step: 4, title: 'Verification', icon: ShieldCheck },
                ].map((item, idx, arr) => (
                  <div key={item.step} className="flex items-center flex-1 last:flex-none">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.step < proStep) setProStep(item.step);
                      }}
                      className="flex flex-col items-center gap-1 group text-center cursor-pointer"
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition ${
                          proStep === item.step
                            ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100'
                            : proStep > item.step
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {proStep > item.step ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <item.icon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-bold mt-1 transition ${
                          proStep === item.step
                            ? 'text-blue-900'
                            : proStep > item.step
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
                          proStep > item.step ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stepper Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
              <form onSubmit={handleCreatePro}>
                {/* STEP 1: DISCIPLINE & FIRM */}
                {proStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 1 of 4</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Firm Name & Discipline Category
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Register professional engineering / architectural studio credentials.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-blue-600" />
                          <span>Consulting Firm / Studio Name</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Apex Structural Consultants"
                          value={newPro.firmName}
                          onChange={(e) => setNewPro({ ...newPro, firmName: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <User className="w-4 h-4 text-blue-600" />
                          <span>Lead / Principal Professional Name</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Er. Rajiv Singhal"
                          value={newPro.name}
                          onChange={(e) => setNewPro({ ...newPro, name: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="font-bold text-slate-800 text-sm">Discipline Category <span className="text-rose-500">*</span></label>
                        <select
                          value={newPro.category}
                          onChange={(e) => setNewPro({ ...newPro, category: e.target.value as any })}
                          className="w-full p-3.5 border border-slate-300 rounded-2xl font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs"
                        >
                          <option value="PROFESSIONAL">Professional Consultant (IEI Certified)</option>
                          <option value="STRUCTURAL_ENGINEER">Structural Engineer (IEI / ISSE)</option>
                          <option value="CIVIL_ENGINEER">Civil Engineer & PMC Lead</option>
                          <option value="INTERIOR_DESIGNER">Interior Architecture & Design (IIID)</option>
                          <option value="ARCHITECT">Registered Architect (COA Licensed)</option>
                          <option value="MEP_CONSULTANT">MEP Consultant (HVAC, Electrical, Plumbing)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: CONTACT & TERRITORY */}
                {proStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 2 of 4</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Official Communications & Operating Territories
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Specify contact mobile, email, and target service cities for automated client allocation.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-blue-600" />
                          <span>Direct Mobile Number</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-xs">+91</span>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            placeholder="10-digit mobile number"
                            value={newPro.phone}
                            onChange={(e) => setNewPro({ ...newPro, phone: e.target.value })}
                            className="w-full pl-14 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-blue-600" />
                          <span>Official Email Address</span>
                        </label>
                        <input
                          type="email"
                          placeholder="e.g. rajiv@apex-engineers.in"
                          value={newPro.email}
                          onChange={(e) => setNewPro({ ...newPro, email: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span>Active Service Cities / Operational Regions</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Gurugram, New Delhi, Noida, Faridabad"
                          value={newPro.serviceCities}
                          onChange={(e) => setNewPro({ ...newPro, serviceCities: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: ACCREDITATION */}
                {proStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 3 of 4</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Professional Qualifications & Engineering Experience
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Enter degree credentials, professional council registration, and industry tenure.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-blue-600" />
                          <span>Degrees / Council Licensure</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. M.Tech (Structures) IIT-D, Chartered Engineer"
                          value={newPro.qualifications}
                          onChange={(e) => setNewPro({ ...newPro, qualifications: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span>Industry Experience (Years)</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={newPro.experienceYears}
                          onChange={(e) => setNewPro({ ...newPro, experienceYears: Number(e.target.value) })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: VERIFICATION & REVIEW */}
                {proStep === 4 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 4 of 4</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Accreditation Review & Onboard Activation
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Review professional credentials and activate instant booking allocation rights.
                      </p>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Consultancy Firm</span>
                        <p className="text-base font-bold text-navy-950 mt-0.5">{newPro.firmName || 'Not Entered'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Lead Professional</span>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">{newPro.name || 'Not Entered'} ({newPro.category})</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Contact Mobile & Email</span>
                        <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">+91 {newPro.phone} {newPro.email && `• ${newPro.email}`}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Coverage Cities</span>
                        <p className="text-xs font-semibold text-slate-700 mt-0.5">{newPro.serviceCities}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Accreditation</span>
                        <p className="text-xs font-semibold text-blue-900 mt-0.5">{newPro.qualifications} • {newPro.experienceYears} Years Experience</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="font-bold text-slate-800 text-sm block">
                        Initial Accreditation Level <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label
                          onClick={() => setNewPro({ ...newPro, verificationStatus: 'APPROVED' })}
                          className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                            newPro.verificationStatus === 'APPROVED'
                              ? 'bg-emerald-50 border-emerald-400 shadow-sm'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="radio"
                            name="proStatus"
                            checked={newPro.verificationStatus === 'APPROVED'}
                            onChange={() => {}}
                            className="mt-1"
                          />
                          <div>
                            <span className="font-bold text-navy-950 text-xs block">APPROVED (Direct Matching)</span>
                            <span className="text-[11px] text-slate-500">
                              Immediately visible to homeowners in consultation bookings and project milestone assignments.
                            </span>
                          </div>
                        </label>

                        <label
                          onClick={() => setNewPro({ ...newPro, verificationStatus: 'PENDING' })}
                          className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                            newPro.verificationStatus === 'PENDING'
                              ? 'bg-amber-50 border-amber-400 shadow-sm'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="radio"
                            name="proStatus"
                            checked={newPro.verificationStatus === 'PENDING'}
                            onChange={() => {}}
                            className="mt-1"
                          />
                          <div>
                            <span className="font-bold text-navy-950 text-xs block">PENDING (Audit Hold)</span>
                            <span className="text-[11px] text-slate-500">
                              Requires manual review of COA / IEI certificates by senior admin before public matching.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step Navigation Footer */}
                <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-200 mt-6">
                  {proStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setProStep(proStep - 1)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition flex items-center gap-2 text-xs cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Previous Step</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowProModal(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-100 transition text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}

                  <div className="text-xs text-slate-400 font-mono hidden sm:block">
                    Step {proStep} of 4
                  </div>

                  {proStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (proStep === 1) {
                          if (!newPro.firmName.trim() || !newPro.name.trim()) {
                            error('Please enter Firm Name and Professional Name');
                            return;
                          }
                        } else if (proStep === 2) {
                          const clean = newPro.phone.replace(/\\D/g, '').slice(-10);
                          if (clean.length !== 10) {
                            error('Please enter a valid 10-digit mobile number');
                            return;
                          }
                          if (!newPro.serviceCities.trim()) {
                            error('Please enter service cities');
                            return;
                          }
                        }
                        setProStep(proStep + 1);
                      }}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <span>Proceed to Step {proStep + 1}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm & Onboard Professional</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}"""

    txt = txt[:start_idx] + new_modal + txt[actual_end:]
    with open(pro_path, "w", encoding="utf-8") as f:
        f.write(txt)
    print("Successfully updated AdminProfessionals.tsx with Stepper Wizard!")
