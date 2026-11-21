import React from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck, Building2, MapPin, Phone, Mail } from 'lucide-react';
import { MaterialOrder } from '@ghar-design/shared';

interface TaxInvoiceModalProps {
  order: MaterialOrder | null;
  onClose: () => void;
}

export const TaxInvoiceModal: React.FC<TaxInvoiceModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const invoiceNumber = `INV-${order.orderCode.replace('GHR-ORD-', '')}`;
  const invoiceDate = new Date(order.orderDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const subtotalPaise = order.subtotalPaise || Math.round(order.totalAmountPaise / 1.18);
  const taxPaise = order.taxPaise || (order.totalAmountPaise - subtotalPaise);
  const cgstPaise = Math.round(taxPaise / 2);
  const sgstPaise = taxPaise - cgstPaise;
  const deliveryPaise = order.deliveryFeePaise || 0;
  const grandTotalPaise = order.totalAmountPaise;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 print:border-none print:shadow-none print:rounded-none">
        {/* Header Actions - Hidden on Print */}
        <div className="bg-navy-950 px-6 py-4 flex items-center justify-between text-white print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-display font-black text-sm tracking-wide uppercase text-gold-400">
              GST Tax Invoice & Delivery E-Challan
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-navy-950 text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-navy-900 transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-6 sm:p-10 space-y-6 text-slate-800 text-xs font-sans print:p-8" id="printable-tax-invoice">
          {/* Top Company & Invoice Meta Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-display font-black text-2xl tracking-tight text-navy-950">
                  Ghar<span className="text-gold-600">Design</span>
                </span>
                <span className="px-2 py-0.5 bg-navy-100 text-navy-900 text-[10px] font-bold rounded uppercase tracking-wider">
                  Direct Materials
                </span>
              </div>
              <p className="font-bold text-slate-900 text-sm">BuildGhar Technologies Pvt. Ltd.</p>
              <p className="text-slate-600 text-[11px] leading-relaxed mt-0.5">
                DLF CyberCity, Building 10-C, Phase 2, DLF QE<br />
                Gurugram, Haryana - 122002, India<br />
                CIN: U45200HR2024PTC099812
              </p>
              <div className="mt-2 text-[11px] font-mono font-semibold text-slate-700 space-y-0.5">
                <div>GSTIN: <span className="text-navy-950 font-bold">06AABCB1234F1Z5</span></div>
                <div>State Code: <span className="text-slate-900">06 (Haryana)</span></div>
                <div>Fulfillment Hub: North NCR Central Yard #4</div>
              </div>
            </div>

            <div className="text-left sm:text-right bg-slate-50 border border-slate-200 p-4 rounded-2xl w-full sm:w-auto min-w-[260px]">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gold-600">
                Original For Recipient
              </div>
              <div className="text-lg font-display font-black text-navy-950 mt-1">
                TAX INVOICE
              </div>
              <div className="mt-2 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between sm:justify-end gap-3 text-slate-600">
                  <span>Invoice No:</span>
                  <strong className="text-slate-900 font-bold">{invoiceNumber}</strong>
                </div>
                <div className="flex justify-between sm:justify-end gap-3 text-slate-600">
                  <span>Invoice Date:</span>
                  <strong className="text-slate-900">{invoiceDate}</strong>
                </div>
                <div className="flex justify-between sm:justify-end gap-3 text-slate-600">
                  <span>Order Ref:</span>
                  <strong className="text-navy-950 font-bold">{order.orderCode}</strong>
                </div>
                <div className="flex justify-between sm:justify-end gap-3 text-slate-600">
                  <span>E-Way Bill:</span>
                  <span className="text-slate-700">EWB-8921-7764-9021</span>
                </div>
                <div className="flex justify-between sm:justify-end gap-3 text-slate-600">
                  <span>Transit Tracking:</span>
                  <span className="text-slate-700">{order.trackingNumber || 'TRANSIT-DIRECT'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Delivery Site Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Billed To (Customer Details)
              </span>
              <div className="font-bold text-slate-900 text-sm">
                Project Owner / Client Account
              </div>
              <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                <div>Site Contact: Verified Account</div>
                <div>Billing Address: {order.deliveryAddress?.houseNo || 'Plot 42'}, {order.deliveryAddress?.street || 'Sector 57'}</div>
                <div>{order.deliveryAddress?.city || 'Gurugram'}, {order.deliveryAddress?.state || 'Haryana'} - {order.deliveryAddress?.pinCode || '122003'}</div>
                <div className="mt-1 font-mono text-[10px] text-slate-500">
                  Customer GSTIN: Unregistered Consumer (B2C)
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Shipped To (Construction Site / Offloading Location)
              </span>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gold-600" />
                <span>{order.deliveryAddress?.label || 'Project Site Yard'}</span>
              </div>
              <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                <div>{order.deliveryAddress?.houseNo}, {order.deliveryAddress?.street}</div>
                <div>{order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pinCode}</div>
                <div className="mt-1 font-medium text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Site Verified & Offload Crane Accessible</span>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 text-center w-10">#</th>
                  <th className="py-3 px-4">Item Description</th>
                  <th className="py-3 px-3 text-center">HSN/SAC</th>
                  <th className="py-3 px-3 text-center">Qty & Unit</th>
                  <th className="py-3 px-3 text-right">Taxable Rate</th>
                  <th className="py-3 px-3 text-right">CGST</th>
                  <th className="py-3 px-3 text-right">SGST</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {(order.items || []).map((item, idx) => {
                  const itemTotal = item.totalPaise / 100;
                  const itemTaxable = Math.round((itemTotal / 1.18) * 100) / 100;
                  const itemCgst = Math.round(((itemTotal - itemTaxable) / 2) * 100) / 100;
                  const itemSgst = Math.round((itemTotal - itemTaxable - itemCgst) * 100) / 100;
                  const unitRate = Math.round((itemTaxable / (item.quantity || 1)) * 100) / 100;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          SKU: {item.productId?.substring(0, 12).toUpperCase() || 'MAT-001'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-600">
                        252329
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-700">
                        {item.quantity} {item.unit || 'Units'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        ₹{unitRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500 text-[11px]">
                        ₹{itemCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (9%)
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500 text-[11px]">
                        ₹{itemSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (9%)
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-navy-950 font-mono">
                        ₹{itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}

                {/* Transit Row if applicable */}
                {deliveryPaise > 0 && (
                  <tr className="bg-slate-50/50">
                    <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {order.items.length + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">Heavy Transit & Offload Logistics</div>
                      <div className="text-[10px] text-slate-500">Dedicated heavy flatbed freight to site</div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-600">
                      996511
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-700">
                      1 Trip
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      ₹{((deliveryPaise / 100) / 1.18).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500 text-[11px]">
                      ₹{(((deliveryPaise / 100) * 0.18) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (9%)
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500 text-[11px]">
                      ₹{(((deliveryPaise / 100) * 0.18) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (9%)
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-navy-950 font-mono">
                      ₹{(deliveryPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Tax Breakdown & Grand Total */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
            <div className="space-y-3 sm:max-w-xs text-[11px] text-slate-500">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800">GST Declaration:</div>
                <p>Tax payable under Reverse Charge: <strong>NO</strong></p>
                <p>All prices are inclusive of integrated CGST (9%) and SGST (9%).</p>
              </div>
              <div>
                Payment Mode: <strong className="text-slate-800">{order.paymentMethod || 'Prepaid Razorpay UPI'}</strong>
              </div>
            </div>

            <div className="w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Amount (Excl. Tax):</span>
                <span className="font-mono font-medium">₹{(subtotalPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Central GST (CGST 9%):</span>
                <span className="font-mono font-medium">₹{(cgstPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>State GST (SGST 9%):</span>
                <span className="font-mono font-medium">₹{(sgstPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {deliveryPaise > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Transit Logistics Fee:</span>
                  <span className="font-mono font-medium">₹{(deliveryPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-bold text-navy-950">
                <span className="font-display font-black">Total Invoice Value:</span>
                <span className="font-mono font-black text-base text-gold-600">
                  ₹{(grandTotalPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Signatures & Legal */}
          <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-500">
            <div className="text-center sm:text-left space-y-0.5">
              <div>This is a digitally generated Tax Invoice verified under Rule 46 of CGST Rules 2017.</div>
              <div>GharDesign Materials Direct Fulfillment Network • 24x7 Support: support@ghardesign.in</div>
            </div>

            <div className="text-center sm:text-right">
              <div className="font-bold text-slate-800 text-xs font-display">For BuildGhar Technologies Pvt. Ltd.</div>
              <div className="mt-1 font-mono text-[9px] text-slate-400">Digitally Signed at Billing Terminal</div>
              <div className="text-emerald-700 font-semibold text-[10px] flex items-center justify-center sm:justify-end gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>Authorized Signatory Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
