import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold font-display text-navy-950">Access Restricted (403)</h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          You do not have administrative or appropriate professional clearance to access this portal section.
        </p>
        <div className="pt-2">
          <Link to="/" className="btn-outline py-2.5 px-6 text-xs inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
