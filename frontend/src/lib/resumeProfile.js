import { findSkills, normalize } from './skills.js';

export const SECTION_DEFS = [
  { key: 'summary', labels: ['个人总结', '自我评价', '个人简介', '个人概述', '简介', 'summary', 'profile', 'about me', 'objective'] },
  { key: 'education', labels: ['教育经历', '教育背景', '教育', '学历', 'education', 'academic background'] },
  { key: 'experience', labels: ['工作经历', '实习经历', '工作经验', '职业经历', '实践经历', 'experience', 'work experience', 'employment', 'internship'] },
  { key: 'projects', labels: ['项目经历', '项目经验', '项目', 'projects', 'project experience', 'research projects'] },
  { key: 'skills', labels: ['专业技能', '技能', '技能清单', '技术栈', '个人技能', 'skills', 'technical skills', 'expertise'] },
  { key: 'awards', labels: ['获奖经历', '获奖', '荣誉', '奖项', '证书', '资格证书', 'awards', 'honors', 'certifications', 'certificates'] },
  { key: 'campus', labels: ['校园经历', '社团经历', '校园活动', '学生工作', 'campus', 'activities', 'leadership'] },
  { key: 'publications', labels: ['论文', '发表', '科研成果', 'publications', 'research'] },
];

const LABEL_INDEX = [];
for (const def of SECTION_DEFS) {
  for (const label of def.labels) {
    LABEL_INDEX.push({ key: def.key, label: label.toLowerCase() });
  }
}
LABEL_INDEX.sort((a, b) => b.label.length - a.label.length);

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE_RE = /(?:\+?86[\s-]?)?1[3-9]\d{9}/;
const LINK_RE = /(?:https?:\/\/[^\s)）]+|(?:github|linkedin|gitee)\.com\/[^\s)）]+|www\.[^\s)）]+)/gi;
const BULLET_RE = /^\s*(?:[-*•·▪◦●○]|\d{1,2}[.、)）])\s*/;

function cleanLine(line) {
  return line.replace(/^[#]+\s*/, '').replace(/\s+$/, '').trim();
}

function matchHeading(line) {
  const candidate = cleanLine(line).replace(/[\s|｜]+$/, '');
  if (!candidate || candidate.length > 36) return null;
  const lower = candidate.toLowerCase();
  for (const item of LABEL_INDEX) {
    if (lower === item.label) return { key: item.key, remainder: '' };
    if (!lower.startsWith(item.label)) continue;
    const rest = candidate.slice(item.label.length);
    if (!/^[\s:：|｜·\-—]+/.test(rest)) continue;
    return { key: item.key, remainder: rest.replace(/^[\s:：|｜·\-—]+/, '').trim() };
  }
  return null;
}

function collectSections(lines) {
  const sections = { summary: [], education: [], experience: [], projects: [], skills: [], awards: [], campus: [], publications: [], other: [] };
  let current = 'other';
  for (const raw of lines) {
    const heading = matchHeading(raw);
    if (heading) {
      current = heading.key;
      if (heading.remainder) sections[current].push(heading.remainder);
      continue;
    }
    sections[current].push(cleanLine(raw));
  }
  const joined = {};
  for (const [key, value] of Object.entries(sections)) {
    joined[key] = value.filter(Boolean).join('\n').trim();
  }
  return joined;
}

function extractName(lines, sections) {
  const candidates = lines.slice(0, 8);
  for (const line of candidates) {
    const value = line.replace(/^(?:姓名|名字|name)\s*[:：]\s*/i, '').trim();
    if (!value || value.length > 24) continue;
    if (matchHeading(value)) continue;
    if (EMAIL_RE.test(value) || PHONE_RE.test(value) || /^https?:/i.test(value)) continue;
    if (/\d{4,}/.test(value) || /大学|学院|公司|简历|resume/i.test(value)) continue;
    if (/^[\u4e00-\u9fa5·]{2,4}$/.test(value)) return value;
    if (/^[A-Za-z][A-Za-z .'-]{1,30}$/.test(value) && value.split(/\s+/).length <= 4) return value;
  }
  const summary = (sections.summary || '').split('\n')[0];
  return summary && summary.length <= 16 ? summary : '同学';
}

function extractLinks(text) {
  const links = text.match(LINK_RE) || [];
  return [...new Set(links.map((link) => link.replace(/[),.;]+$/, '')))].slice(0, 3);
}

function detectEducation(text) {
  const haystack = text.toLowerCase();
  if (/博士|ph\.?d|doctor/.test(haystack)) return { level: 5, label: '博士' };
  if (/硕士|研究生|master|m\.?sc|mba/.test(haystack)) return { level: 4, label: '硕士' };
  if (/本科|学士|bachelor|b\.?sc|undergraduate/.test(haystack)) return { level: 3, label: '本科' };
  if (/大专|专科|associate|college/.test(haystack)) return { level: 2, label: '大专' };
  if (/高中|high school/.test(haystack)) return { level: 1, label: '高中' };
  return { level: 0, label: '未填写' };
}

function extractExplicitYears(text) {
  if (/应届|fresh graduate|无经验|no experience/i.test(text)) return 0;
  const matches = [...text.matchAll(/(\d+(?:\.\d+)?)\s*年(?:以上)?(?:相关)?(?:工作|实习|项目|行业)?经验/g)];
  if (!matches.length) return null;
  return Math.max(...matches.map((m) => Number(m[1])));
}

function extractDateYears(text, now = new Date()) {
  const rangeRe = /(20\d{2})[.\-/年]?(\d{1,2})?[^\n]{0,16}?[-–—~至到]\s*(20\d{2}|至今|现在|present)[.\-/年]?(\d{1,2})?/gi;
  let months = 0;
  for (const match of text.matchAll(rangeRe)) {
    const startYear = Number(match[1]);
    const startMonth = Number(match[2]) || 1;
    const endRaw = match[3].toLowerCase();
    let endYear;
    let endMonth;
    if (endRaw === '至今' || endRaw === '现在' || endRaw === 'present') {
      endYear = now.getFullYear();
      endMonth = now.getMonth() + 1;
    } else {
      endYear = Number(match[3]);
      endMonth = Number(match[4]) || 12;
    }
    if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) continue;
    if (endYear < startYear) continue;
    const diff = (endYear - startYear) * 12 + (endMonth - startMonth);
    if (diff > 0 && diff <= 240) months += diff;
  }
  return months ? Math.round((months / 12) * 10) / 10 : 0;
}

function extractBullets(sections) {
  const text = [sections.experience, sections.projects, sections.campus].filter(Boolean).join('\n');
  const bullets = [];
  for (const line of text.split('\n')) {
    const cleaned = line.replace(BULLET_RE, '').trim();
    if (cleaned.length >= 8 && cleaned.length <= 260) bullets.push(cleaned);
  }
  return [...new Set(bullets)].slice(0, 40);
}

function countQuantified(text) {
  const re = /(?:\d+(?:\.\d+)?)\s*(?:%|％|万|亿|千|人|个|次|倍|ms|毫秒|秒|分钟|小时|天|月年|年)|\d+(?:\.\d+)?\s*\+/g;
  return (text.match(re) || []).length;
}

function wordCount(text) {
  const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const latin = (text.match(/[A-Za-z0-9]+/g) || []).length;
  return chinese + latin;
}

function buildCompleteness(profile) {
  let score = 0;
  if (profile.email || profile.phone) score += 15;
  if (profile.sections.education) score += 10;
  if (profile.sections.experience) score += 10;
  if (profile.sections.projects) score += 10;
  if (profile.sections.skills) score += 10;
  if (profile.sections.summary) score += 10;
  if (profile.bullets.length >= 3) score += 15;
  if (profile.quantifiedCount >= 2) score += 15;
  if (profile.wordCount >= 200) score += 5;
  return Math.min(100, score);
}

export function emptyProfile() {
  return {
    name: '', email: '', phone: '', links: [], rawText: '', fileName: '', fileType: '',
    sections: { summary: '', education: '', experience: '', projects: '', skills: '', awards: '', campus: '', publications: '', other: '' },
    skills: [], yearsExperience: 0, educationLevel: 0, educationLabel: '未填写',
    bullets: [], quantifiedCount: 0, wordCount: 0, completeness: 0, updatedAt: 0,
  };
}

export function parseResume(rawText, meta = {}) {
  const text = normalize(rawText || '');
  const lines = text.split('\n').map(cleanLine).filter(Boolean);
  const sections = collectSections(lines);
  const email = (text.match(EMAIL_RE) || [''])[0];
  const phone = (text.match(PHONE_RE) || [''])[0];
  const links = extractLinks(text);
  const name = extractName(lines, sections);
  const skills = findSkills(text, { limit: 24 }).map((item) => ({ name: item.name, category: item.category }));
  const education = detectEducation(text);
  const explicitYears = extractExplicitYears(text);
  const dateYears = extractDateYears([sections.experience, sections.projects, sections.campus].join('\n'));
  const yearsExperience = explicitYears !== null ? explicitYears : dateYears;
  const bullets = extractBullets(sections);
  const quantifiedCount = countQuantified(text);
  const wc = wordCount(text);
  const profile = {
    name,
    email,
    phone,
    links,
    rawText: text,
    fileName: meta.fileName || '',
    fileType: meta.fileType || '',
    sections,
    skills,
    yearsExperience,
    educationLevel: education.level,
    educationLabel: education.label,
    bullets,
    quantifiedCount,
    wordCount: wc,
    completeness: 0,
    updatedAt: Date.now(),
  };
  profile.completeness = buildCompleteness(profile);
  return profile;
}

export function profileHighlights(profile) {
  if (!profile) return [];
  const highlights = [];
  if (profile.updatedAt) highlights.push('简历已保存');
  if (profile.email || profile.phone) highlights.push('联系方式完整');
  if (profile.skills.length) highlights.push(`识别到 ${profile.skills.length} 项技能`);
  if (profile.quantifiedCount) highlights.push(`${profile.quantifiedCount} 处量化结果`);
  return highlights;
}

