"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (loginError) {
        throw loginError;
      }

      router.push("/farms");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f8f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "450px",
          background: "white",
          borderRadius: "18px",
          padding: "35px",
          boxShadow: "0 10px 35px rgba(0,0,0,0.10)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{ fontSize: "48px" }}>🌾</div>

          <h1
            style={{
              color: "#164c36",
              margin: "10px 0",
              fontSize: "30px",
            }}
          >
            Welcome Back
          </h1>

          <p style={{ color: "#666" }}>
            Login to your Organic Farming System
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <label
            style={{
              display: "block",
              marginBottom: "7px",
              fontWeight: "600",
            }}
          >
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            style={inputStyle}
          />

          <label
            style={{
              display: "block",
              marginBottom: "7px",
              fontWeight: "600",
            }}
          >
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            style={inputStyle}
          />

          {error && (
            <div
              style={{
                background: "#ffe8e8",
                color: "#c62828",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "15px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "10px",
              background: loading ? "#8ab89e" : "#176b3a",
              color: "white",
              fontSize: "16px",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "22px",
            color: "#666",
          }}
        >
          Don't have an account?{" "}
          <Link
            href="/register"
            style={{
              color: "#176b3a",
              fontWeight: "700",
              textDecoration: "none",
            }}
          >
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: "13px",
  marginBottom: "18px",
  border: "1px solid #d5ddd8",
  borderRadius: "9px",
  fontSize: "15px",
  boxSizing: "border-box",
};