import * as XLSX from "xlsx";

export function exportHistoryToExcel(rows) {
  const formatted = rows.map((row) => ({
    "Submission ID": row.id,
    Branch: row.branch || row.department,
    Date: row.date || row.installation_date,
    "Staff Name": row.staff_name || row.user_full_name,
    "Staff ID Number": row.staff_id_number || "",
    "PC/NB Number": row.pc_nb_number || row.new_serial_number,
    "Old PC Serial": row.old_pc_serial_number || "",
    "New PC Serial": row.new_pc_serial_number || "",
    "New PC Serial Confirm": row.new_pc_serial_number_confirm || "",
    "Old Monitor Serial": row.old_monitor_serial_number || "",
    "New Monitor Serial": row.new_monitor_serial_number || "",
    "New Monitor Serial Confirm": row.new_monitor_serial_number_confirm || "",
    "Old Hostname": row.old_hostname,
    "New Hostname": row.new_hostname,
    "Old IP Address": row.old_ip_address || "",
    "New IP Address": row.new_ip_address || row.ip_address || "",
    "Engineer Signature": row.verification?.engineer?.mode === "type" ? row.verification.engineer.text : "[drawn signature]",
    "Staff Signature": row.verification?.staff?.mode === "type" ? row.verification.staff.text : "[drawn signature]",
    Status: row.status || "Pending",
    "Created At": new Date(row.created_at).toLocaleString()
  }));

  const worksheet = XLSX.utils.json_to_sheet(formatted);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Checklist History");
  XLSX.writeFile(workbook, "it-checklist-history.xlsx");
}
