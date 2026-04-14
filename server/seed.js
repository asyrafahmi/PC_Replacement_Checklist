import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const dataDir = process.env.SQLITE_DB_DIR
  ? path.resolve(process.env.SQLITE_DB_DIR)
  : path.resolve("server", "data");
const dbPath = path.join(dataDir, "checklist.db");

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

const branches = ["HQ", "Branch A", "Branch B", "Branch C", "Branch D"];

function buildChecklist(entries) {
  return entries.map((item, index) => ({
    no: index + 1,
    name: item,
    detail: "",
    status: "Yes",
    remark: "Completed"
  }));
}

const beforeItems = [
  "Backup user personal files/data",
  "Backup Lotus Notes email DB .nsf files",
  "Backup Favourites list",
  "Backup PC Name / IP Address",
  "List down Lotus Notes DB in use",
  "List down printer model & IP",
  "List down all other applications"
];

const afterItems = [
  "Configure PC Name - Join Domain",
  "Configure user profile",
  "Install Antivirus",
  "Restore user data",
  "Configure Outlook email / Teams",
  "Install printer, configure scan folder & test it",
  "Configure Lotus Notes client",
  "Configure AS400 Client Session",
  "Activate O365 and Windows",
  "Ensure all new boxes,plastic, etc disposed accordingly"
];

const now = new Date();

const rows = Array.from({ length: 10 }, (_, index) => {
  const day = index + 1;
  const date = new Date(now.getFullYear(), now.getMonth(), day).toISOString().slice(0, 10);
  const serialSuffix = String(1000 + index);

  return {
    branch: branches[index % branches.length],
    department: branches[index % branches.length],
    date,
    installation_date: date,
    staff_name: `Staff ${day}`,
    user_full_name: `Staff ${day}`,
    staff_id_number: `ID${serialSuffix}`,
    pc_nb_number: `PCNB${serialSuffix}`,
    new_serial_number: `PCNB${serialSuffix}`,
    old_pc_serial_number: `OLDPC${serialSuffix}`,
    new_pc_serial_number: `NEWPC${serialSuffix}`,
    new_pc_serial_number_confirm: `NEWPC${serialSuffix}`,
    old_monitor_serial_number: `OLDMON${serialSuffix}`,
    new_monitor_serial_number: `NEWMON${serialSuffix}`,
    new_monitor_serial_number_confirm: `NEWMON${serialSuffix}`,
    old_hostname: `OLD-HOST-${day}`,
    new_hostname: `NEW-HOST-${day}`,
    old_ip_address: `10.0.0.${day}`,
    new_ip_address: `10.0.1.${day}`,
    ip_address: `10.0.1.${day}`,
    pc_serial_remark: "Checked",
    monitor_serial_remark: "Checked",
    hostname_remark: "Updated",
    ip_address_remark: "Updated",
    before_replace: JSON.stringify(buildChecklist(beforeItems)),
    after_replace: JSON.stringify(buildChecklist(afterItems)),
    verification: JSON.stringify({
      engineer: {
        mode: "type",
        text: `Engineer ${day}`,
        dataUrl: "",
        datetime: `${date}T09:30`
      },
      staff: {
        mode: "type",
        text: `Staff ${day}`,
        dataUrl: "",
        datetime: `${date}T09:45`
      }
    }),
    remark: "Dummy completed submission for testing",
    status: "Completed",
    engineer_name: `Engineer ${day}`,
    user_name: `Staff ${day}`,
    created_at: new Date(now.getFullYear(), now.getMonth(), day, 10, 0, 0).toISOString()
  };
});

const deleteExisting = process.argv.includes("--replace");

if (deleteExisting) {
  db.prepare("delete from checklist_submissions").run();
}

const insertMany = db.transaction((entries) => {
  for (const entry of entries) {
    insertSubmission.run(entry);
  }
});

insertMany(rows);

const total = db.prepare("select count(*) as total from checklist_submissions").get().total;

console.log(`Seeded ${rows.length} dummy completed submissions.`);
console.log(`Total rows in SQLite: ${total}`);
console.log(`Database file: ${dbPath}`);
