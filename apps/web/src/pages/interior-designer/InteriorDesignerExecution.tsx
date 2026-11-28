import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  ClipboardList,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Calendar,
  User,
  MapPin,
  CheckSquare,
  Filter,
  X,
  Sparkles,
  FileText,
  Send,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Layers,
  MessageSquare,
  Check,
  Search,
  RotateCcw,
  Download,
  Hammer,
  Truck,
  Package,
  HardHat,
  Eye,
  CalendarRange,
  Phone,
  ArrowUpRight,
  Gauge,
  SlidersHorizontal,
  FileCheck,
  Maximize2,
  AlertOctagon,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import {
  getInteriorProjects,
  getInteriorSnagItems,
  saveInteriorSnagItem,
  resolveInteriorSnagItem,
  getInteriorCoordinationRequests,
  createCoordinationRequestViaAdmin,
  InteriorSnagItem,
  InteriorCoordinationRequest,
} from '../../data/interiorDesignerStore.js';
import { useToast } from '../../context/ToastContext.js';

export type ExecutionViewMode =
  | 'EXECUTION_PLANNING'
  | 'WORK_INSTRUCTIONS'
  | 'VENDOR_COORDINATION'
  | 'MATERIAL_COORDINATION'
  | 'CONTRACTOR_COORDINATION'
  | 'INSTALLATION_SCHEDULE'
  | 'WORK_INSPECTION'
  | 'PROGRESS_REPORTS'
  | 'ISSUES_DELAYS';

// Interface models for Execution Sub-Features
interface ExecutionPhase {
  id: string;
  name: string;
  stageCode: string;
  progressPercent: number;
  startDate: string;
  endDate: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'SCHEDULED' | 'PENDING';
  leadTrade: string;
  keyDeliverable: string;
}

interface SiteReadinessItem {
  id: string;
  task: string;
  discipline: string;
  isReady: boolean;
  checkedBy: string;
}

interface WorkInstruction {
  id: string;
  code: string;
  title: string;
  trade: 'Carpentry' | 'Electrical' | 'False Ceiling' | 'Civil & Masonry' | 'Painting & Polishing';
  drawingRef: string;
  tolerance: string;
  priority: 'HIGH' | 'CRITICAL' | 'NORMAL';
  status: 'ISSUED' | 'IN_EXECUTION' | 'VERIFIED';
  issuedTo: string;
  issuedDate: string;
  safetySOP: string;
  detailedSpecs: string;
}

interface VendorDeliveryOrder {
  id: string;
  poNumber: string;
  vendorName: string;
  category: 'Woodwork & Hardware' | 'Surface Finishes' | 'Glass & Mirrors' | 'Lighting & Electrical' | 'Marble & Stone';
  itemsSummary: string;
  orderValue: number;
  dispatchDate: string;
  expectedDelivery: string;
  status: 'DELIVERED' | 'IN_TRANSIT' | 'AWAITING_DISPATCH' | 'HELD_FOR_CLEARANCE';
  contactPerson: string;
  contactPhone: string;
  leadTimeDays: number;
}

interface MaterialInwardItem {
  id: string;
  gatePassId: string;
  materialName: string;
  batchNumber: string;
  quantity: string;
  storageBay: string;
  arrivalDate: string;
  qcStatus: 'QC_PASSED' | 'DEFECT_REJECTED' | 'PENDING_CHECK';
  moistureContent?: string;
  inspectorName: string;
  notes: string;
}

interface ContractorTradeCrew {
  id: string;
  tradeName: string;
  leadContractor: string;
  phone: string;
  workersCount: number;
  activeZone: string;
  shiftHours: string;
  attendanceRate: number;
  safetyGearCompliant: boolean;
  todaysFocus: string;
}

interface InstallationTask {
  id: string;
  sequence: number;
  taskName: string;
  zone: string;
  startDate: string;
  endDate: string;
  progress: number;
  dependency: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'SCHEDULED' | 'DELAYED';
  assignedTeam: string;
}

interface DailyProgressReport {
  id: string;
  reportCode: string;
  date: string;
  dayNumber: number;
  overallProgress: number;
  plannedProgress: number;
  totalWorkforce: number;
  weatherSiteConditions: string;
  keyCompletedTasks: string[];
  materialsConsumed: string;
  pmcVerification: 'PMC_VERIFIED' | 'SUBMITTED_TO_ADMIN' | 'DRAFT';
  designerNote: string;
}

interface SiteExecutionIssue {
  id: string;
  issueCode: string;
  title: string;
  category: 'RWA_REGULATION' | 'MATERIAL_SHORTAGE' | 'SITE_MOISTURE' | 'TRADE_OVERLAP' | 'ADMIN_APPROVAL';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  delayDays: number;
  reportedDate: string;
  status: 'INVESTIGATING' | 'ESCALATED_TO_ADMIN' | 'RESOLVED';
  mitigationPlan: string;
  actionOwner: string;
}

// Initial Mock Seed Data
const INITIAL_PHASES: ExecutionPhase[] = [
  {
    id: 'ph-1',
    name: 'Site Readiness, Core Cutting & Civil Demolition',
    stageCode: 'STAGE 1',
    progressPercent: 100,
    startDate: '2026-11-01',
    endDate: '2026-11-10',
    status: 'COMPLETED',
    leadTrade: 'Civil Contracting',
    keyDeliverable: 'Sanctioned partition knock-down & debris evacuation',
  },
  {
    id: 'ph-2',
    name: 'MEP Conduit Chasing & False Ceiling Pelmet Framing',
    stageCode: 'STAGE 2',
    progressPercent: 85,
    startDate: '2026-11-11',
    endDate: '2026-11-25',
    status: 'IN_PROGRESS',
    leadTrade: 'Electrical & False Ceiling',
    keyDeliverable: 'Magnetic track groove channels & GI framing alignment',
  },
  {
    id: 'ph-3',
    name: 'Modular Carcass Dry Assembly & Plywood Framing',
    stageCode: 'STAGE 3',
    progressPercent: 40,
    startDate: '2026-11-24',
    endDate: '2026-12-10',
    status: 'IN_PROGRESS',
    leadTrade: 'Modular Carpentry',
    keyDeliverable: 'BWP Marine Ply kitchen & wardrobe carcass erection',
  },
  {
    id: 'ph-4',
    name: 'Veneer Pressing, Acrylic Shutters & PU Polishing',
    stageCode: 'STAGE 4',
    progressPercent: 0,
    startDate: '2026-12-11',
    endDate: '2026-12-28',
    status: 'SCHEDULED',
    leadTrade: 'Polishing & Finishing',
    keyDeliverable: 'High-gloss acrylic edge banding & Italian PU lacquer coating',
  },
  {
    id: 'ph-5',
    name: 'Final Quartz Inlay, Blum Fitting & Deep Cleaning',
    stageCode: 'STAGE 5',
    progressPercent: 0,
    startDate: '2026-12-29',
    endDate: '2027-01-15',
    status: 'SCHEDULED',
    leadTrade: 'Turnkey Handover Team',
    keyDeliverable: 'Zero-snag audit sign-off & client keys handover',
  },
];

const INITIAL_READINESS: SiteReadinessItem[] = [
  { id: 'rd-1', task: 'Civil plumb and 90° right angle verification on wet walls', discipline: 'Civil', isReady: true, checkedBy: 'Ar. Pooja Mehra' },
  { id: 'rd-2', task: '3-Phase temporary construction power with ELCB protection active', discipline: 'Electrical', isReady: true, checkedBy: 'Er. Rakesh Sharma' },
  { id: 'rd-3', task: 'Freight elevator society clearance & wall protection padding installed', discipline: 'RWA Logistics', isReady: true, checkedBy: 'Admin Desk' },
  { id: 'rd-4', task: 'Under-tile polymer waterproofing cured & 48hr flood test approved', discipline: 'Plumbing', isReady: true, checkedBy: 'Site Incharge' },
  { id: 'rd-5', task: 'HVAC copper pipe pressure test (350 PSI) holds for 24 hours', discipline: 'HVAC', isReady: false, checkedBy: 'Daikin Technician' },
];

const INITIAL_WORK_INSTRUCTIONS: WorkInstruction[] = [
  {
    id: 'wi-1',
    code: 'WI-INT-2026-081',
    title: 'Modular Kitchen Base Carcass Plum & Level Alignment',
    trade: 'Carpentry',
    drawingRef: 'DWG-MK-CARCASS-04',
    tolerance: '± 1.0mm across 3 meters',
    priority: 'HIGH',
    status: 'IN_EXECUTION',
    issuedTo: 'Master Carpenter Ram Singh (6 Crew)',
    issuedDate: '2026-11-22',
    safetySOP: 'Dust extraction hoods on circular saws; safety goggles & cut-resistant gloves mandatory.',
    detailedSpecs: 'Anchor base cabinets using 8x100mm nylon expansion plugs. Maintain 100mm skirting recess with waterproof PVC legs.',
  },
  {
    id: 'wi-2',
    code: 'WI-INT-2026-082',
    title: 'Gypsum False Ceiling Perimeter Pelmet & Linear AC Grille Framing',
    trade: 'False Ceiling',
    drawingRef: 'DWG-FC-LIVING-02',
    tolerance: '± 1.5mm level variation',
    priority: 'CRITICAL',
    status: 'IN_EXECUTION',
    issuedTo: 'Gyprock Master Raju (4 Crew)',
    issuedDate: '2026-11-24',
    safetySOP: 'Scaffolding lock pins to be verified daily; hard hats required at all times.',
    detailedSpecs: 'Use 0.50mm BWP GI perimeter channels at 600mm centers. Double gypsum board layer at cove joints to eliminate expansion cracks.',
  },
  {
    id: 'wi-3',
    code: 'WI-INT-2026-083',
    title: 'Magnetic Track Light Channel Recess & Driver Concealment',
    trade: 'Electrical',
    drawingRef: 'DWG-ELE-LIGHT-05',
    tolerance: 'Zero flush shadow gap',
    priority: 'HIGH',
    status: 'ISSUED',
    issuedTo: 'Prakash Electrical Works',
    issuedDate: '2026-11-26',
    safetySOP: 'Isolate circuit breaker before touching bus-bars. 24V DC driver test under load before ceiling closure.',
    detailedSpecs: 'Conceal 150W Meanwell driver inside accessible AC return plenum hatch with thermal ventilation holes.',
  },
  {
    id: 'wi-4',
    code: 'WI-INT-2026-084',
    title: 'Master Bedroom Fluted Charcoal Panel & Brass Inlay Fabrication',
    trade: 'Carpentry',
    drawingRef: 'DWG-BED-WALL-07',
    tolerance: '± 0.5mm brass profile flushness',
    priority: 'NORMAL',
    status: 'ISSUED',
    issuedTo: 'Elite Veneer Craftsmen',
    issuedDate: '2026-11-27',
    safetySOP: 'Use low-VOC polyurethane adhesive; ventilate room with exhaust fan.',
    detailedSpecs: 'Backing with 8mm calibrator marine ply. Apply silicone damp-proof backing on exterior concrete wall.',
  },
];

const INITIAL_VENDORS: VendorDeliveryOrder[] = [
  {
    id: 'vo-1',
    poNumber: 'PO-BG-VEN-2026-301',
    vendorName: 'Greenlam Industries & CenturyPly Depot',
    category: 'Woodwork & Hardware',
    itemsSummary: '120 Sheets Club Prime 710 Marine Ply (18mm, 12mm, 6mm)',
    orderValue: 485000,
    dispatchDate: '2026-11-20',
    expectedDelivery: '2026-11-23',
    status: 'DELIVERED',
    contactPerson: 'Vikas Agarwal',
    contactPhone: '+91 98112 34567',
    leadTimeDays: 3,
  },
  {
    id: 'vo-2',
    poNumber: 'PO-BG-VEN-2026-302',
    vendorName: 'Blum India Experience Depot (South Ext.)',
    category: 'Woodwork & Hardware',
    itemsSummary: '180 Pairs Clip Top Blumotion 110° & 32 Tandembox Antaro drawers',
    orderValue: 242000,
    dispatchDate: '2026-11-25',
    expectedDelivery: '2026-11-28',
    status: 'IN_TRANSIT',
    contactPerson: 'Sanjay Kapoor',
    contactPhone: '+91 98188 90123',
    leadTimeDays: 4,
  },
  {
    id: 'vo-3',
    poNumber: 'PO-BG-VEN-2026-303',
    vendorName: 'Classic Marble & Simpolo Surface Gallery',
    category: 'Marble & Stone',
    itemsSummary: '2 Large Slabs Quartz Calacatta Gold (20mm honed finish)',
    orderValue: 310000,
    dispatchDate: '2026-11-29',
    expectedDelivery: '2026-12-02',
    status: 'AWAITING_DISPATCH',
    contactPerson: 'Tarun Singhania',
    contactPhone: '+91 98711 44556',
    leadTimeDays: 5,
  },
  {
    id: 'vo-4',
    poNumber: 'PO-BG-VEN-2026-304',
    vendorName: 'Saint-Gobain Glass & DGU Enclosures',
    category: 'Glass & Mirrors',
    itemsSummary: '10mm Toughened Fluted Glass Partitions & Bronze Mirror Wall',
    orderValue: 145000,
    dispatchDate: '2026-12-04',
    expectedDelivery: '2026-12-07',
    status: 'AWAITING_DISPATCH',
    contactPerson: 'Anand Roy',
    contactPhone: '+91 99100 88221',
    leadTimeDays: 7,
  },
];

const INITIAL_MATERIALS: MaterialInwardItem[] = [
  {
    id: 'mi-1',
    gatePassId: 'GP-DLF-1092',
    materialName: 'Century Club Prime BWP 710 Plywood 18mm',
    batchNumber: 'LOT-BWP-710-889',
    quantity: '60 Sheets',
    storageBay: 'Master Bedroom Dry Zone A',
    arrivalDate: '2026-11-23',
    qcStatus: 'QC_PASSED',
    moistureContent: '8.4% (Optimal)',
    inspectorName: 'Ar. Pooja Mehra',
    notes: 'No delamination or warp. Thickness calibrated across all sheets (18.1mm).',
  },
  {
    id: 'mi-2',
    gatePassId: 'GP-DLF-1093',
    materialName: 'Merino 1mm High-Gloss Frost White Acrylic Laminate',
    batchNumber: 'LOT-MER-ACR-412',
    quantity: '35 Sheets',
    storageBay: 'Kitchen Assembly Area B',
    arrivalDate: '2026-11-24',
    qcStatus: 'QC_PASSED',
    moistureContent: 'N/A (Synthetic)',
    inspectorName: 'Ram Singh (Carpentry Lead)',
    notes: 'Protective plastic film intact. Color batch shade verification matched sample swatch.',
  },
  {
    id: 'mi-3',
    gatePassId: 'GP-DLF-1094',
    materialName: 'Gyproc Ultra Acoustic Gypsum Boards 12.5mm',
    batchNumber: 'LOT-GYP-992-K',
    quantity: '40 Boards',
    storageBay: 'Corridor Staging Rack',
    arrivalDate: '2026-11-25',
    qcStatus: 'DEFECT_REJECTED',
    moistureContent: '14.2% (Damp Edge Detected)',
    inspectorName: 'Ar. Pooja Mehra',
    notes: '4 boards suffered water seepage damage during monsoon transit. Rejection note filed with supplier.',
  },
  {
    id: 'mi-4',
    gatePassId: 'GP-DLF-1095',
    materialName: 'Blum Tandembox Antaro Drawer Runner System',
    batchNumber: 'LOT-BLUM-ANT-662',
    quantity: '32 Sets',
    storageBay: 'Secure Hardware Toolroom',
    arrivalDate: '2026-11-27',
    qcStatus: 'PENDING_CHECK',
    inspectorName: 'Pooja Mehra',
    notes: 'Box sealed. Awaiting unboxing with hardware checklist.',
  },
];

const INITIAL_CONTRACTORS: ContractorTradeCrew[] = [
  {
    id: 'ct-1',
    tradeName: 'Modular Woodwork & Carpentry',
    leadContractor: 'Ram Singh Mistri',
    phone: '+91 98114 77210',
    workersCount: 6,
    activeZone: 'Kitchen & Foyer Unit',
    shiftHours: '09:00 AM - 06:30 PM',
    attendanceRate: 100,
    safetyGearCompliant: true,
    todaysFocus: 'Base cabinet dry layout & leveling leg installation',
  },
  {
    id: 'ct-2',
    tradeName: 'Gypsum Ceiling & POP Partitions',
    leadContractor: 'Raju False Ceiling Specialist',
    phone: '+91 97180 33491',
    workersCount: 4,
    activeZone: 'Living Room & Dining Cove',
    shiftHours: '09:00 AM - 06:00 PM',
    attendanceRate: 100,
    safetyGearCompliant: true,
    todaysFocus: 'Perimeter GI channel fixing & laser line alignment',
  },
  {
    id: 'ct-3',
    tradeName: 'Electrical, Automation & Conduit Work',
    leadContractor: 'Prakash Sharma',
    phone: '+91 99119 00482',
    workersCount: 3,
    activeZone: 'All Bedrooms & DB Box',
    shiftHours: '09:30 AM - 06:30 PM',
    attendanceRate: 100,
    safetyGearCompliant: true,
    todaysFocus: 'Pulling 2.5 sq mm Finolex wire for heavy AC and oven points',
  },
  {
    id: 'ct-4',
    tradeName: 'Civil, Tile Cladding & Masonry Repair',
    leadContractor: 'Subhash Yadav',
    phone: '+91 98733 11299',
    workersCount: 2,
    activeZone: 'Master Toilet Dado Area',
    shiftHours: '10:00 AM - 05:30 PM',
    attendanceRate: 100,
    safetyGearCompliant: true,
    todaysFocus: 'Epoxy grout application on Italian terrazzo floor joints',
  },
  {
    id: 'ct-5',
    tradeName: 'PU Polishing & Lacquer Finishing',
    leadContractor: 'Farhan Polish Works',
    phone: '+91 98182 66340',
    workersCount: 3,
    activeZone: 'Balcony Wood Decking',
    shiftHours: 'Standby for Stage 4',
    attendanceRate: 100,
    safetyGearCompliant: true,
    todaysFocus: 'Sample mockups on American Walnut veneer blocks',
  },
];

const INITIAL_INSTALLATIONS: InstallationTask[] = [
  {
    id: 'ins-1',
    sequence: 1,
    taskName: 'Kitchen Base Carcass Leveling & Wall Cleat Anchoring',
    zone: 'Kitchen',
    startDate: '2026-11-25',
    endDate: '2026-11-28',
    progress: 70,
    dependency: 'Civil dado tile completion',
    status: 'IN_PROGRESS',
    assignedTeam: 'Carpentry Crew 1',
  },
  {
    id: 'ins-2',
    sequence: 2,
    taskName: 'Concealed Magnetic Track Light Profile Installation',
    zone: 'Living & Dining',
    startDate: '2026-11-26',
    endDate: '2026-11-29',
    progress: 40,
    dependency: 'Gypsum ceiling framing',
    status: 'IN_PROGRESS',
    assignedTeam: 'Electrical Team',
  },
  {
    id: 'ins-3',
    sequence: 3,
    taskName: 'Master Bedroom Floor-to-Ceiling Sliding Wardrobe Tracks',
    zone: 'Master Bedroom',
    startDate: '2026-11-30',
    endDate: '2026-12-04',
    progress: 0,
    dependency: 'Wood flooring leveling',
    status: 'SCHEDULED',
    assignedTeam: 'Wardrobe Specialists',
  },
  {
    id: 'ins-4',
    sequence: 4,
    taskName: 'Kitchen Calacatta Quartz Countertop Seamless Mitred Joint',
    zone: 'Kitchen',
    startDate: '2026-12-03',
    endDate: '2026-12-06',
    progress: 0,
    dependency: 'Base carcass final inspection',
    status: 'SCHEDULED',
    assignedTeam: 'Simpolo Stone Stonemasons',
  },
  {
    id: 'ins-5',
    sequence: 5,
    taskName: '10mm Fluted Glass Shower Partition & Gold PVD Profiles',
    zone: 'Master Bath',
    startDate: '2026-12-07',
    endDate: '2026-12-09',
    progress: 0,
    dependency: 'Tile epoxy grout drying',
    status: 'SCHEDULED',
    assignedTeam: 'Glazing Crew',
  },
];

const INITIAL_DPRS: DailyProgressReport[] = [
  {
    id: 'dpr-1',
    reportCode: 'DPR-INT-DAY-18',
    date: '2026-11-27',
    dayNumber: 18,
    overallProgress: 42,
    plannedProgress: 45,
    totalWorkforce: 15,
    weatherSiteConditions: 'Clear, 22°C, 3-Phase power stable all day. No society noise complaints.',
    keyCompletedTasks: [
      'Completed 8 of 11 modular kitchen base carcasses in BWP 710 Marine Ply.',
      'False ceiling gypsum framing in living room completed with laser leveling.',
      'Main switchboard conduit cables pulled and color tagged.',
      'Replaced 4 rejected gypsum boards with fresh lot from vendor depot.',
    ],
    materialsConsumed: '18 Sheets 18mm Marine Ply, 12 GI ceiling channels, 120m Finolex cable.',
    pmcVerification: 'PMC_VERIFIED',
    designerNote: 'Work pace is healthy. Quartz delivery confirmed for next Tuesday.',
  },
  {
    id: 'dpr-2',
    reportCode: 'DPR-INT-DAY-17',
    date: '2026-11-26',
    dayNumber: 17,
    overallProgress: 38,
    plannedProgress: 40,
    totalWorkforce: 14,
    weatherSiteConditions: 'Clear, 24°C, Elevators operational throughout shift.',
    keyCompletedTasks: [
      'Core cutting for kitchen chimney 6-inch exhaust completed through exterior duct wall.',
      'Dining room ceiling pelmet LED groove channels framed.',
      'Delivered Blum drawer fittings stored in secure tool room.',
    ],
    materialsConsumed: '6 Core bits wear, 14 GI cross tees, 3 PVC elbows.',
    pmcVerification: 'PMC_VERIFIED',
    designerNote: 'Site safety standards verified. All technicians wearing boots and goggles.',
  },
];

const INITIAL_ISSUES: SiteExecutionIssue[] = [
  {
    id: 'iss-1',
    issueCode: 'ISS-EXE-041',
    title: 'Society RWA Restricts Heavy Hammer Drilling between 1:00 PM and 3:30 PM',
    category: 'RWA_REGULATION',
    severity: 'MEDIUM',
    delayDays: 1,
    reportedDate: '2026-11-25',
    status: 'RESOLVED',
    mitigationPlan: 'Adjusted crew schedule: Noisy circular sawing & masonry drilling shifted to 09:30 AM - 12:30 PM; afternoon slot reserved for quiet manual assembly and wire pulling.',
    actionOwner: 'Ar. Pooja Mehra',
  },
  {
    id: 'iss-2',
    issueCode: 'ISS-EXE-042',
    title: 'Water Seepage Trace Detected on Living Room Window Pelmet Wall',
    category: 'SITE_MOISTURE',
    severity: 'CRITICAL',
    delayDays: 3,
    reportedDate: '2026-11-26',
    status: 'ESCALATED_TO_ADMIN',
    mitigationPlan: 'Immediate escalation to DLF Building Maintenance Team. Window silicone bead resealed externally. Plywood paneling put on hold until moisture test reaches below 10%.',
    actionOwner: 'Admin Desk & DLF Facility Manager',
  },
  {
    id: 'iss-3',
    issueCode: 'ISS-EXE-043',
    title: 'Blum Antaro Soft-Close Runner Supply Delay for 4 Deep Pantry Drawers',
    category: 'MATERIAL_SHORTAGE',
    severity: 'HIGH',
    delayDays: 2,
    reportedDate: '2026-11-27',
    status: 'INVESTIGATING',
    mitigationPlan: 'Vendor depot tracking confirms batch arriving Friday morning. Carpenters diverted to wardrobe carcass assembly to preserve cumulative critical path.',
    actionOwner: 'Vendor Relations Desk',
  },
];

export const InteriorDesignerExecution: React.FC = () => {
  const { success, error, info } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Project Selection
  const projects = getInteriorProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'prj-int-1');
  const activeProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || projects[0],
    [projects, selectedProjectId]
  );

  // View Mode
  const currentView = (searchParams.get('view') as ExecutionViewMode) || 'EXECUTION_PLANNING';
  const setViewMode = (mode: ExecutionViewMode) => {
    setSearchParams({ view: mode });
  };

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  // Local State collections
  const [phases, setPhases] = useState<ExecutionPhase[]>(INITIAL_PHASES);
  const [readiness, setReadiness] = useState<SiteReadinessItem[]>(INITIAL_READINESS);
  const [workInstructions, setWorkInstructions] = useState<WorkInstruction[]>(INITIAL_WORK_INSTRUCTIONS);
  const [vendors, setVendors] = useState<VendorDeliveryOrder[]>(INITIAL_VENDORS);
  const [materials, setMaterials] = useState<MaterialInwardItem[]>(INITIAL_MATERIALS);
  const [contractors, setContractors] = useState<ContractorTradeCrew[]>(INITIAL_CONTRACTORS);
  const [installations, setInstallations] = useState<InstallationTask[]>(INITIAL_INSTALLATIONS);
  const [snags, setSnags] = useState<InteriorSnagItem[]>(() => getInteriorSnagItems(selectedProjectId));
  const [dprs, setDprs] = useState<DailyProgressReport[]>(INITIAL_DPRS);
  const [issues, setIssues] = useState<SiteExecutionIssue[]>(INITIAL_ISSUES);

  // Modals State
  const [showWorkInstructionModal, setShowWorkInstructionModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showSnagModal, setShowSnagModal] = useState(false);
  const [showDprModal, setShowDprModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showCoordinationModal, setShowCoordinationModal] = useState(false);

  // Form states
  const [newWiTitle, setNewWiTitle] = useState('');
  const [newWiTrade, setNewWiTrade] = useState<WorkInstruction['trade']>('Carpentry');
  const [newWiDrawing, setNewWiDrawing] = useState('DWG-KIT-001');
  const [newWiTolerance, setNewWiTolerance] = useState('± 1.0mm');
  const [newWiPriority, setNewWiPriority] = useState<'NORMAL' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [newWiSpecs, setNewWiSpecs] = useState('');
  const [newWiSafety, setNewWiSafety] = useState('Standard eye protection and safety shoes required.');

  const [newMatName, setNewMatName] = useState('');
  const [newMatQty, setNewMatQty] = useState('');
  const [newMatBatch, setNewMatBatch] = useState('');
  const [newMatBay, setNewMatBay] = useState('Zone A Staging');
  const [newMatQc, setNewMatQc] = useState<MaterialInwardItem['qcStatus']>('QC_PASSED');
  const [newMatNotes, setNewMatNotes] = useState('');

  const [newSnagRoom, setNewSnagRoom] = useState('Living Room');
  const [newSnagDesc, setNewSnagDesc] = useState('');
  const [newSnagSeverity, setNewSnagSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [newSnagTrade, setNewSnagTrade] = useState('Modular Carpentry');

  const [newDprWorkforce, setNewDprWorkforce] = useState('15');
  const [newDprConditions, setNewDprConditions] = useState('Clear and dry. All electrical lines live.');
  const [newDprTasks, setNewDprTasks] = useState('');
  const [newDprNotes, setNewDprNotes] = useState('');

  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueCat, setNewIssueCat] = useState<SiteExecutionIssue['category']>('SITE_MOISTURE');
  const [newIssueSev, setNewIssueSev] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM'>('HIGH');
  const [newIssueDelay, setNewIssueDelay] = useState('2');
  const [newIssuePlan, setNewIssuePlan] = useState('');

  // Synchronize snags when project changes
  useEffect(() => {
    setSnags(getInteriorSnagItems(selectedProjectId));
  }, [selectedProjectId]);

  // Handlers
  const handleToggleReadiness = (id: string) => {
    setReadiness((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isReady: !r.isReady } : r))
    );
    success('Site readiness checklist item updated.');
  };

  const handleCreateWorkInstruction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWiTitle.trim() || !newWiSpecs.trim()) {
      error('Please enter title and technical specification.');
      return;
    }
    const item: WorkInstruction = {
      id: `wi-${Date.now()}`,
      code: `WI-INT-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: newWiTitle,
      trade: newWiTrade,
      drawingRef: newWiDrawing,
      tolerance: newWiTolerance,
      priority: newWiPriority,
      status: 'ISSUED',
      issuedTo: `${newWiTrade} Team Lead`,
      issuedDate: new Date().toISOString().slice(0, 10),
      safetySOP: newWiSafety,
      detailedSpecs: newWiSpecs,
    };
    setWorkInstructions([item, ...workInstructions]);
    setShowWorkInstructionModal(false);
    setNewWiTitle('');
    setNewWiSpecs('');
    success(`Work Instruction ${item.code} issued successfully to trade lead!`);
  };

  const handleCreateMaterialInward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim() || !newMatQty.trim()) {
      error('Please specify material name and quantity.');
      return;
    }
    const item: MaterialInwardItem = {
      id: `mi-${Date.now()}`,
      gatePassId: `GP-DLF-${Math.floor(1000 + Math.random() * 9000)}`,
      materialName: newMatName,
      batchNumber: newMatBatch || `LOT-${Date.now().toString().slice(-4)}`,
      quantity: newMatQty,
      storageBay: newMatBay,
      arrivalDate: new Date().toISOString().slice(0, 10),
      qcStatus: newMatQc,
      inspectorName: 'Ar. Pooja Mehra',
      notes: newMatNotes || 'Material inward logged and inspected.',
    };
    setMaterials([item, ...materials]);
    setShowMaterialModal(false);
    setNewMatName('');
    setNewMatQty('');
    setNewMatBatch('');
    setNewMatNotes('');
    success(`Material Lot ${item.gatePassId} recorded with status: ${item.qcStatus}`);
  };

  const handleCreateSnag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnagDesc.trim()) {
      error('Please enter snag description.');
      return;
    }
    const saved = saveInteriorSnagItem({
      projectId: selectedProjectId,
      roomName: newSnagRoom,
      description: newSnagDesc,
      severity: newSnagSeverity,
      assignedContractor: newSnagTrade,
    });
    setSnags(getInteriorSnagItems(selectedProjectId));
    setShowSnagModal(false);
    setNewSnagDesc('');
    success(`Inspection snag filed for ${saved.roomName} (${saved.severity})`);
  };

  const handleResolveSnag = (id: string) => {
    resolveInteriorSnagItem(id);
    setSnags(getInteriorSnagItems(selectedProjectId));
    success('Snag verified and marked RESOLVED!');
  };

  const handleCreateDpr = (e: React.FormEvent) => {
    e.preventDefault();
    const tasksArray = newDprTasks
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);
    const item: DailyProgressReport = {
      id: `dpr-${Date.now()}`,
      reportCode: `DPR-INT-DAY-${dprs.length + 19}`,
      date: new Date().toISOString().slice(0, 10),
      dayNumber: dprs.length + 19,
      overallProgress: 44,
      plannedProgress: 46,
      totalWorkforce: parseInt(newDprWorkforce) || 15,
      weatherSiteConditions: newDprConditions,
      keyCompletedTasks: tasksArray.length ? tasksArray : ['Completed planned carpentry framing', 'Electrical conduits pulled'],
      materialsConsumed: 'Standard consumable usage logged in store ledger.',
      pmcVerification: 'SUBMITTED_TO_ADMIN',
      designerNote: newDprNotes || 'Site pace normal. Zero safety violations reported.',
    };
    setDprs([item, ...dprs]);
    setShowDprModal(false);
    setNewDprTasks('');
    setNewDprNotes('');
    success(`Daily Progress Report ${item.reportCode} generated & submitted to PMC Desk!`);
  };

  const handleCreateIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssueTitle.trim()) {
      error('Please describe the issue.');
      return;
    }
    const item: SiteExecutionIssue = {
      id: `iss-${Date.now()}`,
      issueCode: `ISS-EXE-${Math.floor(100 + Math.random() * 900)}`,
      title: newIssueTitle,
      category: newIssueCat,
      severity: newIssueSev,
      delayDays: parseInt(newIssueDelay) || 1,
      reportedDate: new Date().toISOString().slice(0, 10),
      status: 'ESCALATED_TO_ADMIN',
      mitigationPlan: newIssuePlan || 'Mitigation logged with site incharge.',
      actionOwner: 'Admin Support Desk',
    };
    setIssues([item, ...issues]);
    setShowIssueModal(false);
    setNewIssueTitle('');
    setNewIssuePlan('');
    success(`Roadblock ${item.issueCode} escalated to Admin Desk with High Priority!`);
  };

  // Nav View Definitions with real-time badges
  const navTabs: { id: ExecutionViewMode; label: string; count: number; badgeColor: string }[] = [
    { id: 'EXECUTION_PLANNING', label: 'Execution Planning', count: phases.length, badgeColor: 'bg-blue-100 text-blue-800' },
    { id: 'WORK_INSTRUCTIONS', label: 'Work Instructions', count: workInstructions.length, badgeColor: 'bg-emerald-100 text-emerald-800' },
    { id: 'VENDOR_COORDINATION', label: 'Vendor Coordination', count: vendors.length, badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'MATERIAL_COORDINATION', label: 'Material Coordination', count: materials.length, badgeColor: 'bg-purple-100 text-purple-800' },
    { id: 'CONTRACTOR_COORDINATION', label: 'Contractor Coordination', count: contractors.length, badgeColor: 'bg-indigo-100 text-indigo-800' },
    { id: 'INSTALLATION_SCHEDULE', label: 'Installation Schedule', count: installations.length, badgeColor: 'bg-cyan-100 text-cyan-800' },
    { id: 'WORK_INSPECTION', label: 'Work Inspection', count: snags.filter((s) => s.status !== 'RESOLVED').length, badgeColor: 'bg-rose-100 text-rose-800' },
    { id: 'PROGRESS_REPORTS', label: 'Site Progress Reports', count: dprs.length, badgeColor: 'bg-teal-100 text-teal-800' },
    { id: 'ISSUES_DELAYS', label: 'Issues & Delays', count: issues.filter((i) => i.status !== 'RESOLVED').length, badgeColor: 'bg-amber-100 text-amber-900' },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* ----------------- TOP HERO HEADER ----------------- */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-blue-500/20 text-blue-200 border border-blue-400/30 font-mono">
                Module 8: Turnkey Project Execution
              </span>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                PMC Coordinated
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-amber-400 shrink-0" />
              <span>Project Execution & Coordination</span>
            </h1>
            <p className="text-sm text-blue-100/90 max-w-2xl font-normal leading-relaxed">
              Stage-by-stage implementation oversight: standard work orders, vendor deliveries, material quality logs, contractor trade attendance, milestone installation schedules, and daily progress reporting.
            </p>
          </div>

          {/* Project Picker & Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 px-3 flex flex-col justify-center">
              <label className="text-[10px] uppercase font-bold text-blue-200 font-mono">Active Project</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer pr-4"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="text-slate-900 font-medium">
                    {p.name} ({p.id})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                info('Opening site execution master summary export...');
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-2xl transition shadow-lg hover:shadow-amber-400/20"
            >
              <Download className="w-4 h-4" />
              <span>Export Execution Dossier</span>
            </button>
          </div>
        </div>

        {/* Project Snapshot Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
          <div>
            <span className="text-blue-200 block text-[11px]">Cumulative Progress</span>
            <span className="text-lg font-black text-white">42% (On Schedule)</span>
          </div>
          <div>
            <span className="text-blue-200 block text-[11px]">Active Workforce</span>
            <span className="text-lg font-black text-emerald-300">15 Craftsmen on Site</span>
          </div>
          <div>
            <span className="text-blue-200 block text-[11px]">Open Quality Snags</span>
            <span className="text-lg font-black text-amber-300">
              {snags.filter((s) => s.status !== 'RESOLVED').length} Identified
            </span>
          </div>
          <div>
            <span className="text-blue-200 block text-[11px]">Target Handover</span>
            <span className="text-lg font-black text-white">15 Jan 2027</span>
          </div>
        </div>
      </div>

      {/* ----------------- SUBMENU VIEW SELECTOR & PILLS ----------------- */}
      <div className="space-y-3">
        {/* Mobile / Compact Select Switcher */}
        <div className="sm:hidden bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">
            Execution View Mode
          </label>
          <select
            value={currentView}
            onChange={(e) => setViewMode(e.target.value as ExecutionViewMode)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            {navTabs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} ({t.count})
              </option>
            ))}
          </select>
        </div>

        {/* Desktop 9-Pill Horizontal Strip */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          {navTabs.map((tab) => {
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl whitespace-nowrap transition-all duration-150 shrink-0 select-none ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-black'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : tab.badgeColor
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ----------------- SEARCH & FILTERS BAR ----------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${navTabs.find((t) => t.id === currentView)?.label}...`}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Disciplines & Statuses</option>
            <option value="CARPENTRY">Modular Carpentry</option>
            <option value="ELECTRICAL">Electrical & Automation</option>
            <option value="FALSE_CEILING">False Ceiling</option>
            <option value="CRITICAL">Critical & High Priority</option>
          </select>

          {/* Contextual primary action buttons based on active view */}
          {currentView === 'WORK_INSTRUCTIONS' && (
            <button
              onClick={() => setShowWorkInstructionModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Work Order</span>
            </button>
          )}

          {currentView === 'MATERIAL_COORDINATION' && (
            <button
              onClick={() => setShowMaterialModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Log Material Inward</span>
            </button>
          )}

          {currentView === 'WORK_INSPECTION' && (
            <button
              onClick={() => setShowSnagModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Log Quality Snag</span>
            </button>
          )}

          {currentView === 'PROGRESS_REPORTS' && (
            <button
              onClick={() => setShowDprModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Generate DPR</span>
            </button>
          )}

          {currentView === 'ISSUES_DELAYS' && (
            <button
              onClick={() => setShowIssueModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Report Roadblock</span>
            </button>
          )}
        </div>
      </div>

      {/* ----------------- SUB-VIEW 1: EXECUTION PLANNING ----------------- */}
      {currentView === 'EXECUTION_PLANNING' && (
        <div className="space-y-6">
          {/* Phase Roadmap Progress */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-blue-600" />
                  <span>Master Execution Roadmap & Milestones</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  High-level implementation milestones aligned with client payment escrows and contractor work fronts.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto font-mono">
                Overall: 42% Cumulative
              </span>
            </div>

            <div className="space-y-4">
              {phases.map((phase) => (
                <div
                  key={phase.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition bg-slate-50/50 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase font-mono bg-slate-200 text-slate-700">
                        {phase.stageCode}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{phase.name}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          phase.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : phase.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300 animate-pulse'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {phase.status}
                      </span>
                      <span className="text-xs font-black font-mono text-slate-800">
                        {phase.progressPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        phase.status === 'COMPLETED'
                          ? 'bg-emerald-500'
                          : phase.status === 'IN_PROGRESS'
                          ? 'bg-blue-600'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${phase.progressPercent}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2 pt-1 border-t border-slate-200/60 font-medium">
                    <div className="flex items-center gap-2">
                      <HardHat className="w-3.5 h-3.5 text-slate-400" />
                      <span>Lead Trade: <strong className="text-slate-700">{phase.leadTrade}</strong></span>
                    </div>
                    <div>
                      <span>Timeline: <strong className="text-slate-700">{phase.startDate}</strong> to <strong className="text-slate-700">{phase.endDate}</strong></span>
                    </div>
                    <div className="text-slate-600 italic">
                      🎯 Deliverable: {phase.keyDeliverable}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Site Readiness Gate Checklist */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                  <span>Site Readiness Pre-Execution Gate</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Critical prerequisites verified by designer and site engineers before unlocking carpentry woodwork.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-mono">
                {readiness.filter((r) => r.isReady).length} / {readiness.length} Passed
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {readiness.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleReadiness(item.id)}
                  className="py-3 flex items-start gap-3 cursor-pointer hover:bg-slate-50 rounded-xl px-2 transition group"
                >
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                      item.isReady
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 bg-white group-hover:border-slate-400'
                    }`}
                  >
                    {item.isReady && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div className="flex-1 text-xs">
                    <p
                      className={`font-semibold ${
                        item.isReady ? 'text-slate-900 line-through text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      {item.task}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                      <span>Discipline: {item.discipline}</span>
                      <span>•</span>
                      <span>Verified: {item.checkedBy}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.isReady
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.isReady ? 'PASSED' : 'PENDING'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUB-VIEW 2: WORK INSTRUCTIONS ----------------- */}
      {currentView === 'WORK_INSTRUCTIONS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workInstructions
              .filter(
                (wi) =>
                  wi.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  wi.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  wi.trade.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((wi) => (
                <div
                  key={wi.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        {wi.code}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            wi.priority === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : wi.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {wi.priority}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {wi.status}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{wi.title}</h3>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400 font-mono text-[11px]">Trade:</span>
                        <strong className="text-slate-800">{wi.trade}</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400 font-mono text-[11px]">Drawing Ref:</span>
                        <span className="font-mono text-blue-600 font-bold">{wi.drawingRef}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400 font-mono text-[11px]">Allowable Tolerance:</span>
                        <strong className="text-rose-600 font-mono">{wi.tolerance}</strong>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {wi.detailedSpecs}
                    </p>

                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span><strong>SOP & Safety:</strong> {wi.safetySOP}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Issued: {wi.issuedDate}</span>
                    <button
                      onClick={() => success(`Work Order ${wi.code} forwarded to ${wi.issuedTo} via WhatsApp.`)}
                      className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 font-sans"
                    >
                      <span>Forward to Crew</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ----------------- SUB-VIEW 3: VENDOR COORDINATION ----------------- */}
      {currentView === 'VENDOR_COORDINATION' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendors.map((vo) => (
              <div
                key={vo.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                      {vo.poNumber}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{vo.vendorName}</h3>
                    <span className="text-[11px] text-blue-600 font-medium">{vo.category}</span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                      vo.status === 'DELIVERED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : vo.status === 'IN_TRANSIT'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300 animate-pulse'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {vo.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2">
                  <p className="text-slate-700 font-medium">📦 {vo.itemsSummary}</p>
                  <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                    <span>PO Value: <strong className="text-slate-900">₹{vo.orderValue.toLocaleString('en-IN')}</strong></span>
                    <span>Lead Time: {vo.leadTimeDays} Days</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{vo.contactPerson}</span>
                  </div>
                  <a
                    href={`tel:${vo.contactPhone}`}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{vo.contactPhone}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- SUB-VIEW 4: MATERIAL COORDINATION ----------------- */}
      {currentView === 'MATERIAL_COORDINATION' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                <span>On-Site Material Receiving & QC Ledger</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Physical lot inward receipts, moisture testing, and storage bay management.
              </p>
            </div>
            <button
              onClick={() => setShowMaterialModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log New Lot</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-5">Gate Pass & Material</th>
                  <th className="p-3.5">Batch / Lot</th>
                  <th className="p-3.5">Quantity</th>
                  <th className="p-3.5">Storage Bay</th>
                  <th className="p-3.5">QC Status</th>
                  <th className="p-3.5">Moisture Test</th>
                  <th className="p-3.5 pr-5">Arrival Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {materials.map((mat) => (
                  <tr key={mat.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 pl-5">
                      <span className="font-mono text-[10px] text-slate-400 block">{mat.gatePassId}</span>
                      <strong className="text-slate-900">{mat.materialName}</strong>
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">{mat.batchNumber}</td>
                    <td className="p-3.5 font-bold text-slate-900">{mat.quantity}</td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {mat.storageBay}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          mat.qcStatus === 'QC_PASSED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : mat.qcStatus === 'DEFECT_REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {mat.qcStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-[11px]">
                      {mat.moistureContent || 'N/A'}
                    </td>
                    <td className="p-3.5 pr-5 font-mono text-slate-400">{mat.arrivalDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- SUB-VIEW 5: CONTRACTOR COORDINATION ----------------- */}
      {currentView === 'CONTRACTOR_COORDINATION' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contractors.map((crew) => (
              <div
                key={crew.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{crew.tradeName}</h3>
                    <p className="text-xs text-slate-500 font-medium">Lead: {crew.leadContractor}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 font-bold text-xs font-mono">
                    {crew.workersCount} Craftsmen
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                  <div className="text-slate-600">
                    <span className="text-slate-400 text-[11px]">Zone:</span> <strong>{crew.activeZone}</strong>
                  </div>
                  <div className="text-slate-600">
                    <span className="text-slate-400 text-[11px]">Shift:</span> <span>{crew.shiftHours}</span>
                  </div>
                  <div className="text-slate-700 pt-1 border-t border-slate-200/50">
                    🎯 <em>{crew.todaysFocus}</em>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Safety Compliant
                  </span>

                  <a
                    href={`tel:${crew.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Incharge</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- SUB-VIEW 6: INSTALLATION SCHEDULE ----------------- */}
      {currentView === 'INSTALLATION_SCHEDULE' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <CalendarRange className="w-5 h-5 text-cyan-600" />
                <span>Modular Installation Timeline & Sequence</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Pre-assembled module installation sequence on site with inter-trade dependencies.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 font-mono">Sequence 1 - 5</span>
          </div>

          <div className="space-y-4">
            {installations.map((ins) => (
              <div
                key={ins.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-cyan-300 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-mono text-xs font-black flex items-center justify-center shrink-0">
                      {ins.sequence}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{ins.taskName}</h4>
                      <span className="text-xs text-slate-500">Zone: {ins.zone} • Assigned: {ins.assignedTeam}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ins.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ins.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {ins.status}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700">{ins.progress}%</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-cyan-600 rounded-full transition-all"
                    style={{ width: `${ins.progress}%` }}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 font-mono pt-1">
                  <span>Start: {ins.startDate} • Target: {ins.endDate}</span>
                  <span className="text-slate-600 italic">Dependency: {ins.dependency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- SUB-VIEW 7: WORK INSPECTION ----------------- */}
      {currentView === 'WORK_INSPECTION' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                  <span>Quality Inspection & Snag Resolution Desk</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Technical audit checklist (plumb line, gaps, drawer damping, paint sheen) with instant contractor resolution tracking.
                </p>
              </div>

              <button
                onClick={() => setShowSnagModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Log New Snag</span>
              </button>
            </div>

            {snags.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">Zero Open Snags for this Project!</p>
                <p className="text-xs text-slate-500">All inspected woodwork and finishes comply with quality tolerances.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {snags.map((snag) => (
                  <div
                    key={snag.id}
                    className={`rounded-2xl border p-4 space-y-3 transition ${
                      snag.status === 'RESOLVED'
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-white border-slate-200 hover:border-rose-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block">{snag.id}</span>
                        <h4 className="text-xs font-bold text-slate-900">{snag.roomName}</h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            snag.severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : snag.severity === 'HIGH'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {snag.severity}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            snag.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {snag.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {snag.description}
                    </p>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 font-mono text-slate-400">
                      <span>Assigned: {snag.assignedContractor}</span>
                      {snag.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleResolveSnag(snag.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] font-sans transition"
                        >
                          Mark Rectified
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- SUB-VIEW 8: SITE PROGRESS REPORTS ----------------- */}
      {currentView === 'PROGRESS_REPORTS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dprs.map((dpr) => (
              <div
                key={dpr.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-teal-300 transition space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                      {dpr.reportCode}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">Day {dpr.dayNumber} Progress Log</h3>
                    <span className="text-xs text-slate-400 font-mono">{dpr.date}</span>
                  </div>

                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {dpr.pmcVerification.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Overall %</span>
                    <strong className="text-teal-700 font-mono font-black">{dpr.overallProgress}%</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Planned %</span>
                    <strong className="text-slate-700 font-mono font-black">{dpr.plannedProgress}%</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Workforce</span>
                    <strong className="text-blue-700 font-mono font-black">{dpr.totalWorkforce} Crew</strong>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <span className="text-[11px] font-bold uppercase text-slate-400 font-mono">Completed Key Activities:</span>
                  <ul className="space-y-1 text-slate-700 list-disc list-inside">
                    {dpr.keyCompletedTasks.map((task, idx) => (
                      <li key={idx} className="leading-snug">{task}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 italic">
                  <strong>Designer Note:</strong> {dpr.designerNote}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">{dpr.weatherSiteConditions}</span>
                  <button
                    onClick={() => success(`Exporting official PDF for ${dpr.reportCode}...`)}
                    className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- SUB-VIEW 9: ISSUES & DELAYS ----------------- */}
      {currentView === 'ISSUES_DELAYS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {issues.map((iss) => (
              <div
                key={iss.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-amber-300 transition space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      {iss.issueCode}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1 leading-snug">{iss.title}</h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        iss.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : iss.severity === 'HIGH'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {iss.severity}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                      {iss.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/50">
                  <span className="text-amber-900 font-semibold">Timeline Delay Impact:</span>
                  <span className="font-mono font-black text-rose-700">+{iss.delayDays} Work Days</span>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[11px] font-bold uppercase text-slate-400 font-mono">Mitigation Strategy:</span>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {iss.mitigationPlan}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">Owner: {iss.actionOwner}</span>
                  {iss.status !== 'RESOLVED' && (
                    <button
                      onClick={() => {
                        createCoordinationRequestViaAdmin({
                          projectId: selectedProjectId,
                          projectName: activeProject?.name || 'Interior Project',
                          targetDiscipline: 'CONTRACTOR',
                          type: 'QUALITY_DEFECT_ESCALATION',
                          title: `Roadblock Escalation: ${iss.title}`,
                          description: iss.mitigationPlan,
                          requestedBy: 'Ar. Pooja Mehra',
                        });
                        success(`Issue ${iss.issueCode} escalated to Admin Resolution Team!`);
                      }}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition"
                    >
                      Escalate to Admin
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- MODAL: ISSUE WORK INSTRUCTION ----------------- */}
      <AnimatePresence>
        {showWorkInstructionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Issue Work Order / Instruction</span>
                </h3>
                <button
                  onClick={() => setShowWorkInstructionModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateWorkInstruction} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Instruction Title</label>
                  <input
                    type="text"
                    value={newWiTitle}
                    onChange={(e) => setNewWiTitle(e.target.value)}
                    placeholder="e.g. Master Bedroom Fluted Panel Groove Fixing"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Trade</label>
                    <select
                      value={newWiTrade}
                      onChange={(e) => setNewWiTrade(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="Carpentry">Carpentry</option>
                      <option value="Electrical">Electrical</option>
                      <option value="False Ceiling">False Ceiling</option>
                      <option value="Civil & Masonry">Civil & Masonry</option>
                      <option value="Painting & Polishing">Painting & Polishing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Drawing Reference</label>
                    <input
                      type="text"
                      value={newWiDrawing}
                      onChange={(e) => setNewWiDrawing(e.target.value)}
                      placeholder="e.g. DWG-BED-04"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Allowable Tolerance</label>
                    <input
                      type="text"
                      value={newWiTolerance}
                      onChange={(e) => setNewWiTolerance(e.target.value)}
                      placeholder="e.g. ± 1.0mm"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Priority</label>
                    <select
                      value={newWiPriority}
                      onChange={(e) => setNewWiPriority(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Detailed Execution Specifications</label>
                  <textarea
                    rows={3}
                    value={newWiSpecs}
                    onChange={(e) => setNewWiSpecs(e.target.value)}
                    placeholder="Specify fastener types, adhesives, reveal margins, and leveling steps..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Safety & SOP Requirements</label>
                  <input
                    type="text"
                    value={newWiSafety}
                    onChange={(e) => setNewWiSafety(e.target.value)}
                    placeholder="e.g. Safety goggles, dust extraction required"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowWorkInstructionModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition"
                  >
                    Issue Instruction
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL: LOG MATERIAL INWARD ----------------- */}
      <AnimatePresence>
        {showMaterialModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  <span>Log On-Site Material Receiving</span>
                </h3>
                <button
                  onClick={() => setShowMaterialModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateMaterialInward} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Material Name & Spec</label>
                  <input
                    type="text"
                    value={newMatName}
                    onChange={(e) => setNewMatName(e.target.value)}
                    placeholder="e.g. Greenlam 1mm Textured Oak Laminate"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Quantity Received</label>
                    <input
                      type="text"
                      value={newMatQty}
                      onChange={(e) => setNewMatQty(e.target.value)}
                      placeholder="e.g. 45 Sheets"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Batch / Lot Number</label>
                    <input
                      type="text"
                      value={newMatBatch}
                      onChange={(e) => setNewMatBatch(e.target.value)}
                      placeholder="e.g. LOT-GRN-2026"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Storage Bay</label>
                    <input
                      type="text"
                      value={newMatBay}
                      onChange={(e) => setNewMatBay(e.target.value)}
                      placeholder="e.g. Master Suite Bay 2"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Initial QC Status</label>
                    <select
                      value={newMatQc}
                      onChange={(e) => setNewMatQc(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="QC_PASSED">QC Passed</option>
                      <option value="PENDING_CHECK">Pending Inspection</option>
                      <option value="DEFECT_REJECTED">Defect / Damaged</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Inspection Notes</label>
                  <textarea
                    rows={2}
                    value={newMatNotes}
                    onChange={(e) => setNewMatNotes(e.target.value)}
                    placeholder="Protective wrap verified, corners undamaged..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowMaterialModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs transition"
                  >
                    Save Inward Lot
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL: LOG QUALITY SNAG ----------------- */}
      <AnimatePresence>
        {showSnagModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                  <span>Log Work Quality Snag</span>
                </h3>
                <button
                  onClick={() => setShowSnagModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSnag} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Room / Zone</label>
                    <input
                      type="text"
                      value={newSnagRoom}
                      onChange={(e) => setNewSnagRoom(e.target.value)}
                      placeholder="e.g. Master Bedroom"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Severity</label>
                    <select
                      value={newSnagSeverity}
                      onChange={(e) => setNewSnagSeverity(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Subcontractor Trade</label>
                  <input
                    type="text"
                    value={newSnagTrade}
                    onChange={(e) => setNewSnagTrade(e.target.value)}
                    placeholder="e.g. Modular Carpentry"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Defect Description</label>
                  <textarea
                    rows={3}
                    value={newSnagDesc}
                    onChange={(e) => setNewSnagDesc(e.target.value)}
                    placeholder="Describe misalignments, scratches, or uneven gaps..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowSnagModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs transition"
                  >
                    File Snag
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL: GENERATE DPR ----------------- */}
      <AnimatePresence>
        {showDprModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-teal-600" />
                  <span>Generate Daily Progress Report (DPR)</span>
                </h3>
                <button
                  onClick={() => setShowDprModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateDpr} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Total Workforce On-Site</label>
                    <input
                      type="number"
                      value={newDprWorkforce}
                      onChange={(e) => setNewDprWorkforce(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Site & Weather Conditions</label>
                    <input
                      type="text"
                      value={newDprConditions}
                      onChange={(e) => setNewDprConditions(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Key Completed Tasks (One per line)</label>
                  <textarea
                    rows={4}
                    value={newDprTasks}
                    onChange={(e) => setNewDprTasks(e.target.value)}
                    placeholder="Installed kitchen base carcasses&#10;Tested LED cove driver load&#10;Verified plumb lines on toilet dado tiles"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designer Sign-Off Comments</label>
                  <textarea
                    rows={2}
                    value={newDprNotes}
                    onChange={(e) => setNewDprNotes(e.target.value)}
                    placeholder="Pace on track, no safety issues observed..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowDprModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-xs transition"
                  >
                    Submit DPR to Admin Desk
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL: REPORT ROADBLOCK / ISSUE ----------------- */}
      <AnimatePresence>
        {showIssueModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>Report Roadblock & Delay Risk</span>
                </h3>
                <button
                  onClick={() => setShowIssueModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateIssue} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Issue Headline</label>
                  <input
                    type="text"
                    value={newIssueTitle}
                    onChange={(e) => setNewIssueTitle(e.target.value)}
                    placeholder="e.g. Water Seepage from Upper Floor Bathroom"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={newIssueCat}
                      onChange={(e) => setNewIssueCat(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="SITE_MOISTURE">Site Moisture</option>
                      <option value="RWA_REGULATION">RWA Rules</option>
                      <option value="MATERIAL_SHORTAGE">Material Shortage</option>
                      <option value="TRADE_OVERLAP">Trade Overlap</option>
                      <option value="ADMIN_APPROVAL">Admin Clearance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Severity</label>
                    <select
                      value={newIssueSev}
                      onChange={(e) => setNewIssueSev(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Est. Delay Days</label>
                    <input
                      type="number"
                      value={newIssueDelay}
                      onChange={(e) => setNewIssueDelay(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Proposed Mitigation & Plan</label>
                  <textarea
                    rows={3}
                    value={newIssuePlan}
                    onChange={(e) => setNewIssuePlan(e.target.value)}
                    placeholder="Action steps being taken to resolve or prevent project delay..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowIssueModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs transition"
                  >
                    Escalate to Admin Desk
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
