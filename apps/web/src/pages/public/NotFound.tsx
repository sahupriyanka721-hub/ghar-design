import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-5">
        <div className="text-6xl font-extrabold text-gold-600 font-display">404</div>
        <h1 className="text-2xl font-bold font-display text-navy-950">Page Not Found</h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          The page or project you are looking for does not exist or may have been relocated.
        </p>
        <div className="pt-2">
          <Link to="/" className="btn-primary py-2.5 px-6 text-xs inline-flex items-center gap-2">
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
