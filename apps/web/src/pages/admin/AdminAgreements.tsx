import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Printer,
  Copy,
  Check,
  FileText,
  ShieldCheck,
  Building2,
  Calendar,
  MapPin,
  User,
  Scale,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  HardHat,
  Phone,
  Mail,
  Edit3,
  Stamp,
  FileCode,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { BrandLogo } from '../../components/common/BrandLogo.js';

interface MilestoneTranche {
  stage: number;
  name: string;
  scope: string;
  percentage: number;
  amountPaise: number;
}

export const AdminAgreements: React.FC = () => {
  const [viewMode, setViewMode] = useState<'document' | 'rawText' | 'parameters'>('document');
  const [agreementType, setAgreementType] = useState<'construction' | 'planning' | 'materials'>('construction');
  const [leaveStampSpace, setLeaveStampSpace] = useState<boolean>(false);
  const [isLiveEditMode, setIsLiveEditMode] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Dynamic Editable Contract Parameters
  const [contractData, setContractData] = useState({
    agreementNumber: 'BG-AGR-2026-8492',
    dateOfExecution: new Date().toISOString().split('T')[0],
    cityOfJurisdiction: 'New Delhi / Gurugram NCR',

    // First Party: Client / Landowner
    clientName: '[Landowner / Client Name]',
    clientFatherName: '[Father / Spouse Name]',
    clientPhone: '+91 [Client Phone]',
    clientEmail: '[client.email@example.com]',
    clientAadhar: 'XXXX-XXXX-[Aadhaar Ref]',
    plotAddress: '[Plot / Site Address, Sector/Locality, City, State - Pincode]',
    plotDimensions: '[e.g. 30 ft × 50 ft (1,500 sq.ft)]',
    builtUpArea: '[e.g. 2,400 sq.ft (G+1 Villa)]',

    // Second Party: Assigned Professional / Lead Civil Contractor
    professionalName: '[Assigned Architect / Civil Engineer]',
    professionalCOA: '[COA / Registration Number]',
    firmName: '[Engineering & Architecture Firm Name]',
    professionalPhone: '+91 [Professional Phone]',
    professionalEmail: '[pro.contact@example.in]',
    contractorLicense: '[IEI Licensed Civil Engineer / Contractor License]',

    // Financials & Terms
    ratePerSqFt: 1650,
    totalContractValue: 3960000, // ₹39,60,000 (@ ₹1,650/sq.ft for 2,400 sq.ft)
    totalValueInWords: 'Thirty-Nine Lakhs Sixty Thousand Rupees Only',
    projectDurationDays: 270, // 9 Months
    defectLiabilityPeriodMonths: 12,
    rccStructuralWarrantyYears: 10,
    arbitrationSeat: 'New Delhi / Gurugram, India',
    specialConditions: 'All reinforcement bars must strictly be Tata Tiscon 550D or Jindal Panther 550D. Cement must be fresh UltraTech Super or Ambuja M25 grade with test certificates.',
  });

  // 10-Stage Milestone Escrow Tranches
  const milestoneTranches: MilestoneTranche[] = [
    {
      stage: 1,
      name: 'Site Mobilization & Foundation Trenching',
      scope: 'Excavation to hard strata, anti-termite soil treatment, PCC 1:4:8 base layer.',
      percentage: 10,
      amountPaise: Math.round(contractData.totalContractValue * 0.10),
    },
    {
      stage: 2,
      name: 'Footing RCC & Plinth Beam Level',
      scope: 'Column footings with IS 456 M25 concrete, plinth beam casting, backfilling & compaction.',
      percentage: 10,
      amountPaise: Math.round(contractData.totalContractValue * 0.10),
    },
    {
      stage: 3,
      name: 'Ground Floor Column & RCC Slab Casting',
      scope: 'Reinforced columns, 5-inch roof slab with Tata Tiscon 550D steel & integral waterproofing.',
      percentage: 12,
      amountPaise: Math.round(contractData.totalContractValue * 0.12),
    },
    {
      stage: 4,
      name: 'First Floor Column & Roof Slab Casting',
      scope: 'First floor RCC frame, staircase casting, roof parapet and cantilever projections.',
      percentage: 12,
      amountPaise: Math.round(contractData.totalContractValue * 0.12),
    },
    {
      stage: 5,
      name: 'Red Brick / AAC Block Masonry',
      scope: '9-inch external load walls, 4.5-inch internal partition walls with RCC lintel bands.',
      percentage: 12,
      amountPaise: Math.round(contractData.totalContractValue * 0.12),
    },
    {
      stage: 6,
      name: 'Internal & External Sand-Face Plaster',
      scope: 'Cement plaster 1:4 with chicken wire mesh over beam-brick joints to eliminate cracks.',
      percentage: 10,
      amountPaise: Math.round(contractData.totalContractValue * 0.10),
    },
    {
      stage: 7,
      name: 'Concealed Electrical & CPVC Plumbing Lines',
      scope: 'Finolex/Polycab FRLS wiring, Astral CPVC pipes, drainage slope testing & pressure test.',
      percentage: 10,
      amountPaise: Math.round(contractData.totalContractValue * 0.10),
    },
    {
      stage: 8,
      name: 'Vitrified Tile Flooring & Granite Sills',
      scope: 'Double-charged 4x2 vitrified tiles, granite kitchen counters, bathroom anti-skid tiling.',
      percentage: 12,
      amountPaise: Math.round(contractData.totalContractValue * 0.12),
    },
    {
      stage: 9,
      name: 'Premium Primer, Wall Putty & Exterior Paint',
      scope: 'Birla White putty 2 coats, Asian Paints Apex WeatherProof exterior, flush doors hung.',
      percentage: 7,
      amountPaise: Math.round(contractData.totalContractValue * 0.07),
    },
    {
      stage: 10,
      name: 'Final Snag Rectification & Digital Handover',
      scope: 'Complete deep cleaning, fitting testing, keys handover + 10-Yr structural guarantee certificate.',
      percentage: 5,
      amountPaise: Math.round(contractData.totalContractValue * 0.05),
    },
  ];

  // Generate Pure Text Version of the Agreement
  const generatePureTextAgreement = () => {
    return `================================================================================
BUILDGHAR PROFESSIONALURE & CIVIL MARKETPLACE
TRIPARTITE MASTER SERVICE & CIVIL CONSTRUCTION ESCROW AGREEMENT
(भवन निर्माण एवं वास्तुकला अनुबंध पत्र)
Agreement Ref: ${contractData.agreementNumber}
Date of Execution: ${contractData.dateOfExecution}
Jurisdiction: ${contractData.cityOfJurisdiction}
================================================================================

THIS MASTER CONSTRUCTION & ESCROW PROTECTION AGREEMENT is entered into on this ${contractData.dateOfExecution} by and between:

1. THE FIRST PARTY (THE PROPERTY OWNER / CLIENT):
Name: ${contractData.clientName}
Son/Daughter of: ${contractData.clientFatherName}
Plot / Site Address: ${contractData.plotAddress}
Contact: Phone: ${contractData.clientPhone} | Email: ${contractData.clientEmail}
Identity (Aadhar Ref): ${contractData.clientAadhar}
(Hereinafter referred to as the "OWNER / CLIENT", which expression shall include their legal heirs, executors, and assigns).

AND

2. THE SECOND PARTY (THE PROFESSIONAL / CIVIL CONTRACTOR):
Name: ${contractData.professionalName} (COA Reg: ${contractData.professionalCOA})
Firm / Entity: ${contractData.firmName}
Engineering License: ${contractData.contractorLicense}
Contact: Phone: ${contractData.professionalPhone} | Email: ${contractData.professionalEmail}
(Hereinafter referred to as the "PROFESSIONAL / CONTRACTOR", which expression shall include their partners, successors, and assigns).

AND

3. THE THIRD PARTY (THE ESCROW & AUDIT DESK):
BuildGhar Technologies India Private Limited
Operations & Quality Audit Division, Connaught Place, New Delhi 110001
(Hereinafter referred to as the "BUILDGHAR PLATFORM / ESCROW DESK").

--------------------------------------------------------------------------------
RECITALS & OPERATIVE TERMS:
--------------------------------------------------------------------------------

WHEREAS the Owner is the absolute lawful owner of the property located at ${contractData.plotAddress} measuring ${contractData.plotDimensions};

AND WHEREAS the Owner desires to construct a complete residential building with built-up area of ${contractData.builtUpArea} under strict engineering supervision;

NOW THEREFORE, in consideration of the mutual covenants contained herein, the parties agree as follows:

CLAUSE 1: SCOPE OF WORK & ENGINEERING STANDARDS
1.1 The Professional/Contractor shall execute engineering blueprints, 2D sanction drawings, 3D elevation renderings, RCC frame construction, brickwork, plastering, electrical, plumbing, tiling, and finishing works as itemized in the approved Bill of Quantities (BOQ).
1.2 All RCC works shall strictly conform to IS 456:2000 (Plain and Reinforced Concrete) and IS 1893:2016 (Earthquake Resistant Structures).

CLAUSE 2: CONTRACT SUM & ZERO HIDDEN COST GUARANTEE
2.1 The agreed total fixed contract sum for the civil construction is Rs. ${contractData.totalContractValue.toLocaleString('en-IN')} (${contractData.totalValueInWords}), calculated at Rs. ${contractData.ratePerSqFt}/sq.ft for ${contractData.builtUpArea}.
2.2 Fixed Rate Lock: No price escalation shall be permissible on account of raw material inflation or labor wage variations unless agreed in writing via an authorized Variation Order.

CLAUSE 3: 10-STAGE MILESTONE ESCROW PAYMENT SCHEDULE
Funds are deposited upfront by the Owner into the BuildGhar Escrow Trust Account. Payments are disbursed to the Contractor ONLY upon physical milestone verification:
- Stage 1 (10%): Rs. ${Math.round(contractData.totalContractValue * 0.10).toLocaleString('en-IN')} - Site Mobilization, Excavation & PCC
- Stage 2 (10%): Rs. ${Math.round(contractData.totalContractValue * 0.10).toLocaleString('en-IN')} - Column Footings & Plinth Beam Casting
- Stage 3 (12%): Rs. ${Math.round(contractData.totalContractValue * 0.12).toLocaleString('en-IN')} - Ground Floor Columns & Roof Slab Casting
- Stage 4 (12%): Rs. ${Math.round(contractData.totalContractValue * 0.12).toLocaleString('en-IN')} - First Floor Columns & Roof Slab Casting
- Stage 5 (12%): Rs. ${Math.round(contractData.totalContractValue * 0.12).toLocaleString('en-IN')} - 9" Exterior & 4.5" Interior Brick Masonry
- Stage 6 (10%): Rs. ${Math.round(contractData.totalContractValue * 0.10).toLocaleString('en-IN')} - Cement Sand Plaster with Chicken Wire Mesh
- Stage 7 (10%): Rs. ${Math.round(contractData.totalContractValue * 0.10).toLocaleString('en-IN')} - Concealed Electrical Wiring & CPVC Plumbing
- Stage 8 (12%): Rs. ${Math.round(contractData.totalContractValue * 0.12).toLocaleString('en-IN')} - Vitrified Tile Flooring & Kitchen Granite Counters
- Stage 9 (07%): Rs. ${Math.round(contractData.totalContractValue * 0.07).toLocaleString('en-IN')} - Birla White Putty & Apex WeatherProof Exterior Paint
- Stage 10 (05%): Rs. ${Math.round(contractData.totalContractValue * 0.05).toLocaleString('en-IN')} - Snag Rectification, Keys Handover & 10-Yr Guarantee

CLAUSE 4: MATERIAL QUALITY SPECIFICATIONS
4.1 Steel: Primary TMT Fe-550D (Tata Tiscon / Jindal Panther) with manufacturer mill test certs.
4.2 Cement: Grade 43/53 Portland Pozzolana Cement (UltraTech Super / Ambuja / ACC).
4.3 Sand & Aggregates: Coarse river sand (Zone-II) and 10mm/20mm blue granite metal.
4.4 Plumbing & Electrical: Astral CPVC pipes and Polycab/Finolex FRLS fire-retardant wiring.

CLAUSE 5: TIMELINE, DELAYS & LIQUIDATED DAMAGES
5.1 Total duration: ${contractData.projectDurationDays} Days from site handover date.
5.2 Unjustified delays exceeding 30 days shall attract liquidated damages of 0.25% per week of delay, capped at 5% of total contract value.

CLAUSE 6: WATER, ELECTRICITY & SITE SAFETY
6.1 The Owner shall arrange clean curing water and temporary electrical power connection at the plot boundary.
6.2 The Contractor is strictly liable for labor safety, helmets, safety harnesses, and Workmen Compensation compliance.

CLAUSE 7: 10-YEAR STRUCTURAL WARRANTY & DEFECT LIABILITY
7.1 The Contractor provides a 10-Year RCC Structural Integrity Guarantee against settlement, cracking, or slab deflection.
7.2 A 12-Month Defect Liability Period applies post keys handover for plumbing, seepage, or woodwork snags.

CLAUSE 8: DISPUTE ARBITRATION
Any dispute shall be referred to BuildGhar Technical Ombudsman for fast-track conciliation, failing which sole arbitration under the Arbitration and Conciliation Act, 1996 in ${contractData.arbitrationSeat}.

================================================================================
IN WITNESS WHEREOF, the parties have signed this Agreement on the date above:
================================================================================

FIRST PARTY (OWNER):
Signature: __________________________
Name: ${contractData.clientName}
Date: ${contractData.dateOfExecution}

SECOND PARTY (PROFESSIONAL / CONTRACTOR):
Signature: __________________________
Name: ${contractData.professionalName}
COA / License: ${contractData.professionalCOA}
Seal:

THIRD PARTY (BUILDGHAR ESCROW DESK):
Signature: __________________________
Authorized Escrow Officer
BuildGhar Technologies India Pvt. Ltd.

WITNESS 1:
Name & Address: _________________________________________
Signature: _____________________________________________

WITNESS 2:
Name & Address: _________________________________________
Signature: _____________________________________________
================================================================================`;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generatePureTextAgreement());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const resetToSample = () => {
    setContractData({
      agreementNumber: `BG-AGR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      dateOfExecution: new Date().toISOString().split('T')[0],
      cityOfJurisdiction: 'New Delhi / Gurugram NCR',
      clientName: '[Landowner / Client Name]',
      clientFatherName: '[Father / Spouse Name]',
      clientPhone: '+91 [Client Phone]',
      clientEmail: '[client.email@example.com]',
      clientAadhar: 'XXXX-XXXX-[Aadhaar Ref]',
      plotAddress: '[Plot / Site Address, Sector/Locality, City, State - Pincode]',
      plotDimensions: '[e.g. 30 ft × 50 ft (1,500 sq.ft)]',
      builtUpArea: '[e.g. 2,400 sq.ft (G+1 Villa)]',
      professionalName: '[Assigned Architect / Civil Engineer]',
      professionalCOA: '[COA / Registration Number]',
      firmName: '[Engineering & Architecture Firm Name]',
      professionalPhone: '+91 [Professional Phone]',
      professionalEmail: '[pro.contact@example.in]',
      contractorLicense: '[IEI Licensed Civil Engineer / Contractor License]',
      ratePerSqFt: 1650,
      totalContractValue: 3960000,
      totalValueInWords: 'Thirty-Nine Lakhs Sixty Thousand Rupees Only',
      projectDurationDays: 270,
      defectLiabilityPeriodMonths: 12,
      rccStructuralWarrantyYears: 10,
      arbitrationSeat: 'New Delhi / Gurugram, India',
      specialConditions: 'All reinforcement bars must strictly be Tata Tiscon 550D or Jindal Panther 550D. Cement must be fresh UltraTech Super or Ambuja M25 grade with test certificates.',
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ---------------- SCREEN CONTROLS & TOOLBAR (HIDDEN ON PRINT) ---------------- */}
      <div className="print:hidden space-y-4">
        {/* Banner */}
        <div className="card p-6 bg-gradient-to-br from-[#e8f3fe] via-[#f1f7fe] to-[#e4f0fc] text-slate-900 rounded-3xl shadow-sm border border-blue-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold border border-blue-200">
              <Scale className="w-3.5 h-3.5 text-blue-700" />
              <span>Legal Marketplace Agreement & Contract Deed Desk</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
              Construction Service Agreement Text & Format
            </h1>
            <p className="text-xs text-slate-600 font-medium max-w-xl leading-relaxed">
              Standard Indian civil construction agreement format (भवन निर्माण अनुबंध पत्र). Edit text directly, copy full contract text, or print out on A4 paper / legal stamp paper.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 relative z-10">
            <button
              onClick={handlePrint}
              className="btn-gold px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Out (A4 / PDF)</span>
            </button>
            <button
              onClick={handleCopyText}
              className="px-4 py-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 text-white text-xs font-bold flex items-center gap-1.5 transition"
              title="Copy pure text to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-blue-200" />}
              <span>{copied ? 'Copied Full Text!' : 'Copy Text'}</span>
            </button>
            <button
              onClick={resetToSample}
              className="p-2.5 rounded-xl bg-blue-900/60 hover:bg-blue-800 border border-blue-500/50 text-white transition"
              title="Reset to default contract text"
            >
              <RotateCcw className="w-4 h-4 text-blue-300" />
            </button>
          </div>
        </div>

        {/* View Mode Tabs & Stamp Paper Options */}
        <div className="bg-white p-3.5 rounded-2xl border border-blue-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Main 3 View Modes */}
          <div className="flex items-center gap-1 bg-blue-50/80 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('document')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'document'
                  ? 'bg-white text-blue-950 shadow-xs border border-blue-200/60'
                  : 'text-slate-600 hover:text-blue-950'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Printable Agreement Deed</span>
            </button>

            <button
              onClick={() => setViewMode('rawText')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'rawText'
                  ? 'bg-white text-blue-950 shadow-xs border border-blue-200/60'
                  : 'text-slate-600 hover:text-blue-950'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-blue-600" />
              <span>Full Text Editor (Raw Text)</span>
            </button>

            <button
              onClick={() => setViewMode('parameters')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'parameters'
                  ? 'bg-white text-blue-950 shadow-xs border border-blue-200/60'
                  : 'text-slate-600 hover:text-blue-950'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>Fill Project Form</span>
            </button>
          </div>

          {/* Quick Options */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Live Inline Edit Toggle */}
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 select-none hover:bg-slate-100">
              <input
                type="checkbox"
                checked={isLiveEditMode}
                onChange={(e) => setIsLiveEditMode(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="flex items-center gap-1 text-[11px]">
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Live In-line Edit on Page</span>
              </span>
            </label>

            {/* Stamp Paper Top Space Toggle */}
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 bg-amber-50/70 px-3 py-1.5 rounded-xl border border-amber-200/80 select-none hover:bg-amber-100/60">
              <input
                type="checkbox"
                checked={leaveStampSpace}
                onChange={(e) => setLeaveStampSpace(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="flex items-center gap-1 text-[11px] text-amber-900">
                <Stamp className="w-3.5 h-3.5 text-amber-600" />
                <span>Space for ₹100/₹500 E-Stamp Paper</span>
              </span>
            </label>
          </div>
        </div>

        {/* Live Edit Active Notification Banner */}
        {isLiveEditMode && (
          <div className="p-3 bg-blue-50 border border-blue-300 rounded-2xl flex items-center justify-between text-xs text-blue-900 font-bold shadow-2xs animate-pulse">
            <span className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-blue-600" />
              <span>In-line Text Edit is ON: You can click anywhere on the agreement text below to edit or type custom words directly!</span>
            </span>
            <button
              onClick={() => setIsLiveEditMode(false)}
              className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold"
            >
              Done Editing
            </button>
          </div>
        )}
      </div>

      {/* ---------------- VIEW 1: RAW TEXT EDITOR TAB ---------------- */}
      {viewMode === 'rawText' && (
        <div className="print:hidden card p-6 bg-white rounded-3xl border border-blue-200/90 shadow-md space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-blue-100">
            <div>
              <h2 className="text-base font-black text-navy-950 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-600" />
                <span>Agreement Plain Text Format</span>
              </h2>
              <p className="text-xs text-slate-500">
                Copy, modify, or paste this text directly into Microsoft Word, Email, or Legal Document Drafters.
              </p>
            </div>
            <button
              onClick={handleCopyText}
              className="btn-gold px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Entire Text'}</span>
            </button>
          </div>

          <textarea
            rows={24}
            defaultValue={generatePureTextAgreement()}
            className="w-full p-4 font-mono text-xs bg-slate-50 border border-blue-200 rounded-2xl text-slate-900 focus:outline-none focus:border-blue-500 leading-relaxed select-all"
            spellCheck={false}
          />
        </div>
      )}

      {/* ---------------- VIEW 2: PARAMETERS FORM TAB ---------------- */}
      {viewMode === 'parameters' && (
        <div className="print:hidden card p-6 bg-white rounded-3xl border border-blue-200/90 shadow-md space-y-4">
          <h2 className="text-base font-black text-navy-950 flex items-center gap-2 pb-2 border-b border-blue-100">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <span>Customize Agreement Text Fields</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Agreement No.</label>
              <input
                type="text"
                value={contractData.agreementNumber}
                onChange={(e) => setContractData({ ...contractData, agreementNumber: e.target.value })}
                className="w-full px-3 py-2 border border-blue-200 rounded-xl font-mono font-bold bg-blue-50/40 text-navy-950"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Execution Date</label>
              <input
                type="date"
                value={contractData.dateOfExecution}
                onChange={(e) => setContractData({ ...contractData, dateOfExecution: e.target.value })}
                className="w-full px-3 py-2 border border-blue-200 rounded-xl font-semibold bg-white text-navy-950"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jurisdiction City</label>
              <input
                type="text"
                value={contractData.cityOfJurisdiction}
                onChange={(e) => setContractData({ ...contractData, cityOfJurisdiction: e.target.value })}
                className="w-full px-3 py-2 border border-blue-200 rounded-xl font-semibold bg-white text-navy-950"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Client (First Party)</label>
              <input
                type="text"
                value={contractData.clientName}
                onChange={(e) => setContractData({ ...contractData, clientName: e.target.value })}
                className="w-full px-3 py-2 border border-blue-200 rounded-xl font-bold bg-white text-navy-950"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Father / Spouse Name</label>
              <input
                type="text"
                value={contractData.clientFatherName}
                onChange={(e) => setContractData({ ...contractData, clientFatherName: e.target.value })}
                className="w-full px-3 py-2 border border-blue-200 rounded-xl font-semibold bg-white text-navy-950"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Client Phone</label>
              <input
                type="text"
                value={contractData.clientPhone}
                onChange={(e) => setContractData({ ...contractData, clientPhone: e.target.value })}
                className="w-full px-3 py-2 border border-blue-200 rounded-xl font-semibold bg-white text-navy-950"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Plot Address</label>
              <input
                type="text"
                value={contractData.plotAddress}
                onChange={(e) => setContractData({ ...contractData, plotAddress: e.target.value })}
                className="w-full px-3 py-2 border border-blue-200 rounded-xl font-semibold bg-white text-navy-950"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Plot Dimensions</label>
              <input
                type="text"
                value={contractData.plotDimensions}
                onChange={(e) => setContractData({ ...contractData, plotDimensions: e.target.value })}
                className="w-full px-3 py-2 border border-blue-200 rounded-xl font-semibold bg-white text-navy-950"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Proposed Built-Up Scope</label>
              <input
                type="text"
                value={contractData.builtUpArea}
                onChange={(e) => setContractData({ ...contractData, builtUpArea: e.target.value })}
                className="w-full px-3 py-2 border border-blue-200 rounded-xl font-semibold bg-white text-navy-950"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Assigned Professional</label>
              <input
                type="text"
                value={contractData.professionalName}
                onChange={(e) => setContractData({ ...contractData, professionalName: e.target.value })}
                className="w-full px-3 py-2 border border-blue-200 rounded-xl font-bold bg-white text-navy-950"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Professional Registration No.</label>
              <input
                type="text"
                value={contractData.professionalCOA}
                onChange={(e) => setContractData({ ...contractData, professionalCOA: e.target.value })}
                className="w-full px-3 py-2 border border-blue-200 rounded-xl font-semibold bg-white text-navy-950"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Contract Sum (₹)</label>
              <input
                type="number"
                value={contractData.totalContractValue}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setContractData({ ...contractData, totalContractValue: val });
                }}
                className="w-full px-3 py-2 border border-blue-200 rounded-xl font-bold font-mono bg-white text-navy-950"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setViewMode('document')}
              className="btn-gold px-6 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md"
            >
              <span>View Formatted Agreement Deed</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 
        -------------------------------------------------------------
        OFFICIAL PRINTABLE AGREEMENT DOCUMENT DEED
        (Standard Legal Deed Format • A4 & Stamp Paper Ready)
        ------------------------------------------------------------- 
      */}
      <div
        contentEditable={isLiveEditMode}
        suppressContentEditableWarning={true}
        className={`bg-white p-8 sm:p-14 md:p-16 rounded-3xl shadow-xl border border-blue-200/90 text-slate-900 font-serif leading-relaxed text-sm relative print:p-0 print:border-none print:shadow-none print:rounded-none ${
          isLiveEditMode ? 'ring-4 ring-blue-400/40 outline-dashed outline-2 outline-blue-500' : ''
        }`}
      >
        {/* Optional 4-Inch Stamp Paper Space (When printing onto Non-Judicial E-Stamp Paper) */}
        {leaveStampSpace && (
          <div className="mb-12 border-2 border-dashed border-amber-300 p-8 rounded-2xl bg-amber-50/40 text-center font-sans text-xs text-amber-900 print:mb-32 print:border-none print:bg-transparent print:text-transparent select-none">
            <div className="w-8 h-8 mx-auto rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold mb-2">
              <Stamp className="w-4 h-4" />
            </div>
            <strong>[TOP SPACE RESERVED FOR ₹100 / ₹500 NON-JUDICIAL E-STAMP PAPER]</strong>
            <p className="text-[11px] text-amber-700 mt-0.5">
              The first page text will print below this line so the official government stamp header remains visible.
            </p>
          </div>
        )}

        {/* ---------------- DOCUMENT HEADER & LETTERHEAD ---------------- */}
        <div className="border-b-2 border-slate-900 pb-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans">
          <div className="flex items-center gap-3">
            <BrandLogo size="md" theme="light" />
            <div>
              <div className="text-xl sm:text-2xl font-black font-display tracking-tight text-navy-950 uppercase">
                BuildGhar Marketplace
              </div>
              <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                Engineering Council & IEI Audited Civil Construction Desk
              </div>
              <div className="text-[9px] text-slate-400">
                Corporate Reg: DL-ND-2026-GHAR9042 • GSTIN: 07AAACB9042K1Z9
              </div>
            </div>
          </div>

          <div className="text-right text-xs space-y-0.5 shrink-0">
            <div className="font-mono font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-md border border-slate-300 inline-block">
              REF: {contractData.agreementNumber}
            </div>
            <div className="text-[11px] text-slate-600">
              Date: <strong>{contractData.dateOfExecution}</strong>
            </div>
            <div className="text-[10px] text-slate-500">
              Place: <strong>{contractData.cityOfJurisdiction}</strong>
            </div>
          </div>
        </div>

        {/* ---------------- DEED TITLE ---------------- */}
        <div className="text-center space-y-1 mb-8">
          <div className="inline-block px-3 py-1 rounded-full bg-slate-100 font-sans text-[10px] font-bold tracking-widest uppercase text-slate-700 border border-slate-300">
            Legal Binding Tripartite Agreement
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-black font-display text-navy-950 uppercase tracking-tight">
            भवन निर्माण एवं वास्तुकला अनुबंध पत्र
          </h2>
          <div className="text-xs sm:text-sm font-black font-display text-slate-800 uppercase tracking-wider">
            (Tripartite Civil Construction & Milestone Escrow Master Agreement)
          </div>
          <p className="font-sans text-xs text-slate-600 max-w-xl mx-auto pt-1">
            Governed under Indian Contract Act, 1872, Engineering Council (IEI) Guidelines, and BuildGhar Milestone Escrow Protection Rules.
          </p>
        </div>

        {/* ---------------- PARTIES INVOLVED ---------------- */}
        <div className="space-y-4 mb-8 text-xs font-sans">
          <p className="font-serif text-sm italic text-slate-800">
            This Master Agreement is entered into on this <strong>{contractData.dateOfExecution}</strong> by and between:
          </p>

          {/* Party 1: The Client */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
            <div className="font-bold text-navy-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-navy-950 text-white flex items-center justify-center text-[10px] font-black">1</span>
              <span>THE FIRST PARTY (PROPERTY OWNER / CLIENT / गृहस्वामी):</span>
            </div>
            <div className="pl-6 space-y-0.5 text-slate-700">
              <div><strong>Full Name:</strong> {contractData.clientName}</div>
              <div><strong>Son / Daughter / Spouse of:</strong> {contractData.clientFatherName}</div>
              <div><strong>Plot / Site Address:</strong> {contractData.plotAddress}</div>
              <div><strong>Contact Details:</strong> Phone: {contractData.clientPhone} • Email: {contractData.clientEmail}</div>
              <div><strong>Identity (Aadhar Ref):</strong> {contractData.clientAadhar}</div>
              <div className="text-[10px] text-slate-500 italic mt-0.5">
                (Hereinafter called the <strong>"OWNER"</strong>, which expression shall include their legal heirs, executors, and assigns).
              </div>
            </div>
          </div>

          {/* Party 2: The Professional / Contractor */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
            <div className="font-bold text-navy-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-navy-950 text-white flex items-center justify-center text-[10px] font-black">2</span>
              <span>THE SECOND PARTY (PROFESSIONAL / CIVIL CONTRACTOR / ठेकेदार):</span>
            </div>
            <div className="pl-6 space-y-0.5 text-slate-700">
              <div><strong>Lead Professional / Contractor:</strong> {contractData.professionalName}</div>
              <div><strong>Firm / Registered Entity:</strong> {contractData.firmName}</div>
              <div><strong>COA / Engineering License:</strong> COA Reg: {contractData.professionalCOA} • {contractData.contractorLicense}</div>
              <div><strong>Contact Details:</strong> Phone: {contractData.professionalPhone} • Email: {contractData.professionalEmail}</div>
              <div className="text-[10px] text-slate-500 italic mt-0.5">
                (Hereinafter called the <strong>"PROFESSIONAL / CONTRACTOR"</strong>, which expression shall include their partners and assigns).
              </div>
            </div>
          </div>

          {/* Party 3: The Platform Facilitator */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
            <div className="font-bold text-navy-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-navy-950 text-white flex items-center justify-center text-[10px] font-black">3</span>
              <span>THE THIRD PARTY (PLATFORM ESCROW & QUALITY DESK):</span>
            </div>
            <div className="pl-6 space-y-0.5 text-slate-700">
              <div><strong>Company:</strong> BuildGhar Technologies India Private Limited</div>
              <div><strong>Registered Desk:</strong> Operations & Escrow Trust Division, Connaught Place, New Delhi 110001</div>
              <div><strong>Role:</strong> Neutral Marketplace Facilitator, Independent Chartered Quality Auditor & Escrow Tranche Disbursal Desk.</div>
              <div className="text-[10px] text-slate-500 italic mt-0.5">
                (Hereinafter called the <strong>"BUILDGHAR PLATFORM"</strong>).
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- NUMBERED OPERATIVE CLAUSES (TEXT FORMAT) ---------------- */}
        <div className="space-y-6 text-xs font-sans leading-relaxed text-slate-800">
          <div>
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
              1. SCOPE OF CIVIL & ENGINEERING WORKS (कार्य का विवरण)
            </h3>
            <p>
              1.1 The Owner engages the Professional/Contractor to execute full engineering planning, municipal submission sets, 3D elevations, RCC structural framing, masonry, electrical, plumbing, tiling, and complete finishing works at the property located at <strong>{contractData.plotAddress}</strong>.
            </p>
            <p className="mt-1">
              1.2 <strong>Plot Area:</strong> {contractData.plotDimensions}. <strong>Proposed Total Built-Up Area:</strong> {contractData.builtUpArea}.
            </p>
            <p className="mt-1">
              1.3 Structural drawings must strictly adhere to <strong>IS 456:2000 (Plain & Reinforced Concrete)</strong> and <strong>IS 1893:2016 (Earthquake Resistance Design)</strong>. Structural load calculations must be signed by an IEI licensed structural engineer before footing casting.
            </p>
          </div>

          <div>
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
              2. AGREED RATE & FIXED CONSIDERATION (दर एवं कुल अनुबंध राशि)
            </h3>
            <p>
              2.1 The agreed lump-sum construction rate is <strong>₹{contractData.ratePerSqFt} per sq.ft</strong> of covered built-up slab area.
            </p>
            <p className="mt-1">
              2.2 The total agreed fixed contract sum for the full execution is <strong>₹{contractData.totalContractValue.toLocaleString('en-IN')} ({contractData.totalValueInWords})</strong> inclusive of material, labor, engineering supervision, freight, and taxes.
            </p>
            <p className="mt-1">
              2.3 <strong>No Price Escalation (मूल्य वृद्धि निषेध):</strong> The agreed rate is fixed. Price fluctuations in cement, steel, sand, or labor during the course of construction shall NOT entitle the Contractor to claim any price enhancement.
            </p>
          </div>

          {/* ---------------- 10-STAGE ESCROW PAYMENT SCHEDULE ---------------- */}
          <div>
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 flex items-center justify-between">
              <span>3. 10-STAGE MILESTONE PAYMENT SCHEDULE (भुगतान की किश्तें)</span>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">100% Escrow Protected</span>
            </h3>
            <p className="mb-2.5">
              The Owner shall deposit milestone funds into the BuildGhar Escrow Account. Funds are released in progressive tranches only after on-site photographic inspection and digital approval:
            </p>

            {/* Tranches Table */}
            <div className="border border-slate-300 rounded-xl overflow-hidden font-sans text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold text-[11px]">
                    <th className="py-2 px-3 w-16">Tranche</th>
                    <th className="py-2 px-3">Milestone Stage (कार्य का चरण)</th>
                    <th className="py-2 px-3 hidden sm:table-cell">Technical Scope (कार्य विवरण)</th>
                    <th className="py-2 px-3 w-20 text-center">% Tranche</th>
                    <th className="py-2 px-3 w-28 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {milestoneTranches.map((t) => (
                    <tr key={t.stage} className="hover:bg-slate-50/80">
                      <td className="py-2 px-3 font-mono font-bold text-slate-600">Stage {t.stage}</td>
                      <td className="py-2 px-3 font-bold text-navy-950">{t.name}</td>
                      <td className="py-2 px-3 text-[11px] text-slate-600 hidden sm:table-cell">{t.scope}</td>
                      <td className="py-2 px-3 font-mono font-bold text-center text-slate-800">{t.percentage}%</td>
                      <td className="py-2 px-3 font-mono font-bold text-right text-navy-950">₹{t.amountPaise.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100/90 font-black text-navy-950 border-t-2 border-slate-300">
                    <td colSpan={3} className="py-2.5 px-3 text-right uppercase tracking-wider text-[11px]">
                      Total Guaranteed Escrow Contract Sum:
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">100%</td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-sm">
                      ₹{contractData.totalContractValue.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
              4. MATERIAL SPECIFICATIONS (सामग्री एवं गुणवत्ता मानक)
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Steel:</strong> Primary TMT Fe-550D (Tata Tiscon / Jindal Panther) with manufacturer test slips.</li>
              <li><strong>Cement:</strong> Grade 43/53 Portland Pozzolana Cement (UltraTech Super / Ambuja / ACC).</li>
              <li><strong>Aggregates:</strong> 10mm & 20mm blue granite metal, washed coarse river sand (Zone-II).</li>
              <li><strong>Plumbing & Electrical:</strong> Astral CPVC pipes, Polycab/Finolex FRLS fire-retardant copper wiring.</li>
              <li>{contractData.specialConditions}</li>
            </ul>
          </div>

          <div>
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
              5. TIMELINE & DELAYS (समय सीमा एवं विलम्ब शुल्क)
            </h3>
            <p>
              5.1 Total duration for full completion and handover is fixed at <strong>{contractData.projectDurationDays} Calendar Days</strong> from site handover.
            </p>
            <p className="mt-1">
              5.2 <strong>Liquidated Delay Penalties:</strong> If completion is delayed beyond 30 days without written force majeure approval, the Contractor shall pay <strong>0.25% per week</strong> of the delayed tranche, capped at 5% of total contract value.
            </p>
          </div>

          <div>
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
              6. WATER, ELECTRICITY & SITE SECURITY (पानी एवं बिजली व्यवस्था)
            </h3>
            <p>
              6.1 The Owner shall provide access to borewell/municipal water suitable for concrete curing and a temporary electrical connection at the plot boundary.
            </p>
            <p className="mt-1">
              6.2 The Contractor is solely responsible for on-site material security, temporary labor sheds, and site cleanliness.
            </p>
          </div>

          <div>
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
              7. EXTRA WORK & VARIATION ORDERS (अतिरिक्त कार्य नियम)
            </h3>
            <p>
              No extra work or modification of the engineering plan shall be executed without prior written Variation Order signed by the Owner specifying exact rates and timeline adjustments.
            </p>
          </div>

          <div>
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
              8. LABOR COMPLIANCE & SAFETY (श्रमिक सुरक्षा एवं बीमा)
            </h3>
            <p>
              The Contractor shall strictly comply with the Workmen’s Compensation Act, 1923, and provide mandatory safety helmets, safety nets, and harnesses on site. The Owner shall bear zero liability for any worker injury or mishap on site.
            </p>
          </div>

          <div>
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
              9. 10-YEAR RCC STRUCTURAL WARRANTY (10 वर्ष स्ट्रक्चरल गारंटी)
            </h3>
            <p>
              9.1 The Contractor provides a <strong>{contractData.rccStructuralWarrantyYears}-Year Written Guarantee</strong> against structural settlement, beam cracks, column deflection, or slab leakage.
            </p>
            <p className="mt-1">
              9.2 A <strong>{contractData.defectLiabilityPeriodMonths}-Month Defect Liability Period (DLP)</strong> applies from keys handover for any plumbing leaks, electrical switch failures, or woodwork shrinkage.
            </p>
          </div>

          <div>
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
              10. DISPUTE RESOLUTION & ARBITRATION (विवाद निपटारा)
            </h3>
            <p>
              Any dispute between the Owner and Contractor shall first be referred to the BuildGhar Neutral Engineering Desk for fast-track 14-day technical conciliation. If unresolved, it shall be referred to arbitration in accordance with the Arbitration and Conciliation Act, 1996 in <strong>{contractData.arbitrationSeat}</strong>.
            </p>
          </div>
        </div>

        {/* ---------------- SIGNATURES & STAMPS BLOCK ---------------- */}
        <div className="mt-12 pt-8 border-t-2 border-slate-900 font-sans">
          <div className="text-center font-bold text-xs uppercase tracking-widest text-slate-600 mb-8">
            IN WITNESS WHEREOF, the parties have signed this Agreement on the date hereinabove written:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            {/* Signature 1: Owner */}
            <div className="border border-slate-300 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between min-h-[160px] text-center">
              <div className="space-y-1">
                <div className="font-black text-navy-950 uppercase text-[11px]">FIRST PARTY</div>
                <div className="text-[10px] text-slate-500">Property Owner / गृहस्वामी</div>
              </div>

              <div className="my-6 border-b border-dashed border-slate-400"></div>

              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 text-[11px]">{contractData.clientName}</div>
                <div className="text-[9px] text-slate-500">Signature / अंगूठा & Date</div>
              </div>
            </div>

            {/* Signature 2: Professional */}
            <div className="border border-slate-300 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between min-h-[160px] text-center">
              <div className="space-y-1">
                <div className="font-black text-navy-950 uppercase text-[11px]">SECOND PARTY</div>
                <div className="text-[10px] text-slate-500">Professional / Contractor / ठेकेदार</div>
              </div>

              <div className="my-6 border-b border-dashed border-slate-400"></div>

              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 text-[11px]">{contractData.professionalName}</div>
                <div className="text-[9px] text-slate-500">Stamp, Seal & Registration No.</div>
              </div>
            </div>

            {/* Signature 3: BuildGhar Platform */}
            <div className="border border-slate-300 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between min-h-[160px] text-center">
              <div className="space-y-1">
                <div className="font-black text-navy-950 uppercase text-[11px]">THIRD PARTY</div>
                <div className="text-[10px] text-slate-500">BuildGhar Platform Escrow Desk</div>
              </div>

              <div className="my-6 border-b border-dashed border-slate-400"></div>

              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 text-[11px]">Authorized Escrow Officer</div>
                <div className="text-[9px] text-slate-500">Corporate Seal & Audit Stamp</div>
              </div>
            </div>
          </div>

          {/* Two Witnesses Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-200 text-xs">
            <div className="space-y-1">
              <div className="font-bold text-slate-800 text-[11px]">गवाह 1 (WITNESS 1):</div>
              <div className="h-6 border-b border-dashed border-slate-300"></div>
              <div className="text-[10px] text-slate-500">Name, Father's Name & Address:</div>
            </div>
            <div className="space-y-1">
              <div className="font-bold text-slate-800 text-[11px]">गवाह 2 (WITNESS 2):</div>
              <div className="h-6 border-b border-dashed border-slate-300"></div>
              <div className="text-[10px] text-slate-500">Name, Father's Name & Address:</div>
            </div>
          </div>

          {/* Document Footer */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-sans">
            <div>BuildGhar Master Contract Deed Ref: {contractData.agreementNumber}</div>
            <div>Page 1 of 1 • Official Legal Copy</div>
            <div>Confidential & Legally Privileged Document</div>
          </div>
        </div>

      </div>
    </div>
  );
};
