import { WifiOff } from 'lucide-react';

export default function OfflineBanner({ online }) {
  if (online) return null;
  return (
    <div className="offline-banner" role="status">
      <span className="network-dot" />
      <WifiOff size={12} />
      网络受限 · 本地分析可用
    </div>
  );
}
