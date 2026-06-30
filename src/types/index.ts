// src/types/index.ts

export interface Guess {
  participant: string;
  submittedAt: string;
  birthDatetime: string; // ISO 8601
  weightLbs: number;
  weightOz: number;
  heightIn: number;
}

export interface ActualAnswers {
  birthDatetime: string;
  weightLbs: number;
  weightOz: number;
  heightIn: number;
}

export interface ScoredParticipant {
  participant: string;
  rank: number;
  datetimePoints: number;
  weightPoints: number;
  heightPoints: number;
  totalScore: number;
  isWinner: boolean;
  guess: Guess;
}
