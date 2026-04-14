# IT Checklist Web Form

A web version of your Excel checklist with:
- Form tab for checklist submission
- History tab with Excel export
- Analysis tab with performance charts
- Free online database integration using Supabase

## Live Website

- Website: https://asyrafahmi.github.io/PC_Replacement_Checklist/
- Source code: https://github.com/asyrafahmi/PC_Replacement_Checklist

Anyone can open the website link from any computer or mobile browser.

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

## 7) Publish With GitHub Pages (Automatic)

This repository includes a GitHub Actions workflow that deploys the app to GitHub Pages on every push to `main`.

1. Open repository **Settings > Pages**.
2. Under **Build and deployment**, choose **Source: GitHub Actions**.
3. Push any commit to `main`.
4. Wait for the workflow **Deploy to GitHub Pages** to complete in the **Actions** tab.
5. Open: https://asyrafahmi.github.io/PC_Replacement_Checklist/

Optional for online Supabase mode:

1. Open **Settings > Secrets and variables > Actions**.
2. Add repository secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

If secrets are not set, the website still opens and works in local/demo mode in each browser.

## Notes

- This template allows public read/insert for fast internal rollout.
- For stricter security, add authentication and restrict RLS policies.
