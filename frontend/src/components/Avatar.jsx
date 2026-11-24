import { initials } from '../lib/format.js';

export default function Avatar({ name, size = 'md', className = '' }) {
  return (
    <div className={'avatar ' + (size === 'lg' ? 'avatar--lg ' : '') + className} aria-hidden="true">
      {initials(name)}
    </div>
  );
}
