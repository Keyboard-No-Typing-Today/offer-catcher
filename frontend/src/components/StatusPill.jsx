import { TRACKER_STATUS_MAP } from '../lib/constants.js';

export default function StatusPill({ status }) {
  const meta = TRACKER_STATUS_MAP[status] || TRACKER_STATUS_MAP.saved;
  return (
    <span className={'status-pill status-pill--' + meta.id}>
      <span className="dot" />
      {meta.label}
    </span>
  );
}
