import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { pushBackHandler } from '../lib/backHandler.js';

export default function Sheet({ open, onClose, title, children, footer = null }) {
  useEffect(() => {
    if (!open) return undefined;
    const releaseBack = pushBackHandler(onClose);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      releaseBack();
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <section className="sheet" role="dialog" aria-modal="true" aria-label={title || '面板'}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <div className="sheet-title">{title}</div>
          <button type="button" className="icon-btn icon-btn--ghost" aria-label="关闭" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="sheet-body">
          {children}
          {footer ? <div className="mt-20">{footer}</div> : null}
        </div>
      </section>
    </>,
    document.body
  );
}
