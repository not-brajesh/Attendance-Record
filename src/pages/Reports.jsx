import { useEffect, useState } from "react";
import { db } from "../db/database";
import * as XLSX from "xlsx";
import {
  calculateMinutes,
  formatDuration,
  calculateEarning,
} from "../utils/calculations";
import {
  getLocalDate,
  getMonthStart,
  getMonthEnd,
  formatDate,
} from "../utils/dateUtils";
import StatCard from "../components/StatCard";
import "./Reports.css";

function Reports() {
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState([]);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [studentFilter, setStudentFilter] = useState("");

  // ✅ Edit states
  const [editingId, setEditingId] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editStudentId, setEditStudentId] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const studentData = await db.students.toArray();
    const attendanceData = await db.attendance.toArray();

    setStudents(studentData);
    setRecords(attendanceData);
  };

  // ✅ This Month range shortcut (using utils — no UTC shift)
  const getMonthRange = () => {
    const now = new Date();
    setFromDate(getMonthStart(now));
    setToDate(getMonthEnd(now));
  };

  // ✅ Today range shortcut
  const getTodayRange = () => {
    const today = getLocalDate();
    setFromDate(today);
    setToDate(today);
  };

  // ✅ All Time
  const getAllTime = () => {
    setFromDate("");
    setToDate("");
    setStudentFilter("");
  };

  const getStudentName = (studentId) => {
    const student = students.find((s) => s.id === studentId);
    return student?.name || "Unknown";
  };

  // ✅ Filter + sort (latest first)
  const filteredRecords = records
    .filter((record) => {
      const dateMatch =
        (!fromDate || record.date >= fromDate) &&
        (!toDate || record.date <= toDate);

      const studentMatch =
        !studentFilter ||
        String(record.studentId) === String(studentFilter);

      return dateMatch && studentMatch;
    })
    .sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.startTime.localeCompare(a.startTime);
    });

  const totalMinutes = filteredRecords.reduce(
    (total, record) =>
      total + calculateMinutes(record.startTime, record.endTime),
    0
  );

  // ✅ Total Earning calculation
  const totalEarning = filteredRecords.reduce((total, record) => {
    const student = students.find((s) => s.id === record.studentId);
    const minutes = calculateMinutes(record.startTime, record.endTime);
    return total + calculateEarning(minutes, student?.hourlyRate);
  }, 0);

  // ✅ Student-wise Summary (only students with classes)
  const studentSummary = students
    .map((student) => {
      const studentRecords = filteredRecords.filter(
        (record) => record.studentId === student.id
      );

      const minutes = studentRecords.reduce(
        (total, record) =>
          total + calculateMinutes(record.startTime, record.endTime),
        0
      );

      return {
        id: student.id,
        name: student.name,
        classes: studentRecords.length,
        minutes,
        hours: minutes / 60,
        hourlyRate: Number(student.hourlyRate || 0),
        earning: calculateEarning(minutes, student.hourlyRate),
      };
    })
    .filter((student) => student.classes > 0);

  // ✅ Delete attendance function
  const deleteAttendance = async (id) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this attendance?"
    );

    if (!confirmDelete) return;

    await db.attendance.delete(id);
    loadData();
  };

  // ✅ Edit functions
  const startEdit = (record) => {
    setEditingId(record.id);
    setEditDate(record.date);
    setEditStudentId(record.studentId);
    setEditStartTime(record.startTime);
    setEditEndTime(record.endTime);
  };

  const saveEdit = async () => {
    // ✅ Validation
    if (!editDate) {
      alert("Please select a date.");
      return;
    }

    if (!editStudentId) {
      alert("Please select a student.");
      return;
    }

    if (!editStartTime || !editEndTime) {
      alert("Please enter start and end time.");
      return;
    }

    if (calculateMinutes(editStartTime, editEndTime) <= 0) {
      alert("End time must be after start time.");
      return;
    }

    await db.attendance.update(editingId, {
      studentId: Number(editStudentId),
      date: editDate,
      startTime: editStartTime,
      endTime: editEndTime,
    });

    setEditingId(null);
    loadData();
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  // ✅ Excel export with 2 sheets + dynamic filename
  const exportExcel = async () => {
    if (filteredRecords.length === 0) {
      alert("No records found for selected filters.");
      return;
    }

    // Sheet 1 — Attendance details
    const data = filteredRecords.map((record) => {
      const student = students.find((s) => s.id === record.studentId);
      const minutes = calculateMinutes(record.startTime, record.endTime);
      const hours = minutes / 60;
      const rate = Number(student?.hourlyRate || 0);

      return {
        Date: record.date,
        Student: student?.name || "Unknown",
        "Start Time": record.startTime,
        "End Time": record.endTime,
        Duration: formatDuration(minutes),
        "Total Hours": hours.toFixed(2),
        "Hourly Rate": rate,
        "Total Earning": (hours * rate).toFixed(2),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    // Sheet 2 — Student Summary
    const summaryData = studentSummary.map((student) => ({
      Student: student.name,
      Classes: student.classes,
      "Total Hours": student.hours.toFixed(2),
      "Hourly Rate": student.hourlyRate,
      "Total Earning": student.earning.toFixed(2),
    }));

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Student Summary");

    // ✅ Dynamic filename
    const fileName =
      fromDate && toDate
        ? `Attendance_${fromDate}_to_${toDate}.xlsx`
        : "Attendance_All_Time.xlsx";

    XLSX.writeFile(workbook, fileName);

    // ✅ Save export history
    const exportHours = totalMinutes / 60;

    await db.downloads.add({
      fileName,
      createdAt: new Date().toISOString(),
      fromDate,
      toDate,
      studentName: studentFilter
        ? getStudentName(Number(studentFilter))
        : "All Students",
      recordsCount: filteredRecords.length,
      totalHours: exportHours.toFixed(2),
      totalEarning: totalEarning.toFixed(2),
      reportData: JSON.stringify(data),
    });
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">ANALYTICS</p>
          <h1>Reports</h1>
          <p className="page-subtitle">
            Attendance reports &amp; earnings overview.
          </p>
        </div>
      </div>

      {/* ✅ Edit Attendance Form (card style) */}
      {editingId && (
        <div className="edit-card">
          <h2>Edit Attendance</h2>

          <div className="form-section">
            <label>Date</label>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
            />
          </div>

          <div className="form-section">
            <label>Student</label>
            <select
              value={editStudentId}
              onChange={(e) => setEditStudentId(e.target.value)}
            >
              <option value="">Select Student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>

          <div className="time-grid">
            <div className="form-section">
              <label>Start Time</label>
              <input
                type="time"
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
              />
            </div>

            <div className="form-section">
              <label>End Time</label>
              <input
                type="time"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="edit-actions">
            <button className="btn-primary" onClick={saveEdit}>
              Save Changes
            </button>
            <button className="btn-secondary" onClick={cancelEdit}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ✅ Filter bar */}
      <div className="filter-card">
        <div className="filter-grid">
          <div className="form-section">
            <label>From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="form-section">
            <label>To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className="form-section">
            <label>Student</label>
            <select
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
            >
              <option value="">All Students</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-buttons">
          <button className="btn-chip" onClick={getTodayRange}>
            Today
          </button>
          <button className="btn-chip" onClick={getMonthRange}>
            This Month
          </button>
          <button className="btn-chip" onClick={getAllTime}>
            All Time
          </button>
        </div>
      </div>

      {/* ✅ StatCards */}
      <div className="report-stats">
        <StatCard
          label="Total Classes"
          value={filteredRecords.length}
        />
        <StatCard
          label="Teaching Time"
          value={formatDuration(totalMinutes)}
        />
        <StatCard
          label="Total Earnings"
          value={`₹${totalEarning.toFixed(2)}`}
          accent
        />
      </div>

      {/* ✅ Export button */}
      <div className="report-actions">
        <button className="btn-primary" onClick={exportExcel}>
          Export XLSX
        </button>
      </div>

      {/* ✅ Student Summary */}
      <h2>Student Summary</h2>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Classes</th>
              <th>Total Hours</th>
              <th>Hourly Rate</th>
              <th>Total Earning</th>
            </tr>
          </thead>

          <tbody>
            {studentSummary.map((student) => (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td>{student.classes}</td>
                <td>{student.hours.toFixed(2)}</td>
                <td>₹{student.hourlyRate}</td>
                <td>₹{student.earning.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {studentSummary.length === 0 && (
        <div className="empty-state">
          <h3>No student activity</h3>
          <p>No classes match the selected filters.</p>
        </div>
      )}

      {/* ✅ Attendance Details */}
      <h2>Attendance Details</h2>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Student</th>
              <th>Start</th>
              <th>End</th>
              <th>Duration</th>
              <th>Hours</th>
              <th>Rate (₹)</th>
              <th>Earning (₹)</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredRecords.map((record) => {
              const minutes = calculateMinutes(
                record.startTime,
                record.endTime
              );

              const student = students.find(
                (s) => s.id === record.studentId
              );
              const rate = Number(student?.hourlyRate || 0);
              const hours = minutes / 60;
              const earning = hours * rate;

              return (
                <tr key={record.id}>
                  <td>{formatDate(record.date)}</td>
                  <td>{getStudentName(record.studentId)}</td>
                  <td>{record.startTime}</td>
                  <td>{record.endTime}</td>
                  <td>{formatDuration(minutes)}</td>
                  <td>{hours.toFixed(2)}</td>
                  <td>{rate}</td>
                  <td>{earning.toFixed(2)}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn-icon"
                        onClick={() => startEdit(record)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={() => deleteAttendance(record.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredRecords.length === 0 && (
        <div className="empty-state">
          <h3>No attendance records</h3>
          <p>No classes match the selected filters.</p>
        </div>
      )}
    </div>
  );
}

export default Reports;