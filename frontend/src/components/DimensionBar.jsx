export default function DimensionBar({ label, score, tone = '' }) {
  const value = Math.max(0, Math.min(100, Number(score) || 0));
  return (
    <div className="dimension">
      <div className="dimension-head">
        <span className="dimension-name">{label}</span>
        <span className="dimension-score">{Math.round(value)}</span>
      </div>
      <div className="dim-track">
        <div
          className={'dim-fill ' + (tone ? 'dim-fill--' + tone : '')}
          style={{ width: value + '%' }}
        />
      </div>
    </div>
  );
}
