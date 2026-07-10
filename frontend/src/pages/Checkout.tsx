import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft, MapPin, Clock, ArrowRight,
  ShieldCheck, Loader2
} from 'lucide-react';



const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { apiFetch } = useAuth();

  const pricing = location.state || {
    couponCode: null,
    discountAmount: 0,
    subtotal: 0,
    deliveryCharge: 0,
    tax: 0,
    grandTotal: 0
  };

  const [address, setAddress] = useState('');
  const [stateName, setStateName] = useState('');
  const [district, setDistrict] = useState('');
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileAndCart();
  }, []);

  const fetchProfileAndCart = async () => {
    try {
      // 1. Fetch customer details
      await apiFetch('/api/notifications'); // dummy call just to ensure we can hit backend
      // Actually we have direct JWT token, let's fetch customer details via api
      await apiFetch('/api/cart');

      // We need to fetch the customer profile to prefill the address
      const profiles = await apiFetch('/api/orders/my-orders'); // or we can fetch a specific profile endpoint
      // Prefill dummy/default values, then load if any orders exist
      setAddress('12-34 Rythu Bazar Lane, Madikonda');
      setStateName('Telangana');
      setDistrict('Warangal');
      setPincode('506003');
      
      if (profiles && profiles.length > 0) {
        const lastOrder = profiles[0];
        setAddress(lastOrder.shipping_address);
      }
    } catch (err) {
      console.error("Failed to load checkout profile details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPayment = () => {
    if (!address || !stateName || !district || !pincode) {
      alert("Please fill in all address details.");
      return;
    }
    
    const fullShippingAddress = `${address}, ${district}, ${stateName} - ${pincode}`;
    
    navigate('/payment', {
      state: {
        ...pricing,
        shippingAddress: fullShippingAddress
      }
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin h-8 w-8 text-orange-650" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-16">
      
      {/* Navbar */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b dark:border-slate-850">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </button>
        <span className="text-xs font-bold text-slate-450 dark:text-slate-400">Checkout</span>
        <div className="w-16" />
      </nav>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-6 py-8 grid gap-8 md:grid-cols-12">
        
        {/* Left Column: Shipping Address & Summary (Col Span 7) */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b pb-3.5 mb-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              Confirm Delivery Address
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Street Address / House No.
                </label>
                <input
                  type="text"
                  required
                  placeholder="Street details..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs font-semibold py-3 px-4 border rounded-xl bg-slate-50 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    District
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full text-xs font-semibold py-2.5 px-4 border rounded-xl bg-slate-50 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full text-xs font-semibold py-2.5 px-4 border rounded-xl bg-slate-50 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Pincode
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-xs font-semibold py-2.5 px-4 border rounded-xl bg-slate-50 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Schedule Estimate */}
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-655 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Delivery Schedule</h4>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                Your order contains fresh farm produce. Estimated delivery within <b>35-45 minutes</b> at your specified coordinates.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Breakdown & Checkout button (Col Span 5) */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white border-b pb-3 mb-2 flex items-center gap-1.5">
              📋 Payment Details
            </h3>

            <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400 font-semibold">
              <div className="flex justify-between items-center">
                <span>Subtotal</span>
                <span className="text-slate-900 dark:text-white">₹{pricing.subtotal}</span>
              </div>

              {pricing.discountAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-650">
                  <span>Discount Applied ({pricing.couponCode})</span>
                  <span>- ₹{pricing.discountAmount}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span>Delivery Charge</span>
                <span className="text-slate-900 dark:text-white">
                  {pricing.deliveryCharge === 0 ? 'FREE' : `₹${pricing.deliveryCharge}`}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>GST Tax (5%)</span>
                <span className="text-slate-900 dark:text-white">₹{pricing.tax}</span>
              </div>

              <hr className="border-slate-200 dark:border-slate-800" />

              <div className="flex justify-between items-center text-sm font-extrabold text-slate-900 dark:text-white">
                <span>Total Payout</span>
                <span className="text-orange-655 text-base">₹{pricing.grandTotal}</span>
              </div>
            </div>

            <button
              onClick={handleProceedToPayment}
              className="w-full flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold py-3.5 rounded-2xl shadow-md transition-all mt-4 cursor-pointer"
            >
              Proceed to Payment
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Secure transaction assurance banner */}
          <div className="bg-slate-100 dark:bg-slate-900/50 border rounded-2xl p-4 flex items-start gap-2.5 text-[10px] font-bold text-slate-500">
            <ShieldCheck className="h-5 w-5 text-emerald-650 shrink-0 mt-0.5" />
            <p className="leading-normal">
              Secure Direct Pay coordination system. All funds are held in state-regulated Escrow wallets and disbursed to farmers immediately upon confirmed delivery.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Checkout;
