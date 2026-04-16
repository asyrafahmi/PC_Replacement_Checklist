import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const REMARK_TAG = "SYSTEM_SEED_JAN2025_20260416";
const TARGET_COUNT = 50;

function readEnvFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const env = {};

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equalsIndex = line.indexOf("=");
    if (equalsIndex <= 0) continue;
    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1).trim();
    env[key] = value;
  }

  return env;
}

function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function weightedPick(random, options) {
  const roll = random();
  let cumulative = 0;
  for (const option of options) {
    cumulative += option.weight;
    if (roll <= cumulative) return option.value;
  }
  return options[options.length - 1].value;
}

function checklistStatus(random) {
  const roll = random();
  if (roll <= 0.66) return "Yes";
  if (roll <= 0.84) return "N/A";
  return "No";
}

function makeChecklist(items, random) {
  return items.map((item) => {
    const status = checklistStatus(random);
    const remark = status === "No" ? "Follow-up required" : status === "Yes" ? "Verified" : "Not applicable";
    return { ...item, status, remark };
  });
}

function createRows(startIndex, amount) {
  const random = seededRandom(20260416 + startIndex);
  const startDate = new Date("2025-01-01T09:00:00");
  const endDate = new Date();
  const span = Math.max(endDate.getTime() - startDate.getTime(), 1);

  const beforeItems = [
    { no: 1, name: "Backup user personal files/data", detail: "Desktop, My Documents, Scanner folder, etc" },
    { no: 2, name: "Backup Lotus Notes email DB .nsf files", detail: "" },
    { no: 4, name: "Backup Favourites list", detail: "" },
    { no: 5, name: "Backup PC Name / IP Address", detail: "" },
    { no: 6, name: "List down Lotus Notes DB in use", detail: "" },
    { no: 7, name: "List down printer model & IP", detail: "" },
    { no: 8, name: "List down all other applications", detail: "" }
  ];

  const afterItems = [
    { no: 1, name: "Configure PC Name - Join Domain", detail: "" },
    { no: 2, name: "Configure user profile", detail: "" },
    { no: 3, name: "Install Antivirus", detail: "" },
    { no: 4, name: "Restore user data", detail: "" },
    { no: 5, name: "Configure Outlook email / Teams", detail: "" },
    { no: 6, name: "Install printer, configure scan folder & test it", detail: "" },
    { no: 7, name: "Configure Lotus Notes client", detail: "" },
    { no: 8, name: "Configure AS400 Client Session", detail: "" },
    { no: 9, name: "Activate O365 and Windows", detail: "" },
    { no: 10, name: "Ensure all new boxes,plastic, etc disposed accordingly", detail: "" }
  ];

  const branches = ["HQ", "Johor Bahru", "Penang", "Kuantan", "Kuching", "Kota Kinabalu", "Ipoh", "Melaka"];
  const staffNames = ["Aina Rahman", "Nur Izzati", "Syafiq Ahmad", "Daniel Lim", "Farah Nabila", "Ravi Kumar", "Zulhilmi Ismail", "Sarah Lee", "Hafiz Hamdan", "Amirul Hakim"];
  const workflowStatus = [
    { value: "Completed", weight: 0.46 },
    { value: "In Progress", weight: 0.22 },
    { value: "Pending", weight: 0.24 },
    { value: "On Hold", weight: 0.08 }
  ];

  return Array.from({ length: amount }, (_, offset) => {
    const absoluteIndex = startIndex + offset;
    const spread = (absoluteIndex + random()) / Math.max(TARGET_COUNT - 1, 1);
    const createdAt = new Date(startDate.getTime() + Math.floor(span * spread));
    createdAt.setHours(9 + Math.floor(random() * 8), Math.floor(random() * 60), Math.floor(random() * 50), 0);

    const staffName = staffNames[Math.floor(random() * staffNames.length)];
    const branch = branches[Math.floor(random() * branches.length)];
    const status = weightedPick(random, workflowStatus);

    const rowNo = absoluteIndex + 1;

    return {
      branch,
      department: branch,
      date: createdAt.toISOString().slice(0, 10),
      installation_date: createdAt.toISOString().slice(0, 10),
      staff_name: staffName,
      user_full_name: staffName,
      user_name: staffName,
      staff_id_number: `CTC${String(21000 + rowNo)}`,
      pc_nb_number: `NB${String(24000 + rowNo).padStart(6, "0")}`,
      new_serial_number: `NB${String(24000 + rowNo).padStart(6, "0")}`,
      old_pc_serial_number: `OLDPC${String(30000 + rowNo).padStart(6, "0")}`,
      new_pc_serial_number: `NEWPC${String(40000 + rowNo).padStart(6, "0")}`,
      old_monitor_serial_number: `OLDMN${String(50000 + rowNo).padStart(6, "0")}`,
      new_monitor_serial_number: `NEWMN${String(60000 + rowNo).padStart(6, "0")}`,
      old_hostname: `OLD-HOST-${String(rowNo).padStart(3, "0")}`,
      new_hostname: `NEW-HOST-${String(rowNo).padStart(3, "0")}`,
      old_ip_address: `10.10.${10 + (rowNo % 20)}.${20 + (rowNo % 80)}`,
      new_ip_address: `10.20.${10 + (rowNo % 20)}.${20 + (rowNo % 80)}`,
      ip_address: `10.20.${10 + (rowNo % 20)}.${20 + (rowNo % 80)}`,
      pc_serial_remark: "Seeded record",
      monitor_serial_remark: "Seeded record",
      hostname_remark: "Seeded record",
      ip_address_remark: "Seeded record",
      before_replace: makeChecklist(beforeItems, random),
      after_replace: makeChecklist(afterItems, random),
      verification: {
        engineer: { mode: "type", text: "Seed Engineer", dataUrl: "", datetime: createdAt.toISOString().slice(0, 16) },
        staff: { mode: "type", text: staffName, dataUrl: "", datetime: createdAt.toISOString().slice(0, 16) }
      },
      engineer_name: "Seed Engineer",
      remark: REMARK_TAG,
      status,
      created_at: createdAt.toISOString()
    };
  });
}

async function main() {
  const projectRoot = path.resolve(process.cwd());
  const envFile = path.join(projectRoot, ".env");
  const env = readEnvFile(envFile);

  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { count, error: countError } = await supabase
    .from("checklist_submissions")
    .select("id", { count: "exact", head: true })
    .eq("remark", REMARK_TAG);

  if (countError) {
    throw new Error(`Count query failed: ${countError.message}`);
  }

  const existing = count || 0;
  const missing = Math.max(TARGET_COUNT - existing, 0);

  if (!missing) {
    console.log(`Seed already complete: ${existing}/${TARGET_COUNT} records with tag ${REMARK_TAG}`);
    return;
  }

  const rows = createRows(existing, missing);
  const { error: insertError } = await supabase.from("checklist_submissions").insert(rows);

  if (insertError) {
    throw new Error(`Insert failed: ${insertError.message}`);
  }

  const { count: totalCount, error: totalError } = await supabase
    .from("checklist_submissions")
    .select("id", { count: "exact", head: true });

  if (totalError) {
    throw new Error(`Total count query failed: ${totalError.message}`);
  }

  console.log(`Inserted ${missing} seeded rows into Supabase.`);
  console.log(`Total checklist_submissions rows now: ${totalCount}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
