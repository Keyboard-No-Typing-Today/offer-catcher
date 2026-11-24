import { hapticTap } from '../hooks/useHaptics.js';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  icon = null,
  className = '',
  onClick,
  ...props
}) {
  const classes = [
    'btn',
    variant !== 'primary' ? 'btn--' + variant : '',
    size === 'sm' ? 'btn--sm' : size === 'lg' ? 'btn--lg' : '',
    block ? 'btn--block' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={classes}
      onClick={(event) => {
        hapticTap('light');
        if (onClick) onClick(event);
      }}
      aria-busy={loading || undefined}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <span className="spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}
