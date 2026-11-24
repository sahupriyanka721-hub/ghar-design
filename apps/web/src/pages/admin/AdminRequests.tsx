import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/common/Badge.js';
import { formatDate } from '../../lib/utils.js';
import { useToast } from '../../context/ToastContext.js';
import { FileText, Users, ChevronRight, Search, Plus, X,
  ArrowLeft, ArrowRight, Check, Building, Phone, User, MapPin, Layers, ShoppingBag } from 'lucide-react';
import { getPlatformRequests, savePlatformRequest, syncChannel, PlatformProjectRequest } from '../../data/customerStore.js';
import { getVendorMaterialRequests, VendorMaterialRequest } from '../../data/vendorStore.js';
import { getArchitectAccounts } from '../../data/architectStore.js';

export const AdminRequests: React.FC = () => {
  const { success, error } = useToast();
  const [requests, setRequests] = useState<PlatformProjectRequest[]>([]);
  const [materialRequests, setMaterialRequests] = useState<VendorMaterialRequest[]>([]);
  const [architects, setArchitects] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'projects' | 'materials'>('projects');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [requestStep, setRequestStep] = useState<number>(1);
  const [newReq, setNewReq] = useState({
    customerName: '',
    customerPhone: '',
    categorySlug: 'new-house-construction',
    propertyType: 'Residential Villa',
    plotArea: 1500,
    measurementUnit: 'SQ_FT',
    city: '',
    locality: '',
    budgetRange: 'Flexible',
    description: '',
    status: 'VERIFIED',
  });

  const loadRequests = () => {
    setRequests(getPlatformRequests());
    setMaterialRequests(getVendorMaterialRequests());
    setArchitects(getArchitectAccounts());
    try {
      const qStored = localStorage.getItem('platform_quotations');
      if (qStored) {
        setQuotations(JSON.parse(qStored));
      }
    } catch {}
  };

  const getRequestAmount = (req: PlatformProjectRequest) => {
    const matchingQuote = quotations.find((q: any) =>
      (q.requestId && (q.requestId === req.id || q.requestId === req.requestCode)) ||
      (q.requestCode && (q.requestCode === req.requestCode || q.requestCode === req.id))
    );
    if (matchingQuote) {
      const paise = matchingQuote.finalAmountPaise || matchingQuote.totalAmountPaise;
      if (paise) {
        return `₹${(paise / 100).toLocaleString('en-IN')}`;
      }
      if (matchingQuote.grandTotal) {
        return `₹${Number(matchingQuote.grandTotal).toLocaleString('en-IN')}`;
      }
    }
    return req.budgetRange || 'Flexible';
  };

  const getAssignedArchitects = (req: PlatformProjectRequest) => {
    const ids = req.assignedProfessionalIds || [];
    if (ids.length === 0) return [];

    return ids.map((id) => {
      const cleanTarget = String(id).trim().toLowerCase();
      const cleanPhone = cleanTarget.replace(/\D/g, '').slice(-10);

      const matched = architects.find((a: any) => {
        if (a.id && a.id.toLowerCase() === cleanTarget) return true;
        if (a.applicationNumber && a.applicationNumber.toLowerCase() === cleanTarget) return true;
        const aPhone = (a.phone || '').replace(/\D/g, '').slice(-10);
        if (cleanPhone && aPhone && aPhone === cleanPhone) return true;
        if (a.firmName && cleanTarget.includes(a.firmName.toLowerCase())) return true;
        if (a.name && cleanTarget.includes(a.name.toLowerCase())) return true;
        return false;
      });

      if (matched) {
        return {
          firmName: matched.firmName || matched.name,
          architectName: matched.name,
          phone: matched.phone ? `+91 ${matched.phone.replace(/\D/g, '').slice(-10)}` : '',
        };
      }
      return {
        firmName: id,
        architectName: 'Assigned Partner',
        phone: '',
      };
    });
  };

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 30000);
    window.addEventListener('storage', loadRequests);
    window.addEventListener('admin_global_refresh', loadRequests);

    const onSync = (event: MessageEvent) => {
      if (
        event.data?.type === 'PROJECT_REQUESTS_UPDATED' ||
        event.data?.type === 'MATERIAL_REQUESTS_UPDATED' ||
        event.data?.type === 'DATA_PURGED'
      ) {
        loadRequests();
      }
    };
    if (syncChannel) {
      syncChannel.addEventListener('message', onSync);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadRequests);
      window.removeEventListener('admin_global_refresh', loadRequests);
      if (syncChannel) {
        syncChannel.removeEventListener('message', onSync);
      }
    };
  }, []);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReq.customerName.trim()) {
      error('Customer name is required');
      return;
    }
    const cleanPhone = newReq.customerPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      error('Please enter a valid 10-digit customer mobile number');
      return;
    }

    const year = new Date().getFullYear();
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const requestCode = `GHR-REQ-${year}-${randomCode}`;
    const id = `req-${Date.now()}`;

    const created: PlatformProjectRequest = {
      id,
      requestCode,
      customerId: `usr-cust-${Date.now()}`,
      customerName: newReq.customerName.trim(),
      customerPhone: `+91 ${cleanPhone}`,
      customerEmail: 'Not Provided',
      categorySlug: newReq.categorySlug,
      propertyType: newReq.propertyType,
      plotArea: Number(newReq.plotArea) || 2000,
      measurementUnit: newReq.measurementUnit,
      city: newReq.city.trim() || 'Gurugram',
      locality: newReq.locality.trim() || 'Locality',
      address: `${newReq.locality}, ${newReq.city}`,
      budgetRange: newReq.budgetRange,
      description: newReq.description.trim() || 'Direct structural planning and construction inquiry.',
      status: newReq.status,
      isFeePaid: true,
      quoteFeePaise: 49900,
      assignedCount: 0,
      quotationsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    savePlatformRequest(created);
    loadRequests();
    setShowAddModal(false);
    setNewReq({
      customerName: '',
      customerPhone: '',
      categorySlug: 'new-house-construction',
      propertyType: 'Residential Villa',
      plotArea: 2400,
      measurementUnit: 'SQ_FT',
      city: 'Gurugram',
      locality: 'Sector 57',
      budgetRange: '₹50 Lakhs - ₹1 Crore',
      description: '',
      status: 'VERIFIED',
    });
    success(`Project request ${requestCode} created with status "${created.status}"!`);
  };

  const filteredProjects = requests.filter(
    (r) =>
      r.requestCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMaterials = materialRequests.filter(
    (r) =>
      r.requestCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.materialItem?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-navy-950">
            Project & Inquiry Management ({requests.length + materialRequests.length})
          </h1>
          <p className="text-xs text-slate-500">
            Inspect property specs, assign certified professionals, and monitor material BOQ inquiries.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search request or city..."
              className="input-field pl-9 py-1.5 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'projects'
              ? 'border-navy-950 text-navy-950'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Building className="w-4 h-4 text-blue-600" />
          <span>Engineering & Construction Projects</span>
          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono">
            {requests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'materials'
              ? 'border-navy-950 text-navy-950'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-600" />
          <span>Bulk Material BOQ Inquiries</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono">
            {materialRequests.length}
          </span>
        </button>
      </div>

      {activeTab === 'projects' ? (
        <div className="card overflow-hidden bg-white border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Request Code</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Site Address</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Assigned Architect</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-500">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-700">No engineering project requests found</p>
                      <p className="text-[11px] text-slate-400">
                        When customers submit project inquiries on /create-request, they will appear here for verification and assignment.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((req) => {
                  const assignedFirms = getAssignedArchitects(req);
                  return (
                    <tr key={req.id} className="hover:bg-slate-50 transition">
                      {/* 1. Request Code & Date */}
                      <td className="p-4 font-mono font-bold text-navy-950">
                        <Link
                          to={`/admin/requests/${req.id}`}
                          className="hover:text-blue-600 hover:underline transition block"
                          title="Click to inspect and assign"
                        >
                          {req.requestCode}
                        </Link>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                          {formatDate(req.createdAt)}
                        </div>
                      </td>

                      {/* 2. Customer Name & Contact */}
                      <td className="p-4">
                        <Link
                          to={`/admin/requests/${req.id}`}
                          className="font-semibold text-slate-800 hover:text-blue-600 hover:underline block transition cursor-pointer"
                          title="Click to inspect and assign"
                        >
                          {req.customerName}
                        </Link>
                        <div className="text-[11px] text-slate-400 font-mono">{req.customerPhone}</div>
                      </td>

                      {/* 3. Customer Site Address */}
                      <td className="p-4 min-w-[180px]">
                        <div className="flex items-start gap-1 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span className="text-xs font-medium leading-snug">
                            {req.address || [req.locality, req.city, req.state].filter(Boolean).join(', ') || 'Address not specified'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                          {req.plotArea ? `${req.plotArea} ${req.measurementUnit?.toLowerCase() || 'sq.ft'}²` : ''} • {req.categorySlug?.replace(/-/g, ' ')}
                        </div>
                      </td>

                      {/* 4. Total Amount */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="font-bold text-navy-950 text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 inline-block">
                          {getRequestAmount(req)}
                        </span>
                      </td>

                      {/* 5. Assigned Architect(s) Firm Name, Architect Name & Contact */}
                      <td className="p-4 min-w-[190px]">
                        {assignedFirms.length === 0 ? (
                          <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                            Pending Assignment
                          </span>
                        ) : (
                          <div className="space-y-1.5">
                            {assignedFirms.map((firm, idx) => (
                              <div key={idx} className="text-xs leading-tight">
                                <div className="font-bold text-slate-900">{firm.firmName}</div>
                                <div className="text-[11px] text-slate-500">
                                  {firm.architectName} {firm.phone && <span className="font-mono text-slate-700">• {firm.phone}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* 6. Status */}
                      <td className="p-4">
                        <Badge status={req.status} />
                      </td>

                      {/* 7. Actions */}
                      <td className="p-4 text-right">
                        <Link
                          to={`/admin/requests/${req.id}`}
                          className="btn-outline text-xs py-1.5 px-3 inline-flex items-center gap-1"
                        >
                          <span>Inspect &amp; Assign</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card overflow-hidden bg-white border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Inquiry Code</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Delivery Site</th>
                <th className="p-4">Scope / BOQ Items</th>
                <th className="p-4">Status</th>
                <th className="p-4">Submitted</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-500">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-700">No bulk material inquiries found</p>
                      <p className="text-[11px] text-slate-400">
                        When customers request house civil material quotes on /materials, they will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((mReq) => (
                  <tr key={mReq.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-bold text-navy-950">
                      <Link
                        to="/admin/materials"
                        className="hover:text-amber-700 hover:underline transition"
                        title="Click to inspect quotes & bids"
                      >
                        {mReq.requestCode}
                      </Link>
                    </td>
                    <td className="p-4">
                      <Link
                        to="/admin/materials"
                        className="font-semibold text-slate-800 hover:text-amber-700 hover:underline block transition cursor-pointer"
                        title="Click to inspect quotes & bids"
                      >
                        {mReq.customerName}
                      </Link>
                      <div className="text-[11px] text-slate-400 font-mono">{mReq.customerPhone}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800 font-medium">{mReq.city}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{mReq.deliverySiteAddress}</div>
                    </td>
                    <td className="p-4 text-slate-700">
                      <div className="font-semibold text-slate-900">
                        {mReq.materialItem || `${mReq.builtUpAreaSqFt} sq.ft Package`}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {mReq.items?.length ? `${mReq.items.length} BOQ categories specified` : 'Standard Civil Package'}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                        {mReq.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-[11px]">
                      {formatDate(mReq.createdAt)}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        to="/admin/materials"
                        className="btn-outline text-xs py-1.5 px-3 inline-flex items-center gap-1 text-amber-700 hover:text-amber-800"
                      >
                        <span>Inspect Quotes & Bids</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Request Creation Modal (Stepper Wizard) */}
      {showAddModal && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setRequestStep(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back / Cancel</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Create Customer Quotation Request
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Step {requestStep} of 3 • Civil Planning & Quotation Intake Wizard
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setRequestStep(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1100px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Stepper Header */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-blue-200/80 shadow-sm">
              <div className="flex items-center justify-between max-w-xl mx-auto">
                {[
                  { step: 1, title: 'Customer & Category', icon: User },
                  { step: 2, title: 'Property & Dimensions', icon: Building },
                  { step: 3, title: 'Scope & Budget', icon: Layers },
                ].map((item, idx, arr) => (
                  <div key={item.step} className="flex items-center flex-1 last:flex-none">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.step < requestStep) setRequestStep(item.step);
                      }}
                      className="flex flex-col items-center gap-1 group text-center cursor-pointer"
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition ${
                          requestStep === item.step
                            ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100'
                            : requestStep > item.step
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {requestStep > item.step ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <item.icon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-bold mt-1 transition ${
                          requestStep === item.step
                            ? 'text-blue-900'
                            : requestStep > item.step
                            ? 'text-emerald-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {item.title}
                      </span>
                    </button>
                    {idx < arr.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-3 mb-5 transition ${
                          requestStep > item.step ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stepper Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
              <form onSubmit={handleCreateRequest}>
                {/* STEP 1: CUSTOMER & CATEGORY */}
                {requestStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 1 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Client Identity & Primary Engineering Service
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Enter client contact and select core architectural or civil construction package.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <User className="w-4 h-4 text-blue-600" />
                          <span>Customer Full Name</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={newReq.customerName}
                          onChange={(e) => setNewReq({ ...newReq, customerName: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-blue-600" />
                          <span>Customer Mobile Number</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-xs">+91</span>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            placeholder="10-digit mobile"
                            value={newReq.customerPhone}
                            onChange={(e) => setNewReq({ ...newReq, customerPhone: e.target.value })}
                            className="w-full pl-14 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="font-bold text-slate-800 text-sm">Primary Service Category <span className="text-rose-500">*</span></label>
                        <select
                          value={newReq.categorySlug}
                          onChange={(e) => setNewReq({ ...newReq, categorySlug: e.target.value })}
                          className="w-full p-3.5 border border-slate-300 rounded-2xl font-bold text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs"
                        >
                          <option value="new-house-construction">Complete Turnkey New House Construction</option>
                          <option value="home-renovation">Whole Home Renovation & Remodeling</option>
                          <option value="house-map-planning">Architectural House Map & 3D Spatial Planning</option>
                          <option value="structural-engineering">Structural Engineering & RCC Drawings</option>
                          <option value="interior-designing">Luxury Interior Architecture & Styling</option>
                          <option value="complete-construction-package">Complete Construction & Material Supply Package</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: PROPERTY & DIMENSIONS */}
                {requestStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 2 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Property Typology & Site Geometry
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Specify building type, plot area dimensions, and site location.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Property Type <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={newReq.propertyType}
                          onChange={(e) => setNewReq({ ...newReq, propertyType: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Plot Area (Sq. Ft) <span className="text-rose-500">*</span></label>
                        <input
                          type="number"
                          min={100}
                          value={newReq.plotArea}
                          onChange={(e) => setNewReq({ ...newReq, plotArea: Number(e.target.value) })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span>City / District</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={newReq.city}
                          onChange={(e) => setNewReq({ ...newReq, city: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Locality / Sector</label>
                        <input
                          type="text"
                          placeholder=""
                          value={newReq.locality}
                          onChange={(e) => setNewReq({ ...newReq, locality: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: SCOPE & BUDGET */}
                {requestStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 3 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Budget Range, Notes & Request Publishing
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Review customer scope and publish request to architects and contractor bidding desks.
                      </p>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-sm">Budget Range <span className="text-rose-500">*</span></label>
                          <select
                            value={newReq.budgetRange}
                            onChange={(e) => setNewReq({ ...newReq, budgetRange: e.target.value })}
                            className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          >
                            <option value="₹25 - ₹50 Lakhs">₹25 - ₹50 Lakhs</option>
                            <option value="₹50 Lakhs - ₹1 Crore">₹50 Lakhs - ₹1 Crore</option>
                            <option value="₹1 Crore - ₹2.5 Crores">₹1 Crore - ₹2.5 Crores</option>
                            <option value="Above ₹2.5 Crores">Above ₹2.5 Crores</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-sm">Initial Verification Status</label>
                          <select
                            value={newReq.status}
                            onChange={(e) => setNewReq({ ...newReq, status: e.target.value })}
                            className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          >
                            <option value="VERIFIED">VERIFIED (Technical Scope Approved & Open for Quotes)</option>
                            <option value="UNDER_REVIEW">UNDER REVIEW (Vetting Pending)</option>
                            <option value="SUBMITTED">SUBMITTED (Raw Homeowner Lead)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Scope Description / Engineering Notes</label>
                        <textarea
                          rows={4}
                          placeholder=""
                          value={newReq.description}
                          onChange={(e) => setNewReq({ ...newReq, description: e.target.value })}
                          className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      {/* Request Summary Preview */}
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Customer</span>
                          <p className="text-sm font-bold text-navy-950 mt-0.5">{newReq.customerName || 'Not Entered'} (+91 {newReq.customerPhone})</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Selected Service</span>
                          <p className="text-sm font-bold text-blue-900 mt-0.5">{newReq.categorySlug}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Site Footprint</span>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">{newReq.plotArea} Sq. Ft ({newReq.propertyType})</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Site Location</span>
                          <p className="text-xs font-semibold text-slate-700 mt-0.5">{newReq.locality ? `${newReq.locality}, ` : ''}{newReq.city}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Footer */}
                <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-200 mt-6">
                  {requestStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setRequestStep(requestStep - 1)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition flex items-center gap-2 text-xs cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Previous Step</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-100 transition text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}

                  <div className="text-xs text-slate-400 font-mono hidden sm:block">
                    Step {requestStep} of 3
                  </div>

                  {requestStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (requestStep === 1) {
                          if (!newReq.customerName.trim()) {
                            error('Please enter the customer name');
                            return;
                          }
                          const clean = newReq.customerPhone.replace(/\D/g, '').slice(-10);
                          if (clean.length !== 10) {
                            error('Please enter a valid 10-digit mobile number');
                            return;
                          }
                        } else if (requestStep === 2) {
                          if (!newReq.city.trim()) {
                            error('Please enter the city');
                            return;
                          }
                        }
                        setRequestStep(requestStep + 1);
                      }}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <span>Proceed to Step {requestStep + 1}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Publish Quotation Request</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
