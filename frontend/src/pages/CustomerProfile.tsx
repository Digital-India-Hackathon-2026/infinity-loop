import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft, Mail, Phone, MapPin, ListOrdered,
  LogOut, FileText, Compass, Loader2
} from 'lucide-react';

interface Order {
  id: number;
  order_number: string;
  total_price: number;
  grand_total: number;
  status: string;
  shipping_address: string;
  created_at: string;
  items: Array<{
    id: number;
    product_name: string;
    price: number;
    quantity: number;
  }>;
}

const CustomerProfile: React.FC = () => {
  const navigate = useNavigate();
  const { name, logout, apiFetch } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileAndOrders();
  }, []);

  const fetchProfileAndOrders = async () => {
    try {
      // Load orders list
      const ordersData = await apiFetch('/api/orders/my-orders');
      setOrders(ordersData);

      // Fetch simulated profile metadata
      setProfile({
        customer_id: "F2G-CUST-2026-1001",
        email: "customer@farmer2gov.gov.in",
        phone: "9876543211",
        address: "12-34 Rythu Bazar Lane, Madikonda, Warangal, Telangana - 506003"
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin h-8 w-8 text-orange-655" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-16">
      
      {/* Navbar */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b dark:border-slate-855">
        <button
          onClick={() => navigate('/customer-dashboard')}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Mandi
        </button>
        <span className="text-xs font-bold text-slate-450 dark:text-slate-450">My Profile Portal</span>
        <div className="w-16" />
      </nav>

      {/* Profile & History grid */}
      <div className="max-w-6xl mx-auto px-6 py-8 grid gap-8 md:grid-cols-12">
        
        {/* Left Column: Customer Metadata (Col Span 4) */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-sm text-center space-y-4">
            <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-655 text-xl font-extrabold mx-auto">
              {name?.[0] || 'C'}
            </div>
            
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{name || 'Customer'}</h3>
              <span className="bg-orange-50 dark:bg-orange-950/20 text-orange-655 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border border-orange-100 dark:border-orange-900/40 mt-1 inline-block">
                ID: {profile?.customer_id}
              </span>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* Profile fields */}
            <div className="text-left space-y-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Mail className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <span className="truncate">{profile?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <span>+91 {profile?.phone}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-snug text-[11px]">{profile?.address}</span>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-655 text-xs font-extrabold py-2.5 rounded-xl border border-red-100/50 cursor-pointer transition-all"
            >
              <LogOut className="h-4 w-4" />
              Sign Out Account
            </button>
          </div>
        </div>

        {/* Right Column: Order History List (Col Span 8) */}
        <div className="md:col-span-8 space-y-6">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ListOrdered className="h-5 w-5 text-orange-605" />
            Customer Purchase History
          </h2>

          <div className="space-y-4">
            {orders.map((ord) => (
              <div key={ord.id} className="bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-sm space-y-4">
                
                {/* Header */}
                <div className="flex justify-between items-start border-b pb-3 mb-1">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                      Order: #{ord.order_number}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                      Placed on: {new Date(ord.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <span className={`inline-block text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                      ord.status === 'Delivered' 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                        : ord.status === 'Rejected' 
                        ? 'bg-red-50 border-red-100 text-red-700'
                        : 'bg-orange-50 border-orange-100 text-orange-700 animate-pulse'
                    }`}>
                      {ord.status}
                    </span>
                    <p className="text-xs font-extrabold text-orange-655">Total: ₹{ord.grand_total}</p>
                  </div>
                </div>

                {/* Items in order */}
                <div className="space-y-2">
                  {ord.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-405">
                      <span>{item.product_name} <b className="text-slate-400">x{item.quantity}</b></span>
                      <span className="text-slate-900 dark:text-white">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Tracking & Invoice buttons */}
                <div className="flex gap-2 pt-2 border-t mt-3">
                  {ord.status !== 'Delivered' && ord.status !== 'Rejected' && (
                    <button
                      onClick={() => navigate(`/delivery-tracking/${ord.id}`)}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold py-2 rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Compass className="h-4 w-4" />
                      Track Delivery Live
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/payment', { state: { successOverride: true, orderId: ord.id } })} // or just navigate to a details page that prints
                    className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 hover:text-orange-655 text-slate-700 dark:text-slate-200 text-xs font-bold py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <FileText className="h-4 w-4" />
                    Print Invoice
                  </button>
                </div>

              </div>
            ))}

            {orders.length === 0 && (
              <div className="text-center py-20 bg-white dark:bg-slate-900 border rounded-3xl text-slate-400 font-bold">
                <ListOrdered className="h-12 w-12 mx-auto opacity-35 mb-2" />
                <p>You have not placed any orders yet.</p>
                <button
                  onClick={() => navigate('/customer-dashboard')}
                  className="text-xs text-orange-655 font-bold hover:underline mt-2 cursor-pointer"
                >
                  Shop fresh produce
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default CustomerProfile;
