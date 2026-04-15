import { Workbook } from "exceljs";

const BNM_LOGO_URL = new URL("../assets/bnm-logo.png", import.meta.url).href;
const CTC_LOGO_URL = new URL("../assets/ctc-logo.jpg", import.meta.url).href;

const TABLE_COLUMNS = [
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

function normalizeRow(row) {
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
    software_flags: row.software_flags ?? {},
    additional_software: row.additional_software || "",
    before_replace: Array.isArray(row.before_replace) ? row.before_replace : [],
    after_replace: Array.isArray(row.after_replace) ? row.after_replace : [],
    verification: row.verification || {},
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

async function addRawDataSheet(workbook, normalizedRows) {
  const worksheet = workbook.addWorksheet("Checklist Data", {
    properties: { defaultRowHeight: 20 },
    views: [{ state: "frozen", ySplit: 5 }]
  });

  const totalColumns = TABLE_COLUMNS.length;
  worksheet.mergeCells(3, 1, 3, totalColumns);
  const titleCell = worksheet.getCell(3, 1);
  titleCell.value = "CHECKLIST SUBMISSIONS - FULL EXPORT";
  titleCell.font = { bold: true, size: 15, color: { argb: "FFFFFFFF" } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F766E" }
  };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(3).height = 28;

  const subtitle = worksheet.getCell(4, 1);
  subtitle.value = `Generated: ${new Date().toLocaleString()}`;
  subtitle.font = { italic: true, color: { argb: "FF334155" } };

  worksheet.columns = TABLE_COLUMNS.map(([, header]) => ({ header, key: header, width: 18 }));

  const headerRowIndex = 5;
  const headerRow = worksheet.getRow(headerRowIndex);
  TABLE_COLUMNS.forEach(([, header], idx) => {
    headerRow.getCell(idx + 1).value = header;
  });
  styleHeaderRow(headerRow, "FF1E3A8A");
  headerRow.height = 24;

  normalizedRows.forEach((row, rowIndex) => {
    const values = TABLE_COLUMNS.map(([key]) => {
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
    { header: "Engineer Drawn Data URL", key: "engineer_data_url", width: 42 },
    { header: "Staff Mode", key: "staff_mode", width: 14 },
    { header: "Staff Text", key: "staff_text", width: 30 },
    { header: "Staff DateTime", key: "staff_datetime", width: 24 },
    { header: "Staff Drawn Data URL", key: "staff_data_url", width: 42 },
    { header: "Verification JSON", key: "verification_json", width: 48 }
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
      engineer_data_url: engineer.dataUrl || "",
      staff_mode: staff.mode || "",
      staff_text: staff.text || "",
      staff_datetime: staff.datetime || "",
      staff_data_url: staff.dataUrl || "",
      verification_json: safeJson(row.verification, {})
    });

    styleDataRow(dataRow, index % 2 === 0);
  });

  worksheet.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: 2, column: 13 }
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

  await addRawDataSheet(workbook, normalizedRows);
  addChecklistSheet(workbook, normalizedRows, "Before Replace", "before_replace", "FF0F766E");
  addChecklistSheet(workbook, normalizedRows, "After Replace", "after_replace", "FF2563EB");
  addVerificationSheet(workbook, normalizedRows);

  const buffer = await workbook.xlsx.writeBuffer();
  triggerDownload(buffer, "it-checklist-history-full.xlsx");
}
