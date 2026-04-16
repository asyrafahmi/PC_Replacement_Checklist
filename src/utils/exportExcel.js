import * as XLSX from "xlsx-js-style";

function toDisplayValue(row, primary, fallback = "") {
  return row?.[primary] ?? row?.[fallback] ?? "";
}

function toText(value) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function toDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return toText(value);
  return date.toLocaleString();
}

function signatureSummary(entry) {
  if (!entry) return "-";
  if (entry.mode === "type") return entry.text || "-";
  if (entry.dataUrl) return "[drawn signature]";
  return "-";
}

function yesRate(items) {
  if (!Array.isArray(items) || !items.length) return 0;
  const yesCount = items.filter((item) => item.status === "Yes").length;
  return Math.round((yesCount / items.length) * 100);
}

function buildSummaryRows(rows) {
  return rows.map((row) => ({
    "Submission ID": toText(row.id),
    "Created At": toDateTime(row.created_at),
    Branch: toText(toDisplayValue(row, "branch", "department")),
    Date: toText(row.date || row.installation_date),
    "Staff Name": toText(toDisplayValue(row, "staff_name", "user_full_name")),
    "Staff ID Number": toText(row.staff_id_number),
    "PC/NB Number": toText(toDisplayValue(row, "pc_nb_number", "new_serial_number")),
    "Old PC Serial": toText(row.old_pc_serial_number),
    "New PC Serial": toText(row.new_pc_serial_number),
    "Old Monitor Serial": toText(row.old_monitor_serial_number),
    "New Monitor Serial": toText(row.new_monitor_serial_number),
    "Old Hostname": toText(row.old_hostname),
    "New Hostname": toText(row.new_hostname),
    "Old IP Address": toText(row.old_ip_address),
    "New IP Address": toText(row.new_ip_address || row.ip_address),
    "PC Serial Remark": toText(row.pc_serial_remark),
    "Monitor Serial Remark": toText(row.monitor_serial_remark),
    "Hostname Remark": toText(row.hostname_remark),
    "IP Address Remark": toText(row.ip_address_remark),
    "General Remark": toText(row.remark),
    "Engineer Name": toText(row.engineer_name),
    "Engineer Sign Mode": toText(row.verification?.engineer?.mode || "-"),
    "Engineer Signature": signatureSummary(row.verification?.engineer),
    "Engineer Date Time": toDateTime(row.verification?.engineer?.datetime),
    "Staff Sign Mode": toText(row.verification?.staff?.mode || "-"),
    "Staff Signature": signatureSummary(row.verification?.staff),
    "Staff Date Time": toDateTime(row.verification?.staff?.datetime),
    "Checklist Status": toText(row.status || "Pending"),
    "Before Yes %": `${yesRate(row.before_replace)}%`,
    "After Yes %": `${yesRate(row.after_replace)}%`
  }));
}

function buildChecklistRows(rows) {
  return rows.flatMap((row) => {
    const shared = {
      "Submission ID": toText(row.id),
      "Created At": toDateTime(row.created_at),
      Branch: toText(toDisplayValue(row, "branch", "department")),
      "Staff Name": toText(toDisplayValue(row, "staff_name", "user_full_name"))
    };

    const beforeRows = (row.before_replace || []).map((item) => ({
      ...shared,
      Section: "Before Replace",
      "Item No": item.no,
      Item: toText(item.name),
      Detail: toText(item.detail),
      Status: toText(item.status),
      Remark: toText(item.remark)
    }));

    const afterRows = (row.after_replace || []).map((item) => ({
      ...shared,
      Section: "After Replace",
      "Item No": item.no,
      Item: toText(item.name),
      Detail: toText(item.detail),
      Status: toText(item.status),
      Remark: toText(item.remark)
    }));

    return [...beforeRows, ...afterRows];
  });
}

function applyGridStyle(worksheet, rowCount, columnCount, options = {}) {
  const headerStyle = {
    fill: { fgColor: { rgb: "1F4E78" } },
    font: { bold: true, color: { rgb: "FFFFFF" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: "C7D2E2" } },
      bottom: { style: "thin", color: { rgb: "C7D2E2" } },
      left: { style: "thin", color: { rgb: "C7D2E2" } },
      right: { style: "thin", color: { rgb: "C7D2E2" } }
    }
  };

  const bodyStyle = {
    fill: { fgColor: { rgb: "F8FBFF" } },
    font: { color: { rgb: "1E293B" } },
    alignment: { vertical: "top", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: "D7DFEA" } },
      bottom: { style: "thin", color: { rgb: "D7DFEA" } },
      left: { style: "thin", color: { rgb: "D7DFEA" } },
      right: { style: "thin", color: { rgb: "D7DFEA" } }
    }
  };

  const statusStyles = {
    Yes: { fill: { fgColor: { rgb: "DCFCE7" } }, font: { color: { rgb: "166534" }, bold: true } },
    No: { fill: { fgColor: { rgb: "FEE2E2" } }, font: { color: { rgb: "991B1B" }, bold: true } },
    "N/A": { fill: { fgColor: { rgb: "FEF9C3" } }, font: { color: { rgb: "854D0E" }, bold: true } }
  };

  for (let col = 0; col < columnCount; col += 1) {
    const headerCell = XLSX.utils.encode_cell({ r: 0, c: col });
    if (worksheet[headerCell]) worksheet[headerCell].s = headerStyle;
  }

  for (let row = 1; row < rowCount; row += 1) {
    for (let col = 0; col < columnCount; col += 1) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellRef];
      if (!cell) continue;

      const rowTint = row % 2 === 0 ? { fill: { fgColor: { rgb: "FFFFFF" } } } : {};
      cell.s = {
        ...bodyStyle,
        ...rowTint,
        font: { ...(bodyStyle.font || {}) },
        alignment: { ...(bodyStyle.alignment || {}) },
        border: { ...(bodyStyle.border || {}) }
      };

      if (options.statusColumnIndex === col) {
        const status = String(cell.v || "");
        const statusStyle = statusStyles[status];
        if (statusStyle) {
          cell.s.fill = statusStyle.fill;
          cell.s.font = { ...(cell.s.font || {}), ...(statusStyle.font || {}) };
          cell.s.alignment = { ...(cell.s.alignment || {}), horizontal: "center" };
        }
      }
    }
  }
}

function autoColumnWidths(rows) {
  if (!rows.length) return [];
  const keys = Object.keys(rows[0]);
  return keys.map((key) => {
    const maxLength = rows.reduce((max, row) => {
      const valueLength = String(row[key] ?? "").length;
      return Math.max(max, valueLength);
    }, key.length);

    return { wch: Math.min(42, Math.max(12, maxLength + 2)) };
  });
}

export function exportHistoryToExcel(rows) {
  if (!rows.length) {
    alert("No history available to export.");
    return;
  }

  const summaryRows = buildSummaryRows(rows);
  const checklistRows = buildChecklistRows(rows);

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet["!cols"] = autoColumnWidths(summaryRows);
  applyGridStyle(summarySheet, summaryRows.length + 1, Object.keys(summaryRows[0]).length);

  const checklistSheet = XLSX.utils.json_to_sheet(checklistRows);
  checklistSheet["!cols"] = autoColumnWidths(checklistRows);
  const statusColumnIndex = Object.keys(checklistRows[0]).findIndex((key) => key === "Status");
  applyGridStyle(checklistSheet, checklistRows.length + 1, Object.keys(checklistRows[0]).length, { statusColumnIndex });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
  XLSX.utils.book_append_sheet(workbook, checklistSheet, "Checklist Items");

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `it-checklist-history-${stamp}.xlsx`);
}
