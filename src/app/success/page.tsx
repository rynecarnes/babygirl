"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function SuccessContent() {
  const params = useSearchParams();
  const participant = params.get("participant") ?? "";
  const birthDatetime = params.get("birthDatetime") ?? "";
  const lbs = params.get("lbs") ?? "";
  const oz = params.get("oz") ?? "";
  const ht = params.get("ht") ?? "";

  function formatDatetime(dt: string) {
    if (!dt) return "—";
    const date = new Date(dt);
    if (isNaN(date.getTime())) return "—";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    let h = date.getHours();
    const mins = String(date.getMinutes()).padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${m}/${d}/${y} ${h}:${mins} ${ampm}`;
  }

  return (
    <main className="page">
      <div className="container">
        <div className="card text-center">
          <span className="success-icon">🎉</span>
          <h1 className="success-title">You&rsquo;re in!</h1>
          <p className="page-subtitle mt-xs">
            {participant && (
              <>
                Good luck, <strong style={{ color: "var(--accent)" }}>{participant}</strong>!
              </>
            )}{" "}
            Your guess has been locked in.
          </p>

          {birthDatetime && (
            <div className="success-detail mt-md">
              <div className="detail-row">
                <span className="detail-label">Date & Time of Birth</span>
                <span className="detail-value">{formatDatetime(birthDatetime)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Weight</span>
                <span className="detail-value">
                  {lbs} lbs {oz} oz
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Height</span>
                <span className="detail-value">{ht} in</span>
              </div>
            </div>
          )}

          <p className="text-muted text-sm">
            Can&rsquo;t change your guess once submitted. Check the leaderboard
            after the baby arrives!
          </p>

          <Link href="/leaderboard" className="btn btn-primary mt-md">
            View Leaderboard
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="page"><p className="text-muted">Loading…</p></div>}>
      <SuccessContent />
    </Suspense>
  );
}
