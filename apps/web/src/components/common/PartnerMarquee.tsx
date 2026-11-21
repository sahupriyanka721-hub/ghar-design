import React from 'react';
import { ShieldCheck, Award, CheckCircle2, Sparkles, Building2, Landmark } from 'lucide-react';

const partners = [
  { name: 'NBC Compliant', sub: 'National Building Code India', icon: Building2 },
  { name: 'IEI Certified', sub: 'Institution of Engineers India', icon: ShieldCheck },
  { name: 'IS 456 / IS 1893', sub: 'Earthquake & RCC Standards', icon: Award },
  { name: '100% Vastu Aligned', sub: 'Vedic Layout & Guidelines', icon: Sparkles },
  { name: 'Tata Tiscon 550D', sub: 'Primary Steel Benchmarks', icon: Landmark },
  { name: 'UltraTech Approved', sub: 'Grade M25+ Concrete Standards', icon: CheckCircle2 },
  { name: 'Milestone Escrow', sub: '100% Contractor Payment Protection', icon: Sparkles },
];

export const PartnerMarquee: React.FC = () => {
  return (
    <div className="relative w-full overflow-hidden py-4 sm:py-5 bg-gradient-to-r from-[#edf4fc] via-[#f5f9fe] to-[#edf4fc] border-y border-blue-200/90 text-navy-950 select-none shadow-xs">
      {/* Left & Right Gradient Shadows for seamless fade */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#edf4fc] via-[#edf4fc]/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#edf4fc] via-[#edf4fc]/80 to-transparent z-10 pointer-events-none" />

      {/* Marquee Track: Duplicated list for seamless infinite loop */}
      <div className="flex w-max animate-marquee space-x-8">
        {[...partners, ...partners, ...partners].map((partner, idx) => {
          const Icon = partner.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-3.5 px-5 py-3 rounded-2xl bg-white/95 border border-blue-200/80 hover:border-amber-400 hover:bg-white transition-all duration-300 group cursor-default shadow-xs"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 group-hover:bg-amber-500 group-hover:text-navy-950 transition-colors flex items-center justify-center border border-amber-300/80">
                <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div>
                <div className="text-xs font-black font-display tracking-wide text-navy-950 group-hover:text-blue-700 transition-colors">
                  {partner.name}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {partner.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
