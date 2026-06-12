import './StatCard.css';

/**
 * Compact metric card for dashboard summaries.
 * @param {{label: string, value: React.ReactNode, hint?: string,
 *   icon?: string}} props
 */
export default function StatCard({ label, value, hint, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-card__top">
        {icon && (
          <span className="stat-card__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="stat-card__label">{label}</span>
      </div>
      <div className="stat-card__value">{value}</div>
      {hint && <div className="stat-card__hint">{hint}</div>}
    </div>
  );
}
