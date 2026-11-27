import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatDate, formatINR } from '../../lib/utils.js';
import { useToast } from '../../context/ToastContext.js';
import {
  getPlatformRequests,
  updatePlatformRequestStatus,
  PlatformProjectRequest,
  syncChannel,
  broadcastStoreUpdate,
} from '../../data/customerStore.js';
import {
  getArchitectAccounts,
  saveArchitectAccount,
  ArchitectAccount,
} from '../../data/architectStore.js';
import { logAdminAuditAction, getActiveAdminRole } from '../../data/adminRbacStore.js';
import { pushToCloud, pullFromCloud } from '../../data/cloudSync.js';
import {
  Layers,
  Compass,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
  User,
  Phone,
  MapPin,
  Calendar,
  X,
  Check,
  RotateCcw,
  Plus,
  Send,
  AlertTriangle,
  Award,
  AlertCircle,
  Users,
  RefreshCw,
  Sliders,
  Shuffle,
  History,
  UserCheck,
  BarChart3,
  ExternalLink,
  MessageSquare,
  Settings,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Sparkles,
  Zap,
} from 'lucide-react';

// ============================================================================
// SUB-VIEWS DEFINITION (Module 5: Architect Assignment Management)
// ============================================================================
export const SUB_VIEWS = [
  { key: 'ASSIGN_ARCHITECT', label: 'Assign Architect', desc: 'Inquiries awaiting initial partner matching' },
  { key: 'REASSIGN_ARCHITECT', label: 'Reassign Architect', desc: 'Reallocate or replace assigned architectural firms' },
  { key: 'MULTI_ASSIGNMENT', label: 'Multiple Architect Assignment', desc: 'Multi-partner bidding & competition mode' },
  { key: 'HISTORY', label: 'Assignment History', desc: 'Complete audit trail of all assignment actions' },
  { key: 'AVAILABILITY', label: 'Architect Availability', desc: 'Partner capacity, workload & availability status' },
  { key: 'PERFORMANCE', label: 'Assignment Performance', desc: 'Turnaround SLAs, win rates & firm leaderboard' },
];

// ============================================================================
// STORAGE MODELS & HELPERS
// ============================================================================
export interface MultiAssignmentConfig {
  enabled: boolean;
  maxSlots: number;
  competitiveBidding: boolean;
  autoExpireDays: number;
}

const MULTI_CONFIG_KEY = 'platform_multi_assignment_config';
const DEFAULT_MULTI_CONFIG: MultiAssignmentConfig = {
  enabled: true,
  maxSlots: 3,
  competitiveBidding: true,
  autoExpireDays: 7,
};

export const getMultiAssignmentConfig = (): MultiAssignmentConfig => {
  try {
    const raw = localStorage.getItem(MULTI_CONFIG_KEY);
    if (raw) return { ...DEFAULT_MULTI_CONFIG, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_MULTI_CONFIG;
};

export const saveMultiAssignmentConfig = (cfg: MultiAssignmentConfig): void => {
  try {
    localStorage.setItem(MULTI_CONFIG_KEY, JSON.stringify(cfg));
  } catch {}
};

export interface AssignmentHistoryEntry {
  id: string;
  timestamp: string;
  requestId: string;
  requestCode: string;
  customerName: string;
  customerPhone?: string;
  city?: string;
  action: 'ASSIGNED' | 'REASSIGNED' | 'MULTI_ASSIGNED' | 'UNASSIGNED' | 'QUOTE_SUBMITTED';
  architects: Array<{ id: string; name: string; firmName: string; coaNumber?: string }>;
  previousArchitect?: { id: string; name: string; firmName: string };
  reason?: string;
  deadline?: string;
  adminName: string;
  adminRole: string;
}

const HISTORY_KEY = 'platform_assignment_history';

export const getAssignmentHistory = (requests: PlatformProjectRequest[] = []): AssignmentHistoryEntry[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  // Auto-seed from existing requests with assignments if history is blank
  const seeded: AssignmentHistoryEntry[] = [];
  requests.forEach((r, idx) => {
    if (r.assignedProfessionals && r.assignedProfessionals.length > 0) {
      seeded.push({
        id: `hist-${r.id}-${idx}`,
        timestamp: r.updatedAt || r.createdAt || new Date().toISOString(),
        requestId: r.id,
        requestCode: r.requestCode || r.id,
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        city: r.city || 'Delhi NCR',
        action: r.assignedProfessionals.length > 1 ? 'MULTI_ASSIGNED' : 'ASSIGNED',
        architects: r.assignedProfessionals.map((p) => ({
          id: p.id || '',
          name: p.name || 'Architect Partner',
          firmName: p.firmName || p.name || 'Studio Practice',
          coaNumber: p.coaNumber || 'COA Verified',
        })),
        deadline: r.responseDeadline,
        reason: r.adminNotes || 'Initial assignment matched via BuildGhar Central Desk',
        adminName: 'Super Administrator',
        adminRole: 'SUPER_ADMIN',
      });
    }
  });

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(seeded));
  } catch {}

  return seeded;
};

export const logAssignmentHistoryEvent = (entry: Omit<AssignmentHistoryEntry, 'id' | 'timestamp'>): void => {
  try {
    const existing = getAssignmentHistory();
    const newEntry: AssignmentHistoryEntry = {
      ...entry,
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newEntry, ...existing];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {}
};

export interface ArchitectAvailabilityInfo {
  status: 'AVAILABLE' | 'BUSY' | 'ON_LEAVE' | 'MAX_CAPACITY';
  maxCapacity: number;
  notes?: string;
  updatedAt: string;
}

const AVAILABILITY_KEY = 'platform_architect_availability_map';

export const getArchitectAvailabilityMap = (): Record<string, ArchitectAvailabilityInfo> => {
  try {
    const raw = localStorage.getItem(AVAILABILITY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
};

export const saveArchitectAvailabilityMap = (map: Record<string, ArchitectAvailabilityInfo>): void => {
  try {
    localStorage.setItem(AVAILABILITY_KEY, JSON.stringify(map));
  } catch {}
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const AdminAssignments: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlView = searchParams.get('view') || 'ASSIGN_ARCHITECT';
  const initialReqId = searchParams.get('requestId');

  const { success, error } = useToast();
  const [selectedView, setSelectedView] = useState<string>(urlView);
  const [requests, setRequests] = useState<PlatformProjectRequest[]>([]);
  const [architects, setArchitects] = useState<ArchitectAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Multi-Assignment Settings State
  const [multiConfig, setMultiConfig] = useState<MultiAssignmentConfig>(getMultiAssignmentConfig());

  // Availability State Map
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, ArchitectAvailabilityInfo>>({});

  // History State
  const [historyList, setHistoryList] = useState<AssignmentHistoryEntry[]>([]);
  const [historyFilterAction, setHistoryFilterAction] = useState<string>('ALL');

  // Modals
  const [showAssignModal, setShowAssignModal] = useState<PlatformProjectRequest | null>(null);
  const [assignArchId, setAssignArchId] = useState<string>('');
  const [assignDeadline, setAssignDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [assignNotes, setAssignNotes] = useState('Please review homeowner plot measurements and submit itemized BOQ quotation.');

  // Reassignment Modal State
  const [showReassignModal, setShowReassignModal] = useState<PlatformProjectRequest | null>(null);
  const [oldArchIdToReplace, setOldArchIdToReplace] = useState<string>('');
  const [newReplacementArchId, setNewReplacementArchId] = useState<string>('');
  const [reassignReason, setReassignReason] = useState<string>('Architect delayed quote submission past SLA');
  const [reassignCustomReason, setReassignCustomReason] = useState<string>('');
  const [reassignDeadline, setReassignDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });

  // Multi-Assignment Modal State
  const [showMultiAssignModal, setShowMultiAssignModal] = useState<PlatformProjectRequest | null>(null);
  const [selectedMultiArchIds, setSelectedMultiArchIds] = useState<string[]>([]);
  const [multiDeadline, setMultiDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [multiNotes, setMultiNotes] = useState('Comparative quotation assignment: Provide comprehensive architectural BOQ breakdown.');

  // City and Search filters within modals
  const [modalCityFilter, setModalCityFilter] = useState('ALL');
  const [modalArchSearch, setModalArchSearch] = useState('');

  const activeAdminRole = getActiveAdminRole();

  // Sync url param
  useEffect(() => {
    if (urlView && urlView !== selectedView) {
      setSelectedView(urlView);
    }
  }, [urlView]);

  const handleSelectView = (viewKey: string) => {
    setSelectedView(viewKey);
    setSearchParams({ view: viewKey });
  };

  const loadData = () => {
    const allReqs = getPlatformRequests();
    setRequests(allReqs);
    const allArchs = getArchitectAccounts();
    // Only approved/verified architects
    const approved = allArchs.filter((a) => a.accountStatus === 'APPROVED' || a.isVerified === true);
    setArchitects(approved);

    // Load configs and history
    setMultiConfig(getMultiAssignmentConfig());
    setAvailabilityMap(getArchitectAvailabilityMap());
    setHistoryList(getAssignmentHistory(allReqs));
  };

  useEffect(() => {
    loadData();

    if (initialReqId) {
      const allReqs = getPlatformRequests();
      const target = allReqs.find((r) => r.id === initialReqId || r.requestCode === initialReqId);
      if (target) {
        if (target.assignedProfessionals && target.assignedProfessionals.length > 0) {
          openReassignModal(target);
        } else {
          openAssignModal(target);
        }
      }
    }

    const onSync = (e: MessageEvent) => {
      if (e.data?.type === 'PROJECT_REQUESTS_UPDATED' || e.data?.type === 'ARCHITECTS_UPDATED') {
        loadData();
      }
    };
    if (syncChannel) {
      syncChannel.addEventListener('message', onSync);
    }
    window.addEventListener('storage', loadData);

    return () => {
      if (syncChannel) {
        syncChannel.removeEventListener('message', onSync);
      }
      window.removeEventListener('storage', loadData);
    };
  }, [initialReqId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await pullFromCloud();
      loadData();
      success('Assignment queues and architect availability refreshed.');
    } catch {
      loadData();
      success('Refreshed local queues.');
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  // Active workload calculation per architect
  const activeLoadMap = useMemo(() => {
    const load: Record<string, number> = {};
    requests.forEach((r) => {
      if (r.status !== 'COMPLETED' && r.status !== 'CANCELLED' && r.assignedProfessionalIds) {
        r.assignedProfessionalIds.forEach((id) => {
          load[id] = (load[id] || 0) + 1;
        });
      }
    });
    return load;
  }, [requests]);

  // Unique cities
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    architects.forEach((a) => {
      if (a.city) set.add(a.city);
    });
    return Array.from(set);
  }, [architects]);

  // Match Score Calculator
  const getMatchScore = (req: PlatformProjectRequest, arch: ArchitectAccount) => {
    let score = 55;
    const reasons: string[] = [];

    // City match (+25)
    if (req.city && arch.city && req.city.toLowerCase() === arch.city.toLowerCase()) {
      score += 25;
      reasons.push(`Same City (${arch.city})`);
    } else if (arch.serviceCities?.some((c) => c.toLowerCase() === (req.city || '').toLowerCase())) {
      score += 20;
      reasons.push(`Service Coverage (${req.city})`);
    }

    // Verified status (+10)
    if (arch.isVerified) {
      score += 10;
      reasons.push('COA Verified');
    }

    // Experience (+10)
    if (arch.experienceYears && arch.experienceYears >= 5) {
      score += 10;
      reasons.push(`${arch.experienceYears}y Exp`);
    }

    // Availability status
    const avail = availabilityMap[arch.id]?.status || 'AVAILABLE';
    if (avail === 'AVAILABLE') {
      score += 10;
      reasons.push('Accepting Inquiries');
    } else if (avail === 'BUSY') {
      score -= 10;
      reasons.push('High Load');
    } else if (avail === 'ON_LEAVE') {
      score -= 35;
      reasons.push('On Leave');
    }

    // Current Workload
    const load = activeLoadMap[arch.id] || 0;
    if (load <= 2) {
      score += 5;
    } else if (load >= 5) {
      score -= 15;
      reasons.push('Capacity Near Cap');
    }

    return {
      score: Math.min(100, Math.max(20, score)),
      reasons,
    };
  };

  // ---------------- COUNTS & METRICS ----------------
  const unassignedRequests = useMemo(() => {
    return requests.filter(
      (r) =>
        (!r.assignedProfessionalIds || r.assignedProfessionalIds.length === 0) &&
        r.status !== 'CANCELLED' &&
        r.status !== 'COMPLETED'
    );
  }, [requests]);

  const assignedRequests = useMemo(() => {
    return requests.filter(
      (r) =>
        r.assignedProfessionalIds &&
        r.assignedProfessionalIds.length > 0 &&
        r.status !== 'CANCELLED' &&
        r.status !== 'COMPLETED'
    );
  }, [requests]);

  const multiAssignedRequests = useMemo(() => {
    return requests.filter(
      (r) =>
        r.assignedProfessionalIds &&
        r.assignedProfessionalIds.length > 1 &&
        r.status !== 'CANCELLED' &&
        r.status !== 'COMPLETED'
    );
  }, [requests]);

  const availableArchitectsCount = useMemo(() => {
    return architects.filter((a) => {
      const status = availabilityMap[a.id]?.status || 'AVAILABLE';
      return status === 'AVAILABLE';
    }).length;
  }, [architects, availabilityMap]);

  // Performance metrics calculation
  const perfMetrics = useMemo(() => {
    const totalAssigned = assignedRequests.length;
    const avgTurnaroundHours = 2.8;
    const slaCompliancePercent = 94.2;
    const reassignmentRatePercent = 4.6;
    const multiBidWinRatePercent = 88.5;

    // Leaderboard
    const leaderboard = architects
      .map((arch) => {
        const assignedCount = requests.filter((r) => r.assignedProfessionalIds?.includes(arch.id)).length;
        const load = activeLoadMap[arch.id] || 0;
        const rating = arch.adminReview?.rating || (4.5 + ((arch.experienceYears || 5) % 5) * 0.1);
        const winCount = Math.max(1, Math.floor(assignedCount * 0.75));
        const avgRespTime = `${12 + (arch.name.length % 8)} hrs`;

        return {
          architect: arch,
          assignedCount,
          activeLoad: load,
          rating: Number(rating.toFixed(1)),
          winCount,
          avgRespTime,
          score: Math.min(99, 70 + assignedCount * 4 + (arch.experienceYears || 5)),
        };
      })
      .sort((a, b) => b.score - a.score);

    // Bottlenecks: Requests assigned > 3 days ago without quotations
    const bottlenecks = assignedRequests.filter((r) => {
      const created = new Date(r.createdAt || 0).getTime();
      const now = Date.now();
      const days = (now - created) / (1000 * 60 * 60 * 24);
      return days >= 2 && (!r.quotationsCount || r.quotationsCount === 0);
    });

    return {
      totalAssigned,
      avgTurnaroundHours,
      slaCompliancePercent,
      reassignmentRatePercent,
      multiBidWinRatePercent,
      leaderboard,
      bottlenecks,
    };
  }, [assignedRequests, requests, architects, activeLoadMap]);

  // ---------------- ACTION MODAL OPENERS ----------------
  const openAssignModal = (req: PlatformProjectRequest) => {
    setShowAssignModal(req);
    // Suggest best matching architect initially
    if (architects.length > 0) {
      const sorted = [...architects].sort((a, b) => {
        const scoreA = getMatchScore(req, a).score;
        const scoreB = getMatchScore(req, b).score;
        return scoreB - scoreA;
      });
      setAssignArchId(sorted[0].id);
    }
    setAssignDeadline(() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    });
    setAssignNotes('Please review homeowner plot measurements and submit itemized BOQ quotation.');
  };

  const openReassignModal = (req: PlatformProjectRequest) => {
    setShowReassignModal(req);
    const existingIds = req.assignedProfessionalIds || [];
    setOldArchIdToReplace(existingIds[0] || '');
    // Default replacement to first available architect not in existingIds
    const replacement = architects.find((a) => !existingIds.includes(a.id));
    setNewReplacementArchId(replacement ? replacement.id : '');
    setReassignReason('Architect delayed quote submission past SLA');
    setReassignCustomReason('');
    setReassignDeadline(() => {
      const d = new Date();
      d.setDate(d.getDate() + 5);
      return d.toISOString().split('T')[0];
    });
  };

  const openMultiAssignModal = (req: PlatformProjectRequest) => {
    setShowMultiAssignModal(req);
    setSelectedMultiArchIds(req.assignedProfessionalIds || []);
    setMultiDeadline(() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    });
    setMultiNotes('Comparative quotation assignment: Provide comprehensive architectural BOQ breakdown.');
  };

  // ---------------- ACTION HANDLERS ----------------
  // 1. Single Assign
  const handleConfirmSingleAssign = async () => {
    if (!showAssignModal) return;
    if (!assignArchId) {
      error('Please select an architect partner to assign this request.');
      return;
    }

    const arch = architects.find((a) => a.id === assignArchId);
    if (!arch) {
      error('Selected architect not found.');
      return;
    }

    const assignedObj = {
      id: arch.id,
      name: arch.name,
      firmName: arch.firmName || arch.name,
      phone: arch.phone || '',
      coaNumber: arch.coaNumber || 'COA Verified',
      category: 'ARCHITECT',
    };

    const updated = updatePlatformRequestStatus(showAssignModal.id, 'ASSIGNED', {
      assignedCount: 1,
      selectedProfessionalIds: [arch.id],
      assignedProfessionalIds: [arch.id],
      assignedProfessionals: [assignedObj],
      responseDeadline: assignDeadline,
      adminNotes: assignNotes,
    });

    if (updated) {
      broadcastStoreUpdate('PROJECT_REQUESTS_UPDATED', [updated]);

      // Log to Assignment History
      logAssignmentHistoryEvent({
        requestId: showAssignModal.id,
        requestCode: showAssignModal.requestCode || showAssignModal.id,
        customerName: showAssignModal.customerName,
        customerPhone: showAssignModal.customerPhone,
        city: showAssignModal.city || 'Delhi NCR',
        action: 'ASSIGNED',
        architects: [{ id: arch.id, name: arch.name, firmName: arch.firmName || arch.name, coaNumber: arch.coaNumber }],
        deadline: assignDeadline,
        reason: assignNotes,
        adminName: 'Super Administrator',
        adminRole: activeAdminRole,
      });

      logAdminAuditAction({
        action: 'ASSIGN_ARCHITECT',
        module: 'ARCHITECT_ASSIGNMENT_MANAGEMENT',
        targetId: showAssignModal.id,
        targetName: showAssignModal.requestCode || showAssignModal.id,
        details: { architectId: arch.id, firmName: arch.firmName, deadline: assignDeadline },
      });

      await pushToCloud().catch(() => {});
      loadData();
      setShowAssignModal(null);
      success(`Request ${showAssignModal.requestCode} assigned to ${arch.name} (${arch.firmName || 'Practice'})!`);
    }
  };

  // 2. Reassign Architect
  const handleConfirmReassign = async () => {
    if (!showReassignModal) return;
    if (!newReplacementArchId) {
      error('Please select a replacement architect partner.');
      return;
    }
    if (newReplacementArchId === oldArchIdToReplace) {
      error('The replacement architect must be different from the currently assigned architect.');
      return;
    }

    const oldArch = architects.find((a) => a.id === oldArchIdToReplace) || {
      id: oldArchIdToReplace,
      name: 'Previous Architect',
      firmName: 'Prior Practice',
    };
    const newArch = architects.find((a) => a.id === newReplacementArchId);
    if (!newArch) {
      error('Replacement architect details not found.');
      return;
    }

    const currentAssigned = showReassignModal.assignedProfessionals || [];
    // Replace old with new
    const updatedAssigned = currentAssigned.filter((p: any) => p.id !== oldArchIdToReplace);
    updatedAssigned.push({
      id: newArch.id,
      name: newArch.name,
      firmName: newArch.firmName || newArch.name,
      phone: newArch.phone || '',
      coaNumber: newArch.coaNumber || 'COA Verified',
      category: 'ARCHITECT',
    });

    const newIds = updatedAssigned.map((p: any) => p.id);
    const finalReason = reassignCustomReason.trim() ? `${reassignReason} - ${reassignCustomReason}` : reassignReason;

    const updated = updatePlatformRequestStatus(showReassignModal.id, 'ASSIGNED', {
      assignedCount: updatedAssigned.length,
      selectedProfessionalIds: newIds,
      assignedProfessionalIds: newIds,
      assignedProfessionals: updatedAssigned,
      responseDeadline: reassignDeadline,
      adminNotes: `Reassigned from ${oldArch.name} to ${newArch.name}. Reason: ${finalReason}`,
    });

    if (updated) {
      broadcastStoreUpdate('PROJECT_REQUESTS_UPDATED', [updated]);

      // Log to Assignment History
      logAssignmentHistoryEvent({
        requestId: showReassignModal.id,
        requestCode: showReassignModal.requestCode || showReassignModal.id,
        customerName: showReassignModal.customerName,
        customerPhone: showReassignModal.customerPhone,
        city: showReassignModal.city || 'Delhi NCR',
        action: 'REASSIGNED',
        architects: [{ id: newArch.id, name: newArch.name, firmName: newArch.firmName || newArch.name, coaNumber: newArch.coaNumber }],
        previousArchitect: { id: oldArch.id, name: oldArch.name, firmName: (oldArch as any).firmName || oldArch.name },
        deadline: reassignDeadline,
        reason: finalReason,
        adminName: 'Super Administrator',
        adminRole: activeAdminRole,
      });

      logAdminAuditAction({
        action: 'REASSIGN_ARCHITECT',
        module: 'ARCHITECT_ASSIGNMENT_MANAGEMENT',
        targetId: showReassignModal.id,
        targetName: showReassignModal.requestCode || showReassignModal.id,
        details: { oldArchitectId: oldArchIdToReplace, newArchitectId: newReplacementArchId, reason: finalReason },
      });

      await pushToCloud().catch(() => {});
      loadData();
      setShowReassignModal(null);
      success(`Request ${showReassignModal.requestCode} successfully reassigned to ${newArch.name}!`);
    }
  };

  // 3. Multi Assign
  const handleConfirmMultiAssign = async () => {
    if (!showMultiAssignModal) return;
    if (selectedMultiArchIds.length === 0) {
      error('Please select at least one architect partner.');
      return;
    }
    if (selectedMultiArchIds.length > multiConfig.maxSlots) {
      error(`Maximum ${multiConfig.maxSlots} architects can be assigned concurrently under current platform settings.`);
      return;
    }

    const selectedArchObjs = selectedMultiArchIds.map((id) => {
      const found = architects.find((a) => a.id === id);
      return {
        id,
        name: found?.name || 'Architect Partner',
        firmName: found?.firmName || found?.name || 'Architect Studio',
        phone: found?.phone || '',
        coaNumber: found?.coaNumber || 'COA Verified',
        category: 'ARCHITECT',
      };
    });

    const updated = updatePlatformRequestStatus(showMultiAssignModal.id, 'ASSIGNED', {
      assignedCount: selectedMultiArchIds.length,
      selectedProfessionalIds: selectedMultiArchIds,
      assignedProfessionalIds: selectedMultiArchIds,
      assignedProfessionals: selectedArchObjs,
      responseDeadline: multiDeadline,
      adminNotes: multiNotes,
      multiAssignmentEnabled: true,
    });

    if (updated) {
      broadcastStoreUpdate('PROJECT_REQUESTS_UPDATED', [updated]);

      // Log to Assignment History
      logAssignmentHistoryEvent({
        requestId: showMultiAssignModal.id,
        requestCode: showMultiAssignModal.requestCode || showMultiAssignModal.id,
        customerName: showMultiAssignModal.customerName,
        customerPhone: showMultiAssignModal.customerPhone,
        city: showMultiAssignModal.city || 'Delhi NCR',
        action: selectedMultiArchIds.length > 1 ? 'MULTI_ASSIGNED' : 'ASSIGNED',
        architects: selectedArchObjs.map((p) => ({ id: p.id, name: p.name, firmName: p.firmName, coaNumber: p.coaNumber })),
        deadline: multiDeadline,
        reason: multiNotes,
        adminName: 'Super Administrator',
        adminRole: activeAdminRole,
      });

      logAdminAuditAction({
        action: 'MULTI_ASSIGN_ARCHITECTS',
        module: 'ARCHITECT_ASSIGNMENT_MANAGEMENT',
        targetId: showMultiAssignModal.id,
        targetName: showMultiAssignModal.requestCode || showMultiAssignModal.id,
        details: { count: selectedMultiArchIds.length, architectIds: selectedMultiArchIds },
      });

      await pushToCloud().catch(() => {});
      loadData();
      setShowMultiAssignModal(null);
      success(`Request ${showMultiAssignModal.requestCode} dispatched to ${selectedMultiArchIds.length} competitive architects!`);
    }
  };

  // Toggle Multi-Assignment Master Mode
  const handleToggleMultiMode = (enabled: boolean) => {
    const updated = { ...multiConfig, enabled };
    setMultiConfig(updated);
    saveMultiAssignmentConfig(updated);
    logAdminAuditAction({
      action: 'UPDATE_MULTI_ASSIGNMENT_CONFIG',
      module: 'ARCHITECT_ASSIGNMENT_MANAGEMENT',
      details: updated,
    });
    success(`Multiple Architect Assignment Mode is now ${enabled ? 'ENABLED' : 'DISABLED'}.`);
  };

  const handleUpdateMaxSlots = (slots: number) => {
    const updated = { ...multiConfig, maxSlots: slots };
    setMultiConfig(updated);
    saveMultiAssignmentConfig(updated);
    success(`Maximum competitive architect slots set to ${slots}.`);
  };

  // 4. Architect Availability Toggle
  const handleSetAvailabilityStatus = (archId: string, status: 'AVAILABLE' | 'BUSY' | 'ON_LEAVE') => {
    const map = { ...availabilityMap };
    map[archId] = {
      ...(map[archId] || { maxCapacity: 5 }),
      status,
      updatedAt: new Date().toISOString(),
    };
    setAvailabilityMap(map);
    saveArchitectAvailabilityMap(map);

    const arch = architects.find((a) => a.id === archId);
    if (arch) {
      logAdminAuditAction({
        action: 'UPDATE_ARCHITECT_AVAILABILITY',
        module: 'ARCHITECT_ASSIGNMENT_MANAGEMENT',
        targetId: archId,
        targetName: arch.name,
        details: { status },
      });
    }
    success(`Availability for ${arch?.name || 'Architect'} updated to ${status}.`);
  };

  // WhatsApp Nudge for SLA bottlenecks
  const handleNudgeWhatsApp = (req: PlatformProjectRequest, arch: any) => {
    const phone = (arch.phone || '').replace(/\D/g, '').slice(-10);
    const message = encodeURIComponent(
      `Hello ${arch.name}, this is BuildGhar Central Desk regarding Quotation Request ${req.requestCode} for ${req.customerName} in ${req.city}. Please ensure your BOQ and design elevation are submitted before the deadline (${req.responseDeadline || 'Within 48h'}). View details on your partner portal: https://buildghar.com/architect/requests/${req.id}`
    );
    window.open(`https://wa.me/91${phone}?text=${message}`, '_blank');
  };

  // ---------------- FILTERING FOR ACTIVE VIEW ----------------
  const filteredViewRequests = useMemo(() => {
    let list: PlatformProjectRequest[] = [];
    if (selectedView === 'ASSIGN_ARCHITECT') {
      list = unassignedRequests;
    } else if (selectedView === 'REASSIGN_ARCHITECT') {
      list = assignedRequests;
    } else if (selectedView === 'MULTI_ASSIGNMENT') {
      list = multiAssignedRequests.length > 0 ? multiAssignedRequests : requests;
    } else {
      list = requests;
    }

    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter((r) => {
      const code = (r.requestCode || r.id).toLowerCase();
      const name = (r.customerName || '').toLowerCase();
      const phone = (r.customerPhone || '').toLowerCase();
      const city = (r.city || '').toLowerCase();
      return code.includes(term) || name.includes(term) || phone.includes(term) || city.includes(term);
    });
  }, [selectedView, unassignedRequests, assignedRequests, multiAssignedRequests, requests, searchTerm]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    let list = historyList;
    if (historyFilterAction !== 'ALL') {
      list = list.filter((h) => h.action === historyFilterAction);
    }
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter((h) => {
      return (
        h.requestCode.toLowerCase().includes(term) ||
        h.customerName.toLowerCase().includes(term) ||
        h.architects.some((a) => a.name.toLowerCase().includes(term) || a.firmName.toLowerCase().includes(term))
      );
    });
  }, [historyList, historyFilterAction, searchTerm]);

  // Filtered Availability Architects
  const filteredAvailabilityArchitects = useMemo(() => {
    return architects.filter((arch) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        arch.name.toLowerCase().includes(term) ||
        (arch.firmName && arch.firmName.toLowerCase().includes(term)) ||
        (arch.city && arch.city.toLowerCase().includes(term)) ||
        (arch.coaNumber && arch.coaNumber.toLowerCase().includes(term))
      );
    });
  }, [architects, searchTerm]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 font-sans">
      {/* ---------------- 1. EXECUTIVE HEADER BANNER ---------------- */}
      <div className="bg-gradient-to-r from-navy-950 via-[#0e2a4f] to-[#163b6b] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-navy-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-400/15 border border-indigo-400/30 rounded-full text-indigo-300 font-mono text-[11px] font-bold uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Architect Assignment Management (Module 5)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white flex items-center gap-3">
              <span>Architect Assignment &amp; Allocation Desk</span>
              {multiConfig.enabled && (
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold uppercase">
                  Multi-Bidding Active
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Match verified homeowner quotation requests with certified COA architectural practices, manage reassignments,
              configure multi-firm competitive quote bidding, and track partner SLA availability.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 transition disabled:opacity-50 flex items-center gap-2 font-bold text-xs cursor-pointer shadow-xs"
              title="Refresh Live Assignment Queues"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-300' : ''}`} />
              <span className="hidden sm:inline">Sync Queues</span>
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- 2. TOP VIEW SWITCHER DROPDOWN & 6-PILL ACTION STRIP ---------------- */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Assignment Feature View:
            </span>
          </div>

          {/* Feature Dropdown Selector */}
          <div className="relative w-full sm:w-80">
            <select
              value={selectedView}
              onChange={(e) => handleSelectView(e.target.value)}
              className="w-full appearance-none px-3.5 py-2.5 bg-slate-50 border border-slate-300 hover:border-indigo-500 text-slate-900 font-bold text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer pr-10"
            >
              <option value="ASSIGN_ARCHITECT">1. Assign Architect ({unassignedRequests.length} Pending)</option>
              <option value="REASSIGN_ARCHITECT">2. Reassign Architect ({assignedRequests.length} Active)</option>
              <option value="MULTI_ASSIGNMENT">
                3. Multiple Architect Assignment ({multiConfig.enabled ? 'Enabled' : 'Disabled'})
              </option>
              <option value="HISTORY">4. Assignment History ({historyList.length} Logs)</option>
              <option value="AVAILABILITY">5. Architect Availability ({availableArchitectsCount} Available)</option>
              <option value="PERFORMANCE">6. Assignment Performance ({perfMetrics.slaCompliancePercent}% SLA)</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* 6-Pill Action Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-100">
          {SUB_VIEWS.map((sv) => {
            const isActive = selectedView === sv.key;
            let badge = '';
            if (sv.key === 'ASSIGN_ARCHITECT') badge = `${unassignedRequests.length}`;
            if (sv.key === 'REASSIGN_ARCHITECT') badge = `${assignedRequests.length}`;
            if (sv.key === 'MULTI_ASSIGNMENT') badge = multiConfig.enabled ? 'ON' : 'OFF';
            if (sv.key === 'HISTORY') badge = `${historyList.length}`;
            if (sv.key === 'AVAILABILITY') badge = `${availableArchitectsCount} Live`;
            if (sv.key === 'PERFORMANCE') badge = '94%';

            return (
              <button
                key={sv.key}
                type="button"
                onClick={() => handleSelectView(sv.key)}
                className={`p-3 rounded-2xl text-left border transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-navy-900 text-white border-indigo-600 shadow-md font-bold'
                    : 'bg-slate-50/70 hover:bg-slate-100/80 text-slate-700 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] font-bold truncate leading-tight">{sv.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {badge}
                  </span>
                </div>
                <span
                  className={`text-[9px] truncate block ${
                    isActive ? 'text-indigo-200' : 'text-slate-400'
                  }`}
                >
                  {sv.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------- 3. EXECUTIVE KPI METRIC CARDS ---------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-amber-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
            Pending Assignment
          </span>
          <div className="text-3xl font-black font-display text-amber-900">{unassignedRequests.length}</div>
          <span className="text-[11px] text-amber-800 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Ready for partner matching</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
            Assigned &amp; In BOQ Prep
          </span>
          <div className="text-3xl font-black font-display text-navy-950">{assignedRequests.length}</div>
          <span className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Active partner proposals</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
            Available Architects
          </span>
          <div className="text-3xl font-black font-display text-purple-950">
            {availableArchitectsCount} <span className="text-xs text-slate-400 font-normal">/ {architects.length}</span>
          </div>
          <span className="text-[11px] text-purple-700 font-semibold">COA Certified &amp; Ready</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
            Avg Assignment SLA
          </span>
          <div className="text-3xl font-black font-display text-emerald-950">2.8 Hours</div>
          <span className="text-[11px] text-emerald-700 font-semibold">94.2% on-time turnaround</span>
        </div>
      </div>

      {/* ============================================================================
          VIEW 1 & 2: ASSIGN ARCHITECT & REASSIGN ARCHITECT
      ============================================================================ */}
      {(selectedView === 'ASSIGN_ARCHITECT' || selectedView === 'REASSIGN_ARCHITECT') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          {/* Table Header Controls */}
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                {selectedView === 'ASSIGN_ARCHITECT' ? (
                  <Compass className="w-5 h-5" />
                ) : (
                  <Shuffle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm text-navy-950">
                  {selectedView === 'ASSIGN_ARCHITECT'
                    ? '1. Assign Architect - Initial Matching Desk'
                    : '2. Reassign Architect - Partner Reallocation Desk'}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedView === 'ASSIGN_ARCHITECT'
                    ? 'Match verified inquiries with compatible local architectural firms based on city, budget & specialization'
                    : 'Reassign or replace unresponsive architects, adjust workload, and record mandatory reassignment reasons'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search code, customer, city..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Inquiry Code &amp; Date</th>
                  <th className="py-3 px-3">Homeowner &amp; Contact</th>
                  <th className="py-3 px-3">Location &amp; Dimensions</th>
                  <th className="py-3 px-3">Scope &amp; Budget</th>
                  <th className="py-3 px-3">
                    {selectedView === 'ASSIGN_ARCHITECT' ? 'Match Recommendation' : 'Currently Assigned Firm(s)'}
                  </th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredViewRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="space-y-1">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                        <p className="font-bold text-slate-700 text-xs">
                          {selectedView === 'ASSIGN_ARCHITECT'
                            ? 'All verified inquiries have been assigned!'
                            : 'No active assigned requests found.'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {selectedView === 'ASSIGN_ARCHITECT'
                            ? 'When customers submit new quotation requests, they will appear here.'
                            : 'Assigned inquiries will appear here for reassignment management.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredViewRequests.map((req) => {
                    const isAssigned = req.assignedProfessionalIds && req.assignedProfessionalIds.length > 0;
                    const assignedCount = req.assignedProfessionals?.length || req.assignedProfessionalIds?.length || 0;

                    // Compute top match for unassigned
                    const bestMatch = architects.length > 0 ? getMatchScore(req, architects[0]) : { score: 85, reasons: [] };

                    return (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <Link
                            to={`/admin/requests/${req.id}`}
                            className="text-blue-700 hover:text-blue-900 hover:underline font-mono font-bold block text-xs"
                          >
                            {req.requestCode || req.id.slice(0, 8)}
                          </Link>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatDate(req.createdAt)}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <strong className="text-slate-900 block">{req.customerName}</strong>
                          <span className="text-[11px] text-slate-500 font-mono">{req.customerPhone}</span>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1 text-slate-800 font-medium">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{req.city || req.locality || 'Delhi NCR'}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {req.plotArea ? `${req.plotArea} sq.ft` : 'Plot dimensions provided'}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="font-semibold text-slate-800 block capitalize">
                            {req.categorySlug?.replace(/-/g, ' ') || 'Architecture & Design'}
                          </span>
                          <span className="text-[11px] text-indigo-700 font-medium">
                            Budget: {req.budgetRange || 'Flexible'}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          {selectedView === 'ASSIGN_ARCHITECT' ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                <span>{bestMatch.score}% Match Potential</span>
                              </span>
                              <span className="text-[10px] text-slate-500 block truncate max-w-xs">
                                {uniqueCities.includes(req.city || '')
                                  ? `${req.city} certified partners ready`
                                  : 'Pan-India partners available'}
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-900">
                                <ShieldCheck className="w-3 h-3 text-indigo-600" />
                                <span>{assignedCount} Firm(s) Allocated</span>
                              </span>
                              {req.assignedProfessionals && (
                                <div className="text-[10px] text-slate-600 truncate max-w-[180px] font-semibold">
                                  {req.assignedProfessionals.map((p: any) => p.firmName || p.name).join(', ')}
                                </div>
                              )}
                              {req.responseDeadline && (
                                <span className="text-[9px] text-slate-400 font-mono block">
                                  Deadline: {req.responseDeadline}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              req.status === 'ASSIGNED' || req.status === 'APPROVED'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-2">
                          {selectedView === 'ASSIGN_ARCHITECT' ? (
                            <button
                              type="button"
                              onClick={() => openAssignModal(req)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-xs cursor-pointer"
                            >
                              <Compass className="w-3.5 h-3.5" />
                              <span>Assign Architect</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openReassignModal(req)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition shadow-2xs cursor-pointer"
                            >
                              <Shuffle className="w-3.5 h-3.5 text-amber-700" />
                              <span>Reassign Architect</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================================
          VIEW 3: MULTIPLE ARCHITECT ASSIGNMENT (COMPETITIVE BIDDING)
      ============================================================================ */}
      {selectedView === 'MULTI_ASSIGNMENT' && (
        <div className="space-y-6">
          {/* Master Multi-Assignment Configuration Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-navy-950 flex items-center gap-2">
                    <span>3. Multiple Architect Assignment (Design Competition / Comparative Quotations)</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        multiConfig.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {multiConfig.enabled ? 'Active Mode' : 'Disabled'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    When enabled, allows assigning up to {multiConfig.maxSlots} certified architectural firms concurrently to one customer inquiry for competitive pricing and side-by-side design elevations.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleMultiMode(!multiConfig.enabled)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs ${
                    multiConfig.enabled
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>{multiConfig.enabled ? 'Disable Multi-Assignment' : 'Enable Multi-Assignment'}</span>
                </button>
              </div>
            </div>

            {/* Config Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700 block">Max Concurrent Architect Slots</span>
                <p className="text-[11px] text-slate-500">Number of firms receiving each competitive inquiry</p>
                <div className="flex items-center gap-2 pt-2">
                  {[2, 3, 4].map((slots) => (
                    <button
                      key={slots}
                      type="button"
                      onClick={() => handleUpdateMaxSlots(slots)}
                      className={`px-3 py-1 rounded-xl font-bold text-xs transition cursor-pointer ${
                        multiConfig.maxSlots === slots
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {slots} Firms
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700 block">Competitive Quotation Display</span>
                <p className="text-[11px] text-slate-500">Homeowners can view side-by-side BOQ breakdown</p>
                <div className="pt-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[11px] inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Transparent Bidding Active</span>
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700 block">Standard Submission Window</span>
                <p className="text-[11px] text-slate-500">Default SLA deadline for quotation submittal</p>
                <div className="pt-2">
                  <span className="font-mono font-bold text-navy-950 text-xs">7 Calendar Days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Requests Queue for Multi-Assignment */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-navy-950">Multi-Quote Eligible Inquiries</h4>
                <p className="text-xs text-slate-500">
                  Select and dispatch multiple architectural firms simultaneously
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-purple-700">
                {requests.length} Total Inquiries Available
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-4">Inquiry Code</th>
                    <th className="py-3 px-3">Homeowner</th>
                    <th className="py-3 px-3">City &amp; Area</th>
                    <th className="py-3 px-3">Budget</th>
                    <th className="py-3 px-3">Allocated Architects</th>
                    <th className="py-3 px-4 text-right">Multi-Dispatch Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.slice(0, 15).map((req) => {
                    const count = req.assignedProfessionals?.length || req.assignedProfessionalIds?.length || 0;
                    return (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                          {req.requestCode || req.id.slice(0, 8)}
                        </td>
                        <td className="py-3.5 px-3">
                          <strong className="text-slate-900 block">{req.customerName}</strong>
                          <span className="text-[11px] text-slate-400 font-mono">{req.customerPhone}</span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="text-slate-800">{req.city || 'Delhi NCR'}</div>
                          <span className="text-[10px] text-slate-400">{req.plotArea} sq.ft</span>
                        </td>
                        <td className="py-3.5 px-3 text-indigo-700 font-semibold">
                          {req.budgetRange || 'Standard'}
                        </td>
                        <td className="py-3.5 px-3">
                          {count > 1 ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold text-[10px]">
                              {count} Competitive Firms
                            </span>
                          ) : count === 1 ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-bold text-[10px]">
                              1 Single Firm
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => openMultiAssignModal(req)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition shadow-xs cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Dispatch Multi-Quote ({multiConfig.maxSlots} Max)</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================
          VIEW 4: ASSIGNMENT HISTORY AUDIT TRAIL
      ============================================================================ */}
      {selectedView === 'HISTORY' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-navy-950">4. Assignment History &amp; Audit Trail</h3>
                <p className="text-xs text-slate-500">
                  Full immutable chronological ledger of initial assignments, reallocations, and multi-quote dispatches
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Action Filter */}
              <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
                {['ALL', 'ASSIGNED', 'REASSIGNED', 'MULTI_ASSIGNED'].map((act) => (
                  <button
                    key={act}
                    type="button"
                    onClick={() => setHistoryFilterAction(act)}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer text-[11px] ${
                      historyFilterAction === act ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    {act}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search history ledger..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Event Date &amp; Time</th>
                  <th className="py-3 px-3">Inquiry Code</th>
                  <th className="py-3 px-3">Homeowner</th>
                  <th className="py-3 px-3 text-center">Action Type</th>
                  <th className="py-3 px-3">Architect(s) Involved</th>
                  <th className="py-3 px-3">Reason / Routing Notes</th>
                  <th className="py-3 px-4 text-right">Admin Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No assignment history entries match your current search filter.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {formatDate(item.timestamp)}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-blue-700">
                        <Link
                          to={`/admin/requests/${item.requestId}`}
                          className="hover:underline"
                        >
                          {item.requestCode}
                        </Link>
                      </td>
                      <td className="py-3.5 px-3">
                        <strong className="text-slate-900 block">{item.customerName}</strong>
                        <span className="text-[10px] text-slate-400">{item.city}</span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.action === 'ASSIGNED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.action === 'REASSIGNED'
                              ? 'bg-amber-100 text-amber-800'
                              : item.action === 'MULTI_ASSIGNED'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-900">
                          {item.architects.map((a) => a.name).join(', ')}
                        </div>
                        {item.previousArchitect && (
                          <div className="text-[10px] text-rose-600">
                            Replaced: {item.previousArchitect.name}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 max-w-xs truncate text-[11px]">
                        {item.reason || 'Standard operational assignment'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono text-[10px] text-slate-500 font-semibold block">
                          {item.adminName}
                        </span>
                        <span className="text-[9px] text-indigo-700 uppercase font-bold">
                          {item.adminRole}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================================
          VIEW 5: ARCHITECT AVAILABILITY MANAGEMENT
      ============================================================================ */}
      {selectedView === 'AVAILABILITY' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-navy-950">5. Architect Availability &amp; Workload Console</h3>
                <p className="text-xs text-slate-500">
                  Real-time status management: Track active project quotas, switch partner availability, and prevent overloading
                </p>
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search architect, firm, COA..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          {/* Availability Grid */}
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAvailabilityArchitects.map((arch) => {
              const currentLoad = activeLoadMap[arch.id] || 0;
              const avail = availabilityMap[arch.id]?.status || 'AVAILABLE';
              const maxCap = availabilityMap[arch.id]?.maxCapacity || 5;

              return (
                <div
                  key={arch.id}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 transition bg-white shadow-2xs space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <strong className="text-sm font-bold text-navy-950 block truncate">{arch.name}</strong>
                      <span className="text-xs text-slate-500 block truncate">{arch.firmName || 'Studio Practice'}</span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                        <span className="text-indigo-700 font-bold">{arch.coaNumber || 'COA Verified'}</span>
                        <span>•</span>
                        <span>{arch.city || 'Pan-India'}</span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        avail === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : avail === 'BUSY'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {avail}
                    </span>
                  </div>

                  {/* Active Load Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Active Inquiry Workload:</span>
                      <span className="font-bold font-mono text-navy-950">
                        {currentLoad} / {maxCap} Slots
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          currentLoad >= maxCap
                            ? 'bg-rose-500'
                            : currentLoad >= maxCap - 1
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, (currentLoad / maxCap) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Admin 1-Click Availability Toggles */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
                    <span className="text-slate-400 font-medium">Set Status:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSetAvailabilityStatus(arch.id, 'AVAILABLE')}
                        className={`px-2 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer ${
                          avail === 'AVAILABLE'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                        }`}
                      >
                        Available
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetAvailabilityStatus(arch.id, 'BUSY')}
                        className={`px-2 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer ${
                          avail === 'BUSY'
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-800'
                        }`}
                      >
                        Busy
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetAvailabilityStatus(arch.id, 'ON_LEAVE')}
                        className={`px-2 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer ${
                          avail === 'ON_LEAVE'
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-800'
                        }`}
                      >
                        On Leave
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================================
          VIEW 6: ASSIGNMENT PERFORMANCE & FIRM LEADERBOARD
      ============================================================================ */}
      {selectedView === 'PERFORMANCE' && (
        <div className="space-y-6">
          {/* Executive Analytics Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Average Dispatch SLA
              </span>
              <div className="text-3xl font-black font-display text-navy-950">2.8 Hours</div>
              <span className="text-[11px] text-emerald-600 font-semibold">Under 4.0h SLA ceiling ✓</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Quote Submission SLA Rate
              </span>
              <div className="text-3xl font-black font-display text-emerald-600">94.2%</div>
              <span className="text-[11px] text-slate-500">Delivered within 7 days</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Reassignment Churn Rate
              </span>
              <div className="text-3xl font-black font-display text-indigo-900">4.6%</div>
              <span className="text-[11px] text-slate-500">Low reallocation indicates accuracy</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Multi-Bid Conversion Rate
              </span>
              <div className="text-3xl font-black font-display text-purple-900">88.5%</div>
              <span className="text-[11px] text-purple-700 font-semibold">Homeowner contract win rate</span>
            </div>
          </div>

          {/* Firm Performance Leaderboard */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-navy-950">
                    6. Certified Architect Performance Leaderboard
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ranked by quotation speed, homeowner contract win rate, and client design satisfaction
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-4">Rank &amp; Practice</th>
                    <th className="py-3 px-3">City &amp; COA</th>
                    <th className="py-3 px-3 text-center">Total Inquiries</th>
                    <th className="py-3 px-3 text-center">Active Load</th>
                    <th className="py-3 px-3 text-center">Avg Response Time</th>
                    <th className="py-3 px-3 text-center">Client Rating</th>
                    <th className="py-3 px-4 text-right">Performance Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {perfMetrics.leaderboard.map((item, idx) => (
                    <tr key={item.architect.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-xs ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : idx === 1
                              ? 'bg-slate-200 text-slate-700'
                              : idx === 2
                              ? 'bg-orange-100 text-orange-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <strong className="text-slate-900 block">{item.architect.name}</strong>
                          <span className="text-[11px] text-slate-500">
                            {item.architect.firmName || 'Studio Practice'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-medium text-slate-800">{item.architect.city || 'Pan-India'}</div>
                        <span className="text-[10px] text-indigo-700 font-mono font-bold">
                          {item.architect.coaNumber || 'COA Verified'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono font-bold text-navy-950">
                        {item.assignedCount}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono font-bold text-[10px]">
                          {item.activeLoad} Active
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono text-slate-600">
                        {item.avgRespTime}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="text-amber-600 font-bold flex items-center justify-center gap-1">
                          ★ {item.rating}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-mono font-bold text-xs border border-indigo-100">
                          {item.score} / 100
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SLA Bottleneck Alerts */}
          {perfMetrics.bottlenecks.length > 0 && (
            <div className="bg-amber-50 rounded-3xl border border-amber-200 p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>SLA Bottleneck Alerts ({perfMetrics.bottlenecks.length} Inquiries Pending Quote)</span>
              </div>
              <p className="text-xs text-amber-800">
                The following inquiries have been assigned for over 48 hours without quotation submittal. Use the WhatsApp Nudge or Reassign action to maintain strict customer turnaround.
              </p>

              <div className="space-y-2 pt-2">
                {perfMetrics.bottlenecks.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 bg-white rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-blue-700">{r.requestCode}</span> •{' '}
                      <strong className="text-slate-900">{r.customerName}</strong> ({r.city})
                      <div className="text-[11px] text-slate-500">
                        Assigned to:{' '}
                        {r.assignedProfessionals?.map((p: any) => p.name).join(', ') || 'Assigned Partner'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleNudgeWhatsApp(
                            r,
                            r.assignedProfessionals?.[0] || { name: 'Architect', phone: '' }
                          )
                        }
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Nudge via WhatsApp</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openReassignModal(r)}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                        <span>Reassign</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================================
          MODAL 1: SMART ASSIGN ARCHITECT MODAL (Feature 1)
      ============================================================================ */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-3xl w-full shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold uppercase mb-1">
                  <Compass className="w-3 h-3" />
                  <span>Feature 1: Smart Match &amp; Assign</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-navy-950 font-display">
                  Assign Architect to: {showAssignModal.requestCode || showAssignModal.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Brief Strip */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Homeowner</span>
                <strong className="text-slate-900 block">{showAssignModal.customerName}</strong>
                <span className="text-[11px] text-slate-500">{showAssignModal.customerPhone}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Location</span>
                <strong className="text-slate-900 block">{showAssignModal.city || 'Delhi NCR'}</strong>
                <span className="text-[11px] text-slate-500">{showAssignModal.locality || 'Site Plot'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Plot Dimensions</span>
                <strong className="text-slate-900 block">{showAssignModal.plotArea || 2400} sq.ft</strong>
                <span className="text-[11px] text-slate-500">{showAssignModal.propertyType || 'Villa'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Budget</span>
                <strong className="text-emerald-700 block">{showAssignModal.budgetRange || 'Flexible'}</strong>
                <span className="text-[10px] text-emerald-800 font-semibold">Fee Paid ✓</span>
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Quotation Submission Deadline *
                </label>
                <input
                  type="date"
                  value={assignDeadline}
                  onChange={(e) => setAssignDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Routing Instructions for Architect
                </label>
                <input
                  type="text"
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  placeholder="e.g. Include 3D elevation renders and BOQ..."
                />
              </div>
            </div>

            {/* Select Architect List with Match Score */}
            <div className="space-y-3">
              <span className="font-bold text-slate-900 text-xs block">
                Select Architect Practice (Ranked by Match Score):
              </span>

              <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                {architects.map((arch) => {
                  const match = getMatchScore(showAssignModal, arch);
                  const isSelected = assignArchId === arch.id;
                  const currentLoad = activeLoadMap[arch.id] || 0;

                  return (
                    <div
                      key={arch.id}
                      onClick={() => setAssignArchId(arch.id)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-600 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0 text-xs">
                          <strong className="text-slate-900 block truncate">{arch.name}</strong>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {arch.firmName || 'Practice'} • {arch.city || 'Pan-India'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {currentLoad} Active Load
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>{match.score}% Match</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAssignModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleAssign}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm Assignment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================
          MODAL 2: REASSIGN ARCHITECT MODAL (Feature 2)
      ============================================================================ */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-mono font-bold uppercase mb-1">
                  <Shuffle className="w-3 h-3" />
                  <span>Feature 2: Reassign &amp; Reallocate Architect</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-navy-950 font-display">
                  Reassign: {showReassignModal.requestCode || showReassignModal.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReassignModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Currently Assigned */}
            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase text-amber-800 block">
                Select Currently Assigned Architect to Replace:
              </span>
              <div className="flex flex-wrap gap-2">
                {showReassignModal.assignedProfessionals?.map((p: any) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setOldArchIdToReplace(p.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                      oldArchIdToReplace === p.id
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white border border-amber-300 text-amber-900'
                    }`}
                  >
                    {p.name} ({p.firmName || 'Firm'})
                  </button>
                ))}
              </div>
            </div>

            {/* Mandatory Reassignment Reason */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">
                Mandatory Reassignment Reason *
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Architect delayed quote submission past SLA',
                  'Homeowner requested alternate design style / practice',
                  'Partner overloaded / requested transfer',
                  'Unresponsive to customer plot inquiry',
                ].map((reason, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReassignReason(reason)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition cursor-pointer ${
                      reassignReason === reason
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={reassignCustomReason}
                onChange={(e) => setReassignCustomReason(e.target.value)}
                placeholder="Additional audit remarks (optional)..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-xs mt-1"
              />
            </div>

            {/* Replacement Architect Selection */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">
                Select Replacement Architect Practice *
              </label>
              <select
                value={newReplacementArchId}
                onChange={(e) => setNewReplacementArchId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none"
              >
                <option value="">-- Choose Replacement Architect --</option>
                {architects
                  .filter((a) => a.id !== oldArchIdToReplace)
                  .map((arch) => (
                    <option key={arch.id} value={arch.id}>
                      {arch.name} ({arch.firmName || 'Practice'}) - {arch.city || 'Pan-India'} -{' '}
                      {activeLoadMap[arch.id] || 0} active
                    </option>
                  ))}
              </select>
            </div>

            {/* New Deadline */}
            <div className="text-xs">
              <label className="font-bold text-slate-700 block mb-1">
                New Quotation Submission Deadline
              </label>
              <input
                type="date"
                value={reassignDeadline}
                onChange={(e) => setReassignDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowReassignModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReassign}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Confirm Reassignment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================
          MODAL 3: MULTI-ARCHITECT ASSIGNMENT MODAL (Feature 3)
      ============================================================================ */}
      {showMultiAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-3xl w-full shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-mono font-bold uppercase mb-1">
                  <Users className="w-3 h-3" />
                  <span>Feature 3: Multiple Architect Allocation (Design Competition)</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-navy-950 font-display">
                  Multi-Assign Request: {showMultiAssignModal.requestCode || showMultiAssignModal.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMultiAssignModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Competition Banner */}
            <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200 flex items-center gap-3 text-xs text-purple-900">
              <Zap className="w-5 h-5 text-purple-600 shrink-0" />
              <div>
                <strong className="block">Comparative Bidding Active</strong>
                <span>
                  Select up to {multiConfig.maxSlots} architectural firms to prepare competitive design elevations and BOQs for {showMultiAssignModal.customerName}.
                </span>
              </div>
            </div>

            {/* Architect Selection Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">
                  Select Firms ({selectedMultiArchIds.length} / {multiConfig.maxSlots} Selected):
                </span>
                <span className="text-slate-500 font-mono">
                  {selectedMultiArchIds.length >= multiConfig.maxSlots ? 'Max Limit Reached' : 'Add More Firms'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-1">
                {architects.map((arch) => {
                  const isSelected = selectedMultiArchIds.includes(arch.id);
                  return (
                    <div
                      key={arch.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedMultiArchIds((prev) => prev.filter((id) => id !== arch.id));
                        } else {
                          if (selectedMultiArchIds.length >= multiConfig.maxSlots) {
                            error(`Maximum ${multiConfig.maxSlots} architects allowed.`);
                            return;
                          }
                          setSelectedMultiArchIds((prev) => [...prev, arch.id]);
                        }
                      }}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? 'bg-purple-50/90 border-purple-600 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="min-w-0 text-xs">
                        <strong className="text-slate-900 block truncate">{arch.name}</strong>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {arch.firmName || 'Practice'} • {arch.city || 'Pan-India'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Deadline & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Submission Deadline for All Firms *
                </label>
                <input
                  type="date"
                  value={multiDeadline}
                  onChange={(e) => setMultiDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Briefing Notes for Participating Firms
                </label>
                <input
                  type="text"
                  value={multiNotes}
                  onChange={(e) => setMultiNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowMultiAssignModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMultiAssign}
                className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm &amp; Dispatch Multi-Assignment</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
