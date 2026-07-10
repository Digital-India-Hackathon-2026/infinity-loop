import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft, Clock, Phone, Truck, CheckCircle2,
  Navigation, User, Loader2
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons in Vite
const customerMarkerIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const deliveryMarkerIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const steps = [
  'Order Placed',
  'Confirmed',
  'Packed',
  'Picked Up',
  'Out For Delivery',
  'Delivered'
];

const DeliveryTracking: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { apiFetch } = useAuth();

  const [order, setOrder] = useState<any>(null);
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);
  const deliveryMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    fetchTrackingData();
    // Poll tracking data every 10 seconds for real-time status updates
    const interval = setInterval(fetchTrackingData, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchTrackingData = async () => {
    try {
      const orderData = await apiFetch(`/api/orders/${orderId}`);
      const delivData = await apiFetch(`/api/orders/${orderId}/tracking`);
      setOrder(orderData);
      setDelivery(delivData);
    } catch (err) {
      console.error("Failed to fetch order tracking:", err);
    } finally {
      setLoading(false);
    }
  };

  // Map initialization and plotting
  useEffect(() => {
    if (loading || !delivery || !mapContainerRef.current) return;

    const customerCoords: [number, number] = [17.9784, 79.5941]; // Default Warangal
    const deliveryCoords: [number, number] = [delivery.latitude, delivery.longitude];

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(customerCoords, 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }

    // Plot Customer destination marker
    if (!customerMarkerRef.current && mapRef.current) {
      customerMarkerRef.current = L.marker(customerCoords, { icon: customerMarkerIcon })
        .addTo(mapRef.current)
        .bindPopup(`<b>Destination</b><br/>${order?.shipping_address || 'Shipping Address'}`)
        .openPopup();
    }

    // Plot Delivery Rider marker
    if (deliveryMarkerRef.current) {
      deliveryMarkerRef.current.setLatLng(deliveryCoords);
    } else if (mapRef.current) {
      deliveryMarkerRef.current = L.marker(deliveryCoords, { icon: deliveryMarkerIcon })
        .addTo(mapRef.current)
        .bindPopup(`<b>Kisan Rider: ${delivery.delivery_agent}</b><br/>Status: ${delivery.status}`);
    }

    // Pan map to display both markers inside view bounds
    if (mapRef.current && customerMarkerRef.current && deliveryMarkerRef.current) {
      const group = L.featureGroup([customerMarkerRef.current, deliveryMarkerRef.current]);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [loading, delivery, order]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin h-8 w-8 text-orange-655" />
      </div>
    );
  }

  if (!order || !delivery) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-slate-500">
        <p className="text-sm font-bold">Tracking information is unavailable.</p>
        <button onClick={() => navigate('/customer-dashboard')} className="text-xs text-orange-655 font-bold hover:underline mt-2">
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Find step progress index
  const currentStepIndex = steps.indexOf(order.status);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-16">
      
      {/* Navbar */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b dark:border-slate-850">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          My Orders
        </button>
        <span className="text-xs font-bold text-slate-450 dark:text-slate-400">Order Delivery Tracking</span>
        <div className="w-16" />
      </nav>

      {/* Main Grid container */}
      <div className="max-w-6xl mx-auto px-6 py-8 grid gap-8 md:grid-cols-12">
        
        {/* Left Column: Tracking Timeline and Details (Col Span 6) */}
        <div className="md:col-span-6 space-y-6">
          
          {/* Order Details Header Card */}
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] uppercase font-bold text-orange-605">Invoice reference</span>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Order ID: #{order.order_number}
                </h2>
              </div>
              <span className="bg-orange-50 dark:bg-orange-950/20 text-orange-655 text-[10px] font-extrabold px-3 py-1 rounded-full border border-orange-100 dark:border-orange-900/40">
                {order.status}
              </span>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Estimated Delivery</span>
                <span className="text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                  <Clock className="h-4 w-4 text-orange-605" />
                  {delivery.estimated_time || '35 mins'}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Courier Partner</span>
                <span className="text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                  <Truck className="h-4 w-4 text-orange-605" />
                  {delivery.delivery_agent}
                </span>
              </div>
            </div>
          </div>

          {/* Stepper Timeline UI */}
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-6">Delivery Progress</h3>
            
            <div className="relative pl-8 border-l-2 border-slate-100 dark:border-slate-800 ml-4 space-y-6 py-1">
              {steps.map((step, idx) => {
                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                
                return (
                  <div key={step} className="relative">
                    {/* Stepper circular node */}
                    <div className={`absolute -left-[41px] top-0.5 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isCompleted 
                        ? 'bg-orange-600 border-orange-600 text-white' 
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-transparent'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 fill-orange-600 text-white" />
                      ) : (
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                      )}
                    </div>

                    <div className="pl-1">
                      <h4 className={`text-xs font-bold transition-colors ${
                        isCurrent ? 'text-orange-655' : isCompleted ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'
                      }`}>
                        {step}
                      </h4>
                      <p className="text-[10px] text-slate-450 leading-relaxed font-semibold mt-0.5">
                        {idx === 0 && 'We have logged your order in kisan system.'}
                        {idx === 1 && 'Farmer acknowledged and approved harvest.'}
                        {idx === 2 && 'Fresh grains packed in organic bags.'}
                        {idx === 3 && 'Order picked up by courier rider.'}
                        {idx === 4 && `Delivery agent is out with your package.`}
                        {idx === 5 && 'Delivered safely at your destination.'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Courier Contact Card */}
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-orange-100 flex items-center justify-center text-orange-655 shrink-0">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">{delivery.delivery_agent}</h4>
                <p className="text-[10px] text-slate-400 font-semibold">Verified Kisan Delivery Rider</p>
              </div>
            </div>

            <a
              href={`tel:${delivery.delivery_phone}`}
              className="flex items-center justify-center p-3 rounded-2xl bg-orange-50 hover:bg-orange-100 text-orange-655 shadow-sm transition-all cursor-pointer"
            >
              <Phone className="h-5 w-5" />
            </a>
          </div>

        </div>

        {/* Right Column: Leaflet Map (Col Span 6) */}
        <div className="md:col-span-6 space-y-4">
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-sm space-y-3 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Live Delivery Coordinates</h3>
              <p className="text-[10px] text-slate-450 mt-1 font-semibold">Observe agent real-time positioning on the kisan logistics map.</p>
            </div>

            {/* Map Container */}
            <div className="flex-1 min-h-[360px] rounded-2xl border overflow-hidden relative shadow-inner z-10">
              <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 border rounded-xl flex items-center gap-2 text-[10px] font-bold text-slate-500 leading-normal">
              <Navigation className="h-5 w-5 text-orange-600 shrink-0" />
              <span>
                Courier is moving. Coordinates update automatically. Destination: <b>{order.shipping_address}</b>.
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default DeliveryTracking;
