# IT Checklist Web Form (SQLite Edition)

A web checklist app for PC/NB replacement with:
- Spreadsheet-style form
- Signature capture (draw or type)
- Submission history
- Excel export
- Performance charts
- SQLite database (local file)

## Live Links

- Source code: https://github.com/asyrafahmi/PC_Replacement_Checklist
- Static frontend (GitHub Pages): https://asyrafahmi.github.io/PC_Replacement_Checklist/

Important:
- GitHub Pages can host the frontend only.
- SQLite runs on the server side, so full database features require the Node API server running.

## 1) Prerequisites

1. Install Node.js LTS (includes npm): https://nodejs.org

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

4. Optional: edit `.env` values:

```env
VITE_API_BASE_URL=http://localhost:3001
PORT=3001
```

## 3) SQLite Setup

No separate database server installation is required.

When you run the backend, it automatically creates:
- database file: `server/data/checklist.db`
- required table: `checklist_submissions`

You can also review the schema in `sqlite-schema.sql`.

## 4) Run App (Frontend + SQLite API)

```bash
npm run dev
```

This starts:
- Vite frontend at `http://localhost:5173`
- Express + SQLite API at `http://localhost:3001`

## 5) API Quick Check

Open this in browser:

`http://localhost:3001/api/health`

Expected response:

```json
{"ok":true,"database":".../server/data/checklist.db"}
```

## 6) Seed Dummy Data

To insert 10 completed sample submissions into SQLite:

```bash
npm run seed
```

Use `npm run seed -- --replace` if you want to clear the table first and rebuild the demo data.

## 7) How To Use

1. Open the form tab.
2. Fill checklist details.
3. Click Submit Checklist.
4. Open History tab to view saved records.
5. Export records using Export to Excel.

## 8) Build Frontend

```bash
npm run build
npm run preview
```

## 9) Deployment Notes

- GitHub Pages hosts only static frontend files.
- SQLite requires a running Node server, so full app deployment should use a platform that supports Node processes and persistent disk.
- Good options: Render, Railway, VPS, or internal company server.

## 10) Deploy Full App on Render (Recommended)

This repository now includes `render.yaml` for one-click Blueprint deploy.

Quick steps:

1. Push latest code to GitHub.
2. In Render dashboard, create a **Blueprint** from this repository.
3. Wait for deploy to finish.
4. Open your Render URL and verify `/api/health`.

Full guide:

- See `RENDER_DEPLOYMENT.md`

## Notes

- If API is unavailable, the app temporarily falls back to local browser storage to avoid data loss.
- For team usage, run one shared backend server so everyone writes to the same SQLite file.
