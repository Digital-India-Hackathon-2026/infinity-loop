import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage, type Language } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Sprout, ArrowRight, ShieldCheck } from 'lucide-react';
import agriHeroBg from '../assets/agri_hero_bg.png';

const LanguageSelector: React.FC = () => {
  const { setLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    navigate('/landing');
  };

  const languages = [
    { code: 'en' as Language, name: 'English', sub: 'Simple Digital Procurement', label: 'A' },
    { code: 'hi' as Language, name: 'हिंदी', sub: 'सरल डिजिटल खरीद', label: 'अ' },
    { code: 'te' as Language, name: 'తెలుగు', sub: 'సులభమైన డిజిటల్ కొనుగోలు', label: 'అ' }
  ];

  return (
    <div 
      className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 text-slate-800 bg-cover bg-center"
      style={{ backgroundImage: `url(${agriHeroBg})` }}
    >
      {/* Premium blur overlay for high text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-emerald-50/85 to-white/95 backdrop-blur-[2px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-2xl text-center bg-white/70 p-8 sm:p-12 rounded-3xl border border-white/80 shadow-2xl backdrop-blur-md"
      >
        {/* Simple visual logo/emblem */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-105 text-emerald-600 shadow-md border border-emerald-250/20">
          <Sprout className="h-10 w-10 text-emerald-650" />
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 font-sans sm:text-5xl">
          Welcome to Farmer2Gov
        </h1>
        <p className="mt-3 text-lg font-semibold text-emerald-700 tracking-wide uppercase">
          Simple Digital Procurement for Farmers
        </p>
        <p className="mt-1 text-sm text-slate-500 font-medium">
          Connecting Growers Directly with Government Procurement Centres
        </p>
        
        <h2 className="mt-12 text-xl font-bold text-slate-800">
          Select Preferred Language / భాషను ఎంచుకోండి / भाषा चुनें
        </h2>

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {languages.map((lang, idx) => (
            <motion.button
              key={lang.code}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.03, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleLanguageSelect(lang.code)}
              className="relative flex flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-white/80 hover:bg-emerald-50/50 p-6 shadow-md transition-all hover:border-emerald-500 hover:shadow-lg group cursor-pointer"
            >
              {/* Language Character Icon */}
              <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-xl font-extrabold text-emerald-650 group-hover:bg-emerald-600 group-hover:text-white transition-colors mb-3">
                {lang.label}
              </div>
              <span className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                {lang.name}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 font-semibold text-center leading-tight">
                {lang.sub}
              </span>
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-650">
                <ArrowRight className="h-4 w-4" />
              </div>
            </motion.button>
          ))}
        </div>

        <div className="mt-12 flex items-center justify-center gap-2 text-xs text-emerald-800 font-bold bg-emerald-50/60 py-2.5 px-4 rounded-xl border border-emerald-100/50 max-w-md mx-auto">
          <ShieldCheck className="h-4.5 w-4.5 text-emerald-650" />
          <span>Aadhaar-linked Safe & Secure Direct Transfers</span>
        </div>

        <div className="mt-12 text-center text-[10px] text-slate-400 font-semibold tracking-wide">
          <p>Farmer2Gov Procurement Platform • Ministry of Agriculture & Farmers Welfare</p>
          <p className="mt-0.5 text-slate-300">Secure • Direct Benefit Transfer Portal</p>
        </div>
      </motion.div>
    </div>
  );
};

export default LanguageSelector;
