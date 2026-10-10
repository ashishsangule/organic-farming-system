"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function FarmsPage() {
  const router = useRouter();

  const [farms, setFarms] = useState([
    {
      id: 1,
      name: "Green Valley Farm",
      location: "Satara, Maharashtra",
      area: "10 Acres",
      crop: "Organic Wheat",
      status: "Active",
    },
    {
      id: 2,
      name: "Fresh Earth Farm",
      location: "Pune, Maharashtra",
      area: "7 Acres",
      crop: "Organic Vegetables",
      status: "Active",
    },
  ]);

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    location: "",
    area: "",
    crop: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function addFarm(e) {
    e.preventDefault();

    if (!form.name || !form.location || !form.area || !form.crop) {
      alert("Please fill all farm details.");
      return;
    }

    const newFarm = {
      id: Date.now(),
      name: form.name,
      location: form.location,
      area: form.area,
      crop: form.crop,
      status: "Active",
    };

    setFarms((previous) => [newFarm, ...previous]);

    setForm({
      name: "",
      location: "",
      area: "",
      crop: "",
    });

    setShowForm(false);
  }

  function deleteFarm(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this farm?"
    );

    if (!confirmDelete) return;

    setFarms((previous) =>
      previous.filter((farm) => farm.id !== id)
    );
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
            🌱 Organic Farming System
          </h1>

          <p
            style={{
              margin: "5px 0 0",
              opacity: 0.8,
            }}
          >
            Farm Management
          </p>
        </div>

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
          Logout
        </button>
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
              My Farms
            </h2>

            <p style={{ color: "#666" }}>
              Manage all your registered farms.
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
            {showForm ? "Close Form" : "+ Add Farm"}
          </button>
        </div>

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
              Add New Farm
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
                placeholder="Farm name"
                style={inputStyle}
              />

              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Location"
                style={inputStyle}
              />

              <input
                name="area"
                value={form.area}
                onChange={handleChange}
                placeholder="Area e.g. 10 Acres"
                style={inputStyle}
              />

              <input
                name="crop"
                value={form.crop}
                onChange={handleChange}
                placeholder="Main crop"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
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
              Save Farm
            </button>
          </form>
        )}

        {/* FARM CARDS */}

        {farms.length === 0 ? (
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

            <h3>No Farms Added</h3>

            <p>
              Click "Add Farm" to create your first farm.
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
                    {farm.status}
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
                  📍 <strong>Location:</strong>{" "}
                  {farm.location}
                </p>

                <p>
                  📐 <strong>Area:</strong> {farm.area}
                </p>

                <p>
                  🌾 <strong>Crop:</strong> {farm.crop}
                </p>

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
                  Delete Farm
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