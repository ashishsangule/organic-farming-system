"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f3d2e, #1b6b4a)",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px",
      }}
    >
      <div
        style={{
          maxWidth: "850px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "70px", marginBottom: "15px" }}>🌱</div>

        <h1
          style={{
            fontSize: "48px",
            fontWeight: "800",
            marginBottom: "15px",
          }}
        >
          Organic Farming System
        </h1>

        <p
          style={{
            fontSize: "19px",
            lineHeight: "1.7",
            opacity: 0.9,
            marginBottom: "35px",
          }}
        >
          A smart digital platform for managing farms, crops, fields,
          production and agricultural activities.
        </p>

        <div
          style={{
            display: "flex",
            gap: "15px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link href="/register">
            <button
              style={{
                padding: "14px 28px",
                borderRadius: "10px",
                border: "none",
                background: "white",
                color: "#0f3d2e",
                fontSize: "16px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Create Account
            </button>
          </Link>

          <Link href="/login">
            <button
              style={{
                padding: "14px 28px",
                borderRadius: "10px",
                border: "1px solid white",
                background: "transparent",
                color: "white",
                fontSize: "16px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Login
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}