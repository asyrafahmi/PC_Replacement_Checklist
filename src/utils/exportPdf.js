import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

function statusFill(status) {
  if (status === "Yes") return [220, 252, 231];
  if (status === "No") return [254, 226, 226];
  if (status === "N/A") return [254, 249, 195];
  return [245, 247, 250];
}

function addSectionTitle(doc, title, y) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(22, 59, 99);
  doc.text(title, 40, y);
}

export function exportHistoryToPdf(rows) {
  if (!rows.length) {
    alert("No history available to export.");
    return;
  }

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(16, 40, 69);
  doc.text("Checklist History Report", 40, 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);

  autoTable(doc, {
    startY: 72,
    head: [["Submission ID", "Branch", "Staff Name", "PC/NB Number", "Status", "Created At"]],
    body: rows.map((row) => [
      toText(row.id),
      toText(toDisplayValue(row, "branch", "department")),
      toText(toDisplayValue(row, "staff_name", "user_full_name")),
      toText(toDisplayValue(row, "pc_nb_number", "new_serial_number")),
      toText(row.status || "Pending"),
      toDateTime(row.created_at)
    ]),
    theme: "grid",
    headStyles: { fillColor: [31, 78, 120], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 8.6, cellPadding: 5, textColor: [30, 41, 59], lineColor: [209, 219, 230] },
    columnStyles: {
      0: { cellWidth: 85 },
      1: { cellWidth: 120 },
      2: { cellWidth: 140 },
      3: { cellWidth: 120 },
      4: { cellWidth: 70 },
      5: { cellWidth: 145 }
    }
  });

  rows.forEach((row, rowIndex) => {
    doc.addPage();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(16, 40, 69);
    doc.text(`Submission ${rowIndex + 1}: ${toText(row.id)}`, 40, 38);

    const details = [
      ["Branch", toText(toDisplayValue(row, "branch", "department"))],
      ["Date", toText(row.date || row.installation_date)],
      ["Staff Name", toText(toDisplayValue(row, "staff_name", "user_full_name"))],
      ["Staff ID Number", toText(row.staff_id_number)],
      ["PC/NB Number", toText(toDisplayValue(row, "pc_nb_number", "new_serial_number"))],
      ["Old PC Serial", toText(row.old_pc_serial_number)],
      ["New PC Serial", toText(row.new_pc_serial_number)],
      ["Old Monitor Serial", toText(row.old_monitor_serial_number)],
      ["New Monitor Serial", toText(row.new_monitor_serial_number)],
      ["Old Hostname", toText(row.old_hostname)],
      ["New Hostname", toText(row.new_hostname)],
      ["Old IP Address", toText(row.old_ip_address)],
      ["New IP Address", toText(row.new_ip_address || row.ip_address)],
      ["PC Serial Remark", toText(row.pc_serial_remark)],
      ["Monitor Serial Remark", toText(row.monitor_serial_remark)],
      ["Hostname Remark", toText(row.hostname_remark)],
      ["IP Address Remark", toText(row.ip_address_remark)],
      ["General Remark", toText(row.remark)],
      ["Checklist Status", toText(row.status || "Pending")],
      ["Created At", toDateTime(row.created_at)],
      ["Engineer Name", toText(row.engineer_name)],
      ["Engineer Signature", signatureSummary(row.verification?.engineer)],
      ["Engineer Date Time", toDateTime(row.verification?.engineer?.datetime)],
      ["Staff Signature", signatureSummary(row.verification?.staff)],
      ["Staff Date Time", toDateTime(row.verification?.staff?.datetime)]
    ];

    autoTable(doc, {
      startY: 48,
      head: [["Field", "Value"]],
      body: details,
      theme: "grid",
      headStyles: { fillColor: [46, 107, 158], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 8.5, cellPadding: 4, textColor: [30, 41, 59], lineColor: [209, 219, 230] },
      columnStyles: {
        0: { cellWidth: 150, fontStyle: "bold", textColor: [30, 64, 100], fillColor: [238, 244, 251] },
        1: { cellWidth: 560 }
      }
    });

    const detailBottomY = doc.lastAutoTable?.finalY || 80;
    addSectionTitle(doc, "Before Replace Checklist", detailBottomY + 22);

    autoTable(doc, {
      startY: detailBottomY + 30,
      head: [["No", "Item", "Detail", "Status", "Remark"]],
      body: (row.before_replace || []).map((item) => [
        toText(item.no),
        toText(item.name),
        toText(item.detail),
        toText(item.status),
        toText(item.remark)
      ]),
      theme: "grid",
      headStyles: { fillColor: [31, 78, 120], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 8.2, cellPadding: 4, textColor: [30, 41, 59], lineColor: [209, 219, 230] },
      columnStyles: {
        0: { cellWidth: 36, halign: "center" },
        1: { cellWidth: 260 },
        2: { cellWidth: 180 },
        3: { cellWidth: 70, halign: "center", fontStyle: "bold" },
        4: { cellWidth: 164 }
      },
      didParseCell: ({ column, cell, row: tableRow, section }) => {
        if (section !== "body" || column.index !== 3) return;
        const statusValue = tableRow.raw?.[3] || "";
        cell.styles.fillColor = statusFill(statusValue);
      }
    });

    const beforeBottomY = doc.lastAutoTable?.finalY || detailBottomY + 90;
    addSectionTitle(doc, "After Replace Checklist", beforeBottomY + 22);

    autoTable(doc, {
      startY: beforeBottomY + 30,
      head: [["No", "Item", "Detail", "Status", "Remark"]],
      body: (row.after_replace || []).map((item) => [
        toText(item.no),
        toText(item.name),
        toText(item.detail),
        toText(item.status),
        toText(item.remark)
      ]),
      theme: "grid",
      headStyles: { fillColor: [31, 78, 120], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 8.2, cellPadding: 4, textColor: [30, 41, 59], lineColor: [209, 219, 230] },
      columnStyles: {
        0: { cellWidth: 36, halign: "center" },
        1: { cellWidth: 260 },
        2: { cellWidth: 180 },
        3: { cellWidth: 70, halign: "center", fontStyle: "bold" },
        4: { cellWidth: 164 }
      },
      didParseCell: ({ column, cell, row: tableRow, section }) => {
        if (section !== "body" || column.index !== 3) return;
        const statusValue = tableRow.raw?.[3] || "";
        cell.styles.fillColor = statusFill(statusValue);
      }
    });
  });

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`it-checklist-history-${stamp}.pdf`);
}