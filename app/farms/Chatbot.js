"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

const css = `
@keyframes cbPulse{0%{box-shadow:0 0 0 0 rgba(23,107,58,.5)}70%{box-shadow:0 0 0 16px rgba(23,107,58,0)}100%{box-shadow:0 0 0 0 rgba(23,107,58,0)}}
@keyframes cbRec{0%{box-shadow:0 0 0 0 rgba(198,40,40,.55)}70%{box-shadow:0 0 0 14px rgba(198,40,40,0)}100%{box-shadow:0 0 0 0 rgba(198,40,40,0)}}
@keyframes cbDot{0%,80%,100%{transform:scale(.6);opacity:.4}40%{transform:scale(1);opacity:1}}
@keyframes cbIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes cbPop{from{opacity:0;transform:translateY(20px) scale(.96)}to{opacity:1;transform:none}}
.cb-fab{position:fixed;right:18px;bottom:18px;z-index:50;display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,#1b6b4a,#0f3d2e);color:#fff;border:0;border-radius:999px;padding:10px 20px 10px 10px;font-size:16px;font-weight:800;cursor:pointer;box-shadow:0 10px 28px rgba(15,61,46,.45);animation:cbPulse 2.4s infinite}
.cb-av{flex:0 0 auto;width:38px;height:38px;border-radius:50%;background:#8bd450;display:flex;align-items:center;justify-content:center;font-size:20px}
.cb-panel{position:fixed;right:16px;bottom:16px;z-index:60;width:400px;max-width:calc(100vw - 24px);height:min(680px,calc(100dvh - 32px));background:#fff;border-radius:22px;box-shadow:0 20px 60px rgba(0,0,0,.4);display:flex;flex-direction:column;overflow:hidden;animation:cbPop .22s ease-out;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
@media(max-width:600px){.cb-panel{inset:0;width:100%;max-width:100%;height:100dvh;border-radius:0}.cb-fab .lbl{display:none}.cb-fab{padding:10px}}
.cb-head{background:linear-gradient(135deg,#0f3d2e,#1b6b4a);color:#fff;padding:12px 14px;display:flex;align-items:center;gap:10px}
.cb-head .tt{flex:1;min-width:0}
.cb-head .tt b{display:block;font-size:16px}
.cb-head .tt small{opacity:.85;font-size:12px}
.cb-ib{background:rgba(255,255,255,.15);color:#fff;border:0;border-radius:10px;min-width:36px;height:36px;font-size:17px;cursor:pointer;padding:0 8px}
.cb-body{flex:1;overflow-y:auto;padding:14px;background:#eaf3ec}
.cb-row{display:flex;gap:8px;margin-bottom:12px;animation:cbIn .2s ease-out}
.cb-row.me{justify-content:flex-end}
.cb-bub{max-width:82%;white-space:pre-wrap;word-break:break-word;padding:10px 13px;font-size:15px;line-height:1.5;border-radius:16px;box-shadow:0 1px 2px rgba(0,0,0,.08)}
.cb-bub.bot{background:#fff;color:#14281d;border-top-left-radius:4px}
.cb-bub.me{background:linear-gradient(135deg,#1b6b4a,#176b3a);color:#fff;border-top-right-radius:4px}
.cb-bub.err{background:#fdecea;color:#a1271c}
.cb-sm{flex:0 0 auto;width:30px;height:30px;border-radius:50%;background:#176b3a;display:flex;align-items:center;justify-content:center;font-size:15px}
.cb-hello{background:#fff;border-radius:16px;padding:14px;margin-bottom:12px;color:#14281d;line-height:1.5;box-shadow:0 1px 2px rgba(0,0,0,.08)}
.cb-chip{display:block;width:100%;text-align:left;background:#fff;border:1.5px solid #176b3a;color:#176b3a;border-radius:12px;padding:11px 13px;margin-bottom:8px;cursor:pointer;font-size:14px;font-weight:600}
.cb-chip:hover{background:#e5f7eb}
.cb-dots{display:inline-flex;gap:5px;padding:12px 14px}
.cb-dots i{width:8px;height:8px;border-radius:50%;background:#176b3a;animation:cbDot 1.2s infinite}
.cb-dots i:nth-child(2){animation-delay:.2s}.cb-dots i:nth-child(3){animation-delay:.4s}
.cb-listen{background:#fdecea;color:#a1271c;padding:8px 14px;font-size:14px;font-weight:700;display:flex;align-items:center;gap:8px}
.cb-bar{display:flex;gap:8px;align-items:center;padding:10px;border-top:1px solid #dfe8e1;background:#fff}
.cb-in{flex:1;min-width:0;padding:12px 14px;border:1.5px solid #cfdac9;border-radius:999px;font-size:15px;background:#f7fbf8}
.cb-in:focus{outline:2px solid #8bd450;border-color:#176b3a}
.cb-circle{flex:0 0 auto;width:46px;height:46px;border-radius:50%;border:0;color:#fff;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.cb-mic{background:#176b3a}
.cb-mic.on{background:#c62828;animation:cbRec 1.4s infinite}
.cb-send{background:#0f3d2e}
.cb-send:disabled{opacity:.5}
.cb-note{font-size:11px;color:#777;padding:0 14px 8px;background:#fff}
`;

export default function Chatbot({ t, lang }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakOn, setSpeakOn] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [canTalk, setCanTalk] = useState(false);
  const context = useRef(null);
  const endRef = useRef(null);
  const recRef = useRef(null);
  const finalRef = useRef("");

  useEffect(() => {
    setCanTalk(!!(window.SpeechRecognition || window.webkitSpeechRecognition));
    return () => {
      try {
        window.speechSynthesis && window.speechSynthesis.cancel();
        recRef.current && recRef.current.abort();
      } catch (e) {}
    };
  }, []);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, loading, open]);

  /* ---------- voice ---------- */
  function stopSpeaking() {
    try {
      window.speechSynthesis && window.speechSynthesis.cancel();
    } catch (e) {}
    setSpeaking(false);
  }

  function speakText(text) {
    if (!("speechSynthesis" in window)) return;
    stopSpeaking();

    const clean = text.replace(/[*#_`]/g, "").replace(/^\s*-\s+/gm, "").trim();
    const u = new SpeechSynthesisUtterance(clean);
    const voices = window.speechSynthesis.getVoices();
    const want = lang === "mr" ? ["mr", "hi", "en-in"] : ["en-in", "en"];
    let voice = null;
    for (const w of want) {
      voice = voices.find((v) => v.lang.toLowerCase().startsWith(w));
      if (voice) break;
    }
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    } else {
      u.lang = lang === "mr" ? "mr-IN" : "en-IN";
    }
    u.rate = 0.95;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert(t("botNoVoice"));

    stopSpeaking();
    const rec = new SR();
    rec.lang = lang === "mr" ? "mr-IN" : "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    finalRef.current = "";

    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      finalRef.current = text;
      setInput(text);
    };
    rec.onerror = (e) => {
      setListening(false);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") alert(t("botMicDenied"));
    };
    rec.onend = () => {
      setListening(false);
      const text = finalRef.current.trim();
      finalRef.current = "";
      if (text) send(text, true);
    };

    recRef.current = rec;
    setInput("");
    setListening(true);
    try {
      rec.start();
    } catch (e) {
      setListening(false);
    }
  }

  function stopListening() {
    try {
      recRef.current && recRef.current.stop();
    } catch (e) {}
  }

  /* ---------- chat ---------- */
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

  async function send(text, viaVoice) {
    const q = (text !== undefined ? text : input).trim();
    if (!q || loading) return;

    stopSpeaking();
    const next = [...msgs, { role: "user", content: q }];
    setMsgs(next);
    setInput("");
    setLoading(true);

    try {
      const { data: s } = await supabase.auth.getSession();
      const token = s.session ? s.session.access_token : "";
      const ctx = await buildContext();

      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 50000);
      const res = await fetch("/api/chat", {
        signal: ctrl.signal,
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          messages: next.filter((m) => !m.error).map((m) => ({ role: m.role, content: m.content })),
          context: ctx,
          lang,
          voice: !!viaVoice,
        }),
      });

      clearTimeout(timer);
      if (res.status === 503) throw new Error("botNotReady");
      if (res.status === 429) throw new Error("botBusy");
      if (!res.ok) {
        const info = await res.json().catch(() => ({}));
        const err = new Error("botError");
        err.detail = info.detail || "";
        throw err;
      }

      const j = await res.json();
      setMsgs([...next, { role: "assistant", content: j.reply }]);
      if (viaVoice || speakOn) speakText(j.reply);
    } catch (e) {
      const key = ["botNotReady", "botBusy"].includes(e.message) ? e.message : "botError";
      const text =
        e.name === "AbortError" ? t("botTimeout") : t(key) + (e.detail ? "\n\n(" + e.detail + ")" : "");
      setMsgs([...next, { role: "assistant", content: text, error: true }]);
    } finally {
      setLoading(false);
    }
  }

  function closeChat() {
    stopSpeaking();
    stopListening();
    setOpen(false);
  }

  const ideas = [t("botQ1"), t("botQ2"), t("botQ3")];

  return (
    <>
      <style>{css}</style>

      {!open && (
        <button className="cb-fab" onClick={() => setOpen(true)} aria-label={t("botTitle")}>
          <span className="cb-av">🌿</span>
          <span className="lbl">{t("botTitle")}</span>
        </button>
      )}

      {open && (
        <div className="cb-panel" role="dialog" aria-label={t("botTitle")}>
          <div className="cb-head">
            <span className="cb-av">🌿</span>
            <div className="tt">
              <b>{t("botTitle")}</b>
              <small>🟢 {t("botOnline")}</small>
            </div>
            {speaking && (
              <button className="cb-ib" onClick={stopSpeaking} title={t("botStop")}>
                ⏹
              </button>
            )}
            <button
              className="cb-ib"
              onClick={() => {
                if (speakOn) stopSpeaking();
                setSpeakOn(!speakOn);
              }}
              title={speakOn ? t("botSpeakOn") : t("botSpeakOff")}
              aria-label={speakOn ? t("botSpeakOn") : t("botSpeakOff")}
            >
              {speakOn ? "🔊" : "🔇"}
            </button>
            {msgs.length > 0 && (
              <button className="cb-ib" onClick={() => { stopSpeaking(); setMsgs([]); }} title={t("botClear")}>
                ↺
              </button>
            )}
            <button className="cb-ib" onClick={closeChat} aria-label="Close">
              ✕
            </button>
          </div>

          <div className="cb-body">
            {msgs.length === 0 && (
              <div>
                <div className="cb-hello">
                  👋 {t("botHello")}
                  {canTalk && <div style={{ marginTop: "8px", color: "#176b3a", fontWeight: "700" }}>🎤 {t("botTapMic")}</div>}
                </div>
                {ideas.map((q) => (
                  <button key={q} className="cb-chip" onClick={() => send(q)}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            {msgs.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="cb-row me">
                  <div className="cb-bub me">{m.content}</div>
                </div>
              ) : (
                <div key={i} className="cb-row">
                  <span className="cb-sm">🌿</span>
                  <div className={"cb-bub bot" + (m.error ? " err" : "")}>
                    {m.content}
                    {!m.error && (
                      <div style={{ marginTop: "6px" }}>
                        <button
                          onClick={() => speakText(m.content)}
                          style={{ background: "none", border: "none", color: "#176b3a", cursor: "pointer", fontSize: "13px", fontWeight: "700", padding: 0 }}
                        >
                          🔊 {t("botListen")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {loading && (
              <div className="cb-row">
                <span className="cb-sm">🌿</span>
                <div className="cb-bub bot" style={{ padding: 0 }}>
                  <span className="cb-dots"><i /><i /><i /></span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {listening && <div className="cb-listen">🎤 {t("botListening")}</div>}

          <form
            className="cb-bar"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            {canTalk && (
              <button
                type="button"
                className={"cb-circle cb-mic" + (listening ? " on" : "")}
                onClick={listening ? stopListening : startListening}
                aria-label={t("botTapMic")}
              >
                {listening ? "⏹" : "🎤"}
              </button>
            )}
            <input
              className="cb-in"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("botPh")}
              maxLength={1000}
            />
            <button type="submit" className="cb-circle cb-send" disabled={loading || !input.trim()} aria-label={t("botSend")}>
              ➤
            </button>
          </form>

          <div className="cb-note">{t("botNote")}</div>
        </div>
      )}
    </>
  );
}
