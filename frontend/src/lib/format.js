export function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatDate(value, style = 'short') {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  if (style === 'time') return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  if (style === 'long') return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export function timeAgo(value) {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff) || diff < 0) return formatDate(value);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`;
  return formatDate(value);
}

export function truncate(value, length = 80) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

export function scoreLabel(score) {
  if (score >= 80) return '高度匹配';
  if (score >= 65) return '值得投递';
  if (score >= 50) return '需要补强';
  return '暂不建议';
}

export function initials(name = '') {
  const value = String(name).trim();
  if (!value) return '捕';
  if (/^[\u4e00-\u9fa5]/.test(value)) return value.slice(0, 1);
  return value.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

export function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const area = document.createElement('textarea');
  area.value = text;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  document.body.removeChild(area);
  return Promise.resolve();
}

export function downloadText(filename, text, mime = 'application/json') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function safeParse(value, fallback = null) {
  try { return JSON.parse(value); } catch { return fallback; }
}

export function cleanMarkdown(value = '') {
  return String(value || '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
