import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  getVendorOrders,
  updateVendorOrderStatus,
  getVendorByPhone,
} from '../../data/vendorStore.js';
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Navigation,
  Check,
  AlertCircle,
  FileText,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Upload,
  Printer,
  X,
  Search,
  Scale,
  Car,
  User,
  ExternalLink,
} from 'lucide-react';
import { BulkyTransitDetails } from '@ghar-design/shared';

export const VendorDelivery: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'READY' | 'IN_TRANSIT' | 'DELIVERED'>('ALL');
  const [search, setSearch] = useState('');

  // Transit Assignment Modal
  const [selectedTransitOrder, setSelectedTransitOrder] = useState<any | null>(null);
  const [vehicleType, setVehicleType] = useState<string>('10-Tyre Heavy Tipper (16 MT)');
  const [vehicleNumber, setVehicleNumber] = useState<string>('HR-55-AB-7890');
  const [driverName, setDriverName] = useState<string>('Ramesh Kumar');
  const [driverContact, setDriverContact] = useState<string>('9811223344');
  const [expectedDate, setExpectedDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [weighbridgeSlipNo, setWeighbridgeSlipNo] = useState<string>('WB-DEL-4412');
  const [tareWeightKg, setTareWeightKg] = useState<number>(8500);
  const [grossWeightKg, setGrossWeightKg] = useState<number>(24500);
  const [transitNotes, setTransitNotes] = useState<string>('Heavy load. Offloading crane required at customer site.');

  // Print Challan Modal
  const [printChallanOrder, setPrintChallanOrder] = useState<any | null>(null);

  const vendorRecord = useMemo(() => {
    if (!user?.phone) return null;
    return getVendorByPhone(user.phone) || null;
  }, [user?.phone]);

  const loadOrders = () => {
    const list = getVendorOrders(user?.phone || vendorRecord?.id);
    setOrders(list);
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 4000);
    return () => clearInterval(interval);
  }, [user?.phone, vendorRecord?.id]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.orderCode.toLowerCase().includes(search.toLowerCase()) ||
        (o.customerName && o.customerName.toLowerCase().includes(search.toLowerCase())) ||
        (o.deliveryAddress?.city && o.deliveryAddress.city.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;

      if (activeTab === 'READY') {
        return o.fulfillmentStatus === 'CONFIRMED' || o.fulfillmentStatus === 'PROCESSING';
      }
      if (activeTab === 'IN_TRANSIT') {
        return o.fulfillmentStatus === 'DISPATCHED' || o.fulfillmentStatus === 'OUT_FOR_DELIVERY';
      }
      if (activeTab === 'DELIVERED') {
        return o.fulfillmentStatus === 'DELIVERED';
      }
      return o.fulfillmentStatus !== 'CANCELLED';
    });
  }, [orders, search, activeTab]);

  const handleOpenAssignModal = (ord: any) => {
    setSelectedTransitOrder(ord);
    setVehicleNumber(ord.transitDetails?.vehicleNumber || 'HR-55-AB-7890');
    setDriverName(ord.transitDetails?.driverName || 'Ramesh Kumar');
    setDriverContact(ord.transitDetails?.driverContact || '9811223344');
  };

  const handleSaveTransitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransitOrder) return;

    const netMaterialWeight = grossWeightKg - tareWeightKg;

    const transitData: BulkyTransitDetails = {
      vehicleType,
      vehicleNumber,
      driverName,
      driverContact,
      dispatchDate: new Date().toISOString(),
      expectedDeliveryDate: expectedDate,
      deliveryChallanNumber: `DC-${selectedTransitOrder.orderCode}`,
      weighbridgeSlipNumber: weighbridgeSlipNo,
      tareWeightKg,
      grossWeightKg,
      netWeightKg: netMaterialWeight > 0 ? netMaterialWeight : undefined,
    };

    updateVendorOrderStatus(selectedTransitOrder.id, 'DISPATCHED', {
      trackingNumber: vehicleNumber,
      dispatchNote: `${vehicleType} - Driver: ${driverName} (${driverContact}). ${transitNotes}`,
      transitDetails: transitData,
    });

    success(`Logistics assigned and Sub-Order ${selectedTransitOrder.orderCode} dispatched!`);
    setSelectedTransitOrder(null);
    loadOrders();
  };

  const handleAdvanceStep = (orderId: string, currentStatus: string) => {
    let next = 'PROCESSING';
    if (currentStatus === 'CONFIRMED') next = 'PROCESSING';
    else if (currentStatus === 'PROCESSING') next = 'DISPATCHED';
    else if (currentStatus === 'DISPATCHED') next = 'OUT_FOR_DELIVERY';
    else if (currentStatus === 'OUT_FOR_DELIVERY') next = 'DELIVERED';

    updateVendorOrderStatus(orderId, next);
    success(`Shipment milestone updated to ${next}!`);
    loadOrders();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-blue-200/80/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/10 text-amber-700 rounded-xl">
              <Truck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-display text-navy-950">
              Shipping & Heavy Material Transit
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage heavy transit logistics, tipper trucks, weighbridge manifests, driver contacts and delivery challans.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-50/30 border border-blue-200/80 rounded-xl text-xs font-bold text-slate-700">
            Active Fleet Runs:{' '}
            <span className="text-amber-600 font-mono font-black">
              {orders.filter((o) => o.fulfillmentStatus === 'DISPATCHED' || o.fulfillmentStatus === 'OUT_FOR_DELIVERY').length}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="bg-white p-4 rounded-2xl border border-blue-200/80/90 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'ALL'
                  ? 'bg-navy-950 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Shipments ({orders.filter((o) => o.fulfillmentStatus !== 'CANCELLED').length})
            </button>
            <button
              onClick={() => setActiveTab('READY')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'READY'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              Ready to Load / Dispatch (
              {orders.filter((o) => o.fulfillmentStatus === 'CONFIRMED' || o.fulfillmentStatus === 'PROCESSING').length})
            </button>
            <button
              onClick={() => setActiveTab('IN_TRANSIT')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'IN_TRANSIT'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-blue-200 hover:bg-amber-100'
              }`}
            >
              In Transit ({orders.filter((o) => o.fulfillmentStatus === 'DISPATCHED' || o.fulfillmentStatus === 'OUT_FOR_DELIVERY').length})
            </button>
            <button
              onClick={() => setActiveTab('DELIVERED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'DELIVERED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Delivered ({orders.filter((o) => o.fulfillmentStatus === 'DELIVERED').length})
            </button>
          </div>

          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order or destination city..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-sky-50/30 border border-blue-200/80 rounded-xl focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>
        </div>

        {/* Deliveries List / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-slate-400">
              <Truck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-600">No shipments found in this view.</p>
              <p className="text-[11px] mt-0.5">Assigned customer orders ready for carrier loading will show up here.</p>
            </div>
          ) : (
            filteredOrders.map((ord) => {
              const isDelivered = ord.fulfillmentStatus === 'DELIVERED';
              const isInTransit = ord.fulfillmentStatus === 'DISPATCHED' || ord.fulfillmentStatus === 'OUT_FOR_DELIVERY';
              const isReady = ord.fulfillmentStatus === 'CONFIRMED' || ord.fulfillmentStatus === 'PROCESSING';

              return (
                <div
                  key={ord.id}
                  className="bg-white rounded-2xl border border-blue-200/80/90 p-5 space-y-4 hover:border-blue-200 transition shadow-2xs"
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {ord.orderCode}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 mt-1">{ord.customerName}</h3>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isDelivered
                          ? 'bg-emerald-100 text-emerald-800'
                          : isInTransit
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {ord.fulfillmentStatus}
                    </span>
                  </div>

                  {/* Destination Details */}
                  <div className="p-3 bg-sky-50/30 rounded-xl border border-blue-200/80 text-xs space-y-1">
                    <div className="flex items-start gap-1.5 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        {ord.deliveryAddress?.houseNo} {ord.deliveryAddress?.street}, {ord.deliveryAddress?.city} (
                        {ord.deliveryAddress?.pinCode})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>Customer: {ord.customerPhone}</span>
                    </div>
                  </div>

                  {/* Material Payload */}
                  <div className="text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">CARGO SPECIFICATION</span>
                    <div className="font-bold text-slate-800">
                      {(ord.items || []).map((it: any) => `${it.name} (${it.quantity} ${it.unit})`).join(', ')}
                    </div>
                  </div>

                  {/* Transit Fleet Details (if assigned) */}
                  {ord.transitDetails ? (
                    <div className="p-3 bg-amber-50/50 rounded-xl border border-blue-200/80 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-amber-950">
                        <span>Vehicle: {ord.transitDetails.vehicleType}</span>
                        <span className="font-mono">{ord.transitDetails.vehicleNumber}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 text-[11px]">
                        <span>Driver: {ord.transitDetails.driverName}</span>
                        <span className="font-mono">{ord.transitDetails.driverContact}</span>
                      </div>
                      {ord.transitDetails.netWeightKg && (
                        <div className="text-[10px] text-slate-500">
                          Weighbridge Net: <strong>{(ord.transitDetails.netWeightKg / 1000).toFixed(2)} MT</strong> (Slip #{ord.transitDetails.weighbridgeSlipNumber})
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => setPrintChallanOrder(ord)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Delivery Challan</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {isReady && (
                        <button
                          onClick={() => handleOpenAssignModal(ord)}
                          className="px-3 py-1.5 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Assign Carrier & Dispatch</span>
                        </button>
                      )}

                      {isInTransit && (
                        <button
                          onClick={() => handleAdvanceStep(ord.id, ord.fulfillmentStatus)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Delivered</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL: ASSIGN BULKY TRANSIT FLEET */}
      <AnimatePresence>
        {selectedTransitOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-blue-200/80 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden text-xs"
            >
              <div className="p-4 bg-sky-50/30 border-b border-blue-200/80 flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    {selectedTransitOrder.orderCode}
                  </span>
                  <h3 className="font-bold text-sm text-navy-950 mt-1">Assign Heavy Transit Vehicle & Driver</h3>
                </div>
                <button
                  onClick={() => setSelectedTransitOrder(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTransitDetails} className="p-5 overflow-y-auto space-y-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vehicle / Carrier Type *</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="10-Tyre Heavy Tipper (16 MT)">10-Tyre Heavy Tipper (16 MT Capacity)</option>
                    <option value="Heavy Flatbed Trailer (25 MT)">Heavy Flatbed Trailer (25 MT Capacity - Steel/Rebar)</option>
                    <option value="Mini 6-Tyre Tipper (6 MT)">Mini 6-Tyre Tipper (6 MT Capacity)</option>
                    <option value="Tractor Trolley (3.5 MT)">Tractor Trolley (3.5 MT - Local Urban Access)</option>
                    <option value="Boom Crane Truck">Boom Crane Truck (Hydraulic Unloading)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Vehicle Plate Number *</label>
                    <input
                      type="text"
                      required
                      placeholder=""
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl font-mono font-bold uppercase focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Expected Delivery Date *</label>
                    <input
                      type="date"
                      required
                      value={expectedDate}
                      onChange={(e) => setExpectedDate(e.target.value)}
                      className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Assigned Driver Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Driver full name"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Driver Mobile Phone *</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="10-digit mobile"
                      value={driverContact}
                      onChange={(e) => setDriverContact(e.target.value)}
                      className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl font-mono font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Weighbridge Details */}
                <div className="p-3.5 bg-sky-50/30 rounded-xl border border-blue-200/80 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Scale className="w-3.5 h-3.5 text-amber-600" />
                    <span>Depot Weighbridge Manifest (Optional)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Slip #</span>
                      <input
                        type="text"
                        value={weighbridgeSlipNo}
                        onChange={(e) => setWeighbridgeSlipNo(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-blue-200/80 rounded font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block">Tare Wt (KG)</span>
                      <input
                        type="number"
                        value={tareWeightKg}
                        onChange={(e) => setTareWeightKg(parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-white border border-blue-200/80 rounded font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block">Gross Wt (KG)</span>
                      <input
                        type="number"
                        value={grossWeightKg}
                        onChange={(e) => setGrossWeightKg(parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-white border border-blue-200/80 rounded font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Site Delivery Instructions</label>
                  <textarea
                    rows={2}
                    value={transitNotes}
                    onChange={(e) => setTransitNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setSelectedTransitOrder(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Dispatch & Notify Customer</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRINT DELIVERY CHALLAN */}
      {printChallanOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-blue-200 text-slate-900 font-sans text-xs">
            <div className="border-b pb-3 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  BuildGhar Construction Logistics
                </span>
                <h2 className="text-lg font-black text-navy-950">HEAVY VEHICLE DELIVERY CHALLAN</h2>
                <span className="font-mono font-bold text-xs text-amber-700">
                  CHALLAN #{printChallanOrder.orderCode}
                </span>
              </div>
              <button
                onClick={() => setPrintChallanOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-sky-50/30 border rounded-xl">
              <div>
                <span className="text-slate-400 block text-[10px]">ORIGIN YARD</span>
                <strong>{vendorRecord?.businessName || 'BuildGhar Depot'}</strong>
                <p className="text-slate-500 text-[11px]">{vendorRecord?.address?.street || 'Central Material Yard'}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">DESTINATION SITE</span>
                <strong>{printChallanOrder.customerName}</strong>
                <p className="text-slate-500 text-[11px]">
                  {printChallanOrder.deliveryAddress?.houseNo} {printChallanOrder.deliveryAddress?.street}
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50/60 border border-blue-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-amber-900 uppercase">TRANSIT DETAILS</span>
              <div className="flex justify-between font-bold">
                <span>Vehicle: {printChallanOrder.transitDetails?.vehicleType || 'Flatbed Carrier'}</span>
                <span className="font-mono">{printChallanOrder.transitDetails?.vehicleNumber || 'HR-55-AB-7890'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Driver: {printChallanOrder.transitDetails?.driverName || 'Ramesh Kumar'}</span>
                <span>Contact: {printChallanOrder.transitDetails?.driverContact || '9811223344'}</span>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setPrintChallanOrder(null)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-700"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-navy-950 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
