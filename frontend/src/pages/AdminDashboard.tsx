import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Users, BarChart3, TrendingUp, Landmark, ShieldCheck, 
  MapPin, FileText, PieChart as PieIcon, LineChart as LineIcon, 
  Calendar, Layers, LogOut, Bell, Languages
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  Legend, LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';

interface Metric {
  total_farmers: number;
  total_officers: number;
  total_procured_qtl: number;
  total_payout_rs: number;
  avg_ai_score: number;
}

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

const AdminDashboard: React.FC = () => {
  const { logout, apiFetch, name } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Core Data States
  const [metrics, setMetrics] = useState<Metric | null>(null);
  const [cropDist, setCropDist] = useState<any[]>([]);
  const [districtDist, setDistrictDist] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [recentRegs, setRecentRegs] = useState<any[]>([]);
  const [statusDist, setStatusDist] = useState<any[]>([]);
  const [paymentDist, setPaymentDist] = useState<any[]>([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const data = await apiFetch('/api/admin/analytics');
      setMetrics(data.metrics);
      setCropDist(data.crop_distribution);
      setDistrictDist(data.district_distribution);
      setMonthlyTrend(data.monthly_trend);
      setForecasts(data.forecasts);
      setRecentRegs(data.recent_registrations);
      setStatusDist(data.status_distribution || []);
      setPaymentDist(data.payment_distribution || []);

      const notifs = await apiFetch('/api/notifications');
      setNotifications(notifs);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">Admin Console</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t('app_title')}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 px-3 py-1.5 rounded-lg border border-emerald-500/10">
            Director Desk: <span className="font-bold">{name}</span>
          </span>

          {/* Notification Bell Badge */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-455 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border-none flex items-center justify-center cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-xl z-50 text-slate-700 dark:text-slate-200 max-h-80 overflow-y-auto">
                <div className="text-xs font-bold text-slate-450 p-2 border-b dark:border-slate-800 uppercase tracking-wider">Notifications</div>
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
                      className={`p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer border-b border-slate-50 dark:border-slate-800 last:border-none flex gap-2 ${!n.is_read ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''}`}
                    >
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex justify-between">
                          <span>{n.title}</span>
                          {!n.is_read && <span className="h-1.5 w-1.5 bg-emerald-600 rounded-full mt-1.5" />}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</div>
                        <div className="text-[8px] text-slate-400 dark:text-slate-500 font-mono mt-1">{new Date(n.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Languages Selector */}
          <div className="relative group">
            <button className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">
              <Languages className="h-3.5 w-3.5 text-emerald-600" />
              <span className="uppercase">{language}</span>
            </button>
            <div className="absolute right-0 mt-1 hidden w-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-lg shadow-lg group-hover:block z-50">
              {['en', 'te', 'hi'].map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l as any)}
                  className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-805 text-slate-705 dark:text-slate-300 rounded-md bg-transparent border-none cursor-pointer"
                >
                  {l === 'en' ? 'English' : l === 'te' ? 'తెలుగు' : 'हिंदी'}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={logout}
            className="flex items-center gap-1 bg-red-50 text-red-650 border border-red-200 dark:bg-red-950/30 dark:border-red-950 dark:text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            Logout
          </button>
        </div>
      </header>

      {/* Main dashboard body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* KPI Metrics row */}
        {metrics && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {[
              { title: 'Total Farmers', val: metrics.total_farmers, desc: 'Aadhaar Verified', icon: Users, color: 'text-emerald-600' },
              { title: 'Total Officers', val: metrics.total_officers, desc: 'Hub coordinators', icon: ShieldCheck, color: 'text-blue-600' },
              { title: 'Procured Volume', val: `${metrics.total_procured_qtl.toLocaleString()} Qtl`, desc: 'Completed scales', icon: Layers, color: 'text-purple-600' },
              { title: 'Total Payouts', val: `₹${(metrics.total_payout_rs / 10000000).toFixed(2)} Cr`, desc: 'Direct Benefit (DBT)', icon: Landmark, color: 'text-gov-gold-600' },
              { title: 'AI Quality Score', val: `${metrics.avg_ai_score}%`, desc: 'OpenCV Average', icon: TrendingUp, color: 'text-pink-600' }
            ].map((kpi, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-2 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{kpi.title}</span>
                  <kpi.icon className={`h-4.5 w-4.5 ${kpi.color}`} />
                </div>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white font-sans">{kpi.val}</p>
                <p className="text-[9px] text-slate-500 font-semibold">{kpi.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Charts row */}
        <div className="grid gap-6 md:grid-cols-12">
          {/* 1. Monthly trends Line Chart */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm md:col-span-8 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-2">
              <LineIcon className="h-4.5 w-4.5 text-emerald-600" />
              Monthly Pre-Harvest Registration Velocity
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Crop Share Pie Chart */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm md:col-span-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-2">
              <PieIcon className="h-4.5 w-4.5 text-emerald-600" />
              Registration Crop Volume Share
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cropDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="crop"
                  >
                    {cropDist.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Forecast and District distribution row */}
        <div className="grid gap-6 md:grid-cols-12">
          {/* 1. District Bar Chart */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm md:col-span-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-2">
              <MapPin className="h-4.5 w-4.5 text-emerald-600" />
              District Procurement Center Density
            </h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtDist}>
                  <XAxis dataKey="district" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Forecast Volume Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm md:col-span-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-emerald-600" />
              Harvest Volume Forecast & Planning (Quintals)
            </h3>
            
            <div className="space-y-4">
              {forecasts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-10">No upcoming pre-harvest crop registations registered.</p>
              ) : (
                forecasts.map((f, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span>{f.crop} Expected Volume</span>
                      <span className="text-emerald-600 font-mono">{f.expected_volume.toLocaleString()} Qtl</span>
                    </div>
                    <div className="overflow-hidden h-2 text-xs flex rounded-full bg-slate-100 dark:bg-slate-950">
                      <div 
                        style={{ width: `${Math.min(100, (f.expected_volume / 2000) * 100)}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Workflow & Financial Insights */}
        <div className="grid gap-6 md:grid-cols-12">
          {/* Status Distribution */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm md:col-span-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-emerald-600" />
              Registration status workflow breakdown
            </h3>
            <div className="h-60">
              {statusDist.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-20">No data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusDist}>
                    <XAxis dataKey="status" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Payment Status Distribution */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm md:col-span-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-2">
              <Landmark className="h-4.5 w-4.5 text-emerald-600" />
              direct benefit transfer (DBT) payment logs
            </h3>
            <div className="h-60">
              {paymentDist.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-20">No payments initiated yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="status"
                    >
                      {paymentDist.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Security Audit log grid */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-2">
            <FileText className="h-4.5 w-4.5 text-emerald-600" />
            Security Audit Trail & Dup Detection (Live logs)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[10px] font-mono">
              <thead>
                <tr className="border-b dark:border-slate-850 text-slate-400 font-bold uppercase">
                  <th className="pb-2">Registration ID</th>
                  <th className="pb-2">Crop</th>
                  <th className="pb-2">Quantity</th>
                  <th className="pb-2">District</th>
                  <th className="pb-2 text-right">Gate Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                {recentRegs.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                    <td className="py-2.5 font-bold">{reg.registration_number}</td>
                    <td className="py-2.5 font-bold text-slate-900 dark:text-white">{reg.crop}</td>
                    <td className="py-2.5">{reg.qty} Qtl</td>
                    <td className="py-2.5">{reg.district}</td>
                    <td className="py-2.5 text-right">
                      <span className="bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded text-[9px] font-bold">
                        {reg.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
