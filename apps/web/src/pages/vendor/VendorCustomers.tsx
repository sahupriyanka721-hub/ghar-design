import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  MessageSquare,
  Star,
  ShoppingBag,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  Send,
  X,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  getVendorOrders,
  getVendorCustomerQueries,
  replyToCustomerQuery,
  getVendorProductReviews,
  respondToProductReview,
} from '../../data/vendorStore.js';
import { VendorCustomerQuery, VendorProductReview } from '@ghar-design/shared';

export const VendorCustomers: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const vendorId = user?.id || 'vnd-delhi-1';

  const [activeTab, setActiveTab] = useState<'BUYERS' | 'QUERIES' | 'REVIEWS'>('BUYERS');
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Reply to Query Modal
  const [selectedQuery, setSelectedQuery] = useState<VendorCustomerQuery | null>(null);
  const [replyText, setReplyText] = useState('');

  // Respond to Review Modal
  const [selectedReview, setSelectedReview] = useState<VendorProductReview | null>(null);
  const [reviewReplyText, setReviewReplyText] = useState('');

  // Selected customer history
  const [viewCustomerHistory, setViewCustomerHistory] = useState<any | null>(null);

  // Load orders to isolate customers who ordered from THIS vendor
  const orders = useMemo(() => {
    return getVendorOrders(user?.phone || vendorId);
  }, [user?.phone, vendorId, refreshKey]);

  // Derive unique customers strictly from this vendor's sub-orders
  const vendorCustomers = useMemo(() => {
    const map = new Map<string, any>();
    orders.forEach((ord) => {
      const key = ord.customerPhone || ord.customerName;
      if (!map.has(key)) {
        map.set(key, {
          id: `cust-${key}`,
          name: ord.customerName,
          phone: ord.customerPhone,
          city: ord.deliveryAddress?.city || 'Delhi NCR',
          address: `${ord.deliveryAddress?.houseNo || ''} ${ord.deliveryAddress?.street || ''}`.trim(),
          orderCount: 1,
          totalSpentPaise: ord.totalAmountPaise || 0,
          lastOrderDate: ord.createdAt,
          orders: [ord],
        });
      } else {
        const existing = map.get(key);
        existing.orderCount += 1;
        existing.totalSpentPaise += ord.totalAmountPaise || 0;
        existing.orders.push(ord);
        if (new Date(ord.createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = ord.createdAt;
        }
      }
    });
    return Array.from(map.values());
  }, [orders]);

  const queries = useMemo(() => {
    return getVendorCustomerQueries(vendorId);
  }, [vendorId, refreshKey]);

  const reviews = useMemo(() => {
    return getVendorProductReviews(vendorId);
  }, [vendorId, refreshKey]);

  const filteredCustomers = useMemo(() => {
    return vendorCustomers.filter((c) => {
      return (
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.city.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [vendorCustomers, search]);

  const filteredQueries = useMemo(() => {
    return queries.filter((q) => {
      return (
        q.customerName.toLowerCase().includes(search.toLowerCase()) ||
        q.queryText.toLowerCase().includes(search.toLowerCase()) ||
        (q.productName && q.productName.toLowerCase().includes(search.toLowerCase()))
      );
    });
  }, [queries, search]);

  const handleSendQueryReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuery || !replyText.trim()) return;

    replyToCustomerQuery(selectedQuery.id, replyText.trim());
    success('Reply dispatched to customer!');
    setSelectedQuery(null);
    setReplyText('');
    setRefreshKey((k) => k + 1);
  };

  const handleSendReviewReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview || !reviewReplyText.trim()) return;

    respondToProductReview(selectedReview.id, reviewReplyText.trim());
    success('Official vendor response posted publicly on review!');
    setSelectedReview(null);
    setReviewReplyText('');
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-blue-200/80/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-500/10 text-blue-700 rounded-xl">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-display text-navy-950">
              Customer Management & Relations
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Verified buyers who ordered from your depot, pre-purchase inquiries and authentic product reviews.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-50/30 border border-blue-200/80 rounded-xl text-xs font-bold text-slate-700">
            Total Depot Buyers: <span className="font-mono font-black text-blue-700">{vendorCustomers.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="bg-white p-4 rounded-2xl border border-blue-200/80/90 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('BUYERS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'BUYERS'
                  ? 'bg-navy-950 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Verified Buyers ({vendorCustomers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('QUERIES')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'QUERIES'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Customer Queries ({queries.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('REVIEWS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'REVIEWS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-blue-200 hover:bg-amber-100'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Ratings & Reviews ({reviews.length})</span>
            </button>
          </div>

          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, query, phone..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-sky-50/30 border border-blue-200/80 rounded-xl focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>
        </div>

        {/* TAB 1: BUYERS TABLE */}
        {activeTab === 'BUYERS' && (
          <div className="overflow-x-auto rounded-xl border border-blue-200/80">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-sky-50/30 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-blue-200/80">
                <tr>
                  <th className="py-3 px-3.5">Customer Name</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Delivery City</th>
                  <th className="py-3 px-3 text-center">Orders Placed</th>
                  <th className="py-3 px-3 text-right">Total Business</th>
                  <th className="py-3 px-3">Last Order</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-slate-600">No depot customers found.</p>
                      <p className="text-[11px] mt-0.5">Customers who purchase materials from you will be isolated here.</p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-blue-50/70 transition">
                      <td className="py-3 px-3.5">
                        <strong className="text-slate-900 block">{c.name}</strong>
                        <span className="text-[10px] text-slate-400">Verified Site Owner</span>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-600">
                        {c.phone}
                      </td>

                      <td className="py-3 px-3 text-slate-700">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{c.city}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-blue-700">
                        {c.orderCount} order{c.orderCount > 1 ? 's' : ''}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900 text-sm">
                        {formatINR(c.totalSpentPaise)}
                      </td>

                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {formatDate(c.lastOrderDate)}
                      </td>

                      <td className="py-3 px-3.5 text-right">
                        <button
                          onClick={() => setViewCustomerHistory(c)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Order History</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: QUERIES */}
        {activeTab === 'QUERIES' && (
          <div className="space-y-3">
            {filteredQueries.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-600">No customer questions or inquiries right now.</p>
              </div>
            ) : (
              filteredQueries.map((q) => (
                <div key={q.id} className="p-4 bg-sky-50/30 border border-blue-200/80 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <strong>{q.customerName}</strong>
                      {q.productName && (
                        <span className="text-slate-500 text-[11px]">regarding {q.productName}</span>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        q.status === 'REPLIED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>

                  <p className="text-slate-700 text-xs italic">"{q.queryText}"</p>

                  {q.replyText ? (
                    <div className="p-3 bg-white border border-blue-200/80 rounded-lg mt-2 text-slate-800">
                      <span className="text-[10px] font-bold text-blue-700 block uppercase">YOUR DEPOT REPLY:</span>
                      <p className="mt-0.5">{q.replyText}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedQuery(q);
                        setReplyText('');
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Send className="w-3 h-3" />
                      <span>Reply to Customer</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: REVIEWS */}
        {activeTab === 'REVIEWS' && (
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Star className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-600">No verified product reviews yet.</p>
              </div>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="p-4 bg-sky-50/30 border border-blue-200/80 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-bold text-slate-900">{r.reviewTitle}</span>
                      </div>
                      <span className="text-slate-500 text-[11px] block mt-0.5">
                        By {r.customerName} on {r.productName}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-bold">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Verified Buyer</span>
                    </span>
                  </div>

                  <p className="text-slate-700">{r.reviewComment}</p>

                  {r.vendorResponse ? (
                    <div className="p-3 bg-white border border-blue-200/80 rounded-lg text-slate-800">
                      <span className="text-[10px] font-bold text-slate-500 block uppercase">DEPOT RESPONSE:</span>
                      <p className="mt-0.5">{r.vendorResponse}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedReview(r);
                        setReviewReplyText('');
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <span>Post Official Response</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* MODAL: REPLY TO CUSTOMER QUERY */}
      <AnimatePresence>
        {selectedQuery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-blue-200/80 shadow-2xl max-w-md w-full overflow-hidden text-xs"
            >
              <div className="p-4 bg-sky-50/30 border-b border-blue-200/80 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-navy-950">Reply to Inquiry</h3>
                  <p className="text-[11px] text-slate-500">From {selectedQuery.customerName}</p>
                </div>
                <button
                  onClick={() => setSelectedQuery(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendQueryReply} className="p-5 space-y-4">
                <div className="p-3 bg-sky-50/30 rounded-xl border border-blue-200/80">
                  <span className="text-slate-400 text-[10px] block uppercase font-bold">CUSTOMER QUERY</span>
                  <p className="font-medium text-slate-800 mt-1">{selectedQuery.queryText}</p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Your Response *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide clear details regarding material specs, loading time or bulk discounts..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setSelectedQuery(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reply</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: RESPOND TO PRODUCT REVIEW */}
      <AnimatePresence>
        {selectedReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-blue-200/80 shadow-2xl max-w-md w-full overflow-hidden text-xs"
            >
              <div className="p-4 bg-sky-50/30 border-b border-blue-200/80 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-navy-950">Official Depot Review Response</h3>
                  <p className="text-[11px] text-slate-500">For {selectedReview.productName}</p>
                </div>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendReviewReply} className="p-5 space-y-4">
                <div className="p-3 bg-sky-50/30 rounded-xl border border-blue-200/80 space-y-1">
                  <strong className="block text-slate-900">{selectedReview.reviewTitle}</strong>
                  <p className="text-slate-600">{selectedReview.reviewComment}</p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Official Response *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Thank the homeowner or address any feedback professionally..."
                    value={reviewReplyText}
                    onChange={(e) => setReviewReplyText(e.target.value)}
                    className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setSelectedReview(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:to-blue-600 text-white rounded-xl font-bold shadow-md"
                  >
                    Publish Response
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CUSTOMER ORDER HISTORY */}
      <AnimatePresence>
        {viewCustomerHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-blue-200/80 shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden text-xs"
            >
              <div className="p-4 bg-sky-50/30 border-b border-blue-200/80 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-navy-950">{viewCustomerHistory.name} - Order History</h3>
                  <p className="text-[11px] text-slate-500">Phone: {viewCustomerHistory.phone}</p>
                </div>
                <button
                  onClick={() => setViewCustomerHistory(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-3">
                {(viewCustomerHistory.orders || []).map((ord: any) => (
                  <div key={ord.id} className="p-3 bg-sky-50/30 border border-blue-200/80 rounded-xl space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span className="font-mono">{ord.orderCode}</span>
                      <span className="font-mono text-emerald-700">{formatINR(ord.totalAmountPaise)}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Date: {formatDate(ord.createdAt)} | Status: <strong>{ord.fulfillmentStatus}</strong>
                    </div>
                    <div className="text-[11px] text-slate-700 font-medium">
                      {(ord.items || []).map((it: any) => `${it.name} (${it.quantity} ${it.unit})`).join(', ')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-sky-50/30 border-t border-blue-200/80 flex justify-end">
                <button
                  onClick={() => setViewCustomerHistory(null)}
                  className="px-4 py-2 bg-navy-950 text-white rounded-xl font-bold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
