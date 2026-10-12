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
