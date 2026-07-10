import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CreditCard, Landmark, Smartphone, DollarSign,
  CheckCircle2, Printer, Loader2, ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { apiFetch } = useAuth();

  const roundToTwo = (num: number) => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  };

  useEffect(() => {
    if (location.state?.successOverride && location.state?.orderId) {
      setLoading(true);
      apiFetch(`/api/orders/${location.state.orderId}`)
        .then(res => {
          setCreatedOrder(res);
          setSuccess(true);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [location.state]);

  const orderData = location.state || {
    couponCode: null,
    discountAmount: 0,
    subtotal: 0,
    deliveryCharge: 0,
    tax: 0,
    grandTotal: 0,
    shippingAddress: 'Warangal, Telangana'
  };

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking' | 'Cash on Delivery'>('UPI');
  const [upiId, setUpiId] = useState('ramesh@okaxis');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          shipping_address: orderData.shippingAddress,
          coupon_code: orderData.couponCode,
          payment_method: paymentMethod,
          upi_id: paymentMethod === 'UPI' ? upiId : null,
          card_number: ['Credit Card', 'Debit Card'].includes(paymentMethod) ? cardNumber : null
        })
      });
      setCreatedOrder(res);
      setSuccess(true);
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    } catch (err: any) {
      alert(err.message || "Failed to process payment.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-16">
      
      {/* Navbar (hide on print) */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b dark:border-slate-850 print:hidden">
        <button
          onClick={() => navigate('/checkout')}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Address
        </button>
        <span className="text-xs font-bold text-slate-450 dark:text-slate-400">Payment Gateways</span>
        <div className="w-16" />
      </nav>

      {/* Main payment block */}
      <div className="max-w-4xl mx-auto px-6 py-8 print:p-0">
        <AnimatePresence mode="wait">
          {!success ? (
            /* PAYMENT SELECTION SCREEN */
            <motion.div
              key="payment-selection"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid gap-8 md:grid-cols-12"
            >
              {/* Payment Methods selector (Col Span 7) */}
              <div className="md:col-span-7 space-y-6">
                <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b pb-3 mb-2 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-orange-600" />
                    Select Payment Method
                  </h3>

                  <div className="space-y-3">
                    {/* UPI */}
                    <label className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all ${
                      paymentMethod === 'UPI' ? 'border-orange-500 bg-orange-50/10' : 'border-slate-100 hover:bg-slate-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'UPI'}
                          onChange={() => setPaymentMethod('UPI')}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-xs font-extrabold flex items-center gap-1.5">
                          <Smartphone className="h-4.5 w-4.5 text-slate-500" />
                          Unified Payments Interface (UPI)
                        </span>
                      </div>
                      <span className="text-[10px] text-orange-600 font-extrabold">Popular</span>
                    </label>

                    {/* Credit Card */}
                    <label className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all ${
                      paymentMethod === 'Credit Card' ? 'border-orange-500 bg-orange-50/10' : 'border-slate-100 hover:bg-slate-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'Credit Card'}
                          onChange={() => setPaymentMethod('Credit Card')}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-xs font-extrabold flex items-center gap-1.5">
                          <CreditCard className="h-4.5 w-4.5 text-slate-500" />
                          Credit Card
                        </span>
                      </div>
                    </label>

                    {/* Debit Card */}
                    <label className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all ${
                      paymentMethod === 'Debit Card' ? 'border-orange-500 bg-orange-50/10' : 'border-slate-100 hover:bg-slate-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'Debit Card'}
                          onChange={() => setPaymentMethod('Debit Card')}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-xs font-extrabold flex items-center gap-1.5">
                          <CreditCard className="h-4.5 w-4.5 text-slate-500" />
                          Debit Card
                        </span>
                      </div>
                    </label>

                    {/* Net Banking */}
                    <label className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all ${
                      paymentMethod === 'Net Banking' ? 'border-orange-500 bg-orange-50/10' : 'border-slate-100 hover:bg-slate-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'Net Banking'}
                          onChange={() => setPaymentMethod('Net Banking')}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-xs font-extrabold flex items-center gap-1.5">
                          <Landmark className="h-4.5 w-4.5 text-slate-500" />
                          Net Banking
                        </span>
                      </div>
                    </label>

                    {/* Cash on Delivery */}
                    <label className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all ${
                      paymentMethod === 'Cash on Delivery' ? 'border-orange-500 bg-orange-50/10' : 'border-slate-100 hover:bg-slate-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'Cash on Delivery'}
                          onChange={() => setPaymentMethod('Cash on Delivery')}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-xs font-extrabold flex items-center gap-1.5">
                          <DollarSign className="h-4.5 w-4.5 text-slate-500" />
                          Cash on Delivery (COD)
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Sub-panels depending on method selected */}
                <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-sm">
                  {paymentMethod === 'UPI' && (
                    <div className="space-y-3">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Virtual Payment Address (VPA) / UPI ID</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full text-xs font-semibold py-3 px-4 border rounded-xl bg-slate-50 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  )}

                  {['Credit Card', 'Debit Card'].includes(paymentMethod) && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Card Number</label>
                        <input
                          type="text"
                          placeholder="1234 5678 9101 1121"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').substring(0, 16))}
                          className="w-full text-xs font-semibold py-3 px-4 border rounded-xl bg-slate-50 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Expiry Date</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full text-xs font-semibold py-2.5 px-4 border rounded-xl bg-slate-50 focus:outline-none focus:border-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">CVV</label>
                          <input
                            type="password"
                            placeholder="***"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                            className="w-full text-xs font-semibold py-2.5 px-4 border rounded-xl bg-slate-50 focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'Net Banking' && (
                    <div className="space-y-3">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Select Bank</label>
                      <select className="w-full text-xs font-semibold py-3 px-3.5 border rounded-xl bg-slate-50 focus:outline-none">
                        <option>State Bank of India (SBI)</option>
                        <option>HDFC Bank</option>
                        <option>ICICI Bank</option>
                        <option>Axis Bank</option>
                      </select>
                    </div>
                  )}

                  {paymentMethod === 'Cash on Delivery' && (
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Paying via Cash on Delivery. Cash/UPI collection will be completed by the courier agent upon unloading fresh grains/crop produce at your address.
                    </p>
                  )}
                </div>
              </div>

              {/* Price details right (Col Span 5) */}
              <div className="md:col-span-5 space-y-6">
                <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Final Pay Details</h3>
                  <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400 font-semibold border-b pb-4">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="text-slate-900 dark:text-white">₹{orderData.subtotal}</span>
                    </div>
                    {orderData.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-650">
                        <span>Discount</span>
                        <span>- ₹{orderData.discountAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Tax (5% GST)</span>
                      <span className="text-slate-900 dark:text-white">₹{orderData.tax}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span className="text-slate-900 dark:text-white">₹{orderData.deliveryCharge}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm font-extrabold text-slate-900 dark:text-white">
                    <span>Payable Total</span>
                    <span className="text-orange-655 text-base">₹{orderData.grandTotal}</span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold py-3.5 rounded-2xl shadow-md transition-all cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        Authorizing Wallet...
                      </>
                    ) : (
                      <>
                        Pay & Place Order (₹{orderData.grandTotal})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ORDER SUCCESS & INVOICE SCREEN */
            <motion.div
              key="payment-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              {/* Success Banner */}
              <div className="bg-white dark:bg-slate-900 border rounded-3xl p-8 shadow-md text-center space-y-4 max-w-lg mx-auto print:hidden">
                <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto animate-bounce">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Payment Successful!</h2>
                  <p className="text-xs text-emerald-650 font-bold uppercase tracking-wider">Order Created & Verified</p>
                </div>
                <p className="text-xs text-slate-500 font-semibold max-w-md mx-auto leading-relaxed">
                  Your order has been placed. The farmer has been notified and is currently packaging your items. Tracking timeline has been initialized.
                </p>

                <div className="flex gap-3 justify-center pt-2">
                  <button
                    onClick={() => navigate(`/delivery-tracking/${createdOrder?.id}`)}
                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    Track Order Live
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => navigate('/customer-dashboard')}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-6 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Back to Marketplace
                  </button>
                </div>
              </div>

              {/* Printable Invoice Page */}
              <div className="bg-white dark:bg-slate-900 border rounded-3xl p-8 shadow-lg max-w-2xl mx-auto space-y-8 print:border-none print:shadow-none print:bg-white print:text-black">
                
                {/* Invoice Header */}
                <div className="flex justify-between items-start border-b pb-6">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-900 print:text-black">DPI Kisan Mandi Portal</h3>
                    <p className="text-[10px] text-slate-400">Farmer2Customer Direct Trade Invoice</p>
                    <p className="text-[9px] text-slate-400 mt-2">INVOICE NO: <b>INV-{createdOrder?.order_number}</b></p>
                    <p className="text-[9px] text-slate-400">DATE: <b>{new Date().toLocaleDateString()}</b></p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                      PAID
                    </span>
                    <p className="text-[9px] text-slate-400 mt-3">Transaction ID: <b>{createdOrder?.payment?.transaction_reference || 'TXN-MKT-XYZ'}</b></p>
                  </div>
                </div>

                {/* Shipping & Billing details */}
                <div className="grid grid-cols-2 gap-6 text-[11px] font-semibold text-slate-650 dark:text-slate-600">
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Billed To:</p>
                    <p className="text-slate-900 dark:text-slate-900 font-extrabold">Registered Customer</p>
                    <p className="leading-relaxed">{createdOrder?.shipping_address}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Fulfillment Logistics:</p>
                    <p className="text-slate-900 dark:text-slate-900 font-extrabold">Express Kisan Rider</p>
                    <p>Agent: {createdOrder?.delivery?.delivery_agent}</p>
                    <p>Phone: {createdOrder?.delivery?.delivery_phone}</p>
                  </div>
                </div>

                {/* Items Table */}
                <div className="border rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b">
                      <tr>
                        <th className="p-3">Product Description</th>
                        <th className="p-3 text-right">Price</th>
                        <th className="p-3 text-right">Qty</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700 dark:text-slate-700">
                      {createdOrder?.items?.map((item: any) => (
                        <tr key={item.id}>
                          <td className="p-3 font-bold">{item.product_name}</td>
                          <td className="p-3 text-right">₹{item.price}</td>
                          <td className="p-3 text-right">{item.quantity}</td>
                          <td className="p-3 text-right font-extrabold">₹{roundToTwo(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals computation */}
                <div className="flex justify-end pt-4">
                  <div className="w-64 space-y-2.5 text-xs font-semibold text-slate-650 dark:text-slate-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="text-slate-900 dark:text-slate-900 font-bold">₹{createdOrder?.total_price}</span>
                    </div>
                    {createdOrder?.coupon_code && (
                      <div className="flex justify-between text-emerald-650 font-bold">
                        <span>Discount ({createdOrder?.coupon_code})</span>
                        <span>- ₹{orderData.discountAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>GST (5% tax)</span>
                      <span className="text-slate-900 dark:text-slate-900 font-bold">₹{createdOrder?.tax}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span className="text-slate-900 dark:text-slate-900 font-bold">₹{createdOrder?.delivery_charges}</span>
                    </div>
                    <hr className="border-slate-200" />
                    <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-slate-900">
                      <span>Grand Total</span>
                      <span className="text-orange-655 text-base">₹{createdOrder?.grand_total}</span>
                    </div>
                  </div>
                </div>

                {/* Invoice Footer Actions (hide on print) */}
                <div className="flex justify-between items-center border-t pt-6 text-[10px] text-slate-450 font-semibold print:hidden">
                  <span>Thank you for supporting verified kisan producers!</span>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePrintInvoice}
                      className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      <Printer className="h-4 w-4" />
                      Print Invoice
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};

export default Payment;
