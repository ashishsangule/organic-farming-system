"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useLang, LangToggle, Records } from "@/lib/ui";

export default function FarmDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { lang, setLang, t } = useLang();
  const [farm, setFarm] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: s } = await supabase.auth.getSession();

      if (!s.session) {
        router.replace("/login");
        return;
      }

      const { data } = await supabase
        .from("farms")
        .select("id, farm_name, location, fields(id, crops(id, crop_name))")
        .eq("id", id)
        .single();

      setFarm(data);
      setLoaded(true);
    }

    init();
  }, [id]);

  const fields = farm ? farm.fields || [] : [];
  const fieldIds = fields.map((f) => f.id);
  const cropIds = fields.flatMap((f) => (f.crops || []).map((c) => c.id));
  const cropNames = fields
    .flatMap((f) => (f.crops || []).map((c) => c.crop_name))
    .join(", ");

  return (
    <main style={{ minHeight: "100vh", background: "#f4f8f5" }}>
      <header
        style={{
          background: "#164c36",
          color: "white",
          padding: "18px 30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px",
        }}
      >
        <Link href="/farms" style={{ color: "white", fontWeight: "700", textDecoration: "none" }}>
          {t("back")}
        </Link>
        <LangToggle lang={lang} setLang={setLang} />
      </header>

      <section style={{ padding: "30px", maxWidth: "900px", margin: "auto" }}>
        {!loaded && <p style={{ color: "#666" }}>{t("loading")}</p>}

        {loaded && farm && (
          <>
            <h2 style={{ margin: 0, color: "#164c36", fontSize: "30px" }}>
              🌱 {farm.farm_name}
            </h2>
            <p style={{ color: "#666", marginBottom: "24px" }}>
              📍 {farm.location || "-"}
              {cropNames ? " · 🌾 " + cropNames : ""}
            </p>

            {fieldIds.length === 0 && (
              <p style={{ background: "#fbeccb", padding: "12px", borderRadius: "10px" }}>
                {t("noField")}
              </p>
            )}

            {fieldIds.length > 0 && (
              <Records
                t={t}
                title={t("activities")}
                table="activities"
                extra={{ field_id: fieldIds[0] }}
                filter={{ col: "field_id", in: fieldIds }}
                fields={[
                  { key: "activity", label: t("activity"), required: true },
                  { key: "activity_date", label: t("date"), type: "date" },
                  { key: "notes", label: t("notes") },
                ]}
                line={(r) => r.activity}
                sub={(r) => [r.activity_date, r.notes].filter(Boolean).join(" · ")}
              />
            )}

            <Records
              t={t}
              title={t("expenses")}
              table="expenses"
              extra={{ farm_id: farm.id }}
              filter={{ col: "farm_id", val: farm.id }}
              sum="amount"
              fields={[
                { key: "category", label: t("category"), required: true },
                { key: "amount", label: t("amount"), type: "number", required: true },
                { key: "expense_date", label: t("date"), type: "date" },
                { key: "notes", label: t("notes") },
              ]}
              line={(r) => `${r.category} - ₹${Number(r.amount).toLocaleString("en-IN")}`}
              sub={(r) => [r.expense_date, r.notes].filter(Boolean).join(" · ")}
            />

            {cropIds.length > 0 && (
              <Records
                t={t}
                title={t("harvest")}
                table="harvests"
                extra={{ crop_id: cropIds[0] }}
                filter={{ col: "crop_id", in: cropIds }}
                fields={[
                  { key: "quantity", label: t("quantity"), type: "number", required: true },
                  { key: "unit", label: t("unit"), options: ["kg", "quintal", "ton"] },
                  { key: "harvest_date", label: t("date"), type: "date" },
                ]}
                line={(r) => `${r.quantity} ${r.unit}`}
                sub={(r) => r.harvest_date || ""}
              />
            )}
          </>
        )}
      </section>
    </main>
  );
}
