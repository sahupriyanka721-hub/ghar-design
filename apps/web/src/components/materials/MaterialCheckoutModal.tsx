import React, { useState } from 'react';
import {
  X,
  MapPin,
  Truck,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building,
  Plus,
  ArrowRight,
  ArrowLeft,
  Banknote,
  FileText,
  Clock,
} from 'lucide-react';
import { CustomerAddress } from '@ghar-design/shared';
import { useAuth } from '../../context/AuthContext.js';
import { incrementCustomerActivity, registerNewCustomer, broadcastStoreUpdate } from '../../data/customerStore.js';
import { getPlatformCoupons } from '../../data/adminStore.js';
import { Sparkles, Tag } from 'lucide-react';

export interface CheckoutItem {
  id: string;
  name: string;
  sku: string;
  brand: string;
  unit: string;
  quantity: number;
  unitPricePaise: number;
  imageUrl: string;
  variantName?: string;
  gstRatePercent?: number;
}

interface MaterialCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CheckoutItem[];
  isBuyNow?: boolean;
  onOrderSuccess: (order: any) => void;
}

export const MaterialCheckoutModal: React.FC<MaterialCheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  isBuyNow = false,
  onOrderSuccess,
}) => {
  const { user, addresses, addAddress, clearCart } = useAuth();

  const [step, setStep] = useState<'ADDRESS' | 'DELIVERY' | 'REVIEW' | 'PAYMENT' | 'SUCCESS'>('ADDRESS');
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  // New Address Form State
  const [newAddress, setNewAddress] = useState({
    label: 'Site Project Location',
    houseNo: '',
    street: '',
    locality: '',
    city: 'Gurugram',
    state: 'Haryana',
    pinCode: '',
    landmark: '',
    deliveryInstructions: '',
  });

  // Delivery & Project Association
  const [deliveryOption, setDeliveryOption] = useState<'STANDARD' | 'CRANE'>('STANDARD');
  const [associatedProject, setAssociatedProject] = useState(() => (user?.name ? `${user.name}'s Construction Project` : 'Residential Construction Project'));
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE_RAZORPAY' | 'CASH_ON_DELIVERY'>('ONLINE_RAZORPAY');

  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');

  if (!isOpen || items.length === 0) return null;

  // Financial Calculations
  const subtotalPaise = items.reduce((sum, it) => sum + it.unitPricePaise * it.quantity, 0);
  const taxPaise = Math.round(subtotalPaise * 0.18); // 18% GST standard
  const transitFeePaise = deliveryOption === 'CRANE' ? 350000 : 150000; // ₹3,500 or ₹1,500

  let discountPaise = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      const calcDiscount = Math.round((subtotalPaise * appliedCoupon.discountValue) / 100);
      const maxPaise = appliedCoupon.maxDiscountRupees ? appliedCoupon.maxDiscountRupees * 100 : Infinity;
      discountPaise = Math.min(calcDiscount, maxPaise);
    } else {
      discountPaise = Math.min(appliedCoupon.discountValue * 100, subtotalPaise);
    }
  }
  const grandTotalPaise = Math.max(0, subtotalPaise + taxPaise + transitFeePaise - discountPaise);

  const handleApplyCoupon = () => {
    setCouponError('');
    if (!couponCodeInput.trim()) return;
    const cleanCode = couponCodeInput.trim().toUpperCase();
    const coupons = getPlatformCoupons();
    const found = coupons.find((c) => c.code === cleanCode && c.isActive);
    if (!found) {
      setCouponError(`Coupon code "${cleanCode}" is invalid or expired.`);
      return;
    }
    const subtotalRupees = subtotalPaise / 100;
    if (found.minOrderRupees && subtotalRupees < found.minOrderRupees) {
      setCouponError(`Min order of ₹${found.minOrderRupees.toLocaleString('en-IN')} required for ${found.code}.`);
      return;
    }
    setAppliedCoupon(found);
  };

  const currentAddress: CustomerAddress = addresses[selectedAddressIndex] || addresses[0] || {
    id: 'addr-default',
    label: 'Primary Site',
    houseNo: '',
    street: '',
    locality: '',
    city: '',
    state: '',
    pinCode: '',
    country: 'India',
  };

  const handleAddNewAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.houseNo || !newAddress.street || !newAddress.pinCode) return;

    const createdAddr: CustomerAddress = {
      id: `addr-${Date.now()}`,
      label: newAddress.label || 'Construction Site',
      houseNo: newAddress.houseNo,
      street: newAddress.street,
      locality: newAddress.locality || newAddress.street,
      city: newAddress.city,
      state: newAddress.state,
      pinCode: newAddress.pinCode,
      country: 'India',
      landmark: newAddress.landmark,
    };

    addAddress(createdAddr);
    setIsAddingNewAddress(false);
    setSelectedAddressIndex(0);
  };

  const handleFinalOrderPlacement = async () => {
    setIsProcessing(true);

    try {
      const orderData = {
        items: items.map((it) => ({
          productId: it.id,
          name: it.name,
          sku: it.sku,
          brand: it.brand,
          unit: it.unit,
          quantity: it.quantity,
          unitPricePaise: it.unitPricePaise,
          imageUrl: it.imageUrl,
          variantName: it.variantName,
        })),
        deliveryAddress: currentAddress,
        deliveryOption,
        associatedProject,
        paymentMethod: paymentMethod === 'ONLINE_RAZORPAY' ? 'Razorpay Instant UPI / Card' : 'Cash on Delivery (Pending Collection)',
        paymentStatus: paymentMethod === 'ONLINE_RAZORPAY' ? 'PAYMENT_SUCCESSFUL' : 'PENDING_COLLECTION',
        subtotalPaise,
        taxPaise,
        deliveryFeePaise: transitFeePaise,
        couponCode: appliedCoupon?.code || null,
        discountPaise,
        totalAmountPaise: grandTotalPaise,
      };

      const orderCode = `GHR-MAT-${Math.floor(1000 + Math.random() * 9000)}`;
      const customerId = user?.id || (user?.phone ? `usr-cust-${user.phone.replace(/\D/g, '')}` : `usr-cust-${Date.now()}`);
      const customerName = user?.name || (addresses[selectedAddressIndex]?.label) || 'Registered Homeowner';
      const customerPhone = user?.phone || currentAddress.phone || '';
      const customerEmail = user?.email || 'Not Provided';

      const newOrderRecord = {
        id: `ord-mat-${Date.now()}`,
        orderCode,
        customerId,
        customerName,
        customerPhone,
        customerEmail,
        items: (orderData.items || []).map((i) => ({
          ...i,
          totalPaise: i.unitPricePaise * i.quantity,
        })),
        subtotalPaise,
        taxPaise,
        deliveryFeePaise: transitFeePaise,
        totalAmountPaise: grandTotalPaise,
        deliveryAddress: {
          ...currentAddress,
          customerName,
          phone: customerPhone,
        },
        paymentMethod: orderData.paymentMethod,
        paymentStatus: paymentMethod === 'ONLINE_RAZORPAY' ? 'PAYMENT_SUCCESSFUL' : 'PENDING_COLLECTION',
        fulfillmentStatus: 'CONFIRMED' as const,
        associatedProject,
        orderDate: new Date().toISOString(),
        expectedDeliveryDate: new Date(Date.now() + 3 * 86400000).toISOString(),
        trackingNumber: `TRK-DELHIVERY-${Math.floor(100000 + Math.random() * 900000)}`,
        trackingSteps: [
          { status: 'Order Placed & Milestone Recorded', date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }), completed: true },
          { status: 'Mill / Warehouse Stock Allocation', date: 'In Progress', completed: true },
          { status: 'Quality Lab Batch Testing & Inspection', date: 'Pending Verification', completed: false },
          { status: 'Flatbed Trailer Loaded & Weighed', date: 'Weighbridge Scheduled', completed: false },
          { status: 'Direct Transit to Construction Site', date: 'Pending Dispatch', completed: false },
          { status: 'On-Site Crane Offloading & Quality Signoff', date: 'Pending Delivery', completed: false },
        ],
      };

      // 1. Save to localStorage for instant client persistence across reloads
      const existingOrdersJson = localStorage.getItem('material_orders');
      const existingOrders = existingOrdersJson ? JSON.parse(existingOrdersJson) : [];
      localStorage.setItem('material_orders', JSON.stringify([newOrderRecord, ...existingOrders]));

      // 2. Ensure customer is registered/updated in platform store for Admin directory
      registerNewCustomer({
        id: customerId,
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        housePlotNumber: currentAddress.houseNo,
        streetLocality: currentAddress.street,
        city: currentAddress.city,
        state: currentAddress.state,
        pinCode: currentAddress.pinCode,
        materialOrdersCount: 1,
      });

      incrementCustomerActivity(customerPhone, 'materialOrdersCount');
      broadcastStoreUpdate('ORDERS_UPDATED', newOrderRecord);

      // If this was a regular cart checkout, clear cart; if Buy Now, keep cart untouched
      if (!isBuyNow) {
        clearCart();
      }

      setConfirmedOrder(newOrderRecord);
      setStep('SUCCESS');
      onOrderSuccess(newOrderRecord);
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-navy-950 text-white">
          <div className="flex items-center gap-2.5">
            <Building className="w-5 h-5 text-gold-400" />
            <div>
              <h3 className="font-display font-black text-sm tracking-wide text-white">
                {isBuyNow ? 'Instant Direct Purchase Checkout' : 'Materials Procurement Checkout'}
              </h3>
              <div className="text-[10px] text-slate-300">
                100% Milestone Verified • Official Weighbridge Receipt & GST Tax Invoice
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Indicator */}
        {step !== 'SUCCESS' && (
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-200/80 flex items-center justify-between text-xs font-bold font-display">
            {[
              { id: 'ADDRESS', label: '1. Site Address' },
              { id: 'DELIVERY', label: '2. Transit Mode' },
              { id: 'REVIEW', label: '3. Order Review' },
              { id: 'PAYMENT', label: '4. Payment' },
            ].map((s, idx) => (
              <span
                key={s.id}
                className={`flex items-center gap-1.5 transition ${
                  step === s.id
                    ? 'text-navy-950 font-black'
                    : 'text-slate-400 font-medium'
                }`}
              >
                <span>{s.label}</span>
                {idx < 3 && <span className="text-slate-300 hidden sm:inline">→</span>}
              </span>
            ))}
          </div>
        )}

        {/* Scrollable Step Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 text-xs font-sans space-y-6">
          {/* ================= STEP 1: DELIVERY ADDRESS ================= */}
          {step === 'ADDRESS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-extrabold font-display text-navy-950">Select Site Delivery Destination</h4>
                  <p className="text-slate-500 text-[11px]">Heavy trailer access requires wide street entry and firm offloading surface.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingNewAddress(!isAddingNewAddress)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy-950 font-bold rounded-lg flex items-center gap-1 text-[11px] transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingNewAddress ? 'Select Saved' : 'Add New Site'}</span>
                </button>
              </div>

              {isAddingNewAddress ? (
                <form onSubmit={handleAddNewAddressSubmit} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="font-bold text-slate-800 text-xs">Add New Construction Site Address:</div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Plot / Villa / House No."
                      value={newAddress.houseNo}
                      onChange={(e) => setNewAddress({ ...newAddress, houseNo: e.target.value })}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Street / Locality"
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="City (e.g. Gurugram)"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="State (e.g. Haryana)"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="PIN Code"
                      value={newAddress.pinCode}
                      onChange={(e) => setNewAddress({ ...newAddress, pinCode: e.target.value })}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Nearby Landmark (e.g. Near Rapid Metro / Golf Course Road)"
                    value={newAddress.landmark}
                    onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingNewAddress(false)}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-navy-950 text-gold-400 font-bold rounded-lg"
                    >
                      Save & Use This Address
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2.5">
                  {addresses.map((addr, idx) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressIndex(idx)}
                      className={`p-4 rounded-2xl border cursor-pointer transition flex items-start justify-between ${
                        selectedAddressIndex === idx
                          ? 'border-navy-950 bg-navy-50/50 ring-2 ring-navy-950 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-navy-950 text-xs">{addr.label}</span>
                          {idx === 0 && (
                            <span className="text-[10px] bg-gold-100 text-gold-800 font-bold px-2 py-0.5 rounded-full">
                              Default Site
                            </span>
                          )}
                        </div>
                        <div className="text-slate-600 text-[11px] leading-relaxed">
                          {addr.houseNo}, {addr.street}, {addr.locality}, {addr.city} - {addr.pinCode}, {addr.state}
                        </div>
                        {addr.landmark && (
                          <div className="text-[10px] text-slate-400">
                            Landmark: {addr.landmark}
                          </div>
                        )}
                      </div>

                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        selectedAddressIndex === idx ? 'border-navy-950 bg-navy-950 text-white' : 'border-slate-300'
                      }`}>
                        {selectedAddressIndex === idx && <div className="w-2 h-2 rounded-full bg-gold-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 2: DELIVERY & TRANSIT OPTIONS ================= */}
          {step === 'DELIVERY' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-extrabold font-display text-navy-950">Select Transit & Offloading Method</h4>
                <p className="text-slate-500 text-[11px]">Direct mill dispatch vehicles require wide street entry and designated offloading clearance.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setDeliveryOption('STANDARD')}
                  className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                    deliveryOption === 'STANDARD'
                      ? 'border-navy-950 bg-navy-50/50 ring-2 ring-navy-950 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-blue-600" />
                      <span className="font-bold text-navy-950 text-xs">Standard Flatbed Transit</span>
                    </div>
                    <span className="font-extrabold text-navy-950 text-xs">₹1,500</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Direct heavy flatbed delivery for cement bags, bricks, and tiles. Manual offloading by logistics helpers.
                  </p>
                </div>

                <div
                  onClick={() => setDeliveryOption('CRANE')}
                  className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                    deliveryOption === 'CRANE'
                      ? 'border-navy-950 bg-navy-50/50 ring-2 ring-navy-950 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-purple-600" />
                      <span className="font-bold text-navy-950 text-xs">Hydraulic Crane Offloading</span>
                    </div>
                    <span className="font-extrabold text-navy-950 text-xs">₹3,500</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Mechanized hydraulic boom crane for heavy steel rebar bundles and high-rise slab offloading.
                  </p>
                </div>
              </div>

              {/* Project Tagging Selector */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <label className="font-bold text-slate-800 flex items-center justify-between text-xs">
                  <span>Tag Material Purchase to Construction Project:</span>
                  <span className="text-[10px] text-gold-700 font-semibold bg-gold-50 px-2 py-0.5 rounded">Optional</span>
                </label>
                <select
                  value={associatedProject}
                  onChange={(e) => setAssociatedProject(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-xs focus:ring-2 focus:ring-navy-900"
                >
                  <option value="Villa 14B Construction Project (Sector 57)">Villa 14B Construction Project (Sector 57, Gurugram)</option>
                  <option value="Plot 42 Site Rebuild (Sector 65)">Plot 42 Site Rebuild (Sector 65, Gurugram)</option>
                  <option value="Independent Property Purchase">Independent Property Purchase (Unlinked)</option>
                </select>
                <p className="text-[10px] text-slate-400">
                  Tagging allows automatic inclusion in your Project Stage Expense & BOQ reconciliation ledger.
                </p>
              </div>
            </div>
          )}

          {/* ================= STEP 3: ORDER REVIEW ================= */}
          {step === 'REVIEW' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-extrabold font-display text-navy-950">Review Materials & Line Items</h4>
                <p className="text-slate-500 text-[11px]">Verify quantities, unit costs, and site delivery terms before proceeding to payment.</p>
              </div>

              {/* Itemized Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="divide-y divide-slate-100">
                  {items.map((it, idx) => (
                    <div key={idx} className="p-3.5 flex items-center gap-3 bg-white">
                      <img src={it.imageUrl} alt={it.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-navy-950 text-xs truncate">{it.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {it.brand} {it.variantName ? `• ${it.variantName}` : ''}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Qty: <strong>{it.quantity} {it.unit}</strong> @ ₹{(it.unitPricePaise / 100).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold font-display text-xs text-navy-950">
                          ₹{((it.unitPricePaise * it.quantity) / 100).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Promo Coupon Application */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/90 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-navy-950">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                    <span>Apply Admin Promo Coupon</span>
                  </span>
                  {appliedCoupon && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {appliedCoupon.code} Applied (Save ₹{(discountPaise / 100).toLocaleString('en-IN')})
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. WELCOME100)"
                    value={couponCodeInput}
                    onChange={(e) => {
                      setCouponCodeInput(e.target.value.toUpperCase());
                      setCouponError('');
                    }}
                    disabled={Boolean(appliedCoupon)}
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase bg-white focus:ring-2 focus:ring-navy-950"
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCodeInput('');
                      }}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-1.5 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Apply
                    </button>
                  )}
                </div>
                {couponError && <p className="text-[11px] font-medium text-red-600">{couponError}</p>}
              </div>

              {/* Financial Summary Breakdown */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span>Materials Subtotal:</span>
                  <span className="font-bold text-slate-900">₹{(subtotalPaise / 100).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Applicable GST (18% Statutory):</span>
                  <span className="font-bold text-slate-900">₹{(taxPaise / 100).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Direct Site Transit Logistics:</span>
                  <span className="font-bold text-slate-900">₹{(transitFeePaise / 100).toLocaleString('en-IN')}</span>
                </div>
                {discountPaise > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Promo Coupon Discount ({appliedCoupon.code}):</span>
                    <span>-₹{(discountPaise / 100).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black font-display text-navy-950 pt-2 border-t border-slate-200">
                  <span>Grand Total Payable:</span>
                  <span className="text-emerald-700 text-base">₹{(grandTotalPaise / 100).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 4: PAYMENT METHOD ================= */}
          {step === 'PAYMENT' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-extrabold font-display text-navy-950">Select Payment Method</h4>
                <p className="text-slate-500 text-[11px]">Choose between instant digital UPI/NetBanking or Cash on Site Delivery.</p>
              </div>

              <div className="space-y-3">
                {/* Online Payment via Razorpay */}
                <div
                  onClick={() => setPaymentMethod('ONLINE_RAZORPAY')}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3.5 ${
                    paymentMethod === 'ONLINE_RAZORPAY'
                      ? 'border-navy-950 bg-navy-50/50 ring-2 ring-navy-950 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-navy-950 text-gold-400 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy-950 text-xs">Razorpay Instant Gateway (UPI, Cards, NetBanking)</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Instant Verification</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Pay via Google Pay, PhonePe, Paytm, HDFC, ICICI, SBI NetBanking, or Credit/Debit Cards with instant bank authorization receipt.
                    </p>
                  </div>
                </div>

                {/* Cash on Delivery (COD) */}
                <div
                  onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3.5 ${
                    paymentMethod === 'CASH_ON_DELIVERY'
                      ? 'border-navy-950 bg-navy-50/50 ring-2 ring-navy-950 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 font-bold">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy-950 text-xs">Cash on Delivery (Pending Site Collection)</span>
                      <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">Pay Upon Offloading</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Inspect moisture seal and rebar grade at site before releasing cash / UPI to logistics delivery officer.
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Payable Box */}
              <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-emerald-950 block">Amount Payable:</span>
                  <span className="text-[10px] text-emerald-700">
                    {paymentMethod === 'ONLINE_RAZORPAY' ? 'Debit/UPI Online' : 'Collection upon site arrival'}
                  </span>
                </div>
                <div className="text-xl font-black font-display text-emerald-900">
                  ₹{(grandTotalPaise / 100).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 5: SUCCESS CONFIRMATION ================= */}
          {step === 'SUCCESS' && confirmedOrder && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center border-4 border-emerald-50">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider font-display">
                  {confirmedOrder.paymentStatus === 'PAYMENT_SUCCESSFUL' ? 'Payment Verified & Confirmed' : 'COD Order Confirmed (Pending Collection)'}
                </span>
                <h3 className="font-display font-black text-2xl text-navy-950 mt-2">
                  Materials Order Successfully Dispatched!
                </h3>
                <p className="text-slate-500 text-xs mt-1">
                  Order Reference: <strong className="font-mono text-navy-950">{confirmedOrder.orderCode}</strong>
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination:</span>
                  <span className="font-bold text-navy-950">{confirmedOrder.deliveryAddress.houseNo}, {confirmedOrder.deliveryAddress.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transit Tracking No:</span>
                  <span className="font-mono font-bold text-blue-700">{confirmedOrder.trackingNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Amount:</span>
                  <span className="font-black text-emerald-700 font-display">₹{(confirmedOrder.totalAmountPaise / 100).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3.5 bg-navy-950 text-gold-400 font-bold rounded-xl shadow-md text-xs"
                >
                  View Details in My Purchases
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        {step !== 'SUCCESS' && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
            {step === 'ADDRESS' ? (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl font-medium text-xs hover:bg-white"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (step === 'DELIVERY') setStep('ADDRESS');
                  if (step === 'REVIEW') setStep('DELIVERY');
                  if (step === 'PAYMENT') setStep('REVIEW');
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold text-xs hover:bg-white flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            {step === 'ADDRESS' && (
              <button
                type="button"
                onClick={() => setStep('DELIVERY')}
                className="btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-1.5"
              >
                <span>Continue to Transit Mode</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 'DELIVERY' && (
              <button
                type="button"
                onClick={() => setStep('REVIEW')}
                className="btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-1.5"
              >
                <span>Review Order Summary</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 'REVIEW' && (
              <button
                type="button"
                onClick={() => setStep('PAYMENT')}
                className="btn-gold py-2.5 px-6 text-xs font-black shadow-md flex items-center gap-1.5"
              >
                <span>Proceed to Payment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 'PAYMENT' && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleFinalOrderPlacement}
                className="btn-gold py-3 px-8 text-xs font-black shadow-xl flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isProcessing ? 'Processing Order...' : paymentMethod === 'ONLINE_RAZORPAY' ? 'Confirm & Pay Online' : 'Place Cash on Delivery Order'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
