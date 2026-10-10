"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";


export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function handleChange(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError("Please complete all fields.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const { data, error: signupError } =
        await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            data: {
              full_name: form.name.trim(),
            },
          },
        });

      if (signupError) throw signupError;

      if (data.user?.identities?.length === 0) {
        setError("This email may already be registered. Try logging in.");
        return;
      }

      if (data.session) {
        setMessage("Account created successfully!");
      } else {
        setMessage(
          "Registration submitted! Check your email to confirm your account if required."
        );
      }

      setForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    {
      name: "name",
      label: "Full Name",
      placeholder: "Enter your full name",
      type: "text",
      autoComplete: "name",
    },
    {
      name: "email",
      label: "Email Address",
      placeholder: "you@example.com",
      type: "email",
      autoComplete: "email",
    },
  ];

  return (
    <main className="register-page">
      <div className="register-card">
        <div className="register-heading">
          <div className="register-logo">🌱</div>
          <span className="register-eyebrow">GROW SMARTER</span>
          <h1>Create your account</h1>
          <p>Start managing your farm the smarter way.</p>
        </div>

        <form onSubmit={handleRegister}>
          {fields.map((field) => (
            <div className="register-field" key={field.name}>
              <label htmlFor={field.name}>
                {field.label}
              </label>

              <input
                id={field.name}
                name={field.name}
                type={field.type}
                autoComplete={field.autoComplete}
                value={form[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                className="register-input"
                required
              />
            </div>
          ))}

          <div className="register-field">
            <label htmlFor="password">Password</label>

            <div className="password-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className="register-input"
                minLength={6}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="register-field">
            <label htmlFor="confirmPassword">Confirm Password</label>

            <div className="password-wrapper">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                className="register-input"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <div className="register-alert register-error" role="alert">
              {error}
            </div>
          )}

          {message && (
            <div className="register-alert register-success" role="status">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="register-submit"
            disabled={loading}
          >
            {loading ? "Creating your account..." : "Create Account"}
            {!loading && <span aria-hidden="true"> →</span>}
          </button>
        </form>

        <div className="register-footer">
          Already have an account?{" "}
          <Link href="/login">Sign in</Link>
        </div>

        <p className="register-privacy">
          By registering, you agree to use the platform responsibly.
        </p>
      </div>
    </main>
  );
}
