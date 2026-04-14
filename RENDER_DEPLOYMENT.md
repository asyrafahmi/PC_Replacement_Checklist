# Render Deployment Guide (SQLite + Frontend + API)

This project can run on Render as a single Node web service:
- React frontend (built files from `dist`)
- Express API (`/api/*`)
- SQLite database on a persistent Render disk

## 1) Push Latest Code

```bash
git add .
git commit -m "Migrate to SQLite and add Render deployment"
git push
```

## 2) Create Render Service

1. Go to https://dashboard.render.com
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository: `asyrafahmi/PC_Replacement_Checklist`.
4. Render detects `render.yaml` automatically.
5. Click **Apply**.

Render will create:
- 1 web service (`pc-replacement-checklist`)
- 1 persistent disk mounted at `/var/data`

## 3) Environment Variables

`render.yaml` already sets:
- `NODE_VERSION=24`
- `SQLITE_DB_DIR=/var/data`

No additional env vars are required for SQLite mode.

## 4) Verify Deployment

After deployment is live:

1. Open your Render URL (example: `https://pc-replacement-checklist.onrender.com`).
2. Open health endpoint:
   - `https://pc-replacement-checklist.onrender.com/api/health`
3. Submit one checklist in the UI.
4. Confirm it appears in **History**.

## 5) SQLite Data Location on Render

Database file path is:
- `/var/data/checklist.db`

Because this path is on a persistent disk, data survives redeploys and restarts.

## 6) Notes

- Keep GitHub Pages for static demo if you want, but full database mode should use Render URL.
- On Render free tier, first request after idle may be slow while service wakes up.
