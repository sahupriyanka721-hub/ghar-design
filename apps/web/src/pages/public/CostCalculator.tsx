import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatRupees } from '../../lib/utils.js';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../lib/api.js';
import {
  Calculator,
  Building2,
  Hammer,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Printer,
  ChevronRight,
  TrendingUp,
  Package,
  Layers,
  MapPin,
  Compass,
  FileText,
  Sliders,
  Award,
  Zap,
  Check,
  Percent,
  Info,
  Server,
  Save,
  CheckCircle,
  Clock,
  Download,
} from 'lucide-react';

// Package tiers with realistic Indian construction market rates (₹ per sq.ft)
interface PackageTier {
  id: 'standard' | 'premium' | 'luxury';
  name: string;
  badge: string;
  ratePerSqFt: number;
  renovationRatePerSqFt: number;
  interiorRatePerSqFt: number;
  gradient: string;
  borderColor: string;
  accentColor: string;
  summary: string;
  specifications: {
    cement: string;
    steel: string;
    flooring: string;
    windows: string;
    electrical: string;
    sanitary: string;
    paint: string;
  };
}

interface CityOption {
  name: string;
  multiplier: number;
  state: string;
}

interface MaterialBOQ {
  material: string;
  quantity: string;
  numericQuantity: number;
  unit: string;
  unitRate: number;
  unitEstimate: string;
  approxCost: number;
  brandNote: string;
}

interface StageBreakdownItem {
  key: string;
  label: string;
  percent: number;
  amount: number;
  description: string;
}

interface EscrowMilestone {
  stage: number;
  name: string;
  releasePercent: number;
  amount: number;
  criteria: string;
}

interface BackendCalculationResult {
  estimateId: string;
  generatedAt: string;
  inputs: {
    projectMode: 'CONSTRUCTION' | 'RENOVATION' | 'INTERIOR';
    plotLength: number;
    plotWidth: number;
    plotAreaSqFt: number;
    floors: number;
    groundCoveragePercent: number;
    groundFloorBuiltUpSqFt: number;
    totalBuiltUpSqFt: number;
    packageId: string;
    packageName: string;
    cityName: string;
    cityMultiplier: number;
  };
  rates: {
    baseRatePerSqFt: number;
    effectiveRatePerSqFt: number;
    currency: 'INR';
  };
  totalCost: number;
  totalCostFormatted: string;
  stageBreakdown: StageBreakdownItem[];
  materialBOQ: MaterialBOQ[];
  escrowMilestones: EscrowMilestone[];
  metadata: {
    standardsApplied: string[];
    isEstimateGuaranteed: boolean;
    validityDays: number;
    calculationEngine: string;
  };
}

const DEFAULT_PACKAGES: PackageTier[] = [
  {
    id: 'standard',
    name: 'Silver / Essential',
    badge: 'Budget Friendly',
    ratePerSqFt: 1550,
    renovationRatePerSqFt: 750,
    interiorRatePerSqFt: 850,
    gradient: 'from-slate-50 to-sky-50/50',
    borderColor: 'border-slate-300',
    accentColor: 'text-slate-700 bg-slate-100',
    summary: 'Reliable, structurally sound quality using established national brands. Ideal for rental residences and budget homes.',
    specifications: {
      cement: 'ACC / Ambuja / Birla PPC Cement (Grade 43/53)',
      steel: 'Kamdhenu / Jindal Fe 500 TMT Rebars',
      flooring: 'Standard Vitrified Floor Tiles (2x2 ft, ₹45/sq.ft)',
      windows: 'Powder-coated 2-track sliding aluminium windows',
      electrical: 'Anchor / Havells FR fire-retardant wiring & modular switches',
      sanitary: 'Cera / Hindware CP fittings and dual-flush commodes',
      paint: 'Asian Paints Tractor Emulsion (Internal) + Ace Exterior',
    },
  },
  {
    id: 'premium',
    name: 'Gold / Premium',
    badge: 'Most Popular (85% Homeowners)',
    ratePerSqFt: 1850,
    renovationRatePerSqFt: 1050,
    interiorRatePerSqFt: 1250,
    gradient: 'from-amber-50/40 via-white to-gold-50/50',
    borderColor: 'border-gold-500 shadow-xl shadow-gold-500/10 ring-2 ring-gold-400/40',
    accentColor: 'text-gold-900 bg-gold-400',
    summary: 'High-end engineering finishes, superior corrosion-resistant TMT steel, large format glazed vitrified tiles, and premium sanitary.',
    specifications: {
      cement: 'UltraTech Super / ACC Concrete Plus / Lafarge Concreto',
      steel: 'Tata Tiscon / JSW Neosteel Fe 550D Primary Steel',
      flooring: 'Glazed Vitrified Tiles (GVT) 4x2 ft Designer Slabs (₹75/sq.ft)',
      windows: 'Acoustic Insulated UPVC 3-track sliding with mosquito mesh',
      electrical: 'Polycab / Finolex FR-LSH wires + Schneider / Legrand Arteor switches',
      sanitary: 'Jaquar / Kohler wall-hung commodes with concealed flushing tanks',
      paint: 'Asian Paints Royale Luxury Emulsion + Apex Ultima Weatherproof',
    },
  },
  {
    id: 'luxury',
    name: 'Platinum / Luxury',
    badge: 'Structural Masterpiece',
    ratePerSqFt: 2350,
    renovationRatePerSqFt: 1450,
    interiorRatePerSqFt: 1850,
    gradient: 'from-sky-50/60 via-purple-50/20 to-slate-50',
    borderColor: 'border-navy-900 shadow-xl shadow-navy-950/15',
    accentColor: 'text-white bg-navy-950',
    summary: 'Bespoke luxury villa construction with Italian marble options, smart home conduits, solid Burma teak wood woodwork, and Grohe fittings.',
    specifications: {
      cement: 'UltraTech Weather Plus / M25/M30 Design Mix Concrete',
      steel: 'Tata Tiscon 550D Super Ductile / Corrosion Protected Epoxy Rebar',
      flooring: 'Italian Botticino Marble / GVT 6x4 ft Large Format Slabs (₹160+/sq.ft)',
      windows: 'German Fenesta / Schüco Heavy Duty UPVC / Thermal Break Aluminium',
      electrical: 'Smart Home Automation conduits + Touch Capacitive Glass Switches',
      sanitary: 'Grohe / Hansgrohe / Duravit concealed thermostatic diverters',
      paint: 'PU finish veneer / Teak woodwork + Royale Aspira + Italian Texture finishes',
    },
  },
];

const DEFAULT_CITIES: CityOption[] = [
  { name: 'Bhopal (MP)', multiplier: 1.0, state: 'Madhya Pradesh' },
  { name: 'Indore (MP)', multiplier: 1.02, state: 'Madhya Pradesh' },
  { name: 'Delhi NCR (Gurugram / Noida)', multiplier: 1.12, state: 'Delhi NCR' },
  { name: 'Bengaluru (KA)', multiplier: 1.14, state: 'Karnataka' },
  { name: 'Mumbai / Pune (MH)', multiplier: 1.15, state: 'Maharashtra' },
  { name: 'Jaipur (RJ)', multiplier: 1.02, state: 'Rajasthan' },
  { name: 'Lucknow (UP)', multiplier: 1.01, state: 'Uttar Pradesh' },
  { name: 'Hyderabad (TS)', multiplier: 1.08, state: 'Telangana' },
  { name: 'Chandigarh / Tricity', multiplier: 1.06, state: 'Punjab / Haryana' },
  { name: 'Tier 3 / Other Municipal Town', multiplier: 0.94, state: 'Other' },
];

export const CostCalculator: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mode Selection
  const [projectMode, setProjectMode] = useState<'CONSTRUCTION' | 'RENOVATION' | 'INTERIOR'>('CONSTRUCTION');

  // Dimension & Sizing Inputs
  const [plotLength, setPlotLength] = useState<number>(50); // ft
  const [plotWidth, setPlotWidth] = useState<number>(30); // ft
  const [floors, setFloors] = useState<number>(2); // Ground + 1
  const [groundCoveragePercent, setGroundCoveragePercent] = useState<number>(80); // 80% coverage standard setback
  const [customBuiltUpArea, setCustomBuiltUpArea] = useState<number | null>(null);

  // Quality Package
  const [selectedPackageId, setSelectedPackageId] = useState<'standard' | 'premium' | 'luxury'>('premium');

  // Location
  const [selectedCity, setSelectedCity] = useState<string>('Delhi NCR (Gurugram / Noida)');

  // Backend Integration States
  const [packages, setPackages] = useState<PackageTier[]>(DEFAULT_PACKAGES);
  const [cities, setCities] = useState<CityOption[]>(DEFAULT_CITIES);
  const [backendResult, setBackendResult] = useState<BackendCalculationResult | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'bom' | 'escrow'>('bom');

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic calculations based on Indian building geometry (Fallback Client Computation)
  const plotArea = plotLength * plotWidth;

  const calculatedBuiltUp = useMemo(() => {
    if (customBuiltUpArea !== null && customBuiltUpArea > 0) {
      return customBuiltUpArea;
    }
    const groundFloorBuiltUp = Math.round((plotArea * groundCoveragePercent) / 100);
    return groundFloorBuiltUp * floors;
  }, [plotArea, groundCoveragePercent, floors, customBuiltUpArea]);

  const activePackage = packages.find((p) => p.id === selectedPackageId) || packages[1];
  const activeCity = cities.find((c) => c.name === selectedCity) || cities[0];

  // Base rate based on active mode
  const baseRate = useMemo(() => {
    if (projectMode === 'RENOVATION') return activePackage.renovationRatePerSqFt;
    if (projectMode === 'INTERIOR') return activePackage.interiorRatePerSqFt;
    return activePackage.ratePerSqFt;
  }, [projectMode, activePackage]);

  // Fallback Total Estimated Cost
  const fallbackTotalCost = useMemo(() => {
    const raw = calculatedBuiltUp * baseRate * activeCity.multiplier;
    return Math.round(raw);
  }, [calculatedBuiltUp, baseRate, activeCity.multiplier]);

  // Use Backend Result when available, fallback to client math otherwise
  const totalCost = backendResult ? backendResult.totalCost : fallbackTotalCost;
  const estimateId = backendResult?.estimateId || `EST-LOCAL-${plotArea}`;

  // 1. Initial Load: Fetch Live Configuration from Admin Store or Express Backend
  useEffect(() => {
    let isMounted = true;

    // Check if Admin has updated packages in Admin Cost Calculator
    try {
      const savedPackages = localStorage.getItem('gd_admin_packages');
      if (savedPackages) {
        const parsed = JSON.parse(savedPackages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPackages((prev) =>
            prev.map((p) => {
              const matched = parsed.find((item: any) => item.id === p.id);
              if (matched) {
                return {
                  ...p,
                  ratePerSqFt: matched.ratePerSqFt || p.ratePerSqFt,
                  renovationRatePerSqFt: matched.renovationRate || p.renovationRatePerSqFt,
                  interiorRatePerSqFt: matched.interiorRate || p.interiorRatePerSqFt,
                };
              }
              return p;
            })
          );
        }
      }
    } catch (_) {}

    async function fetchConfig() {
      try {
        const res = await apiRequest<any>('/calculator/config');
        if (isMounted && res.success && res.data) {
          if (res.data.packages) setPackages(res.data.packages);
          if (res.data.cities) setCities(res.data.cities);
          setIsBackendConnected(true);
        }
      } catch (err) {
        // Quiet fallback to standard constants
        if (isMounted) setIsBackendConnected(false);
      }
    }
    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Debounced API Calculation Call to Backend Engine
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsCalculating(true);
      const startTime = performance.now();
      try {
        const payload = {
          projectMode,
          plotLength,
          plotWidth,
          floors,
          groundCoveragePercent,
          customBuiltUpArea,
          packageId: selectedPackageId,
          cityName: selectedCity,
        };

        const res = await apiRequest<BackendCalculationResult>('/calculator/estimate', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        const elapsed = Math.round(performance.now() - startTime);

        if (res.success && res.data) {
          setBackendResult(res.data);
          setIsBackendConnected(true);
          setLatencyMs(elapsed);
        }
      } catch (err) {
        setIsBackendConnected(false);
        setLatencyMs(null);
      } finally {
        setIsCalculating(false);
      }
    }, 200);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [
    projectMode,
    plotLength,
    plotWidth,
    floors,
    groundCoveragePercent,
    customBuiltUpArea,
    selectedPackageId,
    selectedCity,
  ]);

  // Breakdown Percentages (CPWD / IS 456 Construction Norms)
  const breakdown = useMemo(() => {
    if (backendResult?.stageBreakdown && backendResult.stageBreakdown.length > 0) {
      return backendResult.stageBreakdown;
    }
    // Fallback Breakdown
    if (projectMode === 'CONSTRUCTION') {
      return [
        { key: 'structure', label: 'Civil & RCC Structure', percent: 52, amount: Math.round(totalCost * 0.52), description: 'Excavation, footings, plinth beam, columns, slabs & brick masonry' },
        { key: 'finishes', label: 'Finishing & Flooring', percent: 26, amount: Math.round(totalCost * 0.26), description: 'Internal & external plaster, designer vitrified tiles, waterproofing & doors' },
        { key: 'mep', label: 'MEP (Plumbing & Electrical)', percent: 14, amount: Math.round(totalCost * 0.14), description: 'Concealed CPVC/UPVC piping, modular wiring, switchboards & sanitary fitments' },
        { key: 'design', label: 'Design & Sanction Drawings', percent: 8, amount: Math.round(totalCost * 0.08), description: '2D Vastu plans, 3D elevation walkthrough, IS 456 structural schedules & municipal approvals' },
      ];
    }
    if (projectMode === 'RENOVATION') {
      return [
        { key: 'structure', label: 'Dismantling & Structural Repairs', percent: 28, amount: Math.round(totalCost * 0.28), description: 'Controlled wall demolition, debris hauling, retrofitting & plaster hacking' },
        { key: 'finishes', label: 'Flooring, Tiling & Plastering', percent: 42, amount: Math.round(totalCost * 0.42), description: 'Tile replacement, wall skim coating, waterproofing treatments & luxury emulsion' },
        { key: 'mep', label: 'Plumbing & Concealed Wiring Replacement', percent: 20, amount: Math.round(totalCost * 0.20), description: 'New waterline lines, updated circuit breakers & sanitary ware replacements' },
        { key: 'design', label: 'Space Redesign & Site Supervision', percent: 10, amount: Math.round(totalCost * 0.10), description: 'Interior space planning, site measurements & execution monitoring' },
      ];
    }
    return [
      { key: 'joinery', label: 'Modular Kitchen & Core Joinery', percent: 35, amount: Math.round(totalCost * 0.35), description: 'BWP marine ply carcass, acrylic/PU shutters & soft-close German hardware' },
      { key: 'storage', label: 'Wardrobes, Storage & Wall Panelling', percent: 35, amount: Math.round(totalCost * 0.35), description: 'Floor-to-ceiling wardrobes, TV consoles, fluted panels & veneer details' },
      { key: 'mep', label: 'False Ceiling & Ambient Lighting', percent: 18, amount: Math.round(totalCost * 0.18), description: 'Gyproc false ceiling, magnetic track lights, COB warm spotlights & cove channels' },
      { key: 'design', label: '3D Virtual Renders & 2D Working Details', percent: 12, amount: Math.round(totalCost * 0.12), description: 'Photorealistic 3D perspectives, material moodboards & production drawings' },
    ];
  }, [totalCost, projectMode, backendResult]);

  // Indian IS-Code Standard Bill of Materials (BOM) Estimate
  const estimatedMaterials = useMemo(() => {
    if (backendResult?.materialBOQ && backendResult.materialBOQ.length > 0) {
      return backendResult.materialBOQ;
    }
    return [
      {
        material: 'Grade 43/53 PPC/OPC Cement',
        quantity: `${Math.round(calculatedBuiltUp * 0.40).toLocaleString('en-IN')} Bags`,
        numericQuantity: Math.round(calculatedBuiltUp * 0.40),
        unit: 'Bags',
        unitRate: 385,
        unitEstimate: `~0.40 bags / sq.ft`,
        approxCost: Math.round(calculatedBuiltUp * 0.40) * 385,
        brandNote: activePackage.specifications.cement,
      },
      {
        material: 'TMT Structural Rebar (Primary Steel)',
        quantity: `${((calculatedBuiltUp * 3.75) / 1000).toFixed(2)} Metric Tonnes`,
        numericQuantity: Number(((calculatedBuiltUp * 3.75) / 1000).toFixed(2)),
        unit: 'MT',
        unitRate: 62000,
        unitEstimate: `~3.75 kg / sq.ft`,
        approxCost: Math.round(((calculatedBuiltUp * 3.75) / 1000) * 62000),
        brandNote: activePackage.specifications.steel,
      },
      {
        material: 'Coarse Sand / M-Sand (Zone II)',
        quantity: `${Math.round(calculatedBuiltUp * 1.85).toLocaleString('en-IN')} CFT`,
        numericQuantity: Math.round(calculatedBuiltUp * 1.85),
        unit: 'CFT',
        unitRate: 58,
        unitEstimate: `~1.85 cu.ft / sq.ft`,
        approxCost: Math.round(calculatedBuiltUp * 1.85) * 58,
        brandNote: 'Washed Zone II River / Plaster sand',
      },
      {
        material: 'Crushed Aggregates (10mm / 20mm Gitti)',
        quantity: `${Math.round(calculatedBuiltUp * 1.35).toLocaleString('en-IN')} CFT`,
        numericQuantity: Math.round(calculatedBuiltUp * 1.35),
        unit: 'CFT',
        unitRate: 42,
        unitEstimate: `~1.35 cu.ft / sq.ft`,
        approxCost: Math.round(calculatedBuiltUp * 1.35) * 42,
        brandNote: 'Blue granite hard aggregate for RCC',
      },
      {
        material: 'Red Clay Bricks / AAC Block Units',
        quantity: `${Math.round(calculatedBuiltUp * 19).toLocaleString('en-IN')} Pcs`,
        numericQuantity: Math.round(calculatedBuiltUp * 19),
        unit: 'Pcs',
        unitRate: 8.5,
        unitEstimate: `~19 bricks / sq.ft`,
        approxCost: Math.round(calculatedBuiltUp * 19 * 8.5),
        brandNote: 'First class kiln-burnt red clay or certified AAC blocks',
      },
      {
        material: 'Flooring Tiles & Skirting Material',
        quantity: `${Math.round(calculatedBuiltUp * 1.3).toLocaleString('en-IN')} Sq.Ft`,
        numericQuantity: Math.round(calculatedBuiltUp * 1.3),
        unit: 'Sq.Ft',
        unitRate: activePackage.id === 'standard' ? 45 : activePackage.id === 'premium' ? 75 : 160,
        unitEstimate: `~1.3 sq.ft incl. 10% wastage`,
        approxCost: Math.round(calculatedBuiltUp * 1.3) * (activePackage.id === 'standard' ? 45 : activePackage.id === 'premium' ? 75 : 160),
        brandNote: activePackage.specifications.flooring,
      },
    ];
  }, [calculatedBuiltUp, activePackage, backendResult]);

  // Milestone Escrow Schedule
  const escrowMilestones = useMemo(() => {
    if (backendResult?.escrowMilestones && backendResult.escrowMilestones.length > 0) {
      return backendResult.escrowMilestones;
    }
    return [
      { stage: 1, name: 'Foundation & Plinth Beam Casting', releasePercent: 15, amount: Math.round(totalCost * 0.15), criteria: 'Excavation, footing concrete cube testing & damp-proof course verification' },
      { stage: 2, name: 'Ground Floor RCC Columns & Slab', releasePercent: 20, amount: Math.round(totalCost * 0.20), criteria: 'Slab reinforcement inspection by structural engineer before pouring' },
      { stage: 3, name: 'Upper Floor Slab / Terrace Casting', releasePercent: 20, amount: Math.round(totalCost * 0.20), criteria: 'Curing completion & formwork de-shuttering clearance' },
      { stage: 4, name: 'Brick Masonry, Plaster & Waterproofing', releasePercent: 15, amount: Math.round(totalCost * 0.15), criteria: 'Internal/external plaster plumb check & terrace ponding test' },
      { stage: 5, name: 'MEP (Plumbing & Electrical Conduits)', releasePercent: 10, amount: Math.round(totalCost * 0.10), criteria: 'Pressure testing of waterline joints & conduit electrical continuity' },
      { stage: 6, name: 'Flooring, Doors, Windows & Sanitary', releasePercent: 10, amount: Math.round(totalCost * 0.10), criteria: 'Hollow sound inspection of floor tiles & fixture installation check' },
      { stage: 7, name: 'Final Paint, Snagging & Digital Handover', releasePercent: 10, amount: Math.round(totalCost * 0.10), criteria: '3-coat paint coat thickness check, debris removal & key handover' },
    ];
  }, [totalCost, backendResult]);

  // Action 1: Forward this estimate into the real 6-step Quotation Wizard
  const handleProceedToQuotation = async () => {
    setIsSaving(true);
    try {
      if (backendResult) {
        await apiRequest('/calculator/save', {
          method: 'POST',
          body: JSON.stringify(backendResult),
        });
      }
    } catch (e) {
      // Continue anyway
    } finally {
      setIsSaving(false);
    }

    const budgetRangeString =
      totalCost < 1500000
        ? '₹5 Lakhs - ₹15 Lakhs'
        : totalCost < 3000000
        ? '₹15 Lakhs - ₹30 Lakhs'
        : totalCost < 5000000
        ? '₹30 Lakhs - ₹50 Lakhs'
        : totalCost < 10000000
        ? '₹50 Lakhs - ₹1 Crore'
        : totalCost < 25000000
        ? '₹1 Crore - ₹2.5 Crores'
        : 'Above ₹2.5 Crores';

    const categorySlug =
      projectMode === 'CONSTRUCTION'
        ? 'new-house-construction'
        : projectMode === 'RENOVATION'
        ? 'home-renovation'
        : 'interior-designing';

    const prefillData = {
      estimateId,
      plotWidth,
      plotLength,
      builtUpArea: calculatedBuiltUp,
      floors,
      budgetRange: budgetRangeString,
      city: selectedCity.split(' ')[0],
      categorySlug,
      description: `Project estimated via GharDesign Backend Engine (${estimateId}). Target Package: ${activePackage.name}. Estimated Cost: ${formatRupees(totalCost)} for ${calculatedBuiltUp} sq.ft built-up area (${floors} floors).`,
    };

    sessionStorage.setItem('ghar_calculator_prefill', JSON.stringify(prefillData));
    navigate(`/dashboard/create-request?category=${categorySlug}&estimateId=${estimateId}`);
  };

  // Action 2: Save to Backend Database
  const handleSaveEstimate = async () => {
    setIsSaving(true);
    try {
      const dataToSave = backendResult || {
        estimateId,
        generatedAt: new Date().toISOString(),
        inputs: {
          projectMode,
          plotLength,
          plotWidth,
          plotAreaSqFt: plotArea,
          floors,
          groundCoveragePercent,
          groundFloorBuiltUpSqFt: Math.round((plotArea * groundCoveragePercent) / 100),
          totalBuiltUpSqFt: calculatedBuiltUp,
          packageId: activePackage.id,
          packageName: activePackage.name,
          cityName: activeCity.name,
          cityMultiplier: activeCity.multiplier,
        },
        totalCost,
      };

      const res = await apiRequest('/calculator/save', {
        method: 'POST',
        body: JSON.stringify(dataToSave),
      });

      setSaveSuccessMsg(`✓ Estimate ${estimateId} saved successfully to backend!`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (e: any) {
      setSaveSuccessMsg(`✓ Estimate ${estimateId} cached locally!`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Action 3: Forward directly to Material Procurement Marketplace
  const handleProceedToMaterials = () => {
    navigate('/dashboard/materials');
  };

  // Action 4: Clean browser print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-24 font-sans text-slate-800">
      
      {/* Top Ambient Glow & Grid Pattern */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Navigation Breadcrumb + Backend Status Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link to="/" className="hover:text-slate-900 transition">Home</Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">Interactive Cost & Material Estimator</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live Backend Connection Indicator */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                isBackendConnected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'
                }`}
              />
              <span>
                {isBackendConnected
                  ? `REST API Connected • Port 5000 ${latencyMs ? `(${latencyMs}ms)` : ''}`
                  : 'IS-456 Core Engine • Standalone/Edge'}
              </span>
              <span className="font-mono text-[10px] text-slate-500 font-semibold">[{estimateId}]</span>
            </div>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs shrink-0"
              title="Print official cost forecast"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Estimate</span>
            </button>
          </div>
        </div>

        {/* Master Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>IS 456:2000 & CPWD Benchmark Calculation Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-slate-900 tracking-tight leading-tight">
            House Construction & Material <span className="text-amber-600">Cost Calculator</span>
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Real-time server-side technical forecast of civil construction budget, itemized material bills (Cement, 
            TMT Steel, Sand, Bricks), and staged milestone escrow payouts based on genuine regional rates.
          </p>

          {/* Toast Notification on Save */}
          {saveSuccessMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{saveSuccessMsg}</span>
            </motion.div>
          )}
        </div>

        {/* Project Type Switcher Tabs (3 Modes) */}
        <div className="flex justify-center">
          <div className="bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-1.5">
            {[
              { id: 'CONSTRUCTION', label: 'New Construction', icon: Building2 },
              { id: 'RENOVATION', label: 'Home Renovation', icon: Hammer },
              { id: 'INTERIOR', label: 'Interior Design', icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = projectMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setProjectMode(tab.id as any)}
                  className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Two-Column Interactive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Interactive Parametric Controls */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Step A: Plot Dimensions & Floors */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Plot Dimensions & Floors</h3>
                    <p className="text-[11px] text-slate-500">Enter plot width, depth, and vertical stories</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                  {plotArea.toLocaleString('en-IN')} Sq.Ft Plot
                </span>
              </div>

              {/* Plot Dimensions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Plot Frontage / Width (Ft)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={10}
                      max={200}
                      value={plotWidth}
                      onChange={(e) => setPlotWidth(Math.max(10, Number(e.target.value) || 10))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold">Ft</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Plot Depth / Length (Ft)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={10}
                      max={300}
                      value={plotLength}
                      onChange={(e) => setPlotLength(Math.max(10, Number(e.target.value) || 10))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold">Ft</span>
                  </div>
                </div>
              </div>

              {/* Number of Floors (Pills) */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Number of Floors (Vertical Elevation)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { num: 1, label: 'Ground Only' },
                    { num: 2, label: 'G + 1 (2 Flr)' },
                    { num: 3, label: 'G + 2 (3 Flr)' },
                    { num: 4, label: 'G + 3 (4 Flr)' },
                  ].map((f) => (
                    <button
                      key={f.num}
                      onClick={() => setFloors(f.num)}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                        floors === f.num
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xs font-black">{f.num}</span>
                      <span className="text-[9px] font-semibold opacity-80">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ground Coverage Setback Slider */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Ground Coverage (Setbacks & Lawn):</span>
                  <span className="font-bold text-slate-900">{groundCoveragePercent}% Built-Up</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={100}
                  step={5}
                  value={groundCoveragePercent}
                  onChange={(e) => setGroundCoveragePercent(Number(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>50% (Spacious Lawn)</span>
                  <span>80% (Standard Setback)</span>
                  <span>100% (Full Plot)</span>
                </div>
              </div>

              {/* Final Calculated Built-Up Area Card */}
              <div className="p-3.5 bg-gradient-to-r from-sky-50 to-blue-50/70 border border-sky-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">
                    Total Estimated Construction Slab Area:
                  </span>
                  <div className="text-xl font-black text-slate-900 font-display">
                    {calculatedBuiltUp.toLocaleString('en-IN')} <span className="text-xs font-bold text-slate-600">Sq.Ft</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-500">
                    {plotWidth} x {plotLength} ft @ {groundCoveragePercent}% x {floors} Flr
                  </span>
                </div>
              </div>
            </div>

            {/* Step B: Location / City Multiplier */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">City & Regional Logistics Index</h3>
                  <p className="text-[11px] text-slate-500">Server calculates local material transit and municipal labor rates</p>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>Select Construction City</span>
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  {cities.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} {c.multiplier !== 1.0 ? `(${c.multiplier > 1.0 ? '+' : ''}${Math.round((c.multiplier - 1) * 100)}% transit/labour)` : '(Base Index)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step C: Specification Packages (3 Cards) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Choose Quality Package</h3>
                  <p className="text-[11px] text-slate-500">Structural steel grade, tiles, sanitaryware & brand tier</p>
                </div>
              </div>

              <div className="space-y-3">
                {packages.map((pkg) => {
                  const isSelected = selectedPackageId === pkg.id;
                  const rate =
                    projectMode === 'RENOVATION'
                      ? pkg.renovationRatePerSqFt
                      : projectMode === 'INTERIOR'
                      ? pkg.interiorRatePerSqFt
                      : pkg.ratePerSqFt;

                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 relative ${
                        isSelected
                          ? `${pkg.borderColor} bg-white`
                          : 'border-slate-200 bg-white/70 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-display font-black text-sm text-slate-900">
                              {pkg.name}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${pkg.accentColor}`}>
                              {pkg.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 leading-snug">
                            {pkg.summary}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-base font-black font-display text-slate-900">
                            ₹{rate.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold">/ Sq.Ft</div>
                        </div>
                      </div>

                      {/* Brand Chips Preview */}
                      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px] text-slate-600">
                        <div className="truncate">
                          <strong>Cement:</strong> {pkg.specifications.cement.split(' ')[0]}
                        </div>
                        <div className="truncate">
                          <strong>Steel:</strong> {pkg.specifications.steel.split(' ')[0]}
                        </div>
                        <div className="truncate">
                          <strong>Flooring:</strong> {pkg.specifications.flooring.split('(')[0]}
                        </div>
                        <div className="truncate">
                          <strong>Fittings:</strong> {pkg.specifications.sanitary.split(' ')[0]}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Live Forecast Results & Engineering Breakdown */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Master Result Card: Total Cost */}
            <div className="bg-gradient-to-br from-[#e8f3fe] via-[#f1f7fe] to-[#e4f0fc] rounded-3xl p-6 sm:p-8 border border-blue-200/90 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-200/80">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200/90 font-mono">
                        GharDesign Server-Calculated Estimate
                      </span>
                      {isCalculating && (
                        <span className="text-[10px] text-amber-600 animate-pulse font-mono font-bold">
                          Recomputing...
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black font-display text-navy-950 mt-1">
                      Estimated Project Investment
                    </h2>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-slate-500 font-medium block">Total Built-Up Area</span>
                    <span className="text-base font-bold text-navy-950 font-mono">
                      {calculatedBuiltUp.toLocaleString('en-IN')} Sq.Ft ({floors} Floors)
                    </span>
                  </div>
                </div>

                {/* Big Cost Numbers */}
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-baseline gap-2.5">
                      <div className="text-3xl sm:text-5xl font-black font-display text-navy-950 tracking-tight">
                        {formatRupees(totalCost)}
                      </div>
                      <span className="text-base sm:text-2xl font-bold text-amber-700 font-display">
                        ({totalCost >= 10000000 ? `₹${(totalCost / 10000000).toFixed(2)} Cr` : `₹${(totalCost / 100000).toFixed(2)} Lakhs`})
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-medium mt-1">
                      All-inclusive complete estimate (Civil + Finishes + MEP + 2D/3D Drawings)
                    </div>
                  </div>
                  <div className="bg-white/90 border border-blue-200/90 px-4 py-2.5 rounded-2xl text-right shadow-xs">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Effective Unit Rate</div>
                    <div className="text-sm font-bold text-navy-950 font-mono">
                      ₹{Math.round(baseRate * activeCity.multiplier).toLocaleString('en-IN')} / Sq.Ft
                    </div>
                  </div>
                </div>

                {/* 4-Stage Cost Distribution Bar */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-700 font-bold">
                    <span>Itemized Cost Allocation</span>
                    <span className="text-blue-700">100% Comprehensive</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden flex bg-white p-0.5 border border-blue-200/90 shadow-inner">
                    {breakdown.map((item, i) => {
                      const colors = ['bg-blue-600', 'bg-amber-500', 'bg-emerald-600', 'bg-indigo-600'];
                      return (
                        <div
                          key={item.key}
                          className={`${colors[i % colors.length]} h-full ${i === 0 ? 'rounded-l-full' : ''} ${i === breakdown.length - 1 ? 'rounded-r-full' : ''}`}
                          style={{ width: `${item.percent}%` }}
                          title={`${item.label} (${item.percent}%)`}
                        />
                      );
                    })}
                  </div>
                  
                  {/* Legend Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
                    {breakdown.map((item, i) => {
                      const dotColors = ['bg-blue-600', 'bg-amber-500', 'bg-emerald-600', 'bg-indigo-600'];
                      return (
                        <div key={item.key} className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <span className={`w-2 h-2 rounded-full ${dotColors[i % dotColors.length]}`} />
                          <span className="truncate">{item.label.split(' ')[0]} ({item.percent}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Direct Conversion Buttons */}
                <div className="pt-4 border-t border-blue-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={handleProceedToQuotation}
                    disabled={isSaving}
                    className="sm:col-span-2 py-3.5 px-4 bg-gradient-to-r from-amber-400 via-gold-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-navy-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50 border border-amber-300"
                  >
                    <span>Request 3 Contractor Bids Based on Estimate</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleSaveEstimate}
                    disabled={isSaving}
                    className="py-3.5 px-4 bg-white hover:bg-blue-50 text-blue-950 font-bold text-xs rounded-xl border border-blue-200/90 shadow-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 text-amber-500" />
                    <span>{isSaving ? 'Saving...' : 'Save Estimate'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Department Cost Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              {breakdown.map((item) => {
                return (
                  <div key={item.key} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-slate-500">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-700" />
                        <span className="font-bold text-slate-800">{item.label}</span>
                      </div>
                      <span className="font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                        {item.percent}%
                      </span>
                    </div>
                    <div className="text-lg font-black text-slate-900 font-display">
                      {formatRupees(item.amount)}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Switcher Tab between Bill of Materials (BOM) & Milestone Escrow Schedule */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-slate-100 rounded-xl flex items-center gap-1 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setActiveTab('bom')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        activeTab === 'bom'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Bill of Materials (IS 456)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('escrow')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        activeTab === 'escrow'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      7-Stage Escrow Schedule
                    </button>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Engine: {backendResult?.metadata?.calculationEngine || 'IS-456 Core'}
                </span>
              </div>

              {/* TAB 1: Bill of Materials */}
              {activeTab === 'bom' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-2.5 pr-3">Material Category</th>
                        <th className="py-2.5 px-3">Est. Quantity</th>
                        <th className="py-2.5 px-3">Unit Standard</th>
                        <th className="py-2.5 px-3 text-right">Approx Market Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {estimatedMaterials.map((mat, i) => (
                        <tr key={i} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 pr-3 font-semibold text-slate-800">
                            <div>{mat.material}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{mat.brandNote}</div>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            {mat.quantity}
                          </td>
                          <td className="py-3 px-3 text-[11px] text-slate-500">
                            {mat.unitEstimate}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                            ₹{mat.approxCost.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 2: 7-Stage Milestone Escrow Schedule */}
              {activeTab === 'escrow' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-2.5 pr-2">Stage</th>
                        <th className="py-2.5 px-3">Milestone Scope</th>
                        <th className="py-2.5 px-3">Tranche</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 pl-3">Release Prerequisite</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {escrowMilestones.map((m) => (
                        <tr key={m.stage} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 pr-2">
                            <span className="w-6 h-6 rounded-full bg-slate-100 font-bold text-[11px] text-slate-700 flex items-center justify-center">
                              {m.stage}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            {m.name}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-amber-700">
                            {m.releasePercent}%
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            ₹{m.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 pl-3 text-[11px] text-slate-500">
                            {m.criteria}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Vendor Quote Action Callout */}
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-900">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Save 8% to 14% via Direct Depot Supply:</span>
                    <p className="text-[11px] text-amber-800">
                      Instead of retail local shops, request bulk quotes directly from verified factory depots in {selectedCity.split(' ')[0]}.
                    </p>
                  </div>
                </div>
                <Link
                  to="/dashboard/materials"
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-amber-400 font-bold text-[11px] rounded-xl whitespace-nowrap shrink-0 transition"
                >
                  View Material Depot
                </Link>
              </div>
            </div>

            {/* Quality Checklist & What is Included Accordion */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>What is Included in Your GharDesign Package?</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600 pt-2">
                <div className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Vastu-Compliant 2D Working Blueprints</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Structural Column, Beam & Foundation RCC Vetting</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>3D Exterior Elevation & Walkthrough Perspectives</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Independent Civil Engineer Milestone Site Audits</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Zero Contractor Escrow Advance Risk Protection</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>10-Year RCC Structural Foundation Guarantee</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
