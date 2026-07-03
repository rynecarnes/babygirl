// src/app/api/guesses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getGuesses, appendGuess, hasGuess, getActualAnswers, deleteGuess } from "@/lib/db";
import { PARTICIPANTS } from "@/config/participants";
import { Guess } from "@/types";

export async function GET() {
  try {
    const [guesses, actualAnswers] = await Promise.all([
      getGuesses(),
      getActualAnswers(),
    ]);
    return NextResponse.json({ guesses, actualAnswers });
  } catch {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { participant, birthDatetime, weightLbs, weightOz, heightIn } = body;

    // Validate participant
    if (!PARTICIPANTS.includes(participant)) {
      return NextResponse.json({ error: "Invalid participant" }, { status: 400 });
    }

    // Check for duplicate
    const already = await hasGuess(participant);
    if (already) {
      return NextResponse.json({ error: "Already submitted" }, { status: 409 });
    }

    // Validate fields
    if (!birthDatetime || isNaN(new Date(birthDatetime).getTime())) {
      return NextResponse.json({ error: "Valid date and time are required" }, { status: 400 });
    }
    const lbs = Number(weightLbs);
    const oz = Number(weightOz);
    const height = Number(heightIn);
    if (!Number.isInteger(lbs) || lbs < 1) {
      return NextResponse.json({ error: "Invalid weight (lbs)" }, { status: 400 });
    }
    if (!Number.isInteger(oz) || oz < 0 || oz > 15) {
      return NextResponse.json({ error: "Invalid weight (oz must be 0–15)" }, { status: 400 });
    }
    if (!Number.isInteger(height) || height < 15 || height > 25) {
      return NextResponse.json({ error: "Invalid height (must be a whole number 15–25 inches)" }, { status: 400 });
    }

    const guess: Guess = {
      participant,
      submittedAt: new Date().toISOString(),
      birthDatetime,
      weightLbs: lbs,
      weightOz: oz,
      heightIn: height,
    };

    await appendGuess(guess);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to submit guess" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { password, participant } = body;

    // Admin auth
    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate participant
    if (!participant || !PARTICIPANTS.includes(participant)) {
      return NextResponse.json({ error: "Invalid participant" }, { status: 400 });
    }

    // Check the guess exists
    const exists = await hasGuess(participant);
    if (!exists) {
      return NextResponse.json({ error: "No guess found for this participant" }, { status: 404 });
    }

    await deleteGuess(participant);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete guess" }, { status: 500 });
  }
}
