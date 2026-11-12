import React, { useEffect, useRef, useState } from "react";
import { db } from "../db/database";
import * as XLSX from "xlsx";
import { formatDate, getLocalDate } from "../utils/dateUtils";
import {
  HardDrive,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  Eye,
  Trash2,
} from "lucide-react";
import "./Downloads.css";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

/** Return the first value in `row` whose key matches any of `aliases` (case-insensitive). */
function pick(row, ...aliases) {
  for (const key of Object.keys(row)) {
    if (aliases.some((a) => a.toLowerCase() === key.trim().toLowerCase())) {
      return row[key];
    }
  }
  return undefined;
}

/** Convert a value to a YYYY-MM-DD string. Handles ISO strings and Excel serial numbers. */
function normalizeDate(val) {
  if (!val) return "";
  if (typeof val === "number") {
    const date = XLSX.SSF.parse_date_code(val);
    if (date) {
      const y = date.y;
      const m = String(date.m).padStart(2, "0");
      const d = String(date.d).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  const d = new Date(str);
  if (!isNaN(d)) {
    return getLocalDate(d);
  }
  return str;
}

/** Normalize a time value to HH:MM. */
function normalizeTime(val) {
  if (!val) return "";
  if (typeof val === "number") {
    const totalMins = Math.round(val * 24 * 60);
    const h = Math.floor(totalMins / 60) % 24;
    const m = totalMins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  const str = String(val).trim();
  const match = str.match(/^(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, "0")}:${match[2]}`;
  return str;
}

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
function Downloads() {
  const [downloads, setDownloads] = useState([]);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', msg }
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    try {
      const data = await db.downloads
        .orderBy("createdAt")
        .reverse()
        .toArray();
      setDownloads(data);
    } catch (err) {
      console.error("Downloads: failed to load from IndexedDB", err);
      setDownloads([]);
    }
  };

  const clearHistory = async () => {
    if (!confirm("Clear all export history?")) return;
    await db.downloads.clear();
    loadDownloads();
  };

  const deleteExport = async (id) => {
    if (!confirm("Delete this export from history?")) return;
    await db.downloads.delete(id);
    loadDownloads();
  };

  const viewReport = (item) => {
    if (!item.reportData) {
      alert("No report data stored for this export.");
      return;
    }
    const report = JSON.parse(item.reportData);
    const newWindow = window.open("", "_blank");
    newWindow.document.write(`
      <html>
        <head>
          <title>${item.fileName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; padding: 30px; color: #18181b; background: #fafaf8; }
            h1 { margin-bottom: 10px; font-size: 24px; color: #18181b; }
            .meta { background: #ffffff; border: 1px solid #eae6df; padding: 16px 20px; border-radius: 12px; margin: 16px 0 24px; font-size: 14px; line-height: 1.7; }
            .meta p { margin: 4px 0; }
            .print-btn { background: #d96b38; color: #fff; border: 0; padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; background: #fff; }
            th, td { border: 1px solid #eae6df; padding: 10px; text-align: left; }
            th { background: #f6f4ef; font-weight: 700; color: #71717a; }
            tr:nth-child(even) td { background: #fafaf8; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <h1>${item.fileName}</h1>
          <div class="meta">
            <p><strong>Exported:</strong> ${new Date(item.createdAt).toLocaleString("en-IN")}</p>
            <p><strong>Student:</strong> ${item.studentName || "All Students"}</p>
            <p><strong>Date Range:</strong> ${item.fromDate || "All Time"}${item.toDate ? ` → ${item.toDate}` : ""}</p>
            <p><strong>Total Classes:</strong> ${item.recordsCount}</p>
            <p><strong>Total Hours:</strong> ${item.totalHours} hrs</p>
            <p><strong>Total Earnings:</strong> ₹${item.totalEarning}</p>
          </div>
          <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Student</th><th>Start Time</th><th>End Time</th>
                <th>Duration</th><th>Total Hours</th><th>Hourly Rate</th><th>Total Earning</th>
              </tr>
            </thead>
            <tbody>
              ${report.map((row) => `
                <tr>
                  <td>${row.Date}</td><td>${row.Student}</td>
                  <td>${row["Start Time"]}</td><td>${row["End Time"]}</td>
                  <td>${row.Duration}</td><td>${row["Total Hours"]}</td>
                  <td>₹${row["Hourly Rate"]}</td><td>₹${row["Total Earning"]}</td>
                </tr>`).join("")}
            </tbody>
          </table>
        </body>
      </html>`);
    newWindow.document.close();
  };

  /* ── 1. Full JSON Backup ── */
  const downloadBackup = async () => {
    try {
      const students = await db.students.toArray();
      const attendance = await db.attendance.toArray();
      const payload = {
        app: "AttendanceRecord",
        version: 1,
        exportedAt: new Date().toISOString(),
        students,
        attendance,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-backup-${getLocalDate()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus({
        type: "success",
        msg: `Backup downloaded (${students.length} students, ${attendance.length} sessions).`,
      });
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", msg: "Backup failed: " + err.message });
    }
  };

  /* ── 2a. Restore / Merge JSON Backup ── */
  const handleJsonRestore = async (parsed) => {
    if (!Array.isArray(parsed.students) || !Array.isArray(parsed.attendance)) {
      setStatus({
        type: "error",
        msg: "Invalid backup file: missing students or attendance arrays.",
      });
      return;
    }

    const mode = window.confirm(
      `Restore backup?\n\n• OK  → Replace all existing data with backup.\n• Cancel → Merge backup into existing data (skips duplicates).`
    )
      ? "replace"
      : "merge";

    setImporting(true);
    try {
      let studentsAdded = 0;
      let attendanceAdded = 0;

      await db.transaction("rw", db.students, db.attendance, async () => {
        if (mode === "replace") {
          await db.attendance.clear();
          await db.students.clear();
        }

        const oldToNew = {};

        for (const s of parsed.students) {
          const oldId = s.id;
          if (mode === "merge") {
            const existing = await db.students
              .filter(
                (r) =>
                  r.name.trim().toLowerCase() ===
                  (s.name || "").trim().toLowerCase()
              )
              .first();
            if (existing) {
              oldToNew[oldId] = existing.id;
              continue;
            }
          }
          const { id: _drop, ...rest } = s;
          const newId = await db.students.add(rest);
          oldToNew[oldId] = newId;
          studentsAdded++;
        }

        for (const rec of parsed.attendance) {
          const newStudentId = oldToNew[rec.studentId];
          if (!newStudentId) continue;

          if (mode === "merge") {
            const dup = await db.attendance
              .where({
                studentId: newStudentId,
                date: rec.date,
                startTime: rec.startTime,
                endTime: rec.endTime,
              })
              .first();
            if (dup) continue;
          }
          const { id: _d, ...recRest } = rec;
          await db.attendance.add({ ...recRest, studentId: newStudentId });
          attendanceAdded++;
        }
      });

      setStatus({
        type: "success",
        msg: `${
          mode === "replace" ? "Restore" : "Merge"
        } complete — ${studentsAdded} student(s) and ${attendanceAdded} session(s) imported.`,
      });
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", msg: "Restore failed: " + err.message });
    } finally {
      setImporting(false);
    }
  };

  /* ── 2b. Import XLSX / XLS / CSV History Report ── */
  const handleSheetImport = async (file) => {
    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
      const sheetName = workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
        defval: "",
      });

      if (rows.length === 0) {
        setStatus({ type: "error", msg: "Sheet is empty — nothing to import." });
        setImporting(false);
        return;
      }

      let studentsAdded = 0;
      let attendanceAdded = 0;

      await db.transaction("rw", db.students, db.attendance, async () => {
        const existingStudents = await db.students.toArray();
        const nameMap = {};
        existingStudents.forEach((s) => {
          nameMap[s.name.trim().toLowerCase()] = s;
        });

        for (const row of rows) {
          const rawName = String(
            pick(row, "Student", "Student Name", "Name", "Student name") || ""
          ).trim();
          if (!rawName) continue;

          const nameKey = rawName.toLowerCase();
          let student = nameMap[nameKey];

          if (!student) {
            const rawRate = pick(
              row,
              "Hourly Rate",
              "Rate",
              "Amount",
              "Earning",
              "Total Earning"
            );
            const paymentAmount = parseFloat(rawRate) || 0;
            const rawPayType = String(
              pick(row, "Payment Type", "PaymentType") || ""
            )
              .trim()
              .toLowerCase();
            const paymentType = ["daily", "monthly"].includes(rawPayType)
              ? rawPayType
              : "hourly";
            const className = String(
              pick(row, "Class", "Class Name", "ClassName") || ""
            ).trim();

            const newId = await db.students.add({
              name: rawName,
              className,
              paymentType,
              paymentAmount,
              hourlyRate: paymentType === "hourly" ? paymentAmount : 0,
              createdAt: new Date().toISOString(),
            });
            student = {
              id: newId,
              name: rawName,
              hourlyRate: paymentType === "hourly" ? paymentAmount : 0,
            };
            nameMap[nameKey] = student;
            studentsAdded++;
          }

          const date = normalizeDate(
            pick(row, "Date", "Class Date", "ClassDate")
          );
          const startTime = normalizeTime(
            pick(row, "Start Time", "Start", "StartTime", "start_time")
          );
          const endTime = normalizeTime(
            pick(row, "End Time", "End", "EndTime", "end_time")
          );

          if (!date || !startTime || !endTime) continue;

          const dup = await db.attendance
            .where({ studentId: student.id, date, startTime, endTime })
            .first();
          if (dup) continue;

          await db.attendance.add({
            studentId: student.id,
            date,
            startTime,
            endTime,
          });
          attendanceAdded++;
        }
      });

      setStatus({
        type: "success",
        msg: `Import complete — ${studentsAdded} new student(s) created, ${attendanceAdded} session(s) imported.`,
      });
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", msg: "Import failed: " + err.message });
    } finally {
      setImporting(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setStatus(null);

    const name = file.name.toLowerCase();
    if (name.endsWith(".json")) {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        await handleJsonRestore(parsed);
      } catch {
        setStatus({ type: "error", msg: "Could not parse JSON file." });
      }
    } else if (
      name.endsWith(".xlsx") ||
      name.endsWith(".xls") ||
      name.endsWith(".csv")
    ) {
      await handleSheetImport(file);
    } else {
      setStatus({
        type: "error",
        msg: "Unsupported file type. Please upload .json, .xlsx, .xls, or .csv.",
      });
    }
  };

  return (
    <div className="downloads-page">
      <div className="downloads-header">
        <div>
          <p className="page-eyebrow">Report Archive</p>
          <h1>Export History</h1>
          <p className="page-subtitle">
            View, backup, restore, and manage your attendance data.
          </p>
        </div>

        {downloads.length > 0 && (
          <button className="clear-history-btn" onClick={clearHistory}>
            <Trash2 size={14} />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* ── Backup & Restore Card ── */}
      <div className="backup-card card">
        <div className="backup-card-header">
          <div className="backup-card-icon">
            <HardDrive size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="backup-card-title">Backup &amp; Restore</h2>
            <p className="backup-card-sub">
              Save a full local database backup or restore from a previously exported report.
            </p>
          </div>
        </div>

        {status && (
          <div className={`import-status import-status--${status.type}`}>
            {status.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{status.msg}</span>
            <button
              className="import-status-close"
              onClick={() => setStatus(null)}
              title="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <div className="backup-actions">
          <button
            className="backup-btn backup-btn--primary"
            onClick={downloadBackup}
            disabled={importing}
          >
            <Download size={16} strokeWidth={2.2} />
            <span>Download Full Backup (.json)</span>
          </button>

          <button
            className="backup-btn backup-btn--secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <Upload size={16} strokeWidth={2.2} />
            <span>
              {importing ? "Importing…" : "Upload Backup or History Report"}
            </span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.xlsx,.xls,.csv"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>

        <p className="backup-hint">
          Accepts <strong>.json</strong> (full backup) and <strong>.xlsx / .xls / .csv</strong> (exported attendance report). Duplicate sessions are skipped automatically.
        </p>
      </div>

      {/* ── Export History Table ── */}
      <div className="export-stats">
        <div className="export-stat card">
          <span>Total Exports</span>
          <strong>{downloads.length}</strong>
        </div>
      </div>

      {downloads.length === 0 ? (
        <div className="empty-downloads card">
          <div className="empty-icon">
            <FileSpreadsheet size={28} strokeWidth={1.8} />
          </div>
          <h3>No exports yet</h3>
          <p>Your exported attendance reports will appear here.</p>
        </div>
      ) : (
        <div className="downloads-table-wrapper">
          <table className="downloads-table">
            <thead>
              <tr>
                <th>Report</th>
                <th>Exported</th>
                <th>Date Range</th>
                <th>Student</th>
                <th>Classes</th>
                <th>Hours</th>
                <th>Earnings</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {downloads.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="report-file">
                      <div className="file-icon">
                        <FileSpreadsheet size={18} />
                      </div>
                      <div>
                        <strong>{item.fileName}</strong>
                        <span>Excel Spreadsheet</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    {new Date(item.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>
                    <div className="date-range">
                      <span>
                        {item.fromDate ? formatDate(item.fromDate) : "All Time"}
                      </span>
                      {item.toDate && (
                        <>
                          <span>→</span>
                          <span>{formatDate(item.toDate)}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td>{item.studentName || "All Students"}</td>
                  <td>{item.recordsCount}</td>
                  <td>
                    <strong>{item.totalHours}</strong> hrs
                  </td>
                  <td>
                    <strong className="earning-value">
                      ₹{Number(item.totalEarning).toLocaleString("en-IN")}
                    </strong>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="view-report-btn"
                        onClick={() => viewReport(item)}
                        title="View Report"
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </button>
                      <button
                        className="delete-export-btn"
                        onClick={() => deleteExport(item.id)}
                        title="Delete from History"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Downloads;
