import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileEdit, Users, CheckCircle, ShieldCheck, Scale } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <h1 className="text-xs font-bold uppercase tracking-widest text-gold-600">Step-by-Step Workflow</h1>
        <h2 className="text-3xl sm:text-4xl font-bold font-display text-navy-950">
          How GharDesign Delivers Multiple Vetted Quotations
        </h2>
        <p className="text-slate-600 text-sm">
          A completely structured, transparent mechanism designed specifically for Indian civil and building construction projects.
        </p>
      </div>

      <div className="space-y-8">
        <div className="card p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-xl bg-gold-100 text-gold-800 font-bold font-display text-xl flex items-center justify-center flex-shrink-0">
            01
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold font-display text-navy-950">
              Submit Validated Property Specifications
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Use our interactive 5-step wizard to define your plot width, length, unit (feet or metres), built-up area,
              number of floors, and specific deliverables (e.g. 2D floor plans, 3D elevation, structural drawings, or full civil construction).
              Pay a nominal quotation request fee of ₹499 to activate technical assignment.
            </p>
          </div>
        </div>

        <div className="card p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-xl bg-navy-100 text-navy-900 font-bold font-display text-xl flex items-center justify-center flex-shrink-0">
            02
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold font-display text-navy-950">
              Administrative Assignment to Matching Professionals
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our engineering team analyzes your requirements and assigns 2 to 4 licensed professionals in your region.
              The assignment includes a strict submission deadline. Each professional inspects the project scope independently
              without seeing competing bids.
            </p>
          </div>
        </div>

        <div className="card p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-900 font-bold font-display text-xl flex items-center justify-center flex-shrink-0">
            03
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold font-display text-navy-950">
              Admin Review & Publishing (Quality Gate)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Before any quote reaches you, the GharDesign administrator verifies the bill of quantities, line item rates,
              deliverable guarantees, and exclusions. If a quotation is unclear or contains hidden traps, the admin returns it to the
              professional for correction. Only approved quotations are published to your dashboard.
            </p>
          </div>
        </div>

        <div className="card p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-900 font-bold font-display text-xl flex items-center justify-center flex-shrink-0">
            04
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold font-display text-navy-950">
              Side-by-Side Comparison & Secure Booking
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Log into your customer dashboard and open our Side-by-Side Comparison Matrix. Compare firm credentials,
              experience, itemized rates, revisions count, and milestone breakdown. Select the professional best suited for your
              vision and book with complete confidence.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center pt-4">
        <Link to="/dashboard/create-request" className="btn-gold py-3 px-8 text-sm font-semibold inline-flex items-center gap-2">
          <span>Get Started with Your Project</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
