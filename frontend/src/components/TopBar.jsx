import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TopBar({
  title,
  subtitle,
  back = true,
  onBack,
  right = null,
  line = false,
  className = '',
}) {
  const navigate = useNavigate();
  return (
    <header className={'topbar ' + (line ? 'topbar--line ' : '') + className}>
      {back ? (
        <button
          type="button"
          className="icon-btn icon-btn--ghost"
          aria-label="返回"
          onClick={() => (onBack ? onBack() : navigate(-1))}
        >
          <ArrowLeft size={20} />
        </button>
      ) : null}
      <div className="topbar-main">
        {title ? <div className="topbar-title">{title}</div> : null}
        {subtitle ? <div className="topbar-sub">{subtitle}</div> : null}
      </div>
      {right}
    </header>
  );
}
