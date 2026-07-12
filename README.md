# Baby Guessing Game

A React web app where participants submit guesses about a newborn baby's details (birth date/time, weight, and height). Once the actual answers are entered by an admin, the app scores everyone's guesses and displays a leaderboard. The app uses Supabase for persistent data storage, and can also fall back to a local JSON file for easy local development without setting up a database.

## Technologies

- **Framework**: Next.js (React)
- **Language**: TypeScript
- **Storage**: Supabase (Postgres) — accessed via `@supabase/supabase-js`. A local JSON fallback is available for local development.
- **Deployment**: Vercel

## How to Deploy Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env.local` file. You can copy the contents of `.env.local.example` if it exists.
   You will need to set:
   ```env
   ADMIN_PASSWORD=your_secret_password
   ```
   *Optional:* If you want to use Supabase locally instead of the local JSON fallback (`.local-db.json`), add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## How to Deploy to Vercel

1. Push your code to a GitHub, GitLab, or Bitbucket repository.
2. Log in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your repository.
4. Open the **Environment Variables** section and add the following keys:
   - `ADMIN_PASSWORD`: A secure password for the admin panel.
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (used for secure server-side admin access).
   - `SUPABASE_URL`: (Optional) Can be used in place of NEXT_PUBLIC_SUPABASE_URL for server-only access.
5. Click **Deploy**.

## Supabase Database Setup

To use Supabase as your data store, you need to create the following tables. You can run this SQL script in the Supabase SQL Editor:

```sql
-- Create the guesses table
CREATE TABLE public.guesses (
  participant text PRIMARY KEY,
  submittedat text NOT NULL,
  birthdatetime text NOT NULL,
  weightlbs numeric NOT NULL,
  weightoz numeric NOT NULL,
  heightin numeric NOT NULL
);

-- Create the actual_answers table
CREATE TABLE public.actual_answers (
  id integer PRIMARY KEY DEFAULT 1,
  birthdatetime text NOT NULL,
  weightlbs numeric NOT NULL,
  weightoz numeric NOT NULL,
  heightin numeric NOT NULL
);

-- Row Level Security (RLS) policies (Optional, but recommended)
-- Since the app uses the SERVICE_ROLE_KEY on the server side, it bypasses RLS.
-- You can safely enable RLS and leave it restricted.
ALTER TABLE public.guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actual_answers ENABLE ROW LEVEL SECURITY;
```
