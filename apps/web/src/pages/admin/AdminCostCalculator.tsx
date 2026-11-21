import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../../context/ToastContext.js';
import { formatINR } from '../../lib/utils.js';
import { apiRequest } from '../../lib/api.js';
import {
  Calculator,
  Building2,
  Hammer,
  Sparkles,
  Sliders,
  DollarSign,
  TrendingUp,
  MapPin,
  Save,
  RotateCcw,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  ShieldCheck,
  Search,
  ExternalLink,
  Phone,
  Calendar,
  IndianRupee,
  RefreshCw,
  PackageCheck,
  AlertCircle,
} from 'lucide-react';

interface MaterialRate {
  key: string;
  name: string;
  unit: string;
  rate: number;
  spec: string;
  isBenchmark: boolean;
}

interface PackageTierAdmin {
  id: string;
  name: string;
  ratePerSqFt: number;
  renovationRate: number;
  interiorRate: number;
  specSummary: string;
}

interface CityRateAdmin {
  name: string;
  state: string;
  multiplier: number;
}

interface SavedEstimate {
  id: string;
  customerName: string;
  phone: string;
  city: string;
  plotSize: string;
  builtUpSqFt: number;
  packageType: string;
  totalCost: number;
  createdAt: string;
  status: 'PENDING_CONTACT' | 'RFQ_CONVERTED' | 'DISMISSED';
}

const DEFAULT_MATERIAL_RATES: MaterialRate[] = [
  { key: 'cement', name: 'Grade 43/53 PPC/OPC Cement', unit: '₹ / 50kg bag', rate: 385, spec: 'ACC / UltraTech / Ambuja certified', isBenchmark: true },
  { key: 'steel', name: 'TMT Primary Fe 550D Rebars', unit: '₹ / Metric Tonne', rate: 62000, spec: 'Tata Tiscon / JSW Neosteel / Jindal', isBenchmark: true },
  { key: 'sand', name: 'Zone-II Coarse Sand / M-Sand', unit: '₹ / CFT', rate: 58, spec: 'Washed Zone II river sand / M-Sand', isBenchmark: true },
  { key: 'aggregate', name: 'Blue Granite Aggregate (10/20mm)', unit: '₹ / CFT', rate: 42, spec: 'Machine crushed angular blue granite', isBenchmark: true },
  { key: 'brick', name: 'Red Clay Bricks / AAC Blocks', unit: '₹ / Piece', rate: 8.5, spec: 'First class kiln burnt (10.5 N/mm²)', isBenchmark: true },
  { key: 'flooring_std', name: 'Standard Vitrified Floor Tiles (2x2)', unit: '₹ / Sq.Ft', rate: 45, spec: 'Double charged vitrified tiles', isBenchmark: false },
  { key: 'flooring_prem', name: 'Glazed Vitrified Tiles GVT (4x2)', unit: '₹ / Sq.Ft', rate: 75, spec: 'Kajaria / Somany nano polished', isBenchmark: false },
  { key: 'flooring_lux', name: 'Italian Marble / Large Slabs', unit: '₹ / Sq.Ft', rate: 160, spec: 'Botticino / GVT 6x4 ft designer slabs', isBenchmark: false },
];

const DEFAULT_PACKAGES: PackageTierAdmin[] = [
  { id: 'standard', name: 'Silver / Essential Tier', ratePerSqFt: 1550, renovationRate: 750, interiorRate: 850, specSummary: 'Birla/Ambuja cement, Kamdhenu steel, standard tiles, anchor electrical' },
  { id: 'premium', name: 'Gold / Premium Tier (Most Popular)', ratePerSqFt: 1850, renovationRate: 1050, interiorRate: 1250, specSummary: 'UltraTech Super, Tata Tiscon Fe 550D, 4x2 GVT tiles, Jaquar sanitary' },
  { id: 'luxury', name: 'Platinum / Luxury Villa Tier', ratePerSqFt: 2350, renovationRate: 1450, interiorRate: 1850, specSummary: 'Design mix M25, Italian marble, Schüco windows, Grohe thermostatic' },
];

const DEFAULT_CITIES: CityRateAdmin[] = [
  { name: 'Bhopal (MP)', state: 'Madhya Pradesh', multiplier: 1.0 },
  { name: 'Indore (MP)', state: 'Madhya Pradesh', multiplier: 1.02 },
  { name: 'Delhi NCR (Gurugram / Noida)', state: 'Delhi NCR', multiplier: 1.12 },
  { name: 'Bengaluru (KA)', state: 'Karnataka', multiplier: 1.14 },
  { name: 'Mumbai / Pune (MH)', state: 'Maharashtra', multiplier: 1.15 },
  { name: 'Jaipur (RJ)', state: 'Rajasthan', multiplier: 1.02 },
  { name: 'Lucknow (UP)', state: 'Uttar Pradesh', multiplier: 1.01 },
  { name: 'Hyderabad (TS)', multiplier: 1.08, state: 'Telangana' },
  { name: 'Chandigarh / Tricity', multiplier: 1.06, state: 'Punjab / Haryana' },
  { name: 'Tier 3 / Other Municipal Town', multiplier: 0.94, state: 'Other' },
];

const INITIAL_ESTIMATES: SavedEstimate[] = [];

export const AdminCostCalculator: React.FC = () => {
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'RATES' | 'PACKAGES' | 'CITIES' | 'ESTIMATES' | 'SIMULATOR'>('RATES');
  const [materialRates, setMaterialRates] = useState<MaterialRate[]>(() => {
    const saved = localStorage.getItem('gd_admin_material_rates');
    return saved ? JSON.parse(saved) : DEFAULT_MATERIAL_RATES;
  });
  const [packages, setPackages] = useState<PackageTierAdmin[]>(() => {
    const saved = localStorage.getItem('gd_admin_packages');
    return saved ? JSON.parse(saved) : DEFAULT_PACKAGES;
  });
  const [cities, setCities] = useState<CityRateAdmin[]>(() => {
    const saved = localStorage.getItem('gd_admin_cities');
    return saved ? JSON.parse(saved) : DEFAULT_CITIES;
  });
  const [estimates, setEstimates] = useState<SavedEstimate[]>(() => {
    const saved = localStorage.getItem('gd_admin_customer_estimates');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.filter(
            (e: any) =>
              !e.customerName?.toLowerCase().includes('vikram') &&
              !e.customerName?.toLowerCase().includes('rajesh sharma') &&
              !e.customerName?.toLowerCase().includes('pooja verma') &&
              !e.customerName?.toLowerCase().includes('anil gupta')
          )
        : [];
    } catch {
      return [];
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Simulator State inside Admin
  const [simLength, setSimLength] = useState(50);
  const [simWidth, setSimWidth] = useState(30);
  const [simFloors, setSimFloors] = useState(2);
  const [simCoverage, setSimCoverage] = useState(80);
  const [simPackage, setSimPackage] = useState('premium');
  const [simCity, setSimCity] = useState('Delhi NCR (Gurugram / Noida)');
  const [simMode, setSimMode] = useState<'CONSTRUCTION' | 'RENOVATION' | 'INTERIOR'>('CONSTRUCTION');

  // Computed Simulator Math
  const simBuiltUpArea = useMemo(() => {
    const plot = simLength * simWidth;
    const ground = Math.round((plot * simCoverage) / 100);
    return ground * simFloors;
  }, [simLength, simWidth, simCoverage, simFloors]);

  const activePkg = packages.find((p) => p.id === simPackage) || packages[1];
  const activeCt = cities.find((c) => c.name === simCity) || cities[0];

  const simBaseRate = useMemo(() => {
    if (simMode === 'RENOVATION') return activePkg.renovationRate;
    if (simMode === 'INTERIOR') return activePkg.interiorRate;
    return activePkg.ratePerSqFt;
  }, [simMode, activePkg]);

  const simTotal = Math.round(simBuiltUpArea * simBaseRate * activeCt.multiplier);

  const handleRateChange = (key: string, newRate: number) => {
    setMaterialRates((prev) =>
      prev.map((item) => (item.key === key ? { ...item, rate: newRate } : item))
    );
    setIsEditing(true);
  };

  const handleSaveRates = () => {
    localStorage.setItem('gd_admin_material_rates', JSON.stringify(materialRates));
    localStorage.setItem('gd_admin_packages', JSON.stringify(packages));
    localStorage.setItem('gd_admin_cities', JSON.stringify(cities));
    setIsEditing(false);
    success('Cost Calculator benchmark rate cards successfully updated in database!');
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all rates and packages to official CPWD defaults?')) {
      setMaterialRates(DEFAULT_MATERIAL_RATES);
      setPackages(DEFAULT_PACKAGES);
      setCities(DEFAULT_CITIES);
      localStorage.removeItem('gd_admin_material_rates');
      localStorage.removeItem('gd_admin_packages');
      localStorage.removeItem('gd_admin_cities');
      setIsEditing(false);
      success('Reset to official CPWD / IS 456 default benchmark rates.');
    }
  };

  const handleUpdateStatus = (id: string, newStatus: SavedEstimate['status']) => {
    setEstimates((prev) => {
      const updated = prev.map((est) => (est.id === id ? { ...est, status: newStatus } : est));
      localStorage.setItem('gd_admin_customer_estimates', JSON.stringify(updated));
      return updated;
    });
    success(`Estimate ${id} status updated to ${newStatus.replace('_', ' ')}.`);
  };

  const filteredEstimates = estimates.filter((e) =>
    e.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.phone.includes(searchQuery) ||
    e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 font-display">
                Cost Calculator & Rate Engine Control
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                IS 456 • CPWD 2026
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage live civil construction rates, raw material indices, city multipliers & customer estimates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isEditing && (
            <button
              onClick={handleSaveRates}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Rate Updates</span>
            </button>
          )}

          <a
            href="/cost-calculator"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition"
          >
            <span>Live Public Calculator</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          </a>
        </div>
      </div>

      {/* KPI Benchmark Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cement Benchmark</div>
          <div className="text-xl font-black text-slate-900 mt-1">₹{materialRates.find((m) => m.key === 'cement')?.rate} <span className="text-xs font-normal text-slate-500">/ bag</span></div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Grade 43/53 PPC Wholesale
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Primary Steel (Fe 550D)</div>
          <div className="text-xl font-black text-slate-900 mt-1">₹{materialRates.find((m) => m.key === 'steel')?.rate.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-500">/ MT</span></div>
          <div className="text-[11px] text-slate-600 font-semibold mt-0.5">Tata Tiscon / JSW Index</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gold / Premium Tier</div>
          <div className="text-xl font-black text-amber-600 mt-1">₹{packages.find((p) => p.id === 'premium')?.ratePerSqFt} <span className="text-xs font-normal text-slate-500">/ sq.ft</span></div>
          <div className="text-[11px] text-slate-500 font-semibold mt-0.5">85% Homeowners Choice</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Saved Customer Inquiries</div>
          <div className="text-xl font-black text-blue-700 mt-1">{estimates.length} Inquiries</div>
          <div className="text-[11px] text-blue-600 font-semibold mt-0.5 flex items-center gap-1">
            <Phone className="w-3 h-3" /> Ready for RFQ Dispatch
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-2xl">
        {[
          { id: 'RATES', label: 'Material Rate Cards', icon: DollarSign },
          { id: 'PACKAGES', label: 'Construction Packages', icon: Layers },
          { id: 'CITIES', label: 'City Multipliers', icon: MapPin },
          { id: 'ESTIMATES', label: `Customer Inquiries (${estimates.length})`, icon: Phone },
          { id: 'SIMULATOR', label: 'Admin Instant Simulator', icon: Calculator },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition -mb-px ${
                isActive
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Material Rate Cards */}
      {activeTab === 'RATES' && (
        <div className="bg-white p-6 rounded-b-2xl border border-t-0 border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Wholesale Raw Material Benchmark Rates</h2>
              <p className="text-xs text-slate-500">
                These rates directly feed into the Bill of Quantities (BOQ) algorithm for Cement, Steel, Sand, and Bricks.
              </p>
            </div>
            <button
              onClick={handleResetDefaults}
              className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 underline font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to CPWD Defaults</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Raw Material</th>
                  <th className="py-3 px-4">Unit of Measure</th>
                  <th className="py-3 px-4">Active Rate (₹)</th>
                  <th className="py-3 px-4">Quality / Brand Specification</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {materialRates.map((mat) => (
                  <tr key={mat.key} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <span>{mat.name}</span>
                      {mat.isBenchmark && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded">
                          IS-Core
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{mat.unit}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 font-bold">₹</span>
                        <input
                          type="number"
                          value={mat.rate}
                          onChange={(e) => handleRateChange(mat.key, Number(e.target.value))}
                          className="w-24 px-2 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:border-amber-500 text-xs"
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">{mat.spec}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={handleSaveRates}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-lg text-[11px] font-bold transition"
                      >
                        Apply
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Construction Packages */}
      {activeTab === 'PACKAGES' && (
        <div className="bg-white p-6 rounded-b-2xl border border-t-0 border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Civil & House Construction Packages</h2>
            <p className="text-xs text-slate-500">
              Per square foot base rates applied across New Construction, Renovation, and Interior Design packages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.id} className="p-5 rounded-2xl border-2 border-slate-200 hover:border-amber-400 bg-slate-50/50 space-y-4 transition">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">{pkg.name}</h3>
                  <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full uppercase">
                    {pkg.id}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">New Construction:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        value={pkg.ratePerSqFt}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, ratePerSqFt: val } : p));
                          setIsEditing(true);
                        }}
                        className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-slate-900 text-xs"
                      />
                      <span className="text-slate-500 text-[10px]">/sq.ft</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Home Renovation:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        value={pkg.renovationRate}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, renovationRate: val } : p));
                          setIsEditing(true);
                        }}
                        className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-slate-900 text-xs"
                      />
                      <span className="text-slate-500 text-[10px]">/sq.ft</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Interior Design:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        value={pkg.interiorRate}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, interiorRate: val } : p));
                          setIsEditing(true);
                        }}
                        className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-slate-900 text-xs"
                      />
                      <span className="text-slate-500 text-[10px]">/sq.ft</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 border-t border-slate-200 pt-2">
                  {pkg.specSummary}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveRates}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              <span>Save All Package Rates</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: City Multipliers */}
      {activeTab === 'CITIES' && (
        <div className="bg-white p-6 rounded-b-2xl border border-t-0 border-slate-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Regional City Construction Cost Multipliers</h2>
            <p className="text-xs text-slate-500">
              Factor in local labor wages, regional stone availability, and municipal transportation costs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cities.map((city, idx) => (
              <div key={city.name} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900">{city.name}</div>
                  <div className="text-[10px] text-slate-500">{city.state}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500">x</span>
                  <input
                    type="number"
                    step="0.01"
                    value={city.multiplier}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCities((prev) => prev.map((c, i) => i === idx ? { ...c, multiplier: val } : c));
                      setIsEditing(true);
                    }}
                    className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveRates}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save City Multipliers</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Customer Saved Estimates */}
      {activeTab === 'ESTIMATES' && (
        <div className="bg-white p-6 rounded-b-2xl border border-t-0 border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Homeowner Calculator Inquiries</h2>
              <p className="text-xs text-slate-500">
                Calculations generated on public portal. Follow up and convert high-intent estimates into confirmed RFQs.
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, phone, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500 w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Estimate ID</th>
                  <th className="py-3 px-4">Customer Name & Phone</th>
                  <th className="py-3 px-4">Location & Plot Size</th>
                  <th className="py-3 px-4">Package</th>
                  <th className="py-3 px-4">Budget Forecast</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredEstimates.map((est) => (
                  <tr key={est.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-700">
                      {est.id}
                      <div className="text-[10px] font-sans text-slate-400">{est.createdAt}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{est.customerName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{est.phone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{est.city}</div>
                      <div className="text-[11px] text-slate-500">{est.plotSize} ({est.builtUpSqFt} sq.ft)</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                        {est.packageType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                      {formatINR(est.totalCost)}
                    </td>
                    <td className="py-3.5 px-4">
                      {est.status === 'PENDING_CONTACT' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          Pending Call
                        </span>
                      )}
                      {est.status === 'RFQ_CONVERTED' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          RFQ Created
                        </span>
                      )}
                      {est.status === 'DISMISSED' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          Archived
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {est.status === 'PENDING_CONTACT' ? (
                        <button
                          onClick={() => handleUpdateStatus(est.id, 'RFQ_CONVERTED')}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] rounded-lg transition shadow-2xs"
                        >
                          Convert to RFQ
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(est.id, 'PENDING_CONTACT')}
                          className="text-slate-500 hover:text-slate-800 text-[11px] font-medium underline"
                        >
                          Reopen
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Admin Instant Simulator */}
      {activeTab === 'SIMULATOR' && (
        <div className="bg-white p-6 rounded-b-2xl border border-t-0 border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Admin Live Quotation Simulator</h2>
            <p className="text-xs text-slate-500">
              Calculate instant estimates while on phone calls with homeowners and generate on-the-spot budget forecasts.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Inputs */}
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Project Type</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['CONSTRUCTION', 'RENOVATION', 'INTERIOR'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setSimMode(m)}
                      className={`py-1.5 text-[11px] font-bold rounded-lg border transition ${
                        simMode === m ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {m === 'CONSTRUCTION' ? 'New Civil' : m === 'RENOVATION' ? 'Renovate' : 'Interior'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Plot Length (ft)</label>
                  <input
                    type="number"
                    value={simLength}
                    onChange={(e) => setSimLength(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Plot Width (ft)</label>
                  <input
                    type="number"
                    value={simWidth}
                    onChange={(e) => setSimWidth(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Floors (G + X)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={simFloors}
                    onChange={(e) => setSimFloors(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Coverage (%)</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={simCoverage}
                    onChange={(e) => setSimCoverage(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Package Tier</label>
                <select
                  value={simPackage}
                  onChange={(e) => setSimPackage(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                >
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (₹{p.ratePerSqFt}/sq.ft)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">City / Region</label>
                <select
                  value={simCity}
                  onChange={(e) => setSimCity(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                >
                  {cities.map((c) => (
                    <option key={c.name} value={c.name}>{c.name} (x{c.multiplier})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Output Display */}
            <div className="lg:col-span-2 bg-gradient-to-br from-[#e8f3fe] via-[#f1f7fe] to-[#e4f0fc] text-slate-800 p-6 rounded-2xl flex flex-col justify-between shadow-sm border border-blue-200/90">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-blue-200/80">
                  <span className="text-xs text-blue-900 font-bold uppercase tracking-wider font-mono">
                    Instant CPWD Budget Calculation
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Built-up Area: <strong className="text-navy-950 font-black">{simBuiltUpArea.toLocaleString('en-IN')} sq.ft</strong>
                  </span>
                </div>

                <div className="mt-6 space-y-1">
                  <div className="text-xs text-slate-500 font-medium">Total Projected Cost:</div>
                  <div className="text-3xl sm:text-4xl font-black text-navy-950 font-display">
                    {formatINR(simTotal)}
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    Effective Rate: ₹{Math.round(simBaseRate * activeCt.multiplier)} / sq.ft • {simCity}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-blue-200/80">
                  <div className="bg-white/90 p-2.5 rounded-xl border border-blue-200/80 shadow-xs">
                    <div className="text-[10px] text-slate-500 font-medium">Cement Bags</div>
                    <div className="text-sm font-black text-navy-950 font-mono mt-0.5">{Math.round(simBuiltUpArea * 0.40).toLocaleString('en-IN')} Bags</div>
                  </div>
                  <div className="bg-white/90 p-2.5 rounded-xl border border-blue-200/80 shadow-xs">
                    <div className="text-[10px] text-slate-500 font-medium">TMT Steel</div>
                    <div className="text-sm font-black text-navy-950 font-mono mt-0.5">{((simBuiltUpArea * 3.75) / 1000).toFixed(2)} MT</div>
                  </div>
                  <div className="bg-white/90 p-2.5 rounded-xl border border-blue-200/80 shadow-xs">
                    <div className="text-[10px] text-slate-500 font-medium">River Sand</div>
                    <div className="text-sm font-black text-navy-950 font-mono mt-0.5">{Math.round(simBuiltUpArea * 1.85).toLocaleString('en-IN')} CFT</div>
                  </div>
                  <div className="bg-white/90 p-2.5 rounded-xl border border-blue-200/80 shadow-xs">
                    <div className="text-[10px] text-slate-500 font-medium">Red Bricks</div>
                    <div className="text-sm font-black text-navy-950 font-mono mt-0.5">{Math.round(simBuiltUpArea * 19).toLocaleString('en-IN')} Pcs</div>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-blue-200/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  IS 456 Compliant Structural Formulas Applied
                </span>
                <button
                  onClick={() => {
                    const newEst: SavedEstimate = {
                      id: `EST-ADMIN-${Date.now().toString(36).toUpperCase()}`,
                      customerName: 'Direct Phone Inquiry',
                      phone: '+91 (Phone Log)',
                      city: simCity,
                      plotSize: `${simLength} x ${simWidth} ft`,
                      builtUpSqFt: simBuiltUpArea,
                      packageType: activePkg.name,
                      totalCost: simTotal,
                      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      status: 'PENDING_CONTACT',
                    };
                    setEstimates((prev) => [newEst, ...prev]);
                    localStorage.setItem('gd_admin_customer_estimates', JSON.stringify([newEst, ...estimates]));
                    success('Simulation saved to Customer Inquiries list.');
                    setActiveTab('ESTIMATES');
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition"
                >
                  Save as Phone Inquiry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
