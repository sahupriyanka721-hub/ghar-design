import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Badge } from '../../components/common/Badge.js';
import { formatDate } from '../../lib/utils.js';
import { FileText, PlusCircle, ChevronRight, FileCheck2, Building, Eye, ArrowRight, MapPin, Download, Receipt } from 'lucide-react';
import { getPlatformRequests, syncChannel, PlatformProjectRequest } from '../../data/customerStore.js';
import { downloadInquiryReceiptPdf } from '../../lib/pdfGenerator.js';
import { useToast } from '../../context/ToastContext.js';

export const MyRequests: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success } = useToast();
  const [requests, setRequests] = useState<PlatformProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCustomerRequests = () => {
    try {
      const all = getPlatformRequests();
      const rawPhone = user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : '';
      const lastCreatedId = typeof window !== 'undefined' ? sessionStorage.getItem('last_created_request_id') : null;

      let userRequests = all.filter((r) => {
        if (!r) return false;
        if (lastCreatedId && (r.id === lastCreatedId || r.requestCode === lastCreatedId)) return true;
        if (user?.id && r.customerId === user.id) return true;
        if (rawPhone && r.customerPhone) {
          const rPhone = r.customerPhone.replace(/\D/g, '').slice(-10);
          if (rPhone === rawPhone) return true;
        }
        if (user?.name && r.customerName && r.customerName.toLowerCase() === user.name.toLowerCase()) return true;
        return false;
      });

      // If user filter matched nothing, show all real requests on this device so the user can inspect them
      if (userRequests.length === 0 && all.length > 0) {
        userRequests = all;
      }

      setRequests(userRequests);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerRequests();

    const interval = setInterval(loadCustomerRequests, 30000);
    window.addEventListener('storage', loadCustomerRequests);

    const onSync = (event: MessageEvent) => {
      if (event.data?.type === 'PROJECT_REQUESTS_UPDATED' || event.data?.type === 'DATA_PURGED') {
        loadCustomerRequests();
      }
    };
    if (syncChannel) {
      syncChannel.addEventListener('message', onSync);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadCustomerRequests);
      if (syncChannel) {
        syncChannel.removeEventListener('message', onSync);
      }
    };
  }, [user?.phone, user?.id, user?.name]);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-navy-950">My Project Requests</h1>
          <p className="text-xs text-slate-500">Track and manage your submitted construction and structural planning inquiries.</p>
        </div>
        <Link to="/dashboard/create-request" className="btn-gold text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm">
          <PlusCircle className="w-4 h-4" />
          <span>New Project Request</span>
        </Link>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="card p-10 text-center space-y-4 bg-white border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 mx-auto flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm font-display">No Project Requests Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                You haven't submitted any engineering or construction inquiries yet. Submit your plot details to receive comparative BOQ quotations.
              </p>
            </div>
            <Link
              to="/dashboard/create-request"
              className="btn-gold text-xs py-2.5 px-5 inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Project Inquiry (Step-by-Step)</span>
            </Link>
          </div>
        ) : (
          requests.map((req) => {
            const targetId = req.requestCode || req.id;
            return (
              <div
                key={req.id}
                onClick={() => navigate(`/dashboard/requests/${targetId}`)}
                className="card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-sky-400 hover:shadow-md hover:bg-sky-50/25 transition-all bg-white border border-slate-200 rounded-2xl cursor-pointer group"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold font-display text-navy-950 text-base sm:text-lg group-hover:text-sky-700 transition">
                      {req.requestCode || req.id}
                    </span>
                    <Badge status={req.status} />
                    <span className="text-[11px] text-sky-700 font-bold opacity-0 group-hover:opacity-100 transition hidden sm:inline-flex items-center gap-1">
                      <span>Click to view details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>
                      <strong>Category:</strong> {req.categorySlug?.replace(/-/g, ' ')}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      <strong>Location:</strong> {req.locality}, {req.city}
                    </span>
                    <span>
                      <strong>Plot Area:</strong> {req.plotArea} {req.measurementUnit?.toLowerCase() || 'ft'}²
                    </span>
                    <span>
                      <strong>Budget:</strong> {req.budgetRange || 'Flexible'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 md:pt-0 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => {
                      const f = downloadInquiryReceiptPdf(req);
                      success(`Receipt downloaded: ${f}`);
                    }}
                    className="p-2 sm:px-3 sm:py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer"
                    title="Download official inquiry fee receipt PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="hidden sm:inline">Receipt PDF</span>
                  </button>

                  {req.status === 'QUOTATIONS_AVAILABLE' && (
                    <Link
                      to={`/dashboard/requests/${targetId}/quotations`}
                      className="btn-gold py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shadow-xs"
                    >
                      <FileCheck2 className="w-4 h-4" />
                      <span>Compare Quotations</span>
                    </Link>
                  )}
                  <Link
                    to={`/dashboard/requests/${targetId}`}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
