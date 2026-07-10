import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Landmark, Search, ShieldCheck, MapPin, Eye, X, LogOut, Printer 
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons in Vite
const greenMarkerIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const orangeMarkerIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface FarmerRequest {
  id: number;
  registration_number: string;
  farmer_name: string;
  crop_name: string;
  district: string;
  quantity: number;
  ai_score: number;
  status: string;
  created_at: string;
}

interface Centre {
  id: number;
  name: string;
  district: string;
  mandal: string;
  latitude: number;
  longitude: number;
  contact_number: string;
}

const OfficerDashboard: React.FC = () => {
  const { logout, apiFetch, name } = useAuth();
  const { t } = useLanguage();

  // Core Data States
  const [requests, setRequests] = useState<FarmerRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<FarmerRequest[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Selected Farmer Detail Panel
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [images, setImages] = useState<any[]>([]);
  const [aiReport, setAiReport] = useState<any>(null);

  // Modals
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [procureModalOpen, setProcureModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  // Inspection Form States
  const [inspectData, setInspectData] = useState({
    moisture: '12.5',
    foreign_matter: '1.0',
    grain_quality: 'A Grade',
    remarks: 'Produce conforms to Grade A standards.',
    status: 'Approved',
    verification_centre: 'Warangal Main PACS Center',
    verification_date: '',
    verification_time: '10:00 AM - 12:00 PM',
    sample_instructions: 'Please bring 2kg of crop sample in a sealed plastic bag for lab chemical verification.'
  });

  // Weigh-in Form States
  const [weighData, setWeighData] = useState({
    declared_qty: 0,
    actual_qty: 0,
    accepted_qty: 0,
    msp_rate: 2183.0,
    slot_date: '',
    slot_time: '10:00 AM'
  });

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    fetchOfficerData();
    fetchCentres();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchQuery, statusFilter]);

  // Leaflet map renderer
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Initialize Leaflet Map once
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([17.9784, 79.5941], 8);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Plot Procurement Hubs (Green Markers)
    centres.forEach(c => {
      if (mapRef.current) {
        const marker = L.marker([c.latitude, c.longitude], { icon: greenMarkerIcon })
          .addTo(mapRef.current)
          .bindPopup(`<b>${c.name}</b><br/>Govt Coordination Hub<br/>Mandal: ${c.mandal}`);
        markersRef.current.push(marker);
      }
    });

    // Plot Farmer Geolocation coordinates if a request is selected
    if (selectedReq && selectedReq.farmer_lat) {
      if (mapRef.current) {
        const marker = L.marker([selectedReq.farmer_lat, selectedReq.farmer_lng], { icon: orangeMarkerIcon })
          .addTo(mapRef.current)
          .bindPopup(`<b>Farmer: ${selectedReq.farmer_name}</b><br/>Crop: ${selectedReq.crop_name}<br/>Acreage: ${selectedReq.land_area} Ac`)
          .openPopup();
        markersRef.current.push(marker);
        mapRef.current.setView([selectedReq.farmer_lat, selectedReq.farmer_lng], 10);
      }
    }
  }, [centres, selectedReq]);

  const fetchOfficerData = async () => {
    try {
      setLoading(true);
      const list = await apiFetch('/api/officer/requests');
      setRequests(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCentres = async () => {
    try {
      const list = await apiFetch('/api/centres');
      setCentres(list);
    } catch (e) {
      console.error(e);
    }
  };

  const filterRequests = () => {
    let result = [...requests];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.farmer_name.toLowerCase().includes(q) || 
        r.registration_number.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter(r => r.status === statusFilter);
    }

    setFilteredRequests(result);
  };

  const handleSelectRequest = async (req: FarmerRequest) => {
    try {
      const detail = await apiFetch(`/api/crops/${req.id}`);
      
      // Seed detail properties for map coordinate plotting
      let lat = 17.9784 + (req.id % 5) * 0.05;
      let lng = 79.5941 + (req.id % 5) * 0.03;
      
      setSelectedReq({
        ...detail,
        farmer_name: req.farmer_name,
        ai_score: req.ai_score,
        farmer_lat: lat,
        farmer_lng: lng
      });

      // Fetch images linked to registration
      const imagesList = await apiFetch(`/api/crops/${req.id}/images`)
        .catch(() => []);
      setImages(imagesList);

      // Fetch AI Pre-Assessment
      const aiReportData = await apiFetch(`/api/crops/${req.id}/ai-report`)
        .catch(() => null);
      setAiReport(aiReportData);

      // Set weigh in initial default values
      const mspRate = req.crop_name === 'Paddy' ? 2183.0 : req.crop_name === 'Cotton' ? 6620.0 : req.crop_name === 'Maize' ? 2090.0 : 3846.0;
      setWeighData({
        declared_qty: req.quantity,
        actual_qty: req.quantity,
        accepted_qty: req.quantity,
        msp_rate: mspRate,
        slot_date: new Date().toISOString().split('T')[0],
        slot_time: '10:00 AM'
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Inspection submission handler
  const handleInspectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    try {
      await apiFetch(`/api/officer/verify-sample/${selectedReq.id}`, {
        method: 'POST',
        body: JSON.stringify({
          moisture: parseFloat(inspectData.moisture),
          foreign_matter: parseFloat(inspectData.foreign_matter),
          grain_quality: inspectData.grain_quality,
          remarks: inspectData.remarks,
          status: inspectData.status,
          verification_centre: inspectData.status === 'Need Reinspection' ? inspectData.verification_centre : null,
          verification_date: inspectData.status === 'Need Reinspection' ? inspectData.verification_date : null,
          verification_time: inspectData.status === 'Need Reinspection' ? inspectData.verification_time : null,
          sample_instructions: inspectData.status === 'Need Reinspection' ? inspectData.sample_instructions : null
        })
      });
      setInspectModalOpen(false);
      fetchOfficerData();
      setSelectedReq(null);
    } catch (err: any) {
      alert(err.message || 'Inspection recording failed.');
    }
  };

  // Procurement Weigh-in submission handler
  const handleProcureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    try {
      const res = await apiFetch(`/api/officer/procure/${selectedReq.id}`, {
        method: 'POST',
        body: JSON.stringify({
          declared_quantity: Number(weighData.declared_qty),
          actual_quantity: Number(weighData.actual_qty),
          accepted_quantity: Number(weighData.accepted_qty),
          msp_rate: Number(weighData.msp_rate),
          slot_date: weighData.slot_date,
          slot_time: weighData.slot_time
        })
      });

      // Load digital receipt
      const receipt = await apiFetch(`/api/procurements/${res.id}/receipt`);
      setReceiptData(receipt);
      setProcureModalOpen(false);
      setReceiptModalOpen(true);
      fetchOfficerData();
      setSelectedReq(null);
    } catch (err: any) {
      alert(err.message || 'Weigh-in submission failed.');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">Procurement Officer</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t('app_title')}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 px-3 py-1.5 rounded-lg border border-emerald-500/10">
            Centre In-Charge: <span className="font-bold">{name}</span>
          </span>
          <button 
            onClick={logout}
            className="flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/30 dark:border-red-950 dark:text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold"
          >
            <LogOut className="h-4.5 w-4.5" />
            Logout
          </button>
        </div>
      </header>

      {/* Main layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid gap-6 md:grid-cols-12">
        {/* Left Column: Farmer Request queue table */}
        <div className="md:col-span-8 space-y-6">
          
          {/* Analytics Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Queue', val: requests.length, color: 'text-slate-800' },
              { label: 'Pending Samples', val: requests.filter(r => r.status === 'Images Uploaded' || r.status === 'AI Reviewed').length, color: 'text-gov-gold-600' },
              { label: 'Weigh-ins Ready', val: requests.filter(r => r.status === 'Slot Booked' || r.status === 'Approved').length, color: 'text-emerald-600' }
            ].map((card, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{card.label}</p>
                <p className={`text-xl font-extrabold ${card.color} mt-1`}>{card.val}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            
            {/* Search & Filter headers */}
            <div className="flex justify-between items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Farmer name or Reg ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950 dark:border-slate-800 text-xs font-semibold focus:outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border p-2 rounded-xl bg-slate-50 dark:bg-slate-950 dark:border-slate-800 text-xs font-semibold focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Registered">Registered</option>
                <option value="Images Uploaded">Images Uploaded</option>
                <option value="AI Reviewed">AI Reviewed</option>
                <option value="Slot Booked">Slot Booked</option>
                <option value="Procured">Procured</option>
                <option value="Payment Completed">Payment Completed</option>
              </select>
            </div>

            {/* REQUEST TABLE GRID */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b dark:border-slate-800 text-slate-400 font-bold">
                    <th className="pb-3">Farmer</th>
                    <th className="pb-3">Crop / ID</th>
                    <th className="pb-3">Quantity</th>
                    <th className="pb-3">AI Score</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400">Loading Queue...</td>
                    </tr>
                  ) : filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">No requests found.</td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="py-3.5 font-bold text-slate-800 dark:text-slate-200">{req.farmer_name}</td>
                        <td className="py-3.5">
                          <p className="font-bold">{req.crop_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{req.registration_number}</p>
                        </td>
                        <td className="py-3.5">{req.quantity} Qtl</td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded font-bold ${req.ai_score >= 85 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' : 'bg-slate-50 text-slate-500'}`}>
                            {req.ai_score ? `${req.ai_score}%` : 'N/A'}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            req.status === 'Payment Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' :
                            req.status === 'Procured' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40' :
                            req.status === 'Slot Booked' ? 'bg-gov-gold-100 text-gov-gold-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => handleSelectRequest(req)}
                            className="bg-slate-100 border text-slate-700 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-300 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 ml-auto font-bold"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Spatial Coordinates Mapping & Inspector details */}
        <div className="md:col-span-4 space-y-6">
          {/* 1. Verification Actions Side Panel (ABOVE THE MAP) */}
          {selectedReq ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex justify-between items-start border-b pb-3 dark:border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedReq.farmer_name}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">{selectedReq.registration_number}</p>
                </div>
                <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-350 text-[10px] px-2.5 py-0.5 rounded border border-emerald-500/10 font-bold">{selectedReq.crop_name}</span>
              </div>

              {/* Crop Registration Metadata Fields */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border dark:border-slate-800 space-y-2">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider border-b pb-1.5 mb-2">Crop Details Summary</p>
                <div className="grid grid-cols-2 gap-3 text-[11px] font-semibold text-slate-650 dark:text-slate-400">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Qty (Quintals)</span>
                    <span className="text-slate-800 dark:text-slate-200 font-extrabold">{selectedReq.expected_quantity || selectedReq.quantity} Qtl</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Acreage</span>
                    <span className="text-slate-800 dark:text-slate-200 font-extrabold">{selectedReq.land_area} Ac</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Harvest Month</span>
                    <span className="text-slate-800 dark:text-slate-200 font-extrabold">{selectedReq.expected_harvest_month}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Status</span>
                    <span className="text-slate-850 dark:text-slate-150 font-extrabold">{selectedReq.status}</span>
                  </div>
                  <div className="col-span-2 border-t pt-2 mt-1">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Farmer Phone</span>
                    <span className="text-slate-850 dark:text-slate-150 font-extrabold">{selectedReq.phone_number || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Mandi Coordinates</span>
                    <span className="text-slate-850 dark:text-slate-150 font-extrabold">{selectedReq.village}, {selectedReq.mandal}, {selectedReq.district}</span>
                  </div>
                </div>
              </div>

              {/* Produce image check boxes */}
              <div className="space-y-3">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Close-up Produce Check</p>
                {images.length > 0 ? (
                  (() => {
                    const img = images.find(i => i.image_type === 'close_up') || images[0];
                    return (
                      <div className="space-y-2">
                        <div className="h-40 w-full bg-slate-950 border rounded-xl overflow-hidden flex items-center justify-center relative shadow-sm">
                          <img 
                            src={`http://localhost:8000${img.image_url}`} 
                            alt="Crop Close-up"
                            className="h-full w-full object-cover" 
                          />
                          <div className="absolute top-2 left-2 bg-black/75 px-2 py-0.5 rounded text-[8px] font-mono text-emerald-400 border border-emerald-500/20 uppercase font-bold">
                            {img.image_source || 'Camera'} Verification
                          </div>
                        </div>
                        
                        {/* Image Metadata Labels */}
                        <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl text-[10px] space-y-1 font-mono border dark:border-slate-800">
                          <p><span className="text-slate-400 font-bold uppercase tracking-wider text-[8px] mr-2">Source:</span> <span className="font-bold text-slate-700 dark:text-slate-300">{img.image_source || 'Live Camera'}</span></p>
                          <p><span className="text-slate-400 font-bold uppercase tracking-wider text-[8px] mr-2">Location:</span> <span className="font-bold text-slate-700 dark:text-slate-300">{img.gps_location_name || 'Agriculture Mandi'}</span></p>
                          <p><span className="text-slate-400 font-bold uppercase tracking-wider text-[8px] mr-2">GPS Coordinates:</span> <span className="font-bold text-emerald-600">{img.gps_latitude?.toFixed(4) || '17.9784'}, {img.gps_longitude?.toFixed(4) || '79.5941'}</span></p>
                          <p><span className="text-slate-400 font-bold uppercase tracking-wider text-[8px] mr-2">Timestamp:</span> <span className="font-bold text-slate-700 dark:text-slate-355">{img.upload_time || (img.timestamp ? new Date(img.timestamp).toLocaleString() : 'N/A')}</span></p>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="h-28 w-full bg-slate-100 dark:bg-slate-950 border rounded-xl flex items-center justify-center text-[10px] text-slate-400">
                    No images uploaded yet.
                  </div>
                )}
              </div>

              {/* AI assessment info */}
              {aiReport && (
                <div className="bg-slate-50 dark:bg-slate-950/80 border p-3.5 rounded-2xl text-[11px] leading-relaxed">
                  <p className="font-bold text-emerald-600 mb-1">OpenCV Pre-Scan Report ({aiReport.score}%)</p>
                  <p><b>Quality:</b> {aiReport.visual_quality} • <b>Moisture:</b> {aiReport.estimated_moisture}%</p>
                  <p><b>Purity:</b> {100 - aiReport.foreign_material}% • <b>Uniformity:</b> {aiReport.grain_uniformity}%</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-2.5 pt-2">
                {/* 1. Show Inspect Sample Button */}
                {['Images Uploaded', 'AI Reviewed', 'Registered', 'Sample Requested'].includes(selectedReq.status) && (
                  <button
                    onClick={() => setInspectModalOpen(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer transition-all"
                  >
                    Inspect Crop Sample
                  </button>
                )}

                {/* 2. Show Weigh-in / Procure Button */}
                {['Slot Booked', 'Approved', 'Sample Verified'].includes(selectedReq.status) && (
                  <button
                    onClick={() => setProcureModalOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer transition-all"
                  >
                    Perform Weigh-In & Procure
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-8 shadow-sm text-center text-slate-405 font-bold text-xs py-10 leading-relaxed no-print">
              Select a farmer registration from the queue to view crop details & perform inspections.
            </div>
          )}

          {/* 2. Geolocation Map Container (BELOW THE IMAGE & DETAILS) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <MapPin className="h-4.5 w-4.5 text-emerald-600" />
              Procurement Centre Geolocation Map
            </h4>
            <div ref={mapContainerRef} className="h-60 w-full bg-slate-100 dark:bg-slate-950 rounded-2xl relative overflow-hidden" />
            <div className="flex gap-4 justify-center text-[10px] text-slate-500 font-semibold pt-1">
              <span className="flex items-center gap-1">
                <div className="h-2.5 w-2.5 rounded-full bg-green-600" /> Procurement Centre
              </span>
              <span className="flex items-center gap-1">
                <div className="h-2.5 w-2.5 rounded-full bg-orange-500" /> Farmer Location
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* 1. INSPECT SAMPLE MODAL PANEL */}
      <AnimatePresence>
        {inspectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm relative text-slate-800 dark:text-slate-100"
            >
              <h4 className="text-sm font-bold mb-4 border-b pb-2 dark:border-slate-800">Crop Quality Inspection Details</h4>

              <form onSubmit={handleInspectSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Moisture %</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={inspectData.moisture}
                      onChange={(e) => setInspectData(prev => ({ ...prev, moisture: e.target.value }))}
                      className="w-full rounded-xl border p-2 text-xs bg-slate-50 dark:bg-slate-950 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Foreign Matter %</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={inspectData.foreign_matter}
                      onChange={(e) => setInspectData(prev => ({ ...prev, foreign_matter: e.target.value }))}
                      className="w-full rounded-xl border p-2 text-xs bg-slate-50 dark:bg-slate-950 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Overall Quality Grade</label>
                  <select
                    value={inspectData.grain_quality}
                    onChange={(e) => setInspectData(prev => ({ ...prev, grain_quality: e.target.value }))}
                    className="w-full rounded-xl border p-2 text-xs bg-slate-50 dark:bg-slate-950 focus:outline-none"
                  >
                    <option value="A Grade">A Grade (Premium)</option>
                    <option value="Common">Common Grade</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Officer Decision</label>
                  <select
                    value={inspectData.status}
                    onChange={(e) => setInspectData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full rounded-xl border p-2 text-xs bg-slate-50 dark:bg-slate-950 focus:outline-none font-bold"
                  >
                    <option value="Approved" className="text-emerald-600">Approve Produce</option>
                    <option value="Rejected" className="text-red-600">Reject Produce</option>
                    <option value="Need Reinspection">Need Reinspection</option>
                  </select>
                </div>

                 {inspectData.status === 'Need Reinspection' && (
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] text-emerald-600 font-extrabold uppercase tracking-wider">Lab Reinspection Scheduling</p>
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Verification Centre</label>
                      <input
                        type="text"
                        required
                        value={inspectData.verification_centre}
                        onChange={(e) => setInspectData(prev => ({ ...prev, verification_centre: e.target.value }))}
                        className="w-full rounded-xl border p-2 text-xs bg-slate-50 dark:bg-slate-950 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Appointment Date</label>
                        <input
                          type="date"
                          required
                          min={new Date().toISOString().split('T')[0]}
                          value={inspectData.verification_date}
                          onChange={(e) => setInspectData(prev => ({ ...prev, verification_date: e.target.value }))}
                          className="w-full rounded-xl border p-2 text-xs bg-slate-50 dark:bg-slate-950 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Time Slot</label>
                        <select
                          value={inspectData.verification_time}
                          onChange={(e) => setInspectData(prev => ({ ...prev, verification_time: e.target.value }))}
                          className="w-full rounded-xl border p-2 text-xs bg-slate-50 dark:bg-slate-950 focus:outline-none"
                        >
                          <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                          <option value="12:00 PM - 02:00 PM">12:00 PM - 02:00 PM</option>
                          <option value="03:00 PM - 05:00 PM">03:00 PM - 05:00 PM</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Sample Instructions</label>
                      <textarea
                        rows={2}
                        value={inspectData.sample_instructions}
                        onChange={(e) => setInspectData(prev => ({ ...prev, sample_instructions: e.target.value }))}
                        className="w-full rounded-xl border p-2 text-xs bg-slate-50 dark:bg-slate-950 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Inspection Remarks</label>
                  <textarea
                    rows={2}
                    value={inspectData.remarks}
                    onChange={(e) => setInspectData(prev => ({ ...prev, remarks: e.target.value }))}
                    className="w-full rounded-xl border p-2 text-xs bg-slate-50 dark:bg-slate-950 focus:outline-none font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider shadow"
                >
                  Submit Inspection
                </button>
              </form>

              <button
                onClick={() => setInspectModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-650"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. WEIGH-IN & PROCURE MODAL PANEL */}
      <AnimatePresence>
        {procureModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm relative text-slate-800 dark:text-slate-100"
            >
              <h4 className="text-sm font-bold mb-4 border-b pb-2 dark:border-slate-800">Procure & Weigh-in Weight Entry</h4>

              <form onSubmit={handleProcureSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Declared Qty (Qtl)</label>
                    <input
                      type="number"
                      required
                      value={weighData.declared_qty}
                      onChange={(e) => setWeighData(prev => ({ ...prev, declared_qty: parseFloat(e.target.value) || 0 }))}
                      className="w-full rounded-xl border p-2 text-xs bg-slate-50 dark:bg-slate-950 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Actual scale Weight (Qtl)</label>
                    <input
                      type="number"
                      required
                      value={weighData.actual_qty}
                      onChange={(e) => setWeighData(prev => ({ ...prev, actual_qty: parseFloat(e.target.value) || 0 }))}
                      className="w-full rounded-xl border p-2 text-xs bg-slate-50 dark:bg-slate-950 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Accepted Net Quantity (Qtl)</label>
                  <input
                    type="number"
                    required
                    value={weighData.accepted_qty}
                    onChange={(e) => setWeighData(prev => ({ ...prev, accepted_qty: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-xl border p-2 text-xs bg-slate-50 dark:bg-slate-950 focus:outline-none font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Government MSP (₹/Qtl)</label>
                    <input
                      type="number"
                      required
                      disabled
                      value={weighData.msp_rate}
                      className="w-full rounded-xl border p-2 text-xs bg-slate-100 dark:bg-slate-800 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Calculated Payout</label>
                    <div className="w-full rounded-xl border p-2 text-xs bg-slate-50 dark:bg-slate-950 font-bold text-emerald-600 font-mono">
                      ₹{(weighData.accepted_qty * weighData.msp_rate).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider shadow"
                >
                  Verify Weight & Disburse Payout
                </button>
              </form>

              <button
                onClick={() => setProcureModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-650"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. PRINTABLE DIGITAL RECEIPT MODAL PANEL */}
      <AnimatePresence>
        {receiptModalOpen && receiptData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 overflow-y-auto print:p-0 print:bg-white print:relative">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white text-slate-900 border border-slate-200 rounded-3xl p-8 w-full max-w-lg relative shadow-2xl print:border-none print:shadow-none print:p-0"
            >
              {/* Receipt Header styled like Govt Security Slip */}
              <div className="text-center space-y-1 mb-6 pb-4 border-b border-dashed print:border-slate-350">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md mx-auto mb-2 print:hidden">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h4 className="text-xs uppercase tracking-widest font-extrabold text-emerald-800">Ministry of Food & Public Procurement</h4>
                <h3 className="text-sm font-extrabold tracking-tight">FARMER2GOV DIGITAL PROCUREMENT RECEIPT</h3>
                <p className="text-[9px] text-slate-400 font-mono">Date: {receiptData.date}</p>
              </div>

              {/* Receipt Body invoice details */}
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100 print:border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Farmer Name</span>
                    <p className="font-bold text-slate-800">{receiptData.farmer_name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Mobile Phone</span>
                    <p className="font-mono text-slate-800">{receiptData.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100 print:border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Crop Procured</span>
                    <p className="font-bold text-slate-800">{receiptData.crop}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Procurement Hub</span>
                    <p className="font-bold text-slate-800">{receiptData.centre}</p>
                  </div>
                </div>

                {/* Ledger metrics table */}
                <div className="bg-slate-50 p-4 rounded-2xl border space-y-2 font-mono print:bg-white print:border-slate-300">
                  <div className="flex justify-between text-[11px]">
                    <span>Declared Quantity:</span>
                    <span className="font-bold">{receiptData.declared_qty_qtl} Qtl</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Actual scale Weight:</span>
                    <span className="font-bold">{receiptData.actual_qty_qtl} Qtl</span>
                  </div>
                  <div className="flex justify-between text-[11px] pb-2 border-b">
                    <span>Accepted Quantity:</span>
                    <span className="font-bold text-slate-800">{receiptData.accepted_qty_qtl} Qtl</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>MSP Rate:</span>
                    <span>₹{receiptData.msp_per_qtl} / Qtl</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-emerald-700 pt-1">
                    <span>TOTAL AMOUNT DUE:</span>
                    <span>₹{receiptData.total_amount_rs.toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-emerald-50 text-emerald-800 border border-emerald-500/10 p-3 rounded-xl flex items-center justify-between text-[10px] font-bold print:border-none print:bg-slate-100">
                  <span>PAYMENT DISBURSEMENT INITIATED</span>
                  <span className="font-mono text-xs">{receiptData.reference_id || 'TXN-982401824'}</span>
                </div>
              </div>

              {/* Receipt Footer stamp */}
              <div className="mt-8 border-t border-dashed pt-4 flex justify-between items-center text-[9px] text-slate-400 font-mono print:border-slate-350">
                <p>Digital signature coordinates: Secured UIDAI</p>
                <div className="flex gap-3 print:hidden">
                  <button
                    onClick={handlePrintReceipt}
                    className="bg-slate-900 text-white hover:bg-black py-1.5 px-3 rounded-lg flex items-center gap-1 font-bold font-sans text-[10px]"
                  >
                    <Printer className="h-3 w-3" /> Print
                  </button>
                  <button
                    onClick={() => setReceiptModalOpen(false)}
                    className="border hover:bg-slate-100 py-1.5 px-3 rounded-lg font-bold font-sans text-[10px]"
                  >
                    Close Receipt
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OfficerDashboard;
