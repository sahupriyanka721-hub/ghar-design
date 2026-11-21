import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { getVendorByPhone, saveRegisteredVendor } from '../../data/vendorStore.js';
import { SearchableCitySelect } from '../../components/common/SearchableCitySelect.js';
import { RegisteredVendor } from '@ghar-design/shared';
import {
  Store,
  Building,
  User,
  Phone,
  Mail,
  FileText,
  MapPin,
  CreditCard,
  Truck,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Upload,
  Save,
  AlertCircle,
  Eye,
  Calendar,
} from 'lucide-react';

export const VendorProfile: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'VIEW' | 'EDIT' | 'DOCUMENTS' | 'BANK' | 'DELIVERY' | 'TIMINGS'>('VIEW');
  const [loading, setLoading] = useState(false);

  const vendor = useMemo(() => {
    if (!user?.phone) return null;
    return getVendorByPhone(user.phone) || null;
  }, [user?.phone]);

  const [formData, setFormData] = useState<Partial<RegisteredVendor>>({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    gstin: '',
    panNumber: '',
    businessCategory: 'Cement & Ready Mix Concrete (RMC)',
    supplierType: 'Authorized Manufacturer Depot' as any,
    warehouseAddress: '',
    city: 'New Delhi',
    state: 'Delhi NCR',
    pinCode: '',
    bankDetails: {
      accountHolder: '',
      bankName: '',
      accountNumber: '',
      ifsc: '',
      branchName: '',
    },
    deliverySettings: {
      deliveryAvailable: true,
      deliveryLocations: ['Delhi NCR'],
      serviceablePinCodes: ['110001', '110020'],
      maxDeliveryDistanceKm: 30,
      deliveryChargesPaise: 150000,
      minOrderValuePaise: 2500000,
      estimatedDeliveryDays: 2,
      selfPickupAvailable: true,
    },
    businessOperations: {
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      openingTime: '08:30 AM',
      closingTime: '07:30 PM',
      weeklyOff: 'Sunday',
      customerSupportNumber: '',
    },
  });

  useEffect(() => {
    if (vendor) {
      setFormData(vendor);
    }
  }, [vendor]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      saveRegisteredVendor({
        ...formData,
        id: vendor?.id || `vnd-${Date.now()}`,
        phone: vendor?.phone || user?.phone || '',
      });
      success('Business profile updated successfully!');
      setActiveTab('VIEW');
    } catch {
      error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-200/80 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Merchant Settings</span>
          <h1 className="text-xl sm:text-2xl font-black font-display text-navy-950">
            Business Profile & Store Operations
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Status: {vendor?.status || 'APPROVED'}</span>
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100 text-xs font-bold">
        {[
          { key: 'VIEW', label: 'View Profile', icon: Eye },
          { key: 'EDIT', label: 'Edit Business Details', icon: Building },
          { key: 'DOCUMENTS', label: 'Business Documents (KYC)', icon: ShieldCheck },
          { key: 'BANK', label: 'Bank Details', icon: CreditCard },
          { key: 'DELIVERY', label: 'Delivery Settings', icon: Truck },
          { key: 'TIMINGS', label: 'Business Timings', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition ${
                activeTab === tab.key
                  ? 'bg-navy-950 text-gold-400 shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-blue-200/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: VIEW PROFILE */}
      {activeTab === 'VIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-3xl border border-blue-200/80 p-6 shadow-xs text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-navy-950 text-gold-400 flex items-center justify-center mx-auto shadow-md font-display text-2xl font-black">
              {vendor?.businessName?.charAt(0) || 'B'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy-950 font-display">{vendor?.businessName || 'BuildGhar Depot'}</h2>
              <p className="text-xs text-slate-500">{vendor?.businessCategory}</p>
            </div>
            <div className="p-3 bg-sky-50/30 rounded-2xl border border-blue-200/80/80 text-left text-xs space-y-2">
              <div><span className="text-slate-400 block">Owner / Lead:</span> <strong>{vendor?.ownerName || 'Ramesh Chandra'}</strong></div>
              <div><span className="text-slate-400 block">GSTIN:</span> <strong className="font-mono">{vendor?.gstin || '07AABCB1234D1ZP'}</strong></div>
              <div><span className="text-slate-400 block">Mobile:</span> <strong className="font-mono">+91 {vendor?.phone}</strong></div>
              <div><span className="text-slate-400 block">City:</span> <strong>{vendor?.city}, {vendor?.state}</strong></div>
            </div>
            <button
              onClick={() => setActiveTab('EDIT')}
              className="w-full py-2.5 bg-navy-950 text-gold-400 rounded-xl text-xs font-bold hover:bg-navy-900 transition"
            >
              Edit Details
            </button>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-blue-200/80 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-navy-950 font-display uppercase tracking-wider flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-600" />
                <span>Warehouse Location & Delivery Coverage</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Warehouse Address:</span>
                  <p className="font-medium text-slate-800">{vendor?.warehouseAddress || 'Plot #24, Okhla Industrial Phase 2'}</p>
                </div>
                <div>
                  <span className="text-slate-400 block">PIN Code:</span>
                  <p className="font-mono font-bold text-slate-800">{vendor?.pinCode || '110020'}</p>
                </div>
                <div>
                  <span className="text-slate-400 block">Max Delivery Radius:</span>
                  <p className="font-bold text-slate-800">{vendor?.deliverySettings?.maxDeliveryDistanceKm || 30} KM</p>
                </div>
                <div>
                  <span className="text-slate-400 block">Base Delivery Charge:</span>
                  <p className="font-bold text-emerald-700">₹{(vendor?.deliverySettings?.deliveryChargesPaise || 150000) / 100} (Hydraulic)</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-blue-200/80 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-navy-950 font-display uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Verified Escrow Payout Bank Account</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Bank Name:</span>
                  <p className="font-bold text-slate-800">{vendor?.bankDetails?.bankName || 'State Bank of India'}</p>
                </div>
                <div>
                  <span className="text-slate-400 block">Account Number:</span>
                  <p className="font-mono font-bold text-slate-800">
                    ****{vendor?.bankDetails?.accountNumber?.slice(-4) || '8291'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 block">IFSC Code:</span>
                  <p className="font-mono font-bold text-slate-800">{vendor?.bankDetails?.ifsc || 'SBIN0001234'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: EDIT DETAILS */}
      {activeTab === 'EDIT' && (
        <form onSubmit={handleSave} className="bg-white rounded-3xl border border-blue-200/80 p-6 sm:p-8 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-navy-950 font-display">Edit Business & Warehouse Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Business Name</label>
              <input
                type="text"
                required
                value={formData.businessName || ''}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Owner Name</label>
              <input
                type="text"
                required
                value={formData.ownerName || ''}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Official Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">GSTIN</label>
              <input
                type="text"
                maxLength={15}
                value={formData.gstin || ''}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-xs font-mono uppercase border border-blue-200/80 rounded-xl"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Warehouse Address</label>
              <textarea
                rows={2}
                value={formData.warehouseAddress || ''}
                onChange={(e) => setFormData({ ...formData, warehouseAddress: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('VIEW')}
              className="px-4 py-2 border border-blue-200/80 text-slate-700 rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-navy-950 text-gold-400 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB CONTENT: DOCUMENTS */}
      {activeTab === 'DOCUMENTS' && (
        <div className="bg-white rounded-3xl border border-blue-200/80 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-navy-950 font-display">Uploaded KYC Documents</h2>
              <p className="text-xs text-slate-500">Government compliance certificates and bank proofs for merchant accreditation.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {[
              { title: 'GST Registration Certificate', status: 'VERIFIED' },
              { title: 'Business PAN Card', status: 'VERIFIED' },
              { title: 'Cancelled Bank Cheque', status: 'VERIFIED' },
              { title: 'Shop & Commercial Establishment Act', status: 'VERIFIED' },
            ].map((d, i) => (
              <div key={i} className="p-4 bg-sky-50/30 border border-blue-200/80 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-navy-950" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">{d.title}</span>
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Admin Verified</span>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => success(`${d.title} is verified and active on file.`)}
                  className="px-2.5 py-1 bg-white border border-blue-200/80 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: BANK DETAILS */}
      {activeTab === 'BANK' && (
        <form onSubmit={handleSave} className="bg-white rounded-3xl border border-blue-200/80 p-6 sm:p-8 shadow-xs space-y-4 max-w-xl">
          <h2 className="text-base font-bold text-navy-950 font-display">Bank Account for Material Payouts</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Account Holder Name</label>
              <input
                type="text"
                value={formData.bankDetails?.accountHolder || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails!, accountHolder: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Bank Name</label>
              <input
                type="text"
                value={formData.bankDetails?.bankName || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails!, bankName: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Account Number</label>
              <input
                type="text"
                value={formData.bankDetails?.accountNumber || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails!, accountNumber: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs font-mono border border-blue-200/80 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">IFSC Code</label>
              <input
                type="text"
                maxLength={11}
                value={formData.bankDetails?.ifsc || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails!, ifsc: e.target.value.toUpperCase() }
                })}
                className="w-full px-3 py-2 text-xs font-mono uppercase border border-blue-200/80 rounded-xl"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-navy-950 text-gold-400 font-bold text-xs rounded-xl shadow-md"
          >
            Update Bank Details
          </button>
        </form>
      )}

      {/* TAB CONTENT: DELIVERY */}
      {activeTab === 'DELIVERY' && (
        <form onSubmit={handleSave} className="bg-white rounded-3xl border border-blue-200/80 p-6 sm:p-8 shadow-xs space-y-4 max-w-xl">
          <h2 className="text-base font-bold text-navy-950 font-display">Service Radius & Dispatch Parameters</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Maximum Transit Distance (KM)</label>
              <input
                type="number"
                value={formData.deliverySettings?.maxDeliveryDistanceKm || 30}
                onChange={(e) => setFormData({
                  ...formData,
                  deliverySettings: { ...formData.deliverySettings!, maxDeliveryDistanceKm: Number(e.target.value) }
                })}
                className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Base Hydraulic Delivery Charge (₹)</label>
              <input
                type="number"
                value={(formData.deliverySettings?.deliveryChargesPaise || 150000) / 100}
                onChange={(e) => setFormData({
                  ...formData,
                  deliverySettings: { ...formData.deliverySettings!, deliveryChargesPaise: Number(e.target.value) * 100 }
                })}
                className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Estimated Delivery Time (Days)</label>
              <input
                type="number"
                value={formData.deliverySettings?.estimatedDeliveryDays || 2}
                onChange={(e) => setFormData({
                  ...formData,
                  deliverySettings: { ...formData.deliverySettings!, estimatedDeliveryDays: Number(e.target.value) }
                })}
                className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-navy-950 text-gold-400 font-bold text-xs rounded-xl shadow-md"
          >
            Save Delivery Settings
          </button>
        </form>
      )}

      {/* TAB CONTENT: TIMINGS */}
      {activeTab === 'TIMINGS' && (
        <form onSubmit={handleSave} className="bg-white rounded-3xl border border-blue-200/80 p-6 sm:p-8 shadow-xs space-y-4 max-w-xl">
          <h2 className="text-base font-bold text-navy-950 font-display">Operational Hours & Weekly Off</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Opening Time</label>
              <input
                type="text"
                value={formData.businessOperations?.openingTime || '08:30 AM'}
                onChange={(e) => setFormData({
                  ...formData,
                  businessOperations: { ...formData.businessOperations!, openingTime: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Closing Time</label>
              <input
                type="text"
                value={formData.businessOperations?.closingTime || '07:30 PM'}
                onChange={(e) => setFormData({
                  ...formData,
                  businessOperations: { ...formData.businessOperations!, closingTime: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Weekly Off Day</label>
              <input
                type="text"
                value={formData.businessOperations?.weeklyOff || 'Sunday'}
                onChange={(e) => setFormData({
                  ...formData,
                  businessOperations: { ...formData.businessOperations!, weeklyOff: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-navy-950 text-gold-400 font-bold text-xs rounded-xl shadow-md"
          >
            Save Timings
          </button>
        </form>
      )}

    </div>
  );
};
