# Baby Guessing Game — App Instructions

## Overview

A React web app where participants submit guesses about a newborn baby's details. Once the actual answers are entered, the app scores everyone's guesses and displays a leaderboard. All data is persisted in **Vercel KV** (serverless Redis). Deployable to Vercel.

---

## Tech Stack

- **Framework**: Next.js (React)
- **Language**: TypeScript
- **Storage**: **Vercel KV** (serverless Redis) — read/written via the `@vercel/kv` SDK from Next.js API routes. Data persists across deployments and cold starts with no race conditions.
- **Deployment**: Vercel

---

## Participant List

The following names will be available in the "Who are you?" selector at app entry. This list is defined in `src/config/participants.ts` — **fill in the real names before deploying**.

```ts
// src/config/participants.ts
export const PARTICIPANTS = [
  "Participant One",
  "Participant Two",
  "Participant Three",
  // Add all names here...
];
```

---

## App Flow

### 1. Identity Selection (Entry Screen)

- On first load, the user is presented with a **"Who are you?"** screen.
- Displays a dropdown or list of all participant names.
- The user must select their name to proceed.
- Selection is stored in `sessionStorage` for the duration of the session.
- If a participant has **already submitted a guess**, they should see a message saying their guess has been recorded and cannot be changed.

---

### 2. Guess Submission Form

After selecting their identity, the participant fills out the following fields:

#### Fields

| Field | Type | Details |
|---|---|---|
| **Baby's Name** | Dropdown | Two name options (defined in `src/config/babyNames.ts`) |
| **Date of Birth** | Date picker | Full date (MM/DD/YYYY) |
| **Time of Birth** | Time picker | HH:MM AM/PM |
| **Weight** | Two numeric inputs | Pounds (lbs) and Ounces (oz) |
| **Height** | Numeric input | Inches (in), supports decimals |

#### Validation Rules

- All fields are **required**.
- **Weight**: lbs must be a positive integer; oz must be between 0–15.
- **Height**: must be a positive number (decimals allowed); reasonable range enforced (e.g., 15–25 inches).
- **Date of Birth**: must be a valid calendar date.
- **Time of Birth**: must be a valid time.
- **Name**: must be one of the two provided options.
- Show inline validation errors before allowing submission.

#### Submission

- On valid submission, the guess is written to Vercel KV via an API route.
- A success confirmation screen is shown.
- The participant **cannot resubmit** — their entry is locked after submission.

---

### 3. Admin Panel — Enter Actual Answers

- Accessible via a separate route (e.g., `/admin`).
- Protected by a simple hardcoded password (defined in an environment variable).
- The admin enters the **actual baby details**:

| Field | Details |
|---|---|
| Baby's Name | Dropdown — same two options |
| Date of Birth | Date picker |
| Time of Birth | Time picker |
| Weight (lbs + oz) | Numeric inputs |
| Height (inches) | Numeric input |

- Once submitted, the actual answers are saved to the data store.
- Submitting actual answers **triggers the scoring process**.

---

### 4. Scoring Algorithm

Scoring runs automatically after the actual answers are submitted.

#### Name (Categorical)

| Result | Points |
|---|---|
| Correct guess | **3 points** |
| Incorrect guess | **0 points** |

#### All Other Categories (Proximity-Based Rank Scoring)

The other four categories are scored by **ranking participants from closest to furthest** from the actual value:

- **1st place** (closest guess) → **1 point**
- **2nd place** → **2 points**
- ...
- **Last place** (furthest guess) → **N points** (where N = total number of participants)

> Lower score = better performance (like golf scoring).

**Tie-breaking**: If two participants are equally close to the actual value, they share the same rank and both receive that rank's point value. The next rank is skipped accordingly.

#### Categories Scored by Proximity

- **Date of Birth** — difference in days
- **Time of Birth** — difference in minutes, ignoring date. **Wraps around midnight**: the comparison uses the shorter arc of the 24-hour clock (e.g., 11:58 PM and 12:02 AM are 4 minutes apart, not 1436 minutes apart).
- **Weight** — convert lbs + oz to total ounces, then compare absolute difference
- **Height** — absolute difference in inches

#### Total Score

Each participant's **total score = sum of points across all 5 categories**.

> **Lower total score = better** (minimum possible score = 1 + 1 + 1 + 1 + 0 = 4).

---

### 5. Leaderboard

- Accessible via a `/leaderboard` route.
- **Hidden until the admin has submitted the actual answers.** Visiting `/leaderboard` before scoring is complete shows a "Results not yet available" message.
- Once scoring is complete, shows all participants ranked by **total score (ascending — lowest is best)**.
- Displays:
  - Rank
  - Participant name
  - Points per category (Name, DOB, TOB, Weight, Height)
  - Total score
  - 🏆 Winner highlighted (lowest total score)
- If there is a tie for first, display **co-winners**.

---

## Data Storage

### Strategy: Vercel KV (Serverless Redis)

All data lives in a **Vercel KV** store, accessed via the `@vercel/kv` SDK from Next.js API routes. Vercel KV is a first-party Vercel integration backed by Upstash Redis — it supports atomic operations, has a generous free tier, and requires no external database setup.

Vercel automatically injects the required environment variables when you link a KV store to your project in the Vercel dashboard:

```env
KV_REST_API_URL=https://...upstash.io
KV_REST_API_TOKEN=your_kv_token
```

### KV Data Shape

Two keys are used:

**`guesses`** — a Redis list (or JSON array stored as a string) of all participant submissions:

```json
[
  {
    "participant": "Jane Doe",
    "submittedAt": "2025-01-01T12:00:00Z",
    "name": "Oliver",
    "dateOfBirth": "2025-01-15",
    "timeOfBirth": "14:30",
    "weightLbs": 7,
    "weightOz": 4,
    "heightIn": 20.5
  }
]
```

**`actualAnswers`** — `null` (or absent) until the admin submits; then stores the real baby details (same shape as a guess entry, minus `participant` and `submittedAt`).

- All reads/writes go through Next.js API routes using the `@vercel/kv` SDK.
- No initial seed file is required — keys are simply absent until first write.

---

## API Routes (Next.js)

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/guesses` | Returns all guesses + actual answers |
| `POST` | `/api/guesses` | Submits a new guess |
| `POST` | `/api/answers` | Admin: submit actual answers (password-protected) |
| `GET` | `/api/leaderboard` | Returns scored + ranked results (only if actual answers exist) |

---

## Pages / Routes

| Route | Description |
|---|---|
| `/` | Identity selection → guess form |
| `/success` | Confirmation after guess submission |
| `/admin` | Actual answer entry — **no link anywhere in the app UI; navigate directly by URL. Password-protected.** |
| `/leaderboard` | Final ranked results — shows "not available" message until actual answers are submitted |

---

## Environment Variables

```env
ADMIN_PASSWORD=your_secret_password

# Vercel KV — auto-injected when you link a KV store in the Vercel dashboard
KV_REST_API_URL=https://...upstash.io
KV_REST_API_TOKEN=your_kv_token
```

`ADMIN_PASSWORD` must be set manually in Vercel project settings. The `KV_REST_API_*` variables are injected automatically by Vercel when a KV store is linked to the project.

---

## Resolved Decisions

| # | Decision | Resolution |
|---|---|---|
| 1 | Participant names | Placeholder list in `src/config/participants.ts` — fill in before deploying |
| 2 | Baby name options | Placeholder list in `src/config/babyNames.ts` — fill in before deploying |
| 3 | Persistence strategy | **Vercel KV** (serverless Redis via `@vercel/kv`) |
| 4 | Admin route visibility | **Fully hidden** — no link anywhere in the UI, navigate directly by URL |
| 5 | Leaderboard visibility | **Hidden** until actual answers are submitted by admin |
| 6 | Time of birth scoring | **Wraps around midnight** — uses shortest arc of 24-hour clock |

---

## Baby Name Options

Defined in `src/config/babyNames.ts` — **fill in the real names before deploying**.

```ts
// src/config/babyNames.ts
export const BABY_NAME_OPTIONS = [
  "Name Option A",
  "Name Option B",
];
```

---

## Deployment Checklist

- [ ] Fill in real participant names in `src/config/participants.ts`
- [ ] Fill in real baby name options in `src/config/babyNames.ts`
- [ ] Create a Vercel KV store in the Vercel dashboard and link it to the project (auto-injects `KV_REST_API_URL` and `KV_REST_API_TOKEN`)
- [ ] Set `ADMIN_PASSWORD` in Vercel project settings
- [ ] Run `npm run build` locally and verify no TypeScript/build errors
- [ ] Deploy via Vercel dashboard or `vercel --prod` CLI
