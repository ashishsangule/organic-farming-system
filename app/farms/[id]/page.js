"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useLang, LangToggle } from "@/lib/ui";
import Advisory from "../Advisory";

const today = () => new Date().toISOString().slice(0, 10);

const ACTS = [["Watering", "💧"], ["Sowing", "🌱"], ["Weeding", "🌿"], ["Fertilizer", "🧪"], ["Spraying", "🐛"], ["Pruning", "✂️"], ["Ploughing", "🚜"], ["Harvesting", "🌾"], ["Other", "📝"]];
const CATS = [["Seeds", "🌰"], ["Labour", "👷"], ["Fertilizer", "🧪"], ["Pesticide", "🐛"], ["Water", "💧"], ["Equipment", "🔧"], ["Transport", "🚚"], ["Other", "📦"]];
const COLORS = ["#176b3a", "#3b9a5b", "#8bd450", "#f2b705", "#e08a2e", "#c25b5b", "#5b8fc2", "#8a6bc2"];

const box = { background: "white", borderRadius: "15px", padding: "20px", marginBottom: "20px", boxShadow: "0 5px 20px rgba(0,0,0,0.07)" };
const inp = { width: "100%", padding: "10px", border: "1px solid #d5ddd8", borderRadius: "8px", fontSize: "15px", boxSizing: "border-box" };
const primary = { background: "#176b3a", color: "white", border: "none", padding: "11px 22px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "15px" };
const ghost = { background: "white", color: "#c62828", border: "1px solid #e05252", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontWeight: "600" };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "10px" };

export default function FarmDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { lang, setLang, t } = useLang();

  const [farm, setFarm] = useState(null);
  const [uid, setUid] = useState(null);
  const [acts, setActs] = useState([]);
  const [exps, setExps] = useState([]);
  const [harv, setHarv] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("act");
  const [busy, setBusy] = useState(false);
  const [af, setAf] = useState({ type: "Watering", date: today(), notes: "" });
  const [ef, setEf] = useState({ category: "Seeds", amount: "", date: today(), notes: "" });
  const [hf, setHf] = useState({ crop_id: "", quantity: "", unit: "kg", date: today() });

  const fields = farm ? farm.fields || [] : [];
  const crops = fields.flatMap((f) => (f.crops || []).map((c) => ({ ...c, field_id: f.id })));
  const fieldId = fields.length ? fields[0].id : null;
  const monthKey = today().slice(0, 7);

  async function load() {
    const { data: f } = await supabase
      .from("farms")
      .select("id, farm_name, location, total_area, fields(id, crops(id, crop_name, planting_date, expected_harvest, status))")
      .eq("id", id)
      .single();

    setFarm(f);
    if (!f) return;

    const fIds = (f.fields || []).map((x) => x.id);
    const cIds = (f.fields || []).flatMap((x) => (x.crops || []).map((c) => c.id));

    const [a, e, h] = await Promise.all([
      fIds.length
        ? supabase.from("activities").select("*").in("field_id", fIds).order("activity_date", { ascending: false }).order("created_at", { ascending: false })
        : { data: [] },
      supabase.from("expenses").select("*").eq("farm_id", f.id).order("expense_date", { ascending: false }).order("created_at", { ascending: false }),
      cIds.length
        ? supabase.from("harvests").select("*").in("crop_id", cIds).order("harvest_date", { ascending: false }).order("created_at", { ascending: false })
        : { data: [] },
    ]);

    setActs(a.data || []);
    setExps(e.data || []);
    setHarv(h.data || []);
    setHf((p) => (p.crop_id || !cIds.length ? p : { ...p, crop_id: String(cIds[0]) }));
  }

  useEffect(() => {
    async function init() {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) {
        router.replace("/login");
        return;
      }
      setUid(s.session.user.id);
      await load();
      setLoaded(true);
    }
    init();
  }, [id]);

  async function save(table, payload, reset) {
    setBusy(true);
    const { error } = await supabase.from(table).insert({ user_id: uid, ...payload });
    setBusy(false);
    if (error) {
      alert(error.message);
      return;
    }
    reset();
    await load();
  }

  async function del(table, rowId) {
    if (!window.confirm(t("sure"))) return;
    const { error } = await supabase.from(table).delete().eq("id", rowId);
    if (error) alert(error.message);
    else load();
  }

  async function updateCrop(cropId, patch) {
    const { error } = await supabase.from("crops").update(patch).eq("id", cropId);
    if (error) alert(error.message);
    else load();
  }

  function addAct(e) {
    e.preventDefault();
    if (!fieldId) return;
    save(
      "activities",
      { field_id: fieldId, activity: af.type, activity_date: af.date || undefined, notes: af.notes.trim() || undefined },
      () => setAf({ type: "Watering", date: today(), notes: "" })
    );
  }

  function addExp(e) {
    e.preventDefault();
    const amount = Number(ef.amount);
    if (!(amount > 0)) return alert(t("fillField") + " " + t("amount"));
    save(
      "expenses",
      { farm_id: farm.id, category: ef.category, amount, expense_date: ef.date || undefined, notes: ef.notes.trim() || undefined },
      () => setEf({ category: "Seeds", amount: "", date: today(), notes: "" })
    );
  }

  function addHarv(e) {
    e.preventDefault();
    const quantity = Number(hf.quantity);
    if (!hf.crop_id) return alert(t("noCropsYet"));
    if (!(quantity > 0)) return alert(t("fillField") + " " + t("quantity"));
    save(
      "harvests",
      { crop_id: Number(hf.crop_id), quantity, unit: hf.unit, harvest_date: hf.date || undefined },
      () => setHf({ ...hf, quantity: "", date: today() })
    );
  }

  // ----- summaries -----
  const sum = (rows, k) => rows.reduce((a, r) => a + (Number(r[k]) || 0), 0);
  const totalExp = sum(exps, "amount");
  const monthExp = sum(exps.filter((r) => (r.expense_date || "").startsWith(monthKey)), "amount");
  const monthActs = acts.filter((r) => (r.activity_date || "").startsWith(monthKey)).length;

  const harvByUnit = {};
  harv.forEach((h) => {
    harvByUnit[h.unit || "kg"] = (harvByUnit[h.unit || "kg"] || 0) + (Number(h.quantity) || 0);
  });
  const harvText = Object.entries(harvByUnit).map(([u, q]) => `${+q.toFixed(2)} ${u}`).join(" + ") || "0";

  const byCat = {};
  exps.forEach((r) => {
    byCat[r.category] = (byCat[r.category] || 0) + (Number(r.amount) || 0);
  });
  const catRows = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  const money = (n) => "₹" + Number(n).toLocaleString("en-IN");
  const cropName = (cid) => (crops.find((c) => c.id === cid) || {}).crop_name || "";
  const actLabel = (a) => {
    const f = ACTS.find((x) => x[0] === a);
    return f ? f[1] + " " + t("a_" + a) : a;
  };
  const catLabel = (c) => {
    const f = CATS.find((x) => x[0] === c);
    return f ? f[1] + " " + t("c_" + c) : c;
  };

  const row = (key, title, sub, onDel) => (
    <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap", borderTop: "1px solid #e4ebe6", padding: "10px 0" }}>
      <div>
        <div style={{ fontWeight: "600" }}>{title}</div>
        {sub && <div style={{ fontSize: "13px", color: "#666" }}>{sub}</div>}
      </div>
      <button style={ghost} onClick={onDel}>{t("remove")}</button>
    </div>
  );

  const field = (label, el) => (
    <label style={{ fontSize: "12px", color: "#666", display: "block" }}>
      {label}
      {el}
    </label>
  );

  const tabs = [["act", "📋 " + t("activities")], ["exp", "💰 " + t("expenses")], ["harv", "🌾 " + t("harvest")], ["crops", "🌱 " + t("tabCrops")], ["adv", "🌿 " + t("tabAdvisory")]];

  return (
    <main style={{ minHeight: "100vh", background: "#f4f8f5" }}>
      <header style={{ background: "#164c36", color: "white", padding: "18px 30px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
        <Link href="/farms" style={{ color: "white", fontWeight: "700", textDecoration: "none" }}>{t("back")}</Link>
        <LangToggle lang={lang} setLang={setLang} />
      </header>

      <section style={{ padding: "26px 20px", maxWidth: "920px", margin: "auto" }}>
        {!loaded && <p style={{ color: "#666" }}>{t("loading")}</p>}

        {loaded && farm && (
          <>
            <h2 style={{ margin: 0, color: "#164c36", fontSize: "30px" }}>🌱 {farm.farm_name}</h2>
            <p style={{ color: "#666", margin: "4px 0 20px" }}>
              📍 {farm.location || "-"} · 📐 {t("acresN").replace("{n}", Number(farm.total_area) || 0)}
              {crops.length ? " · 🌾 " + crops.map((c) => c.crop_name).join(", ") : ""}
            </p>

            <div style={{ ...grid, marginBottom: "22px" }}>
              {[
                ["💰", t("statExpenses"), money(totalExp)],
                ["📅", t("thisMonthExp"), money(monthExp)],
                ["📋", t("actThisMonth"), monthActs],
                ["🌾", t("totalHarvest"), harvText],
              ].map(([icon, label, value]) => (
                <div key={label} style={{ background: "white", borderRadius: "14px", padding: "16px", boxShadow: "0 5px 18px rgba(0,0,0,0.07)" }}>
                  <div style={{ fontSize: "26px" }}>{icon}</div>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: "#164c36" }}>{value}</div>
                  <div style={{ color: "#666", fontSize: "13px" }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "18px" }}>
              {tabs.map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  style={{ padding: "10px 16px", borderRadius: "999px", border: "1px solid #176b3a", cursor: "pointer", fontWeight: "700", fontSize: "15px", background: tab === k ? "#176b3a" : "white", color: tab === k ? "white" : "#176b3a" }}
                >
                  {label}
                </button>
              ))}
            </div>

            {fieldId === null && (
              <p style={{ background: "#fbeccb", padding: "12px", borderRadius: "10px" }}>{t("noField")}</p>
            )}

            {tab === "act" && fieldId !== null && (
              <div style={box}>
                <form onSubmit={addAct}>
                  <div style={grid}>
                    {field(t("typeLbl"), (
                      <select style={inp} value={af.type} onChange={(e) => setAf({ ...af, type: e.target.value })}>
                        {ACTS.map(([k, ic]) => <option key={k} value={k}>{ic} {t("a_" + k)}</option>)}
                      </select>
                    ))}
                    {field(t("date"), <input type="date" style={inp} value={af.date} onChange={(e) => setAf({ ...af, date: e.target.value })} />)}
                    {field(t("notes"), <input style={inp} value={af.notes} onChange={(e) => setAf({ ...af, notes: e.target.value })} />)}
                  </div>
                  <button type="submit" style={{ ...primary, marginTop: "12px" }} disabled={busy}>{t("add")}</button>
                </form>
                <div style={{ marginTop: "12px" }}>
                  {acts.length === 0 && <p style={{ color: "#666" }}>{t("none")}</p>}
                  {acts.map((a) => row(a.id, actLabel(a.activity), [a.activity_date, a.notes].filter(Boolean).join(" · "), () => del("activities", a.id)))}
                </div>
              </div>
            )}

            {tab === "exp" && (
              <div style={box}>
                <form onSubmit={addExp}>
                  <div style={grid}>
                    {field(t("catLbl"), (
                      <select style={inp} value={ef.category} onChange={(e) => setEf({ ...ef, category: e.target.value })}>
                        {CATS.map(([k, ic]) => <option key={k} value={k}>{ic} {t("c_" + k)}</option>)}
                      </select>
                    ))}
                    {field(t("amount"), <input type="number" min="0" step="any" style={inp} value={ef.amount} onChange={(e) => setEf({ ...ef, amount: e.target.value })} />)}
                    {field(t("date"), <input type="date" style={inp} value={ef.date} onChange={(e) => setEf({ ...ef, date: e.target.value })} />)}
                    {field(t("notes"), <input style={inp} value={ef.notes} onChange={(e) => setEf({ ...ef, notes: e.target.value })} />)}
                  </div>
                  <button type="submit" style={{ ...primary, marginTop: "12px" }} disabled={busy}>{t("add")}</button>
                </form>

                {catRows.length > 0 && (
                  <div style={{ marginTop: "18px" }}>
                    <div style={{ fontWeight: "800", color: "#164c36", marginBottom: "8px" }}>{t("breakdown")}</div>
                    {catRows.map(([c, v], i) => (
                      <div key={c} style={{ marginBottom: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                          <span>{catLabel(c)}</span>
                          <span>{money(v)} ({Math.round((v / totalExp) * 100)}%)</span>
                        </div>
                        <div style={{ background: "#eef3ea", borderRadius: "6px", height: "10px" }}>
                          <div style={{ width: Math.max(3, (v / totalExp) * 100) + "%", height: "10px", borderRadius: "6px", background: COLORS[i % COLORS.length] }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: "12px" }}>
                  {exps.length === 0 && <p style={{ color: "#666" }}>{t("none")}</p>}
                  {exps.map((r) => row(r.id, `${catLabel(r.category)} - ${money(r.amount)}`, [r.expense_date, r.notes].filter(Boolean).join(" · "), () => del("expenses", r.id)))}
                </div>
              </div>
            )}

            {tab === "harv" && (
              <div style={box}>
                {crops.length === 0 ? (
                  <p style={{ color: "#666" }}>{t("noCropsYet")}</p>
                ) : (
                  <form onSubmit={addHarv}>
                    <div style={grid}>
                      {field(t("cropSel"), (
                        <select style={inp} value={hf.crop_id} onChange={(e) => setHf({ ...hf, crop_id: e.target.value })}>
                          {crops.map((c) => <option key={c.id} value={c.id}>{c.crop_name}</option>)}
                        </select>
                      ))}
                      {field(t("quantity"), <input type="number" min="0" step="any" style={inp} value={hf.quantity} onChange={(e) => setHf({ ...hf, quantity: e.target.value })} />)}
                      {field(t("unit"), (
                        <select style={inp} value={hf.unit} onChange={(e) => setHf({ ...hf, unit: e.target.value })}>
                          {["kg", "quintal", "ton"].map((u) => <option key={u}>{u}</option>)}
                        </select>
                      ))}
                      {field(t("date"), <input type="date" style={inp} value={hf.date} onChange={(e) => setHf({ ...hf, date: e.target.value })} />)}
                    </div>
                    <button type="submit" style={{ ...primary, marginTop: "12px" }} disabled={busy}>{t("add")}</button>
                  </form>
                )}
                <div style={{ marginTop: "12px" }}>
                  {harv.length === 0 && <p style={{ color: "#666" }}>{t("none")}</p>}
                  {harv.map((h) => row(h.id, `🌾 ${h.quantity} ${h.unit}`, [cropName(h.crop_id), h.harvest_date].filter(Boolean).join(" · "), () => del("harvests", h.id)))}
                </div>
              </div>
            )}

            {tab === "crops" && (
              <div>
                {crops.length === 0 && <p style={{ color: "#666" }}>{t("noCropsYet")}</p>}
                {crops.map((c) => {
                  const days = c.expected_harvest ? Math.ceil((new Date(c.expected_harvest) - new Date(today())) / 86400000) : null;
                  return (
                    <div key={c.id} style={box}>
                      <h3 style={{ margin: "0 0 10px", color: "#164c36" }}>🌱 {c.crop_name}</h3>
                      <div style={grid}>
                        {field(t("planting"), <input type="date" style={inp} value={c.planting_date || ""} onChange={(e) => updateCrop(c.id, { planting_date: e.target.value || null })} />)}
                        {field(t("expHarvest"), <input type="date" style={inp} value={c.expected_harvest || ""} onChange={(e) => updateCrop(c.id, { expected_harvest: e.target.value || null })} />)}
                        {field(t("statusLbl"), (
                          <select style={inp} value={c.status || "Growing"} onChange={(e) => updateCrop(c.id, { status: e.target.value })}>
                            {["Growing", "Harvested"].map((s) => <option key={s} value={s}>{t("st_" + s)}</option>)}
                          </select>
                        ))}
                      </div>
                      {days !== null && c.status !== "Harvested" && (
                        <p style={{ margin: "12px 0 0", fontWeight: "700", color: days < 0 ? "#c62828" : "#176b3a" }}>
                          {days < 0 ? t("overdue") : "⏳ " + t("daysLeft").replace("{n}", days)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {tab === "adv" && (
              <div style={box}>
                <Advisory crop={crops.map((c) => c.crop_name).join(", ")} acres={Number(farm.total_area) || 0} t={t} />
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
