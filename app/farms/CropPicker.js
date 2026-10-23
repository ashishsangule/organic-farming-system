"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CROP_GROUPS, cropLabel, baseName, KNOWN_BASES } from "@/lib/crops";

const chipStyle = (on) => ({
  padding: "8px 13px",
  borderRadius: "999px",
  border: "1px solid #176b3a",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px",
  background: on ? "#176b3a" : "white",
  color: on ? "white" : "#176b3a",
});

export default function CropPicker({ picked, setPicked, other, setOther, t }) {
  const [query, setQuery] = useState("");
  const [mine, setMine] = useState([]);

  // Crops this user has used before that are not in the standard list
  useEffect(() => {
    let alive = true;
    supabase
      .from("crops")
      .select("crop_name")
      .then(({ data }) => {
        if (!alive || !data) return;
        const seen = new Set();
        const list = [];
        data.forEach((r) => {
          const k = baseName(r.crop_name);
          if (k && !KNOWN_BASES.has(k) && !seen.has(k)) {
            seen.add(k);
            list.push(r.crop_name);
          }
        });
        setMine(list);
      });
    return () => {
      alive = false;
    };
  }, []);

  const toggle = (n) => setPicked(picked.includes(n) ? picked.filter((x) => x !== n) : [...picked, n]);
  const q = query.trim().toLowerCase();
  const hit = (...parts) => !q || parts.some((p) => String(p).toLowerCase().includes(q));

  const groups = CROP_GROUPS.map((g) => ({
    ...g,
    list: g.crops.filter((c) => hit(c[0], c[1])),
  })).filter((g) => g.list.length > 0);
  const mineShown = mine.filter((n) => hit(n));
  const nothing = groups.length === 0 && mineShown.length === 0;

  return (
    <div>
      <div style={{ fontSize: "14px", color: "#555", marginBottom: "8px", fontWeight: "600" }}>{t("pickCrops")}</div>

      {picked.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
          {picked.map((n) => (
            <button type="button" key={n} onClick={() => toggle(n)} style={{ ...chipStyle(true), padding: "6px 11px" }}>
              ✓ {n} ✕
            </button>
          ))}
        </div>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={"🔍 " + t("searchCrop")}
        style={{ width: "100%", boxSizing: "border-box", padding: "11px", border: "1px solid #d5ddd8", borderRadius: "8px", fontSize: "15px", marginBottom: "8px" }}
      />

      <div style={{ maxHeight: "280px", overflowY: "auto", border: "1px solid #e4ebe6", borderRadius: "10px", padding: "10px", background: "#fafdfb" }}>
        {mineShown.length > 0 && (
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontWeight: "800", color: "#164c36", fontSize: "13px", marginBottom: "6px" }}>⭐ {t("yourCrops")}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {mineShown.map((n) => (
                <button type="button" key={n} onClick={() => toggle(n)} style={chipStyle(picked.includes(n))}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {groups.map((g) => (
          <div key={g.id} style={{ marginBottom: "12px" }}>
            <div style={{ fontWeight: "800", color: "#164c36", fontSize: "13px", marginBottom: "6px" }}>
              {g.en} · {g.mr}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {g.list.map((c) => {
                const label = cropLabel(c);
                return (
                  <button type="button" key={label} onClick={() => toggle(label)} style={chipStyle(picked.includes(label))}>
                    {picked.includes(label) ? "✓ " : ""}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {nothing && <div style={{ color: "#666", fontSize: "14px" }}>{t("noCropMatch")}</div>}
      </div>

      <input
        value={other}
        onChange={(e) => setOther(e.target.value)}
        placeholder={t("otherCrop")}
        style={{ width: "100%", boxSizing: "border-box", marginTop: "10px", padding: "12px", border: "1px solid #d5ddd8", borderRadius: "8px", fontSize: "15px" }}
      />
    </div>
  );
}
