import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Sprout, FileText, Landmark, LogOut, Languages, Calendar, 
  Mic, MicOff, Camera, RefreshCw, CheckCircle, 
  TrendingUp, ChevronRight, X, Clock, AlertTriangle, Bell 
} from 'lucide-react';

interface Registration {
  id: number;
  registration_number: string;
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
}



const FarmerDashboard: React.FC = () => {
  const { logout, apiFetch, name } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  // Navigation / Tab states
  const [activeTab, setActiveTab] = useState<'overview' | 'register' | 'msp'>('overview');
  
  // Dashboard Data states
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [mspRates, setMspRates] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(true);
  
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
    fetchMspRates();
    
    // Load Voice Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      // Map speech language based on app language
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

  const fetchMspRates = async () => {
    try {
      const msps = await apiFetch('/api/msp');
      setMspRates(msps);
    } catch (err) {
      console.error('Error loading MSP:', err);
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
        // Convert base64 data to Blob
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
          // Keep selection details updated
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

  // VOICE ASSISTANT PROCESSOR
  const startListening = () => {
    if (recognition) {
      recognition.start();
    } else {
      alert('Speech synthesis/recognition is not fully supported in this browser tab.');
    }
  };

  const processVoiceCommand = (text: string) => {
    const query = text.toLowerCase();
    let reply = '';
    let voiceLang = 'en-US';

    // Matches languages
    if (language === 'te' || query.includes('డబ్బులు') || query.includes('పైసలు') || query.includes('పేమెంట్') || query.includes('నా డబ్బులు')) {
      // Telugu Response
      voiceLang = 'te-IN';
      const completed = registrations.find(r => r.status === 'Payment Completed');
      if (completed) {
        reply = `వరి నమోదు ${completed.registration_number} కొరకు మీ ₹${Math.round(completed.expected_quantity * 2183)} ల పేమెంట్ విజయవంతంగా పూర్తయింది. ట్రాన్సాక్షన్ ఐడి ఖాతాకు పంపబడింది.`;
      } else {
        const pending = registrations[0];
        if (pending) {
          reply = `మీ పంట నమోదు ${pending.registration_number} ప్రస్తుతం ${pending.status} స్థితిలో ఉంది. త్వరలోనే తదుపరి ప్రక్రియ ప్రారంభమవుతుంది.`;
        } else {
          reply = "మీరు ఇంకా ఎటువంటి పంట నమోదు చేసుకోలేదు. దయచేసి పంట నమోదు బటన్ నొక్కి వివరాలు నమోదు చేయండి.";
        }
      }
    } else if (language === 'hi' || query.includes('पैसा') || query.includes('भुगतान') || query.includes('स्थिति') || query.includes('पैसे')) {
      // Hindi Response
      voiceLang = 'hi-IN';
      const completed = registrations.find(r => r.status === 'Payment Completed');
      if (completed) {
        reply = `धान पंजीकरण ${completed.registration_number} के लिए आपका ₹${Math.round(completed.expected_quantity * 2183)} का भुगतान पूरा हो गया है।`;
      } else {
        const pending = registrations[0];
        if (pending) {
          reply = `आपकी फसल पंजीकरण संख्या ${pending.registration_number} की स्थिति: ${pending.status} है।`;
        } else {
          reply = "आपके पास कोई सक्रिय पंजीकरण नहीं है। कृपया नया पंजीकरण दर्ज करें।";
        }
      }
    } else {
      // English Response
      voiceLang = 'en-US';
      const completed = registrations.find(r => r.status === 'Payment Completed');
      if (completed) {
        reply = `Your payment of Rs. ${Math.round(completed.expected_quantity * 2183)} for registration ${completed.registration_number} has been completed successfully.`;
      } else {
        const pending = registrations[0];
        if (pending) {
          reply = `Your crop registration ${pending.registration_number} is currently in state: ${pending.status}.`;
        } else {
          reply = "We could not find any active crop registrations. Please submit a new pre-harvest form.";
        }
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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Dashboard Top bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow">
            <Sprout className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">Farmer Portal</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t('app_title')}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 px-3 py-1.5 rounded-lg border border-emerald-500/10">
            Welcome, <span className="font-bold">{name}</span>
          </span>

          {/* Notification Bell Badge */}
          <div className="relative p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-850 dark:text-slate-350 transition-colors">
            <Bell className="h-4 w-4" />
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">
                {notifications.filter(n => !n.is_read).length}
              </span>
            )}
          </div>

          {/* Languages Selector */}
          <div className="relative group">
            <button className="flex items-center gap-1 bg-slate-100 border dark:bg-slate-800 px-2 py-1 rounded text-xs">
              <Languages className="h-3.5 w-3.5 text-emerald-600" />
              <span className="uppercase">{language}</span>
            </button>
            <div className="absolute right-0 mt-1 hidden w-28 bg-white dark:bg-slate-900 border p-1 rounded shadow-lg group-hover:block">
              {['en', 'te', 'hi'].map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l as any)}
                  className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 uppercase"
                >
                  {l === 'en' ? 'English' : l === 'te' ? 'తెలుగు' : 'हिंदी'}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={logout}
            className="flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/30 dark:border-red-950 dark:text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold"
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
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aadhaar Verified ID</p>
              <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">UIDAI: *******8940</p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { id: 'overview', label: 'My Crop registrations', icon: FileText },
              { id: 'register', label: t('register_crop'), icon: Sprout },
              { id: 'msp', label: t('msp_info'), icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedReg(null);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-emerald-600 border-emerald-600 text-white shadow' : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'}`}
              >
                <div className="flex items-center gap-3">
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </button>
            ))}
          </div>

          {/* VOICE ASSISTANT WIDGET */}
          <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 p-5 rounded-3xl shadow-xl text-white relative overflow-hidden">
            <div className="absolute right-0 bottom-0 bg-white/5 h-20 w-20 rounded-full blur-xl pointer-events-none" />
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-emerald-300 flex items-center gap-2 mb-2">
              <Mic className="h-4.5 w-4.5" />
              Accessibility Speech
            </h4>
            <p className="text-[11px] leading-relaxed text-emerald-100/90 mb-4">
              Click microphone and ask about your payment or status in English, తెలుగు or हिंदी.
            </p>

            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={startListening}
                className={`h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 ${voiceActive ? 'bg-red-500 animate-pulse' : 'bg-emerald-600 border border-emerald-500'}`}
              >
                {voiceActive ? <MicOff className="h-6 w-6 text-white" /> : <Mic className="h-6 w-6 text-white" />}
              </button>

              {voiceActive && (
                <div className="flex gap-1 items-center h-8 my-1">
                  <div className="wave-bar" />
                  <div className="wave-bar" />
                  <div className="wave-bar" />
                  <div className="wave-bar" />
                  <div className="wave-bar" />
                  <div className="wave-bar" />
                  <div className="wave-bar" />
                </div>
              )}

              {voiceText && (
                <div className="w-full text-center">
                  <p className="text-[10px] text-emerald-300 font-bold uppercase">Spoken Query:</p>
                  <p className="text-xs bg-slate-950/40 p-2 rounded-lg font-semibold mt-1">"{voiceText}"</p>
                </div>
              )}

              {voiceReply && (
                <div className="w-full bg-slate-950/60 p-3 rounded-xl border border-emerald-500/20">
                  <p className="text-[10px] text-gov-gold-400 font-bold uppercase">Voice Assistant Reply:</p>
                  <p className="text-xs text-slate-100 mt-1 leading-relaxed">{voiceReply}</p>
                </div>
              )}
            </div>
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
                        className="bg-white dark:bg-slate-900 border border-emerald-500/10 hover:border-emerald-500/35 p-5 rounded-2xl shadow-sm text-left transition-all hover:scale-[1.02] flex flex-col justify-between h-28 group"
                      >
                        <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                          <Sprout className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t('register_crop')}</span>
                      </button>

                      <button
                        onClick={() => { setActiveTab('overview'); setSelectedReg(null); }}
                        className="bg-white dark:bg-slate-900 border border-blue-500/10 hover:border-blue-500/35 p-5 rounded-2xl shadow-sm text-left transition-all hover:scale-[1.02] flex flex-col justify-between h-28 group"
                      >
                        <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-650 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <FileText className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t('my_procurement')}</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('msp')}
                        className="bg-white dark:bg-slate-900 border border-amber-500/10 hover:border-amber-500/35 p-5 rounded-2xl shadow-sm text-left transition-all hover:scale-[1.02] flex flex-col justify-between h-28 group"
                      >
                        <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-650 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t('msp_info')}</span>
                      </button>

                      <button
                        onClick={startListening}
                        className="bg-white dark:bg-slate-900 border border-purple-500/10 hover:border-purple-500/35 p-5 rounded-2xl shadow-sm text-left transition-all hover:scale-[1.02] flex flex-col justify-between h-28 group"
                      >
                        <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-650 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                          <Mic className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t('voice_assistant')}</span>
                      </button>
                    </div>

                    {/* Weather & Govt Updates Grid */}
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Weather widget */}
                      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-900 dark:to-indigo-950 p-6 rounded-3xl text-white shadow-md flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute right-0 bottom-0 bg-white/5 h-24 w-24 rounded-full blur-xl pointer-events-none" />
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs uppercase font-extrabold tracking-wider text-blue-200">{t('weather_info')}</h4>
                            <p className="text-2xl font-extrabold mt-1">32°C • Sunny</p>
                          </div>
                          <span className="text-4xl">☀️</span>
                        </div>
                        <div className="mt-6 pt-4 border-t border-white/10 text-[11px] leading-relaxed text-blue-100 font-medium">
                          <p><b>Agricultural Advisory:</b> Low humidity (38%) is ideal for sun-drying harvested Paddy. Protect cut crops from brief light rain expected in mandals near Warangal next Tuesday.</p>
                        </div>
                      </div>

                      {/* Govt bulletins */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
                            <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                            {t('gov_updates')}
                          </h4>
                          <ul className="mt-4 space-y-3.5 text-xs leading-relaxed font-semibold">
                            <li className="flex items-start gap-2">
                              <span className="text-emerald-500 font-extrabold shrink-0">•</span>
                              <p className="text-slate-600 dark:text-slate-350">Subsidized Paddy seeds distribution starting July 20 at local PACS centres.</p>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-emerald-500 font-extrabold shrink-0">•</span>
                              <p className="text-slate-600 dark:text-slate-300">Kharif Paddy MSP revised to ₹2,183/Qtl for Grade A. Book slots early.</p>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* REGISTRATIONS QUEUE LIST */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                      <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-emerald-600" />
                        My Crop Registrations
                      </h3>

                      {loadingRegs ? (
                        <div className="space-y-3">
                          <div className="h-14 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
                          <div className="h-14 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
                        </div>
                      ) : registrations.length === 0 ? (
                        <div className="text-center py-12">
                          <Sprout className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                          <p className="text-sm font-semibold text-slate-400">No registrations found. Register your pre-harvest crop to start.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {registrations.map((reg) => (
                            <div 
                              key={reg.id} 
                              onClick={() => handleSelectReg(reg)}
                              className="flex justify-between items-center py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 px-2 rounded-xl transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg flex items-center justify-center text-emerald-600">
                                  <Sprout className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold">{reg.crop_name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">Reg ID: {reg.registration_number}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                  reg.status === 'Payment Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                  reg.status === 'Procured' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                                  reg.status === 'Slot Booked' ? 'bg-gov-gold-100 text-gov-gold-800 dark:bg-gov-gold-950 dark:text-gov-gold-300' :
                                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
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
                  /* DETAILED REGISTRATION VIEW */
                  <div className="space-y-6">
                    <button
                      onClick={() => setSelectedReg(null)}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                    >
                      <X className="h-4 w-4" />
                      Back to Queue
                    </button>

                    <div className="grid gap-6 md:grid-cols-12">
                      {/* Left: General info and steps */}
                      <div className="md:col-span-8 space-y-6">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                          <div className="flex justify-between items-start border-b pb-4 mb-4 dark:border-slate-800">
                            <div>
                              <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{selectedReg.crop_name} Pre-Harvest Registration</h3>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Registration ID: {selectedReg.registration_number}</p>
                            </div>
                            <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/10">
                              {selectedReg.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="text-slate-400">Village & Mandal</p>
                              <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedReg.village}, {selectedReg.mandal}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">District & State</p>
                              <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedReg.district}, {selectedReg.state}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Land Acreage</p>
                              <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedReg.land_area} Acres</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Expected Quantity</p>
                              <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedReg.expected_quantity} Qtl</p>
                            </div>
                          </div>
                        </div>

                        {/* LIVE CAMERA CAPTURE BLOCK */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                          <h4 className="text-sm font-bold mb-1 flex items-center gap-2">
                            <Camera className="h-5 w-5 text-emerald-600" />
                            Produce Images Verification
                          </h4>
                          <p className="text-[11px] text-slate-400 mb-6">Capture the three required farm-gate check photos. Gallery upload is blocked by security policy.</p>

                          <div className="grid grid-cols-3 gap-4">
                            {(['full_produce', 'close_up', 'storage_view'] as const).map((type) => {
                              const isCaptured = !!capturedImages[type] || ['AI Reviewed', 'Sample Requested', 'Approved', 'Slot Booked', 'Procured', 'Payment Completed'].includes(selectedReg.status);
                              return (
                                <div key={type} className="flex flex-col items-center">
                                  <div className="relative h-24 w-full rounded-2xl bg-slate-100 border border-slate-200/80 dark:bg-slate-950 dark:border-slate-850 flex flex-col items-center justify-center overflow-hidden group">
                                    {isCaptured ? (
                                      <div className="absolute inset-0 bg-emerald-950/10 flex flex-col items-center justify-center text-emerald-600">
                                        <CheckCircle className="h-8 w-8 text-emerald-500" />
                                        <span className="text-[9px] font-bold uppercase mt-1">Uploaded</span>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => openCamera(type)}
                                        className="h-full w-full flex flex-col items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-900"
                                      >
                                        <Camera className="h-6 w-6" />
                                        <span className="text-[9px] font-semibold uppercase mt-1">Capture</span>
                                      </button>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 capitalize mt-2 font-bold">
                                    {type.replace('_', ' ')}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Trigger AI assess buttons */}
                          {selectedReg.status === 'Images Uploaded' && (
                            <button
                              onClick={handleAiPreAssessment}
                              disabled={analyzing}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider mt-6 shadow-md transition-all flex items-center justify-center gap-2"
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
                          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex justify-between items-center border-b pb-3 dark:border-slate-800">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">AI Visual Evaluation Log</h4>
                              <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                                OpenCV Score: {aiReport.score}%
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl">
                                <p className="text-slate-400">Visual Quality Grade</p>
                                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">{aiReport.visual_quality}</p>
                              </div>
                              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl">
                                <p className="text-slate-400">Grain Uniformity</p>
                                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">{aiReport.grain_uniformity}%</p>
                              </div>
                              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl">
                                <p className="text-slate-400">Estimated Moisture</p>
                                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">{aiReport.estimated_moisture}%</p>
                              </div>
                              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl">
                                <p className="text-slate-400">Foreign Material</p>
                                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">{aiReport.foreign_material}%</p>
                              </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-dashed dark:border-slate-800">
                              <p className="text-[10px] text-slate-400 uppercase font-bold">Officer Recommendation</p>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1 font-semibold">{aiReport.recommendation}</p>
                            </div>

                            <div className="flex gap-2 bg-slate-100 dark:bg-slate-950/60 p-3 rounded-xl">
                              <AlertTriangle className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                              <p className="text-[10px] text-slate-400 leading-normal">{t('ai_disclaimer')}</p>
                            </div>

                            {/* Booking Slot trigger */}
                            {['AI Reviewed', 'Approved', 'Sample Verified'].includes(selectedReg.status) && (
                              <button
                                onClick={() => setBookingOpen(true)}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2"
                              >
                                <Calendar className="h-4.5 w-4.5" />
                                Book Procurement Slot
                              </button>
                            )}
                          </div>
                        )}

                        {/* PAYMENT TRACKING INTERACTIVE WIDGET */}
                        {['Slot Booked', 'Procured', 'Payment Completed'].includes(selectedReg.status) && (
                          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <Landmark className="h-5 w-5 text-emerald-600" />
                              Payment Tracking Status
                            </h4>

                            <div className="relative pt-1">
                              <div className="flex mb-2 items-center justify-between text-xs">
                                <div>
                                  <span className="text-[10px] font-semibold inline-block py-1 px-2 uppercase rounded-full text-emerald-600 bg-emerald-50 dark:bg-emerald-950">
                                    Direct Payout Status
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-emerald-600">
                                    {selectedReg.status === 'Payment Completed' ? '100% Completed' : '50% Processing'}
                                  </span>
                                </div>
                              </div>
                              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-slate-100 dark:bg-slate-950">
                                <div 
                                  style={{ width: selectedReg.status === 'Payment Completed' ? '100%' : '50%' }}
                                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 transition-all duration-500"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <p className="text-slate-400">Total Amount</p>
                                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                                  ₹{Math.round(selectedReg.expected_quantity * 2183).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400">{t('txn_id')}</p>
                                <p className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                  {selectedReg.status === 'Payment Completed' ? 'TXN-98754125301' : 'TXN-GENERATING...'}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400">Payment Date</p>
                                <p className="font-semibold text-slate-800 dark:text-slate-200">
                                  {selectedReg.status === 'Payment Completed' ? 'July 10, 2026' : 'Awaiting Weigh-In'}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400">{t('expected_payment_date')}</p>
                                <p className="font-semibold text-slate-800 dark:text-slate-200">
                                  July 13, 2026
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Vertical status timeline */}
                      <div className="md:col-span-4 space-y-6">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                          <h4 className="text-sm font-bold mb-6 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-emerald-600" />
                            {t('timeline_status')}
                          </h4>

                          <div className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-850 space-y-6 text-xs">
                            {getTimelineSteps().map((step, idx) => {
                              const currentIdx = getTimelineIndex(selectedReg.status);
                              const isCompleted = idx <= currentIdx;
                              const isCurrent = idx === currentIdx;

                              return (
                                <div key={step} className="relative">
                                  <div className={`absolute -left-[31px] top-0 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-900 border-slate-300'}`}>
                                    {isCompleted && <span className="text-[8px] font-bold">✓</span>}
                                  </div>
                                  <div className="pl-1">
                                    <p className={`font-bold transition-colors ${isCurrent ? 'text-emerald-600 dark:text-emerald-400' : isCompleted ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
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
              /* CROP REGISTRATION FORM */
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-8 shadow-sm max-w-2xl mx-auto"
              >
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b pb-3 dark:border-slate-800">
                  Submit Pre-Harvest Registration Form
                </h3>

                <form onSubmit={handleRegisterSubmit} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Crop Name</label>
                      <select
                        value={formData.crop_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, crop_name: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Paddy">Paddy</option>
                        <option value="Cotton">Cotton</option>
                        <option value="Maize">Maize</option>
                        <option value="Millets">Millets</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{t('expected_harvest')}</label>
                      <select
                        value={formData.expected_harvest_month}
                        onChange={(e) => setFormData(prev => ({ ...prev, expected_harvest_month: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      >
                        <option value="July 2026">July 2026</option>
                        <option value="August 2026">August 2026</option>
                        <option value="September 2026">September 2026</option>
                        <option value="October 2026">October 2026</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{t('expected_qty')}</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 50"
                        value={formData.expected_quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, expected_quantity: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{t('land_area')}</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 4.5"
                        value={formData.land_area}
                        onChange={(e) => setFormData(prev => ({ ...prev, land_area: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{t('district')}</label>
                      <input
                        type="text"
                        required
                        value={formData.district}
                        onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{t('mandal')}</label>
                      <input
                        type="text"
                        required
                        value={formData.mandal}
                        onChange={(e) => setFormData(prev => ({ ...prev, mandal: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{t('village')}</label>
                      <input
                        type="text"
                        required
                        value={formData.village}
                        onChange={(e) => setFormData(prev => ({ ...prev, village: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{t('phone_number')}</label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="9876543210"
                        value={formData.phone_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value.replace(/\D/g, '') }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow-md transition-all mt-4"
                  >
                    Submit Registration
                  </button>
                </form>
              </motion.div>
            )}

            {activeTab === 'msp' && (
              /* MSP INFORMATION TABLES */
              <motion.div
                key="msp"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm"
              >
                <h3 className="text-base font-bold mb-6 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  Minimum Support Prices (MSP) Schedules 2026-27
                </h3>

                <div className="grid gap-6 md:grid-cols-2">
                  {mspRates.map((m) => (
                    <div key={m.id} className="border border-slate-200/60 dark:border-slate-800 p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 relative overflow-hidden flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-bold">{m.crop_name}</span>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold font-mono">Verified</span>
                        </div>
                        
                        <div className="space-y-2 mb-4 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Govt MSP Rate</span>
                            <span className="font-bold text-emerald-600">₹{m.msp_rate} / Qtl</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Expected Mandi Rate</span>
                            <span className="font-bold text-slate-500">₹{m.expected_market_price} / Qtl</span>
                          </div>
                        </div>
                      </div>

                      {m.government_notification_url && (
                        <a
                          href={m.government_notification_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-emerald-600 font-bold hover:underline"
                        >
                          View Official Govt Notification Notification
                        </a>
                      )}
                    </div>
                  ))}
                </div>
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
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md relative text-slate-100 flex flex-col gap-4 overflow-hidden"
            >
              {/* Target guidelines overlay inside camera viewport */}
              <div className="relative h-64 w-full rounded-2xl bg-black overflow-hidden border border-slate-800 flex items-center justify-center">
                {webcamActive ? (
                  <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="text-center p-6 text-slate-500 flex flex-col items-center">
                    <Sprout className="h-10 w-10 text-emerald-600 animate-pulse mb-2" />
                    <p className="text-xs font-semibold text-slate-400">Simulating Crop Camera Viewport...</p>
                    <p className="text-[10px] mt-1 text-slate-600">Camera target matches {imageType.replace('_', ' ')} specifications</p>
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
              <div className="bg-slate-950 p-3 rounded-xl space-y-1.5 text-[10px] font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>GPS COORDINATES</span>
                  <span className="text-emerald-500 font-bold">{gpsData.lat.toFixed(4)}° N, {gpsData.lng.toFixed(4)}° E</span>
                </div>
                <div className="flex justify-between">
                  <span>LOCATION VERIFIED</span>
                  <span className="text-emerald-500">True (Cellular Ag-Cell Hub)</span>
                </div>
                <div className="flex justify-between">
                  <span>HARDWARE PLATFORM</span>
                  <span>Motorola G84 5G</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={startWebcam}
                  className="flex-1 bg-slate-800 border border-slate-700 py-2.5 rounded-xl text-xs font-bold text-slate-200"
                >
                  Enable Webcam
                </button>
                <button
                  onClick={captureImage}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 py-2.5 rounded-xl text-xs font-bold text-white shadow-md"
                >
                  Capture Photo
                </button>
              </div>

              <button
                onClick={() => {
                  stopWebcam();
                  setCameraOpen(false);
                }}
                className="absolute right-4 top-4 text-slate-400 hover:text-white"
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
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm relative text-slate-800 dark:text-slate-100"
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
                    className="w-full rounded-xl border border-slate-250 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 py-2 px-3 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Select Time Window</label>
                  <select
                    value={slotTime}
                    onChange={(e) => setSlotTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-250 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 py-2 px-3 text-xs focus:outline-none"
                  >
                    <option value="10:00 AM">10:00 AM - 12:00 PM</option>
                    <option value="12:00 PM">12:00 PM - 02:00 PM</option>
                    <option value="02:00 PM">02:00 PM - 04:00 PM</option>
                    <option value="04:00 PM">04:00 PM - 06:00 PM</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider shadow"
                >
                  Confirm Booking
                </button>
              </form>

              <button
                onClick={() => setBookingOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
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
