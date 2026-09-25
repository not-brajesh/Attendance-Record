import "./StatCard.css";

function StatCard({ label, value, icon, accent = false }) {
  return (
    <div className={`stat-card ${accent ? "accent" : ""}`}>
      {icon && <span className="stat-icon">{icon}</span>}

      <div className="stat-body">
        <p className="stat-label">{label}</p>
        <h3 className="stat-value">{value}</h3>
      </div>
    </div>
  );
}

export default StatCard;