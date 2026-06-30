// src/app/api/answers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { setActualAnswers } from "@/lib/db";
import { ActualAnswers } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password, birthDatetime, weightLbs, weightOz, heightIn } = body;

    // Password check
    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const answers: ActualAnswers = {
      birthDatetime,
      weightLbs: lbs,
      weightOz: oz,
      heightIn: height,
    };

    await setActualAnswers(answers);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save answers" }, { status: 500 });
  }
}
