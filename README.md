# IT Checklist Web Form (Supabase Edition)

A web checklist app for PC/NB replacement with:
- Spreadsheet-style form
- Signature capture (draw or type)
- Submission history with detail view
- Excel export
- Performance charts
- Shared online database (Supabase PostgreSQL)

## Live Links

- Source code: https://github.com/asyrafahmi/PC_Replacement_Checklist
- Website: https://asyrafahmi.github.io/PC_Replacement_Checklist/

## Why This Setup

- Supabase is a hosted PostgreSQL database with a free tier.
- Data is online and shared, so users on any laptop can see the same history.
- No local backend server is required for normal usage.

## 1) Prerequisites

1. Node.js LTS: https://nodejs.org
2. Supabase account: https://supabase.com

## 2) Project Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env template:

```bash
copy .env.example .env
```

3. Set values in `.env`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3) Supabase Database Setup

1. Open your Supabase project.
2. Go to SQL Editor.
3. Run all SQL in `supabase-schema.sql`.
4. From Supabase Project Settings > API, copy:
	- Project URL
	- anon public key
5. Put those values into `.env`.

## 4) Run Locally

```bash
npm run dev
```

Open the URL shown by Vite (usually http://localhost:5173).

## 5) Deploy on GitHub Pages

This repo has a GitHub Actions workflow to deploy static frontend.

Required GitHub repository secrets:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Steps:
1. Open repo Settings > Secrets and variables > Actions.
2. Add both secrets above.
3. Re-run workflow `Deploy to GitHub Pages`.

## 6) How To Use

1. Open the form tab.
2. Fill checklist details.
3. Click Submit Checklist.
4. Open History tab to view shared records from Supabase.
5. Export records using Export to Excel.

## Notes

- `.env` in your local machine is not uploaded (ignored by git).
- Keep using anon key for frontend usage with proper Supabase RLS policies.
