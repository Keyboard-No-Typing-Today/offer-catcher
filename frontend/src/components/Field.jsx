export default function Field({ label, hint, error, htmlFor, children }) {
  return (
    <label className="field" htmlFor={htmlFor}>
      {label ? <span className="label">{label}</span> : null}
      {children}
      {error ? <span className="error-text">{error}</span> : hint ? <span className="hint">{hint}</span> : null}
    </label>
  );
}
