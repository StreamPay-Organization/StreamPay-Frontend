import './EmptyState.css';

/**
 * Friendly placeholder shown when a list has no items.
 * @param {{icon?: string, title?: string, description?: string,
 *   action?: React.ReactNode}} props
 */
export default function EmptyState({
  icon = '🪣',
  title = 'Nothing here yet',
  description,
  action,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" role="img" aria-label="Empty state icon">
        {icon}
      </div>
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__desc">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
