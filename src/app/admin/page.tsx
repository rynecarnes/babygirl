"use client";

import { useState } from "react";
interface FormData {
  password: string;
  birthDatetime: string;
  weightLbs: string;
  weightOz: string;
  heightIn: string;
}

interface FormErrors {
  password?: string;
  birthDatetime?: string;
  weightLbs?: string;
  weightOz?: string;
  heightIn?: string;
}

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.password) errors.password = "Password is required.";
  if (!data.birthDatetime) errors.birthDatetime = "Date and time are required.";
  const lbs = Number(data.weightLbs);
  if (!data.weightLbs || !Number.isInteger(lbs) || lbs < 1) errors.weightLbs = "Must be a positive whole number.";
  const oz = Number(data.weightOz);
  if (data.weightOz === "" || !Number.isInteger(oz) || oz < 0 || oz > 15) errors.weightOz = "Must be 0–15.";
  const h = Number(data.heightIn);
  if (!data.heightIn || !Number.isInteger(h) || h < 15 || h > 25) errors.heightIn = "Must be a whole number between 15–25 inches.";
  return errors;
}

export default function AdminPage() {
  const [form, setForm] = useState<FormData>({
    password: "",
    birthDatetime: "",
    weightLbs: "",
    weightOz: "",
    heightIn: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched) setErrors(validate({ ...form, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setServerError("");

    try {
      const res = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: form.password,
          birthDatetime: form.birthDatetime,
          weightLbs: Number(form.weightLbs),
          weightOz: Number(form.weightOz),
          heightIn: Number(form.heightIn),
        }),
      });

      if (res.status === 401) {
        setErrors((prev) => ({ ...prev, password: "Incorrect password." }));
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        setServerError(data.error ?? "Submission failed.");
        return;
      }

      setSuccess(true);
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <main className="page">
        <div className="container">
          <div className="card">
            <div className="logo">
              <span className="logo-emoji">🔐</span>
            </div>
            <h1 className="page-title">Admin Panel</h1>
            <div className="divider" />
            <div className="admin-success">
              ✅ Actual answers saved! The leaderboard is now live.
            </div>
            <a href="/leaderboard" className="btn btn-primary mt-md">
              View Leaderboard →
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">
        <div className="card">
          <div className="logo">
            <span className="logo-emoji">🔐</span>
          </div>
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-subtitle">
            Enter the actual baby details to reveal the leaderboard.
          </p>

          <div className="divider" />

          {serverError && (
            <div className="error-banner" role="alert">
              ⚠️ {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Password */}
            <p className="section-title">Authentication</p>
            <div className="field">
              <label htmlFor="admin-password" className="label">
                Admin Password
              </label>
              <input
                type="password"
                id="admin-password"
                name="password"
                className="input"
                placeholder="Enter admin password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
              {errors.password && touched && (
                <span className="field-error">⚠ {errors.password}</span>
              )}
            </div>

            {/* Date and Time */}
            <p className="section-title">Actual Baby Details</p>
            <div className="field">
              <label htmlFor="admin-datetime" className="label">
                Date and Time of Birth
              </label>
              <input
                type="datetime-local"
                id="admin-datetime"
                name="birthDatetime"
                className="input"
                value={form.birthDatetime}
                onChange={handleChange}
                required
              />
              {errors.birthDatetime && touched && (
                <span className="field-error">⚠ {errors.birthDatetime}</span>
              )}
            </div>

            {/* Weight */}
            <div className="input-row" style={{ marginBottom: "1.25rem" }}>
              <div className="field">
                <label htmlFor="admin-lbs" className="label">
                  Weight (lbs)
                </label>
                <input
                  type="number"
                  id="admin-lbs"
                  name="weightLbs"
                  className="input"
                  placeholder="7"
                  min="1"
                  step="1"
                  value={form.weightLbs}
                  onChange={handleChange}
                  required
                />
                {errors.weightLbs && touched && (
                  <span className="field-error">⚠ {errors.weightLbs}</span>
                )}
              </div>
              <div className="field">
                <label htmlFor="admin-oz" className="label">
                  (oz)
                </label>
                <input
                  type="number"
                  id="admin-oz"
                  name="weightOz"
                  className="input"
                  placeholder="4"
                  min="0"
                  max="15"
                  step="1"
                  value={form.weightOz}
                  onChange={handleChange}
                  required
                />
                {errors.weightOz && touched && (
                  <span className="field-error">⚠ {errors.weightOz}</span>
                )}
              </div>
            </div>

            {/* Height */}
            <div className="field">
              <label htmlFor="admin-ht" className="label">
                Height (inches)
              </label>
              <div className="input-row" style={{ marginBottom: 0 }}>
                <input
                  type="number"
                  id="admin-ht"
                  name="heightIn"
                  className="input"
                  placeholder="20"
                  min="15"
                  max="25"
                  step="1"
                  value={form.heightIn}
                  onChange={handleChange}
                  required
                />
                <span className="input-unit">in</span>
              </div>
              {errors.heightIn && touched && (
                <span className="field-error">⚠ {errors.heightIn}</span>
              )}
            </div>

            <div className="divider" />

            <button
              type="submit"
              id="admin-submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner" />
                  Saving…
                </>
              ) : (
                "Save Actual Answers & Reveal Leaderboard 🏆"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
