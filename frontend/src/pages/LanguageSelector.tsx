import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage, type Language } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Globe, ArrowRight } from 'lucide-react';

const LanguageSelector: React.FC = () => {
  const { setLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    navigate('/landing');
  };

  const languages = [
    { code: 'en' as Language, name: 'English', sub: 'Welcome', flag: '🇬🇧' },
    { code: 'te' as Language, name: 'తెలుగు', sub: 'స్వాగతం', flag: '🇮🇳' },
    { code: 'hi' as Language, name: 'हिंदी', sub: 'स्वागत हे', flag: '🇮🇳' }
  ];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 py-12 text-slate-100 bg-grid">
      {/* Background radial highlight */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08),transparent_45%)] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg text-center"
      >
        {/* Government Emblem Symbol Placeholder */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
          <Globe className="h-10 w-10 animate-pulse-slow" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white font-sans sm:text-4xl">
          Farmer2Gov
        </h1>
        <p className="mt-2 text-sm text-emerald-400 font-medium uppercase tracking-wider">
          Digital Public Infrastructure
        </p>
        
        <h2 className="mt-12 text-xl font-semibold text-slate-200">
          Select Preferred Language
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          భాషను ఎంచుకోండి / भाषा का चयन करें
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {languages.map((lang, idx) => (
            <motion.button
              key={lang.code}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleLanguageSelect(lang.code)}
              className="relative flex flex-col items-center justify-center rounded-2xl border border-slate-700/80 bg-slate-800/50 p-6 shadow-xl backdrop-blur-md transition-all hover:border-emerald-500/50 hover:bg-slate-800/80 group"
            >
              <span className="text-3xl mb-2">{lang.flag}</span>
              <span className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                {lang.name}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                {lang.sub}
              </span>
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400">
                <ArrowRight className="h-4 w-4" />
              </div>
            </motion.button>
          ))}
        </div>

        <div className="mt-16 text-center text-xs text-slate-500">
          <p>Government of India • Ministry of Agriculture & Farmers Welfare</p>
          <p className="mt-1 text-slate-600">Secure • Encrypted • Direct Benefit Transfer Portal</p>
        </div>
      </motion.div>
    </div>
  );
};

export default LanguageSelector;
