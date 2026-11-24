import { useEffect, useState } from 'react';
import { WifiOff, X } from 'lucide-react';

export default function OfflineBanner({ online, aiState }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [aiState, online]);

  if (aiState !== 'offline' || dismissed) return null;
  const message = online ? 'AI 服务未连接 · 本地分析可用' : 'AI 未连接 · 本地分析可用';

  return (
    <div className="offline-banner" role="status">
      <span className="network-dot" />
      <WifiOff size={12} />
      <span>{message}</span>
      <button className="offline-close" type="button" aria-label="关闭提示" onClick={() => setDismissed(true)}>
        <X size={12} />
      </button>
    </div>
  );
}
