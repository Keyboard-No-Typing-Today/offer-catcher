export default function EmptyState({ icon = null, title, description, action = null }) {
  return (
    <div className="empty">
      <div className="empty-mark" aria-hidden="true">{icon}</div>
      <div className="empty-title">{title}</div>
      {description ? <div className="empty-text">{description}</div> : null}
      {action ? <div className="mt-8">{action}</div> : null}
    </div>
  );
}
