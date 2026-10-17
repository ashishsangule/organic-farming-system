"use client";

import { useEffect, useState } from "react";

const icon = (c) =>
  c === 0 ? "☀️" : c <= 2 ? "🌤️" : c === 3 ? "☁️" : c <= 48 ? "🌫️" : c <= 57 ? "🌦️" : c <= 67 ? "🌧️" : c <= 77 ? "❄️" : c <= 82 ? "🌧️" : "⛈️";

async function findPlace(raw) {
  const name = raw.split(",")[0].trim();
  const key = "geo:" + name.toLowerCase();

  try {
    const cached = sessionStorage.getItem(key);
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  for (const extra of ["&countryCode=IN", ""]) {
    const r = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json${extra}`
    );
    const j = await r.json();
    const p = j.results && j.results[0];
    if (p) {
      const v = { lat: p.latitude, lon: p.longitude };
      try {
        sessionStorage.setItem(key, JSON.stringify(v));
      } catch (e) {}
      return v;
    }
  }
  return null;
}

export default function Weather({ place, t, lang, compact }) {
  const [state, setState] = useState({ status: "loading" });
  const name = (place || "").trim();
  const valid = name !== "" && name !== "-";

  useEffect(() => {
    if (!valid) return;
    let alive = true;

    async function run() {
      try {
        setState({ status: "loading" });
        const p = await findPlace(name);
        if (!p) return alive && setState({ status: "nf" });

        const r = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}` +
            `&current=temperature_2m,weather_code` +
            `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max` +
            `&timezone=auto&forecast_days=5`
        );
        const j = await r.json();
        if (!j.daily) return alive && setState({ status: "nf" });
        if (alive) setState({ status: "ok", data: j });
      } catch (e) {
        if (alive) setState({ status: "err" });
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [name]);

  if (!valid) return null;

  const box = {
    marginTop: "12px",
    background: "#f4f8f5",
    border: "1px solid #d5ddd8",
    borderRadius: "10px",
    padding: compact ? "10px 12px" : "16px",
    fontSize: "14px",
  };

  if (state.status === "loading") return <div style={box}>🌦️ {t("wxLoading")}</div>;
  if (state.status !== "ok") return <div style={box}>🌦️ {t("wxNotFound")}</div>;

  const d = state.data.daily;
  const now = state.data.current || {};
  const alerts = [];

  [0, 1].forEach((i) => {
    const when = i === 0 ? t("today") : t("tomorrow");
    const prob = d.precipitation_probability_max ? d.precipitation_probability_max[i] : 0;
    const mm = d.precipitation_sum[i] || 0;
    const wind = d.wind_speed_10m_max ? d.wind_speed_10m_max[i] : 0;
    const hot = d.temperature_2m_max[i];

    if (prob >= 60 || mm >= 3) {
      alerts.push("🌧️ " + t("alertRain").replace("{when}", when).replace("{p}", Math.round(prob)));
    }
    if (wind >= 25) {
      alerts.push("💨 " + t("alertWind").replace("{when}", when).replace("{w}", Math.round(wind)));
    }
    if (hot >= 38) {
      alerts.push("🌡️ " + t("alertHeat").replace("{when}", when).replace("{c}", Math.round(hot)));
    }
  });

  const temp = now.temperature_2m != null ? `${Math.round(now.temperature_2m)}°C` : "";

  if (compact) {
    return (
      <div style={{ ...box, background: alerts.length ? "#fbeccb" : "#f4f8f5" }}>
        {icon(now.weather_code ?? d.weather_code[0])} {temp}
        {" · "}
        {alerts.length ? alerts[0] : "✅ " + t("wxGood")}
      </div>
    );
  }

  const locale = lang === "mr" ? "mr-IN" : "en-IN";

  return (
    <div style={{ ...box, marginBottom: "20px" }}>
      <div style={{ fontWeight: "800", color: "#164c36", fontSize: "16px", marginBottom: "10px" }}>
        {icon(now.weather_code ?? d.weather_code[0])} {t("weatherTitle")} {temp && "· " + temp}
      </div>

      {alerts.length === 0 && (
        <div style={{ background: "#e5f7eb", color: "#176b3a", borderRadius: "8px", padding: "9px 12px", marginBottom: "10px" }}>
          ✅ {t("wxGood")}
        </div>
      )}
      {alerts.map((a) => (
        <div key={a} style={{ background: "#fbeccb", color: "#6b4600", borderRadius: "8px", padding: "9px 12px", marginBottom: "8px", fontWeight: "600" }}>
          {a}
        </div>
      ))}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "8px" }}>
        {d.time.map((day, i) => (
          <div key={day} style={{ background: "white", borderRadius: "10px", padding: "10px", textAlign: "center" }}>
            <div style={{ fontWeight: "700", fontSize: "13px" }}>
              {new Date(day + "T00:00:00").toLocaleDateString(locale, { weekday: "short", day: "numeric" })}
            </div>
            <div style={{ fontSize: "26px" }}>{icon(d.weather_code[i])}</div>
            <div style={{ fontWeight: "700" }}>
              {Math.round(d.temperature_2m_max[i])}° / {Math.round(d.temperature_2m_min[i])}°
            </div>
            <div style={{ fontSize: "12px", color: "#555" }}>
              🌧 {d.precipitation_sum[i] ?? 0} mm
              {d.precipitation_probability_max ? ` · ${d.precipitation_probability_max[i]}%` : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
