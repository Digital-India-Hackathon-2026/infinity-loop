import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Sprout, Lock, KeyRound, User, Users, ShieldAlert, ArrowLeft, CheckCircle } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect message check
  const successMessage = location.state?.message || '';

  // State controls
  const [role, setRole] = useState<'farmer' | 'officer' | 'admin'>('farmer');
  
  // Farmer OTP states
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState('');
  
  // Officer/Admin Password states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = 'http://localhost:8000';

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to request OTP');
      
      setSimulatedOtp(data.otp);
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message || 'Error occurred requesting OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setError('Please enter the OTP verification code.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'OTP verification failed');

      // Login context save
      login(data.access_token, data.role, data.user_id, data.name);
      
      // Navigate to respective dashboard
      if (data.role === 'farmer') navigate('/farmer-dashboard');
      else if (data.role === 'officer') navigate('/officer-dashboard');
      else navigate('/admin-dashboard');
    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Invalid email or password.');

      login(data.access_token, data.role, data.user_id, data.name);
      
      if (data.role === 'officer') navigate('/officer-dashboard');
      else navigate('/admin-dashboard');
    } catch (err: any) {
      setError(err.message || 'Password authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 text-slate-800 bg-grid">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06),transparent_40%)] pointer-events-none" />

      {/* Back Button */}
      <button 
        onClick={() => navigate('/landing')}
        className="absolute left-6 top-6 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Landing
      </button>

      <div className="w-full max-w-md relative z-10">
        {/* Emblem logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md mb-2">
            <Sprout className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t('app_title')}</h2>
          <p className="text-xs text-emerald-600 uppercase tracking-widest font-semibold mt-1">Government Portal Login</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl"
        >
          {/* Role selector buttons */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl mb-6">
            {(['farmer', 'officer', 'admin'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRole(r);
                  setError('');
                  setOtpSent(false);
                }}
                className={`flex flex-col items-center justify-center py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${role === r ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {r === 'farmer' && <Users className="h-4 w-4 mb-1" />}
                {r === 'officer' && <User className="h-4 w-4 mb-1" />}
                {r === 'admin' && <KeyRound className="h-4 w-4 mb-1" />}
                {t(r)}
              </button>
            ))}
          </div>

          {successMessage && (
            <div className="mb-6 flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-250/20 p-3.5 text-xs text-emerald-700 leading-tight">
              <CheckCircle className="h-5 w-5 shrink-0 text-emerald-650" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-650 leading-tight">
              <ShieldAlert className="h-5 w-5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* SIMULATED SMS TOAST BOX FOR FARMER OTP */}
          {role === 'farmer' && otpSent && simulatedOtp && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 rounded-xl bg-emerald-50 border border-emerald-100 p-3.5 text-xs text-emerald-750 font-mono text-center flex flex-col items-center"
            >
              <p className="font-sans uppercase text-[10px] tracking-wider text-emerald-600 font-bold mb-1">Simulated SMS Delivery</p>
              <p>Your Farmer2Gov verification code is: <span className="font-extrabold text-base tracking-wider text-slate-900 bg-white px-2 py-0.5 rounded border border-emerald-200 ml-1">{simulatedOtp}</span></p>
              <p className="text-[10px] text-slate-400 mt-2 font-sans">For test convenience, typing 123456 will also authenticate successfully.</p>
            </motion.div>
          )}

          {/* Form conditional render */}
          {role === 'farmer' ? (
            /* FARMER LOGS IN WITH OTP */
            !otpSent ? (
              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    {t('phone_number')}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-500 text-xs font-bold">+91</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      pattern="\d{10}"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-semibold tracking-wide text-slate-900 focus:border-emerald-500 focus:outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-emerald-700 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Sending OTP...' : t('send_otp')}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Enter Verification OTP
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-bold tracking-widest text-center text-slate-900 focus:border-emerald-500 focus:outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <button 
                    type="button" 
                    onClick={() => setOtpSent(false)} 
                    className="text-slate-500 hover:text-slate-900"
                  >
                    Change Phone Number
                  </button>
                  <button 
                    type="button" 
                    onClick={handleRequestOtp} 
                    className="text-emerald-650 font-bold hover:underline"
                  >
                    Resend Code
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-emerald-700 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Verifying...' : t('verify_otp')}
                </button>
              </form>
            )
          ) : (
            /* OFFICERS / ADMINS LOG IN WITH EMAIL / PASSWORD */
            <form onSubmit={handlePasswordLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Official Email ID
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-slate-400 text-xs font-bold">@</span>
                  <input
                    type="email"
                    required
                    placeholder="officer_1@farmer2gov.gov.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t('password')}
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col gap-1 text-[10px] text-slate-550 leading-normal">
                <p className="font-bold text-slate-700">Default Demo Credentials:</p>
                {role === 'officer' ? (
                  <p>Email: <span className="text-slate-900 font-mono font-bold">officer_1@farmer2gov.gov.in</span><br/>Password: <span className="text-slate-900 font-mono font-bold">officer123</span></p>
                ) : (
                  <p>Email: <span className="text-slate-900 font-mono font-bold">admin@farmer2gov.gov.in</span><br/>Password: <span className="text-slate-900 font-mono font-bold">admin123</span></p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-emerald-700 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Authenticating...' : t('login_btn')}
              </button>
            </form>
          )}

          {role === 'farmer' && (
            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500 font-semibold mb-2">New Farmer?</p>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="w-full rounded-xl border border-emerald-650/30 hover:border-emerald-600 bg-white hover:bg-emerald-50/30 py-2.5 text-xs font-bold text-emerald-650 transition-all cursor-pointer"
              >
                Register
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
