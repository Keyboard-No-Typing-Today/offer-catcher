export default function Chip({
  children,
  active = false,
  tone = '',
  as: Tag = 'span',
  className = '',
  ...props
}) {
  const classes = [
    'chip',
    active ? 'chip--active' : '',
    tone ? 'chip--' + tone : '',
    className,
  ].filter(Boolean).join(' ');
  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  );
}
