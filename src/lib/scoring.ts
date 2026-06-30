// src/lib/scoring.ts
// Scoring logic for the baby guessing game.
// Lower score = better (golf scoring).

import { Guess, ActualAnswers, ScoredParticipant } from "@/types";

/** Convert lbs + oz to total ounces */
function toOz(lbs: number, oz: number): number {
  return lbs * 16 + oz;
}

/** Absolute difference between two datetimes in minutes */
function timeDiffMinutes(a: string, b: string): number {
  const msPerMin = 1000 * 60;
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / msPerMin;
}

/**
 * Rank participants by their numeric proximity to the actual value.
 * Returns a map of participant name → rank points (1 = closest).
 * Tied participants share the same rank; next rank is skipped.
 */
function rankByProximity(
  guesses: Guess[],
  distanceFn: (g: Guess) => number
): Map<string, number> {
  const distances = guesses.map((g) => ({
    participant: g.participant,
    distance: distanceFn(g),
  }));

  // Sort by distance ascending
  distances.sort((a, b) => a.distance - b.distance);

  const result = new Map<string, number>();
  let currentRank = 1;

  for (let i = 0; i < distances.length; ) {
    const d = distances[i].distance;
    // Find all tied at this distance
    let j = i;
    while (j < distances.length && distances[j].distance === d) {
      result.set(distances[j].participant, currentRank);
      j++;
    }
    // Skip ranks consumed by ties
    currentRank += j - i;
    i = j;
  }

  return result;
}

export function scoreGuesses(
  guesses: Guess[],
  actual: ActualAnswers
): ScoredParticipant[] {
  if (guesses.length === 0) return [];

  // Proximity rankings
  const datetimeRanks = rankByProximity(guesses, (g) =>
    timeDiffMinutes(g.birthDatetime, actual.birthDatetime)
  );
  const weightRanks = rankByProximity(guesses, (g) =>
    Math.abs(toOz(g.weightLbs, g.weightOz) - toOz(actual.weightLbs, actual.weightOz))
  );
  const heightRanks = rankByProximity(guesses, (g) =>
    Math.abs(g.heightIn - actual.heightIn)
  );

  const scored = guesses.map((g) => {
    const dt = datetimeRanks.get(g.participant) ?? guesses.length;
    const wt = weightRanks.get(g.participant) ?? guesses.length;
    const ht = heightRanks.get(g.participant) ?? guesses.length;
    const total = dt + wt + ht;

    return {
      participant: g.participant,
      rank: 0, // computed below
      datetimePoints: dt,
      weightPoints: wt,
      heightPoints: ht,
      totalScore: total,
      isWinner: false, // computed below
      guess: g,
    };
  });

  // Sort by total score ascending (lower = better)
  scored.sort((a, b) => a.totalScore - b.totalScore);

  // Assign final ranks and mark winners
  const minScore = scored[0].totalScore;
  let currentRank = 1;
  for (let i = 0; i < scored.length; ) {
    const score = scored[i].totalScore;
    let j = i;
    while (j < scored.length && scored[j].totalScore === score) {
      scored[j].rank = currentRank;
      scored[j].isWinner = score === minScore;
      j++;
    }
    currentRank += j - i;
    i = j;
  }

  return scored;
}
