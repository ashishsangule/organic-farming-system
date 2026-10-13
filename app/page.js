"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useLang, LangToggle } from "@/lib/ui";

const css = `
@media(max-width:768px){.lp{display:none}}
.lp{font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#14281d;background:#f4f8f5;min-height:100vh}
.lp a{text-decoration:none}
.lp-nav{position:sticky;top:0;z-index:10;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 24px;background:#0f3d2e;color:#fff}
.lp-logo{font-size:20px;font-weight:800;color:#fff}
.lp-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.lp-btn{display:inline-block;padding:11px 20px;border-radius:10px;font-weight:700;font-size:16px;cursor:pointer;border:2px solid #fff;color:#fff;background:transparent}
.lp-btn.solid{background:#8bd450;border-color:#8bd450;color:#0f3d2e}
.lp-hero{background:linear-gradient(135deg,#0f3d2e,#1b6b4a);color:#fff;text-align:center;padding:72px 22px 84px}
.lp-hero h1{font-size:clamp(34px,6vw,58px);line-height:1.12;margin:0 0 16px;font-weight:800}
.lp-hero p{max-width:640px;margin:0 auto 30px;font-size:19px;line-height:1.6;color:#d6eadf}
.lp-cta{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.lp-cta .lp-btn{padding:16px 34px;font-size:19px;border-radius:12px}
.lp-note{margin-top:18px;font-size:14px;color:#b8d8c6}
.lp-sec{max-width:1000px;margin:0 auto;padding:56px 22px}
.lp-sec h2{text-align:center;font-size:clamp(26px,4vw,34px);margin:0 0 28px;color:#164c36}
.lp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}
.lp-card{background:#fff;border-radius:16px;padding:22px;box-shadow:0 6px 22px rgba(0,0,0,.07)}
.lp-card .ic{font-size:34px}
.lp-card h3{margin:10px 0 6px;color:#164c36;font-size:19px}
.lp-card p{margin:0;color:#4f6356;line-height:1.55;font-size:15px}
.lp-step{display:flex;gap:14px;align-items:flex-start;background:#fff;border-radius:16px;padding:20px;box-shadow:0 6px 22px rgba(0,0,0,.07)}
.lp-num{flex:0 0 40px;height:40px;border-radius:50%;background:#176b3a;color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center}
.lp-step h3{margin:0 0 4px;color:#164c36;font-size:18px}
.lp-step p{margin:0;color:#4f6356;font-size:15px;line-height:1.5}
.lp-band{background:#e5f7eb;text-align:center;padding:52px 22px}
.lp-band h2{margin:0 0 22px;color:#164c36;font-size:clamp(24px,4vw,32px)}
.lp-band .lp-btn{border-color:#176b3a;color:#176b3a}
.lp-band .lp-btn.solid{background:#176b3a;color:#fff}
.lp-foot{background:#0f3d2e;color:#b8d8c6;text-align:center;padding:22px;font-size:14px}
`;

export default function HomePage() {
  const { lang, setLang, t } = useLang();
  const router = useRouter();

  // On phones, skip the landing page: go to farms if signed in, otherwise to login
  useEffect(() => {
    if (!window.matchMedia("(max-width: 768px)").matches) return;
    supabase.auth
      .getSession()
      .then(({ data }) => router.replace(data.session ? "/farms" : "/login"))
      .catch(() => router.replace("/login"));
  }, []);
  const features = [
    ["🌾", "f1t", "f1d"],
    ["📋", "f2t", "f2d"],
    ["✅", "f3t", "f3d"],
    ["🌿", "f4t", "f4d"],
    ["🗣️", "f5t", "f5d"],
    ["🔒", "f6t", "f6d"],
  ];

  const steps = [
    ["1", "s1t", "s1d"],
    ["2", "s2t", "s2d"],
    ["3", "s3t", "s3d"],
  ];

  const buttons = (
    <>
      <Link href="/register" className="lp-btn solid">
        {t("ctaCreate")}
      </Link>
      <Link href="/login" className="lp-btn">
        {t("ctaLogin")}
      </Link>
    </>
  );

  return (
    <div className="lp">
      <style>{css}</style>

      <nav className="lp-nav">
        <span className="lp-logo">🌱 {t("appTitle")}</span>
        <div className="lp-actions">
          <LangToggle lang={lang} setLang={setLang} />
          <Link href="/login" className="lp-btn">
            {t("tabLogin")}
          </Link>
          <Link href="/register" className="lp-btn solid">
            {t("tabCreate")}
          </Link>
        </div>
      </nav>

      <header className="lp-hero">
        <div style={{ fontSize: "64px", marginBottom: "10px" }}>🌱</div>
        <h1>{t("heroTitle")}</h1>
        <p>{t("heroSub")}</p>
        <div className="lp-cta">{buttons}</div>
        <div className="lp-note">{t("noPw")}</div>
      </header>

      <section className="lp-sec">
        <h2>{t("featTitle")}</h2>
        <div className="lp-grid">
          {features.map(([icon, title, desc]) => (
            <div key={title} className="lp-card">
              <div className="ic">{icon}</div>
              <h3>{t(title)}</h3>
              <p>{t(desc)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-sec" style={{ paddingTop: 0 }}>
        <h2>{t("howTitle")}</h2>
        <div className="lp-grid">
          {steps.map(([n, title, desc]) => (
            <div key={n} className="lp-step">
              <div className="lp-num">{n}</div>
              <div>
                <h3>{t(title)}</h3>
                <p>{t(desc)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-band">
        <h2>{t("bandTitle")}</h2>
        <div className="lp-cta">{buttons}</div>
      </section>

      <footer className="lp-foot">{t("footer")}</footer>
    </div>
  );
}
