import { clamp } from '../lib/format.js';

export default function ScoreRing({
  score = 0,
  size = 118,
  stroke = 8,
  label = 'MATCH',
  dark = false,
  className = '',
}) {
  const safe = clamp(Number(score) || 0, 0, 100);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - safe / 100);
  const color = safe >= 80 ? 'var(--success)' : safe >= 65 ? 'var(--accent)' : safe >= 50 ? 'var(--amber)' : 'var(--danger)';
  const view = size;

  return (
    <div
      className={'ring-wrap ' + (dark ? 'ring--ink ' : '') + className}
      style={{ width: size, height: size }}
    >
      <svg className="ring-svg" width={size} height={size} viewBox={'0 0 ' + view + ' ' + view} aria-hidden="true">
        <circle
          className="ring-track"
          cx={view / 2}
          cy={view / 2}
          r={radius}
          strokeWidth={stroke}
        />
        <circle
          className="ring-value"
          cx={view / 2}
          cy={view / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ring-center">
        <span className="ring-number" style={{ fontSize: size * 0.29 }}>{Math.round(safe)}</span>
        <span className="ring-label" style={{ fontSize: Math.max(8, size * 0.07) }}>{label}</span>
      </div>
    </div>
  );
}
