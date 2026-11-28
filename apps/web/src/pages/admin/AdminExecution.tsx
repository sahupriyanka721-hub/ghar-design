import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Building,
  TrendingUp,
  DollarSign,
  Info,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  getExecutionProjects,
  ExecutionProject,
} from '../../data/projectExecutionStore.js';
import { pushToCloud } from '../../data/cloudSync.js';

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

export const EXECUTION_SUBVIEWS: Array<{
  key: ExecutionViewMode;
  label: string;
  icon: any;
  desc: string;
}> = [
  { key: 'EXECUTION_PLANNING', label: '1. Execution Planning', icon: Layers, desc: 'Project master schedule, phases, critical path & site readiness clearances' },
  { key: 'WORK_INSTRUCTIONS', label: '2. Work Instructions', icon: FileText, desc: 'Official work orders, drawing references, tolerance limits & safety SOPs' },
  { key: 'VENDOR_COORDINATION', label: '3. Vendor Coordination', icon: Truck, desc: 'Material supply tracking, purchase orders, depot dispatches & delivery SLAs' },
  { key: 'MATERIAL_COORDINATION', label: '4. Material Coordination', icon: Package, desc: 'Site material requisitions, stock on site, batch test lab certifications' },
  { key: 'CONTRACTOR_COORDINATION', label: '5. Contractor Coordination', icon: HardHat, desc: 'Mobilized contractors, daily labor headcount, trade clearances & performance' },
  { key: 'INSTALLATION_SCHEDULE', label: '6. Installation Schedule', icon: CalendarRange, desc: 'HVAC, woodwork, fixtures, aluminum windows & finishing timelines' },
  { key: 'WORK_INSPECTION', label: '7. Work Inspection & QA', icon: ShieldCheck, desc: 'Admin site QA/QC inspection, snag list, defect punch list & punch clearance' },
  { key: 'PROGRESS_REPORTS', label: '8. Site Progress Reports', icon: Gauge, desc: 'Daily Progress Reports (DPR), site photo verification, physical progress vs planned' },
  { key: 'ISSUES_DELAYS', label: '9. Issues & Delays Desk', icon: AlertOctagon, desc: 'Site bottlenecks, delay logs, timeline impact, root cause & dispute resolution' },
];

export const AdminExecution: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlView = (searchParams.get('view') as ExecutionViewMode) || 'EXECUTION_PLANNING';
  const [activeView, setActiveView] = useState<ExecutionViewMode>(urlView);
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('ALL');

  useEffect(() => {
    const v = searchParams.get('view') as ExecutionViewMode;
    if (v && v !== activeView) {
      setActiveView(v);
    }
  }, [searchParams]);

  const handleSelectView = (v: ExecutionViewMode) => {
    setActiveView(v);
    setSearchParams({ view: v });
  };

  // Projects from store
  const executionProjects = useMemo(() => {
    try {
      const list = getExecutionProjects();
      if (list && list.length > 0) return list;
    } catch {}
    return [
      {
        id: 'PRJ-2026-081',
        title: 'Shri Sharma Luxury Duplex Villa',
        customerName: 'Rohit Sharma',
        location: 'Indore, MP (Scheme 78)',
        status: 'ACTIVE',
        overallProgress: 42,
        budgetPaise: 480000000,
        startDate: '2026-09-10',
        targetCompletionDate: '2027-04-30',
        contractorName: 'Apex Buildtech & Civil Works',
        architectName: 'Ar. Rajesh Verma (COA: CA/2012/5548)',
        interiorDesignerName: 'Sanya Interior Studio',
      },
      {
        id: 'PRJ-2026-094',
        title: 'Verma Smart Residence',
        customerName: 'Anil Verma',
        location: 'Bhopal, MP (Arera Colony)',
        status: 'ACTIVE',
        overallProgress: 68,
        budgetPaise: 350000000,
        startDate: '2026-08-01',
        targetCompletionDate: '2027-02-28',
        contractorName: 'Malwa Infratech Pvt Ltd',
        architectName: 'Studio ArchForm Design',
        interiorDesignerName: 'CraftEdge Design Lab',
      },
      {
        id: 'PRJ-2026-102',
        title: 'Green Meadows Penthouse Interior',
        customerName: 'Priya Malviya',
        location: 'Ujjain, MP (Freeganj)',
        status: 'ACTIVE',
        overallProgress: 24,
        budgetPaise: 220000000,
        startDate: '2026-10-15',
        targetCompletionDate: '2027-03-31',
        contractorName: 'Royal Interior Contractors',
        architectName: 'Ar. Sneha Kulkarni',
        interiorDesignerName: 'Elegance Interiors Indore',
      },
    ];
  }, []);

  // 1. Work Instructions Data
  const [workInstructions, setWorkInstructions] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('admin_work_instructions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'WI-101',
        projectId: 'PRJ-2026-081',
        projectTitle: 'Shri Sharma Luxury Duplex Villa',
        code: 'WI-RCC-COL-04',
        trade: 'Civil & Masonry',
        title: 'C25/30 Column Shuttering & Vibrator Compaction',
        drawingRef: 'STR-DWG-L1-COL-REV2.pdf',
        tolerance: '± 3mm plumb variance per 3m height',
        priority: 'CRITICAL',
        status: 'IN_EXECUTION',
        issuedTo: 'Apex Buildtech Civil Team',
        issuedDate: '2026-11-20',
        safetySOP: 'Compulsory IS safety harness for heights > 2.5m; check bracing stability prior to concrete pour.',
        detailedSpecs: 'High grade M25 concrete with approved superplasticizer. 24-hr curing under wet hessian cloth required.',
      },
      {
        id: 'WI-102',
        projectId: 'PRJ-2026-094',
        projectTitle: 'Verma Smart Residence',
        code: 'WI-ELEC-CONDUIT-02',
        trade: 'Electrical',
        title: 'Concealed Heavy-Gauge PVC Conduit Routing & Earthing',
        drawingRef: 'ELEC-L2-CONCEALED-REV3.dwg',
        tolerance: 'Minimum 50mm separation from water supply conduits',
        priority: 'HIGH',
        status: 'VERIFIED',
        issuedTo: 'Pawan Electrical Engineers',
        issuedDate: '2026-11-18',
        safetySOP: 'Isolate main breaker prior to tapping feeder lines. Use standard wire gauge color codes.',
        detailedSpecs: 'FR-LSH Grade insulated copper wiring with designated dedicated earthing pit connection.',
      },
      {
        id: 'WI-103',
        projectId: 'PRJ-2026-102',
        projectTitle: 'Green Meadows Penthouse Interior',
        code: 'WI-CARP-PANEL-01',
        trade: 'Carpentry',
        title: 'Marine Ply Fluted Wall Panelling & Concealed LED Grooves',
        drawingRef: 'INT-LIV-ELEV-B-V1.pdf',
        tolerance: '± 1mm groove alignment across continuous 4.2m panel span',
        priority: 'NORMAL',
        status: 'ISSUED',
        issuedTo: 'Royal Woodcraft Master Craftsmen',
        issuedDate: '2026-11-26',
        safetySOP: 'Dust masks and safety goggles mandatory during mechanical jigsaw and edge-banding work.',
        detailedSpecs: 'BWP Grade 710 calibrated marine plywood finished in natural white ash wood veneer.',
      },
    ];
  });

  // 2. Vendor Deliveries Data
  const [vendorDeliveries, setVendorDeliveries] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('admin_vendor_coordinations');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'VC-501',
        projectId: 'PRJ-2026-081',
        projectTitle: 'Shri Sharma Luxury Duplex Villa',
        vendorName: 'UltraTech Building Materials Depot',
        poNumber: 'PO-2026-NOV-881',
        item: 'PPC 53 Grade Cement (250 Bags)',
        dispatchDate: '2026-11-28',
        deliveryStatus: 'DISPATCHED_IN_TRANSIT',
        etaTime: 'Today, 04:30 PM',
        vehicleNumber: 'MP-09-GG-4412',
        driverContact: '+91 98260 11223',
        amountPaise: 9250000,
      },
      {
        id: 'VC-502',
        projectId: 'PRJ-2026-094',
        projectTitle: 'Verma Smart Residence',
        vendorName: 'Jindal Panther TMT Steel Distributors',
        poNumber: 'PO-2026-NOV-812',
        item: 'Fe 550D TMT Rebars (12mm & 16mm - 4.5 MT)',
        dispatchDate: '2026-11-27',
        deliveryStatus: 'DELIVERED_AND_VERIFIED',
        etaTime: 'Received Yesterday',
        vehicleNumber: 'MP-04-HE-7821',
        driverContact: '+91 94250 88712',
        amountPaise: 27800000,
      },
      {
        id: 'VC-503',
        projectId: 'PRJ-2026-102',
        projectTitle: 'Green Meadows Penthouse Interior',
        vendorName: 'Kajaria Vitrified Tiles Hub',
        poNumber: 'PO-2026-NOV-915',
        item: 'Glazed Vitrified Large Slab Tiles 1200x1800mm (80 Boxes)',
        dispatchDate: '2026-11-29',
        deliveryStatus: 'ORDER_PACKING',
        etaTime: 'Tomorrow Morning',
        vehicleNumber: 'Awaiting Gate Pass',
        driverContact: '+91 97550 44321',
        amountPaise: 16500000,
      },
    ];
  });

  // 3. Material Requisitions Data
  const [materialRequisitions, setMaterialRequisitions] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('admin_material_requisitions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'MR-301',
        projectId: 'PRJ-2026-081',
        projectTitle: 'Shri Sharma Luxury Duplex Villa',
        material: 'M-Sand (Manufactured Zone II Sand for Plastering)',
        requiredQty: '250 Cu.Ft',
        stockOnSite: '15 Cu.Ft',
        urgency: 'HIGH',
        status: 'PENDING_ADMIN_APPROVAL',
        requestedBy: 'Site Supervisor Dinesh (Apex Buildtech)',
        requestedDate: '2026-11-28',
        labTestCertificate: 'IS-383-Sieve-Analysis-Pass.pdf',
      },
      {
        id: 'MR-302',
        projectId: 'PRJ-2026-094',
        projectTitle: 'Verma Smart Residence',
        material: 'Waterproofing Membrane & SBR Polymer Chemical',
        requiredQty: '50 Litres + 4 Rolls',
        stockOnSite: 'Nil',
        urgency: 'CRITICAL',
        status: 'APPROVED',
        requestedBy: 'Engineer Rakesh Malviya',
        requestedDate: '2026-11-26',
        labTestCertificate: 'ASTM-D5147-Tensile-Certified.pdf',
      },
      {
        id: 'MR-303',
        projectId: 'PRJ-2026-102',
        projectTitle: 'Green Meadows Penthouse Interior',
        material: 'German Soft-Close Telescopic Drawer Runners (Set of 24)',
        requiredQty: '24 Pairs',
        stockOnSite: '4 Pairs',
        urgency: 'NORMAL',
        status: 'APPROVED',
        requestedBy: 'Interior Lead Sanya',
        requestedDate: '2026-11-27',
        labTestCertificate: 'EN-15338-Cycle-Tested-100K.pdf',
      },
    ];
  });

  // 4. Contractor Coordination Data
  const [contractorTeams, setContractorTeams] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('admin_contractor_coordinations');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'CC-401',
        projectId: 'PRJ-2026-081',
        projectTitle: 'Shri Sharma Luxury Duplex Villa',
        contractorName: 'Apex Buildtech & Civil Works',
        leadSupervisor: 'Er. Mohan Lal Patidar (+91 98260 77112)',
        trade: 'Structure & Civil',
        masons: 6,
        barBenders: 4,
        helpers: 8,
        totalHeadcount: 18,
        status: 'ON_DUTY',
        safetyCompliance: '100% PPE Verified',
        currentTask: 'First floor beam shuttering & bar bending reinforcement',
        clearanceStatus: 'SITE_AUTHORIZED',
      },
      {
        id: 'CC-402',
        projectId: 'PRJ-2026-094',
        projectTitle: 'Verma Smart Residence',
        contractorName: 'Malwa Infratech Pvt Ltd',
        leadSupervisor: 'Sunil Chouhan (+91 94250 33441)',
        trade: 'Plastering & Brickwork',
        masons: 4,
        barBenders: 0,
        helpers: 6,
        totalHeadcount: 10,
        status: 'ON_DUTY',
        safetyCompliance: 'Scaffolding Safety Inspected',
        currentTask: 'External double-coat sand-face plastering south elevation',
        clearanceStatus: 'SITE_AUTHORIZED',
      },
      {
        id: 'CC-403',
        projectId: 'PRJ-2026-102',
        projectTitle: 'Green Meadows Penthouse Interior',
        contractorName: 'Royal Interior Contractors',
        leadSupervisor: 'Ustaad Iqbal Khan (+91 99930 11990)',
        trade: 'Modular Carpentry & Gypsum False Ceiling',
        masons: 0,
        barBenders: 0,
        helpers: 5,
        totalHeadcount: 9,
        status: 'ON_DUTY',
        safetyCompliance: 'Fire Extinguisher & First-Aid Deployed',
        currentTask: 'Living room perimeter cove channel framing and gypsum board fixing',
        clearanceStatus: 'SITE_AUTHORIZED',
      },
    ];
  });

  // 5. Installation Schedule Data
  const [installations, setInstallations] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('admin_installation_schedules');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'INS-601',
        projectId: 'PRJ-2026-081',
        item: 'Daikin VRV Central Air Conditioning Copper Piping',
        scheduledDate: '2026-12-05',
        leadTech: 'CoolTech HVAC Systems (Lead: Imran)',
        status: 'SCHEDULED',
        readinessPct: 85,
        slaImpact: 'On Schedule (Zero Delay)',
      },
      {
        id: 'INS-602',
        projectId: 'PRJ-2026-094',
        item: 'Dommal Domus System Aluminum Double Glazed Windows',
        scheduledDate: '2026-12-02',
        leadTech: 'Fenesta Certified Installation Squad',
        status: 'IN_PREPARATION',
        readinessPct: 90,
        slaImpact: 'Site Opening Ready',
      },
      {
        id: 'INS-603',
        projectId: 'PRJ-2026-102',
        item: 'Modular Island Kitchen Granite & Blum Mechanism',
        scheduledDate: '2026-12-10',
        leadTech: 'Häfele Studio Certified Fitters',
        status: 'SCHEDULED',
        readinessPct: 70,
        slaImpact: 'Carcass Fabrication 70% Done',
      },
    ];
  });

  // 6. Work Inspection QA Snag Items Data
  const [snagItems, setSnagItems] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('admin_qa_snag_items');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'SNAG-701',
        projectId: 'PRJ-2026-081',
        projectTitle: 'Shri Sharma Luxury Duplex Villa',
        location: 'Ground Floor Guest Bedroom East Wall',
        issue: 'Surface undulation in rough plaster exceeding 3mm tolerance limit',
        severity: 'MEDIUM',
        status: 'OPEN',
        contractor: 'Apex Buildtech & Civil Works',
        assignedTo: 'Plastering Head Ramlal',
        targetDate: '2026-11-30',
        inspectedBy: 'Admin QA Engineer Er. Arvind Saxena',
        photo: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'SNAG-702',
        projectId: 'PRJ-2026-094',
        projectTitle: 'Verma Smart Residence',
        location: 'First Floor Master Bathroom Soil Pipe Joint',
        issue: 'Minor water seepage pinhole around PVC collar prior to pressure testing',
        severity: 'HIGH',
        status: 'RECTIFIED_VERIFIED',
        contractor: 'Malwa Infratech Pvt Ltd',
        assignedTo: 'Lead Plumber Satish',
        targetDate: '2026-11-27',
        inspectedBy: 'Admin QA Engineer Er. Arvind Saxena',
        photo: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'SNAG-703',
        projectId: 'PRJ-2026-102',
        projectTitle: 'Green Meadows Penthouse Interior',
        location: 'Dining Area Gypsum False Ceiling Perimeter',
        issue: 'Cove channel alignment gap 4mm off level near AC grill return',
        severity: 'LOW',
        status: 'IN_RECTIFICATION',
        contractor: 'Royal Interior Contractors',
        assignedTo: 'Gypsum Specialist Afzal',
        targetDate: '2026-12-01',
        inspectedBy: 'Admin Quality Auditor Meenakshi Sharma',
        photo: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80',
      },
    ];
  });

  // 7. Daily Site Progress Reports (DPR)
  const [dprReports, setDprReports] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('admin_dpr_reports');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'DPR-2026-1128',
        projectId: 'PRJ-2026-081',
        projectTitle: 'Shri Sharma Luxury Duplex Villa',
        reportDate: '2026-11-28',
        weather: 'Sunny & Clear (26°C)',
        laborHeadcount: 18,
        workCompletedSummary: 'Completed shuttering for column C12-C16. Cast 14 cum of concrete for rear boundary foundation retaining wall. Curing done twice.',
        plannedVsActual: 'Planned 42% | Verified 42% (On Track)',
        submittedBy: 'Er. Mohan Lal Patidar (Civil Site In-Charge)',
        status: 'VERIFIED_BY_ADMIN',
        sitePhotos: [
          'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=300&q=80',
          'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=300&q=80',
        ],
      },
      {
        id: 'DPR-2026-1127',
        projectId: 'PRJ-2026-094',
        projectTitle: 'Verma Smart Residence',
        reportDate: '2026-11-27',
        weather: 'Pleasant (24°C)',
        laborHeadcount: 10,
        workCompletedSummary: 'External plastering south wall second coat 65% complete. Electrical conduit pressure test completed in kitchen and utility area.',
        plannedVsActual: 'Planned 67% | Verified 68% (+1% Ahead of Schedule)',
        submittedBy: 'Sunil Chouhan (Lead Supervisor)',
        status: 'VERIFIED_BY_ADMIN',
        sitePhotos: [
          'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=300&q=80',
        ],
      },
    ];
  });

  // 8. Issues & Delays Desk Data
  const [issuesAndDelays, setIssuesAndDelays] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('admin_site_issues_delays');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'ISS-901',
        projectId: 'PRJ-2026-081',
        projectTitle: 'Shri Sharma Luxury Duplex Villa',
        category: 'MATERIAL_DELAY',
        title: 'Ready-Mix Concrete Transit Mixer delayed due to city truck restriction window',
        severity: 'MEDIUM',
        status: 'RESOLVED',
        timelineImpact: '0 Days (Rescheduled to 02:00 PM same day)',
        costImpactPaise: 0,
        raisedDate: '2026-11-25',
        resolutionNote: 'Special daytime municipal transit permit coordinated by Admin Operations Desk.',
      },
      {
        id: 'ISS-902',
        projectId: 'PRJ-2026-102',
        projectTitle: 'Green Meadows Penthouse Interior',
        category: 'DESIGN_CHANGE',
        title: 'Customer requested relocation of walk-in wardrobe partition wall by 1.5 ft',
        severity: 'HIGH',
        status: 'UNDER_ADMIN_INVESTIGATION',
        timelineImpact: '+3 Days SLA Adjustment Needed',
        costImpactPaise: 1850000,
        raisedDate: '2026-11-27',
        resolutionNote: 'Structural load clearance received from Architect. Variation quotation submitted to homeowner for sign-off.',
      },
    ];
  });

  // Modal State for New Work Instruction
  const [showWIModal, setShowWIModal] = useState(false);
  const [wiForm, setWiForm] = useState({
    projectId: 'PRJ-2026-081',
    title: '',
    trade: 'Civil & Masonry',
    code: 'WI-CIVIL-05',
    drawingRef: '',
    tolerance: '± 2mm',
    priority: 'HIGH',
    issuedTo: '',
    safetySOP: '',
    detailedSpecs: '',
  });

  // Modal State for New Snag
  const [showSnagModal, setShowSnagModal] = useState(false);
  const [snagForm, setSnagForm] = useState({
    projectId: 'PRJ-2026-081',
    location: '',
    issue: '',
    severity: 'MEDIUM',
    contractor: 'Apex Buildtech & Civil Works',
    assignedTo: '',
    targetDate: '',
  });

  // Quick stats
  const stats = useMemo(() => {
    return {
      activeProjects: executionProjects.length,
      openInstructions: workInstructions.filter((w) => w.status !== 'VERIFIED').length,
      pendingRequisitions: materialRequisitions.filter((m) => m.status === 'PENDING_ADMIN_APPROVAL').length,
      totalLaborToday: contractorTeams.reduce((acc, c) => acc + (c.totalHeadcount || 0), 0),
      openSnags: snagItems.filter((s) => s.status !== 'RECTIFIED_VERIFIED').length,
      activeIssues: issuesAndDelays.filter((i) => i.status !== 'RESOLVED').length,
    };
  }, [executionProjects, workInstructions, materialRequisitions, contractorTeams, snagItems, issuesAndDelays]);

  // Handlers
  const handleSaveWI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wiForm.title.trim()) {
      error('Please enter a descriptive instruction title');
      return;
    }
    const proj = executionProjects.find((p) => p.id === wiForm.projectId) || executionProjects[0];
    const newWI = {
      id: `WI-${Date.now().toString().slice(-4)}`,
      projectId: wiForm.projectId,
      projectTitle: proj.title,
      code: wiForm.code || `WI-${Date.now().toString().slice(-3)}`,
      trade: wiForm.trade,
      title: wiForm.title,
      drawingRef: wiForm.drawingRef || 'APPROVED-GFC-REV1.dwg',
      tolerance: wiForm.tolerance || 'Standard IS Code',
      priority: wiForm.priority,
      status: 'ISSUED',
      issuedTo: wiForm.issuedTo || 'Site Execution Team',
      issuedDate: new Date().toISOString().split('T')[0],
      safetySOP: wiForm.safetySOP || 'Mandatory standard PPE & safety equipment on site.',
      detailedSpecs: wiForm.detailedSpecs || 'Execute strictly per approved architectural working drawings.',
    };
    const updated = [newWI, ...workInstructions];
    setWorkInstructions(updated);
    localStorage.setItem('admin_work_instructions', JSON.stringify(updated));
    setShowWIModal(false);
    success(`Official Work Instruction ${newWI.code} dispatched to contractor team!`);
    pushToCloud().catch(() => {});
  };

  const handleVerifyWI = (id: string) => {
    const updated = workInstructions.map((w) =>
      w.id === id ? { ...w, status: 'VERIFIED' } : w
    );
    setWorkInstructions(updated);
    localStorage.setItem('admin_work_instructions', JSON.stringify(updated));
    success('Work Instruction marked verified and compliant by Admin QA!');
  };

  const handleApproveRequisition = (id: string) => {
    const updated = materialRequisitions.map((m) =>
      m.id === id ? { ...m, status: 'APPROVED' } : m
    );
    setMaterialRequisitions(updated);
    localStorage.setItem('admin_material_requisitions', JSON.stringify(updated));
    success('Material Requisition approved! Purchase order dispatched to verified depot.');
  };

  const handleSaveSnag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snagForm.issue.trim()) {
      error('Please describe the defect or snag observation');
      return;
    }
    const proj = executionProjects.find((p) => p.id === snagForm.projectId) || executionProjects[0];
    const newSnag = {
      id: `SNAG-${Date.now().toString().slice(-4)}`,
      projectId: snagForm.projectId,
      projectTitle: proj.title,
      location: snagForm.location || 'General Site Area',
      issue: snagForm.issue,
      severity: snagForm.severity,
      status: 'OPEN',
      contractor: snagForm.contractor,
      assignedTo: snagForm.assignedTo || 'Site Lead',
      targetDate: snagForm.targetDate || '2026-12-05',
      inspectedBy: 'Admin QA/QC Team',
      photo: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=400&q=80',
    };
    const updated = [newSnag, ...snagItems];
    setSnagItems(updated);
    localStorage.setItem('admin_qa_snag_items', JSON.stringify(updated));
    setShowSnagModal(false);
    success(`QA Snag ticket ${newSnag.id} logged and assigned to contractor!`);
  };

  const handleResolveSnag = (id: string) => {
    const updated = snagItems.map((s) =>
      s.id === id ? { ...s, status: 'RECTIFIED_VERIFIED' } : s
    );
    setSnagItems(updated);
    localStorage.setItem('admin_qa_snag_items', JSON.stringify(updated));
    success('Snag verified as rectified and cleared from punch list!');
  };

  const handleResolveIssue = (id: string) => {
    const updated = issuesAndDelays.map((i) =>
      i.id === id ? { ...i, status: 'RESOLVED', resolutionNote: 'Resolved and closed by Super Admin Operations Desk.' } : i
    );
    setIssuesAndDelays(updated);
    localStorage.setItem('admin_site_issues_delays', JSON.stringify(updated));
    success('Issue resolved & logged in project SLA audit history!');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ---------------- TOP BANNER & METRICS ---------------- */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold uppercase tracking-wider mb-3">
              <HardHat className="w-4 h-4 text-amber-400" />
              <span>Module 8: Centralized Admin Execution Desk</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Project Execution & Coordination Control
            </h1>
            <p className="text-blue-200/80 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Real-time oversight of construction execution, contractor daily headcounts, vendor deliveries, QA snag audits, work instructions & SLA delay management.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 text-center">
            <div className="px-2">
              <div className="text-lg font-black text-white">{stats.activeProjects}</div>
              <div className="text-[10px] text-blue-200 uppercase font-bold">Active Sites</div>
            </div>
            <div className="px-2 border-l border-white/10">
              <div className="text-lg font-black text-amber-300">{stats.openInstructions}</div>
              <div className="text-[10px] text-blue-200 uppercase font-bold">Pending WI</div>
            </div>
            <div className="px-2 border-l border-white/10">
              <div className="text-lg font-black text-sky-300">{stats.pendingRequisitions}</div>
              <div className="text-[10px] text-blue-200 uppercase font-bold">Requisitions</div>
            </div>
            <div className="px-2 border-l border-white/10">
              <div className="text-lg font-black text-emerald-300">{stats.totalLaborToday}</div>
              <div className="text-[10px] text-blue-200 uppercase font-bold">Labor On-Site</div>
            </div>
            <div className="px-2 border-l border-white/10">
              <div className="text-lg font-black text-rose-300">{stats.openSnags}</div>
              <div className="text-[10px] text-blue-200 uppercase font-bold">Open Snags</div>
            </div>
            <div className="px-2 border-l border-white/10">
              <div className="text-lg font-black text-purple-300">{stats.activeIssues}</div>
              <div className="text-[10px] text-blue-200 uppercase font-bold">Delays/Issues</div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- 9 SUB-FEATURE NAVIGATION TABS ---------------- */}
      <div className="bg-white rounded-2xl border border-blue-200/80 p-2 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1">
          {EXECUTION_SUBVIEWS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleSelectView(tab.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 via-blue-700 to-navy-950 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:text-navy-950 hover:bg-blue-50/80'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-blue-600'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------- SUBVIEW CONTENT ---------------- */}
      <div className="space-y-4">
        {/* VIEW 1: EXECUTION PLANNING */}
        {activeView === 'EXECUTION_PLANNING' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-blue-200/80 p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-black text-navy-950 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-600" />
                    <span>Project Execution Schedules & Stage Clearances</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    5-Stage construction roadmap, planned vs actual progress, critical path milestones & lead trades.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {executionProjects.map((p) => (
                  <div
                    key={p.id}
                    className="border border-blue-100 rounded-xl p-4 bg-gradient-to-b from-white to-blue-50/20 hover:border-blue-300 transition shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          {p.id}
                        </span>
                        <h4 className="text-sm font-bold text-navy-950 mt-1">{p.title}</h4>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.location}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {p.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Physical Progress:</span>
                        <span className="font-bold text-blue-900">{p.overallProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full"
                          style={{ width: `${p.overallProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-xs space-y-1 text-slate-600 pt-1">
                      <div><strong className="text-slate-700">Contractor:</strong> {p.contractorName}</div>
                      <div><strong className="text-slate-700">Architect:</strong> {p.architectName}</div>
                      <div><strong className="text-slate-700">Budget:</strong> {formatINR(p.budgetPaise)}</div>
                      <div><strong className="text-slate-700">Target Handover:</strong> {formatDate(p.targetCompletionDate)}</div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Site Readiness: 100% Cleared
                      </span>
                      <button
                        type="button"
                        onClick={() => success(`Phase clearance re-verified for project ${p.id}`)}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                      >
                        Audit Stage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: WORK INSTRUCTIONS */}
        {activeView === 'WORK_INSTRUCTIONS' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-blue-200/80 p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-black text-navy-950 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span>Official Admin Work Instructions (WI)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mandatory site work orders issued with drawing references, tolerance constraints and safety SOPs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWIModal(true)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Issue New Instruction</span>
                </button>
              </div>

              <div className="space-y-3">
                {workInstructions.map((wi) => (
                  <div
                    key={wi.id}
                    className="border border-blue-100 rounded-xl p-4 bg-white hover:border-blue-300 transition shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black bg-blue-50 text-blue-900 border border-blue-200 px-2 py-0.5 rounded">
                          {wi.code}
                        </span>
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {wi.trade}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            wi.priority === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : wi.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {wi.priority}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full self-start sm:self-auto ${
                          wi.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {wi.status === 'VERIFIED' ? '✓ Verified Compliant' : '⏳ In Execution'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-navy-950 mb-1">{wi.title}</h4>
                    <p className="text-xs text-slate-600 mb-2 leading-relaxed">{wi.detailedSpecs}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-3">
                      <div><strong className="text-slate-700">Project:</strong> {wi.projectTitle}</div>
                      <div><strong className="text-slate-700">Drawing Ref:</strong> <span className="font-mono text-blue-700">{wi.drawingRef}</span></div>
                      <div><strong className="text-slate-700">Tolerance:</strong> <span className="font-mono text-slate-700">{wi.tolerance}</span></div>
                      <div className="sm:col-span-3 text-slate-500"><strong className="text-slate-700">Safety SOP:</strong> {wi.safetySOP}</div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-500">Issued to <strong className="text-slate-700">{wi.issuedTo}</strong> on {formatDate(wi.issuedDate)}</span>
                      {wi.status !== 'VERIFIED' && (
                        <button
                          type="button"
                          onClick={() => handleVerifyWI(wi.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Verify Compliance</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: VENDOR COORDINATION */}
        {activeView === 'VENDOR_COORDINATION' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-blue-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-navy-950 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <span>Vendor Delivery & Logistics Coordination</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Direct tracking of supplier dispatches, transport vehicle details and arrival ETAs at construction sites.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {vendorDeliveries.map((v) => (
                  <div
                    key={v.id}
                    className="border border-blue-100 rounded-xl p-4 bg-white hover:border-blue-300 transition shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-navy-950">{v.vendorName}</span>
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                          {v.poNumber}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          v.deliveryStatus === 'DELIVERED_AND_VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-sky-100 text-sky-800 border border-sky-200 animate-pulse'
                        }`}
                      >
                        {v.deliveryStatus.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 font-semibold mb-2 flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span>{v.item}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-navy-950 font-bold">{formatINR(v.amountPaise)}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs bg-blue-50/40 p-2.5 rounded-lg border border-blue-100 mb-3">
                      <div><strong className="text-slate-700">Project:</strong> {v.projectTitle}</div>
                      <div><strong className="text-slate-700">Vehicle:</strong> <span className="font-mono">{v.vehicleNumber}</span></div>
                      <div><strong className="text-slate-700">Driver Contact:</strong> {v.driverContact}</div>
                      <div><strong className="text-slate-700">ETA / Status:</strong> <span className="text-blue-900 font-bold">{v.etaTime}</span></div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => success(`Delivery receipt verified for PO ${v.poNumber}`)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                      >
                        Acknowledge Site Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: MATERIAL COORDINATION */}
        {activeView === 'MATERIAL_COORDINATION' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-blue-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-navy-950 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <span>Site Material Requisitions & Quality Lab Certifications</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review and authorize site raw material purchase requests with batch test quality compliance (IS 456 / IS 383).
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {materialRequisitions.map((mr) => (
                  <div
                    key={mr.id}
                    className="border border-blue-100 rounded-xl p-4 bg-white hover:border-blue-300 transition shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                          {mr.id}
                        </span>
                        <h4 className="text-sm font-bold text-navy-950">{mr.material}</h4>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          mr.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {mr.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-3">
                      <div><strong className="text-slate-700">Project:</strong> {mr.projectTitle}</div>
                      <div><strong className="text-slate-700">Required:</strong> <span className="font-bold text-blue-900">{mr.requiredQty}</span></div>
                      <div><strong className="text-slate-700">Stock on Site:</strong> {mr.stockOnSite}</div>
                      <div><strong className="text-slate-700">Lab Test Cert:</strong> <span className="font-mono text-emerald-700 font-bold">{mr.labTestCertificate}</span></div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Requested by <strong className="text-slate-700">{mr.requestedBy}</strong> on {formatDate(mr.requestedDate)}</span>
                      {mr.status !== 'APPROVED' && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleApproveRequisition(mr.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve Requisition</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: CONTRACTOR COORDINATION */}
        {activeView === 'CONTRACTOR_COORDINATION' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-blue-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-navy-950 flex items-center gap-2">
                    <HardHat className="w-5 h-5 text-blue-600" />
                    <span>Contractor Mobilization & Daily Labor Headcount</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live site attendance of masons, bar-benders, carpenters and helpers across all active work sites.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {contractorTeams.map((ct) => (
                  <div
                    key={ct.id}
                    className="border border-blue-100 rounded-xl p-4 bg-white hover:border-blue-300 transition shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {ct.trade}
                        </span>
                        <h4 className="text-sm font-bold text-navy-950 mt-1">{ct.contractorName}</h4>
                        <div className="text-xs text-slate-500">{ct.leadSupervisor}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {ct.status}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-navy-950 border-b border-slate-200 pb-1">
                        <span>Total Labor Today:</span>
                        <span className="text-sm text-blue-700">{ct.totalHeadcount} Workers</span>
                      </div>
                      <div className="flex justify-between text-slate-600 pt-0.5">
                        <span>Masons / Masters:</span>
                        <span>{ct.masons}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Bar Benders / Fitters:</span>
                        <span>{ct.barBenders}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>General Helpers:</span>
                        <span>{ct.helpers}</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600">
                      <strong>Current Task:</strong> {ct.currentTask}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {ct.safetyCompliance}
                      </span>
                      <button
                        type="button"
                        onClick={() => success(`Labor attendance logged for ${ct.contractorName}`)}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                      >
                        Verify Headcount
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 6: INSTALLATION SCHEDULE */}
        {activeView === 'INSTALLATION_SCHEDULE' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-blue-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-navy-950 flex items-center gap-2">
                    <CalendarRange className="w-5 h-5 text-blue-600" />
                    <span>Specialized Trade Installation Schedule</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Timeline and readiness coordination for HVAC, elevator, modular kitchen, glass facade and finishes.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {installations.map((ins) => (
                  <div
                    key={ins.id}
                    className="border border-blue-100 rounded-xl p-4 bg-white hover:border-blue-300 transition shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                          {ins.id}
                        </span>
                        <h4 className="text-sm font-bold text-navy-950">{ins.item}</h4>
                      </div>
                      <div className="text-xs text-slate-500">
                        Technician Agency: <strong className="text-slate-700">{ins.leadTech}</strong>
                      </div>
                      <div className="text-xs text-emerald-700 font-bold mt-1">
                        Site Readiness: {ins.readinessPct}% • {ins.slaImpact}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-slate-400 font-medium">Scheduled Date</div>
                        <div className="text-sm font-bold text-navy-950">{formatDate(ins.scheduledDate)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => success(`Installation clearance confirmed for ${ins.item}`)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                      >
                        Confirm Schedule
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 7: WORK INSPECTION & QA */}
        {activeView === 'WORK_INSPECTION' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-blue-200/80 p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-black text-navy-950 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <span>Admin QA/QC Inspection & Snag Punch List</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Defect tickets, tolerances violations and quality rectification monitoring across all projects.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSnagModal(true)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-500/20 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Raise QA Snag Item</span>
                </button>
              </div>

              <div className="space-y-3">
                {snagItems.map((snag) => (
                  <div
                    key={snag.id}
                    className="border border-blue-100 rounded-xl p-4 bg-white hover:border-blue-300 transition shadow-2xs flex flex-col sm:flex-row items-start gap-4"
                  >
                    <img
                      src={snag.photo}
                      alt="Snag Observation"
                      className="w-24 h-24 rounded-lg object-cover border border-slate-200 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {snag.id}
                        </span>
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {snag.location}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            snag.severity === 'HIGH'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {snag.severity}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ml-auto ${
                            snag.status === 'RECTIFIED_VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {snag.status === 'RECTIFIED_VERIFIED' ? '✓ Rectified & Cleared' : 'Action Required'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-navy-950 mb-1">{snag.issue}</h4>
                      <div className="text-xs text-slate-600 space-y-0.5">
                        <div><strong>Contractor:</strong> {snag.contractor} (Assigned to: {snag.assignedTo})</div>
                        <div><strong>Inspected By:</strong> {snag.inspectedBy} • Target Resolution: {formatDate(snag.targetDate)}</div>
                      </div>

                      {snag.status !== 'RECTIFIED_VERIFIED' && (
                        <div className="pt-3 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => handleResolveSnag(snag.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Rectification Verified</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 8: SITE PROGRESS REPORTS (DPR) */}
        {activeView === 'PROGRESS_REPORTS' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-blue-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-navy-950 flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-blue-600" />
                    <span>Daily Site Progress Reports (DPR Verification)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Field execution logs, physical progress measurements, labor verification & verified site photographs.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {dprReports.map((dpr) => (
                  <div
                    key={dpr.id}
                    className="border border-blue-100 rounded-xl p-4 bg-white hover:border-blue-300 transition shadow-2xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                          {dpr.id}
                        </span>
                        <h4 className="text-sm font-bold text-navy-950 mt-1">{dpr.projectTitle}</h4>
                        <div className="text-xs text-slate-500">
                          Date: <strong className="text-slate-700">{formatDate(dpr.reportDate)}</strong> • Weather: {dpr.weather} • {dpr.laborHeadcount} Workers
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                        ✓ Verified by Admin
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <strong>Work Completed Today:</strong> {dpr.workCompletedSummary}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-blue-900">{dpr.plannedVsActual}</span>
                      <span className="text-slate-500">Submitted by {dpr.submittedBy}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {dpr.sitePhotos.map((photo: string, idx: number) => (
                        <img
                          key={idx}
                          src={photo}
                          alt="DPR Site Proof"
                          className="w-20 h-20 rounded-lg object-cover border border-slate-200"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 9: ISSUES & DELAYS */}
        {activeView === 'ISSUES_DELAYS' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-blue-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-navy-950 flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 text-rose-600" />
                    <span>Site Bottlenecks, Delay Logs & Resolution Desk</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Monitor project blockers, material delays, labor strikes, weather impact and SLA extensions.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {issuesAndDelays.map((iss) => (
                  <div
                    key={iss.id}
                    className="border border-blue-100 rounded-xl p-4 bg-white hover:border-blue-300 transition shadow-2xs space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {iss.id}
                        </span>
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {iss.category.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            iss.severity === 'HIGH'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {iss.severity}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full self-start sm:self-auto ${
                          iss.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                        }`}
                      >
                        {iss.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-navy-950">{iss.title}</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div><strong className="text-slate-700">Project:</strong> {iss.projectTitle}</div>
                      <div><strong className="text-slate-700">Timeline Impact:</strong> <span className="text-rose-700 font-bold">{iss.timelineImpact}</span></div>
                      <div><strong className="text-slate-700">Cost Impact:</strong> <span className="font-bold">{formatINR(iss.costImpactPaise)}</span></div>
                      <div className="sm:col-span-3 text-slate-600"><strong className="text-slate-700">Resolution Note:</strong> {iss.resolutionNote}</div>
                    </div>

                    {iss.status !== 'RESOLVED' && (
                      <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleResolveIssue(iss.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Resolve & Close Ticket</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ---------------- CREATE WORK INSTRUCTION MODAL ---------------- */}
      {showWIModal && (
        <div className="fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl border border-blue-200 max-w-xl w-full p-6 text-slate-800 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-navy-950 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Issue Official Admin Work Instruction</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowWIModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWI} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Project</label>
                <select
                  value={wiForm.projectId}
                  onChange={(e) => setWiForm({ ...wiForm, projectId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-blue-500"
                >
                  {executionProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} - {p.title} ({p.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Instruction Code</label>
                  <input
                    type="text"
                    value={wiForm.code}
                    onChange={(e) => setWiForm({ ...wiForm, code: e.target.value })}
                    placeholder="e.g. WI-RCC-COL-05"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discipline / Trade</label>
                  <select
                    value={wiForm.trade}
                    onChange={(e) => setWiForm({ ...wiForm, trade: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="Civil & Masonry">Civil & Masonry</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Plumbing & Sanitation">Plumbing & Sanitation</option>
                    <option value="Carpentry">Carpentry & Woodwork</option>
                    <option value="Painting & Polishing">Painting & Polishing</option>
                    <option value="HVAC & Ventilation">HVAC & Ventilation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Instruction Title</label>
                <input
                  type="text"
                  required
                  value={wiForm.title}
                  onChange={(e) => setWiForm({ ...wiForm, title: e.target.value })}
                  placeholder="e.g. C25/30 Column Shuttering & Vibrator Compaction"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Drawing Reference</label>
                  <input
                    type="text"
                    value={wiForm.drawingRef}
                    onChange={(e) => setWiForm({ ...wiForm, drawingRef: e.target.value })}
                    placeholder="e.g. STR-DWG-L1-COL-REV2.pdf"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tolerance Specs</label>
                  <input
                    type="text"
                    value={wiForm.tolerance}
                    onChange={(e) => setWiForm({ ...wiForm, tolerance: e.target.value })}
                    placeholder="e.g. ± 3mm per 3m height"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={wiForm.priority}
                    onChange={(e) => setWiForm({ ...wiForm, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Issued To Team</label>
                  <input
                    type="text"
                    value={wiForm.issuedTo}
                    onChange={(e) => setWiForm({ ...wiForm, issuedTo: e.target.value })}
                    placeholder="e.g. Lead Contractor Civil Team"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Detailed Technical Specifications</label>
                <textarea
                  rows={3}
                  value={wiForm.detailedSpecs}
                  onChange={(e) => setWiForm({ ...wiForm, detailedSpecs: e.target.value })}
                  placeholder="Specify material grades, curing requirements, compaction guidelines..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWIModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer"
                >
                  Issue Instruction
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ---------------- RAISE SNAG MODAL ---------------- */}
      {showSnagModal && (
        <div className="fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl border border-blue-200 max-w-lg w-full p-6 text-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-navy-950 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Raise QA Snag / Defect Observation</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSnagModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSnag} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Project</label>
                <select
                  value={snagForm.projectId}
                  onChange={(e) => setSnagForm({ ...snagForm, projectId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-blue-500"
                >
                  {executionProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} - {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Specific Location</label>
                  <input
                    type="text"
                    required
                    value={snagForm.location}
                    onChange={(e) => setSnagForm({ ...snagForm, location: e.target.value })}
                    placeholder="e.g. Ground Floor Guest Bedroom East Wall"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Severity</label>
                  <select
                    value={snagForm.severity}
                    onChange={(e) => setSnagForm({ ...snagForm, severity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Defect Description</label>
                <textarea
                  rows={3}
                  required
                  value={snagForm.issue}
                  onChange={(e) => setSnagForm({ ...snagForm, issue: e.target.value })}
                  placeholder="Detail the quality variance, tolerance violation or defect observed..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assign To Contractor Lead</label>
                  <input
                    type="text"
                    value={snagForm.assignedTo}
                    onChange={(e) => setSnagForm({ ...snagForm, assignedTo: e.target.value })}
                    placeholder="e.g. Plastering Head Ramlal"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Resolution Date</label>
                  <input
                    type="date"
                    value={snagForm.targetDate}
                    onChange={(e) => setSnagForm({ ...snagForm, targetDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSnagModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold rounded-xl shadow-md shadow-rose-500/20 transition cursor-pointer"
                >
                  Log Snag Ticket
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
export default AdminExecution;
