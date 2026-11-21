import fs from 'fs';
import path from 'path';

const wizardPath = 'C:/Users/HP/.gemini/antigravity/scratch/ghar-design/apps/web/src/pages/architect/ArchitectProfileWizard.tsx';
let content = fs.readFileSync(wizardPath, 'utf8');

// 1. Update totalSteps = 7
content = content.replace('const totalSteps = 6;', 'const totalSteps = 7;');

// 2. Add bank state & cheque ref right after personal/business state
const bankStateCode = `  const [bank, setBank] = useState({
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    accountType: 'CURRENT' as 'CURRENT' | 'SAVINGS',
    branch: '',
    cancelledChequeUrl: '',
    cancelledChequeFileName: '',
    isChequeAccepted: false,
  });
  const chequeInputRef = React.useRef<HTMLInputElement | null>(null);
`;

if (!content.includes('const [bank, setBank]')) {
  content = content.replace(
    '  const [personal, setPersonal] = useState({',
    `${bankStateCode}\n  const [personal, setPersonal] = useState({`
  );
}

// 3. Preload bank details in useEffect
const preloadBankCode = `        if (existing.bankDetails) {
          setBank((prev) => ({
            ...prev,
            bankName: existing.bankDetails?.bankName || '',
            accountHolderName: existing.bankDetails?.accountHolderName || existing.name || prev.accountHolderName,
            accountNumber: existing.bankDetails?.accountNumber || '',
            confirmAccountNumber: existing.bankDetails?.accountNumber || '',
            ifscCode: existing.bankDetails?.ifscCode || '',
            accountType: existing.bankDetails?.accountType || 'CURRENT',
            branch: existing.bankDetails?.branch || '',
            cancelledChequeUrl: existing.bankDetails?.cancelledChequeUrl || '',
            cancelledChequeFileName: existing.bankDetails?.cancelledChequeFileName || '',
            isChequeAccepted: existing.bankDetails?.isChequeAccepted ?? false,
          }));
        }`;

if (!content.includes('existing.bankDetails?.bankName')) {
  content = content.replace(
    `        if (existing.serviceCities && Array.isArray(existing.serviceCities) && existing.serviceCities.length > 0) {
          setServiceCities(existing.serviceCities);
        }`,
    `        if (existing.serviceCities && Array.isArray(existing.serviceCities) && existing.serviceCities.length > 0) {
          setServiceCities(existing.serviceCities);
        }
${preloadBankCode}`
  );
}

// 4. Add Cheque Upload & Cancel Handlers
const chequeHandlersCode = `  const triggerChequeUpload = () => {
    if (chequeInputRef.current) {
      chequeInputRef.current.value = '';
      chequeInputRef.current.click();
    }
  };

  const handleChequeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeFormatted =
      file.size > 1024 * 1024
        ? \`\${(file.size / (1024 * 1024)).toFixed(1)} MB\`
        : \`\${Math.round(file.size / 1024)} KB\`;

    const extension = file.name.split('.').pop()?.toUpperCase() || 'PDF';

    setBank((prev) => ({
      ...prev,
      cancelledChequeUrl: URL.createObjectURL(file),
      cancelledChequeFileName: \`\${file.name} (\${sizeFormatted} • \${extension})\`,
      isChequeAccepted: true,
    }));

    success(\`Cancelled cheque "\${file.name}" attached successfully!\`);
  };

  const handleCancelCheque = () => {
    setBank((prev) => ({
      ...prev,
      cancelledChequeUrl: '',
      cancelledChequeFileName: '',
      isChequeAccepted: false,
    }));
    if (chequeInputRef.current) {
      chequeInputRef.current.value = '';
    }
    success('Cancelled cheque removed.');
  };
`;

if (!content.includes('const triggerChequeUpload = () => {')) {
  content = content.replace(
    '  const handleRemoveDocument = (docId: string) => {',
    `${chequeHandlersCode}\n  const handleRemoveDocument = (docId: string) => {`
  );
}

// 5. Update handleFinalSubmit
content = content.replace('setCurrentStep(6);', 'setCurrentStep(7);');

const bankSaveSnippet = `      bankDetails: {
        bankName: bank.bankName,
        accountHolderName: bank.accountHolderName || personal.name,
        accountNumber: bank.accountNumber,
        ifscCode: (bank.ifscCode || '').toUpperCase(),
        accountType: bank.accountType,
        branch: bank.branch,
        cancelledChequeUrl: bank.cancelledChequeUrl,
        cancelledChequeFileName: bank.cancelledChequeFileName,
        isChequeAccepted: bank.isChequeAccepted,
        isVerified: false,
      },`;

if (!content.includes('isChequeAccepted: bank.isChequeAccepted,')) {
  content = content.replace(
    '      documents: kycDocuments,',
    `      documents: kycDocuments,\n${bankSaveSnippet}`
  );
}

// 6. Update stepsList & subtitle & navigation pills
content = content.replace(
  `  const stepsList = [
    { num: 1, label: 'Personal', icon: User },
    { num: 2, label: 'Firm Details', icon: Building2 },
    { num: 3, label: '21 Services', icon: Layers },
    { num: 4, label: 'Portfolio', icon: ImageIcon },
    { num: 5, label: 'KYC Docs', icon: FileCheck2 },
    { num: 6, label: 'Review & Submit', icon: ShieldCheck },
  ];`,
  `  const stepsList = [
    { num: 1, label: 'Personal', icon: User },
    { num: 2, label: 'Firm Details', icon: Building2 },
    { num: 3, label: '21 Services', icon: Layers },
    { num: 4, label: 'Portfolio', icon: ImageIcon },
    { num: 5, label: 'KYC Docs', icon: FileCheck2 },
    { num: 6, label: 'Bank & Cheque', icon: CreditCard },
    { num: 7, label: 'Review & Submit', icon: ShieldCheck },
  ];`
);

content = content.replace(
  'Complete the 6 sections below to submit your credentials to our Operations Governance Desk.',
  'Complete the 7 sections below to submit your credentials to our Operations Governance Desk.'
);

content = content.replace(
  'className="mb-8 grid grid-cols-3 sm:grid-cols-6 gap-2"',
  'className="mb-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2"'
);

// 7. Insert Step 6 (Bank Details & Cancelled Cheque) and change old Step 6 to Step 7
const step6And7JSX = `          {/* ---------------- STEP 6: BANK DETAILS & CANCELLED CHEQUE ---------------- */}
          {currentStep === 6 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Hidden File Input for Cancelled Cheque */}
              <input
                ref={chequeInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleChequeFileChange}
              />

              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-sky-600" />
                  <span>Step 6: Bank Account Details & Cancelled Cheque</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your firm or personal bank account details and upload a cancelled cheque for secure milestone escrow disbursements.
                </p>
              </div>

              {/* Escrow Milestone Guarantee Notice */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 text-xs text-slate-700 flex items-start gap-3 shadow-2xs">
                <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-navy-950 block">Bank Account for Direct Milestone Escrow Settlements</span>
                  <span className="text-slate-600 text-[11px] leading-relaxed">
                    Client funds are deposited in multi-signature escrow tranches and automatically disbursed to this verified bank account upon landowner design phase approvals.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bank Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bank Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bank.bankName}
                    onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
                    placeholder="Enter bank name"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                  {/* Quick Bank Chips */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra'].map((bName) => (
                      <button
                        key={bName}
                        type="button"
                        onClick={() => setBank({ ...bank, bankName: bName })}
                        className={\`text-[10px] px-2 py-0.5 rounded-md border font-semibold transition \${
                          bank.bankName === bName
                            ? 'bg-sky-100 border-sky-300 text-sky-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }\`}
                      >
                        {bName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Type <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBank({ ...bank, accountType: 'CURRENT' })}
                      className={\`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 \${
                        bank.accountType === 'CURRENT'
                          ? 'bg-sky-600 text-white border-sky-700 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }\`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Current Account (Firm)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBank({ ...bank, accountType: 'SAVINGS' })}
                      className={\`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 \${
                        bank.accountType === 'SAVINGS'
                          ? 'bg-sky-600 text-white border-sky-700 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }\`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Savings Account</span>
                    </button>
                  </div>
                </div>

                {/* Account Holder Name */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Beneficiary Account Holder Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      {business.firmName && (
                        <button
                          type="button"
                          onClick={() => setBank({ ...bank, accountHolderName: business.firmName })}
                          className="text-[10px] text-sky-700 font-bold hover:underline cursor-pointer"
                        >
                          Use Firm Name ({business.firmName})
                        </button>
                      )}
                      {personal.name && (
                        <button
                          type="button"
                          onClick={() => setBank({ ...bank, accountHolderName: personal.name })}
                          className="text-[10px] text-sky-700 font-bold hover:underline cursor-pointer"
                        >
                          Use Principal Name ({personal.name})
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={bank.accountHolderName}
                    onChange={(e) => setBank({ ...bank, accountHolderName: e.target.value })}
                    placeholder="Enter name exactly as on bank records"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bank Account Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={bank.accountNumber}
                    onChange={(e) => setBank({ ...bank, accountNumber: e.target.value.replace(/\\D/g, '') })}
                    placeholder="Enter bank account number"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold tracking-wider focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>

                {/* Confirm Account Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Account Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bank.confirmAccountNumber}
                    onChange={(e) => setBank({ ...bank, confirmAccountNumber: e.target.value.replace(/\\D/g, '') })}
                    placeholder="Re-enter bank account number"
                    className={\`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-mono font-bold tracking-wider focus:outline-none focus:bg-white transition \${
                      bank.confirmAccountNumber && bank.accountNumber !== bank.confirmAccountNumber
                        ? 'border-rose-400 focus:border-rose-500'
                        : bank.confirmAccountNumber && bank.accountNumber === bank.confirmAccountNumber
                        ? 'border-emerald-400 focus:border-emerald-500'
                        : 'border-slate-200 focus:border-sky-500'
                    }\`}
                  />
                  {bank.confirmAccountNumber && bank.accountNumber !== bank.confirmAccountNumber && (
                    <span className="text-[10px] text-rose-500 font-semibold block mt-1">
                      Account numbers do not match!
                    </span>
                  )}
                  {bank.confirmAccountNumber && bank.accountNumber === bank.confirmAccountNumber && (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3 h-3" /> Account numbers match
                    </span>
                  )}
                </div>

                {/* IFSC Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    IFSC Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    value={bank.ifscCode}
                    onChange={(e) => setBank({ ...bank, ifscCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                    placeholder="e.g. HDFC0000123"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">11-character alphanumeric code from cheque or passbook</span>
                </div>

                {/* Branch / City */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Branch Name & City
                  </label>
                  <input
                    type="text"
                    value={bank.branch}
                    onChange={(e) => setBank({ ...bank, branch: e.target.value })}
                    placeholder="Enter branch name / location"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* ---------------- CANCELLED CHEQUE UPLOAD & VERIFICATION ZONE ---------------- */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-black text-navy-950 flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-sky-600" />
                      <span>Cancelled Cheque / Bank Passbook Document</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Upload a scanned copy or clear photo of your firm's cancelled cheque (or bank passbook) showing account name, A/C number, and IFSC.
                    </p>
                  </div>
                  {bank.cancelledChequeFileName && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Cheque Uploaded
                    </span>
                  )}
                </div>

                {/* Upload Card / Dropzone */}
                {!bank.cancelledChequeUrl ? (
                  <div
                    onClick={triggerChequeUpload}
                    className="p-6 rounded-2xl border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/40 hover:bg-sky-50/80 transition-all cursor-pointer text-center space-y-2 group shadow-2xs"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white border border-sky-200 text-sky-600 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform shadow-xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-navy-950">
                        Click to Upload Cancelled Cheque / Bank Passbook (PDF, PNG, JPG)
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Clear legible copy required • Max 10 MB
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl bg-sky-600 group-hover:bg-sky-700 text-white text-xs font-bold transition shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Attach Cancelled Cheque</span>
                    </button>
                  </div>
                ) : (
                  /* Uploaded Cheque Display with Accept & Cancel Options */
                  <div className="p-4 rounded-2xl bg-white border-2 border-emerald-200 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-navy-950 flex items-center gap-2">
                            <span>Cancelled Cheque Attached</span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                              Attached
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {bank.cancelledChequeFileName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {/* View Preview Button */}
                        <a
                          href={bank.cancelledChequeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Cheque</span>
                        </a>

                        {/* Replace Button */}
                        <button
                          type="button"
                          onClick={triggerChequeUpload}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                        >
                          Replace File
                        </button>

                        {/* CANCEL OPTION: Remove Cheque */}
                        <button
                          type="button"
                          onClick={handleCancelCheque}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Remove attached cheque"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Cancel / Remove Cheque</span>
                        </button>
                      </div>
                    </div>

                    {/* ACCEPT OPTION: Cheque Verification Acceptance */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="acceptChequeCheckbox"
                        checked={bank.isChequeAccepted}
                        onChange={(e) => setBank({ ...bank, isChequeAccepted: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                      />
                      <label htmlFor="acceptChequeCheckbox" className="text-xs text-slate-700 cursor-pointer select-none">
                        <strong className="text-emerald-950 font-bold block">
                          Accept Cheque & Verify Account Details:
                        </strong>
                        <span className="text-[11px] text-slate-600 leading-relaxed block mt-0.5">
                          I confirm and accept that the attached cancelled cheque belongs to the registered practice / principal architect and that all payout disbursements should be directed to this verified bank account.
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ---------------- STEP 7: SERVICE CITIES & REVIEW SUBMIT ---------------- */}
          {currentStep === 7 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-sky-600" />
                  <span>Step 7: Service Coverage Areas & Final Review</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Confirm your operating geographic regions and review your profile summary before dispatching for verification.
                </p>
              </div>

              {/* Operating Cities Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Select Operating Cities / Localities:
                  </label>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {serviceCities.length} selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set([...(business.city?.trim() ? [business.city.trim()] : []), ...allAvailableCities, ...serviceCities])).map((city) => {
                    const isSelected = serviceCities.includes(city);
                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() => toggleCity(city)}
                        className={\`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 \${
                          isSelected
                            ? 'bg-sky-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }\`}
                      >
                        <MapPin className="w-3 h-3" />
                        <span>{city}</span>
                      </button>
                    );
                  })}
                </div>
                {serviceCities.length === 0 && (
                  <p className="text-[11px] text-amber-700 font-medium mt-2">
                    Kripya un shehron (cities) par click karein jahan aap kaam karte hain (koi city automatic select nahi hai).
                  </p>
                )}
              </div>

              {/* Review Summary Card */}
              <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3">
                <div className="text-xs font-black text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-sky-700" />
                  <span>Application Summary for Governance Desk</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">Principal Architect:</span>{' '}
                    <strong className="text-navy-950">{personal.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Firm Name:</span>{' '}
                    <strong className="text-navy-950">{business.firmName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">COA Number:</span>{' '}
                    <strong className="font-mono text-sky-800">{business.coaNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Business Type:</span>{' '}
                    <strong className="text-navy-950">{business.businessType}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Services Offered:</span>{' '}
                    <strong className="text-navy-950">{selectedServices.length} Categories</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Portfolio Projects:</span>{' '}
                    <strong className="text-navy-950">{portfolioProjects.length} Verified Residences</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">KYC Documents:</span>{' '}
                    <strong className="text-navy-950">{kycDocuments.filter(d => d.fileUrl && d.fileUrl !== '#').length} Attached</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Bank Account:</span>{' '}
                    <strong className="text-navy-950">
                      {bank.bankName ? \`\${bank.bankName} (\${bank.accountNumber ? '••••' + bank.accountNumber.slice(-4) : 'Provided'})\` : 'Pending'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">IFSC Code:</span>{' '}
                    <strong className="font-mono text-navy-950">{bank.ifscCode || 'Not provided'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Cancelled Cheque:</span>{' '}
                    <strong className={bank.cancelledChequeFileName ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
                      {bank.cancelledChequeFileName ? (bank.isChequeAccepted ? 'Attached & Accepted' : 'Attached') : 'Not Attached'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  Once submitted, our Operations Desk typically evaluates submissions within <strong>24 to 48 hours</strong>.
                  You can track approval progress in real time.
                </span>
              </div>
            </motion.div>
          )}`;

// Replace Step 6 block with Step 6 + Step 7
const oldStep6Regex = /\{\/\* ---------------- STEP 6: SERVICE CITIES & REVIEW SUBMIT ---------------- \*\/\}[\s\S]*?\{currentStep === 6 && \([\s\S]*?<\/motion\.div>\s*\)\}/;

if (oldStep6Regex.test(content)) {
  content = content.replace(oldStep6Regex, step6And7JSX);
  console.log('Replaced Step 6 with Step 6 (Bank & Cheque) and Step 7 (Review & Submit)');
} else {
  console.error('Could not find old Step 6 block using regex!');
}

// 8. Update footer button for Step 6 validation
const oldNextBtnRegex = /onClick=\{\(\) => setCurrentStep\(currentStep \+ 1\)\}/;
if (oldNextBtnRegex.test(content)) {
  content = content.replace(
    oldNextBtnRegex,
    `onClick={() => {
                  if (currentStep === 6 && bank.accountNumber && bank.confirmAccountNumber && bank.accountNumber !== bank.confirmAccountNumber) {
                    error('Bank account numbers do not match! Please check and re-confirm.');
                    return;
                  }
                  setCurrentStep(currentStep + 1);
                }}`
  );
  console.log('Updated Next Step button with Step 6 validation');
}

fs.writeFileSync(wizardPath, content, 'utf8');
console.log('Updated ArchitectProfileWizard.tsx successfully!');
