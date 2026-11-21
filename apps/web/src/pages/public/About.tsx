import React from 'react';
import { ShieldCheck, Award, Users, Compass, Building, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const About: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Intro */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-xs font-bold uppercase tracking-widest text-gold-600">About GharDesign</h1>
        <h2 className="text-3xl sm:text-4xl font-bold font-display text-navy-950">
          Rebuilding Trust in the Indian Construction Sector
        </h2>
        <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
          GharDesign was founded with one clear mission: to eliminate the uncertainty, opaque cost markups,
          and lack of accountability that homeowners traditionally experience during house construction and interior fitouts in India.
        </p>
      </div>

      {/* Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="card p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-gold-50 text-gold-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold font-display text-navy-950">Verified Associate Network</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every civil engineer, contractor, and interior designer on our platform undergoes rigorous credential
            verification against industry council records, engineering degrees, and past site handovers.
          </p>
        </div>

        <div className="card p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold font-display text-navy-950">Non-Cheapest Guarantee</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            We never race to the bottom. Substandard materials cause structural distress. We emphasize transparent
            specifications (grade of steel, cement, waterproofing warranties) so customers make educated decisions.
          </p>
        </div>

        <div className="card p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Compass className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold font-display text-navy-950">Customer-Centric Privacy</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Unlike lead aggregator sites, we do not blast your phone number to dozens of vendors. You compare verified
            quotations securely through your private portal.
          </p>
        </div>
      </div>

      {/* Operational Model */}
      <div className="card p-8 bg-navy-950 text-white rounded-2xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <h3 className="text-2xl font-bold font-display text-white">How GharDesign Operates</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            GharDesign operates as a neutral technological and engineering intermediary.
            When you post a requirement, our internal engineers review your plot specifications,
            set an assignment deadline, and request custom proposals from our vetted partner firms.
          </p>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gold-400" /> Administrative review of every submitted quotation
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gold-400" /> Standardized drawing formats (DWG, 4K PDF, 3D Renders)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gold-400" /> Milestone-based escrow / advance payment guidance
            </li>
          </ul>
        </div>
        <div className="text-center lg:text-right">
          <Link to="/dashboard/create-request" className="btn-gold py-3 px-6 text-xs font-semibold">
            Post Your Construction Requirement
          </Link>
        </div>
      </div>
    </div>
  );
};
