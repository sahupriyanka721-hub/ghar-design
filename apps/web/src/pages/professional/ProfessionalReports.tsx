import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  Star,
  Layers,
  FileCheck2,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react';
import { formatINR } from '../../lib/utils.js';

export const ProfessionalReports: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-navy-950">Performance Reports & Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">
          Quotation conversion rates, project delivery timeliness, monthly revenue metrics, and homeowner satisfaction indices.
        </p>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-sky-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-sky-800 font-mono font-bold">
            <span>WIN CONVERSION RATE</span>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-3xl font-black text-navy-950 font-mono">68.4%</div>
          <div className="flex items-center gap-1 text-[11px] text-blue-700 font-bold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+12% vs platform average</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-blue-800 font-mono font-bold">
            <span>DRAWING APPROVAL SPEED</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-blue-900 font-mono">4.2 Days</div>
          <span className="text-[11px] text-slate-500 font-medium">Average turnaround for concept revisions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-700 font-mono font-bold">
            <span>OVERALL RATING</span>
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-900 font-mono">4.9 / 5.0</div>
          <span className="text-[11px] text-amber-700 font-medium">Based on 14 homeowner reviews</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-blue-800 font-mono font-bold">
            <span>ON-TIME HANDOVER</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-blue-900 font-mono">94.5%</div>
          <span className="text-[11px] text-blue-700 font-medium">Deliverables submitted on schedule</span>
        </div>
      </div>

      {/* Detailed Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quotation Funnel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-sky-600" />
            <span>Quotation Performance Funnel</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between font-mono">
                <span className="text-slate-600">Assigned Requests Received</span>
                <span className="font-bold text-slate-900">18 Requests</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-2 rounded-full w-full" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-mono">
                <span className="text-slate-600">Quotations Prepared & Submitted</span>
                <span className="font-bold text-slate-900">16 (88%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-sky-600 h-2 rounded-full w-[88%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-mono">
                <span className="text-slate-600">Customer Selections & Bookings</span>
                <span className="font-bold text-blue-900">11 Won (68%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-2 rounded-full w-[68%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-mono">
                <span className="text-slate-600">Projects Handed Over Successfully</span>
                <span className="font-bold text-blue-800">8 Completed</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-700 h-2 rounded-full w-[50%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Quality Rating Matrix */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Homeowner Review & Quality Index</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-medium">Vastu & Space Planning</span>
              <div className="flex items-center gap-2 font-mono font-bold text-slate-900">
                <div className="w-28 bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-2 rounded-full w-[98%]" />
                </div>
                <span>4.9 / 5.0</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-medium">3D Elevation & Photorealism</span>
              <div className="flex items-center gap-2 font-mono font-bold text-slate-900">
                <div className="w-28 bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-2 rounded-full w-[96%]" />
                </div>
                <span>4.8 / 5.0</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-medium">Structural Drawings & IS 456 Vetting</span>
              <div className="flex items-center gap-2 font-mono font-bold text-slate-900">
                <div className="w-28 bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-2 rounded-full w-[100%]" />
                </div>
                <span>5.0 / 5.0</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-medium">Site Supervision & Rebar Inspection</span>
              <div className="flex items-center gap-2 font-mono font-bold text-slate-900">
                <div className="w-28 bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-2 rounded-full w-[94%]" />
                </div>
                <span>4.7 / 5.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
