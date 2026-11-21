mat_path = r"C:\Users\HP\.gemini\antigravity\scratch\ghar-design\apps\web\src\pages\admin\AdminMaterialOrders.tsx"
with open(mat_path, "r", encoding="utf-8") as f:
    txt = f.read()

# 1. Add ArrowRight, Check to imports
if "ArrowRight," not in txt:
    txt = txt.replace("ArrowLeft,\n  Truck,", "ArrowLeft,\n  ArrowRight,\n  Check,\n  Truck,")

# 2. Add orderStep state
if "const [orderStep, setOrderStep]" not in txt:
    txt = txt.replace(
        "const [showAddOrderModal, setShowAddOrderModal] = useState(false);",
        "const [showAddOrderModal, setShowAddOrderModal] = useState(false);\n  const [orderStep, setOrderStep] = useState<number>(1);"
    )

old_start = "{/* Add Order Modal */}\n      {showAddOrderModal && ("
old_end = "\n    </div>\n  );\n};"

start_idx = txt.find(old_start)
end_idx = txt.rfind(old_end)

if start_idx == -1 or end_idx == -1:
    print(f"Could not find markers: start={start_idx}, end={end_idx}")
else:
    new_modal = """{/* Add Order Modal (Stepper Wizard) */}
      {showAddOrderModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddOrderModal(false);
                  setOrderStep(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back / Cancel</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Create Direct Material Order
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Step {orderStep} of 4 • Wholesale Building Materials Fulfillment
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddOrderModal(false);
                  setOrderStep(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1100px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Stepper Header */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-blue-200/80 shadow-sm">
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                {[
                  { step: 1, title: 'Customer & Site', icon: User },
                  { step: 2, title: 'Materials & Specs', icon: Package },
                  { step: 3, title: 'Payment & Logistics', icon: Truck },
                  { step: 4, title: 'Review & Dispatch', icon: CheckCircle2 },
                ].map((item, idx, arr) => (
                  <div key={item.step} className="flex items-center flex-1 last:flex-none">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.step < orderStep) setOrderStep(item.step);
                      }}
                      className="flex flex-col items-center gap-1 group text-center cursor-pointer"
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition ${
                          orderStep === item.step
                            ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100'
                            : orderStep > item.step
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {orderStep > item.step ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <item.icon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-bold mt-1 transition ${
                          orderStep === item.step
                            ? 'text-blue-900'
                            : orderStep > item.step
                            ? 'text-emerald-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {item.title}
                      </span>
                    </button>
                    {idx < arr.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-3 mb-5 transition ${
                          orderStep > item.step ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stepper Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
              <form onSubmit={handleCreateOrder}>
                {/* STEP 1: CUSTOMER & SITE */}
                {orderStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 1 of 4</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Homeowner & Unloading Site Destination
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Specify customer name, verified delivery mobile, and exact site GPS destination.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <User className="w-4 h-4 text-blue-600" />
                          <span>Customer Full Name</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Ramesh Chandra"
                          value={newOrder.customerName}
                          onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-blue-600" />
                          <span>Customer Mobile Number</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-xs">+91</span>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            placeholder="10-digit number"
                            value={newOrder.customerPhone}
                            onChange={(e) => setNewOrder({ ...newOrder, customerPhone: e.target.value })}
                            className="w-full pl-14 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Plot / House No. <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Plot 42"
                          value={newOrder.houseNo}
                          onChange={(e) => setNewOrder({ ...newOrder, houseNo: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Street / Sector <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sector 57, Golf Course Extension"
                          value={newOrder.street}
                          onChange={(e) => setNewOrder({ ...newOrder, street: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">City <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Gurugram"
                          value={newOrder.city}
                          onChange={(e) => setNewOrder({ ...newOrder, city: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">PIN Code <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="e.g. 122002"
                          value={newOrder.pinCode}
                          onChange={(e) => setNewOrder({ ...newOrder, pinCode: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: MATERIALS & SPECS */}
                {orderStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 2 of 4</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Building Materials & Bill of Quantities
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Select product SKU, manufacturer brand, quantity, and unit rate.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span>Product / Material Name</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. UltraTech Weather Plus Cement 50kg"
                          value={newOrder.productName}
                          onChange={(e) => setNewOrder({ ...newOrder, productName: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Manufacturer / Brand</label>
                        <input
                          type="text"
                          placeholder="e.g. UltraTech, Tata Tiscon, Jindal Panther"
                          value={newOrder.brand}
                          onChange={(e) => setNewOrder({ ...newOrder, brand: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Order Quantity <span className="text-rose-500">*</span></label>
                        <input
                          type="number"
                          min="1"
                          value={newOrder.quantity}
                          onChange={(e) => setNewOrder({ ...newOrder, quantity: Number(e.target.value) })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Unit of Measure</label>
                        <select
                          value={newOrder.unit}
                          onChange={(e) => setNewOrder({ ...newOrder, unit: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="Bags">Bags (50kg)</option>
                          <option value="Tonnes">Tonnes (MT)</option>
                          <option value="Pieces">Pieces / Blocks</option>
                          <option value="Brass">Brass (100 cu ft)</option>
                          <option value="Sq.Ft">Sq. Ft (Tiles/Granite)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="font-bold text-slate-800 text-sm">Unit Wholesale Price (₹) <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-xs">₹</span>
                          <input
                            type="number"
                            min="1"
                            value={newOrder.unitPriceRupees}
                            onChange={(e) => setNewOrder({ ...newOrder, unitPriceRupees: Number(e.target.value) })}
                            className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: PAYMENT & LOGISTICS */}
                {orderStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 3 of 4</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Fulfillment Gateway & Dispatch Status
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Set payment collection state and warehouse fulfillment priority.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Payment Status <span className="text-rose-500">*</span></label>
                        <select
                          value={newOrder.paymentStatus}
                          onChange={(e) => setNewOrder({ ...newOrder, paymentStatus: e.target.value as any })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="PAYMENT_SUCCESSFUL">Payment Successful (Prepaid Online)</option>
                          <option value="PENDING_COLLECTION">Pending Collection (COD / Escrow Pending)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Delivery Status <span className="text-rose-500">*</span></label>
                        <select
                          value={newOrder.fulfillmentStatus}
                          onChange={(e) => setNewOrder({ ...newOrder, fulfillmentStatus: e.target.value as any })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="CONFIRMED">CONFIRMED (Allocated at Warehouse)</option>
                          <option value="DISPATCHED">DISPATCHED (In Transit on Flatbed)</option>
                          <option value="DELIVERED">DELIVERED (Offloaded at Site)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: REVIEW & DISPATCH */}
                {orderStep === 4 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 4 of 4</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Commercial Invoice Breakdown & Order Dispatch
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Review materials consignment totals and confirm order creation.
                      </p>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Customer</span>
                        <p className="text-sm font-bold text-navy-950 mt-0.5">{newOrder.customerName} (+91 {newOrder.customerPhone})</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Consignment Item</span>
                        <p className="text-sm font-bold text-blue-900 mt-0.5">{newOrder.productName} ({newOrder.brand})</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Quantity & Rate</span>
                        <p className="text-xs font-bold text-slate-800 mt-0.5">{newOrder.quantity} {newOrder.unit} @ ₹{newOrder.unitPriceRupees}/{newOrder.unit}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Delivery Site</span>
                        <p className="text-xs font-semibold text-slate-700 mt-0.5">{newOrder.houseNo}, {newOrder.street}, {newOrder.city} ({newOrder.pinCode})</p>
                      </div>
                    </div>

                    {/* Financial Totals */}
                    <div className="p-5 bg-navy-950 text-white rounded-2xl space-y-2 text-xs font-mono shadow-lg">
                      <div className="flex justify-between text-slate-300">
                        <span>Materials Subtotal:</span>
                        <span>{formatINR(Math.round((newOrder.unitPriceRupees || 0) * (newOrder.quantity || 1) * 100))}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>GST (18% Construction Goods):</span>
                        <span>{formatINR(Math.round((newOrder.unitPriceRupees || 0) * (newOrder.quantity || 1) * 18))}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Hydraulic Flatbed Offloading:</span>
                        <span>{formatINR(150000)}</span>
                      </div>
                      <div className="flex justify-between font-black text-sm pt-2 border-t border-slate-700 text-amber-400">
                        <span>Total Payable Value:</span>
                        <span className="text-base font-bold">
                          {formatINR(Math.round((newOrder.unitPriceRupees || 0) * (newOrder.quantity || 1) * 118 + 150000))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Footer */}
                <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-200 mt-6">
                  {orderStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setOrderStep(orderStep - 1)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition flex items-center gap-2 text-xs cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Previous Step</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddOrderModal(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-100 transition text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}

                  <div className="text-xs text-slate-400 font-mono hidden sm:block">
                    Step {orderStep} of 4
                  </div>

                  {orderStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (orderStep === 1) {
                          if (!newOrder.customerName.trim()) {
                            error('Please enter the customer name');
                            return;
                          }
                          const clean = newOrder.customerPhone.replace(/\\D/g, '').slice(-10);
                          if (clean.length !== 10) {
                            error('Please enter a valid 10-digit mobile number');
                            return;
                          }
                        } else if (orderStep === 2) {
                          if (!newOrder.productName.trim()) {
                            error('Please enter the product name');
                            return;
                          }
                        }
                        setOrderStep(orderStep + 1);
                      }}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <span>Proceed to Step {orderStep + 1}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Record & Dispatch Order</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};"""

    txt = txt[:start_idx] + new_modal + txt[end_idx + len(old_end):]
    with open(mat_path, "w", encoding="utf-8") as f:
        f.write(txt)
    print("Successfully updated AdminMaterialOrders.tsx with Stepper Wizard!")
