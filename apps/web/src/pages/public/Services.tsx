import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPlatformCategories, PlatformCategoryItem, syncChannel } from '../../data/customerStore.js';
import { Building2, Hammer, Compass, ShieldCheck, Paintbrush, CheckCircle2, ArrowRight, Sparkles, Eye, Briefcase, Wrench, Calculator, Layers, FileText } from 'lucide-react';

export const Services: React.FC = () => {
  const [categories, setCategories] = useState<PlatformCategoryItem[]>(() => {
    return getPlatformCategories().filter((c) => c.isActive !== false);
  });

  useEffect(() => {
    const loadCategories = () => {
      setCategories(getPlatformCategories().filter((c) => c.isActive !== false));
    };

    const onSync = (event: MessageEvent) => {
      if (event.data?.type === 'CATEGORIES_UPDATED') {
        loadCategories();
      }
    };

    if (syncChannel) {
      syncChannel.addEventListener('message', onSync);
    }
    window.addEventListener('storage', loadCategories);

    return () => {
      if (syncChannel) {
        syncChannel.removeEventListener('message', onSync);
      }
      window.removeEventListener('storage', loadCategories);
    };
  }, []);

  const icons: Record<string, any> = {
    Building2,
    Hammer,
    Compass,
    ShieldCheck,
    Paintbrush,
    CheckCircle2,
    Sparkles,
    Eye,
    Briefcase,
    Wrench,
    Calculator,
    Layers,
    FileText,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <h1 className="text-xs font-bold uppercase tracking-widest text-gold-600">Our Offerings</h1>
        <h2 className="text-3xl sm:text-4xl font-bold font-display text-navy-950">
          Professional Construction & Engineering Services
        </h2>
        <p className="text-slate-600 text-sm">
          Select a category to inspect deliverable specifications, typical deliverables, and request quotations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((cat) => {
          const Icon = icons[cat.icon] || Building2;
          return (
            <div key={cat.slug} className="card p-7 flex flex-col justify-between hover:shadow-lg transition">
              <div>
                <div className="w-12 h-12 rounded-xl bg-navy-50 text-navy-900 flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-display text-navy-950 mb-2">{cat.name}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">{cat.shortDescription}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to={`/services/${cat.slug}`}
                  className="text-xs font-semibold text-navy-900 hover:text-gold-600 flex items-center gap-1"
                >
                  <span>Full Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to={`/dashboard/create-request?category=${cat.slug}`}
                  className="btn-gold py-1.5 px-3 text-xs"
                >
                  Request Quotes
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
