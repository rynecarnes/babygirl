// src/lib/db.ts
// Supabase Postgres helpers for reading/writing guesses and actual answers.
// Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.
// For local development without those env vars, falls back to the local JSON file.

import { createClient } from "@supabase/supabase-js";
import { Guess, ActualAnswers } from "@/types";
import { promises as fs } from "fs";
import path from "path";

const LOCAL_DB_PATH = path.join(process.cwd(), ".local-db.json");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const useLocalFs = !supabaseUrl || !supabaseServiceKey;

export const supabase = useLocalFs
  ? null
  : createClient(supabaseUrl!, supabaseServiceKey!);

// ─── Local FS fallback (development) ──────────────────────
type LocalDb = {
  guesses: Guess[];
  actualAnswers: ActualAnswers | null;
};

async function readLocalDb(): Promise<LocalDb> {
  try {
    const data = await fs.readFile(LOCAL_DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return { guesses: [], actualAnswers: null };
  }
}

async function writeLocalDb(data: LocalDb): Promise<void> {
  await fs.writeFile(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// ─── Guesses ───────────────────────────────────────────────
export async function getGuesses(): Promise<Guess[]> {
  if (useLocalFs) {
    const db = await readLocalDb();
    return db.guesses;
  }

  const { data, error } = await supabase!
    .from("guesses")
    .select("*")
    .order("submittedat", { ascending: true });

  if (error) throw new Error(error.message);

  // Map snake_case DB columns → camelCase Guess type
  return (data ?? []).map((row) => ({
    participant: row.participant,
    submittedAt: row.submittedat,
    birthDatetime: row.birthdatetime,
    weightLbs: row.weightlbs,
    weightOz: row.weightoz,
    heightIn: row.heightin,
  }));
}

export async function appendGuess(guess: Guess): Promise<void> {
  if (useLocalFs) {
    const db = await readLocalDb();
    db.guesses.push(guess);
    await writeLocalDb(db);
    return;
  }

  const { error } = await supabase!.from("guesses").insert({
    participant: guess.participant,
    submittedat: guess.submittedAt,
    birthdatetime: guess.birthDatetime,
    weightlbs: guess.weightLbs,
    weightoz: guess.weightOz,
    heightin: guess.heightIn,
  });

  if (error) throw new Error(error.message);
}

export async function hasGuess(participant: string): Promise<boolean> {
  if (useLocalFs) {
    const db = await readLocalDb();
    return db.guesses.some((g) => g.participant === participant);
  }

  const { data, error } = await supabase!
    .from("guesses")
    .select("participant")
    .eq("participant", participant)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data !== null;
}

export async function deleteGuess(participant: string): Promise<void> {
  if (useLocalFs) {
    const db = await readLocalDb();
    db.guesses = db.guesses.filter((g) => g.participant !== participant);
    await writeLocalDb(db);
    return;
  }

  const { error } = await supabase!
    .from("guesses")
    .delete()
    .eq("participant", participant);

  if (error) throw new Error(error.message);
}

// ─── Actual Answers ────────────────────────────────────────
export async function getActualAnswers(): Promise<ActualAnswers | null> {
  if (useLocalFs) {
    const db = await readLocalDb();
    return db.actualAnswers;
  }

  const { data, error } = await supabase!
    .from("actual_answers")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    birthDatetime: data.birthdatetime,
    weightLbs: data.weightlbs,
    weightOz: data.weightoz,
    heightIn: data.heightin,
  };
}

export async function setActualAnswers(answers: ActualAnswers): Promise<void> {
  if (useLocalFs) {
    const db = await readLocalDb();
    db.actualAnswers = answers;
    await writeLocalDb(db);
    return;
  }

  const { error } = await supabase!.from("actual_answers").upsert(
    {
      id: 1,
      birthdatetime: answers.birthDatetime,
      weightlbs: answers.weightLbs,
      weightoz: answers.weightOz,
      heightin: answers.heightIn,
    },
    { onConflict: "id" }
  );

  if (error) throw new Error(error.message);
}
