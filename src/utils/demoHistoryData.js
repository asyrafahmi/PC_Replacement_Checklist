const BEFORE_ITEMS = [
  { no: 1, name: "Backup user personal files/data", detail: "Desktop, My Documents, Scanner folder, etc" },
  { no: 2, name: "Backup Lotus Notes email DB .nsf files", detail: "" },
  { no: 4, name: "Backup Favourites list", detail: "" },
  { no: 5, name: "Backup PC Name / IP Address", detail: "" },
  { no: 6, name: "List down Lotus Notes DB in use", detail: "" },
  { no: 7, name: "List down printer model & IP", detail: "" },
  { no: 8, name: "List down all other applications", detail: "" }
];

const AFTER_ITEMS = [
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

const BRANCHES = ["HQ", "Johor Bahru", "Penang", "Kuantan", "Kuching", "Kota Kinabalu", "Ipoh", "Melaka"];
const STAFF = [
  "Aina Rahman",
  "Nur Izzati",
  "Syafiq Ahmad",
  "Daniel Lim",
  "Farah Nabila",
  "Ravi Kumar",
  "Zulhilmi Ismail",
  "Sarah Lee",
  "Hafiz Hamdan",
  "Amirul Hakim"
];

const WORKFLOW_STATUS = [
  { value: "Completed", weight: 0.46 },
  { value: "In Progress", weight: 0.22 },
  { value: "Pending", weight: 0.24 },
  { value: "On Hold", weight: 0.08 }
];

function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function weightedPick(random, items) {
  const value = random();
  let cumulative = 0;
  for (const item of items) {
    cumulative += item.weight;
    if (value <= cumulative) return item.value;
  }
  return items[items.length - 1].value;
}

function checklistStatus(random) {
  const value = random();
  if (value <= 0.66) return "Yes";
  if (value <= 0.84) return "N/A";
  return "No";
}

function buildChecklist(items, random) {
  return items.map((item) => {
    const status = checklistStatus(random);
    const remark = status === "No" ? "Follow-up required" : status === "Yes" ? "Verified" : "Not applicable";
    return { ...item, status, remark };
  });
}

function serial(prefix, index) {
  return `${prefix}${String(index).padStart(5, "0")}`;
}

export function createDemoHistoryRows(total = 50) {
  const random = seededRandom(20260416);
  const startDate = new Date("2025-01-01T09:00:00");
  const endDate = new Date();
  const span = Math.max(endDate.getTime() - startDate.getTime(), 1);

  return Array.from({ length: total }, (_, index) => {
    const spread = (index + random()) / Math.max(total - 1, 1);
    const createdAt = new Date(startDate.getTime() + Math.floor(span * spread));
    createdAt.setHours(9 + Math.floor(random() * 8), Math.floor(random() * 60), Math.floor(random() * 50), 0);

    const staffName = STAFF[Math.floor(random() * STAFF.length)];
    const branch = BRANCHES[Math.floor(random() * BRANCHES.length)];
    const status = weightedPick(random, WORKFLOW_STATUS);

    return {
      id: `demo-${index + 1}`,
      branch,
      department: branch,
      date: createdAt.toISOString().slice(0, 10),
      installation_date: createdAt.toISOString().slice(0, 10),
      staff_name: staffName,
      user_full_name: staffName,
      user_name: staffName,
      staff_id_number: `CTC${String(21000 + index)}`,
      pc_nb_number: serial("NB", 24000 + index + 1),
      new_serial_number: serial("NB", 24000 + index + 1),
      old_pc_serial_number: serial("OLDPC", 30000 + index + 1),
      new_pc_serial_number: serial("NEWPC", 40000 + index + 1),
      old_monitor_serial_number: serial("OLDMN", 50000 + index + 1),
      new_monitor_serial_number: serial("NEWMN", 60000 + index + 1),
      old_hostname: `OLD-HOST-${String(index + 1).padStart(3, "0")}`,
      new_hostname: `NEW-HOST-${String(index + 1).padStart(3, "0")}`,
      old_ip_address: `10.10.${10 + (index % 20)}.${20 + (index % 80)}`,
      new_ip_address: `10.20.${10 + (index % 20)}.${20 + (index % 80)}`,
      ip_address: `10.20.${10 + (index % 20)}.${20 + (index % 80)}`,
      pc_serial_remark: "Generated demo record",
      monitor_serial_remark: "Generated demo record",
      hostname_remark: "Generated demo record",
      ip_address_remark: "Generated demo record",
      before_replace: buildChecklist(BEFORE_ITEMS, random),
      after_replace: buildChecklist(AFTER_ITEMS, random),
      remark: "Demo checklist data for dashboard variety",
      verification: {
        engineer: {
          mode: "type",
          text: "Demo Engineer",
          dataUrl: "",
          datetime: createdAt.toISOString().slice(0, 16)
        },
        staff: {
          mode: "type",
          text: staffName,
          dataUrl: "",
          datetime: createdAt.toISOString().slice(0, 16)
        }
      },
      status,
      engineer_name: "Demo Engineer",
      created_at: createdAt.toISOString(),
      __source: "demo"
    };
  });
}
