import { useEffect, useState } from "react";
import { db } from "../db/database";
import { formatDate } from "../utils/dateUtils";
import "./Downloads.css";

function Downloads() {
  const [downloads, setDownloads] = useState([]);

  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    const data = await db.downloads
      .orderBy("createdAt")
      .reverse()
      .toArray();

    setDownloads(data);
  };

  const clearHistory = async () => {
    if (!confirm("Clear all export history?")) return;

    await db.downloads.clear();
    loadDownloads();
  };

  // ✅ Delete single export
  const deleteExport = async (id) => {
    if (!confirm("Delete this export from history?")) return;

    await db.downloads.delete(id);
    loadDownloads();
  };

  // ✅ View Report with metadata + print button
  const viewReport = (item) => {
    const report = JSON.parse(item.reportData);

    const newWindow = window.open("", "_blank");

    newWindow.document.write(`
      <html>
        <head>
          <title>${item.fileName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 30px;
              color: #1d1d1f;
            }

            h1 {
              margin-bottom: 10px;
              font-size: 26px;
            }

            .meta {
              background: #f5f5f7;
              padding: 16px 20px;
              border-radius: 12px;
              margin: 16px 0 24px;
              font-size: 14px;
              line-height: 1.7;
            }

            .meta p {
              margin: 4px 0;
            }

            .print-btn {
              background: #007aff;
              color: #fff;
              border: 0;
              padding: 10px 20px;
              border-radius: 10px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              margin-bottom: 20px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 13px;
            }

            th, td {
              border: 1px solid #d1d5db;
              padding: 10px;
              text-align: left;
            }

            th {
              background: #f5f5f7;
              font-weight: 700;
            }

            tr:nth-child(even) td {
              background: #fafafa;
            }

            @media print {
              button {
                display: none;
              }
            }
          </style>
        </head>

        <body>
          <h1>${item.fileName}</h1>

          <div class="meta">
            <p>
              <strong>Exported:</strong>
              ${new Date(item.createdAt).toLocaleString("en-IN")}
            </p>

            <p>
              <strong>Student:</strong>
              ${item.studentName || "All Students"}
            </p>

            <p>
              <strong>Date Range:</strong>
              ${item.fromDate || "All Time"}
              ${item.toDate ? ` → ${item.toDate}` : ""}
            </p>

            <p>
              <strong>Total Classes:</strong>
              ${item.recordsCount}
            </p>

            <p>
              <strong>Total Hours:</strong>
              ${item.totalHours} hrs
            </p>

            <p>
              <strong>Total Earnings:</strong>
              ₹${item.totalEarning}
            </p>
          </div>

          <button class="print-btn" onclick="window.print()">
            Print / Save PDF
          </button>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Duration</th>
                <th>Total Hours</th>
                <th>Hourly Rate</th>
                <th>Total Earning</th>
              </tr>
            </thead>

            <tbody>
              ${report
                .map(
                  (row) => `
                    <tr>
                      <td>${row.Date}</td>
                      <td>${row.Student}</td>
                      <td>${row["Start Time"]}</td>
                      <td>${row["End Time"]}</td>
                      <td>${row.Duration}</td>
                      <td>${row["Total Hours"]}</td>
                      <td>₹${row["Hourly Rate"]}</td>
                      <td>₹${row["Total Earning"]}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `);

    newWindow.document.close();
  };

  return (
    <div className="downloads-page">
      {/* ✅ Professional header */}
      <div className="downloads-header">
        <div>
          <p className="page-eyebrow">REPORT ARCHIVE</p>
          <h1>Export History</h1>
          <p className="page-subtitle">
            View and manage your previously exported attendance reports.
          </p>
        </div>

        {downloads.length > 0 && (
          <button
            className="clear-history-btn"
            onClick={clearHistory}
          >
            Clear History
          </button>
        )}
      </div>

      {/* ✅ Total exports stat */}
      <div className="export-stats">
        <div className="export-stat">
          <span>Total Exports</span>
          <strong>{downloads.length}</strong>
        </div>
      </div>

      {/* ✅ Empty state / table */}
      {downloads.length === 0 ? (
        <div className="empty-downloads">
          <div className="empty-icon">↓</div>
          <h3>No exports yet</h3>
          <p>
            Your exported attendance reports will appear here.
          </p>
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
                  {/* ✅ File name as report card */}
                  <td>
                    <div className="report-file">
                      <div className="file-icon">XLS</div>
                      <div>
                        <strong>{item.fileName}</strong>
                        <span>Excel Report</span>
                      </div>
                    </div>
                  </td>

                  {/* ✅ Formatted date & time */}
                  <td>
                    {new Date(item.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>

                  {/* ✅ Readable date range */}
                  <td>
                    <div className="date-range">
                      <span>
                        {item.fromDate
                          ? formatDate(item.fromDate)
                          : "All Time"}
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

                  {/* ✅ Cleaner hours */}
                  <td>
                    <strong>{item.totalHours}</strong> hrs
                  </td>

                  {/* ✅ Highlighted earnings */}
                  <td>
                    <strong className="earning-value">
                      ₹{Number(item.totalEarning).toLocaleString("en-IN")}
                    </strong>
                  </td>

                  {/* ✅ Action buttons */}
                  <td>
                    <div className="action-buttons">
                      <button
                        className="view-report-btn"
                        onClick={() => viewReport(item)}
                      >
                        View Report →
                      </button>

                      <button
                        className="delete-export-btn"
                        onClick={() => deleteExport(item.id)}
                      >
                        Delete
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