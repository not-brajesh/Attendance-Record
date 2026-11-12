import React from "react";
import "./StatCard.css";

function StatCard({ label, value, icon, variant = "brand", sublabel }) {
  return (
    <div className={`stat-card stat-card--${variant}`}>
      {icon && (
        <div className={`stat-icon-wrap stat-icon--${variant}`}>
          {icon}
        </div>
      )}
      <div className="stat-body">
        <p className="stat-label">{label}</p>
        <h3 className="stat-value">{value}</h3>
        {sublabel && <span className="stat-sublabel">{sublabel}</span>}
      </div>
    </div>
  );
}

export default StatCard;
