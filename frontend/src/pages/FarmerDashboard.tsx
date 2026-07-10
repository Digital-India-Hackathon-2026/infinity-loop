import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sprout, FileText, TrendingUp, Landmark, ChevronRight, Bell, Languages, 
  LogOut, Search, Camera, Calendar, Clock, AlertTriangle, 
  CheckCircle, ArrowLeft, RefreshCw, X, Mic, AlertCircle, ShoppingBag, MapPin
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
  { name: 'Paddy', category: 'Grains', price: '₹2,183', unit: 'per Quintal', type: 'msp', info: 'Primary kharif cereal. Government guaranteed MSP.', image: '🌾' },
  { name: 'Wheat', category: 'Grains', price: '₹2,275', unit: 'per Quintal', type: 'msp', info: 'Rabi staple crop. Government guaranteed MSP.', image: '🍞' },
  { name: 'Maize', category: 'Grains', price: '₹2,090', unit: 'per Quintal', type: 'msp', info: 'Coarse cereal used for feed & food. Government MSP.', image: '🌽' },
  { name: 'Jowar', category: 'Grains', price: '₹3,180', unit: 'per Quintal', type: 'msp', info: 'Sorghum millet, highly drought resistant. Government MSP.', image: '🌾' },
  { name: 'Bajra', category: 'Grains', price: '₹2,500', unit: 'per Quintal', type: 'msp', info: 'Pearl millet staple. Government MSP.', image: '🌾' },
  { name: 'Ragi', category: 'Grains', price: '₹3,846', unit: 'per Quintal', type: 'msp', info: 'Finger millet, high calcium. Government MSP.', image: '🌾' },
  { name: 'Gram', category: 'Pulses', price: '₹5,440', unit: 'per Quintal', type: 'msp', info: 'Chickpea rabi pulse. Government MSP.', image: '🍲' },
  { name: 'Tur', category: 'Pulses', price: '₹7,000', unit: 'per Quintal', type: 'msp', info: 'Pigeon pea kharif pulse. Government MSP.', image: '🍲' },
  { name: 'Moong', category: 'Pulses', price: '₹8,558', unit: 'per Quintal', type: 'msp', info: 'Green gram pulse. Government MSP.', image: '🍲' },
  { name: 'Urad', category: 'Pulses', price: '₹6,950', unit: 'per Quintal', type: 'msp', info: 'Black gram pulse. Government MSP.', image: '🍲' },
  { name: 'Groundnut', category: 'Oilseeds', price: '₹6,377', unit: 'per Quintal', type: 'msp', info: 'Peanut oilseed crop. Government MSP.', image: '🥜' },
  { name: 'Sunflower Seed', category: 'Oilseeds', price: '₹6,760', unit: 'per Quintal', type: 'msp', info: 'High oil yield seed crop. Government MSP.', image: '🌻' },
  { name: 'Soybean', category: 'Oilseeds', price: '₹4,600', unit: 'per Quintal', type: 'msp', info: 'Yellow soybean oilseed. Government MSP.', image: '🌱' },
  { name: 'Sesamum', category: 'Oilseeds', price: '₹8,635', unit: 'per Quintal', type: 'msp', info: 'Sesame til crop. Government MSP.', image: '🌱' },
  { name: 'Cotton', category: 'Other', price: '₹6,620', unit: 'per Quintal', type: 'msp', info: 'Fiber cash crop. Government MSP.', image: '☁️' },
  { name: 'Tomato', category: 'Vegetables', price: '₹1,800', unit: 'per Quintal', type: 'market', info: 'Daily vegetable produce. Market Price / Demo Data.', image: '🍅' },
  { name: 'Onion', category: 'Vegetables', price: '₹2,200', unit: 'per Quintal', type: 'market', info: 'Staple kitchen vegetable. Market Price / Demo Data.', image: '🧅' },
  { name: 'Potato', category: 'Vegetables', price: '₹1,500', unit: 'per Quintal', type: 'market', info: 'Tubers cash crop. Market Price / Demo Data.', image: '🥔' },
  { name: 'Chilli', category: 'Vegetables', price: '₹19,000', unit: 'per Quintal', type: 'market', info: 'Red spice crop. Market Price / Demo Data.', image: '🌶️' },
  { name: 'Turmeric', category: 'Other', price: '₹12,500', unit: 'per Quintal', type: 'market', info: 'Spices cash crop. Market Price / Demo Data.', image: '💛' }
];

const FarmerDashboard: React.FC = () => {
  const { logout, apiFetch, name } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  // Navigation / Tab states
  const [activeTab, setActiveTab] = useState<'overview' | 'register' | 'register-produce' | 'msp' | 'procurement'>('overview');
  
  // Dashboard Data states
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
  const [slotDate, setSlotDate] = useState('');
  const [slotTime, setSlotTime] = useState('10:00 AM');

  // Voice Assistant states
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [voiceReply, setVoiceReply] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

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

  // VOICE ASSISTANT PROCESSOR (FLOATING & MULTILINGUAL)
  const startListening = () => {
    if (recognition) {
      recognition.start();
    } else {
      alert('Speech recognition is not fully supported in this browser.');
    }
  };

  const processVoiceCommand = (text: string) => {
    const query = text.toLowerCase().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g,"");
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
    const matchesSearch = item.name.toLowerCase().includes(mspSearchQuery.toLowerCase());
    const matchesCategory = mspCategoryFilter === 'All' || item.category === mspCategoryFilter;
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
          <div className="relative p-1.5 rounded-lg bg-slate-100 text-slate-550 hover:bg-slate-200 transition-colors cursor-pointer">
            <Bell className="h-4 w-4" />
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">
                {notifications.filter(n => !n.is_read).length}
              </span>
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
              { id: 'overview', label: 'My Registrations', icon: FileText },
              { id: 'register', label: 'Register Crop', icon: Sprout },
              { id: 'register-produce', label: 'Register Produce', icon: ShoppingBag },
              { id: 'msp', label: t('msp_info'), icon: TrendingUp },
              { id: 'procurement', label: t('my_procurement'), icon: Landmark }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedReg(null);
                  if (tab.id === 'procurement') fetchProcurements();
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id 
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
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <button
                        onClick={() => setActiveTab('register')}
                        className="bg-white border border-emerald-100 hover:border-emerald-300 p-5 rounded-2xl shadow-sm text-left transition-all hover:scale-[1.02] flex flex-col justify-between h-28 group cursor-pointer"
                      >
                        <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                          <Sprout className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">Register Crop</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('register-produce')}
                        className="bg-white border border-yellow-100 hover:border-yellow-300 p-5 rounded-2xl shadow-sm text-left transition-all hover:scale-[1.02] flex flex-col justify-between h-28 group cursor-pointer"
                      >
                        <div className="h-9 w-9 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center group-hover:bg-yellow-600 group-hover:text-white transition-all">
                          <ShoppingBag className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">Register Produce</span>
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
                        onClick={() => { setActiveTab('procurement'); fetchProcurements(); }}
                        className="bg-white border border-blue-100 hover:border-blue-300 p-5 rounded-2xl shadow-sm text-left transition-all hover:scale-[1.02] flex flex-col justify-between h-28 group cursor-pointer"
                      >
                        <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <FileText className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">{t('my_procurement')}</span>
                      </button>
                    </div>

                    {/* Weather & Govt Bulletins Grid */}
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Weather widget */}
                      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-3xl text-white shadow-md flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute right-0 bottom-0 bg-white/5 h-24 w-24 rounded-full blur-xl pointer-events-none" />
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs uppercase font-extrabold tracking-wider text-emerald-100">{t('weather_info')}</h4>
                            <p className="text-2xl font-extrabold mt-1">32°C • Sunny</p>
                          </div>
                          <span className="text-4xl">☀️</span>
                        </div>
                        <div className="mt-6 pt-4 border-t border-white/15 text-[11px] leading-relaxed text-emerald-50 font-medium">
                          <p><b>Agricultural Advisory:</b> Low humidity (38%) is ideal for harvested Paddy drying. Keep your harvest covered in case of brief light rains expected next Tuesday.</p>
                        </div>
                      </div>

                      {/* Govt bulletins */}
                      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 flex items-center gap-2">
                            <span className="h-2 w-2 bg-emerald-550 rounded-full animate-pulse" />
                            {t('gov_updates')}
                          </h4>
                          <ul className="mt-4 space-y-3.5 text-xs leading-relaxed font-semibold text-slate-650">
                            <li className="flex items-start gap-2">
                              <span className="text-emerald-600 font-extrabold shrink-0">•</span>
                              <p>Subsidized seeds distribution starting July 20 at local PACS centres.</p>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-emerald-600 font-extrabold shrink-0">•</span>
                              <p>MSP procurement centers in Warangal now accept direct harvested registrations.</p>
                            </li>
                          </ul>
                        </div>
                      </div>
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
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                                  reg.crop_stage === 'Harvested' ? 'bg-yellow-50 text-yellow-750' : 'bg-emerald-50 text-emerald-750'
                                }`}>
                                  {reg.crop_stage === 'Harvested' ? '📦' : '🌱'}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-extrabold text-slate-900">{reg.crop_name}</h4>
                                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                      reg.crop_stage === 'Harvested' ? 'bg-yellow-50 text-yellow-700' : 'bg-emerald-50 text-emerald-700'
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
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  reg.status === 'Payment Completed' ? 'bg-emerald-100 text-emerald-805' :
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
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                          <div className="flex justify-between items-start border-b pb-4 mb-4">
                            <div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                selectedReg.crop_stage === 'Harvested' ? 'bg-yellow-50 text-yellow-700' : 'bg-emerald-50 text-emerald-700'
                              }`}>
                                {selectedReg.crop_stage} Registration Details
                              </span>
                              <h3 className="text-base font-extrabold text-slate-900 mt-2">{selectedReg.crop_name} ({selectedReg.expected_quantity} {selectedReg.quantity_unit || 'Qtl'})</h3>
                              <p className="text-xs text-slate-450 font-mono mt-0.5">{selectedReg.registration_number}</p>
                            </div>
                            <span className="bg-slate-100 text-slate-650 text-xs font-bold px-3 py-1 rounded-lg">
                              Status: {selectedReg.status}
                            </span>
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
                              Visual Assessment Quality Checks
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">Upload required photos for preliminary AI moisture estimation and crop quality grade assessment.</p>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            {(['full_produce', 'close_up', 'storage_view'] as const).map((type) => {
                              const hasImg = capturedImages[type] || selectedReg.images?.find(i => i.image_type === type);
                              const imgObj = selectedReg.images?.find(i => i.image_type === type);
                              const src = imgObj ? `http://localhost:8000${imgObj.image_url}` : capturedImages[type];

                              return (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => openCamera(type)}
                                  className={`relative h-28 border rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-center p-3 cursor-pointer ${
                                    hasImg ? 'border-emerald-500 bg-emerald-50/10' : 'border-dashed border-slate-300 hover:bg-slate-50'
                                  }`}
                                >
                                  {hasImg ? (
                                    <>
                                      <img src={src} className="absolute inset-0 h-full w-full object-cover rounded-2xl opacity-40" />
                                      <CheckCircle className="h-5 w-5 text-emerald-600 relative z-10" />
                                      <span className="text-[9px] font-extrabold uppercase text-emerald-700 relative z-10">{type.replace('_', ' ')}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Camera className="h-5 w-5 text-slate-400" />
                                      <span className="text-[9px] font-bold text-slate-500 leading-tight uppercase">{type.replace('_', ' ')}</span>
                                      <span className="text-[7px] text-slate-450 uppercase tracking-widest font-extrabold bg-slate-100 px-1.5 py-0.5 rounded mt-0.5">Capture</span>
                                    </>
                                  )}
                                </button>
                              );
                            })}
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
                                  <div className={`absolute -left-[31px] top-0 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all ${
                                    isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-350 text-transparent'
                                  }`}>
                                    {isCompleted && <span className="text-[8px] font-bold">✓</span>}
                                  </div>
                                  <div className="pl-1">
                                    <p className={`font-bold transition-colors ${
                                      isCurrent ? 'text-emerald-650' : isCompleted ? 'text-slate-800' : 'text-slate-400'
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
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            proc.status === 'Payment Completed' ? 'bg-emerald-100 text-emerald-805' :
                            proc.status === 'Procured' ? 'bg-blue-100 text-blue-800' :
                            proc.status === 'Slot Booked' ? 'bg-amber-100 text-amber-805' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {proc.status}
                          </span>
                        </div>
                        <div>
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            proc.payment_status === 'Completed' ? 'bg-emerald-100 text-emerald-805' :
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
                        Agricultural Pricing & MSP Information Hub
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Review government Minimum Support Prices (MSP) and local market pricing updates.</p>
                    </div>
                    
                    {/* Demo Warning Banner */}
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-205 text-amber-850 p-2.5 rounded-xl text-[10px] font-bold">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Demo Price Data. Values are for simulation/hackathon testing.</span>
                    </div>
                  </div>

                  {/* Search and Category Filters */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search crops... (e.g. Paddy, Wheat, Tomato, Cotton)"
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
                          className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${
                            mspCategoryFilter === cat 
                              ? 'bg-emerald-600 text-white shadow-sm' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Produce grid cards */}
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredMspItems.map((item) => (
                    <div 
                      key={item.name} 
                      className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-48"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3.5">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{item.image}</span>
                            <span className="text-sm font-extrabold text-slate-900">{item.name}</span>
                          </div>
                          <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            item.type === 'msp' 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-350/20' 
                              : 'bg-slate-100 text-slate-650'
                          }`}>
                            {item.type === 'msp' ? 'Govt MSP' : 'Market Price'}
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-450 leading-relaxed font-medium mb-4">
                          {item.info}
                        </p>
                      </div>

                      <div className="flex justify-between items-baseline border-t border-slate-50 pt-3">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Price / {item.unit}</span>
                        <div className="text-right">
                          <span className={`text-base font-extrabold ${item.type === 'msp' ? 'text-emerald-650' : 'text-slate-800'}`}>
                            {item.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredMspItems.length === 0 && (
                    <div className="col-span-full text-center py-16 bg-white border border-slate-200 rounded-3xl text-slate-400">
                      <Search className="h-10 w-10 mx-auto opacity-30 mb-2" />
                      <p className="text-xs font-bold">No crops matches your search.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* FLOATING VOICE NAVIGATION ASSISTANT (Premium Implementation) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={startListening}
          className={`h-16 w-16 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95 cursor-pointer border ${
            voiceActive ? 'bg-red-500 border-red-400 text-white animate-pulse' : 'bg-emerald-600 border-emerald-500 text-white'
          }`}
          title="Voice Assistant Navigation"
        >
          <Mic className="h-7 w-7" />
        </button>

        {voiceActive && (
          <div className="absolute bottom-20 right-0 w-72 bg-white border border-slate-200 p-4 rounded-2xl shadow-2xl space-y-3 z-50">
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 items-center h-4 shrink-0">
                <div className="wave-bar !h-3" />
                <div className="wave-bar !h-4" />
                <div className="wave-bar !h-2" />
              </div>
              <span className="text-xs font-bold text-slate-700 animate-pulse">Listening... Speak now</span>
            </div>
            
            {voiceText && (
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                <p className="text-[9px] uppercase font-bold text-slate-400">Heard:</p>
                <p className="font-bold text-slate-800 mt-0.5">"{voiceText}"</p>
              </div>
            )}
          </div>
        )}

        {voiceReply && !voiceActive && (
          <div className="absolute bottom-20 right-0 w-72 bg-emerald-50 text-emerald-850 border border-emerald-200 p-4 rounded-2xl shadow-2xl space-y-2 z-50">
            <p className="text-[9px] uppercase font-bold text-emerald-600">Assistant Response:</p>
            <p className="text-xs font-semibold leading-relaxed text-slate-850">{voiceReply}</p>
            <button 
              onClick={() => setVoiceReply('')} 
              className="text-[10px] text-slate-450 hover:text-slate-700 hover:underline font-bold mt-1 block"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

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
