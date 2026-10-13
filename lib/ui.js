"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/* ---------- Language ---------- */

const D = {
  en: {
    appTitle: "Organic Farming System", farmMgmt: "Farm Management", myFarms: "My Farms",
    manageAll: "Manage all your registered farms.", addFarm: "+ Add Farm", closeForm: "Close Form",
    addNewFarm: "Add New Farm", farmName: "Farm name", location: "Location",
    areaPh: "Area e.g. 10 Acres", cropsPh: "Crops, e.g. Tomato, Onion, Wheat",
    saveFarm: "Save Farm", saving: "Saving...", loading: "Loading your farms...",
    noFarms: "No Farms Added", noFarmsHint: 'Click "Add Farm" to create your first farm.',
    logout: "Logout", advisory: "🌿 Farm Advisory", hideAdvisory: "Hide Advisory",
    daily: "📋 Daily Work", deleteFarm: "Delete Farm", confirmDelete: "Are you sure you want to delete this farm?",
    fillAll: "Please fill all farm details.", locLbl: "Location:", areaLbl: "Area:", cropLbl: "Crop:",
    active: "Active", acresN: "{n} Acres",
    back: "← My Farms", activities: "Activities", expenses: "Expenses", harvest: "Harvest", tasks: "My Tasks",
    activity: "Activity, e.g. Watering", date: "Date", notes: "Notes", category: "Category, e.g. Seeds, Labour",
    amount: "Amount (₹)", quantity: "Quantity", unit: "Unit", add: "Add", remove: "Delete", total: "Total",
    none: "No records yet.", taskName: "Task, e.g. Spray Bt", due: "Due date", details: "Details",
    markDone: "Mark done", done: "Done", fillField: "Please fill:", sure: "Delete this record?",
    noField: "This farm has no field or crop saved yet, so activities and harvest cannot be added.",
    problem: "Problem", tip: "Tip", dose: "Dose", safe: "Safe for organic", ask: "Ask certifier first",
    avoidTitle: "Do NOT use (not allowed in organic farming):",
    noAdvisory: "No advisory for this crop yet. Try Tomato, Onion, Wheat or Cotton.",
    forAcres: "For your {a} acres", water: "about {w} L of water per spray",
    disclaimer: "General guidance only. Doses are typical values, so always follow the product label and confirm with your certifier or the local Krishi Vigyan Kendra. Water per acre is assumed at {w} L; use less for young plants. Test on a few plants first.",

    createTitle: "Create your account", loginTitle: "Login to your account",
    subRegister: "Enter your details. We will email you a code (OTP) once, to verify your email.",
    subLogin: "Login with your email and password. No OTP needed.",
    fullName: "Full Name", fullNamePh: "Enter your full name", email: "Email Address",
    sendCode: "Send OTP", verify: "Verify & Continue", otpLabel: "Enter the code from your email",
    resend: "Resend code", resendIn: "Resend in {s}s", changeEmail: "Change email",
    codeSent: "A code has been sent to your email. Check your inbox and spam folder.",
    enterEmail: "Please enter your email.", enterName: "Please enter your name.", enterCode: "Please enter the code from your email.",
    rateLimit: "Too many requests right now. Please wait a minute and try again.",
    noAccount: "No account found with this email. Please create an account first.",
    badCode: "This code is wrong or has expired. Please request a new code.",
    genericErr: "Something went wrong. Please try again.",
    haveAcc: "Already have an account?", signIn: "Sign in", newHere: "New here?", createAcc: "Create account",

    tabLogin: "Login", tabCreate: "Create account", backHome: "← Home", wait: "Please wait...",
    heroTitle: "Grow organic. Manage smarter.",
    heroSub: "Manage your farms, track daily work and expenses, and get crop-wise advice on which organic pesticide to use and how much.",
    ctaCreate: "Create free account", ctaLogin: "Login", ctaOpen: "Open my farms",
    noPw: "Verify your email once with a code. After that, login is quick with your password.",
    featTitle: "Everything you need for your farm",
    f1t: "My Farms", f1d: "Add all your farms with location, area and crops in one place.",
    f2t: "Daily Work", f2d: "Record activities, expenses and harvest for every farm.",
    f3t: "Tasks and Reminders", f3d: "Plan sprays and chores with due dates and mark them done.",
    f4t: "Organic Farm Advisory", f4d: "See which pesticides are safe for your crop, which are not allowed, and the dose for your acres.",
    f5t: "Marathi and English", f5d: "Use the app in the language you are comfortable with.",
    f6t: "Private and Secure", f6d: "Your email is verified once with a code, and your farm data is visible only to you.",
    howTitle: "How it works",
    s1t: "Create your account", s1d: "Enter your name, email and password, then type the code we send you once.",
    s2t: "Add your farm", s2d: "Enter the location, area and the crops you grow.",
    s3t: "Get advice and track work", s3d: "Open Farm Advisory and log your daily work.",
    bandTitle: "Start organic farming smarter today", footer: "© Organic Farming System",
    hello: "Namaste", statFarms: "Farms", statAcres: "Total acres", statTasks: "Pending tasks", statExpenses: "Total expenses",

    password: "Password", passwordPh: "At least 6 characters", show: "Show", hide: "Hide",
    forgot: "Forgot password?", resetTitle: "Reset password",
    resetSub: "Enter your email. We will send a code, then you can set a new password.",
    newPassword: "Set a new password", savePassword: "Save password & continue",
    loginBtn: "Login", createBtn: "Create account & send OTP", backLogin: "← Back to login",
    wrongCreds: "Wrong email or password.", shortPw: "Password must be at least 6 characters.",
    enterPw: "Please enter your password.", haveAccount: "This email already has an account. Please login.",
    needVerify: "Your email is not verified yet. We sent you a new code.",

    oldHint: "Did you create your account earlier with an OTP code? Then you do not have a password yet. Tap below to set one.",
    setPwBtn: "Set / reset my password",

    tabCrops: "Crops", tabAdvisory: "Advisory", thisMonthExp: "This month's expenses", actThisMonth: "Activities this month",
    totalHarvest: "Total harvest", typeLbl: "Type", catLbl: "Category", cropSel: "Crop", breakdown: "Expense breakdown",
    planting: "Planting date", expHarvest: "Expected harvest", statusLbl: "Status", st_Growing: "Growing", st_Harvested: "Harvested",
    daysLeft: "{n} days to harvest", overdue: "Expected harvest date has passed", csv: "⬇ Download CSV", noCropsYet: "Add a crop to this farm first.",
    a_Watering: "Watering", a_Sowing: "Sowing / Planting", a_Weeding: "Weeding", a_Fertilizer: "Fertilizer / Compost", a_Spraying: "Spraying",
    a_Pruning: "Pruning", a_Ploughing: "Ploughing", a_Harvesting: "Harvesting", a_Other: "Other",
    c_Seeds: "Seeds", c_Labour: "Labour", c_Fertilizer: "Fertilizer / Compost", c_Pesticide: "Pesticide / Spray", c_Water: "Water / Irrigation",
    c_Equipment: "Equipment", c_Transport: "Transport", c_Other: "Other",

    tabProfit: "Profit & Loss", pricePer: "Price per unit (₹)", totalSales: "Total sales", netProfit: "Net profit", netLoss: "Net loss",
    profitLoss: "Profit / Loss", salesLbl: "Sales", margin: "Profit margin", cropSales: "Crop-wise sales",
    noSales: "Add a harvest with a price to see sales and profit.",

    pickCrops: "Select your crops", otherCrop: "Other crop (type the name)", addCrop: "➕ Add crops", delCrop: "Delete",
  },
  mr: {
    appTitle: "सेंद्रिय शेती प्रणाली", farmMgmt: "शेती व्यवस्थापन", myFarms: "माझी शेते",
    manageAll: "तुमची सर्व नोंदणीकृत शेते येथे सांभाळा.", addFarm: "+ शेत जोडा", closeForm: "फॉर्म बंद करा",
    addNewFarm: "नवीन शेत जोडा", farmName: "शेताचे नाव", location: "ठिकाण",
    areaPh: "क्षेत्र उदा. 10 एकर", cropsPh: "पिके, उदा. टोमॅटो, कांदा, गहू",
    saveFarm: "शेत जतन करा", saving: "जतन होत आहे...", loading: "तुमची शेते लोड होत आहेत...",
    noFarms: "अजून शेत जोडलेले नाही", noFarmsHint: 'पहिले शेत तयार करण्यासाठी "शेत जोडा" दाबा.',
    logout: "बाहेर पडा", advisory: "🌿 शेती सल्ला", hideAdvisory: "सल्ला लपवा",
    daily: "📋 रोजची कामे", deleteFarm: "शेत हटवा", confirmDelete: "हे शेत खरोखर हटवायचे आहे का?",
    fillAll: "कृपया शेताची सर्व माहिती भरा.", locLbl: "ठिकाण:", areaLbl: "क्षेत्र:", cropLbl: "पीक:",
    active: "सक्रिय", acresN: "{n} एकर",
    back: "← माझी शेते", activities: "कामांची नोंद", expenses: "खर्च", harvest: "उत्पादन (काढणी)", tasks: "माझी कामे (टास्क)",
    activity: "काम, उदा. पाणी देणे", date: "तारीख", notes: "टिपण", category: "प्रकार, उदा. बियाणे, मजुरी",
    amount: "रक्कम (₹)", quantity: "प्रमाण", unit: "एकक", add: "जोडा", remove: "हटवा", total: "एकूण",
    none: "अजून नोंद नाही.", taskName: "काम, उदा. Bt फवारणी", due: "अंतिम तारीख", details: "तपशील",
    markDone: "पूर्ण झाले", done: "पूर्ण", fillField: "कृपया भरा:", sure: "ही नोंद हटवायची का?",
    noField: "या शेतासाठी शेताचा तुकडा किंवा पीक जतन झालेले नाही, त्यामुळे कामे व उत्पादन जोडता येणार नाही.",
    problem: "समस्या", tip: "टीप", dose: "मात्रा", safe: "सेंद्रिय शेतीसाठी सुरक्षित", ask: "आधी प्रमाणन संस्थेला विचारा",
    avoidTitle: "वापरू नका (सेंद्रिय शेतीत मान्य नाही):",
    noAdvisory: "या पिकासाठी अजून सल्ला नाही. टोमॅटो, कांदा, गहू किंवा कापूस वापरून पहा.",
    forAcres: "तुमच्या {a} एकरासाठी", water: "प्रति फवारणी सुमारे {w} लिटर पाणी",
    disclaimer: "ही फक्त सर्वसाधारण माहिती आहे. मात्रा सामान्य प्रमाणाच्या आहेत, त्यामुळे नेहमी उत्पादनाच्या लेबलप्रमाणे वापरा आणि प्रमाणन संस्था किंवा स्थानिक कृषी विज्ञान केंद्राकडून खात्री करा. प्रति एकर {w} लिटर पाणी गृहीत धरले आहे; लहान रोपांसाठी कमी वापरा. आधी थोड्या झाडांवर तपासा.",

    createTitle: "तुमचे खाते तयार करा", loginTitle: "तुमच्या खात्यात लॉगिन करा",
    subRegister: "तुमची माहिती टाका. ईमेल पडताळण्यासाठी आम्ही एकदाच कोड (OTP) पाठवू.",
    subLogin: "ईमेल आणि पासवर्डने लॉगिन करा. OTP नको.",
    fullName: "पूर्ण नाव", fullNamePh: "तुमचे पूर्ण नाव टाका", email: "ईमेल पत्ता",
    sendCode: "OTP पाठवा", verify: "तपासा आणि पुढे जा", otpLabel: "ईमेलवर आलेला कोड टाका",
    resend: "कोड पुन्हा पाठवा", resendIn: "{s} सेकंदांनी पुन्हा पाठवा", changeEmail: "ईमेल बदला",
    codeSent: "तुमच्या ईमेलवर कोड पाठवला आहे. इनबॉक्स आणि स्पॅम तपासा.",
    enterEmail: "कृपया ईमेल टाका.", enterName: "कृपया नाव टाका.", enterCode: "कृपया ईमेलवरील कोड टाका.",
    rateLimit: "सध्या खूप विनंत्या झाल्या आहेत. कृपया एक मिनिट थांबून पुन्हा प्रयत्न करा.",
    noAccount: "या ईमेलने खाते सापडले नाही. कृपया आधी खाते तयार करा.",
    badCode: "हा कोड चुकीचा आहे किंवा संपला आहे. कृपया नवीन कोड मागवा.",
    genericErr: "काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा.",
    haveAcc: "आधीच खाते आहे?", signIn: "लॉगिन करा", newHere: "नवीन आहात?", createAcc: "खाते तयार करा",

    tabLogin: "लॉगिन", tabCreate: "खाते तयार करा", backHome: "← मुख्यपृष्ठ", wait: "कृपया थांबा...",
    heroTitle: "सेंद्रिय पिकवा. स्मार्ट सांभाळा.",
    heroSub: "तुमची शेते सांभाळा, रोजची कामे व खर्च नोंदवा, आणि कोणत्या पिकाला कोणते सेंद्रिय कीटकनाशक किती प्रमाणात वापरायचे याचा सल्ला मिळवा.",
    ctaCreate: "मोफत खाते तयार करा", ctaLogin: "लॉगिन", ctaOpen: "माझी शेते उघडा",
    noPw: "ईमेल एकदाच कोडने पडताळा. नंतर पासवर्डने झटपट लॉगिन.",
    featTitle: "तुमच्या शेतासाठी सर्व काही एका ठिकाणी",
    f1t: "माझी शेते", f1d: "तुमची सर्व शेते ठिकाण, क्षेत्र आणि पिकांसह एका जागी जोडा.",
    f2t: "रोजची कामे", f2d: "प्रत्येक शेतातील कामे, खर्च आणि उत्पादन नोंदवा.",
    f3t: "कामांची यादी", f3d: "फवारणी व इतर कामे अंतिम तारखेसह ठरवा आणि पूर्ण झाल्यावर चिन्हांकित करा.",
    f4t: "सेंद्रिय शेती सल्ला", f4d: "तुमच्या पिकासाठी कोणती कीटकनाशके सुरक्षित, कोणती मान्य नाहीत आणि तुमच्या एकरासाठी किती मात्रा ते पहा.",
    f5t: "मराठी आणि इंग्रजी", f5d: "तुम्हाला सोयीच्या भाषेत अॅप वापरा.",
    f6t: "खाजगी आणि सुरक्षित", f6d: "तुमचा ईमेल एकदाच कोडने पडताळला जातो, आणि तुमचा शेतीचा डेटा फक्त तुम्हालाच दिसतो.",
    howTitle: "हे कसे चालते",
    s1t: "खाते तयार करा", s1d: "नाव, ईमेल आणि पासवर्ड टाका, मग आम्ही एकदा पाठवलेला कोड टाका.",
    s2t: "शेत जोडा", s2d: "ठिकाण, क्षेत्र आणि तुम्ही घेत असलेली पिके टाका.",
    s3t: "सल्ला घ्या, कामे नोंदवा", s3d: "शेती सल्ला उघडा आणि रोजची कामे नोंदवा.",
    bandTitle: "आजच स्मार्ट सेंद्रिय शेती सुरू करा", footer: "© सेंद्रिय शेती प्रणाली",
    hello: "नमस्कार", statFarms: "शेते", statAcres: "एकूण एकर", statTasks: "बाकी कामे", statExpenses: "एकूण खर्च",

    password: "पासवर्ड", passwordPh: "किमान 6 अक्षरे", show: "दाखवा", hide: "लपवा",
    forgot: "पासवर्ड विसरलात?", resetTitle: "पासवर्ड रीसेट करा",
    resetSub: "तुमचा ईमेल टाका. आम्ही कोड पाठवू, मग तुम्ही नवीन पासवर्ड ठेवू शकता.",
    newPassword: "नवीन पासवर्ड ठेवा", savePassword: "पासवर्ड जतन करा आणि पुढे जा",
    loginBtn: "लॉगिन", createBtn: "खाते तयार करा आणि OTP पाठवा", backLogin: "← लॉगिनकडे परत",
    wrongCreds: "ईमेल किंवा पासवर्ड चुकीचा आहे.", shortPw: "पासवर्ड किमान 6 अक्षरांचा असावा.",
    enterPw: "कृपया पासवर्ड टाका.", haveAccount: "या ईमेलचे खाते आधीच आहे. कृपया लॉगिन करा.",
    needVerify: "तुमचा ईमेल अजून पडताळलेला नाही. आम्ही नवीन कोड पाठवला आहे.",

    oldHint: "तुम्ही आधी OTP कोडने खाते तयार केले होते का? तर तुमचा पासवर्ड अजून नाही. पासवर्ड ठेवण्यासाठी खाली दाबा.",
    setPwBtn: "पासवर्ड ठेवा / रीसेट करा",

    tabCrops: "पिके", tabAdvisory: "सल्ला", thisMonthExp: "या महिन्याचा खर्च", actThisMonth: "या महिन्यातील कामे",
    totalHarvest: "एकूण उत्पादन", typeLbl: "प्रकार", catLbl: "वर्ग", cropSel: "पीक", breakdown: "खर्चाचा तपशील",
    planting: "लागवडीची तारीख", expHarvest: "अपेक्षित काढणी", statusLbl: "स्थिती", st_Growing: "वाढत आहे", st_Harvested: "काढणी झाली",
    daysLeft: "काढणीला {n} दिवस", overdue: "अपेक्षित काढणीची तारीख उलटली आहे", csv: "⬇ CSV डाउनलोड", noCropsYet: "आधी या शेतात एक पीक जोडा.",
    a_Watering: "पाणी देणे", a_Sowing: "पेरणी / लागवड", a_Weeding: "निंदणी", a_Fertilizer: "खत / कंपोस्ट", a_Spraying: "फवारणी",
    a_Pruning: "छाटणी", a_Ploughing: "नांगरणी", a_Harvesting: "काढणी", a_Other: "इतर",
    c_Seeds: "बियाणे", c_Labour: "मजुरी", c_Fertilizer: "खत / कंपोस्ट", c_Pesticide: "कीटकनाशक / फवारणी", c_Water: "पाणी / सिंचन",
    c_Equipment: "अवजारे", c_Transport: "वाहतूक", c_Other: "इतर",

    tabProfit: "नफा / तोटा", pricePer: "प्रति एकक दर (₹)", totalSales: "एकूण विक्री", netProfit: "निव्वळ नफा", netLoss: "निव्वळ तोटा",
    profitLoss: "नफा / तोटा", salesLbl: "विक्री", margin: "नफ्याचे प्रमाण", cropSales: "पीकनिहाय विक्री",
    noSales: "विक्री व नफा पाहण्यासाठी दरासह उत्पादन जोडा.",

    pickCrops: "तुमची पिके निवडा", otherCrop: "इतर पीक (नाव लिहा)", addCrop: "➕ पिके जोडा", delCrop: "हटवा",
  },
};

export function useLang() {
  const [lang, setLangState] = useState("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang");
      if (saved === "en" || saved === "mr") setLangState(saved);
    } catch (e) {}
  }, []);

  function setLang(l) {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
    } catch (e) {}
  }

  const t = (key) => (D[lang] && D[lang][key]) || D.en[key] || key;
  return { lang, setLang, t };
}

export function LangToggle({ lang, setLang }) {
  const btn = (code, label) => (
    <button
      onClick={() => setLang(code)}
      style={{
        padding: "8px 12px",
        border: "1px solid white",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "700",
        background: lang === code ? "white" : "transparent",
        color: lang === code ? "#164c36" : "white",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: "flex", gap: "6px" }}>
      {btn("en", "English")}
      {btn("mr", "मराठी")}
    </div>
  );
}

/* ---------- Reusable records list + add form ---------- */

const today = () => new Date().toISOString().slice(0, 10);

const inputStyle = {
  width: "100%",
  padding: "10px",
  border: "1px solid #d5ddd8",
  borderRadius: "8px",
  fontSize: "15px",
  boxSizing: "border-box",
};

export function Records({ title, table, extra = {}, filter, fields, line, sub, sum, doneKey, t }) {
  const blank = () =>
    Object.fromEntries(
      fields.map((f) => [f.key, f.type === "date" ? today() : f.options ? f.options[0] : ""])
    );

  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const filterKey = JSON.stringify(filter || null);

  async function load() {
    let q = supabase.from(table).select("*").order("created_at", { ascending: false });

    if (filter && filter.in) {
      if (filter.in.length === 0) {
        setRows([]);
        return;
      }
      q = q.in(filter.col, filter.in);
    } else if (filter) {
      q = q.eq(filter.col, filter.val);
    }

    const { data, error } = await q;
    if (error) alert(error.message);
    else setRows(data || []);
  }

  useEffect(() => {
    load();
  }, [filterKey]);

  async function add(e) {
    e.preventDefault();

    for (const f of fields) {
      if (f.required && !String(form[f.key]).trim()) {
        alert(t("fillField") + " " + f.label);
        return;
      }
    }

    setBusy(true);
    const { data: s } = await supabase.auth.getSession();
    const user = s.session ? s.session.user : null;

    if (!user) {
      setBusy(false);
      return;
    }

    const payload = { user_id: user.id, ...extra };
    for (const f of fields) {
      const v = String(form[f.key]).trim();
      if (v === "") continue;
      payload[f.key] = f.type === "number" ? Number(v) : v;
    }

    const { error } = await supabase.from(table).insert(payload);

    if (error) alert(error.message);
    else {
      setForm(blank());
      await load();
    }
    setBusy(false);
  }

  async function remove(id) {
    if (!window.confirm(t("sure"))) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) alert(error.message);
    else load();
  }

  async function markDone(id) {
    const { error } = await supabase.from(table).update({ status: "Done" }).eq("id", id);
    if (error) alert(error.message);
    else load();
  }

  const total = sum ? rows.reduce((a, r) => a + (Number(r[sum]) || 0), 0) : null;

  return (
    <div
      style={{
        background: "white",
        borderRadius: "15px",
        padding: "20px",
        marginBottom: "22px",
        boxShadow: "0 5px 20px rgba(0,0,0,0.07)",
      }}
    >
      <h3 style={{ margin: "0 0 12px", color: "#164c36" }}>{title}</h3>

      <form onSubmit={add}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: "10px",
          }}
        >
          {fields.map((f) => (
            <label key={f.key} style={{ fontSize: "12px", color: "#666" }}>
              {f.label}
              {f.options ? (
                <select
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  style={inputStyle}
                >
                  {f.options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type || "text"}
                  min={f.type === "number" ? "0" : undefined}
                  step={f.type === "number" ? "any" : undefined}
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  style={inputStyle}
                />
              )}
            </label>
          ))}
        </div>

        <button
          type="submit"
          disabled={busy}
          style={{
            marginTop: "12px",
            background: "#176b3a",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          {t("add")}
        </button>
      </form>

      {total !== null && rows.length > 0 && (
        <p style={{ fontWeight: "700", color: "#164c36" }}>
          {t("total")}: ₹{total.toLocaleString("en-IN")}
        </p>
      )}

      <div style={{ marginTop: "10px" }}>
        {rows.length === 0 && <p style={{ color: "#666" }}>{t("none")}</p>}

        {rows.map((r) => (
          <div
            key={r.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              borderTop: "1px solid #e4ebe6",
              padding: "9px 0",
            }}
          >
            <div>
              <div style={{ fontWeight: "600" }}>
                {line(r)}
                {doneKey && r.status === "Done" ? " ✔ " + t("done") : ""}
              </div>
              <div style={{ fontSize: "13px", color: "#666" }}>{sub(r)}</div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              {doneKey && r.status !== "Done" && (
                <button
                  onClick={() => markDone(r.id)}
                  style={{
                    border: "1px solid #176b3a",
                    background: "white",
                    color: "#176b3a",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  {t("markDone")}
                </button>
              )}
              <button
                onClick={() => remove(r.id)}
                style={{
                  border: "1px solid #e05252",
                  background: "white",
                  color: "#c62828",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                {t("remove")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
