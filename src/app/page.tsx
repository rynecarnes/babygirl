"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PARTICIPANTS } from "@/config/participants";
import { DateTimePicker } from "@/components/DateTimePicker";

type Step = "identity" | "form";

interface FormData {
  birthDatetime: string;
  weightLbs: string;
  weightOz: string;
  heightIn: string;
}

interface FormErrors {
  birthDatetime?: string;
  weightLbs?: string;
  weightOz?: string;
  heightIn?: string;
}

const SESSION_KEY = "babyguess_participant";
const SUBMITTED_KEY = "babyguess_submitted";

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.birthDatetime) {
    errors.birthDatetime = "Date and time are required.";
  }
  const lbs = Number(data.weightLbs);
  if (!data.weightLbs || !Number.isInteger(lbs) || lbs < 1) {
    errors.weightLbs = "Must be a positive whole number.";
  }
  const oz = Number(data.weightOz);
  if (data.weightOz === "" || !Number.isInteger(oz) || oz < 0 || oz > 15) {
    errors.weightOz = "Must be 0–15.";
  }
  const h = Number(data.heightIn);
  if (!data.heightIn || !Number.isInteger(h) || h < 15 || h > 25) {
    errors.heightIn = "Must be a whole number between 15–25 inches.";
  }
  return errors;
}

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("identity");
  const [participant, setParticipant] = useState<string>("");
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const [form, setForm] = useState<FormData>({
    birthDatetime: "",
    weightLbs: "",
    weightOz: "",
    heightIn: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(false);

  // Restore session
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved && PARTICIPANTS.includes(saved)) {
      setParticipant(saved);
      // Check if already submitted
      const submittedList: string[] = JSON.parse(
        sessionStorage.getItem(SUBMITTED_KEY) ?? "[]"
      );
      if (submittedList.includes(saved)) {
        setAlreadySubmitted(true);
      } else {
        // Verify with server
        fetch("/api/guesses")
          .then((r) => r.json())
          .then((data) => {
            const serverGuesses: { participant: string }[] = data.guesses ?? [];
            if (serverGuesses.some((g) => g.participant === saved)) {
              setAlreadySubmitted(true);
            } else {
              setStep("form");
            }
          })
          .catch(() => setStep("form"));
      }
    }
  }, []);

  function selectParticipant(name: string) {
    setParticipant(name);
    sessionStorage.setItem(SESSION_KEY, name);

    // Check if already submitted on server
    fetch("/api/guesses")
      .then((r) => r.json())
      .then((data) => {
        const serverGuesses: { participant: string }[] = data.guesses ?? [];
        if (serverGuesses.some((g) => g.participant === name)) {
          setAlreadySubmitted(true);
        } else {
          setStep("form");
        }
      })
      .catch(() => setStep("form"));
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched) {
      setErrors(validate({ ...form, [name]: value }));
    }
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
      const res = await fetch("/api/guesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant,
          birthDatetime: form.birthDatetime,
          weightLbs: Number(form.weightLbs),
          weightOz: Number(form.weightOz),
          heightIn: Number(form.heightIn),
        }),
      });

      if (res.status === 409) {
        setAlreadySubmitted(true);
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        setServerError(data.error ?? "Submission failed. Please try again.");
        return;
      }

      // Mark submitted in sessionStorage
      const list: string[] = JSON.parse(
        sessionStorage.getItem(SUBMITTED_KEY) ?? "[]"
      );
      list.push(participant);
      sessionStorage.setItem(SUBMITTED_KEY, JSON.stringify(list));

      router.push(
        `/success?participant=${encodeURIComponent(participant)}&birthDatetime=${encodeURIComponent(form.birthDatetime)}&lbs=${form.weightLbs}&oz=${form.weightOz}&ht=${form.heightIn}`
      );
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Identity step ──────────────────────────────────
  if (step === "identity" && !participant) {
    return (
      <main className="page">
        <div className="container">
          <div className="card">
            <div className="logo">
              <span className="logo-emoji">👶</span>
            </div>
            <h1 className="page-title">Baby Guessing Game</h1>
            <p className="page-subtitle">
              Who are you? Select your name to submit your guess.
            </p>

            <div className="divider" />

            <div className="participants-grid">
              {PARTICIPANTS.map((name) => (
                <button
                  key={name}
                  id={`participant-${name.toLowerCase().replace(/\s+/g, "-")}`}
                  className="participant-btn"
                  onClick={() => selectParticipant(name)}
                >
                  {name}
                </button>
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <a href="/leaderboard" className="btn btn-ghost" style={{ color: "var(--accent)", textDecoration: "underline" }}>View Leaderboard →</a>
            </div>
            <p className="text-muted text-sm text-center mt-md">
              Already submitted? Your entry is locked once submitted.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ── Already submitted ──────────────────────────────
  if (alreadySubmitted) {
    return (
      <main className="page">
        <div className="container">
          <div className="card">
            <div className="logo">
              <span className="logo-emoji">👶</span>
            </div>
            <h1 className="page-title">Baby Guessing Game</h1>
            <div className="divider" />
            <div className="already-submitted">
              <span className="icon">✅</span>
              <p style={{ fontWeight: 600, fontSize: "1.05rem" }}>
                Hey {participant}!
              </p>
              <p className="mt-xs text-sm">
                Your guess has been recorded and cannot be changed. Check back
                on the{" "}
                <a
                  href="/leaderboard"
                  style={{ color: "var(--accent)", textDecoration: "underline" }}
                >
                  leaderboard
                </a>{" "}
                once the baby arrives!
              </p>
            </div>
            <button
              className="btn btn-ghost mt-md"
              onClick={() => {
                setParticipant("");
                setAlreadySubmitted(false);
                sessionStorage.removeItem(SESSION_KEY);
              }}
            >
              ← Switch participant
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Guess form ─────────────────────────────────────
  return (
    <main className="page">
      <div className="container">
        <div className="card">
          <div className="logo">
            <span className="logo-emoji">👶</span>
          </div>
          <h1 className="page-title">Your Guess</h1>
          <p className="page-subtitle">
            Hey <strong style={{ color: "var(--accent)" }}>{participant}</strong>!
            Fill in your predictions below.
          </p>

          <div className="divider" />

          {serverError && (
            <div className="error-banner" role="alert">
              ⚠️ {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Date and Time of Birth */}
            <p className="section-title">Date &amp; Time</p>
            <div className="field">
              <label htmlFor="birthDatetime" className="label">
                Date and Time of Birth
              </label>
              <DateTimePicker 
                value={form.birthDatetime}
                onChange={(val) => {
                  setForm((prev) => ({ ...prev, birthDatetime: val }));
                  if (touched) {
                    setErrors(validate({ ...form, birthDatetime: val }));
                  }
                }}
                required
              />
              {errors.birthDatetime && touched && (
                <span className="field-error">⚠ {errors.birthDatetime}</span>
              )}
            </div>

            {/* Weight */}
            <p className="section-title">Weight &amp; Height</p>
            <div className="input-row" style={{ marginBottom: "1.25rem" }}>
              <div className="field">
                <label htmlFor="weightLbs" className="label">
                  Weight (lbs)
                </label>
                <input
                  type="number"
                  id="weightLbs"
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
                <label htmlFor="weightOz" className="label">
                  (oz)
                </label>
                <input
                  type="number"
                  id="weightOz"
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
              <label htmlFor="heightIn" className="label">
                Height (inches)
              </label>
              <div className="input-row" style={{ marginBottom: 0 }}>
                <input
                  type="number"
                  id="heightIn"
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
              id="submit-guess"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner" />
                  Submitting…
                </>
              ) : (
                "Submit My Guess 🎉"
              )}
            </button>
          </form>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setParticipant("");
                sessionStorage.removeItem(SESSION_KEY);
                setStep("identity");
              }}
            >
              ← Switch participant
            </button>
            <a href="/leaderboard" className="btn btn-ghost" style={{ color: "var(--accent)", textDecoration: "underline" }}>
              View Leaderboard →
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
