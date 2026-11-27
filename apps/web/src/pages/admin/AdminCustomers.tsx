import React, { useState, useEffect, useMemo } from 'react';
import { formatDate, formatINR } from '../../lib/utils.js';
import { useToast } from '../../context/ToastContext.js';
import {
  getRegisteredCustomers,
  RegisteredCustomer,
  updateCustomerStatus,
  updateCustomerDetails,
  addCustomerInternalNote,
  suspendCustomerAccount,
  restoreCustomerAccount,
  verifyCustomer,
  blockCustomerAccount,
  getCustomerActivityTimeline,
  CustomerActivityEvent,
  registerNewCustomer,
  getPlatformRequests,
  syncChannel,
} from '../../data/customerStore.js';
import { getExecutionProjects, ExecutionProject } from '../../data/projectExecutionStore.js';
import { getPlatformSupportTickets, PlatformSupportTicket } from '../../data/adminStore.js';
import { getComplaintDisputes, ComplaintDisputeItem } from '../../data/communicationDisputeStore.js';
import { logAdminAuditAction, getActiveAdminRole } from '../../data/adminRbacStore.js';
import { pullFromCloud, pushToCloud } from '../../data/cloudSync.js';
import {
  Search,
  Phone,
  Mail,
  MapPin,
  User,
  CheckCircle2,
  ShieldCheck,
  ShieldX,
  Eye,
  X,
  Building,
  Calendar,
  Sparkles,
  Filter,
  Package,
  CalendarCheck,
  FileText,
  FileCheck,
  ShoppingBag,
  CreditCard,
  Truck,
  UserPlus,
  ArrowLeft,
  ArrowRight,
  Check,
  RotateCcw,
  Edit,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  HelpCircle,
  Clock,
  StickyNote,
  History,
  DollarSign,
  Plus,
  Activity,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

export const AdminCustomers: React.FC = () => {
  const { success, error } = useToast();
  const [customers, setCustomers] = useState<RegisteredCustomer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'VERIFIED' | 'SUSPENDED' | 'BLOCKED'>('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<RegisteredCustomer | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<
    'OVERVIEW' | 'ACTIVITY' | 'REQUESTS' | 'PROJECTS' | 'ORDERS' | 'PAYMENTS' | 'COMPLAINTS' | 'NOTES'
  >('OVERVIEW');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addCustomerStep, setAddCustomerStep] = useState<number>(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('Compliance verification pending / suspicious inquiry pattern');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyForm, setVerifyForm] = useState<{
    verificationType: 'ADMIN_KYC' | 'MOBILE_OTP' | 'MANUAL_VERIFIED';
    notes: string;
    documentType: string;
    documentRefNumber: string;
  }>({
    verificationType: 'ADMIN_KYC',
    notes: '',
    documentType: '',
    documentRefNumber: '',
  });
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('Security risk / Policy violation');
  const [newNoteText, setNewNoteText] = useState('');

  // Edit Customer Form State
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    housePlotNumber: '',
    streetLocality: '',
    landmark: '',
    city: '',
    state: '',
    pinCode: '',
  });

  // New Customer Form State
  const [newCustForm, setNewCustForm] = useState({
    name: '',
    phone: '',
    email: '',
    housePlotNumber: '',
    streetLocality: '',
    city: 'Gurugram',
    state: 'Haryana',
    pinCode: '122002',
    status: 'VERIFIED' as 'ACTIVE' | 'VERIFIED',
  });

  const [refreshing, setRefreshing] = useState(false);
  const activeAdminRole = getActiveAdminRole();

  // Load dynamically from central customer store
  const refreshCustomers = (manual = false) => {
    const list = getRegisteredCustomers();
    setCustomers(list);
    if (selectedCustomer) {
      const updatedSel = list.find((c) => c.id === selectedCustomer.id);
      if (updatedSel) setSelectedCustomer(updatedSel);
    }
    if (manual) {
      success('Customer directory refreshed.');
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await pullFromCloud().catch(() => {});
    refreshCustomers(true);
    setRefreshing(false);
  };

  useEffect(() => {
    refreshCustomers();
    pullFromCloud().then(() => {
      refreshCustomers(false);
    }).catch(() => {});

    const interval = setInterval(() => {
      refreshCustomers(false);
    }, 60000);

    const onSync = (e: MessageEvent) => {
      if (
        e.data?.type === 'CUSTOMERS_UPDATED' ||
        e.data?.type === 'PROJECT_REQUESTS_UPDATED' ||
        e.data?.type === 'DATA_PURGED'
      ) {
        refreshCustomers(false);
      }
    };
    if (syncChannel) {
      syncChannel.addEventListener('message', onSync);
    }
    const handleStorageOrGlobal = () => refreshCustomers(false);
    window.addEventListener('storage', handleStorageOrGlobal);
    window.addEventListener('admin_global_refresh', handleStorageOrGlobal);

    return () => {
      clearInterval(interval);
      if (syncChannel) {
        syncChannel.removeEventListener('message', onSync);
      }
      window.removeEventListener('storage', handleStorageOrGlobal);
      window.removeEventListener('admin_global_refresh', handleStorageOrGlobal);
    };
  }, []);

  // Global stores for matching customer relationships
  const allOrders = useMemo(() => {
    try {
      const stored = localStorage.getItem('material_orders');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [customers]);

  const allBookings = useMemo(() => {
    try {
      const stored = localStorage.getItem('platform_bookings');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [customers]);

  const allRequests = useMemo(() => {
    try {
      return getPlatformRequests();
    } catch {
      return [];
    }
  }, [customers]);

  const allProjects = useMemo(() => {
    try {
      return getExecutionProjects();
    } catch {
      return [];
    }
  }, [customers]);

  const allTickets = useMemo(() => {
    try {
      return getPlatformSupportTickets();
    } catch {
      return [];
    }
  }, [customers]);

  const allDisputes = useMemo(() => {
    try {
      return getComplaintDisputes();
    } catch {
      return [];
    }
  }, [customers]);

  // Selected Customer Relationships
  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    const rawTargetPhone = (selectedCustomer.phone || '').replace(/\D/g, '').slice(-10);
    return allOrders.filter((o: any) => {
      const oPhone = (o.customerPhone || o.deliveryAddress?.phone || '').replace(/\D/g, '').slice(-10);
      return (
        o.customerId === selectedCustomer.id ||
        (rawTargetPhone && oPhone && oPhone === rawTargetPhone) ||
        (o.customerName && selectedCustomer.name && String(o.customerName).toLowerCase() === String(selectedCustomer.name).toLowerCase())
      );
    });
  }, [selectedCustomer, allOrders]);

  const customerRequests = useMemo(() => {
    if (!selectedCustomer) return [];
    const rawTargetPhone = (selectedCustomer.phone || '').replace(/\D/g, '').slice(-10);
    const isGenericName = !selectedCustomer.name || /^(registered homeowner|homeowner|customer|client|user)$/i.test(selectedCustomer.name.trim());
    return allRequests.filter((r: any) => {
      if (!r) return false;
      if (r.customerId && r.customerId === selectedCustomer.id) return true;
      const rPhone = (r.customerPhone || '').replace(/\D/g, '').slice(-10);
      if (rawTargetPhone.length === 10 && rPhone.length === 10 && rPhone === rawTargetPhone) return true;
      if (!isGenericName && r.customerName && selectedCustomer.name && String(r.customerName).trim().toLowerCase() === String(selectedCustomer.name).trim().toLowerCase()) {
        if (rawTargetPhone.length === 10 && rPhone.length === 10 && rPhone !== rawTargetPhone) return false;
        return true;
      }
      return false;
    });
  }, [selectedCustomer, allRequests]);

  const customerBookings = useMemo(() => {
    if (!selectedCustomer) return [];
    const rawTargetPhone = (selectedCustomer.phone || '').replace(/\D/g, '').slice(-10);
    return allBookings.filter((b: any) => {
      const bPhone = (b.customerPhone || '').replace(/\D/g, '').slice(-10);
      return (
        b.customerId === selectedCustomer.id ||
        (rawTargetPhone && bPhone && bPhone === rawTargetPhone) ||
        (b.customerName && selectedCustomer.name && String(b.customerName).toLowerCase() === String(selectedCustomer.name).toLowerCase())
      );
    });
  }, [selectedCustomer, allBookings]);

  const customerProjects = useMemo(() => {
    if (!selectedCustomer) return [];
    const rawTargetPhone = (selectedCustomer.phone || '').replace(/\D/g, '').slice(-10);
    return allProjects.filter((p: ExecutionProject) => {
      const pPhone = (p.customerPhone || '').replace(/\D/g, '').slice(-10);
      return (
        p.customerId === selectedCustomer.id ||
        (rawTargetPhone && pPhone && pPhone === rawTargetPhone) ||
        (p.customerName && selectedCustomer.name && String(p.customerName).toLowerCase() === String(selectedCustomer.name).toLowerCase())
      );
    });
  }, [selectedCustomer, allProjects]);

  const customerTickets = useMemo(() => {
    if (!selectedCustomer) return [];
    const rawTargetPhone = (selectedCustomer.phone || '').replace(/\D/g, '').slice(-10);
    return allTickets.filter((t: PlatformSupportTicket) => {
      const tPhone = (t.userPhone || '').replace(/\D/g, '').slice(-10);
      return (
        t.userId === selectedCustomer.id ||
        (rawTargetPhone && tPhone && tPhone === rawTargetPhone) ||
        (t.userName && selectedCustomer.name && String(t.userName).toLowerCase() === String(selectedCustomer.name).toLowerCase())
      );
    });
  }, [selectedCustomer, allTickets]);

  const customerDisputes = useMemo(() => {
    if (!selectedCustomer) return [];
    const rawTargetPhone = (selectedCustomer.phone || '').replace(/\D/g, '').slice(-10);
    return allDisputes.filter((d: any) => {
      const dPhone = (d.userPhone || d.complainantPhone || '').replace(/\D/g, '').slice(-10);
      return (
        d.customerId === selectedCustomer.id ||
        d.userId === selectedCustomer.id ||
        (rawTargetPhone && dPhone && dPhone === rawTargetPhone) ||
        (d.customerName && selectedCustomer.name && String(d.customerName).toLowerCase() === String(selectedCustomer.name).toLowerCase())
      );
    });
  }, [selectedCustomer, allDisputes]);

  const customerActivity = useMemo(() => {
    if (!selectedCustomer) return [];
    return getCustomerActivityTimeline(selectedCustomer.id, selectedCustomer.phone);
  }, [selectedCustomer, customers, allRequests, allProjects, allOrders, allTickets, allDisputes]);

  // Aggregate customer financial figures
  const customerFinancials = useMemo(() => {
    if (!selectedCustomer) return { totalPaidPaise: 0, outstandingPaise: 0 };
    // 1. Material Orders
    const materialPaidPaise = customerOrders.reduce((sum: number, o: any) => {
      return sum + (o.paymentStatus === 'PAID' || o.paymentStatus === 'PAYMENT_SUCCESSFUL' ? o.totalAmountPaise || 0 : 0);
    }, 0);
    // 2. Request Fees
    const requestFeesPaise = customerRequests.reduce((sum: number, r: any) => {
      return sum + (r.isFeePaid ? r.quoteFeePaise || 99900 : 0);
    }, 0);
    // 3. Project Milestones
    let projectPaidPaise = 0;
    let projectOutstandingPaise = 0;
    customerProjects.forEach((prj) => {
      if (Array.isArray(prj.milestones)) {
        prj.milestones.forEach((m) => {
          if (m.status === 'PAID' || m.paidAt) {
            projectPaidPaise += m.amountPaise || 0;
          } else if (m.status === 'SUBMITTED_FOR_REVIEW' || m.status === 'PAYMENT_DUE') {
            projectOutstandingPaise += m.amountPaise || 0;
          }
        });
      }
    });

    return {
      totalPaidPaise: materialPaidPaise + requestFeesPaise + projectPaidPaise,
      outstandingPaise: projectOutstandingPaise,
    };
  }, [selectedCustomer, customerOrders, customerRequests, customerProjects]);

  // Sync URL search params with selected customer
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const custId = params.get('id');
    if (custId && customers.length > 0) {
      const found = customers.find(
        (c) => c.id === custId || c.phone.replace(/\D/g, '').includes(custId.replace(/\D/g, ''))
      );
      if (found) {
        setSelectedCustomer(found);
      }
    }
  }, [customers]);

  const handleSelectCustomer = (c: RegisteredCustomer) => {
    setSelectedCustomer(c);
    setActiveProfileTab('OVERVIEW');
    try {
      window.history.pushState(null, '', `/admin/customers?id=${c.id}`);
    } catch (_) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearSelected = () => {
    setSelectedCustomer(null);
    try {
      window.history.pushState(null, '', '/admin/customers');
    } catch (_) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Status Change Handler with Audit Log
  const handleStatusChange = (id: string, newStatus: RegisteredCustomer['status']) => {
    const updated = updateCustomerStatus(id, newStatus);
    setCustomers(updated);
    if (selectedCustomer && selectedCustomer.id === id) {
      setSelectedCustomer({ ...selectedCustomer, status: newStatus });
    }
    logAdminAuditAction({
      action: 'UPDATE_CUSTOMER_STATUS',
      module: 'CUSTOMER_MANAGEMENT',
      targetId: id,
      targetName: selectedCustomer?.name || id,
      details: { previousStatus: selectedCustomer?.status, newStatus },
    });
    pushToCloud().catch(() => {});
    success(`Customer account status updated to ${newStatus}.`);
  };

  // Verify Customer 1-Click Action
  const handleVerifyCustomer = (cust: RegisteredCustomer) => {
    const updated = updateCustomerStatus(cust.id, 'VERIFIED');
    updateCustomerDetails(cust.id, { otpStatus: 'VERIFIED' });
    setCustomers(updated);
    if (selectedCustomer && selectedCustomer.id === cust.id) {
      setSelectedCustomer({ ...selectedCustomer, status: 'VERIFIED', otpStatus: 'VERIFIED' });
    }
    logAdminAuditAction({
      action: 'VERIFY_CUSTOMER_IDENTITY',
      module: 'CUSTOMER_MANAGEMENT',
      targetId: cust.id,
      targetName: cust.name,
      details: { verifiedAt: new Date().toISOString() },
    });
    pushToCloud().catch(() => {});
    success(`Customer ${cust.name} (${cust.id}) verified successfully!`);
  };

  // Open Edit Customer Modal
  const handleOpenEditModal = (c: RegisteredCustomer) => {
    setEditForm({
      name: c.name || '',
      phone: c.phone || '',
      email: c.email && c.email !== 'Not Provided' ? c.email : '',
      housePlotNumber: c.housePlotNumber || '',
      streetLocality: c.streetLocality || '',
      landmark: c.landmark || '',
      city: c.city || 'Gurugram',
      state: c.state || 'Haryana',
      pinCode: c.pinCode || '122002',
    });
    setShowEditModal(true);
  };

  // Save Customer Edit Details
  const handleSaveCustomerEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!editForm.name.trim()) {
      error('Customer full name is required');
      return;
    }
    const cleanPhone = editForm.phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      error('Please enter a valid 10-digit mobile number');
      return;
    }

    const updated = updateCustomerDetails(selectedCustomer.id, {
      name: editForm.name.trim(),
      phone: `+91 ${cleanPhone}`,
      email: editForm.email.trim() || 'Not Provided',
      housePlotNumber: editForm.housePlotNumber.trim(),
      streetLocality: editForm.streetLocality.trim(),
      landmark: editForm.landmark.trim(),
      city: editForm.city.trim(),
      state: editForm.state.trim(),
      pinCode: editForm.pinCode.trim(),
    });

    if (updated) {
      setSelectedCustomer(updated);
      refreshCustomers();
      logAdminAuditAction({
        action: 'EDIT_CUSTOMER_PROFILE',
        module: 'CUSTOMER_MANAGEMENT',
        targetId: selectedCustomer.id,
        targetName: updated.name,
        details: editForm,
      });
      pushToCloud().catch(() => {});
      setShowEditModal(false);
      success('Customer profile details updated successfully!');
    }
  };

  // Confirm Suspend with Reason
  const handleConfirmSuspend = () => {
    if (!selectedCustomer) return;
    if (!suspendReason.trim()) {
      error('Please provide a specific reason for account suspension');
      return;
    }
    const updated = suspendCustomerAccount(selectedCustomer.id, suspendReason.trim(), activeAdminRole);
    if (updated) {
      setSelectedCustomer(updated);
      refreshCustomers();
      logAdminAuditAction({
        action: 'SUSPEND_CUSTOMER_ACCOUNT',
        module: 'CUSTOMER_MANAGEMENT',
        targetId: selectedCustomer.id,
        targetName: selectedCustomer.name,
        details: { reason: suspendReason.trim() },
      });
      pushToCloud().catch(() => {});
      setShowSuspendModal(false);
      success(`Customer account suspended. Reason: ${suspendReason.trim()}`);
    }
  };

  // Confirm Block Customer Account
  const handleConfirmBlock = () => {
    if (!selectedCustomer) return;
    if (!blockReason.trim()) {
      error('Please provide a mandatory reason for blocking this customer');
      return;
    }
    const updated = blockCustomerAccount(selectedCustomer.id, blockReason.trim(), activeAdminRole);
    if (updated) {
      setSelectedCustomer(updated);
      refreshCustomers();
      logAdminAuditAction({
        action: 'BLOCK_CUSTOMER_ACCOUNT',
        module: 'CUSTOMER_MANAGEMENT',
        targetId: selectedCustomer.id,
        targetName: selectedCustomer.name,
        details: { reason: blockReason.trim() },
      });
      pushToCloud().catch(() => {});
      setShowBlockModal(false);
      success(`Customer account BLOCKED. All access revoked.`);
    }
  };

  // Confirm Verify Customer KYC
  const handleConfirmVerifyModal = () => {
    if (!selectedCustomer) return;
    const updated = verifyCustomer(selectedCustomer.id, {
      verifiedBy: activeAdminRole,
      verificationType: verifyForm.verificationType,
      notes: verifyForm.notes.trim() || undefined,
      documentType: verifyForm.documentType.trim() || undefined,
      documentRefNumber: verifyForm.documentRefNumber.trim() || undefined,
    });
    if (updated) {
      setSelectedCustomer(updated);
      refreshCustomers();
      logAdminAuditAction({
        action: 'VERIFY_CUSTOMER_KYC',
        module: 'CUSTOMER_MANAGEMENT',
        targetId: selectedCustomer.id,
        targetName: selectedCustomer.name,
        details: verifyForm,
      });
      pushToCloud().catch(() => {});
      setShowVerifyModal(false);
      success(`Customer ${updated.name} successfully verified!`);
    }
  };

  // Restore Suspended Customer
  const handleRestoreCustomer = () => {
    if (!selectedCustomer) return;
    const updated = restoreCustomerAccount(selectedCustomer.id, activeAdminRole);
    if (updated) {
      setSelectedCustomer(updated);
      refreshCustomers();
      logAdminAuditAction({
        action: 'RESTORE_CUSTOMER_ACCOUNT',
        module: 'CUSTOMER_MANAGEMENT',
        targetId: selectedCustomer.id,
        targetName: selectedCustomer.name,
      });
      pushToCloud().catch(() => {});
      success(`Customer account restored to ACTIVE.`);
    }
  };

  // Add Internal Staff Note
  const handleAddNote = () => {
    if (!selectedCustomer) return;
    if (!newNoteText.trim()) {
      error('Please enter an internal note');
      return;
    }
    const updated = addCustomerInternalNote(selectedCustomer.id, newNoteText.trim(), activeAdminRole);
    if (updated) {
      setSelectedCustomer(updated);
      refreshCustomers();
      logAdminAuditAction({
        action: 'ADD_CUSTOMER_INTERNAL_NOTE',
        module: 'CUSTOMER_MANAGEMENT',
        targetId: selectedCustomer.id,
        targetName: selectedCustomer.name,
        details: { note: newNoteText.trim() },
      });
      setNewNoteText('');
      success('Internal administrative note recorded.');
    }
  };

  // Create Customer Form Handler
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustForm.name.trim()) {
      error('Customer full name is required');
      return;
    }
    const cleanPhone = newCustForm.phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      error('Please enter a valid 10-digit mobile number');
      return;
    }
    const created = registerNewCustomer({
      name: newCustForm.name.trim(),
      phone: `+91 ${cleanPhone}`,
      email: newCustForm.email.trim() || 'Not Provided',
      housePlotNumber: newCustForm.housePlotNumber.trim() || 'Site Plot',
      streetLocality: newCustForm.streetLocality.trim() || 'Locality',
      city: newCustForm.city.trim() || 'Gurugram',
      state: newCustForm.state.trim() || 'Haryana',
      pinCode: newCustForm.pinCode.trim() || '122002',
      status: newCustForm.status,
    });
    refreshCustomers();
    logAdminAuditAction({
      action: 'CREATE_CUSTOMER_MANUAL',
      module: 'CUSTOMER_MANAGEMENT',
      targetId: created.id,
      targetName: created.name,
      details: { phone: created.phone, city: created.city },
    });
    pushToCloud().catch(() => {});
    setShowAddModal(false);
    setNewCustForm({
      name: '',
      phone: '',
      email: '',
      housePlotNumber: '',
      streetLocality: '',
      city: 'Gurugram',
      state: 'Haryana',
      pinCode: '122002',
      status: 'VERIFIED',
    });
    success(`Customer ${created.name} successfully created! ID: ${created.id}`);
  };

  const filtered = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(term) ||
      c.city.toLowerCase().includes(term) ||
      c.state.toLowerCase().includes(term) ||
      c.pinCode.includes(term) ||
      c.phone.includes(term) ||
      (c.id && c.id.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.registeredAt || 0).getTime() - new Date(a.registeredAt || 0).getTime());

  // =========================================================================
  // 1. FULL-PAGE CUSTOMER PROFILE VIEW (Section 6 Specification)
  // =========================================================================
  if (selectedCustomer) {
    return (
      <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150 admin-fullscreen-modal">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
        
        {/* Top Sticky Header */}
        <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              onClick={handleClearSelected}
              className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">Back to Customer Directory</span>
              <span className="sm:hidden">Back</span>
            </button>
            <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                {(selectedCustomer.name || 'CU').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    {selectedCustomer.name}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedCustomer.status === 'VERIFIED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : selectedCustomer.status === 'ACTIVE'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : selectedCustomer.status === 'BLOCKED'
                        ? 'bg-rose-900/60 text-rose-300 border border-rose-500/50'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {selectedCustomer.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono truncate">
                  Customer ID: {selectedCustomer.id} • {selectedCustomer.city}, {selectedCustomer.state} • {selectedCustomer.phone}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenEditModal(selectedCustomer)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Edit</span>
            </button>

            <button
              type="button"
              onClick={() => setShowVerifyModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Verify KYC & Identity Documents"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{selectedCustomer.status === 'VERIFIED' ? 'Re-verify' : 'Verify KYC'}</span>
            </button>

            {selectedCustomer.status === 'SUSPENDED' || selectedCustomer.status === 'BLOCKED' ? (
              <button
                type="button"
                onClick={handleRestoreCustomer}
                className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowSuspendModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Temporarily suspend account"
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Suspend</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBlockModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Permanently block account access"
                >
                  <ShieldX className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Block</span>
                </button>
              </>
            )}

            <button
              onClick={handleClearSelected}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Close Profile"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 max-w-[1400px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Customer Welcome Banner */}
          <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-[#1e3d6b] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gold-500/20 text-gold-400 border-2 border-gold-500/40 flex items-center justify-center font-bold text-2xl font-display shadow-lg">
                {(selectedCustomer.name || 'CU').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black font-display text-white">{selectedCustomer.name}</h1>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      selectedCustomer.status === 'VERIFIED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : selectedCustomer.status === 'ACTIVE'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        : selectedCustomer.status === 'BLOCKED'
                        ? 'bg-rose-900/60 text-rose-300 border-rose-500/50'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {selectedCustomer.status}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    OTP: {selectedCustomer.otpStatus || (selectedCustomer.status === 'VERIFIED' ? 'VERIFIED' : 'PENDING')}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-mono mt-1.5">
                  <span>Customer ID: {selectedCustomer.id}</span>
                  <span>•</span>
                  <span>Onboarded: {formatDate(selectedCustomer.registeredAt)}</span>
                  {selectedCustomer.verificationDetails?.isVerified && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-400 font-sans font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        KYC Verified ({selectedCustomer.verificationDetails.verificationType || 'ADMIN_KYC'})
                      </span>
                    </>
                  )}
                  {selectedCustomer.suspensionReason && (
                    <>
                      <span>•</span>
                      <span className="text-amber-400 font-sans">
                        Suspended: {selectedCustomer.suspensionReason}
                      </span>
                    </>
                  )}
                  {selectedCustomer.blockedReason && (
                    <>
                      <span>•</span>
                      <span className="text-rose-400 font-sans font-bold">
                        Blocked: {selectedCustomer.blockedReason}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 relative z-10">
              <a
                href={`tel:${selectedCustomer.phone}`}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition"
              >
                <Phone className="w-4 h-4" />
                <span>Call {selectedCustomer.phone}</span>
              </a>
              <a
                href={`https://wa.me/${selectedCustomer.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
              {selectedCustomer.email && (
                <a
                  href={`mailto:${selectedCustomer.email}`}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/20 transition"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Email</span>
                </a>
              )}
            </div>
          </div>

          {/* 4 Financial & Operational KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                Total Quotation RFQs
              </span>
              <div className="text-2xl font-black font-display text-blue-700 mt-1">
                {customerRequests.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Architecture & Design RFQs</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                Total Projects
              </span>
              <div className="text-2xl font-black font-display text-navy-950 mt-1">
                {customerProjects.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Turnkey Construction Sites</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                Total Customer Payments
              </span>
              <div className="text-2xl font-black font-display text-emerald-700 mt-1 truncate">
                {formatINR(customerFinancials.totalPaidPaise)}
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                Paid via Escrow & Gateway
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                Outstanding Balance
              </span>
              <div className="text-2xl font-black font-display text-amber-600 mt-1 truncate">
                {formatINR(customerFinancials.outstandingPaise)}
              </div>
              <div className="text-[11px] text-amber-700 mt-0.5">Pending milestone dues</div>
            </div>
          </div>

          {/* Tab Navigation Strip */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
            {[
              { id: 'OVERVIEW', label: 'Customer Overview', count: null },
              { id: 'ACTIVITY', label: 'Activity Timeline', count: customerActivity.length },
              { id: 'REQUESTS', label: 'Quotation RFQs', count: customerRequests.length },
              { id: 'PROJECTS', label: 'Active Projects', count: customerProjects.length },
              { id: 'ORDERS', label: 'Material Orders', count: customerOrders.length },
              { id: 'COMPLAINTS', label: 'Complaints & Disputes', count: customerTickets.length + customerDisputes.length },
              { id: 'NOTES', label: 'Internal Notes', count: selectedCustomer.internalNotes?.length || 0 },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveProfileTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeProfileTab === tab.id
                    ? 'bg-navy-950 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      activeProfileTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab 1: OVERVIEW */}
          {activeProfileTab === 'OVERVIEW' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (5 Cols) - Contact & Address Profile */}
              <div className="lg:col-span-5 space-y-6">
                {/* Contact Card */}
                <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-600" />
                      <span>Contact Details</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(selectedCustomer)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Primary Mobile</span>
                        <span className="font-bold text-navy-950 font-mono text-sm">{selectedCustomer.phone}</span>
                      </div>
                      <a
                        href={`tel:${selectedCustomer.phone}`}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call</span>
                      </a>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Email Address</span>
                        <span className="font-bold text-navy-950 truncate block text-xs">
                          {selectedCustomer.email || 'None'}
                        </span>
                      </div>
                      {selectedCustomer.email && (
                        <a
                          href={`mailto:${selectedCustomer.email}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition shrink-0"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Email</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Property & Site Address Card */}
                <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>Registered Property Address</span>
                    </h3>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Street & Plot</span>
                      <div className="font-bold text-slate-900 text-sm mt-0.5">
                        {selectedCustomer.housePlotNumber}, {selectedCustomer.streetLocality}
                      </div>
                    </div>

                    {selectedCustomer.landmark && (
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Landmark</span>
                        <div className="text-slate-600 font-medium">{selectedCustomer.landmark}</div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">City & State</span>
                        <div className="text-slate-800 font-bold">
                          {selectedCustomer.city}, {selectedCustomer.state} - {selectedCustomer.pinCode}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2.5 py-1 rounded-lg">
                        {selectedCustomer.city}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Verification & KYC Status Card */}
                <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>KYC & Verification Status</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowVerifyModal(true)}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{selectedCustomer.status === 'VERIFIED' ? 'Update KYC' : 'Verify KYC'}</span>
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Verification State</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {selectedCustomer.status === 'VERIFIED' ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span className="font-bold text-emerald-700">KYC Verified Customer</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 text-amber-600" />
                              <span className="font-bold text-amber-700">Verification Pending</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        selectedCustomer.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {selectedCustomer.verificationDetails?.verificationType || (selectedCustomer.status === 'VERIFIED' ? 'ADMIN_KYC' : 'UNVERIFIED')}
                      </span>
                    </div>

                    {selectedCustomer.verificationDetails?.verifiedAt && (
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400 font-semibold">Verified On:</span>
                          <span className="font-mono font-bold">{formatDate(selectedCustomer.verificationDetails.verifiedAt)}</span>
                        </div>
                        {selectedCustomer.verificationDetails.verifiedBy && (
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400 font-semibold">Verified By:</span>
                            <span className="font-bold text-navy-950">{selectedCustomer.verificationDetails.verifiedBy}</span>
                          </div>
                        )}
                        {selectedCustomer.verificationDetails.documentType && (
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400 font-semibold">Document:</span>
                            <span className="font-bold text-slate-900">{selectedCustomer.verificationDetails.documentType} {selectedCustomer.verificationDetails.documentRefNumber ? `(${selectedCustomer.verificationDetails.documentRefNumber})` : ''}</span>
                          </div>
                        )}
                        {selectedCustomer.verificationDetails.verificationNotes && (
                          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 italic">
                            "{selectedCustomer.verificationDetails.verificationNotes}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column (7 Cols) - Quick Summaries */}
              <div className="lg:col-span-7 space-y-6">
                {/* Recent Inquiries Quick Widget */}
                <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Recent Quotation Requests ({customerRequests.length})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveProfileTab('REQUESTS')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      View All →
                    </button>
                  </div>

                  {customerRequests.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                      No quotation requests submitted yet.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {customerRequests.slice(0, 3).map((req: any) => (
                        <div
                          key={req.id}
                          className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                        >
                          <div>
                            <strong className="text-navy-950 block">{req.requestCode || req.id}</strong>
                            <span className="text-slate-500 text-[11px]">
                              {req.categorySlug} • {req.plotArea ? `${req.plotArea} sq ft` : 'Site Plot'}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            {req.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Projects Quick Widget */}
                <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2">
                      <Building className="w-4 h-4 text-indigo-600" />
                      <span>Construction & Interior Projects ({customerProjects.length})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveProfileTab('PROJECTS')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      View All →
                    </button>
                  </div>

                  {customerProjects.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                      No active construction projects yet.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {customerProjects.slice(0, 3).map((prj) => (
                        <div
                          key={prj.id}
                          className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                        >
                          <div>
                            <strong className="text-navy-950 block">{prj.name}</strong>
                            <span className="text-slate-500 text-[11px]">
                              Budget: {formatINR(prj.budgetPaise)} • Progress: {prj.progressPercentage}%
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {prj.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab: ACTIVITY TIMELINE (Section 6 Specification) */}
          {activeProfileTab === 'ACTIVITY' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-navy-950 text-base font-display flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <span>Customer Activity & Operational Audit Timeline</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Unified chronological stream tracking registration, RFQ inquiries, escrow payments, site milestones, and disputes.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                  {customerActivity.length} Events Logged
                </span>
              </div>

              {customerActivity.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No activity events recorded yet for this customer.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {customerActivity.map((ev) => {
                    let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                    let dotColor = 'bg-blue-600 ring-blue-100';
                    let IconComponent = FileText;

                    if (ev.category === 'REGISTRATION') {
                      badgeColor = 'bg-sky-50 text-sky-700 border-sky-200';
                      dotColor = 'bg-sky-600 ring-sky-100';
                      IconComponent = UserPlus;
                    } else if (ev.category === 'PAYMENT') {
                      badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      dotColor = 'bg-emerald-600 ring-emerald-100';
                      IconComponent = DollarSign;
                    } else if (ev.category === 'PROJECT') {
                      badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                      dotColor = 'bg-indigo-600 ring-indigo-100';
                      IconComponent = Building;
                    } else if (ev.category === 'BOOKING') {
                      badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
                      dotColor = 'bg-purple-600 ring-purple-100';
                      IconComponent = CalendarCheck;
                    } else if (ev.category === 'ORDER') {
                      badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                      dotColor = 'bg-amber-600 ring-amber-100';
                      IconComponent = Package;
                    } else if (ev.category === 'COMPLAINT') {
                      badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                      dotColor = 'bg-rose-600 ring-rose-100';
                      IconComponent = AlertTriangle;
                    } else if (ev.category === 'STATUS_CHANGE') {
                      badgeColor = 'bg-slate-100 text-slate-800 border-slate-300';
                      dotColor = 'bg-slate-600 ring-slate-100';
                      IconComponent = ShieldAlert;
                    } else if (ev.category === 'ADMIN_NOTE') {
                      badgeColor = 'bg-slate-50 text-slate-700 border-slate-200';
                      dotColor = 'bg-slate-500 ring-slate-100';
                      IconComponent = StickyNote;
                    }

                    return (
                      <div key={ev.id} className="relative group">
                        <div className={`absolute -left-[30px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center ${dotColor} text-white shadow-xs ring-4`}>
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all text-xs space-y-1.5 shadow-2xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div className="flex items-center gap-2">
                              <strong className="text-slate-900 font-bold text-sm">{ev.title}</strong>
                              {ev.badge && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                                  {ev.badge}
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[11px] text-slate-500">
                              {formatDate(ev.timestamp)}
                            </span>
                          </div>

                          <p className="text-slate-600 leading-relaxed font-medium">{ev.description}</p>

                          {(ev.amountPaise || ev.referenceCode) && (
                            <div className="flex items-center gap-3 pt-1 border-t border-slate-200/60 font-mono text-[11px]">
                              {ev.referenceCode && (
                                <span className="text-blue-700 font-bold">Ref: {ev.referenceCode}</span>
                              )}
                              {ev.amountPaise && (
                                <span className="text-emerald-700 font-bold">Amount: {formatINR(ev.amountPaise)}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: REQUESTS */}
          {activeProfileTab === 'REQUESTS' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-navy-950">Submitted Quotation Requests ({customerRequests.length})</h3>
                <a href="/admin/requests" className="text-xs font-bold text-blue-600 hover:text-blue-800">
                  Open RFQ Desk →
                </a>
              </div>
              {customerRequests.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No quotation requests on record for this customer.
                </div>
              ) : (
                <div className="space-y-3">
                  {customerRequests.map((req: any) => (
                    <div
                      key={req.id}
                      className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3 shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-700 text-sm">
                              {req.requestCode || req.id}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
                              {req.categorySlug || 'Architecture & Design'}
                            </span>
                          </div>
                          <span className="text-slate-500 text-[11px] font-mono mt-0.5 block">
                            Submitted on {formatDate(req.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            req.status === 'APPROVED' || req.status === 'ASSIGNED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {req.status}
                          </span>
                          <a
                            href={`/admin/assignments?requestId=${req.id}`}
                            className="px-3 py-1 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-bold transition shadow-2xs inline-flex items-center gap-1"
                          >
                            <span>Assign Partner</span>
                            <ArrowRight className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      {/* Property & RFQ Specifications Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 text-[11px]">
                        <div>
                          <span className="text-slate-400 block font-semibold">Location / City</span>
                          <strong className="text-slate-900">{req.city || req.locality || 'Delhi NCR'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-semibold">Plot Dimensions</span>
                          <strong className="text-slate-900">
                            {req.plotWidth && req.plotLength
                              ? `${req.plotWidth} × ${req.plotLength} ${req.measurementUnit || 'ft'}`
                              : (req.plotArea ? `${req.plotArea} sq ft` : 'Custom Plot')}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-semibold">Budget Range</span>
                          <strong className="text-blue-700 font-bold">{req.budgetRange || 'Standard Tier'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-semibold">Design Consultation Fee</span>
                          <span className={`font-bold ${req.isFeePaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {req.isFeePaid ? `Paid (${formatINR(req.quoteFeePaise || 99900)})` : 'Pending Collection'}
                          </span>
                        </div>
                      </div>

                      {req.description && (
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          <span className="font-bold text-slate-700">Project Brief: </span>
                          {req.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: PROJECTS */}
          {activeProfileTab === 'PROJECTS' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-navy-950">Active & Completed Projects</h3>
              {customerProjects.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No construction sites linked to this customer yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {customerProjects.map((prj) => (
                    <div
                      key={prj.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <strong className="text-navy-950 block text-sm">{prj.name}</strong>
                        <span className="text-slate-500 text-[11px]">
                          Location: {prj.siteLocation?.city || 'Delhi NCR'} • Architect: {prj.architectName || 'Assigned Lead'}
                        </span>
                        <div className="text-blue-700 font-mono font-bold mt-1">
                          Budget: {formatINR(prj.budgetPaise)} • Progress: {prj.progressPercentage}%
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        {prj.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: ORDERS */}
          {activeProfileTab === 'ORDERS' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-navy-950">Building Materials Depot Orders</h3>
              {customerOrders.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No material purchases recorded for this customer.
                </div>
              ) : (
                <div className="space-y-3">
                  {customerOrders.map((ord: any) => (
                    <div
                      key={ord.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-navy-950">{ord.orderCode || ord.id}</span>
                        <div className="text-slate-600 font-medium mt-0.5">
                          {ord.items?.length || 1} material items purchased
                        </div>
                        <span className="text-emerald-700 font-mono font-bold block mt-1">
                          {formatINR(ord.totalAmountPaise)}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-200 text-slate-800">
                        {ord.fulfillmentStatus || 'PROCESSING'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 5: COMPLAINTS & DISPUTES (Section 6 Specification) */}
          {activeProfileTab === 'COMPLAINTS' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-navy-950">Customer Support Tickets & Centralized Disputes</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Aggregated grievance feed combining support tickets and active project milestone disputes.
                  </p>
                </div>
                <a href="/admin/support" className="text-xs font-bold text-rose-600 hover:text-rose-800">
                  Open Support Hub →
                </a>
              </div>

              {/* Sub-section A: Support Tickets */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Support Desk Tickets ({customerTickets.length})
                </span>
                {customerTickets.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                    No support tickets logged.
                  </div>
                ) : (
                  customerTickets.map((tkt) => (
                    <div
                      key={tkt.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-rose-700">{tkt.ticketCode}</span>
                        <strong className="text-slate-900 block mt-0.5">{tkt.subject}</strong>
                        <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-1">{tkt.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          {tkt.priority}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
                          {tkt.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Sub-section B: Project & Milestone Disputes */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Project Execution Disputes ({customerDisputes.length})
                </span>
                {customerDisputes.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                    No project execution disputes logged.
                  </div>
                ) : (
                  customerDisputes.map((d: any) => (
                    <div
                      key={d.id}
                      className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-800">{d.disputeCode || d.id}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                            {d.category || 'Quality Issue'}
                          </span>
                        </div>
                        <strong className="text-slate-900 block mt-0.5">{d.title || d.subject}</strong>
                        <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-1">{d.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
                          {d.status || 'PENDING'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 6: NOTES */}
          {activeProfileTab === 'NOTES' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div>
                <h3 className="font-bold text-sm text-navy-950">Administrative Internal Notes</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Internal notes are strictly confidential and visible only to authorized BuildGhar administrators.
                </p>
              </div>

              {/* Add Note Form */}
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Record internal verification note or customer preference..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="flex-1 px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={handleAddNote}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Note</span>
                </button>
              </div>

              {/* Notes List */}
              <div className="space-y-3">
                {(!selectedCustomer.internalNotes || selectedCustomer.internalNotes.length === 0) ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No internal notes recorded yet for this customer.
                  </div>
                ) : (
                  selectedCustomer.internalNotes.map((note) => (
                    <div key={note.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500 text-[10px]">
                        <span className="font-bold text-navy-950">{note.adminName}</span>
                        <span className="font-mono">{formatDate(note.createdAt)}</span>
                      </div>
                      <p className="text-slate-800 font-medium">{note.note}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal: Edit Customer Profile */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-navy-950 font-display">Edit Customer Profile</h3>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCustomerEdit} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Mobile Number</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">House / Plot #</label>
                    <input
                      type="text"
                      value={editForm.housePlotNumber}
                      onChange={(e) => setEditForm({ ...editForm, housePlotNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Street / Locality</label>
                    <input
                      type="text"
                      value={editForm.streetLocality}
                      onChange={(e) => setEditForm({ ...editForm, streetLocality: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">City</label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">State</label>
                    <input
                      type="text"
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">PIN Code</label>
                    <input
                      type="text"
                      value={editForm.pinCode}
                      onChange={(e) => setEditForm({ ...editForm, pinCode: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Suspend Customer Account */}
        {showSuspendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-navy-950 font-display">
                  Suspend Customer Account?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Suspension will restrict this customer from placing new RFQs or orders. Historical projects and payment records remain safely preserved.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 text-xs block mb-1">
                  Reason for Suspension (Mandatory for Audit Trail)
                </label>
                <textarea
                  rows={3}
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  placeholder="Enter specific audit reason..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSuspendModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSuspend}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition cursor-pointer"
                >
                  Confirm Suspension
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Block Customer Account (Section 6 Specification) */}
        {showBlockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <ShieldX className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-navy-950 font-display">
                  Block Customer Account?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Blocking permanently locks this customer out of BuildGhar. All active requests and quotations will be frozen.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 text-xs block mb-1">
                  Mandatory Audit Reason for Account Block
                </label>
                <textarea
                  rows={3}
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-600 focus:outline-none"
                  placeholder="Enter specific fraud/policy violation reason..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBlock}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-md transition cursor-pointer"
                >
                  Confirm Block Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Verify Customer Identity & KYC (Section 6 Specification) */}
        {showVerifyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-navy-950 font-display">Verify Customer Identity & KYC</h3>
                    <p className="text-xs text-slate-500">Confirm homeowner identity for verified status</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Verification Method</label>
                  <select
                    value={verifyForm.verificationType}
                    onChange={(e) => setVerifyForm({ ...verifyForm, verificationType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 font-semibold text-slate-800"
                  >
                    <option value="ADMIN_KYC">Admin KYC Audit (Official Documents Inspected)</option>
                    <option value="MOBILE_OTP">Mobile OTP Verified (Two-Factor Authentication)</option>
                    <option value="MANUAL_VERIFIED">Manual Homeowner Verification (Direct Consultation)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Supporting Document Type (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Aadhaar Card, Electricity Bill, Plot Registry, Property Tax Receipt"
                    value={verifyForm.documentType}
                    onChange={(e) => setVerifyForm({ ...verifyForm, documentType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Document Reference / ID # (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. •••• 9821 or REG/2026/0991"
                    value={verifyForm.documentRefNumber}
                    onChange={(e) => setVerifyForm({ ...verifyForm, documentRefNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Administrative Verification Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Identity matched phone & site ownership. Homeowner verified by Admin."
                    value={verifyForm.notes}
                    onChange={(e) => setVerifyForm({ ...verifyForm, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowVerifyModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmVerifyModal}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Mark Verified</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Counts for quick filter pills
  const activeCount = useMemo(() => customers.filter((c) => c.status === 'ACTIVE').length, [customers]);
  const verifiedCount = useMemo(() => customers.filter((c) => c.status === 'VERIFIED').length, [customers]);
  const suspendedCount = useMemo(() => customers.filter((c) => c.status === 'SUSPENDED').length, [customers]);
  const blockedCount = useMemo(() => customers.filter((c) => c.status === 'BLOCKED').length, [customers]);

  // =========================================================================
  // 2. MAIN CUSTOMER DIRECTORY TABLE (Section 6 Specification)
  // =========================================================================
  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Customer Management Directory
            </span>
          </div>
          <h1 className="text-2xl font-bold font-display text-navy-950 mt-1">
            Registered Customers ({customers.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized control desk for all homeowners registered via customer onboarding, site inquiries, and mobile OTP.
          </p>
        </div>

        {/* Filter and Search Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search name, phone, city, ID..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              <option value="ALL">All Statuses ({customers.length})</option>
              <option value="ACTIVE">Active ({activeCount})</option>
              <option value="VERIFIED">Verified ({verifiedCount})</option>
              <option value="SUSPENDED">Suspended ({suspendedCount})</option>
              <option value="BLOCKED">Blocked ({blockedCount})</option>
            </select>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs shrink-0"
            title="Auto-refreshes every 1 minute. Click to refresh immediately."
          >
            <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => {
              setAddCustomerStep(1);
              setShowAddModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Quick Status Filter Tabs Strip */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { label: 'All Customers', value: 'ALL', count: customers.length },
          { label: 'Active', value: 'ACTIVE', count: activeCount },
          { label: 'Verified KYC', value: 'VERIFIED', count: verifiedCount },
          { label: 'Suspended', value: 'SUSPENDED', count: suspendedCount },
          { label: 'Blocked', value: 'BLOCKED', count: blockedCount },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              statusFilter === tab.value
                ? 'bg-navy-950 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.2 rounded-full text-[10px] font-mono ${
                statusFilter === tab.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider font-display">
              <tr>
                <th className="p-4">Customer Details & ID</th>
                <th className="p-4">Location</th>
                <th className="p-4">Registered Date</th>
                <th className="p-4 text-center">OTP / KYC</th>
                <th className="p-4 text-center">Quotation RFQs</th>
                <th className="p-4 text-center">Active Projects</th>
                <th className="p-4 text-right">Total Payments</th>
                <th className="p-4 text-right">Outstanding</th>
                <th className="p-4 text-center">Account Status</th>
                <th className="p-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    <User className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-xs">No registered customers match your search criteria.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const rawPhone = c.phone.replace(/\D/g, '').slice(-10);
                  const isGenericName = !c.name || /^(registered homeowner|homeowner|customer|client|user)$/i.test(c.name.trim());
                  
                  const reqCount = allRequests.filter((r: any) => {
                    if (!r) return false;
                    if (r.customerId && r.customerId === c.id) return true;
                    const rPhone = (r.customerPhone || '').replace(/\D/g, '').slice(-10);
                    if (rawPhone.length === 10 && rPhone.length === 10 && rPhone === rawPhone) return true;
                    if (!isGenericName && r.customerName && c.name && String(r.customerName).trim().toLowerCase() === String(c.name).trim().toLowerCase()) {
                      return true;
                    }
                    return false;
                  }).length;

                  const custProjects = allProjects.filter((p: ExecutionProject) => {
                    const pPhone = (p.customerPhone || '').replace(/\D/g, '').slice(-10);
                    return p.customerId === c.id || (rawPhone && pPhone && pPhone === rawPhone);
                  });
                  const projCount = custProjects.length;

                  // Order payments
                  const custOrders = allOrders.filter((o: any) => {
                    const oPhone = (o.customerPhone || o.deliveryAddress?.phone || '').replace(/\D/g, '').slice(-10);
                    return o.customerId === c.id || (rawPhone && oPhone && oPhone === rawPhone);
                  });
                  const paidPaise = custOrders.reduce((sum: number, o: any) => {
                    return sum + (o.paymentStatus === 'PAID' || o.paymentStatus === 'PAYMENT_SUCCESSFUL' ? o.totalAmountPaise || 0 : 0);
                  }, 0);

                  // Calculate Outstanding Milestone Balance
                  let outstandingPaise = 0;
                  custProjects.forEach((prj) => {
                    if (Array.isArray(prj.milestones)) {
                      prj.milestones.forEach((m) => {
                        if (m.status === 'SUBMITTED_FOR_REVIEW' || m.status === 'PAYMENT_DUE' || (m.status === 'IN_PROGRESS' && !m.paidAt)) {
                          outstandingPaise += m.amountPaise || 0;
                        }
                      });
                    }
                  });

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      {/* Customer Details */}
                      <td className="p-4">
                        <div
                          onClick={() => handleSelectCustomer(c)}
                          className="cursor-pointer group"
                          title="Click to view full customer profile"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-navy-950 group-hover:text-blue-600 transition-colors text-xs font-display">
                              {c.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-sky-50 border border-sky-200 text-sky-800 font-mono text-[10px] font-bold">
                              {c.id}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 group-hover:text-slate-700 flex items-center gap-2 mt-0.5 font-mono">
                            <span className="font-semibold text-slate-700">{c.phone}</span>
                            {c.email && c.email !== 'Not Provided' && (
                              <>
                                <span>•</span>
                                <span className="text-slate-500 font-sans">{c.email}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="p-4 text-slate-700">
                        <div className="font-semibold text-xs flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{c.city}, {c.state}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[180px]">
                          {c.housePlotNumber}, {c.streetLocality} ({c.pinCode})
                        </div>
                      </td>

                      {/* Registration Date */}
                      <td className="p-4 text-slate-600 font-mono text-[11px]">
                        {formatDate(c.registeredAt)}
                      </td>

                      {/* OTP Status */}
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            c.status === 'VERIFIED' || c.otpStatus === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {c.status === 'VERIFIED' || c.otpStatus === 'VERIFIED' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Verified</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* RFQs Count */}
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                          <FileText className="w-3 h-3 text-blue-600" />
                          <span>{reqCount}</span>
                        </span>
                      </td>

                      {/* Projects Count */}
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-lg">
                          <Building className="w-3 h-3 text-indigo-600" />
                          <span>{projCount}</span>
                        </span>
                      </td>

                      {/* Total Payments */}
                      <td className="p-4 text-right font-mono font-bold text-slate-900">
                        {paidPaise > 0 ? formatINR(paidPaise) : '₹0'}
                      </td>

                      {/* Outstanding Balance */}
                      <td className="p-4 text-right font-mono font-bold">
                        <span className={outstandingPaise > 0 ? 'text-amber-700' : 'text-slate-400'}>
                          {outstandingPaise > 0 ? formatINR(outstandingPaise) : '₹0'}
                        </span>
                      </td>

                      {/* Account Status */}
                      <td className="p-4 text-center">
                        {c.status === 'VERIFIED' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                          </span>
                        ) : c.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                            <ShieldCheck className="w-3 h-3 text-blue-600" /> Active
                          </span>
                        ) : c.status === 'BLOCKED' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-900 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300">
                            <ShieldX className="w-3 h-3 text-rose-700" /> Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                            <AlertOctagon className="w-3 h-3 text-amber-600" /> Suspended
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleSelectCustomer(c)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-100 text-blue-900 font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer inline-flex items-center"
                          title="Edit Customer Details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Customer 3-Step Wizard */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-navy-950 font-display">Register New Customer</h3>
                <span className="text-xs text-slate-400">Step {addCustomerStep} of 3</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              {addCustomerStep === 1 && (
                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Customer Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={newCustForm.name}
                      onChange={(e) => setNewCustForm({ ...newCustForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">10-Digit Mobile Number *</label>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={newCustForm.phone}
                      onChange={(e) => setNewCustForm({ ...newCustForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="ramesh@example.com"
                      value={newCustForm.email}
                      onChange={(e) => setNewCustForm({ ...newCustForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {addCustomerStep === 2 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">House / Plot #</label>
                      <input
                        type="text"
                        placeholder="Plot #42, Block C"
                        value={newCustForm.housePlotNumber}
                        onChange={(e) => setNewCustForm({ ...newCustForm, housePlotNumber: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Street / Locality</label>
                      <input
                        type="text"
                        placeholder="Sushant Lok 1"
                        value={newCustForm.streetLocality}
                        onChange={(e) => setNewCustForm({ ...newCustForm, streetLocality: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">City</label>
                      <input
                        type="text"
                        value={newCustForm.city}
                        onChange={(e) => setNewCustForm({ ...newCustForm, city: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">State</label>
                      <input
                        type="text"
                        value={newCustForm.state}
                        onChange={(e) => setNewCustForm({ ...newCustForm, state: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">PIN Code</label>
                      <input
                        type="text"
                        value={newCustForm.pinCode}
                        onChange={(e) => setNewCustForm({ ...newCustForm, pinCode: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {addCustomerStep === 3 && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                    <strong className="block text-sm font-display">Ready to Create Account</strong>
                    <p>
                      Customer ID will be auto-generated in standard format (e.g. <code>CUST-2026-001</code>). Account will be verified immediately.
                    </p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Initial Verification Status</label>
                    <select
                      value={newCustForm.status}
                      onChange={(e) => setNewCustForm({ ...newCustForm, status: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 cursor-pointer"
                    >
                      <option value="VERIFIED">VERIFIED (Pre-authorized)</option>
                      <option value="ACTIVE">ACTIVE (Standard Customer)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {addCustomerStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setAddCustomerStep(addCustomerStep - 1)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Previous
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                )}

                {addCustomerStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (addCustomerStep === 1) {
                        if (!newCustForm.name.trim()) {
                          error('Please enter customer full name');
                          return;
                        }
                        const clean = newCustForm.phone.replace(/\D/g, '').slice(-10);
                        if (clean.length !== 10) {
                          error('Please enter a valid 10-digit mobile number');
                          return;
                        }
                      }
                      setAddCustomerStep(addCustomerStep + 1);
                    }}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    Complete & Register
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
