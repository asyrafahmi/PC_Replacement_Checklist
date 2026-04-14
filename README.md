# IT Checklist Web Form

A web version of your Excel checklist with:
- Form tab for checklist submission
- History tab with Excel export
- Analysis tab with performance charts
- Free online database integration using Supabase

## 1) Prerequisites

1. Install Node.js LTS (includes npm): https://nodejs.org
2. Create a free Supabase account: https://supabase.com

## 2) Project Setup

1. Open terminal in this project folder.
2. Install dependencies:

```bash
npm install
```

3. Copy environment template:

```bash
copy .env.example .env
```

4. In `.env`, set:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3) Supabase Database Setup

1. In Supabase dashboard, open SQL Editor.
2. Run all SQL in `supabase-schema.sql`.
3. Go to Project Settings > API and copy:
   - Project URL -> `VITE_SUPABASE_URL`
   - anon public key -> `VITE_SUPABASE_ANON_KEY`

## 4) Run App

```bash
npm run dev
```

Open the local URL shown by Vite (normally http://localhost:5173).

## 5) How To Use

1. Go to **Form** tab and fill checklist details.
2. Click **Save Checklist**.
3. Go to **History** tab to review records.
4. Click **Export to Excel** to download full history.
5. Go to **Analysis** tab to view charts:
   - Status Distribution
   - Submissions by Month
   - Average Completion Rate

## 6) Build For Production

```bash
npm run build
npm run preview
```

## Notes

- This template allows public read/insert for fast internal rollout.
- For stricter security, add authentication and restrict RLS policies.
