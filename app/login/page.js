"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useLang, LangToggle } from "@/lib/ui";

const COOLDOWN = 60;

export default function LoginPage({ mode = "login" }) {
  const isRegister = mode === "register";
  const router = useRouter();
  const { lang, setLang, t } = useLang();

  const [step, setStep] = useState("email"); // "email" or "code"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [wait, setWait] = useState(0);

  // Countdown before the code can be requested again
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
    if (m.includes("signups not allowed") || m.includes("not found")) return t("noAccount");
    if (m.includes("expired") || m.includes("invalid")) return t("badCode");
    return err.message || t("genericErr");
  }

  async function sendCode(e) {
    if (e) e.preventDefault();
    setError("");
    setMessage("");

    const mail = email.trim().toLowerCase();
    if (!mail) return setError(t("enterEmail"));
    if (isRegister && !name.trim()) return setError(t("enterName"));
    if (wait > 0) return;

    try {
      setLoading(true);

      const { error: err } = await supabase.auth.signInWithOtp({
        email: mail,
        options: {
          shouldCreateUser: isRegister,
          ...(isRegister ? { data: { full_name: name.trim() } } : {}),
        },
      });

      if (err) throw err;

      setEmail(mail);
      setStep("code");
      setCode("");
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

      const { error: err } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });

      if (err) throw err;

      router.replace("/farms");
    } catch (err) {
      setError(friendly(err));
      setLoading(false);
    }
  }

  return (
    <main className="register-page">
      <div className="register-card">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
          <div style={{ background: "#164c36", padding: "6px", borderRadius: "10px" }}>
            <LangToggle lang={lang} setLang={setLang} />
          </div>
        </div>

        <div className="register-heading">
          <div className="register-logo">🌱</div>
          <h1>{isRegister ? t("createTitle") : t("loginTitle")}</h1>
          <p>{isRegister ? t("subRegister") : t("subLogin")}</p>
        </div>

        {step === "email" && (
          <form onSubmit={sendCode}>
            {isRegister && (
              <div className="register-field">
                <label htmlFor="name">{t("fullName")}</label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("fullNamePh")}
                  className="register-input"
                  required
                />
              </div>
            )}

            <div className="register-field">
              <label htmlFor="email">{t("email")}</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="register-input"
                required
              />
            </div>

            {error && (
              <div className="register-alert register-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="register-submit" disabled={loading}>
              {t("sendCode")}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={verify}>
            {message && (
              <div className="register-alert register-success" role="status">
                {message}
              </div>
            )}

            <div className="register-field">
              <label htmlFor="otp">
                {t("otpLabel")} ({email})
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={10}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="123456"
                className="register-input"
                style={{ letterSpacing: "6px", textAlign: "center", fontSize: "22px" }}
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="register-alert register-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="register-submit" disabled={loading}>
              {t("verify")}
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "14px", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => sendCode()}
                disabled={wait > 0 || loading}
                style={{ background: "none", border: "none", color: "#176b3a", fontWeight: "700", cursor: wait > 0 ? "default" : "pointer", opacity: wait > 0 ? 0.6 : 1 }}
              >
                {wait > 0 ? t("resendIn").replace("{s}", wait) : t("resend")}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setError("");
                  setMessage("");
                }}
                style={{ background: "none", border: "none", color: "#176b3a", fontWeight: "700", cursor: "pointer" }}
              >
                {t("changeEmail")}
              </button>
            </div>
          </form>
        )}

        <div className="register-footer">
          {isRegister ? (
            <>
              {t("haveAcc")} <Link href="/login">{t("signIn")}</Link>
            </>
          ) : (
            <>
              {t("newHere")} <Link href="/register">{t("createAcc")}</Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
