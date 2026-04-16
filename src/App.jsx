import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { format } from "date-fns";
import { hasSupabaseConfig, supabase } from "./lib/supabase";
import { exportHistoryToExcel } from "./utils/exportExcel";

const beforeReplaceItems = [
  { no: 1, name: "Backup user personal files/data", detail: "Desktop, My Documents, Scanner folder, etc" },
  { no: 2, name: "Backup Lotus Notes email DB .nsf files", detail: "" },
  { no: 4, name: "Backup Favourites list", detail: "" },
  { no: 5, name: "Backup PC Name / IP Address", detail: "" },
  { no: 6, name: "List down Lotus Notes DB in use", detail: "" },
  { no: 7, name: "List down printer model & IP", detail: "" },
  { no: 8, name: "List down all other applications", detail: "" }
];

const afterReplaceItems = [
  { no: 1, name: "Configure PC Name - Join Domain" },
  { no: 2, name: "Configure user profile" },
  { no: 3, name: "Install Antivirus" },
  { no: 4, name: "Restore user data" },
  { no: 5, name: "Configure Outlook email / Teams" },
  { no: 6, name: "Install printer, configure scan folder & test it" },
  { no: 7, name: "Configure Lotus Notes client" },
  { no: 8, name: "Configure AS400 Client Session" },
  { no: 9, name: "Activate O365 and Windows" },
  { no: 10, name: "Ensure all new boxes,plastic, etc disposed accordingly" }
];

const statusOptions = ["Yes", "No", "N/A"];
const COLORS = ["#0f766e", "#2563eb", "#f59e0b", "#dc2626"];
const BNM_LOGO_URL = "https://th.bing.com/th/id/R.b11be793d442b1cc6747e3d108405b9f?rik=oRMwbh41JBfA5w&riu=http%3a%2f%2f2.bp.blogspot.com%2f-RK_LzXvIHQM%2fTk0WKEg2D0I%2fAAAAAAAAFbo%2fewSU6mnKJPI%2fs1600%2fBank%2bNegara%2bMalaysia%2b01.png&ehk=t%2bG3NsQLm38pU0JkiKO6FT%2fKcjZcQwc8zu%2btLmmSpKA%3d&risl=&pid=ImgRaw&r=0";
const CTC_LOGO_URL = "https://logowik.com/content/uploads/images/ctc8767.jpg";

function buildChecklist(items) {
  return items.map((item) => ({ ...item, status: "N/A", remark: "" }));
}

function createVerification() {
  return {
    engineer: {
      mode: "draw",
      text: "",
      dataUrl: "",
      datetime: ""
    },
    staff: {
      mode: "draw",
      text: "",
      dataUrl: "",
      datetime: ""
    }
  };
}

function createDefaultForm() {
  const now = new Date();
  return {
    branch: "",
    date: now.toISOString().slice(0, 10),
    staff_name: "",
    staff_id_number: "",
    pc_nb_number: "",
    old_pc_serial_number: "",
    new_pc_serial_number: "",
    old_monitor_serial_number: "",
    new_monitor_serial_number: "",
    old_hostname: "",
    new_hostname: "",
    old_ip_address: "",
    new_ip_address: "",
    engineer_name: "",
    pc_serial_remark: "",
    monitor_serial_remark: "",
    hostname_remark: "",
    ip_address_remark: "",
    before_replace: buildChecklist(beforeReplaceItems),
    after_replace: buildChecklist(afterReplaceItems),
    remark: "",
    verification: createVerification(),
    status: "Pending"
  };
}

function toDisplayValue(row, primary, fallback = "") {
  return row?.[primary] ?? row?.[fallback] ?? "";
}

function summarizeError(error) {
  const message = String(error?.message || "").replace(/\s+/g, " ").trim();
  if (!message) return "Database unavailable.";
  if (message.length > 120) return `${message.slice(0, 117)}...`;
  return message;
}

function isMissingTableError(error) {
  if (!error) return false;
  const message = String(error.message || "").toLowerCase();
  return error.code === "PGRST205" || message.includes("checklist_submissions") || message.includes("schema cache");
}

const SERIAL_NUMBER_PATTERN = /^[A-Z0-9]{7,}$/;

function normalizeSerialNumber(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function isValidSerialNumber(value) {
  return SERIAL_NUMBER_PATTERN.test(value);
}

function SignatureDetail({ signature }) {
  if (!signature) return <span>-</span>;

  if (signature.mode === "type") {
    return <span>{signature.text || "-"}</span>;
  }

  if (!signature.dataUrl) {
    return <span>-</span>;
  }

  return <img src={signature.dataUrl} alt="Stored signature" className="detail-signature-image" />;
}

function DetailRow({ label, value }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value || "-"}</span>
    </div>
  );
}

function ChecklistDetailTable({ title, rows }) {
  return (
    <section className="detail-section">
      <h4>{title}</h4>
      <div className="detail-table-wrap">
        <table className="detail-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Item</th>
              <th>Status</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={`${title}-${item.no}-${item.name}`}>
                <td>{item.no}</td>
                <td>
                  <div className="detail-item-name">{item.name}</div>
                  {item.detail && <div className="detail-item-note">{item.detail}</div>}
                </td>
                <td>{item.status || "-"}</td>
                <td>{item.remark || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SignaturePad({ label, value, onChange, mode, onModeChange, modeId }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || mode !== "draw") return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const resizeCanvas = () => {
      const width = parent.clientWidth;
      const height = 132;
      const ratio = window.devicePixelRatio || 1;
      const context = canvas.getContext("2d");
      const currentValue = valueRef.current;

      canvas.width = Math.max(1, Math.floor(width * ratio));
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 2;
      context.strokeStyle = "#111827";
      context.clearRect(0, 0, width, height);

      if (currentValue) {
        const image = new Image();
        image.onload = () => {
          context.clearRect(0, 0, width, height);
          context.drawImage(image, 0, 0, width, height);
        };
        image.src = currentValue;
      }
    };

    resizeCanvas();

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(parent);

    return () => observer.disconnect();
  }, [mode]);

  function getPoint(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const pointer = event.touches?.[0] || event;
    return {
      x: pointer.clientX - rect.left,
      y: pointer.clientY - rect.top
    };
  }

  function paintLine(start, end) {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  }

  function saveCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const next = canvas.toDataURL("image/png");
    onChange(next);
  }

  function handlePointerDown(event) {
    if (mode !== "draw") return;
    event.preventDefault();
    const canvas = canvasRef.current;
    canvas.setPointerCapture?.(event.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getPoint(event);
  }

  function handlePointerMove(event) {
    if (!drawingRef.current || mode !== "draw") return;
    event.preventDefault();
    const nextPoint = getPoint(event);
    paintLine(lastPointRef.current, nextPoint);
    lastPointRef.current = nextPoint;
  }

  function handlePointerUp(event) {
    if (mode !== "draw") return;
    event.preventDefault();
    drawingRef.current = false;
    lastPointRef.current = null;
    saveCanvas();
  }

  function clearSignature() {
    onChange("");
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  }

  return (
    <div className="signature-field">
      <div className="signature-head">
        <strong>{label}</strong>
        <div className="signature-mode-switch">
          <button type="button" className={mode === "draw" ? "chip active" : "chip"} onClick={() => onModeChange(modeId, "draw")}>Draw</button>
          <button type="button" className={mode === "type" ? "chip active" : "chip"} onClick={() => onModeChange(modeId, "type")}>Type</button>
        </div>
      </div>

      {mode === "draw" ? (
        <div className="signature-canvas-wrap">
          <canvas
            ref={canvasRef}
            className="signature-canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
          {!value && <span className="signature-placeholder">Draw here with finger, stylus, or mouse</span>}
          <button type="button" className="signature-clear" onClick={clearSignature}>Clear</button>
        </div>
      ) : (
        <textarea
          className="signature-text"
          rows={4}
          placeholder="Type the signature name"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}

function ChecklistSection({ title, rows, onChange }) {
  return (
    <section className="sheet-block">
      <div className="sheet-section-title">{title}</div>
      <table className="sheet-table checklist-table">
        <thead>
          <tr>
            <th className="col-no">No</th>
            <th>{title === "BEFORE REPLACE PC / NB" ? "Item" : "Item"}</th>
            <th className="col-status">Status</th>
            <th className="col-remark">Remark</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, index) => (
            <tr key={`${item.no}-${item.name}`}>
              <td className="center">{item.no}</td>
              <td>
                <div className="check-item-name">{item.name}</div>
                {item.detail && <div className="check-item-detail">{item.detail}</div>}
              </td>
              <td>
                <div className="status-options">
                  {statusOptions.map((status) => (
                    <label key={status} className="status-option">
                      <input
                        type="radio"
                        name={`${title}-${index}`}
                        checked={item.status === status}
                        onChange={() => onChange(index, "status", status)}
                      />
                      <span className="status-option-text">{status}</span>
                    </label>
                  ))}
                </div>
              </td>
              <td>
                <input
                  className="remark-input"
                  value={item.remark}
                  onChange={(event) => onChange(index, "remark", event.target.value)}
                  aria-label={`${item.name} remark`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState("form");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [dbIssue, setDbIssue] = useState("");
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [form, setForm] = useState(createDefaultForm);

  async function fetchHistory() {
    setHistoryLoading(true);

    if (!hasSupabaseConfig) {
      setDbIssue("Supabase is not configured. This app is cloud-only. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      setRows([]);
      setHistoryLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("checklist_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setDbIssue("");
      setRows(data || []);
    } catch (error) {
      if (isMissingTableError(error)) {
        setDbIssue("Supabase table missing. Run supabase-schema.sql in Supabase SQL Editor.");
      } else {
        setDbIssue(`Supabase issue: ${summarizeError(error)}`);
      }
      setRows([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return undefined;

    const channel = supabase
      .channel("checklist-submissions-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "checklist_submissions" },
        () => {
          fetchHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function updateChecklist(section, index, field, value) {
    setForm((prev) => {
      const next = [...prev[section]];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, [section]: next };
    });
  }

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function updateSerialField(name, value) {
    updateField(name, normalizeSerialNumber(value));
  }

  function updateVerification(target, field, value) {
    setForm((prev) => ({
      ...prev,
      verification: {
        ...prev.verification,
        [target]: {
          ...prev.verification[target],
          [field]: value
        }
      }
    }));
  }

  function setVerificationMode(target, mode) {
    setForm((prev) => {
      const current = prev.verification[target] || {};
      return {
        ...prev,
        verification: {
          ...prev.verification,
          [target]: {
            ...current,
            mode,
            text: mode === "type" ? current.text || "" : "",
            dataUrl: mode === "draw" ? current.dataUrl || "" : ""
          }
        }
      };
    });
  }

  function setSignatureValue(target, nextValue) {
    setForm((prev) => {
      const current = prev.verification[target] || {};
      const isTypeMode = current.mode === "type";
      return {
        ...prev,
        verification: {
          ...prev.verification,
          [target]: {
            ...current,
            text: isTypeMode ? nextValue : "",
            dataUrl: isTypeMode ? "" : nextValue
          }
        }
      };
    });
  }

  function buildVerificationPayload(verification) {
    const engineer = verification?.engineer || {};
    const staff = verification?.staff || {};

    const normalizeEntry = (entry) => {
      const mode = entry.mode === "type" ? "type" : "draw";
      return {
        mode,
        text: mode === "type" ? entry.text || "" : "",
        dataUrl: mode === "draw" ? entry.dataUrl || "" : "",
        datetime: entry.datetime || ""
      };
    };

    return {
      engineer: normalizeEntry(engineer),
      staff: normalizeEntry(staff)
    };
  }

  function resetForm() {
    setForm(createDefaultForm());
  }

  async function onSubmit(event) {
    event.preventDefault();

    if (!form.branch || !form.staff_name || !form.pc_nb_number) {
      alert("Please fill in Branch, Staff Name, and PC/NB Number.");
      return;
    }

    if (form.old_pc_serial_number && !isValidSerialNumber(form.old_pc_serial_number)) {
      alert("Old PC serial number must be alphanumeric and more than 6 characters.");
      return;
    }

    if (form.new_pc_serial_number && !isValidSerialNumber(form.new_pc_serial_number)) {
      alert("PC serial number must be alphanumeric and more than 6 characters.");
      return;
    }

    if (form.old_monitor_serial_number && !isValidSerialNumber(form.old_monitor_serial_number)) {
      alert("Old monitor serial number must be alphanumeric and more than 6 characters.");
      return;
    }

    if (form.new_monitor_serial_number && !isValidSerialNumber(form.new_monitor_serial_number)) {
      alert("Monitor serial number must be alphanumeric and more than 6 characters.");
      return;
    }

    setLoading(true);

    const payload = {
      branch: form.branch,
      department: form.branch,
      date: form.date || null,
      installation_date: form.date || null,
      staff_name: form.staff_name,
      user_full_name: form.staff_name,
      staff_id_number: form.staff_id_number,
      pc_nb_number: form.pc_nb_number,
      new_serial_number: form.pc_nb_number,
      old_pc_serial_number: form.old_pc_serial_number,
      new_pc_serial_number: form.new_pc_serial_number,
      old_monitor_serial_number: form.old_monitor_serial_number,
      new_monitor_serial_number: form.new_monitor_serial_number,
      old_hostname: form.old_hostname,
      new_hostname: form.new_hostname,
      old_ip_address: form.old_ip_address,
      new_ip_address: form.new_ip_address,
      ip_address: form.new_ip_address,
      pc_serial_remark: form.pc_serial_remark,
      monitor_serial_remark: form.monitor_serial_remark,
      hostname_remark: form.hostname_remark,
      ip_address_remark: form.ip_address_remark,
      before_replace: form.before_replace,
      after_replace: form.after_replace,
      remark: form.remark,
      verification: buildVerificationPayload(form.verification),
      status: form.status,
      engineer_name: form.engineer_name,
      user_name: form.staff_name
    };

    if (!hasSupabaseConfig) {
      setDbIssue("Supabase is not configured. Cloud save is required for shared history.");
      setLoading(false);
      alert("Cannot save. Configure Supabase so data is shared between you and your boss.");
      return;
    }

    const { error } = await supabase.from("checklist_submissions").insert(payload);

    if (error) {
      if (isMissingTableError(error)) {
        setDbIssue("Supabase table missing. Run supabase-schema.sql in Supabase SQL Editor.");
      } else {
        setDbIssue(`Supabase issue: ${summarizeError(error)}`);
      }
      setLoading(false);
      alert(`Failed to save online: ${summarizeError(error)}`);
      return;
    }

    await fetchHistory();
    setLoading(false);
    resetForm();
    setActiveTab("history");
    alert("Checklist saved successfully.");
  }

  const statusData = useMemo(() => {
    const count = rows.reduce((acc, row) => {
      const key = row.status || "Pending";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(count).map(([name, value]) => ({ name, value }));
  }, [rows]);

  const monthlyData = useMemo(() => {
    const count = rows.reduce((acc, row) => {
      const month = format(new Date(row.created_at), "MMM yyyy");
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(count).map(([month, total]) => ({ month, total }));
  }, [rows]);

  const completionData = useMemo(() => {
    function toRate(entry) {
      if (!Array.isArray(entry) || !entry.length) return 0;
      const yes = entry.filter((item) => item.status === "Yes").length;
      return Math.round((yes / entry.length) * 100);
    }

    const aggregate = rows.reduce(
      (acc, row) => {
        acc.before += toRate(row.before_replace);
        acc.after += toRate(row.after_replace);
        return acc;
      },
      { before: 0, after: 0 }
    );

    const totalRows = rows.length || 1;

    return [
      { section: "Before Replace", rate: Math.round(aggregate.before / totalRows) },
      { section: "After Replace", rate: Math.round(aggregate.after / totalRows) }
    ];
  }, [rows]);

  return (
    <div className="page">
      <header className="form-header">
        <div className="header-content">
          <div className="header-brand left">
            <img src={BNM_LOGO_URL} alt="Bank Negara Malaysia logo" className="brand-logo bnm-logo" />
            <div className="brand-caption">Bank Negara Malaysia</div>
          </div>

          <div className="header-title-block">
            <h1>CHECKLIST FOR NEW PC / NB REPLACEMENT</h1>
            <p className="header-subtitle">Spreadsheet-style checklist for field use on desktop, tablet, and mobile</p>
          </div>

          <div className="header-brand right">
            <img src={CTC_LOGO_URL} alt="CTC logo" className="brand-logo ctc-logo" />
            <div className="brand-caption">CTC Global Sdn Bhd</div>
          </div>
        </div>
      </header>

      <nav className="tabs">
        <button className={activeTab === "form" ? "active" : ""} onClick={() => setActiveTab("form")}>Form</button>
        <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}>History</button>
        <button className={activeTab === "analysis" ? "active" : ""} onClick={() => setActiveTab("analysis")}>Analysis</button>
      </nav>

      {dbIssue && <p className="warning">{dbIssue}</p>}

      {activeTab === "form" && (
        <form className="sheet-shell" onSubmit={onSubmit}>
          <table className="sheet-table header-table">
            <tbody>
              <tr>
                <th colSpan="5" className="sheet-title-cell">
                  <div className="sheet-title-row">
                    <span>CHECKLIST FOR NEW PC / NB REPLACEMENT</span>
                    <span className="sheet-company-cell">CTC Global Sdn Bhd</span>
                  </div>
                </th>
              </tr>
              <tr>
                <th>Branch</th>
                <td colSpan="2">
                  <input value={form.branch} onChange={(e) => updateField("branch", e.target.value)} />
                </td>
                <th>Date</th>
                <td>
                  <input type="date" value={form.date} onChange={(e) => updateField("date", e.target.value)} />
                </td>
              </tr>
              <tr>
                <th>Staff Name</th>
                <td colSpan="2">
                  <input value={form.staff_name} onChange={(e) => updateField("staff_name", e.target.value)} />
                </td>
                <th>Staff ID Number</th>
                <td>
                  <input value={form.staff_id_number} onChange={(e) => updateField("staff_id_number", e.target.value)} />
                </td>
              </tr>
              <tr>
                <th>Date</th>
                <td colSpan="2">
                  <input type="date" value={form.date} onChange={(e) => updateField("date", e.target.value)} />
                </td>
                <th>PC/NB Number</th>
                <td>
                  <input value={form.pc_nb_number} onChange={(e) => updateField("pc_nb_number", e.target.value)} />
                </td>
              </tr>
            </tbody>
          </table>

          <section className="sheet-block">
            <table className="sheet-table">
              <thead>
                <tr>
                  <th className="col-item">Item</th>
                  <th>Old PC / NB (For Disposal)</th>
                  <th>New PC / NB</th>
                  <th className="col-remark">Remark</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>PC Serial Number</th>
                  <td>
                    <input
                      value={form.old_pc_serial_number}
                      onChange={(e) => updateSerialField("old_pc_serial_number", e.target.value)}
                      placeholder="Serial number"
                      inputMode="text"
                      autoCapitalize="characters"
                      pattern="[A-Za-z0-9]{7,}"
                      title="Use alphanumeric characters only, at least 7 characters"
                    />
                  </td>
                  <td>
                    <div className="serial-stack">
                      <input
                        value={form.new_pc_serial_number}
                        onChange={(e) => updateSerialField("new_pc_serial_number", e.target.value)}
                        placeholder="Serial number"
                        inputMode="text"
                        autoCapitalize="characters"
                        pattern="[A-Za-z0-9]{7,}"
                        title="Use alphanumeric characters only, at least 7 characters"
                      />
                    </div>
                  </td>
                  <td><input value={form.pc_serial_remark} onChange={(e) => updateField("pc_serial_remark", e.target.value)} /></td>
                </tr>
                <tr>
                  <th>Monitor Serial Number</th>
                  <td>
                    <input
                      value={form.old_monitor_serial_number}
                      onChange={(e) => updateSerialField("old_monitor_serial_number", e.target.value)}
                      placeholder="Serial number"
                      inputMode="text"
                      autoCapitalize="characters"
                      pattern="[A-Za-z0-9]{7,}"
                      title="Use alphanumeric characters only, at least 7 characters"
                    />
                  </td>
                  <td>
                    <div className="serial-stack">
                      <input
                        value={form.new_monitor_serial_number}
                        onChange={(e) => updateSerialField("new_monitor_serial_number", e.target.value)}
                        placeholder="Serial number"
                        inputMode="text"
                        autoCapitalize="characters"
                        pattern="[A-Za-z0-9]{7,}"
                        title="Use alphanumeric characters only, at least 7 characters"
                      />
                    </div>
                  </td>
                  <td><input value={form.monitor_serial_remark} onChange={(e) => updateField("monitor_serial_remark", e.target.value)} /></td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="sheet-block">
            <table className="sheet-table">
              <thead>
                <tr>
                  <th className="col-item">Configuration</th>
                  <th>Old PC / NB (For Disposal)</th>
                  <th>New PC / NB</th>
                  <th className="col-remark">Remark</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Hostname / PC Name:</th>
                  <td><input value={form.old_hostname} onChange={(e) => updateField("old_hostname", e.target.value)} /></td>
                  <td><input value={form.new_hostname} onChange={(e) => updateField("new_hostname", e.target.value)} /></td>
                  <td><input value={form.hostname_remark} onChange={(e) => updateField("hostname_remark", e.target.value)} /></td>
                </tr>
                <tr>
                  <th>IP Address:</th>
                  <td><input value={form.old_ip_address} onChange={(e) => updateField("old_ip_address", e.target.value)} /></td>
                  <td><input value={form.new_ip_address} onChange={(e) => updateField("new_ip_address", e.target.value)} /></td>
                  <td><input value={form.ip_address_remark} onChange={(e) => updateField("ip_address_remark", e.target.value)} /></td>
                </tr>
              </tbody>
            </table>
          </section>

          <ChecklistSection
            title="BEFORE REPLACE PC / NB"
            rows={form.before_replace}
            onChange={(index, field, value) => updateChecklist("before_replace", index, field, value)}
          />

          <ChecklistSection
            title="AFTER REPLACE PC / NB"
            rows={form.after_replace}
            onChange={(index, field, value) => updateChecklist("after_replace", index, field, value)}
          />

          <section className="sheet-block remark-block">
            <div className="sheet-section-title">Remark:</div>
            <textarea value={form.remark} onChange={(e) => updateField("remark", e.target.value)} rows={4} />
          </section>

          <section className="sheet-block verify-block">
            <div className="sheet-section-title">Verify</div>
            <table className="sheet-table verify-table">
              <colgroup>
                <col className="verify-col-label" />
                <col className="verify-col-input" />
                <col className="verify-col-signature" />
              </colgroup>
              <tbody>
                <tr>
                  <th>CTC Engineer</th>
                  <td>
                    <input value={form.engineer_name} onChange={(e) => updateField("engineer_name", e.target.value)} />
                  </td>
                  <td rowSpan="2" className="signature-cell">
                    <SignaturePad
                      label="Signature:"
                      value={form.verification.engineer.mode === "type" ? form.verification.engineer.text : form.verification.engineer.dataUrl}
                      mode={form.verification.engineer.mode}
                      modeId="engineer"
                      onModeChange={setVerificationMode}
                      onChange={(nextValue) => setSignatureValue("engineer", nextValue)}
                    />
                  </td>
                </tr>
                <tr>
                  <th>Date and Time</th>
                  <td>
                    <input
                      type="datetime-local"
                      value={form.verification.engineer.datetime}
                      onChange={(e) => updateVerification("engineer", "datetime", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <th>Staff Name</th>
                  <td>
                    <input value={form.staff_name} onChange={(e) => updateField("staff_name", e.target.value)} />
                  </td>
                  <td rowSpan="2" className="signature-cell">
                    <SignaturePad
                      label="Signature / Stamp :"
                      value={form.verification.staff.mode === "type" ? form.verification.staff.text : form.verification.staff.dataUrl}
                      mode={form.verification.staff.mode}
                      modeId="staff"
                      onModeChange={setVerificationMode}
                      onChange={(nextValue) => setSignatureValue("staff", nextValue)}
                    />
                  </td>
                </tr>
                <tr>
                  <th>Date and Time</th>
                  <td>
                    <input
                      type="datetime-local"
                      value={form.verification.staff.datetime}
                      onChange={(e) => updateVerification("staff", "datetime", e.target.value)}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <div className="sheet-actions">
            <button type="submit" disabled={loading}>{loading ? "Saving..." : "Submit Checklist"}</button>
          </div>
        </form>
      )}

      {activeTab === "history" && (
        <section className="card history-panel">
          <div className="row-between">
            <div>
              <h2>History</h2>
              <p className="section-caption">Saved checklist submissions</p>
            </div>
            <button onClick={() => exportHistoryToExcel(rows)}>Export to Excel</button>
          </div>

          {historyLoading && <p>Loading history...</p>}

          {!historyLoading && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Branch</th>
                    <th>Staff Name</th>
                    <th>Staff ID</th>
                    <th>PC/NB No</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{toDisplayValue(row, "branch", "department") || "-"}</td>
                      <td>{toDisplayValue(row, "staff_name", "user_full_name") || "-"}</td>
                      <td>{row.staff_id_number || "-"}</td>
                      <td>{toDisplayValue(row, "pc_nb_number", "new_serial_number") || "-"}</td>
                      <td>{row.status || "Pending"}</td>
                      <td>{new Date(row.created_at).toLocaleString()}</td>
                      <td>
                        <button type="button" className="detail-button" onClick={() => setSelectedDetail(row)}>
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={7}>No history yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === "analysis" && (
        <section className="card charts">
          <h2>Performance Analysis</h2>

          <div className="chart-grid">
            <article>
              <h3>Status Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {statusData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </article>

            <article>
              <h3>Submissions by Month</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </article>

            <article>
              <h3>Average Completion Rate</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={completionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="section" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="rate" fill="#0f766e" />
                </BarChart>
              </ResponsiveContainer>
            </article>
          </div>
        </section>
      )}

      {selectedDetail && (
        <div className="detail-overlay" role="dialog" aria-modal="true" aria-label="Checklist detail view">
          <div className="detail-modal">
            <div className="detail-modal-header">
              <div>
                <h2>Checklist Detail</h2>
                <p className="section-caption">Complete form data for this submission</p>
              </div>
              <button type="button" className="detail-close" onClick={() => setSelectedDetail(null)}>
                Close
              </button>
            </div>

            <div className="detail-grid">
              <section className="detail-section">
                <h4>Basic Info</h4>
                <DetailRow label="Branch" value={toDisplayValue(selectedDetail, "branch", "department")} />
                <DetailRow label="Date" value={selectedDetail.date || selectedDetail.installation_date} />
                <DetailRow label="Staff Name" value={toDisplayValue(selectedDetail, "staff_name", "user_full_name")} />
                <DetailRow label="Staff ID Number" value={selectedDetail.staff_id_number} />
                <DetailRow label="PC/NB Number" value={toDisplayValue(selectedDetail, "pc_nb_number", "new_serial_number")} />
                <DetailRow label="Status" value={selectedDetail.status} />
                <DetailRow label="Created At" value={selectedDetail.created_at ? new Date(selectedDetail.created_at).toLocaleString() : "-"} />
              </section>

              <section className="detail-section">
                <h4>Serials & Configuration</h4>
                <DetailRow label="Old PC Serial" value={selectedDetail.old_pc_serial_number} />
                <DetailRow label="New PC Serial" value={selectedDetail.new_pc_serial_number} />
                <DetailRow label="Old Monitor Serial" value={selectedDetail.old_monitor_serial_number} />
                <DetailRow label="New Monitor Serial" value={selectedDetail.new_monitor_serial_number} />
                <DetailRow label="Old Hostname" value={selectedDetail.old_hostname} />
                <DetailRow label="New Hostname" value={selectedDetail.new_hostname} />
                <DetailRow label="Old IP Address" value={selectedDetail.old_ip_address} />
                <DetailRow label="New IP Address" value={selectedDetail.new_ip_address} />
                <DetailRow label="PC Serial Remark" value={selectedDetail.pc_serial_remark} />
                <DetailRow label="Monitor Serial Remark" value={selectedDetail.monitor_serial_remark} />
                <DetailRow label="Hostname Remark" value={selectedDetail.hostname_remark} />
                <DetailRow label="IP Address Remark" value={selectedDetail.ip_address_remark} />
              </section>

              <section className="detail-section detail-remark">
                <h4>General Remark</h4>
                <p>{selectedDetail.remark || "-"}</p>
              </section>

              <ChecklistDetailTable title="Before Replace PC / NB" rows={selectedDetail.before_replace || []} />
              <ChecklistDetailTable title="After Replace PC / NB" rows={selectedDetail.after_replace || []} />

              <section className="detail-section">
                <h4>Verification</h4>
                <DetailRow label="CTC Engineer" value={selectedDetail.engineer_name} />
                <DetailRow label="Engineer Date and Time" value={selectedDetail.verification?.engineer?.datetime} />
                <div className="detail-row">
                  <span className="detail-label">Engineer Signature</span>
                  <div className="detail-value"><SignatureDetail signature={selectedDetail.verification?.engineer} /></div>
                </div>
                <DetailRow label="Staff Name" value={selectedDetail.staff_name} />
                <DetailRow label="Staff Date and Time" value={selectedDetail.verification?.staff?.datetime} />
                <div className="detail-row">
                  <span className="detail-label">Staff Signature</span>
                  <div className="detail-value"><SignatureDetail signature={selectedDetail.verification?.staff} /></div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
