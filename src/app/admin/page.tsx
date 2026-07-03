"use client";

import { useState, useEffect } from "react";
import { Guess } from "@/types";

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

  // Guess management state
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [guessesLoading, setGuessesLoading] = useState(true);
  const [deletingParticipant, setDeletingParticipant] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");

  useEffect(() => {
    fetch("/api/guesses")
      .then((r) => r.json())
      .then((d) => setGuesses(d.guesses ?? []))
      .catch(() => {})
      .finally(() => setGuessesLoading(false));
  }, []);

  async function handleDelete(participant: string) {
    if (!form.password) {
      setDeleteError("Enter your admin password above first.");
      return;
    }
    setDeletingParticipant(participant);
    setDeleteError("");
    setDeleteSuccess("");
    try {
      const res = await fetch("/api/guesses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: form.password, participant }),
      });
      if (res.status === 401) {
        setDeleteError("Incorrect password.");
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error ?? "Failed to delete guess.");
        return;
      }
      setGuesses((prev) => prev.filter((g) => g.participant !== participant));
      setDeleteSuccess(`${participant}'s guess has been deleted. They can now resubmit.`);
    } catch {
      setDeleteError("Network error. Please try again.");
    } finally {
      setDeletingParticipant(null);
    }
  }


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

        {/* Manage Guesses Section */}
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <div className="logo">
            <span className="logo-emoji">🗑️</span>
          </div>
          <h2 className="page-title" style={{ fontSize: "1.5rem" }}>Manage Guesses</h2>
          <p className="page-subtitle">
            Delete a participant's guess so they can go back and resubmit.
          </p>

          <div className="divider" />

          {deleteError && (
            <div className="error-banner" role="alert" style={{ marginBottom: "1rem" }}>
              ⚠️ {deleteError}
            </div>
          )}
          {deleteSuccess && (
            <div className="admin-success" style={{ marginBottom: "1rem" }}>
              ✅ {deleteSuccess}
            </div>
          )}

          {guessesLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "1.5rem" }}>
              <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
            </div>
          ) : guesses.length === 0 ? (
            <p className="text-muted text-sm text-center">No guesses submitted yet.</p>
          ) : (
            <div className="lb-table-wrapper">
              <table className="lb-table" aria-label="Manage participant guesses">
                <thead>
                  <tr>
                    <th scope="col">Participant</th>
                    <th scope="col">Date &amp; Time</th>
                    <th scope="col">Weight</th>
                    <th scope="col">Height</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {guesses.map((g) => (
                    <tr key={g.participant}>
                      <td style={{ fontWeight: 600 }}>{g.participant}</td>
                      <td style={{ fontSize: "0.85rem" }}>
                        {g.birthDatetime
                          ? new Date(g.birthDatetime).toLocaleString()
                          : "—"}
                      </td>
                      <td style={{ fontSize: "0.85rem" }}>
                        {g.weightLbs} lbs {g.weightOz} oz
                      </td>
                      <td style={{ fontSize: "0.85rem" }}>{g.heightIn} in</td>
                      <td>
                        <button
                          id={`delete-${g.participant.toLowerCase().replace(/\s+/g, "-")}`}
                          className="btn"
                          disabled={deletingParticipant === g.participant}
                          onClick={() => handleDelete(g.participant)}
                          style={{
                            background: "rgba(239,68,68,0.15)",
                            color: "#f87171",
                            border: "1px solid rgba(239,68,68,0.3)",
                            padding: "0.35rem 0.75rem",
                            fontSize: "0.8rem",
                            borderRadius: "var(--radius-sm)",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            transition: "background 0.2s",
                          }}
                          onMouseOver={(e) =>
                            ((e.currentTarget as HTMLButtonElement).style.background =
                              "rgba(239,68,68,0.28)")
                          }
                          onMouseOut={(e) =>
                            ((e.currentTarget as HTMLButtonElement).style.background =
                              "rgba(239,68,68,0.15)")
                          }
                        >
                          {deletingParticipant === g.participant ? (
                            <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Deleting…</>
                          ) : (
                            <>🗑️ Delete</>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
