import { config } from './config.js';

export function sanitizeText(value, max = 4000) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

export function clampScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function cleanAiText(value, max) {
  return sanitizeText(value, max)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\x60([^\x60]+)\x60/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '• ');
}

export function asStringArray(value, max = 5, maxLength = 240) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanAiText(item, maxLength))
    .filter(Boolean)
    .slice(0, max);
}

const SUGGESTION_TYPES = new Set(['keyword', 'impact', 'summary', 'project', 'format', 'education', 'polish', 'general']);

export function normalizeAiAnalysis(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const score = clampScore(raw.score);
  const summary = cleanAiText(raw.summary, 600);
  const strengths = asStringArray(raw.strengths, 5, 220);
  const gaps = asStringArray(raw.gaps, 4, 220);
  const dimensions = {};
  if (raw.dimensions && typeof raw.dimensions === 'object') {
    for (const key of ['skills', 'experience', 'education', 'keywords', 'quality']) {
      const value = clampScore(raw.dimensions[key]);
      if (value !== null) dimensions[key] = value;
    }
  }
  const suggestions = Array.isArray(raw.suggestions)
    ? raw.suggestions.slice(0, config.limits.suggestions).map((item) => {
        if (!item || typeof item !== 'object') return null;
        const title = cleanAiText(item.title, 90);
        const detail = cleanAiText(item.detail, 420);
        if (!title || !detail) return null;
        return {
          type: SUGGESTION_TYPES.has(item.type) ? item.type : 'general',
          title,
          detail,
          priority: Math.max(1, Math.min(3, Number(item.priority) || 2)),
        };
      }).filter(Boolean)
    : [];
  if (!summary && !suggestions.length && score === null) return null;
  return { score, summary, strengths, gaps, dimensions, suggestions };
}

export function normalizeMessages(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && (item.role === 'user' || item.role === 'assistant'))
    .map((item) => ({ role: item.role, content: sanitizeText(item.content, config.limits.messageChars) }))
    .filter((item) => item.content)
    .slice(-config.limits.messages);
}

export function validateAnalyzeInput(body) {
  const resumeText = sanitizeText(body?.resumeText, config.limits.resumeChars);
  const jdText = sanitizeText(body?.jdText, config.limits.jdChars);
  if (resumeText.length < 20) return { error: '简历文本太短，至少需要 20 个字符' };
  if (jdText.length < 20) return { error: '岗位描述太短，至少需要 20 个字符' };
  return {
    resumeText,
    jdText,
    job: {
      title: sanitizeText(body?.job?.title, 120),
      company: sanitizeText(body?.job?.company, 120),
    },
    local: body?.local && typeof body.local === 'object' ? body.local : null,
  };
}