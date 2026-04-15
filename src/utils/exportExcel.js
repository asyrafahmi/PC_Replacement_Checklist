import { Workbook } from "exceljs";

const BNM_LOGO_URL = new URL("../assets/bnm-logo.png", import.meta.url).href;
const CTC_LOGO_URL = new URL("../assets/ctc-logo.jpg", import.meta.url).href;

const FULL_COLUMNS = [
  ["id", "ID"],
  ["department", "Department"],
  ["user_full_name", "User Full Name"],
  ["installation_date", "Installation Date"],
  ["new_hostname", "New Hostname"],
  ["new_serial_number", "New Serial Number"],
  ["old_hostname", "Old Hostname"],
  ["software_flags", "Software Flags"],
  ["additional_software", "Additional Software"],
  ["before_replace", "Before Replace (JSON)"],
  ["after_replace", "After Replace (JSON)"],
  ["engineer_name", "Engineer Name"],
  ["user_name", "User Name"],
  ["status", "Status"],
  ["remark", "Remark"],
  ["created_at", "Created At"],
  ["branch", "Branch"],
  ["date", "Date"],
  ["staff_name", "Staff Name"],
  ["staff_id_number", "Staff ID Number"],
  ["pc_nb_number", "PC/NB Number"],
  ["old_pc_serial_number", "Old PC Serial Number"],
  ["new_pc_serial_number", "New PC Serial Number"],
  ["new_pc_serial_number_confirm", "New PC Serial Number Confirm"],
  ["old_monitor_serial_number", "Old Monitor Serial Number"],
  ["new_monitor_serial_number", "New Monitor Serial Number"],
  ["new_monitor_serial_number_confirm", "New Monitor Serial Number Confirm"],
  ["old_ip_address", "Old IP Address"],
  ["new_ip_address", "New IP Address"],
  ["ip_address", "IP Address"],
  ["pc_serial_remark", "PC Serial Remark"],
  ["monitor_serial_remark", "Monitor Serial Remark"],
  ["hostname_remark", "Hostname Remark"],
  ["ip_address_remark", "IP Address Remark"],
  ["verification", "Verification (JSON)"]
];

const STATUS_VALUES = ["Yes", "No", "N/A"];

function toIsoDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString();
}

function safeJson(value, fallback) {
  if (value == null) return JSON.stringify(fallback);
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify(fallback);
  }
}

function parseJsonValue(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
}

function toDisplayDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
}

function toDisplayDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function statusCounts(items) {
  const counts = { Yes: 0, No: 0, "N/A": 0 };
  if (!Array.isArray(items)) return counts;
  items.forEach((item) => {
    const status = item?.status;
    if (STATUS_VALUES.includes(status)) counts[status] += 1;
  });
  return counts;
}

function statusSummary(items) {
  const counts = statusCounts(items);
  return `Yes: ${counts.Yes} | No: ${counts.No} | N/A: ${counts["N/A"]}`;
}

function completionRate(items) {
  if (!Array.isArray(items) || !items.length) return "0%";
  const yes = items.filter((item) => item?.status === "Yes").length;
  return `${Math.round((yes / items.length) * 100)}%`;
}

function summarizeSoftwareFlags(flags) {
  const source = parseJsonValue(flags, {});
  const entries = Object.entries(source || {});
  if (!entries.length) return "";
  return entries
    .map(([key, value]) => `${key}: ${value ? "Yes" : "No"}`)
    .join("; ");
}

function summarizeVerification(verification) {
  const parsed = parseJsonValue(verification, {});
  const engineer = parsed?.engineer || {};
  const staff = parsed?.staff || {};
  const engineerText = `Engineer ${engineer.mode || ""}${engineer.datetime ? ` @ ${engineer.datetime}` : ""}`;
  const staffText = `Staff ${staff.mode || ""}${staff.datetime ? ` @ ${staff.datetime}` : ""}`;
  return `${engineerText}; ${staffText}`.trim();
}

function normalizeRow(row) {
  const parsedBefore = parseJsonValue(row.before_replace, []);
  const parsedAfter = parseJsonValue(row.after_replace, []);
  const parsedVerification = parseJsonValue(row.verification, {});
  const parsedSoftwareFlags = parseJsonValue(row.software_flags, {});

  return {
    ...row,
    branch: row.branch || row.department || "",
    department: row.department || row.branch || "",
    date: row.date || row.installation_date || "",
    installation_date: row.installation_date || row.date || "",
    staff_name: row.staff_name || row.user_full_name || "",
    user_full_name: row.user_full_name || row.staff_name || "",
    pc_nb_number: row.pc_nb_number || row.new_serial_number || "",
    new_serial_number: row.new_serial_number || row.pc_nb_number || "",
    new_ip_address: row.new_ip_address || row.ip_address || "",
    ip_address: row.ip_address || row.new_ip_address || "",
    software_flags: parsedSoftwareFlags,
    additional_software: row.additional_software || "",
    before_replace: Array.isArray(parsedBefore) ? parsedBefore : [],
    after_replace: Array.isArray(parsedAfter) ? parsedAfter : [],
    verification: parsedVerification || {},
    created_at: toIsoDate(row.created_at)
  };
}

function styleHeaderRow(row, color) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: color }
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FFD1D5DB" } },
      left: { style: "thin", color: { argb: "FFD1D5DB" } },
      bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
      right: { style: "thin", color: { argb: "FFD1D5DB" } }
    };
  });
}

function styleDataRow(row, even) {
  row.eachCell((cell) => {
    cell.alignment = { vertical: "top", wrapText: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: even ? "FFF8FAFC" : "FFFFFFFF" }
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FFE5E7EB" } },
      left: { style: "thin", color: { argb: "FFE5E7EB" } },
      bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
      right: { style: "thin", color: { argb: "FFE5E7EB" } }
    };
  });
}

function autoSizeColumns(worksheet, minWidth = 14, maxWidth = 48) {
  worksheet.columns.forEach((column) => {
    let widest = minWidth;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const value = cell.value == null ? "" : String(cell.value);
      widest = Math.max(widest, Math.min(maxWidth, value.length + 2));
    });
    column.width = widest;
  });
}

function setCellBackground(cell, color) {
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: color }
  };
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to convert logo image to base64."));
    reader.readAsDataURL(blob);
  });
}

async function loadLogo(workbook, url, extension) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load image: ${url}`);
  }
  const blob = await response.blob();
  const base64 = await blobToBase64(blob);
  return workbook.addImage({ base64, extension });
}

async function addLogos(worksheet, workbook, totalColumns) {
  try {
    const [bnmId, ctcId] = await Promise.all([
      loadLogo(workbook, BNM_LOGO_URL, "png"),
      loadLogo(workbook, CTC_LOGO_URL, "jpeg")
    ]);

    worksheet.addImage(bnmId, {
      tl: { col: 0.2, row: 0.2 },
      ext: { width: 140, height: 56 }
    });

    worksheet.addImage(ctcId, {
      tl: { col: Math.max(1, totalColumns - 3), row: 0.2 },
      ext: { width: 170, height: 56 }
    });
  } catch {
    // Export should still succeed even if image loading fails.
  }
}

function triggerDownload(buffer, fileName) {
  const blob = new Blob([
    buffer
  ], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function addSummarySheet(workbook, normalizedRows) {
  const worksheet = workbook.addWorksheet("Summary", {
    properties: { defaultRowHeight: 22 },
    views: [{ state: "frozen", ySplit: 4 }]
  });

  worksheet.columns = [
    { key: "label", width: 28 },
    { key: "value", width: 24 },
    { key: "label2", width: 28 },
    { key: "value2", width: 24 },
    { key: "label3", width: 28 },
    { key: "value3", width: 24 }
  ];

  worksheet.mergeCells("A1:F1");
  const title = worksheet.getCell("A1");
  title.value = "CHECKLIST SUBMISSIONS REPORT";
  title.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  title.alignment = { horizontal: "center", vertical: "middle" };
  setCellBackground(title, "FF0F766E");
  worksheet.getRow(1).height = 30;

  worksheet.mergeCells("A2:F2");
  const generated = worksheet.getCell("A2");
  generated.value = `Generated: ${new Date().toLocaleString()}`;
  generated.font = { italic: true, color: { argb: "FF334155" } };

  const total = normalizedRows.length;
  const done = normalizedRows.filter((row) => String(row.status || "").toLowerCase() === "done").length;
  const pending = normalizedRows.filter((row) => String(row.status || "").toLowerCase() !== "done").length;
  const beforeAvg = total
    ? Math.round(normalizedRows.reduce((sum, row) => sum + parseInt(completionRate(row.before_replace), 10), 0) / total)
    : 0;
  const afterAvg = total
    ? Math.round(normalizedRows.reduce((sum, row) => sum + parseInt(completionRate(row.after_replace), 10), 0) / total)
    : 0;

  const topBranches = Object.entries(
    normalizedRows.reduce((acc, row) => {
      const key = row.branch || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => `${name} (${count})`)
    .join(", ");

  const stats = [
    ["Total Submissions", total, "Done", done, "Pending", pending],
    ["Avg Before Completion", `${beforeAvg}%`, "Avg After Completion", `${afterAvg}%`, "Top Branches", topBranches || "-"]
  ];

  stats.forEach((rowValues, idx) => {
    const row = worksheet.getRow(4 + idx);
    row.values = rowValues;
    row.eachCell((cell, cellIndex) => {
      if (cellIndex % 2 === 1) {
        cell.font = { bold: true, color: { argb: "FF1F2937" } };
      }
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } }
      };
      if (idx === 0) setCellBackground(cell, "FFF1F5F9");
    });
  });

  await addLogos(worksheet, workbook, 6);
}

function addReadableDataSheet(workbook, normalizedRows) {
  const worksheet = workbook.addWorksheet("Readable Data", {
    properties: { defaultRowHeight: 20 },
    views: [{ state: "frozen", ySplit: 2 }]
  });

  worksheet.columns = [
    { header: "ID", key: "id", width: 8 },
    { header: "Branch", key: "branch", width: 18 },
    { header: "Date", key: "date", width: 14 },
    { header: "Staff", key: "staff", width: 20 },
    { header: "Staff ID", key: "staffId", width: 14 },
    { header: "PC/NB", key: "pcNb", width: 14 },
    { header: "Status", key: "status", width: 12 },
    { header: "Old Hostname", key: "oldHost", width: 18 },
    { header: "New Hostname", key: "newHost", width: 18 },
    { header: "Old IP", key: "oldIp", width: 14 },
    { header: "New IP", key: "newIp", width: 14 },
    { header: "Before Summary", key: "beforeSummary", width: 26 },
    { header: "After Summary", key: "afterSummary", width: 26 },
    { header: "Before Completion", key: "beforeRate", width: 16 },
    { header: "After Completion", key: "afterRate", width: 16 },
    { header: "Software Flags", key: "software", width: 36 },
    { header: "Additional Software", key: "additional", width: 26 },
    { header: "Verification", key: "verification", width: 34 },
    { header: "Engineer", key: "engineer", width: 18 },
    { header: "Created At", key: "createdAt", width: 22 },
    { header: "Remark", key: "remark", width: 40 }
  ];

  styleHeaderRow(worksheet.getRow(1), "FF1E3A8A");

  normalizedRows.forEach((row, rowIndex) => {
    const dataRow = worksheet.addRow({
      id: row.id,
      branch: row.branch,
      date: toDisplayDate(row.date || row.installation_date),
      staff: row.staff_name || row.user_full_name,
      staffId: row.staff_id_number,
      pcNb: row.pc_nb_number || row.new_serial_number,
      status: row.status,
      oldHost: row.old_hostname,
      newHost: row.new_hostname,
      oldIp: row.old_ip_address,
      newIp: row.new_ip_address || row.ip_address,
      beforeSummary: statusSummary(row.before_replace),
      afterSummary: statusSummary(row.after_replace),
      beforeRate: completionRate(row.before_replace),
      afterRate: completionRate(row.after_replace),
      software: summarizeSoftwareFlags(row.software_flags),
      additional: row.additional_software,
      verification: summarizeVerification(row.verification),
      engineer: row.engineer_name,
      createdAt: toDisplayDateTime(row.created_at),
      remark: row.remark
    });
    styleDataRow(dataRow, rowIndex % 2 === 0);
  });

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columns.length }
  };

  autoSizeColumns(worksheet, 10, 48);
}

async function addFullDataSheet(workbook, normalizedRows) {
  const worksheet = workbook.addWorksheet("Checklist Data", {
    properties: { defaultRowHeight: 20 },
    views: [{ state: "frozen", ySplit: 4 }]
  });

  worksheet.columns = FULL_COLUMNS.map(([key]) => ({ key, width: 18 }));
  const totalColumns = FULL_COLUMNS.length;

  worksheet.mergeCells(1, 1, 1, totalColumns);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = "CHECKLIST SUBMISSIONS - FULL DATA";
  titleCell.font = { bold: true, size: 15, color: { argb: "FFFFFFFF" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  setCellBackground(titleCell, "FF0F766E");

  worksheet.mergeCells(2, 1, 2, totalColumns);
  worksheet.getCell(2, 1).value = `Generated: ${new Date().toLocaleString()}`;
  worksheet.getCell(2, 1).font = { italic: true, color: { argb: "FF334155" } };

  const headerRowIndex = 4;
  const headerRow = worksheet.getRow(headerRowIndex);
  FULL_COLUMNS.forEach(([, header], idx) => {
    headerRow.getCell(idx + 1).value = header;
  });
  styleHeaderRow(headerRow, "FF1E3A8A");

  normalizedRows.forEach((row, rowIndex) => {
    const values = FULL_COLUMNS.map(([key]) => {
      const rawValue = row[key];
      if (key === "before_replace" || key === "after_replace" || key === "verification" || key === "software_flags") {
        return safeJson(rawValue, key === "software_flags" ? {} : []);
      }
      return rawValue == null ? "" : rawValue;
    });

    const dataRow = worksheet.addRow(values);
    styleDataRow(dataRow, rowIndex % 2 === 0);
  });

  worksheet.autoFilter = {
    from: { row: headerRowIndex, column: 1 },
    to: { row: headerRowIndex, column: totalColumns }
  };

  autoSizeColumns(worksheet);
  await addLogos(worksheet, workbook, totalColumns);
}

function addChecklistSheet(workbook, normalizedRows, sheetName, sectionKey, headerColor) {
  const worksheet = workbook.addWorksheet(sheetName, {
    properties: { defaultRowHeight: 20 },
    views: [{ state: "frozen", ySplit: 2 }]
  });

  worksheet.columns = [
    { header: "Submission ID", key: "id", width: 14 },
    { header: "Branch", key: "branch", width: 18 },
    { header: "Staff Name", key: "staff", width: 24 },
    { header: "No", key: "no", width: 8 },
    { header: "Item", key: "item", width: 40 },
    { header: "Detail", key: "detail", width: 28 },
    { header: "Status", key: "status", width: 12 },
    { header: "Remark", key: "remark", width: 28 }
  ];

  const title = worksheet.getCell(1, 1);
  worksheet.mergeCells(1, 1, 1, 8);
  title.value = sheetName;
  title.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
  title.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: headerColor }
  };
  title.alignment = { horizontal: "center", vertical: "middle" };

  const headerRow = worksheet.getRow(2);
  styleHeaderRow(headerRow, headerColor);

  let line = 0;
  normalizedRows.forEach((row) => {
    const checklist = Array.isArray(row[sectionKey]) ? row[sectionKey] : [];
    if (!checklist.length) {
      const dataRow = worksheet.addRow({
        id: row.id,
        branch: row.branch,
        staff: row.staff_name,
        no: "",
        item: "",
        detail: "",
        status: "",
        remark: ""
      });
      styleDataRow(dataRow, line % 2 === 0);
      line += 1;
      return;
    }

    checklist.forEach((entry) => {
      const dataRow = worksheet.addRow({
        id: row.id,
        branch: row.branch,
        staff: row.staff_name,
        no: entry?.no ?? "",
        item: entry?.name ?? "",
        detail: entry?.detail ?? "",
        status: entry?.status ?? "",
        remark: entry?.remark ?? ""
      });
      styleDataRow(dataRow, line % 2 === 0);
      line += 1;
    });
  });

  worksheet.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: 2, column: 8 }
  };
}

function addVerificationSheet(workbook, normalizedRows) {
  const worksheet = workbook.addWorksheet("Verification", {
    properties: { defaultRowHeight: 20 },
    views: [{ state: "frozen", ySplit: 2 }]
  });

  worksheet.columns = [
    { header: "Submission ID", key: "id", width: 14 },
    { header: "Branch", key: "branch", width: 18 },
    { header: "Staff Name", key: "staff_name", width: 24 },
    { header: "Engineer Name", key: "engineer_name", width: 24 },
    { header: "Engineer Mode", key: "engineer_mode", width: 14 },
    { header: "Engineer Text", key: "engineer_text", width: 30 },
    { header: "Engineer DateTime", key: "engineer_datetime", width: 24 },
    { header: "Engineer Signature Captured", key: "engineer_has_drawing", width: 22 },
    { header: "Staff Mode", key: "staff_mode", width: 14 },
    { header: "Staff Text", key: "staff_text", width: 30 },
    { header: "Staff DateTime", key: "staff_datetime", width: 24 },
    { header: "Staff Signature Captured", key: "staff_has_drawing", width: 22 },
    { header: "Verification JSON", key: "verification_json", width: 42 }
  ];

  const title = worksheet.getCell(1, 1);
  worksheet.mergeCells(1, 1, 1, 13);
  title.value = "Verification Details";
  title.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
  title.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFB45309" }
  };
  title.alignment = { horizontal: "center", vertical: "middle" };

  styleHeaderRow(worksheet.getRow(2), "FFB45309");

  normalizedRows.forEach((row, index) => {
    const engineer = row.verification?.engineer || {};
    const staff = row.verification?.staff || {};

    const dataRow = worksheet.addRow({
      id: row.id,
      branch: row.branch,
      staff_name: row.staff_name,
      engineer_name: row.engineer_name,
      engineer_mode: engineer.mode || "",
      engineer_text: engineer.text || "",
      engineer_datetime: engineer.datetime || "",
      engineer_has_drawing: engineer.dataUrl ? "Yes" : "No",
      staff_mode: staff.mode || "",
      staff_text: staff.text || "",
      staff_datetime: staff.datetime || "",
      staff_has_drawing: staff.dataUrl ? "Yes" : "No",
      verification_json: safeJson(row.verification, {})
    });

    styleDataRow(dataRow, index % 2 === 0);
  });

  worksheet.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: 2, column: 13 }
  };
}

function addRawJsonSheet(workbook, normalizedRows) {
  const worksheet = workbook.addWorksheet("Raw JSON", {
    properties: { defaultRowHeight: 20 },
    views: [{ state: "frozen", ySplit: 1 }]
  });

  worksheet.columns = [
    { header: "ID", key: "id", width: 10 },
    { header: "Software Flags JSON", key: "software_flags_json", width: 36 },
    { header: "Before Replace JSON", key: "before_replace_json", width: 60 },
    { header: "After Replace JSON", key: "after_replace_json", width: 60 },
    { header: "Verification JSON", key: "verification_json", width: 60 }
  ];

  styleHeaderRow(worksheet.getRow(1), "FF334155");

  normalizedRows.forEach((row, index) => {
    const dataRow = worksheet.addRow({
      id: row.id,
      software_flags_json: safeJson(row.software_flags, {}),
      before_replace_json: safeJson(row.before_replace, []),
      after_replace_json: safeJson(row.after_replace, []),
      verification_json: safeJson(row.verification, {})
    });
    styleDataRow(dataRow, index % 2 === 0);
  });

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 5 }
  };
}

export async function exportHistoryToExcel(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    alert("No history data available to export.");
    return;
  }

  const normalizedRows = rows.map(normalizeRow);
  const workbook = new Workbook();
  workbook.creator = "IT Checklist Web Form";
  workbook.created = new Date();

  await addSummarySheet(workbook, normalizedRows);
  addReadableDataSheet(workbook, normalizedRows);
  await addFullDataSheet(workbook, normalizedRows);
  addChecklistSheet(workbook, normalizedRows, "Before Replace", "before_replace", "FF0F766E");
  addChecklistSheet(workbook, normalizedRows, "After Replace", "after_replace", "FF2563EB");
  addVerificationSheet(workbook, normalizedRows);
  addRawJsonSheet(workbook, normalizedRows);

  const buffer = await workbook.xlsx.writeBuffer();
  triggerDownload(buffer, "it-checklist-history-full.xlsx");
}
