import React, { useState, useEffect } from 'react';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  getVendorMaterialRequestsForCustomer,
  getQuotationsForRequest,
  acceptVendorMaterialQuotation,
  VendorMaterialRequest,
  VendorMaterialQuotation,
} from '../../data/vendorStore.js';
import {
  X,
  FileText,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Building,
  Phone,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Star,
  Receipt,
} from 'lucide-react';

interface CustomerMaterialQuotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerPhone?: string;
  customerId?: string;
  customerName?: string;
}

export const CustomerMaterialQuotesModal: React.FC<CustomerMaterialQuotesModalProps> = ({
  isOpen,
  onClose,
  customerPhone,
  customerId,
  customerName,
}) => {
  const [requests, setRequests] = useState<VendorMaterialRequest[]>([]);
  const [expandedReqId, setExpandedReqId] = useState<string | null>(null);
  const [phoneFilter, setPhoneFilter] = useState<string>(customerPhone || '');
  const [confirmedSuccessQuote, setConfirmedSuccessQuote] = useState<{
    vendorName: string;
    requestCode: string;
    grandTotal: number;
  } | null>(null);

  const loadRequests = () => {
    const list = getVendorMaterialRequestsForCustomer(phoneFilter || customerPhone || customerId);
    setRequests(list);
    if (list.length > 0 && !expandedReqId) {
      setExpandedReqId(list[0].id);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRequests();
      const interval = setInterval(loadRequests, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, phoneFilter, customerPhone, customerId]);

  if (!isOpen) return null;

  const handleSelectVendorQuote = (quote: VendorMaterialQuotation, req: VendorMaterialRequest) => {
    acceptVendorMaterialQuotation(quote.id, req.id);
    setConfirmedSuccessQuote({
      vendorName: quote.vendorBusinessName || quote.vendorName,
      requestCode: req.requestCode,
      grandTotal: quote.grandTotal || (quote.quotedTotalPaise ? quote.quotedTotalPaise / 100 : 0),
    });
    loadRequests();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl border border-blue-100/80 space-y-5 max-h-[92vh] overflow-y-auto font-sans relative">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-navy-950 to-navy-900 border border-gold-500/40 text-gold-400 flex items-center justify-center shadow-md">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg sm:text-xl font-display text-navy-950">
                  My Material Quotes & Vendor Bids
                </h3>
                <span className="px-2.5 py-0.5 bg-gold-500/10 text-gold-700 border border-gold-500/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Live BOQ Procurement
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review itemized wholesale rates from verified local depots, compare freight & delivery timelines, and confirm orders directly.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Confirmation Notification */}
        {confirmedSuccessQuote && (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-900">
                  Vendor Order Confirmed Successfully!
                </div>
                <div className="text-[11px] text-emerald-700">
                  Your procurement order for <strong>{confirmedSuccessQuote.requestCode}</strong> has been confirmed with{' '}
                  <strong>{confirmedSuccessQuote.vendorName}</strong> ({formatINR(confirmedSuccessQuote.grandTotal)}). Official purchase order dispatched to depot.
                </div>
              </div>
            </div>
            <button
              onClick={() => setConfirmedSuccessQuote(null)}
              className="text-xs font-bold text-emerald-800 bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg border border-emerald-300 transition shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Optional Phone / Mobile filter if not logged in */}
        {!customerPhone && (
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-4 h-4 text-gold-600" />
              <span>Enter registered mobile number to locate your procurement bids:</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={phoneFilter}
                onChange={(e) => setPhoneFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-navy-950"
              />
              <button
                onClick={loadRequests}
                className="px-3 py-1.5 bg-navy-950 text-gold-400 font-bold rounded-xl hover:bg-navy-900 transition shrink-0"
              >
                Find
              </button>
            </div>
          </div>
        )}

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="bg-slate-50/80 rounded-3xl border border-dashed border-slate-200 p-10 text-center text-slate-500 space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-800 text-sm">No Material Procurement Requests Found</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              You haven't submitted any material quote inquiries yet. Use the <strong>"Get House Material Quote"</strong> button on the materials page to receive factory-direct quotes from verified city depots.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const isExpanded = expandedReqId === req.id;
              const quotations = getQuotationsForRequest(req.id);
              const isConfirmed = req.status === 'CONFIRMED';

              return (
                <div
                  key={req.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isConfirmed
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : isExpanded
                      ? 'border-gold-500/50 bg-white shadow-md'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-white'
                  }`}
                >
                  {/* Request Accordion Header */}
                  <div
                    onClick={() => setExpandedReqId(isExpanded ? null : req.id)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-black text-navy-950 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                          {req.requestCode}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(req.createdAt)}
                        </span>
                        <span className="text-[11px] text-slate-600 font-semibold flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-600" />
                          {req.city}
                        </span>
                        {req.builtUpAreaSqFt && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                            {req.builtUpAreaSqFt} sq.ft Package
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-navy-950 text-sm sm:text-base">
                        {req.materialItem}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Site Location: {req.deliverySiteAddress}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        {isConfirmed ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Order Confirmed</span>
                          </div>
                        ) : quotations.length > 0 ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/20 text-gold-800 border border-gold-500/40 text-[11px] font-bold">
                            <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                            <span>{quotations.length} Vendor Quotes Received</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold">
                            <Clock className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                            <span>Awaiting Vendor Quotes</span>
                          </div>
                        )}
                      </div>

                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Accordion Expanded Content */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 border-t border-slate-100 bg-white space-y-5">
                      {/* BOQ Items Breakdown */}
                      {req.items && req.items.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-navy-950" />
                            <span>Requested Bill of Quantities (BOQ Items):</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
                            {(req.items || []).map((item, idx) => (
                              <div
                                key={idx}
                                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5"
                              >
                                <span className="text-[10px] text-slate-400 block font-semibold truncate">
                                  {item.name}
                                </span>
                                <span className="font-mono font-bold text-navy-950 text-xs block">
                                  {item.quantity.toLocaleString()} {item.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Vendor Quotations List & Side-by-side Comparison */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-display font-black text-xs sm:text-sm text-navy-950 uppercase tracking-wide flex items-center gap-2">
                            <span>Vendor Quotations & Price Comparison</span>
                            <span className="text-[10px] font-bold text-gold-700 bg-gold-100 px-2 py-0.5 rounded-full">
                              {quotations.length} Depot Offers
                            </span>
                          </h5>
                          {req.selectedVendorName && (
                            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              Selected Vendor: {req.selectedVendorName}
                            </span>
                          )}
                        </div>

                        {quotations.length === 0 ? (
                          <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-200 text-center space-y-2">
                            <Clock className="w-8 h-8 text-amber-600 mx-auto" />
                            <div className="text-xs font-bold text-amber-900">
                              Inquiry Broadcasting to Verified Depots in {req.city}
                            </div>
                            <p className="text-[11px] text-amber-700 max-w-md mx-auto leading-relaxed">
                              Your requirement has been transmitted to authorized wholesale distributors in {req.city}. Itemized price bids including transit freight and unloading terms will appear here shortly.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {quotations.map((quote) => {
                              const grandTotal =
                                quote.grandTotal ||
                                (quote.quotedTotalPaise ? quote.quotedTotalPaise / 100 : 0);
                              const isThisSelected = quote.status === 'ACCEPTED' || req.selectedQuotationId === quote.id;

                              return (
                                <div
                                  key={quote.id}
                                  className={`rounded-2xl p-4 sm:p-5 border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                                    isThisSelected
                                      ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20 shadow-md'
                                      : 'border-slate-200 bg-white hover:border-gold-500/50 hover:shadow-md'
                                  }`}
                                >
                                  {/* Top Vendor Info */}
                                  <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <h6 className="font-bold text-navy-950 text-sm sm:text-base font-display">
                                            {quote.vendorBusinessName || quote.vendorName}
                                          </h6>
                                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                          <span>{quote.vendorCity || req.city}</span>
                                          <span>•</span>
                                          <span className="flex items-center gap-1 text-amber-600 font-bold">
                                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                            {quote.vendorRating || 4.8} Rating
                                          </span>
                                        </div>
                                      </div>

                                      <div className="text-right">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                                          Total Quote
                                        </span>
                                        <span className="font-display font-black text-base sm:text-lg text-navy-950">
                                          {formatINR(grandTotal)}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Delivery Timeline & Vehicle Specs */}
                                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-navy-950 shrink-0" />
                                        <span>Delivery: <strong>Within {quote.deliveryDays} Days</strong></span>
                                      </div>
                                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-1.5">
                                        <Truck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                        <span className="truncate">Transit: <strong>{quote.vehicleTypeOffered || 'Truck Freight'}</strong></span>
                                      </div>
                                    </div>

                                    {/* Itemized Price Breakdown Table */}
                                    {quote.itemPrices && quote.itemPrices.length > 0 && (
                                      <div className="border border-slate-200 rounded-xl overflow-hidden text-[11px] mt-2">
                                        <div className="bg-slate-50 px-3 py-1.5 font-bold text-slate-600 border-b border-slate-200 grid grid-cols-12 gap-1 text-[10px] uppercase">
                                          <div className="col-span-6">Material Item</div>
                                          <div className="col-span-3 text-right">Unit Rate</div>
                                          <div className="col-span-3 text-right">Total</div>
                                        </div>
                                        <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto">
                                          {(quote.itemPrices || []).map((item, idx) => (
                                            <div key={idx} className="px-3 py-1.5 grid grid-cols-12 gap-1 items-center">
                                              <div className="col-span-6 truncate font-medium text-slate-800">
                                                {item.itemName}
                                                {item.brandOffered && (
                                                  <span className="text-[10px] text-slate-400 block font-normal">
                                                    Brand: {item.brandOffered}
                                                  </span>
                                                )}
                                              </div>
                                              <div className="col-span-3 text-right font-mono text-slate-600 text-[10px]">
                                                {formatINR(item.ratePerUnit)}/{item.unit.split(' ')[0]}
                                              </div>
                                              <div className="col-span-3 text-right font-mono font-bold text-navy-950">
                                                {formatINR(item.totalAmount)}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Freight & Tax breakdown summary */}
                                    <div className="space-y-1 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                                      {quote.materialSubtotal && (
                                        <div className="flex justify-between text-slate-600">
                                          <span>Material Base Total:</span>
                                          <span className="font-mono">{formatINR(quote.materialSubtotal)}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between text-slate-600">
                                        <span>Hydraulic Freight & Unloading:</span>
                                        <span className="font-mono text-emerald-700 font-semibold">
                                          {quote.freightDeliveryCharge ? formatINR(quote.freightDeliveryCharge) : 'Included / Free'}
                                        </span>
                                      </div>
                                      {quote.gstAmount ? (
                                        <div className="flex justify-between text-slate-600">
                                          <span>GST (Applicable):</span>
                                          <span className="font-mono">{formatINR(quote.gstAmount)}</span>
                                        </div>
                                      ) : null}
                                      <div className="flex justify-between font-bold text-navy-950 pt-1 border-t border-slate-200">
                                        <span>Grand Quoted Amount:</span>
                                        <span className="font-mono font-black text-gold-700">{formatINR(grandTotal)}</span>
                                      </div>
                                    </div>

                                    {quote.deliveryTerms && (
                                      <p className="text-[10px] text-slate-500 italic bg-amber-50/40 p-2 rounded-lg border border-amber-100">
                                        Terms: "{quote.deliveryTerms}"
                                      </p>
                                    )}
                                  </div>

                                  {/* Select & Confirm Action Button */}
                                  <div>
                                    {isThisSelected ? (
                                      <div className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Vendor Confirmed & Dispatched</span>
                                      </div>
                                    ) : isConfirmed ? (
                                      <div className="w-full py-2 text-center text-slate-400 text-xs font-semibold">
                                        Another quotation was selected for this request
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleSelectVendorQuote(quote, req)}
                                        className="w-full py-3 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 hover:from-amber-600 hover:to-amber-700 text-gold-400 hover:text-white font-display font-black text-xs rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer border border-gold-500/30"
                                      >
                                        <ShoppingBag className="w-4 h-4 text-gold-400 group-hover:text-white transition" />
                                        <span>Select & Confirm Vendor Order</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
