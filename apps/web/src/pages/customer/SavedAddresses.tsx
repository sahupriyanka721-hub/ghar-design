import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import {
  MapPin,
  PlusCircle,
  Building,
  Home,
  Trash2,
  Edit2,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

interface SavedAddressItem {
  id: string;
  label: string;
  type: 'PLOT' | 'HOME' | 'OFFICE' | 'DELIVERY' | 'COMMERCIAL' | 'RESIDENCE';
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

const STORAGE_KEY = 'gd_customer_saved_properties_v1';

export const SavedAddresses: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [addresses, setAddresses] = useState<SavedAddressItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [label, setLabel] = useState('');
  const [type, setType] = useState<'PLOT' | 'HOME' | 'OFFICE' | 'DELIVERY' | 'COMMERCIAL' | 'RESIDENCE'>('PLOT');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  useEffect(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        setAddresses(JSON.parse(data));
      } else {
        setAddresses([]);
      }
    } catch {
      setAddresses([]);
    }
  }, []);

  const saveToStorage = (list: SavedAddressItem[]) => {
    setAddresses(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !addressLine.trim() || !city.trim()) {
      error('Please complete all required fields.');
      return;
    }

    const newItem: SavedAddressItem = {
      id: `addr-${Date.now()}`,
      label: label.trim(),
      type,
      address: addressLine.trim(),
      city: city.trim(),
      state: state.trim() || 'Uttar Pradesh',
      pincode: pincode.trim() || '201301',
      isDefault: addresses.length === 0,
    };

    saveToStorage([...addresses, newItem]);
    setShowAddModal(false);
    setLabel('');
    setAddressLine('');
    setCity('');
    setPincode('');
    success('Property / site address saved successfully.');
  };

  const handleDelete = (id: string) => {
    saveToStorage(addresses.filter((a) => a.id !== id));
    success('Address removed.');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 font-sans">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-navy-950">
            Saved Properties & Site Addresses
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your residential plots, construction sites, and delivery addresses for material dispatches.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-navy-950 text-white rounded-xl text-xs font-bold hover:bg-navy-900 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-gold-400" />
          <span>Add New Property</span>
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto space-y-3">
          <MapPin className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-navy-950">No Saved Properties Yet</h3>
          <p className="text-xs text-slate-500">
            Save your plot or property locations to easily autofill RFQ quotation requests and material deliveries.
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary text-xs py-2 px-4">
            Add First Property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <div
              key={a.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy-950 text-sm">{a.label}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">
                      {a.type}
                    </span>
                  </div>
                  {a.isDefault && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                      Default
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{a.address}</p>
                <div className="text-xs text-slate-500 mt-1">
                  {a.city}, {a.state} - {a.pincode}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAdd}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-sans text-xs"
          >
            <h3 className="text-base font-bold text-navy-950 font-display">Add Property / Site Address</h3>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Property Label</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder=""
                className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Property / Address Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50"
              >
                <option value="PLOT">Project Site Address (New Construction / Plot)</option>
                <option value="HOME">Home Address (Permanent Residence)</option>
                <option value="OFFICE">Office Address</option>
                <option value="DELIVERY">Saved Delivery Address (Material Drop-off)</option>
                <option value="RESIDENCE">Existing Residence (Renovation)</option>
                <option value="COMMERCIAL">Commercial Property</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Address / Landmark</label>
              <textarea
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                rows={2}
                placeholder="Plot No., Street, Sector/Locality..."
                className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder=""
                  className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder=""
                  className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-slate-600 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-navy-950 text-white font-bold rounded-xl hover:bg-navy-900"
              >
                Save Property
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
