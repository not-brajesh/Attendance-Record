import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../db/database";
import StatCard from "../components/StatCard";
import {
  calculateMinutes,
  calculateEarning,
  calculateStudentEarning,
  formatDuration,
} from "../utils/calculations";
import { getMonthStart, getMonthEnd, formatDate } from "../utils/dateUtils";
import {
  Users,
  BookOpen,
  Clock,
  IndianRupee,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import "./Dashboard.css";

function Dashboard() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const studentData = await db.students.toArray();
      const attendanceData = await db.attendance.toArray();
      setStudents(studentData);
      setAttendance(attendanceData);
    } catch (err) {
      console.error("Dashboard: failed to load data from IndexedDB", err);
      setStudents([]);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  // Student lookup map
  const studentMap = {};
  students.forEach((s) => {
    studentMap[s.id] = s;
  });

  // This Month range
  const monthStart = getMonthStart();
  const monthEnd = getMonthEnd();

  const monthRecords = attendance.filter(
    (r) => r.date >= monthStart && r.date <= monthEnd
  );

  const monthMinutes = monthRecords.reduce(
    (t, r) => t + calculateMinutes(r.startTime, r.endTime),
    0
  );

  // Overall Minutes
  const totalMinutes = attendance.reduce(
    (t, r) => t + calculateMinutes(r.startTime, r.endTime),
    0
  );

  const studentSummary = students
    .map((student) => {
      const allRecs = attendance.filter((r) => r.studentId === student.id);
      const allMins = allRecs.reduce(
        (t, r) => t + calculateMinutes(r.startTime, r.endTime),
        0
      );
      const allEarning = calculateStudentEarning(student, allMins, allRecs.length);

      const mRecs = monthRecords.filter((r) => r.studentId === student.id);
      const mMins = mRecs.reduce(
        (t, r) => t + calculateMinutes(r.startTime, r.endTime),
        0
      );
      const mEarning = calculateStudentEarning(student, mMins, mRecs.length);

      return {
        id: student.id,
        name: student.name,
        className: student.className,
        classes: allRecs.length,
        hours: allMins / 60,
        earning: allEarning,
        monthClasses: mRecs.length,
        monthHours: mMins / 60,
        monthEarning: mEarning,
      };
    })
    .sort((a, b) => b.earning - a.earning);

  const allTimeTotalEarning = studentSummary.reduce((sum, s) => sum + s.earning, 0);
  const monthTotalEarning = studentSummary.reduce((sum, s) => sum + s.monthEarning, 0);

  const maxStudentEarning = Math.max(...studentSummary.map((s) => s.earning), 1);

  // Recent 5 classes
  const recentRecords = [...attendance]
    .sort(
      (a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime)
    )
    .slice(0, 5);

  const getSessionEarning = (record, student) => {
    if (!student) return 0;
    if (student.paymentType === "daily" || student.paymentType === "per_class") {
      return Number(student.paymentAmount || 0);
    }
    const mins = calculateMinutes(record.startTime, record.endTime);
    return calculateEarning(mins, student.hourlyRate || student.paymentAmount);
  };

  const todayFormatted = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const monthLabel = new Date().toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Loading overview…</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* ── 1. Top Header ── */}
      <header className="dashboard-header">
        <div className="header-text-group">
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-sub">{todayFormatted}</p>
        </div>
        <Link to="/attendance" className="header-log-btn">
          <Plus size={16} strokeWidth={2.5} />
          <span>Log</span>
        </Link>
      </header>

      {/* ── 2. Hero Card: This Month's Summary ── */}
      <section className="hero-summary-card">
        <div className="hero-header">
          <div className="hero-title-group">
            <span className="page-eyebrow">Overview</span>
            <h2 className="hero-title">This Month's Summary</h2>
          </div>
          <span className="month-badge">{monthLabel}</span>
        </div>

        <div className="hero-metrics-row">
          <div className="hero-metric">
            <span className="hero-metric-label">Classes</span>
            <strong className="hero-metric-value">{monthRecords.length}</strong>
          </div>
          <div className="hero-divider" />
          <div className="hero-metric">
            <span className="hero-metric-label">Teaching Time</span>
            <strong className="hero-metric-value">
              {formatDuration(monthMinutes)}
            </strong>
          </div>
          <div className="hero-divider" />
          <div className="hero-metric">
            <span className="hero-metric-label">Earnings</span>
            <strong className="hero-metric-value hero-metric-value--earn">
              ₹{monthTotalEarning.toLocaleString("en-IN")}
            </strong>
          </div>
        </div>

        <Link to="/attendance" className="hero-cta-btn">
          <Plus size={18} strokeWidth={2.4} />
          <span>Record Class</span>
        </Link>
      </section>

      {/* ── 3. 2x2 Bento Metric Grid ── */}
      <section className="bento-grid">
        <StatCard
          label="Active Students"
          value={students.length}
          icon={<Users size={20} strokeWidth={2} />}
          variant="indigo"
        />
        <StatCard
          label="Total Classes"
          value={attendance.length}
          icon={<BookOpen size={20} strokeWidth={2} />}
          variant="amber"
        />
        <StatCard
          label="Teaching Hours"
          value={formatDuration(totalMinutes)}
          icon={<Clock size={20} strokeWidth={2} />}
          variant="sage"
        />
        <StatCard
          label="All-Time Earnings"
          value={`₹${allTimeTotalEarning.toLocaleString("en-IN")}`}
          icon={<IndianRupee size={20} strokeWidth={2} />}
          variant="terracotta"
        />
      </section>

      {/* ── 4 & 5. Lower Columns: Student Breakdown + Recent Classes ── */}
      <section className="dashboard-columns">
        {/* Student Earnings Breakdown Card */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Student Breakdown</h2>
              <span className="panel-sub">Share of all-time tuition earnings</span>
            </div>
            <span className="panel-badge">{students.length} Students</span>
          </div>

          {studentSummary.length === 0 ? (
            <p className="empty-text">No students added yet.</p>
          ) : (
            <div className="student-progress-list">
              {studentSummary.map((s) => {
                const pct = Math.min(
                  100,
                  Math.round((s.earning / maxStudentEarning) * 100)
                );
                return (
                  <div key={s.id} className="student-progress-item">
                    <div className="student-progress-top">
                      <div className="student-name-meta">
                        <span className="student-progress-name">{s.name}</span>
                        {s.className && (
                          <span className="student-progress-class">
                            {s.className}
                          </span>
                        )}
                      </div>
                      <div className="student-earning-meta">
                        <span className="student-classes-tag">
                          {s.classes} classes
                        </span>
                        <strong className="student-progress-earning">
                          ₹{s.earning.toLocaleString("en-IN")}
                        </strong>
                      </div>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent & Today's Classes Card */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Recent Classes</h2>
              <span className="panel-sub">Latest tuition sessions logged</span>
            </div>
            <Link to="/reports" className="see-all-link">
              <span>See All</span>
              <ArrowUpRight size={15} strokeWidth={2.4} />
            </Link>
          </div>

          {recentRecords.length === 0 ? (
            <p className="empty-text">No classes recorded yet.</p>
          ) : (
            <div className="recent-classes-list">
              {recentRecords.map((r) => {
                const student = studentMap[r.studentId];
                const mins = calculateMinutes(r.startTime, r.endTime);
                const earn = getSessionEarning(r, student);
                const initial = student?.name
                  ? student.name.charAt(0).toUpperCase()
                  : "?";

                return (
                  <div key={r.id} className="recent-class-item">
                    <div className="recent-avatar">{initial}</div>
                    <div className="recent-details">
                      <div className="recent-top-line">
                        <span className="recent-name">
                          {student?.name || "Unknown"}
                        </span>
                        <span className="recent-date">
                          {formatDate(r.date)}
                        </span>
                      </div>
                      <div className="recent-bottom-line">
                        <span className="recent-time">
                          {r.startTime} – {r.endTime}
                        </span>
                        <span className="recent-duration-tag">
                          {formatDuration(mins)}
                        </span>
                      </div>
                    </div>
                    <div className="recent-earn-badge">+₹{earn}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
