import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage, type Language } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Sprout, ArrowRight, ShieldCheck } from 'lucide-react';
import farmerIllustration from '../assets/farmer_illustration.png';

const LanguageSelector: React.FC = () => {
  const { setLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    navigate('/landing');
  };

  const languages = [
    { code: 'en' as Language, name: 'English', sub: 'Simple Digital Procurement', label: 'A' },
    { code: 'te' as Language, name: 'తెలుగు', sub: 'సులభమైన డిజిటల్ కొనుగోలు', label: 'అ' },
    { code: 'hi' as Language, name: 'हिंदी', sub: 'सरल डिजिटल खरीद', label: 'अ' }
  ];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-8 sm:py-12 bg-gradient-to-br from-[#faf9f6] via-[#f1fcf4] to-[#fcfcf0] text-slate-800">
      {/* Background Farm Image */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src="https://wallpapercave.com/wp/wp2957190.jpg"
          alt="Farm Background"
          className="w-full h-full object-cover opacity-60"
        />
      </div>

      {/* Light Overlay */}
      <div className="absolute inset-0 bg-white/45" />

      {/* Background Decorative Organic blobs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-200/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-5xl bg-white/95 border border-emerald-100 shadow-2xl rounded-3xl p-6 sm:p-10 backdrop-blur-md"
      >
        <div className="grid gap-8 lg:grid-cols-12 items-center">

          {/* Left Column: Farmers Illustration */}
          <div className="lg:col-span-5 flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="relative max-w-xs sm:max-w-sm flex items-center justify-center p-4 bg-emerald-50/30 rounded-full border border-emerald-100/50"
            >
              <img
                src={farmerIllustration}
                alt="Indian Farmer Illustration"
                className="w-full h-auto object-contain drop-shadow-xl max-h-[320px]"
              />
            </motion.div>
            <div className="mt-6 hidden lg:block">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Trust. Transparency. Growth.
              </span>
            </div>
          </div>

          {/* Right Column: Content & Options */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 mb-4">
                <Sprout className="h-6 w-6 text-emerald-700" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-sans">
                Farmer2Gov
              </h1>
              <p className="mt-1 text-base font-semibold text-emerald-700 tracking-wide uppercase">
                Digital Public Infrastructure for Agriculture
              </p>
              <p className="mt-1.5 text-xs text-slate-500 font-medium max-w-lg">
                Connecting growers directly with government procurement centres for transparent pricing.
              </p>
            </div>

            <h2 className="mt-8 text-lg sm:text-xl font-extrabold text-slate-800 text-center lg:text-left border-b border-slate-100 pb-3">
              Select Preferred Language / భాషను ఎంచుకోండి / भाषा चुनें
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {languages.map((lang, idx) => (
                <motion.button
                  key={lang.code}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 + 0.3, duration: 0.5 }}
                  whileHover={{ scale: 1.03, translateY: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-emerald-100/50 bg-white hover:bg-emerald-50/20 p-6 shadow-sm hover:shadow-md transition-all hover:border-emerald-600 group cursor-pointer"
                >
                  {/* Language Character Icon */}
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-lg font-black text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors mb-4 shadow-sm">
                    {lang.label}
                  </div>
                  <span className="text-lg font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {lang.name}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-2 font-bold text-center leading-tight">
                    {lang.sub}
                  </span>
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-center lg:justify-start gap-2.5 text-xs text-emerald-800 font-bold bg-emerald-50/50 py-3 px-4 rounded-xl border border-emerald-100 max-w-md shadow-sm">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>Safe & Easy Access to Government Procurement</span>
            </div>

            <div className="mt-8 text-center lg:text-left text-[10px] text-slate-450 font-semibold tracking-wide border-t border-slate-100 pt-4">
              <p>Farmer2Gov Procurement Coordination DPI Portal • Ministry of Agriculture & Farmers Welfare</p>
              <p className="mt-0.5 text-slate-400">Secure Direct Benefit Transfer System</p>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default LanguageSelector;