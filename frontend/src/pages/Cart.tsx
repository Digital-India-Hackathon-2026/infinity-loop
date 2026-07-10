import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ShoppingBag, Trash2, Plus, Minus, ArrowLeft, Tag,
  Truck, ArrowRight, Loader2, Percent
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    original_price: number;
    unit: string;
    stock: number;
    image_url: string;
    farmer_name: string;
    farmer_village: string;
    farmer_district: string;
  };
}

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { apiFetch } = useAuth();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [activeCoupon, setActiveCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/cart');
      setCartItems(data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId: number, newQty: number) => {
    try {
      await apiFetch('/api/cart/items', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, quantity: newQty })
      });
      fetchCartItems();
    } catch (err: any) {
      alert(err.message || "Failed to update quantity.");
    }
  };

  const handleRemoveItem = async (productId: number) => {
    try {
      await apiFetch(`/api/cart/items/${productId}`, { method: 'DELETE' });
      fetchCartItems();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    if (!couponCode) return;

    try {
      const coupon = await apiFetch(`/api/coupons/validate/${couponCode}`);
      
      // Calculate subtotal
      const subtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
      
      if (subtotal < coupon.min_purchase) {
        setCouponError(`Min purchase of ₹${coupon.min_purchase} required for this coupon.`);
        setDiscountAmount(0);
        setActiveCoupon(null);
        return;
      }

      setDiscountAmount(coupon.discount_amount);
      setActiveCoupon(coupon.code);
      confetti({ particleCount: 30, spread: 50, colors: ['#22c55e'] });
    } catch (err: any) {
      setCouponError(err.message || "Invalid coupon code.");
      setDiscountAmount(0);
      setActiveCoupon(null);
    }
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const deliveryCharge = subtotal > 0 && subtotal < 500 ? 40.0 : 0.0;
  const tax = roundToTwo(subtotal * 0.05); // 5% GST
  const grandTotal = roundToTwo(subtotal - discountAmount + deliveryCharge + tax);

  function roundToTwo(num: number) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) return;
    navigate('/checkout', {
      state: {
        couponCode: activeCoupon,
        discountAmount,
        subtotal,
        deliveryCharge,
        tax,
        grandTotal
      }
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin h-8 w-8 text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-16">
      
      {/* Navbar */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b dark:border-slate-850">
        <button
          onClick={() => navigate('/customer-dashboard')}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue Shopping
        </button>
        <span className="text-xs font-bold text-slate-450 dark:text-slate-400">Shopping Cart</span>
        <div className="w-16" />
      </nav>

      {/* Cart Container */}
      <div className="max-w-6xl mx-auto px-6 py-8 grid gap-8 md:grid-cols-12">
        
        {/* Left: Cart Items List (Col Span 8) */}
        <div className="md:col-span-8 space-y-6">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            🛒 Your Shopping Cart
            <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-450 px-2 py-0.5 rounded-full font-bold">
              {cartItems.length} items
            </span>
          </h2>

          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                {/* Item Thumbnail */}
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="h-16 w-16 bg-slate-550 rounded-2xl overflow-hidden shrink-0">
                    <img
                      src={item.product.image_url || 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=200'}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {item.product.name}
                    </h4>
                    <p className="text-[10px] text-slate-405 font-bold uppercase">
                      By Farmer: <b>{item.product.farmer_name}</b> ({item.product.farmer_village})
                    </p>
                    <p className="text-xs text-orange-655 font-bold mt-0.5">
                      ₹{item.product.price} / {item.product.unit}
                    </p>
                  </div>
                </div>

                {/* Quantity adjust & Delete */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                  <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 p-1">
                    <button
                      onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-900 rounded-lg text-slate-500 cursor-pointer"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs font-extrabold px-3 text-slate-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-900 rounded-lg text-slate-500 disabled:opacity-30 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="text-right w-20">
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                      ₹{roundToTwo(item.product.price * item.quantity)}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRemoveItem(item.product_id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>

              </div>
            ))}

            {cartItems.length === 0 && (
              <div className="text-center py-20 bg-white dark:bg-slate-900 border rounded-3xl text-slate-400 font-bold">
                <ShoppingBag className="h-12 w-12 mx-auto opacity-35 mb-2" />
                <p>Your shopping cart is empty.</p>
                <button
                  onClick={() => navigate('/customer-dashboard')}
                  className="text-xs text-orange-655 font-bold hover:underline mt-2 cursor-pointer"
                >
                  Start shopping now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Pricing Summary (Col Span 4) */}
        <div className="md:col-span-4 space-y-6">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Order Summary</h3>

          {/* Coupon applying box */}
          {cartItems.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-sm space-y-3">
              <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Tag className="h-4 w-4 text-orange-600" />
                Have a coupon code?
              </p>
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. F2G50, DIWALI100"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full text-xs font-semibold py-2 px-3.5 border rounded-xl bg-slate-50 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </form>
              {couponError && <p className="text-[10px] text-red-500 font-bold">{couponError}</p>}
              {activeCoupon && (
                <p className="text-[10px] text-emerald-650 font-bold flex items-center gap-1">
                  <Percent className="h-3 w-3 shrink-0" />
                  Code '{activeCoupon}' applied successfully!
                </p>
              )}
            </div>
          )}

          {/* Pricing breakdowns card */}
          {cartItems.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-sm space-y-4 font-semibold text-slate-650 dark:text-slate-350">
              <div className="flex justify-between items-center text-xs">
                <span>Subtotal</span>
                <span className="text-slate-900 dark:text-white">₹{subtotal}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-xs text-emerald-650">
                  <span>Coupon Discount</span>
                  <span>- ₹{discountAmount}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-xs">
                <span>Delivery Charges</span>
                <span className="text-slate-900 dark:text-white">
                  {deliveryCharge === 0 ? (
                    <span className="text-emerald-600 font-extrabold uppercase text-[10px]">Free</span>
                  ) : (
                    `₹${deliveryCharge}`
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span>GST / Taxes (5%)</span>
                <span className="text-slate-900 dark:text-white">₹{tax}</span>
              </div>

              <hr className="border-slate-200 dark:border-slate-800" />

              <div className="flex justify-between items-center text-sm font-extrabold text-slate-900 dark:text-white">
                <span>Grand Total</span>
                <span className="text-orange-655 text-base">₹{grandTotal}</span>
              </div>

              {subtotal < 500 && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-[9px] font-bold text-orange-850 flex items-center gap-1 leading-tight">
                  <Truck className="h-4.5 w-4.5 text-orange-600 shrink-0" />
                  Add ₹{500 - subtotal} more of products to enjoy FREE delivery!
                </div>
              )}

              <button
                onClick={handleProceedToCheckout}
                className="w-full flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold py-3.5 rounded-2xl shadow-md transition-all cursor-pointer"
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default Cart;
