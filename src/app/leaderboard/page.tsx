"use client";

import { useEffect, useState } from "react";
import { ScoredParticipant, ActualAnswers, Guess } from "@/types";

interface LeaderboardData {
  available: boolean;
  results?: ScoredParticipant[];
  actual?: ActualAnswers;
}

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

function RankBadge({ rank }: { rank: number }) {
  const cls =
    rank === 1 ? "rank-badge rank-1" :
    rank === 2 ? "rank-badge rank-2" :
    rank === 3 ? "rank-badge rank-3" :
    "rank-badge";
  return <span className={cls}>{rank}</span>;
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [guesses, setGuesses] = useState<Guess[]>([]);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("Failed to load leaderboard. Please refresh."))
      .finally(() => setLoading(false));

    fetch("/api/guesses")
      .then((r) => r.json())
      .then((d) => setGuesses(d.guesses ?? []))
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <main className="page">
        <div className="container">
          <div className="card text-center">
            <span className="logo-emoji" style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>👶</span>
            <p className="text-muted">Loading leaderboard…</p>
            <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
              <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page">
        <div className="container">
          <div className="card">
            <div className="error-banner">{error}</div>
          </div>
        </div>
      </main>
    );
  }

  if (!data?.available) {
    return (
      <main className="page" style={{ paddingTop: "3rem", paddingBottom: "3rem" }}>
        <div className="container container--wide">
          <div style={{ marginBottom: "1rem" }}>
            <a href="/" className="btn btn-ghost" style={{ padding: "0.5rem 0", color: "var(--accent)" }}>← Back to Home</a>
          </div>
          <div className="card">
            <div className="lb-not-ready">
              <span className="icon">⏳</span>
              <h1 className="page-title">Results Not Yet Available</h1>
              <p className="page-subtitle mt-xs">
                The leaderboard will appear once the actual baby details have
                been entered. Check back after the baby arrives!
              </p>
            </div>

            {guesses.length > 0 && (
              <>
                <div className="divider" />
                <p className="section-title" style={{ textAlign: "center", marginBottom: "1rem" }}>
                  📋 Submitted Guesses ({guesses.length})
                </p>
                <div className="lb-table-wrapper">
                  <table className="lb-table" aria-label="Submitted guesses">
                    <thead>
                      <tr>
                        <th scope="col">Participant</th>
                        <th scope="col">Date &amp; Time</th>
                        <th scope="col">Weight</th>
                        <th scope="col">Height</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guesses.map((g) => (
                        <tr key={g.participant}>
                          <td style={{ fontWeight: 600 }}>{g.participant}</td>
                          <td>{formatDatetime(g.birthDatetime)}</td>
                          <td>{g.weightLbs} lbs {g.weightOz} oz</td>
                          <td>{g.heightIn} in</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {guesses.length === 0 && (
              <p className="text-muted text-sm text-center" style={{ marginTop: "1rem" }}>
                No guesses have been submitted yet.
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  const { results = [], actual } = data;
  const winners = results.filter((r) => r.isWinner);
  const isCoWin = winners.length > 1;

  return (
    <main className="page" style={{ paddingTop: "3rem", paddingBottom: "3rem" }}>
      <div className="container container--wide">
        <div style={{ marginBottom: "1rem" }}>
          <a href="/" className="btn btn-ghost" style={{ padding: "0.5rem 0", color: "var(--accent)" }}>← Back to Home</a>
        </div>
        <div className="card">
          {/* Header */}
          <div className="lb-header">
            <span style={{ fontSize: "3rem", display: "block", marginBottom: "0.5rem", filter: "drop-shadow(0 0 20px rgba(255 215 0 / 0.5))" }}>
              🏆
            </span>
            <h1 className="page-title">Leaderboard</h1>
            <p className="page-subtitle">
              {isCoWin
                ? `Co-winners: ${winners.map((w) => w.participant).join(" & ")}! 🎉`
                : `Winner: ${winners[0]?.participant}! 🎉`}
            </p>
            <p className="text-muted text-sm mt-xs">
              Lower score = better. Scoring is golf-style.
            </p>
          </div>

          {/* Actual Answers Box */}
          {actual && (
            <div className="actual-box">
              <p className="actual-box-title">✨ Actual Baby Details</p>
              <div className="actual-grid">
                <div className="actual-item">
                  <span className="actual-item-label">Date & Time of Birth</span>
                  <span className="actual-item-value">{formatDatetime(actual.birthDatetime)}</span>
                </div>
                <div className="actual-item">
                  <span className="actual-item-label">Weight</span>
                  <span className="actual-item-value">{actual.weightLbs} lbs {actual.weightOz} oz</span>
                </div>
                <div className="actual-item">
                  <span className="actual-item-label">Height</span>
                  <span className="actual-item-value">{actual.heightIn} in</span>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="lb-table-wrapper">
            <table className="lb-table" aria-label="Leaderboard results">
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Participant</th>
                  <th scope="col" title="Date & Time proximity rank">Date/Time</th>
                  <th scope="col" title="Weight proximity rank">Weight</th>
                  <th scope="col" title="Height proximity rank">Height</th>
                  <th scope="col">Total</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row) => (
                  <tr
                    key={row.participant}
                    className={row.isWinner ? "lb-row-winner" : ""}
                  >
                    <td>
                      <RankBadge rank={row.rank} />
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{row.participant}</span>
                      {row.isWinner && (
                        <span className="winner-badge">🏆 {isCoWin ? "Co-winner" : "Winner"}</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{row.datetimePoints}</div>
                      <div className="text-muted" style={{ fontSize: "0.75rem", marginTop: "0.15rem" }}>
                        {formatDatetime(row.guess?.birthDatetime)}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{row.weightPoints}</div>
                      <div className="text-muted" style={{ fontSize: "0.75rem", marginTop: "0.15rem" }}>
                        {row.guess?.weightLbs} lbs {row.guess?.weightOz} oz
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{row.heightPoints}</div>
                      <div className="text-muted" style={{ fontSize: "0.75rem", marginTop: "0.15rem" }}>
                        {row.guess?.heightIn} in
                      </div>
                    </td>
                    <td className="score-cell" style={row.isWinner ? { color: "var(--gold)" } : {}}>
                      {row.totalScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-muted text-sm mt-md text-center">
            For proximity categories (Date/Time, Weight, Height): rank points are assigned 1st → best, last → worst.
          </p>
        </div>
      </div>
    </main>
  );
}
