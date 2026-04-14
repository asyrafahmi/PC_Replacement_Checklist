import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import cors from "cors";
import express from "express";

const PORT = Number(process.env.PORT || 3001);
const dataDir = process.env.SQLITE_DB_DIR
  ? path.resolve(process.env.SQLITE_DB_DIR)
  : path.resolve("server", "data");
const dbPath = path.join(dataDir, "checklist.db");
const distDir = path.resolve("dist");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  create table if not exists checklist_submissions (
    id integer primary key autoincrement,
    branch text,
    department text,
    date text,
    installation_date text,
    staff_name text,
    user_full_name text,
    staff_id_number text,
    pc_nb_number text,
    new_serial_number text,
    old_pc_serial_number text,
    new_pc_serial_number text,
    new_pc_serial_number_confirm text,
    old_monitor_serial_number text,
    new_monitor_serial_number text,
    new_monitor_serial_number_confirm text,
    old_hostname text,
    new_hostname text,
    old_ip_address text,
    new_ip_address text,
    ip_address text,
    pc_serial_remark text,
    monitor_serial_remark text,
    hostname_remark text,
    ip_address_remark text,
    before_replace text,
    after_replace text,
    verification text,
    remark text,
    status text,
    engineer_name text,
    user_name text,
    created_at text not null
  )
`);

const insertSubmission = db.prepare(`
  insert into checklist_submissions (
    branch,
    department,
    date,
    installation_date,
    staff_name,
    user_full_name,
    staff_id_number,
    pc_nb_number,
    new_serial_number,
    old_pc_serial_number,
    new_pc_serial_number,
    new_pc_serial_number_confirm,
    old_monitor_serial_number,
    new_monitor_serial_number,
    new_monitor_serial_number_confirm,
    old_hostname,
    new_hostname,
    old_ip_address,
    new_ip_address,
    ip_address,
    pc_serial_remark,
    monitor_serial_remark,
    hostname_remark,
    ip_address_remark,
    before_replace,
    after_replace,
    verification,
    remark,
    status,
    engineer_name,
    user_name,
    created_at
  ) values (
    @branch,
    @department,
    @date,
    @installation_date,
    @staff_name,
    @user_full_name,
    @staff_id_number,
    @pc_nb_number,
    @new_serial_number,
    @old_pc_serial_number,
    @new_pc_serial_number,
    @new_pc_serial_number_confirm,
    @old_monitor_serial_number,
    @new_monitor_serial_number,
    @new_monitor_serial_number_confirm,
    @old_hostname,
    @new_hostname,
    @old_ip_address,
    @new_ip_address,
    @ip_address,
    @pc_serial_remark,
    @monitor_serial_remark,
    @hostname_remark,
    @ip_address_remark,
    @before_replace,
    @after_replace,
    @verification,
    @remark,
    @status,
    @engineer_name,
    @user_name,
    @created_at
  )
`);

const selectAllSubmissions = db.prepare(`
  select * from checklist_submissions
  order by datetime(created_at) desc
`);

function safeJsonParse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeRow(row) {
  return {
    ...row,
    before_replace: safeJsonParse(row.before_replace, []),
    after_replace: safeJsonParse(row.after_replace, []),
    verification: safeJsonParse(row.verification, {})
  };
}

const app = express();

app.use(cors());
app.use(express.json({ limit: "15mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, database: dbPath });
});

app.get("/api/checklist-submissions", (_req, res) => {
  const rows = selectAllSubmissions.all().map(normalizeRow);
  res.json(rows);
});

app.post("/api/checklist-submissions", (req, res) => {
  const payload = req.body || {};

  if (!payload.branch || !payload.staff_name || !payload.pc_nb_number) {
    res.status(400).send("Branch, staff name, and PC/NB number are required.");
    return;
  }

  const createdAt = new Date().toISOString();

  const params = {
    branch: payload.branch || "",
    department: payload.department || payload.branch || "",
    date: payload.date || null,
    installation_date: payload.installation_date || payload.date || null,
    staff_name: payload.staff_name || "",
    user_full_name: payload.user_full_name || payload.staff_name || "",
    staff_id_number: payload.staff_id_number || "",
    pc_nb_number: payload.pc_nb_number || "",
    new_serial_number: payload.new_serial_number || payload.pc_nb_number || "",
    old_pc_serial_number: payload.old_pc_serial_number || "",
    new_pc_serial_number: payload.new_pc_serial_number || "",
    new_pc_serial_number_confirm: payload.new_pc_serial_number_confirm || "",
    old_monitor_serial_number: payload.old_monitor_serial_number || "",
    new_monitor_serial_number: payload.new_monitor_serial_number || "",
    new_monitor_serial_number_confirm: payload.new_monitor_serial_number_confirm || "",
    old_hostname: payload.old_hostname || "",
    new_hostname: payload.new_hostname || "",
    old_ip_address: payload.old_ip_address || "",
    new_ip_address: payload.new_ip_address || "",
    ip_address: payload.ip_address || payload.new_ip_address || "",
    pc_serial_remark: payload.pc_serial_remark || "",
    monitor_serial_remark: payload.monitor_serial_remark || "",
    hostname_remark: payload.hostname_remark || "",
    ip_address_remark: payload.ip_address_remark || "",
    before_replace: JSON.stringify(payload.before_replace || []),
    after_replace: JSON.stringify(payload.after_replace || []),
    verification: JSON.stringify(payload.verification || {}),
    remark: payload.remark || "",
    status: payload.status || "Pending",
    engineer_name: payload.engineer_name || "",
    user_name: payload.user_name || payload.staff_name || "",
    created_at: createdAt
  };

  const result = insertSubmission.run(params);
  const inserted = {
    id: result.lastInsertRowid,
    ...params,
    before_replace: payload.before_replace || [],
    after_replace: payload.after_replace || [],
    verification: payload.verification || {}
  };

  res.status(201).json(inserted);
});

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`SQLite API running at http://localhost:${PORT}`);
  console.log(`SQLite DB file: ${dbPath}`);
});
