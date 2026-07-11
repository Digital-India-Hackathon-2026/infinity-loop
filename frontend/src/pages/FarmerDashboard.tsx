import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sprout, FileText, TrendingUp, Landmark, ChevronRight, Bell, Languages,
  LogOut, Search, Camera, Calendar, Clock, AlertTriangle,
  CheckCircle, ArrowLeft, RefreshCw, X, Mic, AlertCircle, ShoppingBag, MapPin, Upload, Store
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Registration {
  id: number;
  registration_number: string;
  farmer_id: number;
  crop_name: string;
  crop_stage: string;
  expected_harvest_month: string;
  expected_quantity: number;
  land_area: number;
  state: string;
  district: string;
  mandal: string;
  village: string;
  phone_number: string;
  status: string;
  created_at: string;
  images: any[];
  // Produce fields
  produce_category?: string;
  quantity_unit?: string;
  pin_code?: string;
  harvest_date?: string;
  produce_ready_status?: string;
}

interface ProcurementTimelineStep {
  step: string;
  completed: boolean;
  current: boolean;
}

interface ProcurementDetail {
  id: number;
  procurement_number: string;
  registration_number: string;
  crop_name: string;
  product: string;
  quantity: number;
  centre_name: string;
  status: string;
  officer_remarks: string | null;
  payment_status: string;
  slot_date: string;
  slot_time: string;
  total_amount: number;
  transaction_reference: string | null;
  expected_payment_date: string | null;
  payment_date: string | null;
  timeline: ProcurementTimelineStep[];
  created_at: string;
}

const mspProduceItems = [
  { name: 'Paddy', nameKey: 'crop_paddy', categoryKey: 'cat_grains', price: '₹2,183', unitKey: 'unit_qtl', type: 'msp', infoKey: 'crop_paddy_info', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400' },
  { name: 'Wheat', nameKey: 'crop_wheat', categoryKey: 'cat_grains', price: '₹2,275', unitKey: 'unit_qtl', type: 'msp', infoKey: 'crop_wheat_info', imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=400' },
  { name: 'Maize', nameKey: 'crop_maize', categoryKey: 'cat_grains', price: '₹2,090', unitKey: 'unit_qtl', type: 'msp', infoKey: 'crop_maize_info', imageUrl: 'https://images.unsplash.com/photo-1623066798929-946425dbe1b0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bWFpemV8ZW58MHx8MHx8fDA%3D' },
  { name: 'Jowar', nameKey: 'crop_jowar', categoryKey: 'cat_grains', price: '₹3,180', unitKey: 'unit_qtl', type: 'msp', infoKey: 'crop_jowar_info', imageUrl: 'https://media.istockphoto.com/id/1262684430/photo/closeup-view-of-a-white-millet-jowar.webp?a=1&b=1&s=612x612&w=0&k=20&c=T8p-XIZUQaEOU9nwvwm8MCWTTiKrtWpB0gY-qk4A3HY=' },
  { name: 'Bajra', nameKey: 'crop_bajra', categoryKey: 'cat_grains', price: '₹2,500', unitKey: 'unit_qtl', type: 'msp', infoKey: 'crop_bajra_info', imageUrl: 'https://www.oraplanet.com/cdn/shop/products/Bajra-whole_300x300.jpg?v=1597410743' },
  { name: 'Ragi', nameKey: 'crop_ragi', categoryKey: 'cat_grains', price: '₹3,846', unitKey: 'unit_qtl', type: 'msp', infoKey: 'crop_ragi_info', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThc4dnM_zQ2ohtlUMPfRqZPePtxgz-oCvmvVsE2629uA&s=10' },
  { name: 'Gram', nameKey: 'crop_gram', categoryKey: 'cat_pulses', price: '₹5,440', unitKey: 'unit_qtl', type: 'msp', infoKey: 'crop_gram_info', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMHOJM2EuKcc1py7QZqT9Rs1wh_hnCB3G2U9oc7FsZD_u5DIOR14pMjo0&s=10' },
  { name: 'Tur', nameKey: 'crop_tur', categoryKey: 'cat_pulses', price: '₹7,000', unitKey: 'unit_qtl', type: 'msp', infoKey: 'crop_tur_info', imageUrl: 'https://m.media-amazon.com/images/I/51Ve5FD3+lS._AC_UF894,1000_QL80_.jpg' },
  { name: 'Moong', nameKey: 'crop_moong', categoryKey: 'cat_pulses', price: '₹8,558', unitKey: 'unit_qtl', type: 'msp', infoKey: 'crop_moong_info', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Sa_green_gram.jpg' },
  { name: 'Urad', nameKey: 'crop_urad', categoryKey: 'cat_pulses', price: '₹6,950', unitKey: 'unit_qtl', type: 'msp', infoKey: 'crop_urad_info', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5EFj1le4T6RSWHrJVCrQaTxngfqTncyNuXrMlNsHE_A&s=10' },
  { name: 'Groundnut', nameKey: 'crop_groundnut', categoryKey: 'cat_oilseeds', price: '₹6,377', unitKey: 'unit_qtl', type: 'msp', infoKey: 'crop_groundnut_info', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRXHv4EdGnOAAg7i2Ro25yVh9v4z9Ja4Q9w8KR38V1Z1A&s=10' },
  { name: 'Sunflower Seed', nameKey: 'crop_sunflower_seed', categoryKey: 'cat_oilseeds', price: '₹6,760', unitKey: 'unit_qtl', type: 'msp', infoKey: 'crop_sunflower_seed_info', imageUrl: 'https://www.eatingwell.com/thmb/q5Ej3AulH6iP3wDG60BOJ8Xanhg=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/sunflower-seeds-square-a86a13fc532d4947a9ee580a97c77285.jpg' },
  { name: 'Soybean', nameKey: 'crop_soybean', categoryKey: 'cat_oilseeds', price: '₹4,600', unitKey: 'unit_qtl', type: 'msp', infoKey: 'crop_soybean_info', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkc_ouSA7mMF3XNfUaq8ZRAapCmwq4K1DtL5SlUp-cIw&s=10' },
  { name: 'Sesamum', nameKey: 'crop_sesamum', categoryKey: 'cat_oilseeds', price: '₹8,635', unitKey: 'unit_qtl', type: 'msp', infoKey: 'crop_sesamum_info', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSLMgjAQl3wdWkJQnwSCcUstTu46jE-MEG6ovi-CdO15w&s=10' },
  { name: 'Cotton', nameKey: 'crop_cotton', categoryKey: 'cat_commercial', price: '₹6,620', unitKey: 'unit_qtl', type: 'msp', infoKey: 'crop_cotton_info', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ37_I1jcPPym1aAIlyRfvgq24fdrhbfiEfJxMcwWAYew&s=10' },
  { name: 'Tomato', nameKey: 'crop_tomato', categoryKey: 'cat_vegetables', price: '₹1,800', unitKey: 'unit_qtl', type: 'market', infoKey: 'crop_tomato_info', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtdxfuLzkv7E0bZfVHgONpcEiqxxNEANPyB-MtmAP59K7E0yQSflBv27Y6&s=10' },
  { name: 'Onion', nameKey: 'crop_onion', categoryKey: 'cat_vegetables', price: '₹2,200', unitKey: 'unit_qtl', type: 'market', infoKey: 'crop_onion_info', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_flGpHFMgDuz2-7QnRJxoJALdzX9YU5ojoOFHYKPDvA&s=10' },
  { name: 'Potato', nameKey: 'crop_potato', categoryKey: 'cat_vegetables', price: '₹1,500', unitKey: 'unit_qtl', type: 'market', infoKey: 'crop_potato_info', imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=400' },
  { name: 'Chilli', nameKey: 'crop_chilli', categoryKey: 'cat_vegetables', price: '₹19,000', unitKey: 'unit_qtl', type: 'market', infoKey: 'crop_chilli_info', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5XsLmgCruZbqeiSbh_F_RdXpGnUx_BlQs7jwjfHAgFg&s' },
  { name: 'Turmeric', nameKey: 'crop_turmeric', categoryKey: 'cat_commercial', price: '₹12,500', unitKey: 'unit_qtl', type: 'market', infoKey: 'crop_turmeric_info', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS-K9NAwhVCo5lkM8WPjFAhtDgr3vhDDcXh8sE3DhrPxQ&s=10' }
];

const FarmerDashboard: React.FC = () => {
  const { logout, apiFetch, name } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Navigation / Tab states
  const [activeTab, setActiveTab] = useState<'overview' | 'register' | 'register-produce' | 'msp' | 'procurement' | 'booking' | 'marketplace'>('overview');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(true);

  // Procurement states
  const [procurements, setProcurements] = useState<ProcurementDetail[]>([]);
  const [loadingProcurements, setLoadingProcurements] = useState(false);

  // MSP Search & Filter states
  const [mspSearchQuery, setMspSearchQuery] = useState('');
  const [mspCategoryFilter, setMspCategoryFilter] = useState('All');

  // Crop Registration Form states
  const [formData, setFormData] = useState({
    crop_name: 'Paddy',
    crop_stage: 'Pre-Harvest',
    expected_harvest_month: 'August 2026',
    expected_quantity: '',
    land_area: '',
    state: 'Telangana',
    district: 'Warangal',
    mandal: 'Hanamkonda',
    village: 'Madikonda',
    phone_number: ''
  });

  // Produce Registration Form states
  const [produceFormData, setProduceFormData] = useState({
    farmer_name: name || '',
    phone_number: '',
    produce_name: 'Paddy',
    produce_category: 'Grains',
    expected_quantity: '',
    quantity_unit: 'Quintals',
    state: 'Telangana',
    district: 'Warangal',
    mandal: 'Hanamkonda',
    village: 'Madikonda',
    pin_code: '',
    harvest_date: new Date().toISOString().split('T')[0],
    produce_ready_status: 'Ready'
  });

  // Camera Simulator states
  const [cameraOpen, setCameraOpen] = useState(false);
  const [imageType, setImageType] = useState<'full_produce' | 'close_up' | 'storage_view'>('full_produce');
  const [capturedImages, setCapturedImages] = useState<Record<string, string>>({});
  const [gpsData, setGpsData] = useState({ lat: 17.9784, lng: 79.5941, loc: 'Madikonda, Warangal' });
  const [webcamActive, setWebcamActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // AI report state
  const [aiReport, setAiReport] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Slot Booking states
  const [bookingOpen, setBookingOpen] = useState(false);
  const [imageSourceModalOpen, setImageSourceModalOpen] = useState(false);
  const [slotDate, setSlotDate] = useState('');
  const [slotTime, setSlotTime] = useState('09:00 AM - 11:00 AM');
  const [selectedBookingRegId, setSelectedBookingRegId] = useState('');
  const [bookedProcurement, setBookedProcurement] = useState<any | null>(null);
  const [imageSourceOption, setImageSourceOption] = useState<'live' | 'upload'>('live');

  // Voice Assistant states
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [voiceReply, setVoiceReply] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

  // Marketplace states
  const [marketProducts, setMarketProducts] = useState<any[]>([]);
  const [marketOrders, setMarketOrders] = useState<any[]>([]);
  const [marketAnalytics, setMarketAnalytics] = useState<any>({ total_revenue: 0, orders_count: 0, products_count: 0 });
  const [marketTab, setMarketTab] = useState<'products' | 'orders' | 'analytics'>('products');
  const [newProductFormData, setNewProductFormData] = useState({
    name: '',
    description: '',
    category: 'Grains',
    price: '',
    original_price: '',
    stock: '',
    unit: 'kg',
    organic_badge: false,
    freshness_badge: 'Freshly Harvested',
    image_url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=400'
  });
  const [editProductId, setEditProductId] = useState<number | null>(null);
  const [loadingMarket, setLoadingMarket] = useState(false);

  const fetchFarmerProducts = async () => {
    setLoadingMarket(true);
    try {
      const data = await apiFetch('/api/marketplace/my-products');
      setMarketProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMarket(false);
    }
  };

  const fetchFarmerOrders = async () => {
    try {
      const data = await apiFetch('/api/marketplace/incoming-orders');
      setMarketOrders(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFarmerAnalytics = async () => {
    try {
      const data = await apiFetch('/api/marketplace/earnings-analytics');
      setMarketAnalytics(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editProductId) {
        // Edit existing product
        await apiFetch(`/api/marketplace/products/${editProductId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: newProductFormData.name,
            description: newProductFormData.description,
            category: newProductFormData.category,
            price: parseFloat(newProductFormData.price),
            original_price: parseFloat(newProductFormData.original_price || newProductFormData.price),
            stock: parseFloat(newProductFormData.stock),
            unit: newProductFormData.unit,
            organic_badge: newProductFormData.organic_badge,
            freshness_badge: newProductFormData.freshness_badge,
            image_url: newProductFormData.image_url
          })
        });
        alert("Product updated successfully!");
        setEditProductId(null);
      } else {
        // Create new product
        await apiFetch('/api/marketplace/products', {
          method: 'POST',
          body: JSON.stringify({
            name: newProductFormData.name,
            description: newProductFormData.description,
            category: newProductFormData.category,
            price: parseFloat(newProductFormData.price),
            original_price: parseFloat(newProductFormData.original_price || newProductFormData.price),
            stock: parseFloat(newProductFormData.stock),
            unit: newProductFormData.unit,
            organic_badge: newProductFormData.organic_badge,
            freshness_badge: newProductFormData.freshness_badge,
            image_url: newProductFormData.image_url
          })
        });
        alert("Product published to Marketplace successfully!");
      }
      setNewProductFormData({
        name: '',
        description: '',
        category: 'Grains',
        price: '',
        original_price: '',
        stock: '',
        unit: 'kg',
        organic_badge: false,
        freshness_badge: 'Freshly Harvested',
        image_url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=400'
      });
      fetchFarmerProducts();
      fetchFarmerAnalytics();
    } catch (err: any) {
      alert(err.message || "Failed to save product.");
    }
  };

  const handleStartEditProduct = (p: any) => {
    setEditProductId(p.id);
    setNewProductFormData({
      name: p.name,
      description: p.description,
      category: p.category,
      price: String(p.price),
      original_price: String(p.original_price || ''),
      stock: String(p.stock),
      unit: p.unit || 'kg',
      organic_badge: p.organic_badge || false,
      freshness_badge: p.freshness_badge || 'Freshly Harvested',
      image_url: p.image_url || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=400'
    });
  };

  const handleDeleteProduct = async (prodId: number) => {
    if (!window.confirm("Are you sure you want to delete this product from the marketplace?")) return;
    try {
      await apiFetch(`/api/marketplace/products/${prodId}`, {
        method: 'DELETE'
      });
      alert("Product deleted successfully!");
      fetchFarmerProducts();
      fetchFarmerAnalytics();
    } catch (err: any) {
      alert(err.message || "Failed to delete product.");
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      await apiFetch(`/api/marketplace/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      alert(`Order status updated to '${status}'!`);
      fetchFarmerOrders();
      fetchFarmerAnalytics();
    } catch (err: any) {
      alert(err.message || "Failed to update order status.");
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Load Voice Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;

      // Map speech language based on app language preference
      rec.lang = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

      rec.onstart = () => {
        setVoiceActive(true);
        setVoiceText('Listening...');
        setVoiceReply('');
      };

      rec.onend = () => {
        setVoiceActive(false);
      };

      rec.onerror = (e: any) => {
        setVoiceActive(false);
        setVoiceText('Speech recognition error.');
        console.error(e);
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setVoiceText(text);
        processVoiceCommand(text);
      };

      setRecognition(rec);
    }
  }, [language]);

  const fetchDashboardData = async () => {
    try {
      setLoadingRegs(true);
      const regs = await apiFetch('/api/crops/my-registrations');
      setRegistrations(regs);

      // Retrieve notifications
      const notifs = await apiFetch('/api/notifications');
      setNotifications(notifs);

      // Retrieve profile
      const userProfile = await apiFetch('/api/auth/me');
      setProfile(userProfile);
      if (userProfile) {
        setFormData(prev => ({
          ...prev,
          state: userProfile.state || prev.state,
          district: userProfile.district || prev.district,
          mandal: userProfile.mandal || prev.mandal,
          village: userProfile.village || prev.village,
          phone_number: userProfile.phone || prev.phone_number
        }));
        setProduceFormData(prev => ({
          ...prev,
          farmer_name: userProfile.name || prev.farmer_name,
          phone_number: userProfile.phone || prev.phone_number,
          state: userProfile.state || prev.state,
          district: userProfile.district || prev.district,
          mandal: userProfile.mandal || prev.mandal,
          village: userProfile.village || prev.village
        }));
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoadingRegs(false);
    }
  };

  const fetchProcurements = async () => {
    try {
      setLoadingProcurements(true);
      const data = await apiFetch('/api/procurements/my');
      setProcurements(data);
    } catch (err) {
      console.error('Error loading procurements:', err);
    } finally {
      setLoadingProcurements(false);
    }
  };

  const handleSelectReg = async (reg: Registration) => {
    setSelectedReg(reg);
    setAiReport(null);
    setCapturedImages({}); // Clear images so we don't reuse previous crop's photos

    // Check status-based assets
    if (['AI Reviewed', 'Sample Requested', 'Approved', 'Slot Booked', 'Procured', 'Payment Completed'].includes(reg.status)) {
      // Fetch AI report
      try {
        const report = await apiFetch(`/api/crops/${reg.id}/ai-report`);
        setAiReport(report);
      } catch (e) {
        console.log('No AI report generated yet.');
      }
    }
  };

  // Pre-Harvest Registration Form Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/crops/register', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          expected_quantity: parseFloat(formData.expected_quantity),
          land_area: parseFloat(formData.land_area)
        })
      });

      confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
      fetchDashboardData();
      setActiveTab('overview');
      setFormData({
        crop_name: 'Paddy',
        crop_stage: 'Pre-Harvest',
        expected_harvest_month: 'August 2026',
        expected_quantity: '',
        land_area: '',
        state: 'Telangana',
        district: 'Warangal',
        mandal: 'Hanamkonda',
        village: 'Madikonda',
        phone_number: ''
      });
    } catch (err: any) {
      alert(err.message || 'Registration failed.');
    }
  };

  // Harvested Produce Registration Form Submit
  const handleProduceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/crops/register-produce', {
        method: 'POST',
        body: JSON.stringify({
          ...produceFormData,
          expected_quantity: parseFloat(produceFormData.expected_quantity)
        })
      });

      confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
      alert('Produce Registered Successfully!');
      fetchDashboardData();

      // Select the newly registered produce to allow camera / assessment flow directly
      handleSelectReg(res);
      setActiveTab('overview');
      setProduceFormData({
        farmer_name: name || '',
        phone_number: '',
        produce_name: 'Paddy',
        produce_category: 'Grains',
        expected_quantity: '',
        quantity_unit: 'Quintals',
        state: 'Telangana',
        district: 'Warangal',
        mandal: 'Hanamkonda',
        village: 'Madikonda',
        pin_code: '',
        harvest_date: new Date().toISOString().split('T')[0],
        produce_ready_status: 'Ready'
      });
    } catch (err: any) {
      alert(err.message || 'Produce registration failed.');
    }
  };

  // CAMERA SIMULATOR CODE
  const openCamera = (type: 'full_produce' | 'close_up' | 'storage_view') => {
    setImageType(type);
    setCameraOpen(true);
    setWebcamActive(false);

    // Get geolocation if browser permits
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsData({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            loc: `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`
          });
        },
        () => {
          // Default mock Warangal coords
          setGpsData({ lat: 17.9784, lng: 79.5941, loc: 'Warangal Agriculture Mandi' });
        }
      );
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setWebcamActive(true);
      }
    } catch (err) {
      console.log('No physical camera/permission, running simulated scanner feed.');
      setWebcamActive(false);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setWebcamActive(false);
    }
  };

  const captureImage = async () => {
    let imageSrc = '';

    if (webcamActive && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        imageSrc = canvas.toDataURL('image/jpeg');
      }
      stopWebcam();
    } else {
      // Draw simulated golden crop grain crop
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Gradient representing golden grain harvest
        const grad = ctx.createLinearGradient(0, 0, 640, 480);
        grad.addColorStop(0, '#f59e0b');
        grad.addColorStop(1, '#b45309');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 640, 480);

        // Draw some mock rice grain details
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        for (let i = 0; i < 200; i++) {
          ctx.beginPath();
          ctx.ellipse(
            randomInRange(50, 590),
            randomInRange(50, 430),
            randomInRange(5, 12),
            randomInRange(2, 5),
            Math.random() * Math.PI,
            0,
            2 * Math.PI
          );
          ctx.fill();
        }

        // Stamp metadata
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        ctx.fillText(`GPS: ${gpsData.lat.toFixed(4)}, ${gpsData.lng.toFixed(4)}`, 20, 430);
        ctx.fillText(`TIMESTAMP: ${new Date().toISOString()}`, 20, 450);

        imageSrc = canvas.toDataURL('image/jpeg');
      }
    }

    setCapturedImages(prev => ({ ...prev, [imageType]: imageSrc }));
    setCameraOpen(false);

    // Call backend API to save image
    if (selectedReg) {
      try {
        const blob = await (await fetch(imageSrc)).blob();

        const fd = new FormData();
        fd.append('file', blob, `${imageType}.jpg`);
        fd.append('image_type', imageType);
        fd.append('gps_latitude', gpsData.lat.toString());
        fd.append('gps_longitude', gpsData.lng.toString());
        fd.append('gps_location_name', gpsData.loc);
        fd.append('device_info', 'Motorola Moto G84 5G (Android 14)');

        await apiFetch(`/api/crops/${selectedReg.id}/upload-images`, {
          method: 'POST',
          body: fd
        });

        // Trigger updates in registration timeline
        fetchDashboardData();
        if (selectedReg) {
          const list = await apiFetch('/api/crops/my-registrations');
          const current = list.find((r: any) => r.id === selectedReg.id);
          if (current) setSelectedReg(current);
        }
      } catch (err: any) {
        console.error('Failed to upload image:', err);
      }
    }
  };



  const handleDeleteImage = async (imageType: string) => {
    if (!selectedReg) return;
    try {
      await apiFetch(`/api/crops/${selectedReg.id}/images/${imageType}`, {
        method: 'DELETE'
      });
      setCapturedImages(prev => {
        const next = { ...prev };
        delete next[imageType];
        return next;
      });
      fetchDashboardData();
      const list = await apiFetch('/api/crops/my-registrations');
      const current = list.find((r: any) => r.id === selectedReg.id);
      if (current) setSelectedReg(current);
    } catch (err: any) {
      alert(err.message || 'Failed to delete image');
    }
  };

  const handleLocalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedReg) return;

    // Validate type (must be image)
    if (!file.type.startsWith('image/')) {
      alert('Invalid file format. Please upload an image (JPG, PNG, WEBP).');
      return;
    }
    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds the 5MB limit.');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageSrc = reader.result as string;
        setCapturedImages(prev => ({ ...prev, close_up: imageSrc }));

        const fd = new FormData();
        fd.append('file', file, `close_up.jpg`);
        fd.append('image_type', 'close_up');
        fd.append('gps_latitude', gpsData.lat.toString());
        fd.append('gps_longitude', gpsData.lng.toString());
        fd.append('gps_location_name', gpsData.loc);
        fd.append('device_info', 'Local Upload Browser');
        fd.append('image_source', 'Local Upload');

        await apiFetch(`/api/crops/${selectedReg.id}/upload-images`, {
          method: 'POST',
          body: fd
        });

        // Trigger updates in registration timeline
        fetchDashboardData();
        const list = await apiFetch('/api/crops/my-registrations');
        const current = list.find((r: any) => r.id === selectedReg.id);
        if (current) setSelectedReg(current);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Failed to upload local image:', err);
    }
  };

  const randomInRange = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  // Run AI Pre-Assessment using OpenCV
  const handleAiPreAssessment = async () => {
    if (!selectedReg) return;
    setAnalyzing(true);
    try {
      const res = await apiFetch(`/api/crops/${selectedReg.id}/ai-assess`, {
        method: 'POST'
      });
      setAiReport(res);
      fetchDashboardData();

      // Update local selection status
      setSelectedReg(prev => prev ? { ...prev, status: 'AI Reviewed' } : null);

      confetti({ particleCount: 50, colors: ['#22c55e', '#fbbf24'] });
    } catch (err: any) {
      alert(err.message || 'AI assessment failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Book Slot
  const handleBookSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotDate || !selectedReg) {
      alert('Please select slot date.');
      return;
    }

    try {
      await apiFetch(`/api/crops/${selectedReg.id}/book-slot`, {
        method: 'POST',
        body: JSON.stringify({ slot_date: slotDate, slot_time: slotTime })
      });
      setBookingOpen(false);
      fetchDashboardData();
      setSelectedReg(prev => prev ? { ...prev, status: 'Slot Booked' } : null);
      confetti({ particleCount: 70 });
    } catch (e: any) {
      alert(e.message || 'Booking failed.');
    }
  };

  const handleBookSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingRegId || !slotDate) return;
    try {
      const data = await apiFetch(`/api/crops/${selectedBookingRegId}/book-slot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_date: slotDate,
          slot_time: slotTime
        })
      });
      setBookedProcurement(data);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      fetchDashboardData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to book slot.');
    }
  };

  // VOICE ASSISTANT PROCESSOR (FLOATING & MULTILINGUAL)
  const startListening = () => {
    if (recognition) {
      recognition.start();
    } else {
      alert('Speech recognition is not fully supported in this browser.');
    }
  };

  const processVoiceCommand = (text: string) => {
    const query = text.toLowerCase().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "");
    let reply = '';
    let voiceLang = 'en-US';

    if (language === 'te') {
      voiceLang = 'te-IN';
      if (query.includes('పంట నమోదు') || query.includes('క్రాప్ రిజిస్ట్రేషన్') || query.includes('నమోదు')) {
        setActiveTab('register');
        setSelectedReg(null);
        reply = 'పంట ముందస్తు నమోదు పేజీని తెరుస్తున్నాను.';
      } else if (query.includes('పంట విక్రయం') || query.includes('ప్రొడ్యూస్ రిజిస్ట్రేషన్') || query.includes('పంట అమ్మకం') || query.includes('విక్రయం')) {
        setActiveTab('register-produce');
        setSelectedReg(null);
        reply = 'పంట విక్రయ నమోదు పేజీని తెరుస్తున్నాను.';
      } else if (query.includes('ధరలు') || query.includes('మద్దతు ధర') || query.includes('రేట్లు') || query.includes('ఎమ్ ఎస్ పి') || query.includes('ఎంఎస్పి')) {
        setActiveTab('msp');
        reply = 'కనీస మద్దతు ధర వివరాల పేజీని తెరుస్తున్నాను.';
      } else if (query.includes('చెల్లింపు') || query.includes('డబ్బులు') || query.includes('ట్రాకింగ్') || query.includes('పేమెంట్') || query.includes('స్టేటస్')) {
        setActiveTab('procurement');
        fetchProcurements();
        reply = 'చెల్లింపు మరియు కొనుగోలు ట్రాకింగ్ పేజీని తెరుస్తున్నాను.';
      } else if (query.includes('బుకింగ్') || query.includes('స్లాట్') || query.includes('అపాయింట్‌మెంట్') || query.includes('బుక్')) {
        setActiveTab('booking');
        reply = 'కొనుగోలు స్లాట్ బుకింగ్ పేజీని తెరుస్తున్నాను.';
      } else if (query.includes('డాష్‌బోర్డ్') || query.includes('హోమ్') || query.includes('మొదటి పేజీ')) {
        setActiveTab('overview');
        setSelectedReg(null);
        reply = 'డాష్‌బోర్డ్ పేజీని తెరుస్తున్నాను.';
      } else {
        reply = 'క్షమించండి, నాకు అర్థం కాలేదు. దయచేసి మళ్లీ చెప్పండి.';
      }
    } else if (language === 'hi') {
      voiceLang = 'hi-IN';
      if (query.includes('फसल पंजीकरण') || query.includes('फसल रजिस्टर') || query.includes('पंजीकरण')) {
        setActiveTab('register');
        setSelectedReg(null);
        reply = 'फसल पंजीकरण पृष्ठ खोल रहा हूँ।';
      } else if (query.includes('फसल बेचें') || query.includes('उत्पाद पंजीकरण') || query.includes('बेचना') || query.includes('फसल बेचना')) {
        setActiveTab('register-produce');
        setSelectedReg(null);
        reply = 'फसल उत्पाद पंजीकरण पृष्ठ खोल रहा हूँ।';
      } else if (query.includes('एमएसपी') || query.includes('मूल्य') || query.includes('दाम देखें') || query.includes('रेट')) {
        setActiveTab('msp');
        reply = 'न्यूनतम समर्थन मूल्य विवरण पृष्ठ खोल रहा हूँ।';
      } else if (query.includes('भुगतान') || query.includes('पैसे') || query.includes('स्थिति देखें') || query.includes('पेमेंट')) {
        setActiveTab('procurement');
        fetchProcurements();
        reply = 'भुगतान स्थिति और खरीद ट्रैकिंग पृष्ठ खोल रहा हूँ।';
      } else if (query.includes('बुक') || query.includes('स्लॉट') || query.includes('बुकिंग') || query.includes('अपॉइंटमेंट')) {
        setActiveTab('booking');
        reply = 'खरीद स्लॉट बुकिंग पृष्ठ खोल रहा हूँ।';
      } else if (query.includes('डैशबोर्ड') || query.includes('होम') || query.includes('मुख्य पृष्ठ')) {
        setActiveTab('overview');
        setSelectedReg(null);
        reply = 'डैशबोर्ड खोल रहा हूँ।';
      } else {
        reply = 'माफ़ कीजिए, मैं समझ नहीं पाया। कृपया फिर से बोलें।';
      }
    } else {
      // English
      voiceLang = 'en-US';
      if (query.includes('register crop') || query.includes('open crop registration')) {
        setActiveTab('register');
        setSelectedReg(null);
        reply = 'Opening crop registration page.';
      } else if (query.includes('register produce') || query.includes('open produce registration') || query.includes('sell produce')) {
        setActiveTab('register-produce');
        setSelectedReg(null);
        reply = 'Opening produce registration page.';
      } else if (query.includes('open msp') || query.includes('check msp') || query.includes('msp information')) {
        setActiveTab('msp');
        reply = 'Opening Minimum Support Price page.';
      } else if (query.includes('track payment') || query.includes('payment status') || query.includes('open my procurement') || query.includes('procurement')) {
        setActiveTab('procurement');
        fetchProcurements();
        reply = 'Opening procurement and payment tracking page.';
      } else if (query.includes('book slot') || query.includes('booking') || query.includes('schedule slot') || query.includes('appointment')) {
        setActiveTab('booking');
        reply = 'Opening procurement slot booking page.';
      } else if (query.includes('go to dashboard') || query.includes('go home') || query.includes('dashboard')) {
        setActiveTab('overview');
        setSelectedReg(null);
        reply = 'Navigating back to main dashboard.';
      } else {
        reply = 'Sorry, I did not understand. Please try again.';
      }
    }

    setVoiceReply(reply);

    // Trigger speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(reply);
      utterance.lang = voiceLang;
      window.speechSynthesis.speak(utterance);
    }
  };

  const getTimelineSteps = () => {
    return [
      'Registered',
      'Images Uploaded',
      'AI Reviewed',
      'Awaiting Verification',
      'Sample Verified',
      'Approved',
      'Slot Booked',
      'Procured',
      'Payment Completed'
    ];
  };

  const getTimelineIndex = (status: string) => {
    const steps = getTimelineSteps();
    if (status === 'Sample Requested') return 3;
    const idx = steps.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  // Filter crops dataset
  const filteredMspItems = mspProduceItems.filter(item => {
    const cropNameTranslated = t(item.nameKey).toLowerCase();
    const matchesSearch = cropNameTranslated.includes(mspSearchQuery.toLowerCase()) || item.name.toLowerCase().includes(mspSearchQuery.toLowerCase());

    const catMap: Record<string, string> = {
      'All': 'All',
      'Grains': 'cat_grains',
      'Pulses': 'cat_pulses',
      'Vegetables': 'cat_vegetables',
      'Oilseeds': 'cat_oilseeds'
    };

    const targetCat = catMap[mspCategoryFilter] || 'All';
    const matchesCategory = targetCat === 'All' || item.categoryKey === targetCat;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans transition-colors relative pb-20">
      {/* Dashboard Top bar */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow">
            <Sprout className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900">Farmer Portal</h1>
            <p className="text-[10px] text-emerald-650 font-bold uppercase tracking-wider">{t('app_title')}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-500/10 hidden sm:inline-block">
            Welcome, <span className="font-bold">{name}</span>
          </span>

          {/* Notification Bell Badge */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 rounded-lg bg-slate-100 text-slate-550 hover:bg-slate-200 transition-colors cursor-pointer border-none flex items-center justify-center"
            >
              <Bell className="h-4 w-4" />
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 p-2 rounded-2xl shadow-xl z-50 text-slate-700 max-h-80 overflow-y-auto">
                <div className="text-xs font-bold text-slate-450 p-2 border-b uppercase tracking-wider">Notifications</div>
                {notifications.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-4">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={async () => {
                        if (!n.is_read) {
                          try {
                            await apiFetch(`/api/notifications/${n.id}/read`, { method: 'POST' });
                            setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
                          } catch (e) {
                            console.error(e);
                          }
                        }
                      }}
                      className={`p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border-b border-slate-50 last:border-none flex gap-2 ${!n.is_read ? 'bg-emerald-50/40' : ''}`}
                    >
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-800 flex justify-between">
                          <span>{n.title}</span>
                          {!n.is_read && <span className="h-1.5 w-1.5 bg-emerald-600 rounded-full mt-1.5" />}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{n.message}</div>
                        <div className="text-[8px] text-slate-400 font-mono mt-1">{new Date(n.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Languages Selector */}
          <div className="relative group">
            <button className="flex items-center gap-1 bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200 cursor-pointer">
              <Languages className="h-3.5 w-3.5 text-emerald-600" />
              <span className="uppercase">{language}</span>
            </button>
            <div className="absolute right-0 mt-1 hidden w-28 bg-white border border-slate-200 p-1 rounded-lg shadow-lg group-hover:block z-50">
              {['en', 'te', 'hi'].map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l as any)}
                  className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 text-slate-700 rounded-md"
                >
                  {l === 'en' ? 'English' : l === 'te' ? 'తెలుగు' : 'हिंदी'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1 bg-red-50 text-red-650 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Dashboard layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid gap-6 md:grid-cols-12">
        {/* Left column navigation cards */}
        <div className="md:col-span-3 space-y-4">
          <div className="space-y-2">
            {[
              { id: 'overview', label: t('nav_my_registrations'), icon: FileText },
              { id: 'register', label: t('nav_register_crop'), icon: Sprout },
              { id: 'register-produce', label: t('nav_register_produce'), icon: ShoppingBag },
              { id: 'msp', label: t('nav_msp_info'), icon: TrendingUp },
              { id: 'booking', label: t('slot_booking'), icon: Calendar },
              { id: 'procurement', label: t('nav_my_procurement'), icon: Landmark },
              { id: 'marketplace', label: 'Marketplace Portal', icon: Store }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedReg(null);
                  if (tab.id === 'procurement') fetchProcurements();
                  if (tab.id === 'marketplace') {
                    fetchFarmerProducts();
                    fetchFarmerOrders();
                    fetchFarmerAnalytics();
                  }
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${activeTab === tab.id
                  ? 'bg-emerald-600 border-emerald-650 text-white shadow-md'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </button>
            ))}
          </div>

          {/* Sidebar Voice Assistant Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 no-print">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Mic className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">{t('voice_assistant')}</h4>
                <p className="text-[9px] text-slate-450 font-bold uppercase">Multi-lingual Navigation</p>
              </div>
            </div>

            <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">
              Say commands like: <b>"Register Crop"</b>, <b>"భారత్ మద్దతు ధర"</b>, or <b>"भुगतान स्थिति"</b> to auto-navigate.
            </p>

            <button
              type="button"
              onClick={startListening}
              className={`w-full py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${voiceActive
                ? 'bg-red-500 border-red-400 text-white animate-pulse'
                : 'bg-emerald-600 border-emerald-650 text-white shadow-sm hover:bg-emerald-700'
                }`}
            >
              <Mic className="h-4 w-4" />
              {voiceActive ? t('voice_btn_listening') : t('voice_btn_start')}
            </button>

            {voiceText && (
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                <p className="text-[9px] uppercase font-bold text-slate-400">Heard:</p>
                <p className="font-bold text-slate-800 mt-0.5">"{voiceText}"</p>
              </div>
            )}

            {voiceReply && !voiceActive && (
              <div className="bg-emerald-550/10 text-emerald-850 border border-emerald-100 p-3 rounded-xl space-y-1.5 text-xs">
                <p className="text-[9px] uppercase font-bold text-emerald-600">Response:</p>
                <p className="font-bold leading-relaxed text-slate-850">{voiceReply}</p>
                <button
                  onClick={() => setVoiceReply('')}
                  className="text-[9px] text-slate-450 hover:text-slate-700 hover:underline font-bold mt-1 block"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right column main content area */}
        <div className="md:col-span-9 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {!selectedReg ? (
                  <div className="space-y-6">
                    {/* Quick Action Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      <button
                        onClick={() => setActiveTab('register')}
                        className="bg-white border border-emerald-100 hover:border-emerald-300 p-5 rounded-2xl shadow-sm text-left transition-all hover:scale-[1.02] flex flex-col justify-between h-28 group cursor-pointer"
                      >
                        <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                          <Sprout className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">{t('nav_register_crop')}</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('register-produce')}
                        className="bg-white border border-yellow-100 hover:border-yellow-300 p-5 rounded-2xl shadow-sm text-left transition-all hover:scale-[1.02] flex flex-col justify-between h-28 group cursor-pointer"
                      >
                        <div className="h-9 w-9 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center group-hover:bg-yellow-600 group-hover:text-white transition-all">
                          <ShoppingBag className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">{t('nav_register_produce')}</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('msp')}
                        className="bg-white border border-amber-100 hover:border-amber-300 p-5 rounded-2xl shadow-sm text-left transition-all hover:scale-[1.02] flex flex-col justify-between h-28 group cursor-pointer"
                      >
                        <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">{t('msp_info')}</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('booking')}
                        className="bg-white border border-purple-100 hover:border-purple-300 p-5 rounded-2xl shadow-sm text-left transition-all hover:scale-[1.02] flex flex-col justify-between h-28 group cursor-pointer"
                      >
                        <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">{t('slot_booking')}</span>
                      </button>

                      <button
                        onClick={() => { setActiveTab('procurement'); fetchProcurements(); }}
                        className="bg-white border border-blue-100 hover:border-blue-300 p-5 rounded-2xl shadow-sm text-left transition-all hover:scale-[1.02] flex flex-col justify-between h-28 group cursor-pointer"
                      >
                        <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <FileText className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">{t('my_procurement')}</span>
                      </button>
                    </div>

                    {/* Govt Bulletins Panel */}
                    <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
                      <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 flex items-center gap-2">
                        <span className="h-2 w-2 bg-emerald-550 rounded-full animate-pulse" />
                        {t('gov_bulletins')}
                      </h4>
                      <ul className="mt-4 space-y-3.5 text-xs leading-relaxed font-semibold text-slate-650">
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-650 font-extrabold shrink-0">•</span>
                          <p>{t('bulletin_1')}</p>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-650 font-extrabold shrink-0">•</span>
                          <p>{t('bulletin_2')}</p>
                        </li>
                      </ul>
                    </div>

                    {/* Active registrations listing */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-800 mb-4">My Crop & Produce Registrations</h3>

                      {loadingRegs ? (
                        <div className="space-y-3">
                          <div className="h-14 bg-slate-100 animate-pulse rounded-xl" />
                          <div className="h-14 bg-slate-100 animate-pulse rounded-xl" />
                        </div>
                      ) : registrations.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30 text-slate-500" />
                          <p className="text-xs font-bold">No active registrations found.</p>
                          <p className="text-[10px] text-slate-400 mt-1">Submit crop pre-harvest or harvested produce form to get started.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {registrations.map((reg) => (
                            <div
                              key={reg.id}
                              onClick={() => handleSelectReg(reg)}
                              className="flex items-center justify-between p-4 border border-slate-100 hover:border-emerald-500/30 rounded-2xl hover:bg-emerald-50/10 cursor-pointer transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm ${reg.crop_stage === 'Harvested' ? 'bg-yellow-50 text-yellow-750' : 'bg-emerald-50 text-emerald-750'
                                  }`}>
                                  {reg.crop_stage === 'Harvested' ? '📦' : '🌱'}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-extrabold text-slate-900">{reg.crop_name}</h4>
                                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${reg.crop_stage === 'Harvested' ? 'bg-yellow-50 text-yellow-700' : 'bg-emerald-50 text-emerald-700'
                                      }`}>
                                      {reg.crop_stage}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{reg.registration_number}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="text-right hidden sm:block">
                                  <p className="text-xs font-bold text-slate-750">{reg.expected_quantity} {reg.quantity_unit || 'Qtl'}</p>
                                  <p className="text-[9px] text-slate-400">{reg.village}, {reg.district}</p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${reg.status === 'Payment Completed' ? 'bg-emerald-100 text-emerald-805' :
                                  reg.status === 'Approved' || reg.status === 'Sample Verified' ? 'bg-emerald-50 text-emerald-700' :
                                    reg.status === 'Slot Booked' ? 'bg-amber-100 text-amber-805' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                  {reg.status}
                                </span>
                                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* REGISTRATION DETAIL FLOW PANELS */
                  <div className="space-y-6">
                    <button
                      onClick={() => setSelectedReg(null)}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-bold cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Dashboard
                    </button>

                    <div className="grid gap-6 md:grid-cols-12">
                      <div className="md:col-span-8 space-y-6">
                        {/* Summary Card */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                          <div className="flex justify-between items-start border-b pb-4 mb-4">
                            <div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedReg.crop_stage === 'Harvested' ? 'bg-yellow-50 text-yellow-700' : 'bg-emerald-50 text-emerald-700'
                                }`}>
                                {selectedReg.crop_stage} Registration Details
                              </span>
                              <h3 className="text-base font-extrabold text-slate-900 mt-2">{selectedReg.crop_name} ({selectedReg.expected_quantity} {selectedReg.quantity_unit || 'Qtl'})</h3>
                              <p className="text-xs text-slate-450 font-mono mt-0.5">{selectedReg.registration_number}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="bg-slate-100 text-slate-650 text-xs font-bold px-3 py-1 rounded-lg">
                                Status: {selectedReg.status}
                              </span>
                              <button
                                type="button"
                                onClick={() => window.print()}
                                className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-500/10 font-bold cursor-pointer flex items-center gap-1 shadow-sm transition-all no-print"
                              >
                                <FileText className="h-3 w-3" />
                                Print Receipt
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="text-slate-400">Farmer Contact</p>
                              <p className="font-bold text-slate-700">{selectedReg.phone_number}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">State / Location</p>
                              <p className="font-bold text-slate-700">{selectedReg.village}, {selectedReg.mandal}, {selectedReg.district}</p>
                            </div>
                            {selectedReg.produce_category && (
                              <div>
                                <p className="text-slate-400">Category</p>
                                <p className="font-bold text-slate-700">{selectedReg.produce_category}</p>
                              </div>
                            )}
                            {selectedReg.harvest_date ? (
                              <div>
                                <p className="text-slate-400">Harvest Date</p>
                                <p className="font-bold text-slate-700">{selectedReg.harvest_date}</p>
                              </div>
                            ) : (
                              <div>
                                <p className="text-slate-400">{t('expected_harvest')}</p>
                                <p className="font-bold text-slate-700">{selectedReg.expected_harvest_month}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* PHOTO CAPTURE & OpenCV SECTION */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                              <Camera className="h-5 w-5 text-emerald-600" />
                              {t('visual_assessment_title')}
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">{t('visual_assessment_desc')}</p>
                          </div>

                          {/* Hidden File Input for Local Upload */}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLocalImageUpload}
                            className="hidden"
                            id="local-upload-input"
                          />

                          {/* Image Selector Dialog Modal */}
                          {imageSourceModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
                              <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm relative text-slate-800 dark:text-slate-100 shadow-2xl"
                              >
                                <h4 className="text-sm font-bold mb-2 border-b pb-2 dark:border-slate-800">Select Image Source</h4>
                                <p className="text-xs text-slate-400 mb-6 leading-relaxed">Choose whether you want to upload a crop quality image from your device or take a live photo.</p>
                                
                                <div className="space-y-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setImageSourceModalOpen(false);
                                      document.getElementById('local-upload-input')?.click();
                                    }}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer flex items-center justify-center gap-2"
                                  >
                                    <Upload className="h-4 w-4" />
                                    Upload from Device
                                  </button>
                                  
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      setImageSourceModalOpen(false);
                                      try {
                                        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                                        stream.getTracks().forEach(t => t.stop());
                                        openCamera('close_up');
                                      } catch (e) {
                                        alert('Camera access denied or unavailable. Please check permissions.');
                                      }
                                    }}
                                    className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
                                  >
                                    <Camera className="h-4 w-4" />
                                    Capture Photo
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setImageSourceModalOpen(false)}
                                  className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-250 cursor-pointer border-none bg-transparent"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </motion.div>
                            </div>
                          )}

                          {/* Single Image Area */}
                          <div className="border border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden bg-slate-50/30">
                            {capturedImages['close_up'] || selectedReg.images?.find(i => i.image_type === 'close_up') ? (
                              (() => {
                                const imgObj = selectedReg.images?.find(i => i.image_type === 'close_up');
                                const src = imgObj ? `http://localhost:8000${imgObj.image_url}` : capturedImages['close_up'];
                                const latitude = imgObj ? imgObj.gps_latitude : gpsData.lat;
                                const longitude = imgObj ? imgObj.gps_longitude : gpsData.lng;
                                const locationName = imgObj ? imgObj.gps_location_name : gpsData.loc;
                                const timestamp = imgObj ? imgObj.created_at : new Date().toISOString();
                                const source = imgObj ? (imgObj.image_source || 'Live Capture') : (capturedImages['close_up']?.startsWith('data:image/') ? 'Live Capture' : 'Local Upload');

                                return (
                                  <div className="w-full space-y-4">
                                    <div className="relative h-40 w-full rounded-xl overflow-hidden border border-slate-200/80">
                                      <img src={src} className="h-full w-full object-cover" alt="Close-up Produce" />
                                      <div className="absolute top-2 right-2 bg-emerald-600 text-white rounded-full p-1 shadow">
                                        <CheckCircle className="h-4.5 w-4.5" />
                                      </div>
                                      <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded">
                                        {source}
                                      </span>
                                    </div>

                                    <div className="bg-white border border-slate-100 rounded-xl p-3 space-y-2 text-[10px] text-slate-500 font-semibold shadow-sm">
                                      <p className="flex justify-between items-center">
                                        <span>{t('image_source_label')}</span>
                                        <span className="font-extrabold text-slate-800">{source}</span>
                                      </p>
                                      <p className="flex justify-between items-center">
                                        <span>GPS Coordinates:</span>
                                        <span className="font-mono text-slate-700">{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
                                      </p>
                                      <p className="flex justify-between items-center">
                                        <span>Location Name:</span>
                                        <span className="text-slate-700 truncate max-w-[180px]">{locationName}</span>
                                      </p>
                                      <p className="flex justify-between items-center">
                                        <span>Timestamp:</span>
                                        <span className="text-slate-700">{new Date(timestamp).toLocaleString()}</span>
                                      </p>
                                    </div>

                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setImageSourceModalOpen(true)}
                                        className="flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs uppercase cursor-pointer"
                                      >
                                        Retake Photo
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteImage('close_up')}
                                        className="flex-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 font-bold py-2 rounded-xl text-xs uppercase cursor-pointer"
                                      >
                                        Remove Image
                                      </button>
                                    </div>
                                  </div>
                                );
                              })()
                            ) : (
                              <div className="text-center py-6">
                                <button
                                  type="button"
                                  onClick={() => setImageSourceModalOpen(true)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer border-none"
                                >
                                  <Camera className="h-4 w-4" />
                                  Capture or Upload Photo
                                </button>
                                <p className="text-[10px] text-slate-450 mt-3 font-semibold">Moisture and grain uniformity prediction uses computer vision</p>
                              </div>
                            )}
                          </div>

                          {/* Assessment button */}
                          {selectedReg.status === 'Images Uploaded' && (
                            <button
                              onClick={handleAiPreAssessment}
                              disabled={analyzing}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              {analyzing ? (
                                <>
                                  <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                                  Running OpenCV Analysis...
                                </>
                              ) : (
                                <>
                                  <Sprout className="h-4.5 w-4.5" />
                                  Run AI Pre-Assessment
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* AI ASSESSMENT REPORT */}
                        {aiReport && (
                          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex justify-between items-center border-b pb-3">
                              <h4 className="text-sm font-bold text-slate-900">AI Visual Evaluation Log</h4>
                              <span className="bg-emerald-50 text-emerald-700 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/10">
                                OpenCV Score: {aiReport.score}%
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div className="bg-slate-50 p-3 rounded-xl">
                                <p className="text-slate-400">Visual Quality Grade</p>
                                <p className="font-bold text-slate-800 text-sm mt-0.5">{aiReport.visual_quality}</p>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-xl">
                                <p className="text-slate-400">Grain Uniformity</p>
                                <p className="font-bold text-slate-800 text-sm mt-0.5">{aiReport.grain_uniformity}%</p>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-xl">
                                <p className="text-slate-400">Estimated Moisture</p>
                                <p className="font-bold text-slate-800 text-sm mt-0.5">{aiReport.estimated_moisture}%</p>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-xl">
                                <p className="text-slate-400">Foreign Material</p>
                                <p className="font-bold text-slate-800 text-sm mt-0.5">{aiReport.foreign_material}%</p>
                              </div>
                            </div>

                            <div className="bg-slate-50 p-3.5 rounded-xl border border-dashed border-slate-200">
                              <p className="text-[10px] text-slate-400 uppercase font-bold">Officer Recommendation</p>
                              <p className="text-xs text-slate-600 leading-relaxed mt-1 font-semibold">{aiReport.recommendation}</p>
                            </div>

                            <div className="flex gap-2 bg-slate-50 p-3 rounded-xl">
                              <AlertTriangle className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                              <p className="text-[10px] text-slate-400 leading-normal">{t('ai_disclaimer')}</p>
                            </div>

                            {/* Booking Slot trigger */}
                            {['AI Reviewed', 'Approved', 'Sample Verified'].includes(selectedReg.status) && (
                              <button
                                onClick={() => setBookingOpen(true)}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <Calendar className="h-4.5 w-4.5" />
                                Book Procurement Slot
                              </button>
                            )}
                          </div>
                        )}

                        {/* PAYMENT TRACKING INTERACTIVE WIDGET */}
                        {['Slot Booked', 'Procured', 'Payment Completed'].includes(selectedReg.status) && (
                          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              <Landmark className="h-5 w-5 text-emerald-650" />
                              Payment Tracking Status
                            </h4>

                            <div className="relative pt-1">
                              <div className="flex mb-2 items-center justify-between text-xs">
                                <div>
                                  <span className="text-[10px] font-semibold inline-block py-1 px-2 uppercase rounded-full text-emerald-700 bg-emerald-50">
                                    Direct Payout Status
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-emerald-600">
                                    {selectedReg.status === 'Payment Completed' ? '100% Completed' : '50% Processing'}
                                  </span>
                                </div>
                              </div>
                              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-slate-100">
                                <div
                                  style={{ width: selectedReg.status === 'Payment Completed' ? '100%' : '50%' }}
                                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 transition-all duration-500"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <p className="text-slate-400">Total Amount</p>
                                <p className="font-bold text-slate-800 text-sm">
                                  ₹{Math.round(selectedReg.expected_quantity * 2183).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400">{t('txn_id')}</p>
                                <p className="font-mono font-bold text-slate-700">
                                  {selectedReg.status === 'Payment Completed' ? 'TXN-98754125301' : 'TXN-GENERATING...'}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-semibold">Payment Date</p>
                                <p className="font-semibold text-slate-800">
                                  {selectedReg.status === 'Payment Completed' ? 'July 10, 2026' : 'Awaiting Weigh-In'}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400">{t('expected_payment_date')}</p>
                                <p className="font-semibold text-slate-800">
                                  July 13, 2026
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Vertical status timeline */}
                      <div className="md:col-span-4 space-y-6">
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                          <h4 className="text-sm font-bold mb-6 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-emerald-650" />
                            {t('timeline_status')}
                          </h4>

                          <div className="relative pl-6 border-l-2 border-slate-100 space-y-6 text-xs">
                            {getTimelineSteps().map((step, idx) => {
                              const currentIdx = getTimelineIndex(selectedReg.status);
                              const isCompleted = idx <= currentIdx;
                              const isCurrent = idx === currentIdx;

                              return (
                                <div key={step} className="relative">
                                  <div className={`absolute -left-[31px] top-0 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-350 text-transparent'
                                    }`}>
                                    {isCompleted && <span className="text-[8px] font-bold">✓</span>}
                                  </div>
                                  <div className="pl-1">
                                    <p className={`font-bold transition-colors ${isCurrent ? 'text-emerald-650' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                                      }`}>
                                      {t(`status_${step.toLowerCase().replace(' ', '_')}`) || step}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'register' && (
              /* PRE-HARVEST CROP REGISTRATION FORM */
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm max-w-2xl mx-auto"
              >
                <h3 className="text-lg font-bold text-slate-900 mb-6 border-b pb-3 border-slate-100">
                  Submit Pre-Harvest Registration Form
                </h3>

                <form onSubmit={handleRegisterSubmit} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Crop Name</label>
                      <select
                        value={formData.crop_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, crop_name: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Paddy">Paddy</option>
                        <option value="Cotton">Cotton</option>
                        <option value="Maize">Maize</option>
                        <option value="Millets">Millets</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t('expected_harvest')}</label>
                      <select
                        value={formData.expected_harvest_month}
                        onChange={(e) => setFormData(prev => ({ ...prev, expected_harvest_month: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      >
                        <option value="July 2026">July 2026</option>
                        <option value="August 2026">August 2026</option>
                        <option value="September 2026">September 2026</option>
                        <option value="October 2026">October 2026</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t('expected_qty')}</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 50"
                        value={formData.expected_quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, expected_quantity: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t('land_area')}</label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        placeholder="e.g. 3.5"
                        value={formData.land_area}
                        onChange={(e) => setFormData(prev => ({ ...prev, land_area: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-5">
                    <p className="text-xs font-bold text-slate-500 mb-4 flex items-center gap-1">
                      <MapPin className="h-4.5 w-4.5 text-emerald-650" />
                      Weigh-In Procurement Address Setup
                    </p>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">State</label>
                        <input
                          type="text"
                          required
                          value={formData.state}
                          onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">District</label>
                        <input
                          type="text"
                          required
                          value={formData.district}
                          onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-3 mt-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Mandal</label>
                        <input
                          type="text"
                          required
                          value={formData.mandal}
                          onChange={(e) => setFormData(prev => ({ ...prev, mandal: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Village</label>
                        <input
                          type="text"
                          required
                          value={formData.village}
                          onChange={(e) => setFormData(prev => ({ ...prev, village: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Mobile Contact</label>
                        <input
                          type="tel"
                          required
                          value={formData.phone_number}
                          placeholder="Phone number"
                          onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer mt-4"
                  >
                    {t('submit_reg')}
                  </button>
                </form>
              </motion.div>
            )}

            {activeTab === 'register-produce' && (
              /* HARVESTED PRODUCE REGISTRATION FORM */
              <motion.div
                key="register-produce"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm max-w-2xl mx-auto"
              >
                <h3 className="text-lg font-bold text-slate-900 mb-2 border-b pb-3 border-slate-100 flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-yellow-600" />
                  Submit Harvested Produce Registration
                </h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  For produce that is already harvested and ready for sale. You will be redirected to submit produce quality evaluation images immediately upon submission.
                </p>

                <form onSubmit={handleProduceSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Farmer Name</label>
                      <input
                        type="text"
                        disabled
                        value={produceFormData.farmer_name}
                        className="w-full rounded-xl border border-slate-200 bg-slate-100 py-3 px-4 text-xs font-bold text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        required
                        placeholder="Mobile Number"
                        value={produceFormData.phone_number}
                        onChange={(e) => setProduceFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Produce Name</label>
                      <select
                        value={produceFormData.produce_name}
                        onChange={(e) => setProduceFormData(prev => ({ ...prev, produce_name: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      >
                        {mspProduceItems.map(item => (
                          <option key={item.name} value={item.name}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Category</label>
                      <select
                        value={produceFormData.produce_category}
                        onChange={(e) => setProduceFormData(prev => ({ ...prev, produce_category: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3 text-xs font-semibold focus:outline-none"
                      >
                        <option value="Grains">Grains</option>
                        <option value="Pulses">Pulses</option>
                        <option value="Vegetables">Vegetables</option>
                        <option value="Oilseeds">Oilseeds</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Ready Status</label>
                      <select
                        value={produceFormData.produce_ready_status}
                        onChange={(e) => setProduceFormData(prev => ({ ...prev, produce_ready_status: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3 text-xs font-semibold focus:outline-none"
                      >
                        <option value="Ready">Harvest Complete (Ready)</option>
                        <option value="Storage Ready">In Storage Yards</option>
                        <option value="Bagged">Bags Ready at Field</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Quantity</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 45"
                        value={produceFormData.expected_quantity}
                        onChange={(e) => setProduceFormData(prev => ({ ...prev, expected_quantity: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Unit</label>
                      <select
                        value={produceFormData.quantity_unit}
                        onChange={(e) => setProduceFormData(prev => ({ ...prev, quantity_unit: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3 text-xs font-semibold focus:outline-none"
                      >
                        <option value="Quintals">Quintals</option>
                        <option value="Kg">Kilograms (Kg)</option>
                        <option value="Bags">Bags</option>
                        <option value="Tons">Metric Tons</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Harvest Date</label>
                      <input
                        type="date"
                        required
                        value={produceFormData.harvest_date}
                        onChange={(e) => setProduceFormData(prev => ({ ...prev, harvest_date: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-xs font-bold text-slate-650 mb-3 flex items-center gap-1">
                      <MapPin className="h-4.5 w-4.5 text-yellow-600" />
                      Produce Storage Location
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-505 mb-1.5">State</label>
                        <input
                          type="text"
                          required
                          value={produceFormData.state}
                          onChange={(e) => setProduceFormData(prev => ({ ...prev, state: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-505 mb-1.5">District</label>
                        <input
                          type="text"
                          required
                          value={produceFormData.district}
                          onChange={(e) => setProduceFormData(prev => ({ ...prev, district: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3 mt-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-505 mb-1.5">Mandal</label>
                        <input
                          type="text"
                          required
                          value={produceFormData.mandal}
                          onChange={(e) => setProduceFormData(prev => ({ ...prev, mandal: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-505 mb-1.5">Village</label>
                        <input
                          type="text"
                          required
                          value={produceFormData.village}
                          onChange={(e) => setProduceFormData(prev => ({ ...prev, village: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-505 mb-1.5">PIN Code</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 506003"
                          value={produceFormData.pin_code}
                          onChange={(e) => setProduceFormData(prev => ({ ...prev, pin_code: e.target.value.replace(/\D/g, '') }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer mt-4"
                  >
                    Submit Produce Registration
                  </button>
                </form>
              </motion.div>
            )}

            {activeTab === 'procurement' && (
              /* PROCUREMENT LIST VIEW */
              <motion.div
                key="procurement"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"
              >
                <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-emerald-650" />
                  {t('my_procurement')}
                </h3>

                {loadingProcurements ? (
                  <div className="space-y-3">
                    <div className="h-16 bg-slate-100 animate-pulse rounded-xl" />
                    <div className="h-16 bg-slate-100 animate-pulse rounded-xl" />
                  </div>
                ) : procurements.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <Landmark className="h-12 w-12 text-slate-350 mx-auto mb-3" />
                    <p className="text-sm font-semibold mb-1">No procurements yet</p>
                    <p className="text-xs">Once you book a procurement slot and it gets processed, it will appear here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {/* Table header */}
                    <div className="hidden sm:grid grid-cols-7 text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2 px-2">
                      <span>Proc. ID</span>
                      <span>Crop / Product</span>
                      <span>Quantity</span>
                      <span>Centre</span>
                      <span>Status</span>
                      <span>Payment</span>
                      <span></span>
                    </div>

                    {procurements.map((proc) => (
                      <div
                        key={proc.id}
                        onClick={() => {
                          const reg = registrations.find(r => r.registration_number === proc.registration_number);
                          if (reg) {
                            handleSelectReg(reg);
                            setActiveTab('overview');
                          }
                        }}
                        className="grid grid-cols-1 sm:grid-cols-7 items-center gap-2 py-4 px-2 cursor-pointer hover:bg-slate-50 rounded-xl transition-all group text-xs text-slate-700"
                      >
                        <div>
                          <p className="font-mono font-bold text-slate-800 text-[10px] leading-tight">{proc.procurement_number}</p>
                          <p className="text-[9px] text-slate-400">{new Date(proc.created_at).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{proc.crop_name}</p>
                          <p className="text-[10px] text-slate-450">{proc.product}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{proc.quantity} Qtl</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-805 leading-tight">{proc.centre_name}</p>
                        </div>
                        <div>
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${proc.status === 'Payment Completed' ? 'bg-emerald-100 text-emerald-805' :
                            proc.status === 'Procured' ? 'bg-blue-100 text-blue-800' :
                              proc.status === 'Slot Booked' ? 'bg-amber-100 text-amber-805' :
                                'bg-slate-100 text-slate-600'
                            }`}>
                            {proc.status}
                          </span>
                        </div>
                        <div>
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${proc.payment_status === 'Completed' ? 'bg-emerald-100 text-emerald-805' :
                            proc.payment_status === 'Initiated' || proc.payment_status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                            {proc.payment_status}
                          </span>
                        </div>
                        <div className="flex justify-end">
                          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'msp' && (
              /* MSP REDESIGNED VISUAL CARDS VIEW */
              <motion.div
                key="msp"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 mb-5 border-slate-100">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-650" />
                        {t('pricing_hub_title')}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">{t('pricing_hub_desc')}</p>
                    </div>

                    {/* Demo Warning Banner */}
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-205 text-amber-850 p-2.5 rounded-xl text-[10px] font-bold">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>{t('demo_warning_banner')}</span>
                    </div>
                  </div>

                  {/* Search and Category Filters */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder={t('search_crop')}
                        value={mspSearchQuery}
                        onChange={(e) => setMspSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      {['All', 'Grains', 'Pulses', 'Vegetables', 'Oilseeds'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setMspCategoryFilter(cat)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${mspCategoryFilter === cat
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                          {cat === 'All' ? t('all_categories') : cat === 'Grains' ? t('grains') : cat === 'Pulses' ? t('pulses') : cat === 'Vegetables' ? t('vegetables') : t('oilseeds')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Produce grid cards */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredMspItems.map((item) => (
                    <div
                      key={item.name}
                      className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:translate-y-[-2px] flex flex-col justify-between"
                    >
                      {/* Crop Cover Image */}
                      <div className="h-40 w-full relative">
                        <img
                          src={item.imageUrl}
                          alt={t(item.nameKey)}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <span className={`absolute top-3 right-3 text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full text-white shadow-sm ${item.type === 'msp'
                          ? 'bg-emerald-600 border border-emerald-500/30'
                          : 'bg-orange-600 border border-orange-500/30'
                          }`}>
                          {item.type === 'msp' ? t('msp_rate_label') : t('demo_price_label')}
                        </span>

                        <div className="absolute bottom-3 left-3 text-white">
                          <h4 className="text-sm font-extrabold">{t(item.nameKey)}</h4>
                          <span className="text-[9px] text-slate-200 font-bold uppercase bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded mt-1 inline-block">
                            {t(item.categoryKey)}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                          {t(item.infoKey)}
                        </p>

                        <div className="flex justify-between items-baseline border-t border-slate-100 pt-3">
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{t('price_label')}</span>
                          <div className="text-right">
                            <span className={`text-base font-black ${item.type === 'msp' ? 'text-emerald-600' : 'text-slate-800'}`}>
                              {item.price}
                            </span>
                            <span className="text-[8px] text-slate-400 font-bold ml-1">{t(item.unitKey)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredMspItems.length === 0 && (
                    <div className="col-span-full text-center py-16 bg-white border border-slate-200 rounded-3xl text-slate-405">
                      <Search className="h-10 w-10 mx-auto opacity-30 mb-2" />
                      <p className="text-xs font-bold">{t('no_active_registrations')}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'booking' && (
              <motion.div
                key="booking"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm max-w-2xl mx-auto space-y-6"
              >
                <div className="flex items-center gap-2 border-b pb-4 mb-4">
                  <Calendar className="h-6 w-6 text-emerald-600" />
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{t('slot_booking_title')}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Secure your appointment slot at government procurement PACS centres.</p>
                  </div>
                </div>

                {!bookedProcurement ? (
                  <form onSubmit={handleBookSlotSubmit} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        {t('select_registration_label')}
                      </label>
                      <select
                        value={selectedBookingRegId}
                        onChange={(e) => setSelectedBookingRegId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-500 animate-none"
                        required
                      >
                        <option value="">{t('select_option_placeholder')}</option>
                        {registrations.map(reg => (
                          <option key={reg.id} value={reg.id}>
                            {reg.crop_name} - {reg.registration_number} ({reg.expected_quantity} {reg.quantity_unit || 'Qtl'}) [{reg.status}]
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedBookingRegId && (() => {
                      const selectedRegItem = registrations.find(r => r.id.toString() === selectedBookingRegId);
                      if (!selectedRegItem) return null;
                      const isEligible = ['Approved', 'Sample Verified'].includes(selectedRegItem.status);

                      if (!isEligible) {
                        return (
                          <div className="bg-amber-50 border border-amber-205 text-amber-850 p-4 rounded-2xl flex gap-3 text-xs">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                            <div>
                              <p className="font-extrabold">{t('booking_restricted_title')}</p>
                              <p className="mt-1 font-semibold leading-relaxed">{t('booking_eligibility_error')}</p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-6">
                          <div className="bg-slate-50/55 rounded-2xl p-4 border border-slate-100 grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="text-slate-400">Approved Crop</p>
                              <p className="font-bold text-slate-800">{selectedRegItem.crop_name}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">{t('approved_qty')}</p>
                              <p className="font-bold text-slate-800">{selectedRegItem.expected_quantity} {selectedRegItem.quantity_unit || 'Qtl'}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">PACS Center</p>
                              <p className="font-bold text-slate-850">Warangal Agriculture PACS Centre</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Direct MSP Price</p>
                              <p className="font-extrabold text-emerald-650">₹2,183 / Qtl</p>
                            </div>
                          </div>

                          <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                {t('select_date_label')}
                              </label>
                              <input
                                type="date"
                                value={slotDate}
                                onChange={(e) => setSlotDate(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                                required
                                min={new Date().toISOString().split('T')[0]}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                {t('select_time_label')}
                              </label>
                              <select
                                value={slotTime}
                                onChange={(e) => setSlotTime(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                                required
                              >
                                <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                                <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
                                <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                              </select>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer transition-all"
                          >
                            {t('confirm_booking_btn')}
                          </button>
                        </div>
                      );
                    })()}
                  </form>
                ) : (
                  /* Slot booking receipt section */
                  <div className="space-y-6 printable-section">
                    <div className="text-center space-y-2 border-b pb-6">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-650 flex items-center justify-center mx-auto mb-2 shadow-sm">
                        <CheckCircle className="h-7 w-7" />
                      </div>
                      <h4 className="text-base font-extrabold text-emerald-700">{t('slot_booked_receipt')}</h4>
                      <p className="text-xs text-slate-450 font-bold uppercase">Procurement Booking Reference Number: {bookedProcurement.procurement_number}</p>
                    </div>

                    <div className="bg-slate-50/50 rounded-3xl p-5 border border-slate-100/80 space-y-3.5 text-xs">
                      <h5 className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider mb-2 border-b pb-1.5">{t('booking_receipt_title')}</h5>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-450 font-bold">{t('farmer_name')}</span>
                        <span className="font-bold text-slate-800">{name}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-450 font-bold">Crop / Produce</span>
                        <span className="font-bold text-slate-800">{bookedProcurement.crop_name}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-450 font-bold">{t('approved_qty')}</span>
                        <span className="font-bold text-slate-800">{bookedProcurement.quantity} Qtl</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-450 font-bold">{t('procurement_centre')}</span>
                        <span className="font-bold text-slate-800">{bookedProcurement.centre_name || 'Warangal Agriculture PACS Centre'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-450 font-bold">{t('weigh_in_schedule')}</span>
                        <span className="font-bold text-slate-800">{bookedProcurement.slot_date} ({bookedProcurement.slot_time})</span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-450 font-bold">Direct Benefit Payout (Est)</span>
                        <span className="font-black text-emerald-650">₹{(bookedProcurement.quantity * 2183).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="flex gap-4 no-print">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <FileText className="h-4.5 w-4.5" />
                        {t('print_receipt')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBookedProcurement(null);
                          setSelectedBookingRegId('');
                          setSlotDate('');
                          setActiveTab('overview');
                        }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        {t('close')}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* 7. MARKETPLACE PORTAL TAB */}
            {activeTab === 'marketplace' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 md:col-span-9"
              >
                {/* Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                      🏪 Marketplace Portal
                    </h2>
                    <p className="text-[10px] text-slate-450 uppercase tracking-widest font-extrabold mt-1">
                      Direct-to-Customer (D2C) Kisan Trade
                    </p>
                  </div>
                  
                  {/* Sub-Tabs selector */}
                  <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold self-start sm:self-center">
                    <button
                      onClick={() => setMarketTab('products')}
                      className={`px-4 py-2 rounded-lg cursor-pointer transition-all ${marketTab === 'products' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      My Products
                    </button>
                    <button
                      onClick={() => setMarketTab('orders')}
                      className={`px-4 py-2 rounded-lg cursor-pointer transition-all ${marketTab === 'orders' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Incoming Orders
                    </button>
                    <button
                      onClick={() => setMarketTab('analytics')}
                      className={`px-4 py-2 rounded-lg cursor-pointer transition-all ${marketTab === 'analytics' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Sales Analytics
                    </button>
                  </div>
                </div>

                {/* SUB TAB: PRODUCTS PORTFOLIO */}
                {marketTab === 'products' && (
                  <div className="grid gap-6 md:grid-cols-12">
                    
                    {/* Add Product Form (Col 5) */}
                    <div className="md:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                      <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                        ➕ Publish New Product
                      </h3>
                      <form onSubmit={handleCreateProduct} className="space-y-3.5">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Product Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Sona Masuri Rice, Organic Apples"
                            value={newProductFormData.name}
                            onChange={(e) => setNewProductFormData({...newProductFormData, name: e.target.value})}
                            className="w-full text-xs font-semibold py-2.5 px-3.5 border rounded-xl bg-slate-50 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Description</label>
                          <textarea
                            rows={2}
                            placeholder="Describe organic farming methods, moisture level, etc."
                            value={newProductFormData.description}
                            onChange={(e) => setNewProductFormData({...newProductFormData, description: e.target.value})}
                            className="w-full text-xs font-semibold py-2.5 px-3.5 border rounded-xl bg-slate-50 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Category</label>
                            <select
                              value={newProductFormData.category}
                              onChange={(e) => setNewProductFormData({...newProductFormData, category: e.target.value})}
                              className="w-full text-xs font-semibold py-2.5 px-3 border rounded-xl bg-slate-50 focus:outline-none focus:border-emerald-500"
                            >
                              <option value="Grains">Grains</option>
                              <option value="Pulses">Pulses</option>
                              <option value="Fruits">Fruits</option>
                              <option value="Vegetables">Vegetables</option>
                              <option value="Organic">Organic Only</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Quantity Unit</label>
                            <select
                              value={newProductFormData.unit}
                              onChange={(e) => setNewProductFormData({...newProductFormData, unit: e.target.value})}
                              className="w-full text-xs font-semibold py-2.5 px-3 border rounded-xl bg-slate-50 focus:outline-none focus:border-emerald-500"
                            >
                              <option value="kg">kg</option>
                              <option value="quintal">quintal</option>
                              <option value="bag">bag</option>
                              <option value="bunch">bunch</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Price (₹)</label>
                            <input
                              type="number"
                              required
                              placeholder="Price"
                              value={newProductFormData.price}
                              onChange={(e) => setNewProductFormData({...newProductFormData, price: e.target.value})}
                              className="w-full text-xs font-semibold py-2 px-3 border rounded-xl bg-slate-50 focus:outline-none"
                            />
                          </div>
                          <div className="col-span-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Original (₹)</label>
                            <input
                              type="number"
                              placeholder="Before disc."
                              value={newProductFormData.original_price}
                              onChange={(e) => setNewProductFormData({...newProductFormData, original_price: e.target.value})}
                              className="w-full text-xs font-semibold py-2 px-3 border rounded-xl bg-slate-50 focus:outline-none"
                            />
                          </div>
                          <div className="col-span-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Stock</label>
                            <input
                              type="number"
                              required
                              placeholder="Stock"
                              value={newProductFormData.stock}
                              onChange={(e) => setNewProductFormData({...newProductFormData, stock: e.target.value})}
                              className="w-full text-xs font-semibold py-2 px-3 border rounded-xl bg-slate-50 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex gap-4 py-1.5 text-xs font-bold text-slate-600">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newProductFormData.organic_badge}
                              onChange={(e) => setNewProductFormData({...newProductFormData, organic_badge: e.target.checked})}
                              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                            Leaflet Organic Verified
                          </label>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Freshness Status Banner</label>
                          <input
                            type="text"
                            value={newProductFormData.freshness_badge}
                            onChange={(e) => setNewProductFormData({...newProductFormData, freshness_badge: e.target.value})}
                            className="w-full text-xs font-semibold py-2 px-3 border rounded-xl bg-slate-50"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Product Photo URL</label>
                          <input
                            type="text"
                            value={newProductFormData.image_url}
                            onChange={(e) => setNewProductFormData({...newProductFormData, image_url: e.target.value})}
                            className="w-full text-xs font-semibold py-2 px-3 border rounded-xl bg-slate-50"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                        >
                          {editProductId ? 'Save Product Details' : 'Publish to Mandi'}
                        </button>
                        {editProductId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditProductId(null);
                              setNewProductFormData({
                                name: '',
                                description: '',
                                category: 'Grains',
                                price: '',
                                original_price: '',
                                stock: '',
                                unit: 'kg',
                                organic_badge: false,
                                freshness_badge: 'Freshly Harvested',
                                image_url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=400'
                              });
                            }}
                            className="w-full mt-2 py-2 bg-slate-100 hover:bg-slate-200 border text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Cancel Edit
                          </button>
                        )}
                      </form>
                    </div>
 
                     {/* Products Grid (Col 7) */}
                     <div className="md:col-span-7 space-y-4">
                       <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                         🌾 Published Produce ({marketProducts.length})
                       </h3>
                       
                       {loadingMarket ? (
                         <div className="text-center py-20 bg-white border rounded-3xl">
                           <div className="animate-spin h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto" />
                         </div>
                       ) : (
                         <div className="grid gap-4 sm:grid-cols-2">
                           {marketProducts.map((p) => (
                             <div key={p.id} className="bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                               <div className="relative h-32 bg-slate-100">
                                 <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                                 {p.organic_badge && (
                                   <span className="absolute top-2 left-2 bg-teal-600 text-white text-[8px] font-extrabold px-2 py-0.5 rounded">Organic</span>
                                 )}
                               </div>
                               <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                                 <div>
                                   <h4 className="text-xs font-extrabold text-slate-900">{p.name}</h4>
                                   <p className="text-[10px] text-slate-400 font-semibold line-clamp-1">{p.category} • ₹{p.price} / {p.unit}</p>
                                 </div>
                                 <div className="flex flex-col gap-2 border-t pt-2 mt-2">
                                   <div className="flex justify-between items-center text-[10px] font-bold">
                                     <span className="text-slate-500">Stock: {p.stock} {p.unit}</span>
                                     <span className="text-amber-500">★ {p.rating} / 5</span>
                                   </div>
                                   <div className="flex gap-2">
                                     <button
                                       onClick={() => handleStartEditProduct(p)}
                                       className="flex-1 bg-slate-100 hover:bg-slate-200 border text-slate-700 text-[10px] font-bold py-1.5 px-2 rounded-lg cursor-pointer transition-all"
                                     >
                                       Edit Details
                                     </button>
                                     <button
                                       onClick={() => handleDeleteProduct(p.id)}
                                       className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-[10px] font-bold py-1.5 px-2.5 rounded-lg cursor-pointer transition-all"
                                     >
                                       Delete
                                     </button>
                                   </div>
                                 </div>
                               </div>
                             </div>
                           ))}

                          {marketProducts.length === 0 && (
                            <div className="col-span-full text-center py-20 bg-white border rounded-3xl text-slate-400 font-bold">
                              No products published yet. Create one!
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SUB TAB: INCOMING CUSTOMER ORDERS */}
                {marketTab === 'orders' && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                      📥 Customer Orders
                    </h3>

                    <div className="space-y-4">
                      {marketOrders.map((ord) => (
                        <div key={ord.id} className="border rounded-2xl p-5 space-y-4 shadow-sm hover:shadow transition-all">
                          <div className="flex justify-between items-start border-b pb-3 mb-1">
                            <div>
                              <h4 className="text-xs font-extrabold text-slate-900">Order Ref: #{ord.order_number}</h4>
                              <p className="text-[9px] text-slate-400">Placed: {new Date(ord.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                                ord.status === 'Confirmed' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                                ord.status === 'Shipped' ? 'bg-orange-50 border-orange-100 text-orange-700' :
                                ord.status === 'Delivered' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                'bg-slate-50 border-slate-200 text-slate-700'
                              }`}>{ord.status}</span>
                              <p className="text-xs font-extrabold text-emerald-650 mt-1">Payout: ₹{ord.total_price}</p>
                            </div>
                          </div>

                          <div className="space-y-2 text-xs font-semibold text-slate-600">
                            {ord.items.map((item: any) => (
                              <div key={item.id} className="flex justify-between">
                                <span>{item.product_name} x{item.quantity}</span>
                                <span className="text-slate-900 font-bold">₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>

                          <div className="bg-slate-50 p-3 rounded-xl text-[10px] text-slate-500 font-semibold border">
                            📍 Shipping Address: <span className="text-slate-800">{ord.shipping_address}</span>
                          </div>

                          {/* Order State Action buttons */}
                          <div className="flex gap-2 justify-end pt-2 border-t">
                            {ord.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'Confirmed')}
                                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-extrabold rounded-lg shadow cursor-pointer"
                                >
                                  Confirm Order
                                </button>
                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'Rejected')}
                                  className="px-4 py-1.5 bg-red-50 hover:bg-red-100 text-red-655 text-[10px] font-extrabold rounded-lg cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {ord.status === 'Confirmed' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.id, 'Shipped')}
                                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-extrabold rounded-lg shadow cursor-pointer"
                              >
                                Ship Order (Handover courier)
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {marketOrders.length === 0 && (
                        <div className="text-center py-20 text-slate-400 font-bold">
                          No incoming customer orders.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SUB TAB: EARNINGS SALES ANALYTICS */}
                {marketTab === 'analytics' && (
                  <div className="space-y-6">
                    {/* Analytics stats */}
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Direct Mandi Sales</span>
                        <h4 className="text-2xl font-black text-slate-800">₹{marketAnalytics.total_revenue}</h4>
                        <p className="text-[9px] text-emerald-650 font-bold uppercase">100% Escrow Disbursed</p>
                      </div>

                      <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Active Orders</span>
                        <h4 className="text-2xl font-black text-slate-800">{marketAnalytics.orders_count}</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Incoming customers</p>
                      </div>

                      <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400">D2C Listings</span>
                        <h4 className="text-2xl font-black text-slate-800">{marketAnalytics.products_count}</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Listed on Mandi Grid</p>
                      </div>
                    </div>

                    {/* Sales chart placeholder */}
                    <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
                      <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Weekly Revenue Analytics</h3>
                      <div className="h-44 bg-slate-50 border rounded-2xl flex items-end justify-between p-4 relative pt-10">
                        <div className="absolute top-4 left-4 text-[10px] font-bold text-slate-400">Values in ₹ (INR)</div>
                        {/* Weekly bars */}
                        <div className="w-12 bg-emerald-100 rounded-t-lg h-[40%] flex flex-col justify-end text-center pb-2 text-[9px] font-bold text-emerald-800">
                          ₹2.4k <span className="text-[8px] text-slate-400 uppercase mt-1">Wk 1</span>
                        </div>
                        <div className="w-12 bg-emerald-200 rounded-t-lg h-[60%] flex flex-col justify-end text-center pb-2 text-[9px] font-bold text-emerald-800">
                          ₹4.2k <span className="text-[8px] text-slate-400 uppercase mt-1">Wk 2</span>
                        </div>
                        <div className="w-12 bg-emerald-300 rounded-t-lg h-[80%] flex flex-col justify-end text-center pb-2 text-[9px] font-bold text-emerald-800">
                          ₹7.1k <span className="text-[8px] text-slate-400 uppercase mt-1">Wk 3</span>
                        </div>
                        <div className="w-12 bg-emerald-600 rounded-t-lg h-[95%] flex flex-col justify-end text-center pb-2 text-[9px] font-bold text-white">
                          ₹11.8k <span className="text-[8px] text-white/85 uppercase mt-1">Wk 4</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* 1. CAMERA SIMULATOR MODAL PANEL */}
      <AnimatePresence>
        {cameraOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md relative text-slate-800 flex flex-col gap-4 overflow-hidden shadow-2xl"
            >
              {/* Target guidelines overlay inside camera viewport */}
              <div className="relative h-64 w-full rounded-2xl bg-black overflow-hidden border border-slate-300 flex items-center justify-center">
                {webcamActive ? (
                  <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="text-center p-6 text-slate-500 flex flex-col items-center">
                    <Sprout className="h-10 w-10 text-emerald-600 animate-pulse mb-2" />
                    <p className="text-xs font-semibold text-slate-400">Simulating Crop Camera Viewport...</p>
                    <p className="text-[10px] mt-1 text-slate-650">Camera target matches {imageType.replace('_', ' ')} specifications</p>
                  </div>
                )}
                {/* Visual crop lines guidelines */}
                <div className="absolute inset-8 border border-white/20 rounded pointer-events-none flex items-center justify-center">
                  <div className="h-6 w-6 border-t-2 border-l-2 border-emerald-500 absolute top-0 left-0" />
                  <div className="h-6 w-6 border-t-2 border-r-2 border-emerald-500 absolute top-0 right-0" />
                  <div className="h-6 w-6 border-b-2 border-l-2 border-emerald-500 absolute bottom-0 left-0" />
                  <div className="h-6 w-6 border-b-2 border-r-2 border-emerald-500 absolute bottom-0 right-0" />
                </div>
              </div>

              {/* Hardware & Location stamp indicators */}
              <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-[10px] font-mono text-slate-500 border border-slate-200">
                <div className="flex justify-between">
                  <span>GPS COORDINATES</span>
                  <span className="text-emerald-600 font-bold">{gpsData.lat.toFixed(4)}° N, {gpsData.lng.toFixed(4)}° E</span>
                </div>
                <div className="flex justify-between">
                  <span>LOCATION VERIFIED</span>
                  <span className="text-emerald-650">True (Cellular Ag-Cell Hub)</span>
                </div>
                <div className="flex justify-between">
                  <span>HARDWARE PLATFORM</span>
                  <span>Motorola G84 5G</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={startWebcam}
                  className="flex-1 bg-slate-100 border border-slate-200 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Enable Webcam
                </button>
                <button
                  onClick={captureImage}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 py-2.5 rounded-xl text-xs font-bold text-white shadow"
                >
                  Capture Photo
                </button>
              </div>

              <button
                onClick={() => {
                  stopWebcam();
                  setCameraOpen(false);
                }}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. SLOT BOOKING MODAL PANEL */}
      <AnimatePresence>
        {bookingOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm relative text-slate-800 shadow-2xl"
            >
              <h4 className="text-sm font-bold mb-4">Book Procurement Center Slot</h4>

              <form onSubmit={handleBookSlot} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Select Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={slotDate}
                    onChange={(e) => setSlotDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Select Time Window</label>
                  <select
                    value={slotTime}
                    onChange={(e) => setSlotTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="10:00 AM">10:00 AM - 12:00 PM</option>
                    <option value="12:00 PM">12:00 PM - 02:00 PM</option>
                    <option value="02:00 PM">02:00 PM - 04:00 PM</option>
                    <option value="04:00 PM">04:00 PM - 06:00 PM</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer"
                >
                  Confirm Booking
                </button>
              </form>

              <button
                onClick={() => setBookingOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-650"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default FarmerDashboard;
