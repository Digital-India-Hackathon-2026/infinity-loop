import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sprout, Award, ShieldCheck, ChevronDown, 
  MapPin, Languages, ArrowRight, 
  HelpCircle, UserCheck, Smartphone, CheckCircle, Quote 
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const stats = [
    { value: '1.2M+', label: t('farmers_registered') },
    { value: '45.2M Qtl', label: t('procured_qty') },
    { value: '₹9,840 Cr', label: t('msp_paid') },
    { value: '98.4%', label: 'AI Accuracy Rating' }
  ];

  const benefits = [
    {
      role: 'farmer',
      title: 'Farmer Benefits',
      items: [
        'Direct Benefit Transfer (DBT) to bank within 72 hours.',
        'Zero dependency on local middlemen or brokers.',
        'Pre-book delivery slots to avoid long mandi queues.',
        'Instant AI quality feedback at farm-gate using standard phone.'
      ]
    },
    {
      role: 'gov',
      title: 'Government Benefits',
      items: [
        'Accurate pre-harvest forecast of crop yields by district.',
        'Digital audit logs of every procurement weigh-in.',
        'Moisture & quality analysis backed by OpenCV logs.',
        'Reduced congestion at procurement centres.'
      ]
    }
  ];

  const faqs = [
    {
      q: "What is pre-harvest registration?",
      a: "Pre-harvest registration allows farmers to declare their crop type, stage, expected harvest window, and estimated yield 1-2 months before cutting. This helps procurement officers forecast warehouse capacity and plan transport resources."
    },
    {
      q: "How does the simulated AI camera pre-assessment work?",
      a: "Farmers capture three images (full view, close-up of grains, and storage environment). Our OpenCV processor checks grain color, contrast, and edge density to give an immediate estimate of moisture and foreign matter before the farmer goes to the procurement centre."
    },
    {
      q: "Is there any charge for registration or slot booking?",
      a: "No, the Farmer2Gov platform is a 100% free digital public infrastructure product provided by the Ministry of Agriculture."
    },
    {
      q: "How fast do I receive payments?",
      a: "Once the procurement officer weighs the produce and confirms quality, a digital receipt is generated. The payment status changes to 'Initiated', and funds are released via Aadhaar-enabled DBT directly into your bank account within 3 days."
    }
  ];

  const testimonials = [
    {
      name: "K. Satish Reddy",
      village: "Madikonda, Warangal",
      quote: "గతంలో వరి అమ్మడానికి కొనుగోలు కేంద్రాల వద్ద రోజులు తరబడి వేచి ఉండేవాళ్ళం. ఇప్పుడు స్లాట్ బుక్ చేసుకుని 2 గంటల్లో పని పూర్తి చేశాను, డబ్బులు 3 రోజుల్లో పడ్డాయి.",
      lang: "te"
    },
    {
      name: "Ram Singh Yadav",
      village: "Bodhan, Nizamabad",
      quote: "मोबाइल से धान की फोटो खींचकर एआई जांच से पहले ही नमी का पता चल गया। मंडी में कोई कटौती नहीं हुई और पूरा पैसा सीधे बैंक खाते में आया।",
      lang: "hi"
    },
    {
      name: "B. Venkatesh",
      village: "Tenali, Guntur",
      quote: "The visual quality estimation tool gave me confidence to dry my grains at my storage yard itself. When I arrived, the officer confirmed the exact same moisture level.",
      lang: "en"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* 1. Government Banner Header */}
      <div className="bg-emerald-900 px-4 py-1.5 text-center text-xs font-semibold text-emerald-100 flex items-center justify-between sm:px-8 border-b border-emerald-800">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-gov-gold-300" />
          <span>Government of India Digital Public Infrastructure Platform</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:underline hidden sm:inline">Developer API</a>
          <span>Helpline: 1800-180-1551</span>
        </div>
      </div>

      {/* 2. Main Navigation */}
      <header className="sticky top-0 z-50 glass shadow-sm transition-all border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans flex items-center gap-1.5">
                {t('app_title')}
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/20">DPI</span>
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans tracking-wide leading-none mt-0.5">Ministry of Agriculture</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Dropdown Selector */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 rounded-lg border border-slate-300/80 bg-white/50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
                <Languages className="h-4 w-4 text-emerald-600" />
                <span className="uppercase">{language}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <div className="absolute right-0 mt-1 hidden w-32 rounded-xl border border-slate-200 bg-white p-1 shadow-lg group-hover:block dark:border-slate-800 dark:bg-slate-900">
                {(['en', 'te', 'hi'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLanguage(l)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 uppercase ${language === l ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : 'text-slate-700 dark:text-slate-200'}`}
                  >
                    {l === 'en' ? 'English' : l === 'te' ? 'తెలుగు' : 'हिंदी'}
                  </button>
                ))}
              </div>
            </div>

            {/* Login Navigation Buttons */}
            <button
              onClick={() => navigate('/login')}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-emerald-700 hover:shadow-lg transition-all"
            >
              {t('sign_in')}
            </button>
          </div>
        </div>
      </header>

      {/* 3. Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-8 bg-grid">
        {/* Decorative backdrop gradients */}
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-gov-gold-500/5 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left text panel */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/20 mb-6">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Aadhaar-Linked Direct Payouts</span>
                </div>
                <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans sm:text-5xl lg:text-6xl leading-[1.1]">
                  {t('hero_title')}
                </h2>
                <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 font-sans leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  {t('hero_subtitle')}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700 transition-all hover:scale-105"
                  >
                    <span>{t('get_started')}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <a
                    href="#how-it-works"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/50 px-6 py-3.5 text-sm font-semibold text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200"
                  >
                    {t('how_it_works')}
                  </a>
                </div>
              </motion.div>
            </div>

            {/* Right illustration / interactive dashboard mock */}
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/50 p-6 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60"
              >
                {/* Government Stamp Overlay */}
                <div className="absolute right-4 top-4 rounded-full border-2 border-dashed border-emerald-500/30 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-emerald-500/40 rotate-12 select-none">
                  F2G VERIFIED
                </div>

                <div className="flex items-center gap-3 border-b pb-4 mb-4 dark:border-slate-800">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                  <span className="text-[10px] text-slate-400 font-mono select-none">https://farmer2gov.gov.in</span>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Sprout className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-xs font-bold">Paddy Registration</p>
                        <p className="text-[10px] text-slate-400">ID: F2G-PH-2026-1024</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Approved
                    </span>
                  </div>

                  <div className="space-y-2 border border-slate-100 dark:border-slate-800 p-3 rounded-xl bg-white/30">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>OpenCV AI Pre-Assessment</span>
                      <span className="text-emerald-600">92.4% Score</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-2">
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded">Moisture: 12.4% (Optimal)</div>
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded">Grain Uniformity: 94.5%</div>
                    </div>
                  </div>

                  <div className="bg-emerald-950/20 dark:bg-emerald-950/40 border border-emerald-500/20 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Direct Payout Disbursed</p>
                      <p className="text-sm font-bold text-emerald-600">₹45,280.00</p>
                    </div>
                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Live Statistics Board */}
      <section className="bg-emerald-900 py-10 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 text-center">
            {stats.map((stat, idx) => (
              <div key={idx} className="space-y-1">
                <p className="text-3xl font-extrabold text-gov-gold-400 sm:text-4xl">{stat.value}</p>
                <p className="text-xs font-semibold text-emerald-100/80">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              {t('how_it_works')}
            </h3>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 font-sans">
              Farmer2Gov works directly with existing Mandis and PACS, coordinating information transparently to save time and prevent logistics delays.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            {[
              { title: t('step1_title'), desc: t('step1_desc'), icon: MapPin },
              { title: t('step2_title'), desc: t('step2_desc'), icon: Smartphone },
              { title: t('step3_title'), desc: t('step3_desc'), icon: UserCheck },
              { title: t('step4_title'), desc: t('step4_desc'), icon: CheckCircle }
            ].map((step, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-6 rounded-2xl shadow-md flex flex-col items-center text-center hover:shadow-lg transition-all group">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <step.icon className="h-6 w-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">{step.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Benefits Section */}
      <section className="py-20 bg-slate-100 dark:bg-slate-900/40 border-y border-slate-200/50 dark:border-slate-800/50 px-4 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 md:grid-cols-2">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-8 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 bg-emerald-500/10 h-32 w-32 rounded-full blur-2xl pointer-events-none" />
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b pb-3 dark:border-slate-800 flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${benefit.role === 'farmer' ? 'bg-emerald-500' : 'bg-gov-gold-500'}`} />
                  {benefit.title}
                </h4>
                <ul className="space-y-4">
                  {benefit.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300">
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Testimonials */}
      <section className="py-20 px-4 sm:px-8 bg-grid">
        <div className="mx-auto max-w-7xl">
          <h3 className="text-center text-3xl font-bold text-slate-900 dark:text-white mb-16">
            Voices of Procurement (Demo Feed)
          </h3>
          
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((t, idx) => (
              <div key={idx} className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 p-6 rounded-2xl shadow-md relative hover:shadow-lg transition-all flex flex-col justify-between">
                <div className="absolute top-4 right-4 text-slate-200 dark:text-slate-800">
                  <Quote className="h-10 w-10 rotate-180 fill-current" />
                </div>
                <p className={`text-xs leading-relaxed italic text-slate-600 dark:text-slate-300 ${t.lang === 'te' ? 'font-sans' : ''}`}>
                  "{t.quote}"
                </p>
                <div className="mt-6 border-t pt-4 border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">{t.name}</h5>
                    <p className="text-[10px] text-slate-400">{t.village}</p>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                    Verified Farmer
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FAQ Section */}
      <section className="py-20 bg-slate-100 dark:bg-slate-900/40 border-t border-slate-200/50 dark:border-slate-800/50 px-4 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h3 className="text-center text-3xl font-bold text-slate-900 dark:text-white mb-12 flex items-center justify-center gap-2">
            <HelpCircle className="h-8 w-8 text-emerald-600" />
            {t('faq_title')}
          </h3>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-6 py-4.5 text-left text-sm font-bold text-slate-800 dark:text-white focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {activeFaq === idx && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 px-4 sm:px-8 border-t border-slate-800">
        <div className="mx-auto max-w-7xl grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <Sprout className="h-6 w-6 text-emerald-500" />
              <span className="text-lg font-bold">Farmer2Gov</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Farmer2Gov is a Digital Public Infrastructure (DPI) pilot coordinating agricultural pre-harvest logistics with secure direct procurement systems.
            </p>
          </div>
          
          <div>
            <h6 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Related Portals</h6>
            <ul className="space-y-2 text-xs">
              <li><a href="https://pmkisan.gov.in" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">PM-KISAN Portal</a></li>
              <li><a href="https://enam.gov.in" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">e-NAM Mandi Market</a></li>
              <li><a href="https://fci.gov.in" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Food Corporation of India</a></li>
            </ul>
          </div>

          <div>
            <h6 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Help & Support</h6>
            <ul className="space-y-2 text-xs">
              <li>Farmers Helpline: 1800-180-1551</li>
              <li>Technical Support: helpdesk@farmer2gov.gov.in</li>
              <li>Procurement Coordination Cell, New Delhi</li>
            </ul>
          </div>

          <div>
            <h6 className="text-white font-bold text-xs uppercase tracking-wider mb-4">DPI Status</h6>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
              <span className="text-[10px] text-slate-300 font-mono">DBT-Certified Gateway Connected</span>
            </div>
          </div>
        </div>
        
        <div className="mx-auto max-w-7xl border-t border-slate-900 mt-12 pt-8 text-center text-[10px] space-y-1">
          <p>© 2026 Ministry of Agriculture & Farmers Welfare, Government of India. All rights reserved.</p>
          <p className="text-slate-600">Designed and maintained as an open-source digital public good for transparent coordination.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
