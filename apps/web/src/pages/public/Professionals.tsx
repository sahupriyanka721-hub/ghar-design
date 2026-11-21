import React, { useState, useEffect } from 'react';
import { ShieldCheck, Award, MapPin, Building, Briefcase, HardHat, ArrowRight, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPlatformProfessionals, PlatformProfessional } from '../../data/customerStore.js';

export const Professionals: React.FC = () => {
  const [professionals, setProfessionals] = useState<PlatformProfessional[]>([]);

  useEffect(() => {
    const list = getPlatformProfessionals().filter(
      (p) => p.isVerified && p.verificationStatus === 'APPROVED'
    );
    setProfessionals(list);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <h1 className="text-xs font-bold uppercase tracking-widest text-gold-600">Associate Network</h1>
        <h2 className="text-3xl sm:text-4xl font-bold font-display text-navy-950">
          Meet Our Verified Associate Professionals
        </h2>
        <p className="text-slate-600 text-sm">
          Every civil contractor, structural engineer, and interior designer on GharDesign is individually vetted and accredited with professional licenses.
        </p>
      </div>

      {professionals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {professionals.map((pro) => (
            <div key={pro.id} className="card p-6 flex flex-col justify-between hover:shadow-lg transition">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 font-black flex items-center justify-center text-lg border-2 border-blue-200">
                    <Compass className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy-950 font-display text-base">{pro.name}</h3>
                    <p className="text-xs text-slate-500 capitalize">{pro.category.toLowerCase().replace('_', ' ')}</p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3" /> COA / IEI Verified
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-800">{pro.firmName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-slate-400" />
                    <span>{pro.qualifications}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span>{pro.experienceYears} Years industry experience</span>
                  </div>
                  {pro.serviceCities && pro.serviceCities.length > 0 && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{pro.serviceCities.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4">
                <Link
                  to="/dashboard/create-request"
                  className="btn-outline w-full text-xs py-2 text-center flex items-center justify-center gap-1.5"
                >
                  <span>Request Project Quotation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 bg-white border border-slate-200 text-center rounded-3xl shadow-xs max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto shadow-2xs">
            <Compass className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold font-display text-navy-950">
              Accredited Associate Network
            </h3>
            <p className="text-slate-600 text-xs max-w-md mx-auto leading-relaxed">
              Civil contractors and structural engineering firms are accredited directly through our admin vetting console. Verified partners will be cataloged here once certified.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              to="/professional"
              className="btn-primary py-2.5 px-5 text-xs font-bold font-display flex items-center gap-1.5"
            >
              <HardHat className="w-4 h-4" />
              <span>Partner Workspace Gateway</span>
            </Link>
            <Link
              to="/contact"
              className="btn-outline py-2.5 px-5 text-xs font-bold font-display"
            >
              Apply as Associate Partner
            </Link>
          </div>
        </div>
      )}

      {/* For Professionals Section */}
      <div className="card p-8 bg-slate-100 border-slate-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <h3 className="text-xl font-bold font-display text-navy-950">
            Are you a licensed Contractor or Civil Engineering firm?
          </h3>
          <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
            Join the GharDesign Associate Network. Gain access to verified, qualified homeowners in your city.
            Zero cold-calling, zero commission spam, and transparent administrative milestone handling.
          </p>
        </div>
        <Link to="/contact" className="btn-primary py-3 px-6 text-xs whitespace-nowrap">
          Apply as Associate Partner
        </Link>
      </div>
    </div>
  );
};
