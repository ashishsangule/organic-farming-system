"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ACTS, workLabel } from "@/lib/work";

const today = () => new Date().toISOString().slice(0, 10);

const inp = { width: "100%", padding: "10px", border: "1px solid #d5ddd8", borderRadius: "8px", fontSize: "15px", boxSizing: "border-box" };
const small = { background: "white", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontWeight: "600", border: "1px solid #555", color: "#333" };

export default function TasksPanel({ t, farms, view, onChange }) {
  const blank = () => ({
    farm: farms.length === 1 ? String(farms[0].id) : "",
    name: "",
    date: today(),
    notes: "",
    status: "todo",
  });

  const [items, setItems] = useState([]);
  const [firstField, setFirstField] = useState({});
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const farmName = (id) => (farms.find((f) => f.id === id) || {}).name;

  async function load() {
    const [tk, ac, fl] = await Promise.all([
      supabase.from("tasks").select("*"),
      supabase.from("activities").select("*"),
      supabase.from("fields").select("id, farm_id").order("id"),
    ]);

    const farmOfField = {};
    const first = {};
    (fl.data || []).forEach((f) => {
      farmOfField[f.id] = f.farm_id;
      if (!first[f.farm_id]) first[f.farm_id] = f.id;
    });
    setFirstField(first);

    const all = [
      ...(tk.data || []).map((r) => ({ src: "task", id: r.id, raw: r, title: r.task_name, date: r.due_date || "", notes: r.description, done: r.status === "Done", farmId: r.farm_id })),
      ...(ac.data || []).map((r) => ({ src: "act", id: r.id, raw: r, title: r.activity, date: r.activity_date || "", notes: r.notes, done: true, farmId: farmOfField[r.field_id] })),
    ];

    all.sort((a, b) => (a.done - b.done) || (a.done ? b.date.localeCompare(a.date) : (a.date || "9999").localeCompare(b.date || "9999")));
    setItems(all);
  }

  useEffect(() => {
    load();
    if (farms.length === 1) setForm((f) => (f.farm ? f : { ...f, farm: String(farms[0].id) }));
  }, [farms.length]);

  async function submit(e) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return alert(t("fillField") + " " + t("taskName"));

    const isDone = form.status === "done";
    const farmId = form.farm ? Number(form.farm) : null;

    setBusy(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const user = s.session ? s.session.user : null;
      if (!user) return;

      let error = null;

      if (editing && editing.src === "act") {
        ({ error } = await supabase.from("activities").update({ activity: name, activity_date: form.date || null, notes: form.notes.trim() || null }).eq("id", editing.id));
      } else if (editing) {
        ({ error } = await supabase.from("tasks").update({ farm_id: farmId, task_name: name, due_date: form.date || null, description: form.notes.trim() || null, status: isDone ? "Done" : "Pending" }).eq("id", editing.id));
      } else if (isDone) {
        if (!farmId) return alert(t("pickFarm"));
        const fieldId = firstField[farmId];
        if (!fieldId) return alert(t("noField"));
        ({ error } = await supabase.from("activities").insert({ user_id: user.id, field_id: fieldId, activity: name, activity_date: form.date || undefined, notes: form.notes.trim() || undefined }));
      } else {
        ({ error } = await supabase.from("tasks").insert({ user_id: user.id, farm_id: farmId || undefined, task_name: name, due_date: form.date || undefined, description: form.notes.trim() || undefined }));
      }

      if (error) return alert(error.message);

      setEditing(null);
      setForm(blank());
      await load();
      if (onChange) onChange();
    } finally {
      setBusy(false);
    }
  }

  function startEdit(it) {
    setForm({
      farm: it.farmId ? String(it.farmId) : "",
      name: it.title,
      date: it.date,
      notes: it.notes || "",
      status: it.done ? "done" : "todo",
    });
    setEditing({ src: it.src, id: it.id });
  }

  async function markDone(it) {
    const { error } = await supabase.from("tasks").update({ status: "Done" }).eq("id", it.id);
    if (error) return alert(error.message);
    await load();
    if (onChange) onChange();
  }

  async function remove(it) {
    if (!window.confirm(t("sure"))) return;
    const { error } = await supabase.from(it.src === "task" ? "tasks" : "activities").delete().eq("id", it.id);
    if (error) return alert(error.message);
    await load();
    if (onChange) onChange();
  }

  const shown = view === "pending" ? items.filter((i) => !i.done) : items;
  const editingAct = editing && editing.src === "act";

  return (
    <div style={{ background: "white", borderRadius: "15px", padding: "20px", marginBottom: "22px", boxShadow: "0 5px 20px rgba(0,0,0,0.07)" }}>
      <h3 style={{ margin: "0 0 12px", color: "#164c36" }}>{t("tasksTitle")}</h3>

      <form onSubmit={submit}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "10px" }}>
          <label style={{ fontSize: "12px", color: "#666" }}>
            {t("statusLbl")}
            <select style={inp} value={form.status} disabled={editingAct} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="todo">{t("statusTodo")}</option>
              <option value="done">{t("statusDone")}</option>
            </select>
          </label>

          <label style={{ fontSize: "12px", color: "#666" }}>
            {t("farmSel")}
            <select style={inp} value={form.farm} disabled={editingAct} onChange={(e) => setForm({ ...form, farm: e.target.value })}>
              <option value="">{t("noFarmOpt")}</option>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: "12px", color: "#666" }}>
            {t("taskName")}
            <input style={inp} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>

          <label style={{ fontSize: "12px", color: "#666" }}>
            {form.status === "todo" ? t("due") : t("date")}
            <input type="date" style={inp} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </label>

          <label style={{ fontSize: "12px", color: "#666" }}>
            {t("details")}
            <input style={inp} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </label>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
          {ACTS.filter((a) => a[0] !== "Other").map(([k, ic]) => (
            <button type="button" key={k} onClick={() => setForm({ ...form, name: k })} style={{ ...small, borderRadius: "999px", fontSize: "13px", border: "1px solid #176b3a", color: "#176b3a" }}>
              {ic} {t("a_" + k)}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
          <button type="submit" disabled={busy} style={{ background: "#176b3a", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>
            {editing ? t("saveChanges") : t("add")}
          </button>
          {editing && (
            <button type="button" style={{ ...small, padding: "10px 16px" }} onClick={() => { setEditing(null); setForm(blank()); }}>
              {t("cancel")}
            </button>
          )}
        </div>
      </form>

      <div style={{ marginTop: "14px" }}>
        {shown.length === 0 && <p style={{ color: "#666" }}>{t("none")}</p>}

        {shown.map((it) => (
          <div key={it.src + it.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap", borderTop: "1px solid #e4ebe6", padding: "10px 0" }}>
            <div>
              <div style={{ fontWeight: "600" }}>
                {it.done ? "✔" : "⏳"} {workLabel(it.title, t)}
              </div>
              <div style={{ fontSize: "13px", color: "#666" }}>
                {it.farmId && farmName(it.farmId) && (
                  <Link href={`/farms/${it.farmId}`} style={{ color: "#176b3a", fontWeight: "700", textDecoration: "none" }}>
                    🌱 {farmName(it.farmId)}
                  </Link>
                )}
                {[it.date, it.notes].filter(Boolean).length > 0 && (it.farmId ? " · " : "") + [it.date, it.notes].filter(Boolean).join(" · ")}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              {it.src === "task" && !it.done && (
                <button style={{ ...small, border: "1px solid #176b3a", color: "#176b3a" }} onClick={() => markDone(it)}>
                  {t("markDone")}
                </button>
              )}
              <button style={small} onClick={() => startEdit(it)}>✏ {t("edit")}</button>
              <button style={{ ...small, border: "1px solid #e05252", color: "#c62828" }} onClick={() => remove(it)}>{t("remove")}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
