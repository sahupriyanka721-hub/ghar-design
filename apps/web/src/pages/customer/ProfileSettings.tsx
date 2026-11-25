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
  Camera,
  Download,
  AlertTriangle,
  Globe,
  Lock,
} from 'lucide-react';

export const ProfileSettings: React.FC = () => {
  const { user, addresses, addAddress, deleteAddress, updateUser } = useAuth();

  // Basic Profile Info
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarUrl, setAvatarUrl] = useState<string>((user as any)?.avatar || '');
  const [language, setLanguage] = useState('en-IN');
  const [savedSuccessMsg, setSavedSuccessMsg] = useState('');
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);

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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image file size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        setAvatarUrl(base64);
        updateUser({ avatar: base64 } as any);
        setSavedSuccessMsg('Profile photo updated successfully!');
        setTimeout(() => setSavedSuccessMsg(''), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadMyData = () => {
    const exportData = {
      userProfile: user,
      registeredAddresses: addresses,
      languagePreference: language,
      notificationPreferences: prefs,
      exportedAt: new Date().toISOString(),
      platform: 'BuildGhar Construction & Architecture Management',
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `buildghar-customer-archive-${user?.phone || 'account'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setSavedSuccessMsg('Account data archive generated and downloaded!');
    setTimeout(() => setSavedSuccessMsg(''), 3000);
  };

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

        {/* Profile Photo Avatar Uploader (Section 12.1 Spec) */}
        <div className="flex items-center gap-4 pb-2">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile Avatar"
                className="w-16 h-16 rounded-full object-cover border-2 border-gold-400 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-navy-950 text-gold-400 font-bold text-xl flex items-center justify-center border-2 border-gold-400/50 shadow-sm">
                {fullName ? fullName.slice(0, 2).toUpperCase() : 'GD'}
              </div>
            )}
            <label className="absolute bottom-0 right-0 p-1.5 bg-navy-950 text-gold-400 hover:bg-navy-900 rounded-full cursor-pointer shadow-xs border border-white">
              <Camera className="w-3.5 h-3.5" />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-xs">Profile Photo</h3>
            <p className="text-[11px] text-slate-500">
              Upload your personal photo or avatar. JPG, PNG up to 2MB.
            </p>
          </div>
        </div>

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

      {/* Language & Regional Preferences (Section 12.4 Spec) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-600" />
          <span>Language & Regional Preferences (Section 12.4)</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Display Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="en-IN">English (India)</option>
              <option value="hi-IN">Hindi (हिन्दी)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Currency & Formatting</label>
            <input
              type="text"
              readOnly
              value="INR (₹) - Indian Rupee"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Account Management & Data Privacy (Section 12.5 Spec) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Account Management & Data Privacy (Section 12.5)</span>
        </h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <div className="font-bold text-slate-800">Export Customer Archive</div>
            <div className="text-[11px] text-slate-500">
              Download a complete JSON record of your profile, projects, site addresses, and quotations.
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownloadMyData}
            className="px-4 py-2 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold rounded-lg flex items-center gap-1.5 transition shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download My Data</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-rose-50/50 rounded-xl border border-rose-200">
          <div>
            <div className="font-bold text-rose-950">Request Account Deactivation</div>
            <div className="text-[11px] text-rose-700">
              Permanently close your customer account after verifying all ongoing project escrow settlements.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDeactivateModalOpen(true)}
            className="px-4 py-2 border border-rose-300 bg-white hover:bg-rose-100 text-rose-700 font-bold rounded-lg transition shrink-0"
          >
            Request Deactivation
          </button>
        </div>
      </div>

      {/* Account Deactivation Modal */}
      {deactivateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-2.5 text-rose-600 font-bold text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirm Account Deactivation</span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              Deactivating your account will pause your access to BuildGhar Customer Portal. If you have active construction projects or pending milestone disbursements, our admin operations team will review and contact you at +91 {user?.phone}.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeactivateModalOpen(false)}
                className="flex-1 py-2 border border-slate-300 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeactivateModalOpen(false);
                  alert('Deactivation request logged with BuildGhar compliance team.');
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
              >
                Confirm Request
              </button>
            </div>
          </div>
        </div>
      )}

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
