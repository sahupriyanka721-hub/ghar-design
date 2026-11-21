import React, { useState } from 'react';
import {
  X,
  Truck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  ArrowRight,
  Package,
  Layers,
  Award,
  RotateCcw,
  Building,
} from 'lucide-react';
import { MaterialProductItem, MaterialProductVariant } from '../../data/materialsCatalog.js';

interface ProductDetailsModalProps {
  product: MaterialProductItem | null;
  onClose: () => void;
  onAddToCart: (product: MaterialProductItem, quantity: number, variant?: MaterialProductVariant) => void;
  onBuyNow: (product: MaterialProductItem, quantity: number, variant?: MaterialProductVariant) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
}) => {
  const [selectedVariant, setSelectedVariant] = useState<MaterialProductVariant | undefined>(
    product?.variants && product.variants.length > 0 ? product.variants[0] : undefined
  );
  const [selectedImage, setSelectedImage] = useState<string>(product?.imageUrl || '');
  const [quantity, setQuantity] = useState<number>(1);

  if (!product) return null;

  const basePrice = product.pricePaise;
  const variantModifier = selectedVariant ? selectedVariant.priceModifierPaise : 0;
  const currentUnitPricePaise = basePrice + variantModifier;
  const lineTotalPaise = currentUnitPricePaise * quantity;

  const handleQtyChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty >= 1) {
      if (!product.maxOrderQuantity || newQty <= product.maxOrderQuantity) {
        setQuantity(newQty);
      }
    }
  };

  const handleDirectInput = (val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1) {
      setQuantity(Math.min(product.maxOrderQuantity || 9999, num));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider bg-slate-200/70 px-2 py-0.5 rounded">
              SKU: {product.sku}
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              HSN: {product.hsnCode}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-8 text-xs font-sans">
          {/* Left Column: Gallery & Visuals (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm relative group">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&w=800&q=80';
                }}
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white/95 backdrop-blur-sm text-navy-950 font-bold text-[11px] shadow-sm">
                {product.brand}
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {product.galleryImages && product.galleryImages.length > 1 && (
              <div className="flex gap-2">
                {(product.galleryImages || []).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className={`w-16 h-14 rounded-xl overflow-hidden border-2 transition ${
                      selectedImage === img ? 'border-navy-950 ring-2 ring-gold-400' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Quality & Delivery Assurance Pills */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5 text-slate-600 text-[11px]">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Tested Genuine Material Guaranteed</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Transit Truck Dispatch: <strong>{product.deliveryDays} Business Days</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-purple-600 shrink-0" />
                <span>{product.returnEligible ? '48-Hour Offloading Damage Replacement' : 'Non-Returnable Bulk Material'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Specifications, Variants & Actions (7 cols) */}
          <div className="md:col-span-7 space-y-6">
            {/* Title & Brand */}
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-gold-600 uppercase tracking-wider mb-1">
                <span>{product.manufacturer}</span>
                <span>•</span>
                <span className="text-slate-400">{product.subcategory}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-display text-navy-950 leading-tight">
                {product.name}
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Pricing Section with GST and Unit */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-baseline justify-between">
              <div>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-2xl sm:text-3xl font-black font-display text-navy-950">
                    ₹{(currentUnitPricePaise / 100).toLocaleString('en-IN')}
                  </span>
                  {product.originalPricePaise > currentUnitPricePaise && (
                    <span className="text-sm line-through text-slate-400 font-semibold">
                      ₹{(product.originalPricePaise / 100).toLocaleString('en-IN')}
                    </span>
                  )}
                  <span className="text-xs text-slate-600 font-bold">
                    per {product.unit}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Inclusive of {product.gstRatePercent}% GST • Official Weighbridge & Mill Test Certificate Provided
                </div>
              </div>

              {product.inStock ? (
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-300 shrink-0">
                  In Stock ({product.stockQuantity})
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px] border border-rose-300 shrink-0">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Variant Selector (If available) */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2">
                <label className="font-bold text-slate-800 flex items-center justify-between text-xs">
                  <span>Select Model / Specification Variant:</span>
                  <span className="text-gold-600 font-semibold">{selectedVariant?.name}</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(product.variants || []).map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`p-3 rounded-xl border text-left transition ${
                        selectedVariant?.id === v.id
                          ? 'border-navy-950 bg-navy-50/60 ring-2 ring-navy-950 font-bold text-navy-950'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium'
                      }`}
                    >
                      <div className="text-xs truncate">{v.name}</div>
                      {v.priceModifierPaise !== 0 && (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {v.priceModifierPaise > 0 ? `+ ₹${v.priceModifierPaise / 100}` : `- ₹${Math.abs(v.priceModifierPaise) / 100}`}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Specifications Details */}
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <span className="font-bold text-slate-800 block text-xs">Technical Specifications & Project Data:</span>
              <p className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-slate-700 text-xs leading-relaxed font-mono">
                {product.specifications}
              </p>

              {/* Civil Construction Suitability & Site Engineering Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/60 text-blue-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-blue-900">
                    <Building className="w-3.5 h-3.5 text-blue-600" />
                    <span>Project Applicability</span>
                  </div>
                  <p className="text-[10px] text-blue-800 leading-normal">
                    Designed for {product.materialGrade || 'Standard'} residential & commercial construction, high-rise frames & villa projects.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-amber-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-900">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>Compliance & Lab Test</span>
                  </div>
                  <p className="text-[10px] text-amber-800 leading-normal">
                    BIS/IS certified batch with physical weighbridge slip and chemical test certificate on delivery.
                  </p>
                </div>
              </div>
            </div>

            {/* Quantity Selector & Order Limits */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Order Quantity</span>
                  <span className="text-[11px] text-slate-500">
                    Unit: <strong>{product.unit}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleQtyChange(-1)}
                    disabled={quantity <= 1}
                    title={quantity <= 1 ? 'Minimum 1 unit required' : 'Decrease quantity'}
                    className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={product.maxOrderQuantity || 9999}
                    value={quantity}
                    onChange={(e) => handleDirectInput(e.target.value)}
                    className="w-16 text-center font-bold font-mono text-sm bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleQtyChange(1)}
                    title="Increase quantity"
                    className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 active:scale-95 transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Line Total preview */}
              <div className="text-right text-xs pt-1">
                <span className="text-slate-500">Total Item Cost: </span>
                <strong className="text-navy-950 font-display text-base">
                  ₹{(lineTotalPaise / 100).toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            {/* Action Buttons: Add to Cart & Buy Now */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onAddToCart(product, quantity, selectedVariant);
                  onClose();
                }}
                className="py-3 px-4 rounded-xl border-2 border-navy-950 text-navy-950 font-bold text-xs hover:bg-slate-100 transition flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onBuyNow(product, quantity, selectedVariant);
                }}
                className="btn-gold py-3 px-4 rounded-xl text-xs font-black shadow-md flex items-center justify-center"
              >
                <span>Buy Now (Direct Checkout)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
