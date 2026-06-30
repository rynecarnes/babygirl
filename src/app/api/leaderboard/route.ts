// src/app/api/leaderboard/route.ts
import { NextResponse } from "next/server";
import { getGuesses, getActualAnswers } from "@/lib/db";
import { scoreGuesses } from "@/lib/scoring";

export async function GET() {
  try {
    const [guesses, actual] = await Promise.all([
      getGuesses(),
      getActualAnswers(),
    ]);

    if (!actual) {
      return NextResponse.json({ available: false });
    }

    const scored = scoreGuesses(guesses, actual);
    return NextResponse.json({ available: true, results: scored, actual });
  } catch {
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
