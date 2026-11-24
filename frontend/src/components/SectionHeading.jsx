export default function SectionHeading({ index, title, action, className = '' }) {
  return (
    <div className={'between ' + className}>
      <div className="row gap-8">
        {index ? <span className="eyebrow">{index}</span> : null}
        <h3 className="result-section-title">{title}</h3>
      </div>
      {action}
    </div>
  );
}
