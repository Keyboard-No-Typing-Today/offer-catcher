import { useToastStore } from '../store/useToastStore.js';

export default function Toast() {
  const toast = useToastStore((state) => state.toast);
  if (!toast) return null;
  return (
    <div className={'toast toast--' + (toast.tone || 'default')} role="status">
      {toast.message}
    </div>
  );
}
