"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Chatbot({ t, lang }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const context = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, loading, open]);

  async function buildContext() {
    if (context.current !== null) return context.current;

    const { data: farms } = await supabase
      .from("farms")
      .select("farm_name, location, total_area, fields(crops(crop_name))");
    const { data: tasks } = await supabase
      .from("tasks")
      .select("task_name, due_date")
      .neq("status", "Done")
      .limit(10);

    const lines = (farms || []).map((f) => {
      const crops = (f.fields || []).flatMap((x) => (x.crops || []).map((c) => c.crop_name)).join(", ");
      return `Farm "${f.farm_name}" in ${f.location || "unknown place"}, ${f.total_area || 0} acres, crops: ${crops || "none"}`;
    });
    if (tasks && tasks.length) {
      lines.push("Pending tasks: " + tasks.map((k) => k.task_name + (k.due_date ? " (due " + k.due_date + ")" : "")).join("; "));
    }

    context.current = lines.join("\n");
    return context.current;
  }

  async function send(text) {
    const q = (text || input).trim();
    if (!q || loading) return;

    const next = [...msgs, { role: "user", content: q }];
    setMsgs(next);
    setInput("");
    setLoading(true);

    try {
      const { data: s } = await supabase.auth.getSession();
      const token = s.session ? s.session.access_token : "";
      const ctx = await buildContext();

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ messages: next, context: ctx, lang }),
      });

      if (res.status === 503) throw new Error("botNotReady");
      if (res.status === 429) throw new Error("botBusy");
      if (!res.ok) throw new Error("botError");

      const j = await res.json();
      setMsgs([...next, { role: "assistant", content: j.reply }]);
    } catch (e) {
      const key = ["botNotReady", "botBusy"].includes(e.message) ? e.message : "botError";
      setMsgs([...next, { role: "assistant", content: t(key), error: true }]);
    } finally {
      setLoading(false);
    }
  }

  const ideas = [t("botQ1"), t("botQ2"), t("botQ3")];

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label={t("botTitle")}
          style={{ position: "fixed", right: "18px", bottom: "18px", zIndex: 50, background: "#176b3a", color: "white", border: "none", borderRadius: "999px", padding: "14px 20px", fontSize: "16px", fontWeight: "800", cursor: "pointer", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}
        >
          💬 {t("botTitle")}
        </button>
      )}

      {open && (
        <div
          style={{ position: "fixed", right: "14px", bottom: "14px", zIndex: 50, width: "380px", maxWidth: "calc(100vw - 28px)", height: "min(620px, calc(100vh - 28px))", background: "white", borderRadius: "18px", boxShadow: "0 12px 40px rgba(0,0,0,0.35)", display: "flex", flexDirection: "column", overflow: "hidden" }}
        >
          <div style={{ background: "#164c36", color: "white", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
            <strong>🌿 {t("botTitle")}</strong>
            <div style={{ display: "flex", gap: "6px" }}>
              {msgs.length > 0 && (
                <button onClick={() => setMsgs([])} style={{ background: "transparent", color: "white", border: "1px solid white", borderRadius: "8px", padding: "4px 10px", cursor: "pointer", fontSize: "13px" }}>
                  {t("botClear")}
                </button>
              )}
              <button onClick={() => setOpen(false)} aria-label="Close" style={{ background: "transparent", color: "white", border: "none", fontSize: "22px", cursor: "pointer", lineHeight: 1 }}>
                ✕
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "14px", background: "#f4f8f5" }}>
            {msgs.length === 0 && (
              <div>
                <div style={{ background: "white", borderRadius: "12px", padding: "12px", marginBottom: "12px", color: "#14281d" }}>
                  {t("botHello")}
                </div>
                {ideas.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    style={{ display: "block", width: "100%", textAlign: "left", background: "white", border: "1px solid #176b3a", color: "#176b3a", borderRadius: "10px", padding: "10px 12px", marginBottom: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: "10px" }}>
                <div
                  style={{ maxWidth: "86%", whiteSpace: "pre-wrap", wordBreak: "break-word", padding: "10px 12px", borderRadius: "14px", fontSize: "15px", lineHeight: 1.45, background: m.role === "user" ? "#176b3a" : m.error ? "#fdecea" : "white", color: m.role === "user" ? "white" : m.error ? "#a1271c" : "#14281d" }}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && <div style={{ color: "#666", fontSize: "14px" }}>⏳ {t("botThinking")}</div>}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            style={{ display: "flex", gap: "8px", padding: "10px", borderTop: "1px solid #e4ebe6" }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("botPh")}
              maxLength={1000}
              style={{ flex: 1, padding: "11px", border: "1px solid #d5ddd8", borderRadius: "10px", fontSize: "15px", minWidth: 0 }}
            />
            <button type="submit" disabled={loading} style={{ background: "#176b3a", color: "white", border: "none", borderRadius: "10px", padding: "0 16px", fontWeight: "700", cursor: "pointer" }}>
              {t("botSend")}
            </button>
          </form>

          <div style={{ fontSize: "11px", color: "#777", padding: "0 12px 8px" }}>{t("botNote")}</div>
        </div>
      )}
    </>
  );
}
