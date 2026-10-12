"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Advisory from "./Advisory";
import { useLang, LangToggle, Records } from "@/lib/ui";

export default function FarmsPage() {
  const router = useRouter();
  const { lang, setLang, t } = useLang();

  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState({ pending: 0, expenses: 0 });

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    location: "",
    area: "",
    crop: "",
  });

  async function loadFarms() {
    const { data, error } = await supabase
      .from("farms")
      .select("id, farm_name, location, total_area, fields(id, crops(crop_name))")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Could not load farms: " + error.message);
      setLoading(false);
      return;
    }

    setFarms(
      (data || []).map((farm) => ({
        id: farm.id,
        name: farm.farm_name,
        location: farm.location || "-",
        area: `${farm.total_area ?? 0} Acres`,
        acres: Number(farm.total_area) || 0,
        crop:
          (farm.fields || [])
            .flatMap((field) => (field.crops || []).map((c) => c.crop_name))
            .join(", ") || "-",
        status: "Active",
      }))
    );

    setLoading(false);
  }

  async function loadStats() {
    const { count } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .neq("status", "Done");

    const { data } = await supabase.from("expenses").select("amount");

    setStats({
      pending: count || 0,
      expenses: (data || []).reduce((a, r) => a + (Number(r.amount) || 0), 0),
    });
  }

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace("/login");
        return;
      }

      const meta = data.session.user.user_metadata || {};
      setUserName(meta.full_name || "");
      loadFarms();
      loadStats();
    }

    init();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function addFarm(e) {
    e.preventDefault();

    if (!form.name || !form.location || !form.area || !form.crop) {
      alert(t("fillAll"));
      return;
    }

    setSaving(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      setSaving(false);
      router.replace("/login");
      return;
    }

    const area = parseFloat(form.area) || 0;

    const { data: farm, error: farmError } = await supabase
      .from("farms")
      .insert({
        user_id: user.id,
        farm_name: form.name,
        location: form.location,
        total_area: area,
      })
      .select()
      .single();

    if (farmError) {
      alert("Could not save farm: " + farmError.message);
      setSaving(false);
      return;
    }

    const { data: field, error: fieldError } = await supabase
      .from("fields")
      .insert({
        user_id: user.id,
        farm_id: farm.id,
        field_name: "Main field",
        area,
      })
      .select()
      .single();

    if (fieldError) {
      alert("Farm saved, but the field could not be saved: " + fieldError.message);
    } else {
      const { error: cropError } = await supabase.from("crops").insert({
        user_id: user.id,
        field_id: field.id,
        crop_name: form.crop,
      });

      if (cropError) {
        alert("Farm saved, but the crop could not be saved: " + cropError.message);
      }
    }

    await loadFarms();

    setForm({
      name: "",
      location: "",
      area: "",
      crop: "",
    });

    setShowForm(false);
    setSaving(false);
  }

  async function deleteFarm(id) {
    const confirmDelete = window.confirm(
      t("confirmDelete")
    );

    if (!confirmDelete) return;

    const { data: fields } = await supabase
      .from("fields")
      .select("id")
      .eq("farm_id", id);

    const fieldIds = (fields || []).map((f) => f.id);

    if (fieldIds.length > 0) {
      const { error: cropsError } = await supabase
        .from("crops")
        .delete()
        .in("field_id", fieldIds);

      if (cropsError) {
        alert("Could not delete farm: " + cropsError.message);
        return;
      }

      const { error: fieldsError } = await supabase
        .from("fields")
        .delete()
        .in("id", fieldIds);

      if (fieldsError) {
        alert("Could not delete farm: " + fieldsError.message);
        return;
      }
    }

    const { error } = await supabase.from("farms").delete().eq("id", id);

    if (error) {
      alert("Could not delete farm: " + error.message);
      return;
    }

    setFarms((previous) => previous.filter((farm) => farm.id !== id));
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f8f5",
      }}
    >
      {/* HEADER */}

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
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "25px",
            }}
          >
            🌱 {t("appTitle")}
          </h1>

          <p
            style={{
              margin: "5px 0 0",
              opacity: 0.8,
            }}
          >
            {t("farmMgmt")}
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <LangToggle lang={lang} setLang={setLang} />
        <button
          onClick={logout}
          style={{
            background: "white",
            color: "#164c36",
            border: "none",
            padding: "10px 18px",
            borderRadius: "8px",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          {t("logout")}
        </button>
        </div>
      </header>

      {/* CONTENT */}

      <section
        style={{
          padding: "30px",
          maxWidth: "1200px",
          margin: "auto",
        }}
      >
        {/* TOP */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
            flexWrap: "wrap",
            gap: "15px",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#164c36",
                fontSize: "30px",
              }}
            >
              {t("myFarms")}
            </h2>

            <p style={{ color: "#666" }}>
              {t("manageAll")}
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: "#176b3a",
              color: "white",
              border: "none",
              padding: "13px 20px",
              borderRadius: "9px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            {showForm ? t("closeForm") : t("addFarm")}
          </button>
        </div>

        <h2 style={{ margin: "0 0 16px", color: "#164c36", fontSize: "26px" }}>
          {t("hello")}{userName ? ", " + userName : ""} 👋
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "14px",
            marginBottom: "28px",
          }}
        >
          {[
            ["🌾", t("statFarms"), farms.length],
            ["📐", t("statAcres"), farms.reduce((a, f) => a + (f.acres || 0), 0)],
            ["✅", t("statTasks"), stats.pending],
            ["💰", t("statExpenses"), "₹" + stats.expenses.toLocaleString("en-IN")],
          ].map(([icon, label, value]) => (
            <div
              key={label}
              style={{
                background: "white",
                borderRadius: "14px",
                padding: "18px",
                boxShadow: "0 5px 18px rgba(0,0,0,0.07)",
              }}
            >
              <div style={{ fontSize: "28px" }}>{icon}</div>
              <div style={{ fontSize: "26px", fontWeight: "800", color: "#164c36" }}>
                {value}
              </div>
              <div style={{ color: "#666", fontSize: "14px" }}>{label}</div>
            </div>
          ))}
        </div>

        <Records
          t={t}
          title={t("tasks")}
          table="tasks"
          doneKey="status"
          fields={[
            { key: "task_name", label: t("taskName"), required: true },
            { key: "due_date", label: t("due"), type: "date" },
            { key: "description", label: t("details") },
          ]}
          line={(r) => r.task_name}
          sub={(r) => [r.due_date, r.description].filter(Boolean).join(" · ")}
        />

        {/* ADD FARM FORM */}

        {showForm && (
          <form
            onSubmit={addFarm}
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "15px",
              marginBottom: "25px",
              boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
            }}
          >
            <h3 style={{ color: "#164c36" }}>
              {t("addNewFarm")}
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "15px",
              }}
            >
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder={t("farmName")}
                style={inputStyle}
              />

              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder={t("location")}
                style={inputStyle}
              />

              <input
                name="area"
                value={form.area}
                onChange={handleChange}
                placeholder={t("areaPh")}
                style={inputStyle}
              />

              <input
                name="crop"
                value={form.crop}
                onChange={handleChange}
                placeholder={t("cropsPh")}
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: "18px",
                background: "#176b3a",
                color: "white",
                border: "none",
                padding: "12px 22px",
                borderRadius: "8px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              {saving ? t("saving") : t("saveFarm")}
            </button>
          </form>
        )}

        {/* FARM CARDS */}

        {loading ? (
          <p style={{ color: "#666" }}>{t("loading")}</p>
        ) : farms.length === 0 ? (
          <div
            style={{
              background: "white",
              borderRadius: "15px",
              padding: "50px",
              textAlign: "center",
              color: "#666",
            }}
          >
            <div style={{ fontSize: "50px" }}>🌾</div>

            <h3>{t("noFarms")}</h3>

            <p>
              {t("noFarmsHint")}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {farms.map((farm) => (
              <div
                key={farm.id}
                style={{
                  background: "white",
                  borderRadius: "15px",
                  padding: "22px",
                  boxShadow: "0 5px 20px rgba(0,0,0,0.07)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "15px",
                  }}
                >
                  <span style={{ fontSize: "35px" }}>
                    🌱
                  </span>

                  <span
                    style={{
                      background: "#e5f7eb",
                      color: "#176b3a",
                      padding: "5px 10px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}
                  >
                    {t("active")}
                  </span>
                </div>

                <h3
                  style={{
                    color: "#164c36",
                    marginBottom: "15px",
                  }}
                >
                  {farm.name}
                </h3>

                <p>
                  📍 <strong>{t("locLbl")}</strong>{" "}
                  {farm.location}
                </p>

                <p>
                  📐 <strong>{t("areaLbl")}</strong>{" "}
                  {t("acresN").replace("{n}", farm.acres)}
                </p>

                <p>
                  🌾 <strong>{t("cropLbl")}</strong> {farm.crop}
                </p>

                <Link
                  href={`/farms/${farm.id}`}
                  style={{
                    display: "block",
                    boxSizing: "border-box",
                    textAlign: "center",
                    marginTop: "12px",
                    padding: "10px",
                    border: "1px solid #176b3a",
                    background: "white",
                    color: "#176b3a",
                    borderRadius: "8px",
                    fontWeight: "700",
                    textDecoration: "none",
                  }}
                >
                  {t("daily")}
                </Link>

                <button
                  onClick={() =>
                    setOpenId(openId === farm.id ? null : farm.id)
                  }
                  style={{
                    width: "100%",
                    marginTop: "12px",
                    padding: "10px",
                    border: "none",
                    background: "#176b3a",
                    color: "white",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "700",
                  }}
                >
                  {openId === farm.id ? t("hideAdvisory") : t("advisory")}
                </button>

                {openId === farm.id && (
                  <Advisory crop={farm.crop} acres={farm.acres} t={t} />
                )}

                <button
                  onClick={() => deleteFarm(farm.id)}
                  style={{
                    width: "100%",
                    marginTop: "12px",
                    padding: "10px",
                    border: "1px solid #e05252",
                    background: "white",
                    color: "#c62828",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  {t("deleteFarm")}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: "13px",
  border: "1px solid #d5ddd8",
  borderRadius: "9px",
  fontSize: "15px",
  boxSizing: "border-box",
};
