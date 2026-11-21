import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { UserRole } from '@ghar-design/shared';
import { ShieldCheck, UserCheck, HardHat, Compass, ChevronDown, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DemoSwitcher: React.FC = () => {
  const { user, switchDemoRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const navigate = useNavigate();

  const handleRoleSwitch = async (role: UserRole, targetRoute: string) => {
    setIsSwitching(true);
    await switchDemoRole(role);
    setIsSwitching(false);
    setIsOpen(false);
    navigate(targetRoute);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-navy-950/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700/60 flex items-center gap-3 text-xs">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>

        <span className="text-slate-400 font-medium hidden sm:inline">Role View:</span>
        <span className="font-semibold text-gold-400 capitalize">{user?.role?.toLowerCase() || 'Guest'}</span>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-navy-800 hover:bg-navy-700 text-white px-2.5 py-1.5 rounded-lg border border-navy-600 transition flex items-center gap-1 font-medium ml-1"
        >
          {isSwitching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Switch'}
          <ChevronDown className="w-3 h-3 text-slate-300" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute bottom-14 left-0 w-64 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-bottom-2">
          <div className="px-3 py-2 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Interactive Persona Switcher
          </div>

          <button
            onClick={() => handleRoleSwitch('CUSTOMER', '/dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition ${
              user?.role === 'CUSTOMER' ? 'bg-amber-50 text-gold-800 font-semibold' : 'hover:bg-slate-50'
            }`}
          >
            <UserCheck className="w-4 h-4 text-amber-600" />
            <div>
              <div className="font-medium text-slate-900">Customer</div>
              <div className="text-[10px] text-slate-500">Vikram Malhotra (Post & Compare)</div>
            </div>
          </button>

          <button
            onClick={() => handleRoleSwitch('PROFESSIONAL', '/professional')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition ${
              user?.role === 'PROFESSIONAL' ? 'bg-blue-50 text-blue-800 font-semibold' : 'hover:bg-slate-50'
            }`}
          >
            <Compass className="w-4 h-4 text-blue-600" />
            <div>
              <div className="font-medium text-slate-900">Associate Professional</div>
              <div className="text-[10px] text-slate-500">Ar. Rajesh Sharma (Build Quote)</div>
            </div>
          </button>

          <button
            onClick={() => handleRoleSwitch('ADMIN', '/admin')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition ${
              user?.role === 'ADMIN' ? 'bg-purple-50 text-purple-800 font-semibold' : 'hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <div>
              <div className="font-medium text-slate-900">Administrator</div>
              <div className="text-[10px] text-slate-500">Assign & Publish Quotations</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
