import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sprout, ArrowLeft, ShieldAlert, User, MapPin } from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [landArea, setLandArea] = useState('');
  const [state, setState] = useState('Telangana');
  const [district, setDistrict] = useState('Warangal');
  const [mandal, setMandal] = useState('Hanamkonda');
  const [village, setVillage] = useState('Madikonda');
  const [languagePreference, setLanguagePreference] = useState('en');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = 'http://localhost:8000';

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !landArea || !state || !district || !mandal || !village) {
      setError('Please fill in all fields.');
      return;
    }
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/register/farmer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          land_area: parseFloat(landArea),
          state,
          district,
          mandal,
          village,
          language_preference: languagePreference
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Farmer registration failed.');

      // Registration successful, redirect to login page with state message
      navigate('/login', { state: { message: 'Registration successful. Please login.' } });
    } catch (err: any) {
      setError(err.message || 'Error occurred during registration.');
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
        onClick={() => navigate('/login')}
        className="absolute left-6 top-6 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Login
      </button>

      <div className="w-full max-w-lg relative z-10">
        {/* Emblem logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md mb-2">
            <Sprout className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">New Farmer Registration</h2>
          <p className="text-xs text-emerald-600 uppercase tracking-widest font-semibold mt-1">Create Farmer Account</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl"
        >
          {error && (
            <div className="mb-6 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-650 leading-tight">
              <ShieldAlert className="h-5 w-5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400 text-xs font-bold">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    pattern="\d{10}"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Land Area */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Land Area (in Acres)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 4.5"
                  value={landArea}
                  onChange={(e) => setLandArea(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Language Preference */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Preferred Language
                </label>
                <select
                  value={languagePreference}
                  onChange={(e) => setLanguagePreference(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="te">తెలుగు (Telugu)</option>
                </select>
              </div>
            </div>

            {/* Address fields */}
            <div className="border-t border-slate-100 pt-4 mt-2">
              <p className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-600" />
                Farmer Address Details
              </p>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    District
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 mt-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Mandal
                  </label>
                  <input
                    type="text"
                    required
                    value={mandal}
                    onChange={(e) => setMandal(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Village
                  </label>
                  <input
                    type="text"
                    required
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-emerald-700 transition-all disabled:opacity-50 mt-4 cursor-pointer"
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-xs text-slate-500">Already registered? </span>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-xs text-emerald-650 font-bold hover:underline cursor-pointer"
            >
              Login here
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
