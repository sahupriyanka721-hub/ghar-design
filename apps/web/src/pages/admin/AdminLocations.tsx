import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Check,
  ArrowRight,
  XCircle,
  Building2,
  Truck,
  Users,
  Store,
  Layers,
  X,
  ArrowLeft,
  Globe,
  Navigation,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import {
  PlatformServiceLocation,
  getPlatformServiceLocations,
  toggleLocationServiceStatus,
  addPlatformServiceLocation,
  recordPlatformAuditLog,
} from '../../data/adminStore.js';

export const AdminLocations: React.FC = () => {
  const { success, error } = useToast();
  const [locations, setLocations] = useState<PlatformServiceLocation[]>(() =>
    getPlatformServiceLocations()
  );
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState<string>('ALL');

  // Add Location Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [locStep, setLocStep] = useState<1 | 2>(1);
  const [state, setState] = useState('Haryana');
  const [city, setCity] = useState('');
  const [deliveryZone, setDeliveryZone] = useState('NCR Prime Zone');
  const [pincodesInput, setPincodesInput] = useState('');
  const [serviceAvailable, setServiceAvailable] = useState(true);

  const refreshData = () => {
    setLocations(getPlatformServiceLocations());
  };

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const q = search.toLowerCase();
      const matchesSearch =
        loc.city.toLowerCase().includes(q) ||
        loc.state.toLowerCase().includes(q) ||
        loc.deliveryZone.toLowerCase().includes(q) ||
        loc.pincodes.some((pin) => pin.includes(search));

      const matchesState = selectedState === 'ALL' || loc.state === selectedState;
      return matchesSearch && matchesState;
    });
  }, [locations, search, selectedState]);

  const stats = useMemo(() => {
    const totalPins = locations.reduce((sum, loc) => sum + loc.pincodes.length, 0);
    const activeLocs = locations.filter((loc) => loc.serviceAvailable).length;
    const totalPros = locations.reduce((sum, loc) => sum + loc.activeProfessionalsCount, 0);
    const totalVendors = locations.reduce((sum, loc) => sum + loc.activeVendorsCount, 0);

    return {
      cities: locations.length,
      activeZones: activeLocs,
      pins: totalPins,
      network: totalPros + totalVendors,
    };
  }, [locations]);

  const uniqueStates = useMemo(() => {
    return Array.from(new Set(locations.map((loc) => loc.state)));
  }, [locations]);

  const handleToggle = (locId: string, current: boolean, cityName: string) => {
    try {
      const updated = toggleLocationServiceStatus(locId);
      setLocations(updated);

      recordPlatformAuditLog({
        action: 'TOGGLE_LOCATION',
        module: 'LOCATIONS',
        targetId: cityName,
        performedBy: 'Super Administrator',
        notes: `City coverage for ${cityName} switched to ${!current ? 'ACTIVE' : 'INACTIVE'}`,
      });

      success(`Service for ${cityName} is now ${!current ? 'ENABLED' : 'PAUSED'}`);
    } catch {
      error('Failed to toggle location status');
    }
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim() || !pincodesInput.trim()) {
      error('Please enter city name and at least one PIN code.');
      return;
    }

    const cleanPins = pincodesInput
      .split(/[\s,]+/)
      .map((p) => p.trim())
      .filter((p) => /^\d{6}$/.test(p));

    if (cleanPins.length === 0) {
      error('Please enter valid 6-digit Indian PIN codes.');
      return;
    }

    try {
      const added = addPlatformServiceLocation({
        state: state.trim(),
        city: city.trim(),
        deliveryZone: deliveryZone.trim(),
        pincodes: cleanPins,
        serviceAvailable,
        activeProfessionalsCount: 0,
        activeVendorsCount: 0,
      });

      recordPlatformAuditLog({
        action: 'ADD_LOCATION',
        module: 'LOCATIONS',
        targetId: added.city,
        performedBy: 'Super Administrator',
        notes: `Added territory ${added.city}, ${added.state} with ${cleanPins.length} PIN codes`,
      });

      success(`Territory ${added.city} added with ${cleanPins.length} PIN codes!`);
      setLocStep(1);
    setShowAddModal(false);
      setCity('');
      setPincodesInput('');
      refreshData();
    } catch {
      error('Failed to add service territory');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <MapPin className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-navy-950">Location & Territory Coverage</h1>
              <p className="text-xs text-slate-500">
                Configure serviceable PIN codes, regional material delivery hubs, and territorial contractor networks
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Service Territory</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cities Covered</p>
          <p className="text-2xl font-black text-navy-950 mt-1">{stats.cities}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Municipal zones</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Active Service Zones</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.activeZones}</p>
          <p className="text-[10px] text-emerald-600/70 mt-0.5">Full booking & delivery operational</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-sky-200/80 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Covered PIN Codes</p>
          <p className="text-2xl font-black text-sky-600 mt-1">{stats.pins}</p>
          <p className="text-[10px] text-sky-600/70 mt-0.5">Verified postal districts</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-purple-200/80 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Territory Network</p>
          <p className="text-2xl font-black text-purple-600 mt-1">{stats.network}</p>
          <p className="text-[10px] text-purple-600/70 mt-0.5">Local contractors & depot vendors</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search city, state, zone, or 6-digit PIN code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none text-xs"
            >
              <option value="ALL">All States</option>
              {uniqueStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLocations.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
            <Globe className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-sm">No territory locations match your search.</p>
          </div>
        ) : (
          filteredLocations.map((loc) => (
            <div
              key={loc.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition space-y-3.5"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-navy-950">{loc.city}</h3>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                      {loc.state}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    <span>{loc.deliveryZone}</span>
                  </p>
                </div>

                <button
                  onClick={() => handleToggle(loc.id, loc.serviceAvailable, loc.city)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                    loc.serviceAvailable
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {loc.serviceAvailable ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>OPERATIONAL</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 text-slate-400" />
                      <span>PAUSED</span>
                    </>
                  )}
                </button>
              </div>

              {/* Local Network Presence */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
                    <Users className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <p className="font-mono font-bold text-navy-950">{loc.activeProfessionalsCount}</p>
                    <p className="text-[10px] text-slate-500">Contractors/Pros</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                    <Store className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <p className="font-mono font-bold text-navy-950">{loc.activeVendorsCount}</p>
                    <p className="text-[10px] text-slate-500">Material Depots</p>
                  </div>
                </div>
              </div>

              {/* Covered PIN Codes List */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Serviceable Postal PIN Codes ({loc.pincodes.length})
                </p>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
                  {(loc.pincodes || []).map((pin) => (
                    <span
                      key={pin}
                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[10px] font-semibold border border-slate-200"
                    >
                      {pin}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Territory Modal */}
      <AnimatePresence>
        {showAddModal && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back / Cancel</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <MapPin className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Add Service Territory & PIN Code
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Service Locations • Admin Platform Operations
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1200px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* STEPPER PROGRESS BAR */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-200/80 shadow-sm">
              <div className="grid grid-cols-2 gap-3 sm:gap-6">
                {[
                  { step: 1, title: '1. Territory & Zone', desc: 'State Jurisdiction, City & Hub Logistics Zone' },
                  { step: 2, title: '2. PIN Codes & Status', desc: 'Postal PIN Coverage & Immediate Dispatch' },
                ].map((s) => {
                  const isActive = locStep === s.step;
                  const isCompleted = locStep > s.step;
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => setLocStep(s.step as 1 | 2)}
                      className={`text-left p-3 rounded-xl border transition cursor-pointer flex flex-col justify-center ${
                        isActive
                          ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
                          : isCompleted
                          ? 'bg-emerald-100/80 border-emerald-300 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-600 text-white'
                              : isCompleted
                              ? 'bg-emerald-700 text-white'
                              : 'bg-slate-300 text-slate-700'
                          }`}
                        >
                          {isCompleted ? <Check className="w-3 h-3" /> : s.step}
                        </span>
                        <span className="font-bold text-xs text-navy-950 truncate">{s.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 pl-7 hidden sm:inline truncate">{s.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FORM CONTAINER */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
              <form onSubmit={handleAddLocation} className="space-y-6 text-xs text-slate-700">
                {/* STEP 1: TERRITORY & ZONE */}
                {locStep === 1 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-base font-bold text-navy-950">Step 1: State, City & Logistics Jurisdiction</h3>
                      <p className="text-xs text-slate-500">Specify operational geography and central delivery warehouse zone.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">State / Union Territory *</label>
                        <select
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                        >
                          {[
                            'Delhi',
                            'Haryana',
                            'Uttar Pradesh',
                            'Rajasthan',
                            'Maharashtra',
                            'Karnataka',
                            'Telangana',
                            'Madhya Pradesh',
                            'Gujarat',
                            'Punjab',
                          ].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">City / Municipal Area *</label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Logistics / Delivery Zone *</label>
                      <input
                        type="text"
                        required
                        placeholder=""
                        value={deliveryZone}
                        onChange={(e) => setDeliveryZone(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!city.trim() || !deliveryZone.trim()) {
                            alert('Please enter City and Logistics Zone.');
                            return;
                          }
                          setLocStep(2);
                        }}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
                      >
                        <span>Proceed to PIN Codes & Status</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: PIN CODES & STATUS */}
                {locStep === 2 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-base font-bold text-navy-950">Step 2: Postal PIN Coverage & Service Activation</h3>
                      <p className="text-xs text-slate-500">Provide comma-separated postal PIN codes and set instant availability.</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Covered 6-Digit PIN Codes *</label>
                        <textarea
                          rows={4}
                          required
                          placeholder="Enter postal PIN codes separated by comma or space (e.g. 122001, 122002, 122018)..."
                          value={pincodesInput}
                          onChange={(e) => setPincodesInput(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Separate multiple PIN codes with commas or spaces.</p>
                      </div>

                      <div className="flex items-center gap-2 pt-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <input
                          type="checkbox"
                          id="serviceAvailableCheck"
                          checked={serviceAvailable}
                          onChange={(e) => setServiceAvailable(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <label htmlFor="serviceAvailableCheck" className="text-xs font-semibold text-slate-800 cursor-pointer">
                          Enable service availability immediately in customer search & checkout
                        </label>
                      </div>

                      {/* Summary Preview */}
                      <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200/80">
                        <div className="text-[11px] font-bold text-emerald-900 uppercase mb-2">Territory Coverage Summary</div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div><span className="text-slate-500 block text-[10px]">Location:</span> <span className="font-bold text-navy-950">{city}, {state}</span></div>
                          <div><span className="text-slate-500 block text-[10px]">Logistics Zone:</span> <span className="font-bold text-emerald-800">{deliveryZone}</span></div>
                          <div><span className="text-slate-500 block text-[10px]">Status:</span> <span className={`font-bold ${serviceAvailable ? 'text-emerald-700' : 'text-slate-600'}`}>{serviceAvailable ? 'ACTIVE' : 'INACTIVE'}</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setLocStep(1)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Step 1</span>
                      </button>
                      <button
                        type="submit"
                        className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Save Service Territory</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default AdminLocations;
