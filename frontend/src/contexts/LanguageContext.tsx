import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'te' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Landing & Auth
    app_title: "Farmer2Gov",
    tagline: "From Pre-Harvest Registration to Transparent Government Procurement.",
    select_language: "Select Language / భాషను ఎంచుకోండి / भाषा चुनें",
    farmer: "Farmer",
    officer: "Procurement Officer",
    admin: "Administrator",
    phone_number: "Mobile Number",
    otp_code: "OTP Code",
    send_otp: "Send OTP",
    verify_otp: "Verify OTP",
    otp_sent: "OTP Sent! Enter 123456 to log in.",
    sign_in: "Sign In",
    password: "Password",
    login_btn: "Login",
    logout: "Logout",
    
    // Landing Page sections
    hero_title: "Transparent & Direct Government Procurement",
    hero_subtitle: "An AI-powered coordination platform helping Indian farmers register pre-harvest crops, verify produce quality with computer vision, and secure direct government payments.",
    get_started: "Get Started",
    how_it_works: "How It Works",
    step1_title: "1. Pre-Harvest Registration",
    step1_desc: "Farmers register crops 1-2 months before harvest, allowing government centres to plan storage capacity.",
    step2_title: "2. Visual Quality Upload",
    step2_desc: "Upload produce images via smartphone camera. Our OpenCV processor estimates moisture and uniformity instantly.",
    step3_title: "3. Direct Verification",
    step3_desc: "Procurement officers inspect samples and record moisture and weight directly to the digital registry.",
    step4_title: "4. Direct Benefit Transfer",
    step4_desc: "Funds are directly disbursed to the farmer's Aadhaar-linked bank account within 3 days.",
    faq_title: "Frequently Asked Questions",
    statistics: "Statistics",
    farmers_registered: "Farmers Registered",
    procured_qty: "Procured Quantity",
    msp_paid: "Direct Payments Paid",

    // Farmer Dashboard
    farmer_dashboard: "Farmer Dashboard",
    register_crop: "Register Crop",
    sell_produce: "Sell Produce",
    msp_info: "MSP Information",
    my_procurement: "My Procurement",
    payment_tracking: "Payment Tracking",
    voice_assistant: "Voice Assistant",
    recent_activities: "Recent Activities",
    timeline_status: "Status Timeline",
    gov_updates: "Government Updates",
    weather_info: "Weather Info",
    crop_name: "Crop Name",
    expected_harvest: "Expected Harvest Month",
    expected_qty: "Expected Quantity (Quintals)",
    land_area: "Land Area (Acres)",
    state: "State",
    district: "District",
    mandal: "Mandal",
    village: "Village",
    submit_reg: "Submit Registration",
    crop_ready: "Produce Ready",
    capture_images: "Capture Produce Images",
    full_view: "Full Produce View",
    closeup_view: "Close-up View",
    storage_view: "Storage View",
    camera_btn: "Simulate Capture",
    submit_images: "Submit Photos",
    run_ai_analysis: "Run AI Quality Pre-Assessment",
    ai_disclaimer: "Disclaimer: Final procurement approval is performed only by authorized procurement officials.",
    visual_score: "AI Visual Score",
    moisture_est: "Estimated Moisture",
    uniformity: "Grain Uniformity",
    foreign_matter: "Foreign Material",
    recommendation: "AI Recommendation",
    slot_booking: "Procurement Slot Booking",
    select_slot: "Select Preferred Slot",
    book_slot: "Confirm Slot Booking",
    txn_id: "Transaction ID",
    expected_payment_date: "Expected Date",
    payment_status: "Payment Status",
    voice_btn_start: "Tap to Speak",
    voice_btn_listening: "Listening...",
    voice_prompt: "Speak now (e.g., 'Is my payment completed?', 'నా డబ్బులు వచ్చాయా?', 'मेरा भुगतान हो गया क्या?')",

    // Status mapping
    status_registered: "Registered",
    status_uploaded: "Images Uploaded",
    status_ai_reviewed: "AI Reviewed",
    status_approved: "Approved",
    status_slot_booked: "Slot Booked",
    status_procured: "Procured",
    status_payment_completed: "Payment Completed",
  },
  te: {
    app_title: "రైతుసేవ గవ్",
    tagline: "పంట ముందస్తు నమోదు నుండి పారదర్శక ప్రభుత్వ కొనుగోలు వరకు.",
    select_language: "భాషను ఎంచుకోండి",
    farmer: "రైతు",
    officer: "కొనుగోలు అధికారి",
    admin: "అడ్మినిస్ట్రేటర్",
    phone_number: "మొబైల్ సంఖ్య",
    otp_code: "ఓటిపి కోడ్",
    send_otp: "ఓటిపి పంపండి",
    verify_otp: "ఓటిపి వెరిఫై చేయండి",
    otp_sent: "ఓటిపి పంపబడింది! లాగిన్ అవ్వడానికి 123456 నొక్కండి.",
    sign_in: "సైన్ ఇన్ చేయండి",
    password: "పాస్వర్డ్",
    login_btn: "లాగిన్",
    logout: "లాగ్ అవుట్",
    
    hero_title: "పారదర్శక మరియు ప్రత్యక్ష ప్రభుత్వ కొనుగోలు",
    hero_subtitle: "భారతీయ రైతులకు పంట నమోదు, కంప్యూటర్ విజన్ నాణ్యత తనిఖీ మరియు నేరుగా ప్రభుత్వ చెల్లింపులు అందజేసే ఒక వినూత్న డిజిటల్ పబ్లిక్ ఇన్ఫ్రాస్ట్రక్చర్.",
    get_started: "ప్రారంభించండి",
    how_it_works: "ఇది ఎలా పనిచేస్తుంది",
    step1_title: "1. పంట ముందస్తు నమోదు",
    step1_desc: "రైతులు పంట కోతకు 1-2 నెలల ముందే వివరాలు నమోదు చేసి ప్రభుత్వ కొనుగోలు ప్రణాళికకు సహాయపడతారు.",
    step2_title: "2. నాణ్యత చిత్రాల అప్‌లోడ్",
    step2_desc: "మొబైల్ కెమెరాతో పంట ఫోటోలను అప్‌లోడ్ చేయండి. మా OpenCV సిస్టమ్ తేమ శాతాన్ని తక్షణమే లెక్కిస్తుంది.",
    step3_title: "3. ప్రత్యక్ష నాణ్యత నిర్ధారణ",
    step3_desc: "అధికారులు నమూనాలను తనిఖీ చేసి, తేమ మరియు బరువును డిజిటల్ రిజిస్టర్‌లో నమోదు చేస్తారు.",
    step4_title: "4. నేరుగా ఖాతాలోకి చెల్లింపు",
    step4_desc: "డబ్బులు నేరుగా రైతు ఆధార్ అనుసంధాన బ్యాంక్ ఖాతాకు 3 రోజుల్లో జమ చేయబడతాయి.",
    faq_title: "తరచుగా అడిగే ప్రశ్నలు",
    statistics: "గణాంకాలు",
    farmers_registered: "నమోదైన రైతులు",
    procured_qty: "కొనుగోలు చేసిన పరిమాణం",
    msp_paid: "చెల్లించిన మొత్తం",

    farmer_dashboard: "రైతు డాష్‌బోర్డ్",
    register_crop: "పంట నమోదు",
    sell_produce: "పంట విక్రయం",
    msp_info: "కనీస మద్దతు ధర (MSP)",
    my_procurement: "నా కొనుగోలు",
    payment_tracking: "చెల్లింపు ట్రాకింగ్",
    voice_assistant: "వాయిస్ అసిస్టెంట్",
    recent_activities: "ఇటీవలి చర్యలు",
    timeline_status: "స్థితి టైమ్‌లైన్",
    gov_updates: "ప్రభుత్వ సమాచారం",
    weather_info: "వాతావరణ సమాచారం",
    crop_name: "పంట పేరు",
    expected_harvest: "కోత సమయం (నెల)",
    expected_qty: "ఆశించిన దిగుబడి (క్వింటాళ్ళు)",
    land_area: "భూమి విస్తీర్ణం (ఎకరాలు)",
    state: "రాష్ట్రం",
    district: "జిల్లా",
    mandal: "మండలం",
    village: "గ్రామం",
    submit_reg: "నమోదును సమర్పించండి",
    crop_ready: "పంట సిద్ధంగా ఉంది",
    capture_images: "పంట ఫోటోలు తీయండి",
    full_view: "పంట పూర్తి వ్యూ",
    closeup_view: "క్లోజ్-అప్ వ్యూ",
    storage_view: "నిల్వ ఉంచిన వ్యూ",
    camera_btn: "ఫోటో తీయండి",
    submit_images: "ఫోటోలు సమర్పించండి",
    run_ai_analysis: "నాణ్యత తనిఖీ ప్రారంభించు",
    ai_disclaimer: "గమనిక: కొనుగోలుకు తుది ఆమోదం కేవలం అధికారిక కొనుగోలు అధికారుల ద్వారా మాత్రమే జరుగుతుంది.",
    visual_score: "AI నాణ్యత స్కోరు",
    moisture_est: "అంచనా తేమ శాతం",
    uniformity: "గింజ ఏకరూపత",
    foreign_matter: "చెత్త చెదారం",
    recommendation: "AI సిఫార్సు",
    slot_booking: "కొనుగోలు స్లాట్ బుకింగ్",
    select_slot: "స్లాట్ సమయం ఎంచుకోండి",
    book_slot: "స్లాట్ నిర్ధారించండి",
    txn_id: "ట్రాన్సాక్షన్ ఐడి",
    expected_payment_date: "ఆశించిన తేది",
    payment_status: "చెల్లింపు స్థితి",
    voice_btn_start: "మాట్లాడటానికి నొక్కండి",
    voice_btn_listening: "వింటున్నాను...",
    voice_prompt: "ఇప్పుడు మాట్లాడండి (ఉదా: 'నా డబ్బులు వచ్చాయా?', 'నా స్థితి ఏమిటి?')",

    status_registered: "నమోదైంది",
    status_uploaded: "ఫోటోలు అప్‌లోడ్ అయ్యాయి",
    status_ai_reviewed: "AI సమీక్ష పూర్తయింది",
    status_approved: "ఆమోదించబడింది",
    status_slot_booked: "స్లాట్ బుక్ అయింది",
    status_procured: "కొనుగోలు పూర్తయింది",
    status_payment_completed: "చెల్లింపు పూర్తయింది",
  },
  hi: {
    app_title: "कृषक2गव",
    tagline: "फसल पूर्व पंजीकरण से पारदर्शी सरकारी खरीद तक।",
    select_language: "भाषा चुनें",
    farmer: "किसान",
    officer: "खरीद अधिकारी",
    admin: "प्रशासक",
    phone_number: "मोबाइल नंबर",
    otp_code: "ओटीपी कोड",
    send_otp: "ओटीपी भेजें",
    verify_otp: "ओटीपी सत्यापित करें",
    otp_sent: "ओटीपी भेजा गया! लॉगिन करने के लिए 123456 दर्ज करें।",
    sign_in: "साइन इन करें",
    password: "पासवर्ड",
    login_btn: "लॉगिन",
    logout: "लॉग आउट",
    
    hero_title: "पारदर्शी और प्रत्यक्ष सरकारी खरीद",
    hero_subtitle: "भारतीय किसानों के लिए एक उन्नत डिजिटल पब्लिक इंफ्रास्ट्रक्चर जो फसल पूर्व पंजीकरण, कंप्यूटर विज़न आधारित गुणवत्ता परीक्षण और सीधे बैंक खाते में भुगतान सुनिश्चित करता है।",
    get_started: "शुरू करें",
    how_it_works: "यह कैसे काम करता है",
    step1_title: "1. फसल पूर्व पंजीकरण",
    step1_desc: "किसान कटाई से 1-2 महीने पहले पंजीकरण करते हैं, जिससे खरीद केंद्र भंडारण क्षमता की योजना बना सकते हैं।",
    step2_title: "2. गुणवत्ता छवियों का अपलोड",
    step2_desc: "स्मार्टफोन कैमरा से फसल की तस्वीरें अपलोड करें। हमारी प्रणाली नमी और अनाज एकरूपता का तुरंत विश्लेषण करती है।",
    step3_title: "3. प्रत्यक्ष सत्यापन",
    step3_desc: "खरीद अधिकारी नमूने का भौतिक निरीक्षण करते हैं और नमी व वास्तविक वजन डिजिटल रजिस्ट्री में दर्ज करते हैं।",
    step4_title: "4. प्रत्यक्ष लाभ हस्तांतरण",
    step4_desc: "राशि सीधे किसान के आधार-लिंक बैंक खाते में 3 दिनों के भीतर जमा कर दी जाती है।",
    faq_title: "अक्सर पूछे जाने वाले प्रश्न",
    statistics: "आंकड़े",
    farmers_registered: "पंजीकृत किसान",
    procured_qty: "खरीदी गई मात्रा",
    msp_paid: "भुगतान की गई राशि",

    farmer_dashboard: "किसान डैशबोर्ड",
    register_crop: "फसल पंजीकरण",
    sell_produce: "फसल बेचें",
    msp_info: "न्यूनतम समर्थन मूल्य (MSP)",
    my_procurement: "मेरी खरीद",
    payment_tracking: "भुगतान की स्थिति",
    voice_assistant: "आवाज सहायक",
    recent_activities: "हाल की गतिविधियां",
    timeline_status: "स्थिति टाइमलाइन",
    gov_updates: "सरकारी अपडेट",
    weather_info: "मौसम की जानकारी",
    crop_name: "फसल का नाम",
    expected_harvest: "अनुमानित कटाई का महीना",
    expected_qty: "अनुमानित मात्रा (क्विंटल)",
    land_area: "भूमि क्षेत्र (एकड़)",
    state: "राज्य",
    district: "जिला",
    mandal: "मंडल",
    village: "गांव",
    submit_reg: "पंजीकरण जमा करें",
    crop_ready: "फसल तैयार है",
    capture_images: "तस्वीरें लें",
    full_view: "फसल की पूरी तस्वीर",
    closeup_view: "क्लोज-अप तस्वीर",
    storage_view: "भंडारण तस्वीर",
    camera_btn: "तस्वीर खींचें",
    submit_images: "तस्वीरें जमा करें",
    run_ai_analysis: "एआई गुणवत्ता जांच चलाएं",
    ai_disclaimer: "अस्वीकरण: अंतिम खरीद स्वीकृति केवल अधिकृत खरीद अधिकारियों द्वारा ही की जाती है।",
    visual_score: "एआई गुणवत्ता स्कोर",
    moisture_est: "अनुमानित नमी",
    uniformity: "अनाज एकरूपता",
    foreign_matter: "विदेशी पदार्थ",
    recommendation: "एआई सिफारिश",
    slot_booking: "खरीद स्लॉट बुकिंग",
    select_slot: "पसंदीदा स्लॉट चुनें",
    book_slot: "स्लॉट बुक करें",
    txn_id: "लेनदेन आईडी",
    expected_payment_date: "संभावित तिथि",
    payment_status: "भुगतान स्थिति",
    voice_btn_start: "बोलने के लिए टैप करें",
    voice_btn_listening: "सुन रहा हूँ...",
    voice_prompt: "अब बोलें (जैसे, 'मेरा पैसा आया क्या?', 'मेरी फसल की स्थिति क्या है?')",

    status_registered: "पंजीकृत",
    status_uploaded: "तस्वीरें अपलोड की गईं",
    status_ai_reviewed: "एआई द्वारा समीक्षित",
    status_approved: "स्वीकृत",
    status_slot_booked: "स्लॉट बुक किया गया",
    status_procured: "खरीदी गई",
    status_payment_completed: "भुगतान पूर्ण",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('f2g_lang') as Language;
    if (savedLang && ['en', 'te', 'hi'].includes(savedLang)) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('f2g_lang', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
