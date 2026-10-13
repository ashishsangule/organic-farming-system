"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useLang, LangToggle } from "@/lib/ui";

const COOLDOWN = 60;

const css = `
.au-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:linear-gradient(135deg,#0f3d2e,#1b6b4a);font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
.au-card{width:100%;max-width:440px;background:#fff;border-radius:22px;padding:26px;box-shadow:0 20px 60px rgba(0,0,0,.28)}
.au-top{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:18px}
.au-home{color:#176b3a;font-weight:700;text-decoration:none}
@media(max-width:768px){.au-home{visibility:hidden}}
.au-lang{background:#164c36;padding:5px;border-radius:10px}
.au-tabs{display:grid;grid-template-columns:1fr 1fr;background:#eef3ea;border-radius:12px;padding:5px;margin-bottom:22px}
.au-tab{text-align:center;padding:13px 8px;border-radius:9px;font-weight:800;font-size:17px;text-decoration:none;color:#4f6356}
.au-tab.on{background:#176b3a;color:#fff}
.au-h{text-align:center;margin:0 0 6px;font-size:25px;color:#14392a}
.au-sub{text-align:center;margin:0 0 8px;color:#5d6b57;font-size:15px;line-height:1.5}
.au-row{display:flex;justify-content:space-between;align-items:center;margin:16px 0 6px}
.au-label{display:block;font-weight:700;color:#14281d;font-size:15px}
.au-input{width:100%;box-sizing:border-box;padding:14px;font-size:17px;border:1.5px solid #cfdac9;border-radius:10px;background:#fafdf9;color:#14281d}
.au-input:focus{outline:3px solid #8bd450;border-color:#176b3a}
.au-btn{width:100%;margin-top:22px;padding:15px;border:0;border-radius:12px;background:#176b3a;color:#fff;font-size:18px;font-weight:800;cursor:pointer}
.au-btn:disabled{opacity:.6;cursor:default}
.au-link{background:none;border:0;color:#176b3a;font-weight:700;cursor:pointer;font-size:15px;padding:4px}
.au-err{margin-top:14px;padding:11px 12px;border-radius:10px;background:#fdecea;color:#a1271c;font-size:14px}
.au-ok{margin-top:14px;padding:11px 12px;border-radius:10px;background:#e5f7eb;color:#176b3a;font-size:14px}
`;

export default function LoginPage({ mode = "login" }) {
  const router = useRouter();
  const { lang, setLang, t } = useLang();

  const [flow, setFlow] = useState(mode); // "register" | "login" | "reset"
  const [step, setStep] = useState("form"); // "form" | "code" | "newpass"
  const [codeType, setCodeType] = useState("signup"); // "signup" | "email"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [wait, setWait] = useState(0);
  const [hint, setHint] = useState(false);

  const isRegister = flow === "register";
  const isReset = flow === "reset";

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  // Already signed in: go straight to the farms page
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/farms");
    });
  }, []);

  function friendly(err) {
    const m = (err.message || "").toLowerCase();
    if (err.status === 429 || m.includes("rate limit") || m.includes("too many") || m.includes("security purposes")) {
      return t("rateLimit");
    }
    if (m.includes("invalid login")) return t("wrongCreds");
    if (m.includes("signups not allowed") || m.includes("not found")) return t("noAccount");
    if (m.includes("password should be")) return t("shortPw");
    if (m.includes("expired") || m.includes("invalid")) return t("badCode");
    return err.message || t("genericErr");
  }

  function toCodeStep(type, msg) {
    setCodeType(type);
    setStep("code");
    setCode("");
    setWait(COOLDOWN);
    setMessage(msg);
  }

  async function submitForm(e) {
    e.preventDefault();
    setHint(false);
    setError("");
    setMessage("");

    const mail = email.trim().toLowerCase();
    if (!mail) return setError(t("enterEmail"));
    if (isRegister && !name.trim()) return setError(t("enterName"));
    if (!isReset && !password) return setError(t("enterPw"));
    if (isRegister && password.length < 6) return setError(t("shortPw"));

    try {
      setLoading(true);
      setEmail(mail);

      if (isRegister) {
        const { data, error: err } = await supabase.auth.signUp({
          email: mail,
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (err) throw err;

        if (data.session) {
          router.replace("/farms");
          return;
        }
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setError(t("haveAccount"));
          return;
        }
        toCodeStep("signup", t("codeSent"));
      } else if (isReset) {
        const { error: err } = await supabase.auth.signInWithOtp({
          email: mail,
          options: { shouldCreateUser: false },
        });
        if (err) throw err;
        toCodeStep("email", t("codeSent"));
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email: mail, password });

        if (err) {
          if ((err.message || "").toLowerCase().includes("not confirmed")) {
            await supabase.auth.resend({ type: "signup", email: mail });
            toCodeStep("signup", t("needVerify"));
            return;
          }
          throw err;
        }
        router.replace("/farms");
        return;
      }
    } catch (err) {
      setError(friendly(err));
      if (flow === "login" && (err.message || "").toLowerCase().includes("invalid login")) {
        setHint(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (wait > 0) return;
    setError("");
    try {
      setLoading(true);
      if (codeType === "signup") {
        const { error: err } = await supabase.auth.resend({ type: "signup", email });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false },
        });
        if (err) throw err;
      }
      setWait(COOLDOWN);
      setMessage(t("codeSent"));
    } catch (err) {
      setError(friendly(err));
    } finally {
      setLoading(false);
    }
  }

  async function verify(e) {
    e.preventDefault();
    setError("");

    const token = code.replace(/\s/g, "");
    if (token.length < 6) return setError(t("enterCode"));

    try {
      setLoading(true);
      const { error: err } = await supabase.auth.verifyOtp({ email, token, type: codeType });
      if (err) throw err;

      if (isReset) {
        setStep("newpass");
        setPassword("");
        setLoading(false);
        return;
      }
      router.replace("/farms");
    } catch (err) {
      setError(friendly(err));
      setLoading(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError(t("shortPw"));

    try {
      setLoading(true);
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      router.replace("/farms");
    } catch (err) {
      setError(friendly(err));
      setLoading(false);
    }
  }

  const title = isReset ? t("resetTitle") : isRegister ? t("createTitle") : t("loginTitle");
  const sub = isReset ? t("resetSub") : isRegister ? t("subRegister") : t("subLogin");

  const passwordField = (
    <>
      <div className="au-row">
        <label className="au-label" htmlFor="password">
          {t("password")}
        </label>
        <button type="button" className="au-link" onClick={() => setShowPw(!showPw)}>
          {showPw ? t("hide") : t("show")}
        </button>
      </div>
      <input
        id="password"
        type={showPw ? "text" : "password"}
        autoComplete={isRegister || step === "newpass" ? "new-password" : "current-password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t("passwordPh")}
        className="au-input"
        required
      />
    </>
  );

  const errorBox = error && (
    <div className="au-err" role="alert">
      {error}
    </div>
  );

  return (
    <main className="au-wrap">
      <style>{css}</style>

      <div className="au-card">
        <div className="au-top">
          <Link href="/" className="au-home">
            {t("backHome")}
          </Link>
          <div className="au-lang">
            <LangToggle lang={lang} setLang={setLang} />
          </div>
        </div>

        {isReset ? (
          <button
            type="button"
            className="au-link"
            style={{ marginBottom: "14px" }}
            onClick={() => {
              setFlow("login");
              setStep("form");
              setError("");
              setMessage("");
            }}
          >
            {t("backLogin")}
          </button>
        ) : (
          <div className="au-tabs">
            <Link href="/login" className={"au-tab" + (isRegister ? "" : " on")}>
              {t("tabLogin")}
            </Link>
            <Link href="/register" className={"au-tab" + (isRegister ? " on" : "")}>
              {t("tabCreate")}
            </Link>
          </div>
        )}

        <h1 className="au-h">{title}</h1>
        <p className="au-sub">{sub}</p>

        {step === "form" && (
          <form onSubmit={submitForm}>
            {isRegister && (
              <>
                <div className="au-row">
                  <label className="au-label" htmlFor="name">
                    {t("fullName")}
                  </label>
                </div>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("fullNamePh")}
                  className="au-input"
                  required
                />
              </>
            )}

            <div className="au-row">
              <label className="au-label" htmlFor="email">
                {t("email")}
              </label>
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="au-input"
              required
            />

            {!isReset && passwordField}

            {flow === "login" && (
              <div style={{ textAlign: "right", marginTop: "8px" }}>
                <button
                  type="button"
                  className="au-link"
                  onClick={() => {
                    setFlow("reset");
                    setError("");
                  }}
                >
                  {t("forgot")}
                </button>
              </div>
            )}

            {errorBox}

            {hint && flow === "login" && (
              <div className="au-ok" style={{ background: "#fbeccb", color: "#6b4600" }}>
                {t("oldHint")}
                <div style={{ marginTop: "6px" }}>
                  <button
                    type="button"
                    className="au-link"
                    onClick={() => {
                      setFlow("reset");
                      setHint(false);
                      setError("");
                    }}
                  >
                    {t("setPwBtn")}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" className="au-btn" disabled={loading}>
              {loading ? t("wait") : isReset ? t("sendCode") : isRegister ? t("createBtn") : t("loginBtn")}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={verify}>
            {message && (
              <div className="au-ok" role="status">
                {message}
              </div>
            )}

            <div className="au-row">
              <label className="au-label" htmlFor="otp">
                {t("otpLabel")} ({email})
              </label>
            </div>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={10}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="••••••"
              className="au-input"
              style={{ letterSpacing: "6px", textAlign: "center", fontSize: "24px" }}
              autoFocus
              required
            />

            {errorBox}

            <button type="submit" className="au-btn" disabled={loading}>
              {loading ? t("wait") : t("verify")}
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "14px", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="au-link"
                onClick={resend}
                disabled={wait > 0 || loading}
                style={{ opacity: wait > 0 ? 0.6 : 1 }}
              >
                {wait > 0 ? t("resendIn").replace("{s}", wait) : t("resend")}
              </button>

              <button
                type="button"
                className="au-link"
                onClick={() => {
                  setStep("form");
                  setError("");
                  setMessage("");
                }}
              >
                {t("changeEmail")}
              </button>
            </div>
          </form>
        )}

        {step === "newpass" && (
          <form onSubmit={savePassword}>
            <p className="au-sub" style={{ marginTop: "14px", fontWeight: "700" }}>
              {t("newPassword")}
            </p>
            {passwordField}
            {errorBox}
            <button type="submit" className="au-btn" disabled={loading}>
              {loading ? t("wait") : t("savePassword")}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
