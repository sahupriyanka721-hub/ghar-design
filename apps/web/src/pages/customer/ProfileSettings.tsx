import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { CustomerAddress } from '@ghar-design/shared';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Bell,
  Home,
  Check,
} from 'lucide-react';

export const ProfileSettings: React.FC = () => {
  const { user, addresses, addAddress, deleteAddress, updateUser } = useAuth();

  // Basic Profile Info
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savedSuccessMsg, setSavedSuccessMsg] = useState('');

  // Mobile number change modal
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const [newMobile, setNewMobile] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [mobileStep, setMobileStep] = useState<'PHONE' | 'OTP'>('PHONE');

  // New Address Modal
  const [newAddressModalOpen, setNewAddressModalOpen] = useState(false);
  const [addressLabel, setAddressLabel] = useState('');
  const [houseNo, setHouseNo] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Gurugram');
  const [state, setState] = useState('Haryana');
  const [pinCode, setPinCode] = useState('');
  const [landmark, setLandmark] = useState('');

  // Notification Preferences (Section 11.3)
  const [prefs, setPrefs] = useState({
    inApp: true,
    sms: true,
    email: true,
    whatsapp: true,
    quotations: true,
    milestones: true,
    payments: true,
    materials: true,
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name: fullName, email });
    setSavedSuccessMsg('Profile information updated successfully!');
    setTimeout(() => setSavedSuccessMsg(''), 3000);
  };

  const handleMobileChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileStep === 'PHONE') {
      if (!newMobile || newMobile.length !== 10) {
        alert('Please enter a valid 10-digit Indian mobile number');
        return;
      }
      setMobileStep('OTP');
    } else {
      if (mobileOtp !== '123456') {
        alert('Please enter test OTP code 123456');
        return;
      }
      updateUser({ phone: newMobile });
      setMobileModalOpen(false);
      setMobileStep('PHONE');
      setNewMobile('');
      setMobileOtp('');
      setSavedSuccessMsg('Mobile number verified & updated per security standards.');
    }
  };

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!houseNo || !street || !pinCode) {
      alert('Please fill in required address fields');
      return;
    }
    const newAddr: CustomerAddress = {
      id: `addr-${Date.now()}`,
      label: addressLabel || 'Site Address',
      houseNo,
      street,
      locality: street,
      city,
      state,
      pinCode,
      country: 'India',
      landmark,
      isDefaultBilling: false,
      isDefaultDelivery: false,
    };
    addAddress(newAddr);
    setNewAddressModalOpen(false);
    setAddressLabel('');
    setHouseNo('');
    setStreet('');
    setPinCode('');
    setLandmark('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-xs">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gold-600 font-bold uppercase tracking-wider text-[11px] mb-1">
            <User className="w-4 h-4" />
            <span>Customer Profile & Address Directory</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
            Account Profile & Property Addresses
          </h1>
          <p className="text-slate-500 mt-1">
            Manage your personal profile, verified mobile contact, property sites, and delivery destinations.
          </p>
        </div>
      </div>

      {savedSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedSuccessMsg}</span>
        </div>
      )}

      {/* Basic Profile Details Form */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
          Personal Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          {/* Verified Mobile Number with Security Change Modal */}
          <div className="space-y-1 sm:col-span-2">
            <label className="font-bold text-slate-700">Verified Mobile Number (Primary Auth ID)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2 text-slate-400 font-semibold">+91</span>
                <input
                  type="text"
                  readOnly
                  value={user?.phone || ''}
                  className="w-full pl-12 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-800 font-semibold"
                />
              </div>
              <button
                type="button"
                onClick={() => setMobileModalOpen(true)}
                className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg transition"
              >
                Change Mobile (Requires OTP)
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              Your mobile number is the primary authentication credential. Changes require 2-step OTP validation.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold rounded-xl shadow-xs transition"
          >
            Save Profile Changes
          </button>
        </div>
      </form>

      {/* Address Book Directory */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h2 className="font-bold text-sm text-slate-900">Saved Property & Delivery Addresses</h2>
            <p className="text-slate-500 text-[11px]">
              Store site plots, office billing addresses, and residential destinations for fast material delivery.
            </p>
          </div>
          <button
            onClick={() => setNewAddressModalOpen(true)}
            className="px-3 py-1.5 bg-navy-950 text-gold-400 font-bold rounded-lg flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Address</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{addr.label}</span>
                  <div className="flex items-center gap-1">
                    {addr.isDefaultBilling && (
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-bold">
                        Billing
                      </span>
                    )}
                    {addr.isDefaultDelivery && (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                        Delivery
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                  {addr.houseNo}, {addr.street}, {addr.locality}, {addr.city}, {addr.state} - {addr.pinCode}
                </p>
                {addr.landmark && (
                  <p className="text-slate-400 text-[10px] mt-0.5">Landmark: {addr.landmark}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                <button
                  onClick={() => deleteAddress(addr.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Delete Address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Preferences (Section 11.3) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
          Notification Preferences (Section 11.3)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800">In-App Notifications</div>
              <div className="text-[10px] text-slate-500">Realtime bell alerts & approvals</div>
            </div>
            <input
              type="checkbox"
              checked={prefs.inApp}
              onChange={(e) => setPrefs({ ...prefs, inApp: e.target.checked })}
              className="w-4 h-4 text-navy-950 rounded"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800">SMS Alerts</div>
              <div className="text-[10px] text-slate-500">Milestone updates & appointment reminders</div>
            </div>
            <input
              type="checkbox"
              checked={prefs.sms}
              onChange={(e) => setPrefs({ ...prefs, sms: e.target.checked })}
              className="w-4 h-4 text-navy-950 rounded"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800">WhatsApp Updates</div>
              <div className="text-[10px] text-slate-500">Material dispatch tracking & site photos</div>
            </div>
            <input
              type="checkbox"
              checked={prefs.whatsapp}
              onChange={(e) => setPrefs({ ...prefs, whatsapp: e.target.checked })}
              className="w-4 h-4 text-navy-950 rounded"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800">Email Tax Invoices</div>
              <div className="text-[10px] text-slate-500">Official GST receipts & settlement dossiers</div>
            </div>
            <input
              type="checkbox"
              checked={prefs.email}
              onChange={(e) => setPrefs({ ...prefs, email: e.target.checked })}
              className="w-4 h-4 text-navy-950 rounded"
            />
          </div>
        </div>
      </div>

      {/* Mobile Change Modal */}
      {mobileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900">
              {mobileStep === 'PHONE' ? 'Update Mobile Number' : 'Verify New Mobile OTP'}
            </h3>

            <form onSubmit={handleMobileChangeSubmit} className="space-y-3">
              {mobileStep === 'PHONE' ? (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Enter New 10-Digit Mobile</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-semibold">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={newMobile}
                      onChange={(e) => setNewMobile(e.target.value.replace(/\D/g, ''))}
                      placeholder=""
                      className="w-full pl-12 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-2.5 bg-gold-50 border border-gold-200 text-gold-900 rounded-lg text-[11px]">
                    Enter demo verification OTP code <strong>123456</strong> sent to +91 {newMobile}
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={mobileOtp}
                    onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder=""
                    className="w-full py-2.5 text-center text-lg font-mono font-bold tracking-widest border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:outline-none"
                    autoFocus
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMobileModalOpen(false)}
                  className="flex-1 py-2 border border-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-navy-950 text-gold-400 font-bold rounded-xl"
                >
                  {mobileStep === 'PHONE' ? 'Send OTP' : 'Verify & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Address Modal */}
      {newAddressModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900">Add New Property Site / Address</h3>

            <form onSubmit={handleAddNewAddress} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <label className="font-bold text-slate-700">Address Label</label>
                  <input
                    type="text"
                    required
                    value={addressLabel}
                    onChange={(e) => setAddressLabel(e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">House/Plot No.</label>
                  <input
                    type="text"
                    required
                    value={houseNo}
                    onChange={(e) => setHouseNo(e.target.value)}
                    placeholder="Plot 42"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Street / Locality</label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Sector 65"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">PIN Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="font-bold text-slate-700">Landmark (Optional)</label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="Near Metro Station"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewAddressModalOpen(false)}
                  className="flex-1 py-2 border border-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-navy-950 text-gold-400 font-bold rounded-xl"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const HelpSupport = () => null; // Re-exported separately
