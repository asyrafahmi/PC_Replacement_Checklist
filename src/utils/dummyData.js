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

const BRANCHES = [
  "HQ Kuala Lumpur",
  "Johor Bahru",
  "Penang",
  "Kota Kinabalu",
  "Kuching",
  "Ipoh",
  "Alor Setar",
  "Kuantan"
];

const STAFF_NAMES = [
  "Aina Rahman",
  "Daniel Lim",
  "Faridah Rosli",
  "Hakim Salleh",
  "Nurul Izzati",
  "Ravi Kumar",
  "Sarah Lee",
  "Syafiq Ahmad",
  "Siti Mariam",
  "Zulhilmi Ismail"
];

const STATUS_VALUES = ["Completed", "Pending", "In Progress", "On Hold"];

function seededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function pickByWeight(randomValue, weightedOptions) {
  let current = 0;
  for (const option of weightedOptions) {
    current += option.weight;
    if (randomValue <= current) return option.value;
  }
  return weightedOptions[weightedOptions.length - 1].value;
}

function makeChecklist(items, random) {
  const statusWeights = [
    { value: "Yes", weight: 0.68 },
    { value: "No", weight: 0.12 },
    { value: "N/A", weight: 0.2 }
  ];

  return items.map((item) => {
    const status = pickByWeight(random(), statusWeights);
    const remark =
      status === "No"
        ? "Pending follow-up"
        : status === "Yes"
          ? "Checked"
          : "Not applicable";

    return {
      ...item,
      status,
      remark
    };
  });
}

function makeSerial(prefix, random) {
  const number = String(Math.floor(random() * 8999999) + 1000000);
  return `${prefix}${number}`;
}

export function getDummyHistoryRows(count = 84) {
  const random = seededRandom(1024);
  const now = new Date();

  return Array.from({ length: count }, (_, index) => {
    const dayOffset = Math.floor(index * 4 + random() * 9);
    const createdAt = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    createdAt.setHours(Math.floor(random() * 10) + 8, Math.floor(random() * 60), 0, 0);

    const branch = BRANCHES[Math.floor(random() * BRANCHES.length)];
    const staffName = STAFF_NAMES[Math.floor(random() * STAFF_NAMES.length)];
    const beforeReplace = makeChecklist(BEFORE_ITEMS, random);
    const afterReplace = makeChecklist(AFTER_ITEMS, random);

    return {
      id: `demo-${index + 1}`,
      branch,
      department: branch,
      date: createdAt.toISOString().slice(0, 10),
      installation_date: createdAt.toISOString().slice(0, 10),
      staff_name: staffName,
      user_full_name: staffName,
      user_name: staffName,
      staff_id_number: `BNM${String(index + 101).padStart(4, "0")}`,
      pc_nb_number: makeSerial("BNMPC", random),
      new_serial_number: makeSerial("BNMPC", random),
      old_pc_serial_number: makeSerial("OLDPC", random),
      new_pc_serial_number: makeSerial("NEWPC", random),
      old_monitor_serial_number: makeSerial("OLDMN", random),
      new_monitor_serial_number: makeSerial("NEWMN", random),
      old_hostname: `OLDHOST-${String(index + 1).padStart(3, "0")}`,
      new_hostname: `NEWHOST-${String(index + 1).padStart(3, "0")}`,
      old_ip_address: `10.10.${Math.floor(random() * 40) + 10}.${Math.floor(random() * 200) + 10}`,
      new_ip_address: `10.20.${Math.floor(random() * 40) + 10}.${Math.floor(random() * 200) + 10}`,
      ip_address: `10.20.${Math.floor(random() * 40) + 10}.${Math.floor(random() * 200) + 10}`,
      pc_serial_remark: "Demo old/new serial data",
      monitor_serial_remark: "Demo monitor serial data",
      hostname_remark: "Generated for dashboard testing",
      ip_address_remark: "Generated for dashboard testing",
      before_replace: beforeReplace,
      after_replace: afterReplace,
      remark: "Dummy dataset for analysis and chart interaction",
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
      status: STATUS_VALUES[Math.floor(random() * STATUS_VALUES.length)],
      engineer_name: "Demo Engineer",
      created_at: createdAt.toISOString(),
      __demo: true
    };
  });
}
