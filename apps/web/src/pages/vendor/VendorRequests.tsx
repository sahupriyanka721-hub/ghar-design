import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  getVendorMaterialRequests,
  saveVendorMaterialRequest,
  VendorMaterialRequest,
} from '../../data/vendorStore.js';
import {
  FileText,
  MapPin,
  Calendar,
  ArrowRight,
  Package,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

export const VendorRequests: React.FC = () => {
  const [requests, setRequests] = useState<VendorMaterialRequest[]>([]);
  const [search, setSearch] = useState('');

  const loadRequests = () => {
    const list = getVendorMaterialRequests();
    setRequests(list);
  };

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 3000);
    return () => clearInterval(interval);
  }, []);

  const filtered = requests.filter((r) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.requestCode.toLowerCase().includes(q) ||
        r.materialItem.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-display text-navy-950">
            Material Procurement Requests ({requests.length})
          </h1>
          <p className="text-xs text-slate-500">
            Direct bulk procurement requests submitted by verified homeowners and project engineers.
          </p>
        </div>

        <Link
          to="/vendor/quotations"
          className="px-4 py-2 bg-navy-950 hover:bg-navy-900 text-gold-400 font-display font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
        >
          <span>My Submitted Quotations</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-blue-200/80/90 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search material inquiries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-sky-50/30 border border-blue-200/80 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-950"
          />
        </div>
      </div>

      {/* Requests Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-blue-200/80/90 p-12 text-center text-slate-500 shadow-xs space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Open Material Inquiries</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            When a homeowner or project contractor requests bulk material estimates, inquiry details will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((req) => (
            <div key={req.id} className="bg-white rounded-3xl border border-blue-200/80/90 p-6 shadow-xs space-y-4 text-xs">
              <div className="flex justify-between items-start">
                <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md">
                  {req.requestCode}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  {req.status}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-navy-950">{req.materialItem}</h3>
                {req.builtUpAreaSqFt && (
                  <span className="inline-block mt-1 text-[11px] font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-md">
                    Built-up Area: {req.builtUpAreaSqFt} sq.ft
                  </span>
                )}
                {!req.items?.length && (
                  <div className="text-slate-600 mt-1">
                    Required Volume: <strong>{req.requiredQuantity} {req.unit}</strong>
                  </div>
                )}
              </div>

              {/* Multi-Item BOQ Breakdown if available */}
              {req.items && req.items.length > 0 && (
                <div className="space-y-1.5 p-3 bg-blue-50/70 rounded-2xl border border-blue-200/80/80">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Bill of Quantities (Requested Items):
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {(req.items || []).map((it, idx) => (
                      <div key={idx} className="bg-white p-2 rounded-lg border border-blue-200/80 flex justify-between items-center">
                        <span className="text-slate-700 font-medium truncate pr-1">{it.name}</span>
                        <span className="font-mono font-bold text-navy-950 shrink-0">{it.quantity} {it.unit.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 bg-sky-50/30 rounded-2xl border border-blue-200/80/80 space-y-1.5 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Site: {req.deliverySiteAddress}, <strong>{req.city}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Delivery Expected By: {formatDate(req.requiredByDate)}</span>
                </div>
                {req.customerName && (
                  <div className="text-slate-500 text-[10px]">
                    Client: <strong>{req.customerName}</strong> {req.customerPhone ? `(${req.customerPhone})` : ''}
                  </div>
                )}
              </div>

              {req.notes && (
                <p className="text-[11px] text-slate-500 italic bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                  Client note: "{req.notes}"
                </p>
              )}

              <Link
                to={`/vendor/quotations?requestId=${req.id}`}
                className="w-full py-2.5 bg-gradient-to-r from-navy-950 to-navy-900 hover:from-amber-600 hover:to-amber-700 text-gold-400 hover:text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition"
              >
                <span>Submit Depot Quotation</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
