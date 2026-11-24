import { parseJobDescription, jobToDescription } from './jdParser.js';

export const DIMENSION_LABELS = {
  skills: '技能匹配',
  experience: '经验相关',
  education: '教育要求',
  keywords: '关键词覆盖',
  quality: '简历质量',
};

const WEIGHTS = { skills: 0.4, experience: 0.2, education: 0.1, keywords: 0.15, quality: 0.15 };

export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function round(value) {
  return Math.round(clamp(value));
}

function unique(list) {
  return [...new Set(list.filter(Boolean))];
}

function skillNameSet(skills = []) {
  return new Set(skills.map((skill) => (typeof skill === 'string' ? skill : skill.name)).filter(Boolean));
}

function includesSkill(text, name) {
  if (!text || !name) return false;
  return text.toLowerCase().includes(name.toLowerCase());
}

export function scoreBand(score) {
  if (score >= 80) return { key: 'strong', label: '高度匹配', tone: 'success' };
  if (score >= 65) return { key: 'good', label: '值得投递', tone: 'accent' };
  if (score >= 50) return { key: 'stretch', label: '需要补强', tone: 'warning' };
  return { key: 'weak', label: '暂不建议', tone: 'danger' };
}

export function cosineSimilarity(a = [], b = []) {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function semanticToScore(cosine) {
  if (!Number.isFinite(cosine)) return 0;
  return round(((cosine - 0.2) / 0.7) * 100);
}

function scoreSkills(profileSkills, jd) {
  const own = skillNameSet(profileSkills);
  const required = jd.requiredSkills || [];
  const preferred = jd.preferredSkills || [];
  const matchedRequired = required.filter((skill) => own.has(skill.name));
  const matchedPreferred = preferred.filter((skill) => own.has(skill.name));
  const total = required.length + preferred.length * 0.4;
  const matched = matchedRequired.length + matchedPreferred.length * 0.4;
  const score = total ? (matched / total) * 100 : 55;
  return {
    score: round(score),
    matchedRequired,
    matchedPreferred,
    missingRequired: required.filter((skill) => !own.has(skill.name)),
    missingPreferred: preferred.filter((skill) => !own.has(skill.name)),
  };
}

function scoreExperience(profile, jd) {
  const requiredYears = Number(jd.yearsRequired) || 0;
  const ownYears = Number(profile.yearsExperience) || 0;
  const experienceText = [profile.sections?.experience, profile.sections?.projects, profile.sections?.summary]
    .filter(Boolean)
    .join('\n');
  const jdSkills = [...(jd.requiredSkills || []), ...(jd.preferredSkills || [])];
  const relevant = jdSkills.filter((skill) => includesSkill(experienceText, skill.name));
  const relevance = jdSkills.length ? relevant.length / jdSkills.length : 0;

  if (requiredYears > 0) {
    const ratio = Math.min(1, ownYears / requiredYears);
    const base = 35 + ratio * 50;
    return {
      score: round(base + relevance * 15),
      requiredYears,
      ownYears,
      relevant,
      relevance,
    };
  }

  const base = profile.sections?.experience || profile.sections?.projects ? 58 : 42;
  return {
    score: round(base + Math.min(1, relevance * 1.4) * 32),
    requiredYears: 0,
    ownYears,
    relevant,
    relevance,
  };
}

function scoreEducation(profile, jd) {
  const required = Number(jd.educationLevel) || 0;
  const own = Number(profile.educationLevel) || 0;
  if (!required) return { score: 80, required, own };
  if (!own) return { score: 35, required, own };
  const gap = own - required;
  if (gap >= 0) return { score: 100, required, own };
  if (gap === -1) return { score: 72, required, own };
  if (gap === -2) return { score: 45, required, own };
  return { score: 25, required, own };
}

function scoreKeywords(profile, jd) {
  const keywords = jd.keywords || [];
  const text = profile.rawText || '';
  if (!keywords.length) return { score: 60, matched: [], missing: [] };
  const matched = keywords.filter((keyword) => includesSkill(text, keyword));
  const missing = keywords.filter((keyword) => !includesSkill(text, keyword));
  return { score: round((matched.length / keywords.length) * 100), matched, missing };
}

function scoreQuality(profile) {
  const completeness = Number(profile.completeness) || 0;
  const quantifiedBonus = Math.min(12, (Number(profile.quantifiedCount) || 0) * 2);
  return round(Math.min(100, completeness + quantifiedBonus));
}

function buildStrengths({ profile, jd, skills, experience, education, keywords, dimensions }) {
  const strengths = [];
  const matched = skills.matchedRequired.map((skill) => skill.name);
  if (matched.length) strengths.push(`命中岗位核心技能：${matched.slice(0, 5).join('、')}。`);
  if (skills.matchedPreferred.length) {
    strengths.push(`额外覆盖加分项：${skills.matchedPreferred.slice(0, 4).map((skill) => skill.name).join('、')}。`);
  }
  if (experience.requiredYears > 0 && experience.ownYears >= experience.requiredYears) {
    strengths.push(`经验年限达到要求（约 ${experience.ownYears} 年，岗位要求 ${experience.requiredYears} 年）。`);
  } else if (experience.relevant.length) {
    strengths.push(`项目/实习中已经出现 ${experience.relevant.length} 个岗位相关技能，有可讲的故事。`);
  }
  if (education.score >= 100) strengths.push(`学历满足岗位要求（${profile.educationLabel || '已填写'}）。`);
  if (profile.quantifiedCount >= 2) strengths.push(`简历有 ${profile.quantifiedCount} 处量化结果，比纯职责描述更有说服力。`);
  if (dimensions.quality >= 70) strengths.push('简历结构完整，教育、经历、项目、技能板块齐全。');
  if (!strengths.length) strengths.push('已经有一份可用的简历底稿，可以在此基础上做针对性改写。');
  return strengths.slice(0, 5);
}

function buildGaps({ profile, jd, skills, experience, education, keywords, dimensions }) {
  const gaps = [];
  if (skills.missingRequired.length) {
    gaps.push(`岗位明确要求但简历未体现：${skills.missingRequired.slice(0, 5).map((skill) => skill.name).join('、')}。`);
  }
  if (experience.requiredYears > 0 && experience.ownYears < experience.requiredYears) {
    gaps.push(`经验年限不足：岗位要求 ${experience.requiredYears} 年，目前约 ${experience.ownYears} 年。`);
  }
  if (education.required && education.own && education.own < education.required) {
    gaps.push(`学历与岗位要求有差距（要求 ${jd.educationLabel || '更高学历'}）。`);
  }
  if (profile.quantifiedCount < 2) gaps.push('量化结果偏少，建议至少补充 2 处数字（用户量、性能提升、转化率等）。');
  if (keywords.missing.length >= Math.max(3, keywords.matched.length)) {
    gaps.push(`JD 关键词覆盖不足（${keywords.score}%），ATS 或 HR 快速筛选时可能吃亏。`);
  }
  if (!profile.sections?.projects) gaps.push('简历里没有单独的项目板块，招聘方很难快速看到你的动手能力。');
  if (!profile.sections?.summary) gaps.push('缺少一段面向目标岗位的个人简介。');
  if (!gaps.length) gaps.push('没有明显的硬性差距，接下来比的是表达和投递时机。');
  return gaps.slice(0, 5);
}

function buildSuggestions({ profile, jd, skills, experience, education, keywords, dimensions }) {
  const suggestions = [];
  const missing = skills.missingRequired.slice(0, 3);
  for (const skill of missing) {
    suggestions.push({
      type: 'keyword',
      title: `补上「${skill.name}」的证据`,
      detail: `在技能栏和至少一个项目/实习 bullet 中明确写出 ${skill.name}。如果没有直接经验，用一个课程项目、开源贡献或自学作品补上，并写清你的角色、做法和结果。`,
      priority: 1,
    });
  }
  if (profile.quantifiedCount < 2) {
    suggestions.push({
      type: 'impact',
      title: '把职责改写成结果',
      detail: '挑 2-3 条最相关的经历，用「做了什么 → 怎么做 → 结果如何」改写，并加入数字。例如把“负责页面开发”改成“用 React 重构 3 个核心页面，首屏加载从 3.2s 降到 1.8s”。',
      priority: 1,
    });
  }
  if (!profile.sections?.summary) {
    suggestions.push({
      type: 'summary',
      title: '加一段 3 行的岗位定制简介',
      detail: `开头直接说明你是谁、和目标岗位最相关的 2 个能力，以及一个可验证的结果。针对「${jd.title}」写出为什么是你要投，而不是泛泛的自我评价。`,
      priority: 2,
    });
  }
  if (experience.relevance < 0.35 && (jd.requiredSkills || []).length) {
    suggestions.push({
      type: 'project',
      title: '把最相关的项目移到最前面',
      detail: `招聘方最先看的是与「${jd.title}」相关的经历。把用到 ${(skills.matchedRequired[0] || jd.requiredSkills[0])?.name || '核心技能'} 的项目放到经历区第一条，并在标题里写明项目类型和你的角色。`,
      priority: 2,
    });
  }
  if (keywords.score < 65) {
    suggestions.push({
      type: 'keyword',
      title: '按 JD 关键词做一轮 ATS 对齐',
      detail: `在简历中自然加入这些词：${keywords.missing.slice(0, 8).join('、') || '岗位核心关键词'}。不要堆砌，放进技能栏和项目 bullet 的上下文里。`,
      priority: 2,
    });
  }
  if (education.required && education.own < education.required) {
    suggestions.push({
      type: 'education',
      title: '用其他证据补学历差距',
      detail: '学历不是唯一信号。补充与岗位直接相关的课程、证书、作品集或实习成果，并在简历前 1/3 出现，降低 HR 的顾虑。',
      priority: 3,
    });
  }
  if (dimensions.skills >= 80 && dimensions.quality >= 70) {
    suggestions.push({
      type: 'polish',
      title: '保持结构，只做针对性微调',
      detail: '这份简历已经比较匹配，不建议大改结构。只把岗位最看重的 3 个关键词前置，并把最能证明能力的数字放进第一条 bullet。',
      priority: 3,
    });
  }
  if (!suggestions.length) {
    suggestions.push({
      type: 'polish',
      title: '用一句话讲清匹配逻辑',
      detail: '在简介或求职信里用一句话说明：你的哪段经历、哪个技能，能直接解决这个岗位的核心问题。',
      priority: 3,
    });
  }
  return suggestions.slice(0, 6);
}

function buildSummary({ profile, jd, score, skills, experience, education, keywords }) {
  const band = scoreBand(score);
  const matched = skills.matchedRequired.map((skill) => skill.name);
  const missing = skills.missingRequired.map((skill) => skill.name);
  const parts = [];
  if (band.key === 'strong') {
    parts.push(`你的背景和「${jd.title}」的匹配度很高，核心技能已经覆盖了 ${matched.length}/${(jd.requiredSkills || []).length} 项。`);
  } else if (band.key === 'good') {
    parts.push(`整体匹配不错，已经具备投递「${jd.title}」的基础，补上几个关键词会更有竞争力。`);
  } else if (band.key === 'stretch') {
    parts.push(`有值得争取的地方，但目前和「${jd.title}」还有明显差距，建议先针对性改写再投。`);
  } else {
    parts.push(`目前和「${jd.title}」的差距较明显。与其海投，不如先补核心技能，或换一个更贴近你背景的岗位。`);
  }
  if (missing.length) parts.push(`最需要补的是：${missing.slice(0, 3).join('、')}。`);
  if (experience.requiredYears > 0 && experience.ownYears < experience.requiredYears) {
    parts.push(`岗位要求约 ${experience.requiredYears} 年经验，你目前约 ${experience.ownYears} 年，需要用项目成果来补。`);
  }
  if (keywords.score < 60) parts.push('另外，JD 关键词覆盖偏低，建议做一轮 ATS 对齐。');
  return parts.join('');
}

export function analyzeMatch(profile, jd, options = {}) {
  const safeProfile = profile || {};
  const safeJd = jd || {};
  const skills = scoreSkills(safeProfile.skills || [], safeJd);
  const experience = scoreExperience(safeProfile, safeJd);
  const education = scoreEducation(safeProfile, safeJd);
  const keywords = scoreKeywords(safeProfile, safeJd);
  const quality = scoreQuality(safeProfile);
  const dimensions = {
    skills: skills.score,
    experience: experience.score,
    education: education.score,
    keywords: keywords.score,
    quality,
  };
  const score = round(Object.entries(WEIGHTS).reduce((sum, [key, weight]) => sum + dimensions[key] * weight, 0));
  const context = { profile: safeProfile, jd: safeJd, skills, experience, education, keywords, dimensions };
  return {
    score,
    band: scoreBand(score),
    summary: buildSummary({ ...context, score }),
    dimensions,
    weights: WEIGHTS,
    matchedSkills: unique([...skills.matchedRequired, ...skills.matchedPreferred].map((skill) => skill.name)),
    missingSkills: skills.missingRequired.map((skill) => skill.name),
    preferredMissing: skills.missingPreferred.map((skill) => skill.name),
    strengths: buildStrengths(context),
    gaps: buildGaps(context),
    suggestions: buildSuggestions(context),
    mode: 'local',
    semanticScore: options.semanticScore ?? null,
    meta: {
      requiredSkillCount: (safeJd.requiredSkills || []).length,
      keywordCoverage: keywords.score,
      requiredYears: experience.requiredYears,
      ownYears: experience.ownYears,
      quantifiedCount: safeProfile.quantifiedCount || 0,
    },
  };
}

function validAiScore(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 100 ? Math.round(number) : null;
}

function mergeSuggestions(localSuggestions = [], aiSuggestions = []) {
  const seen = new Set();
  const merged = [];
  for (const item of [...(Array.isArray(aiSuggestions) ? aiSuggestions : []), ...localSuggestions]) {
    if (!item) continue;
    const title = String(item.title || '').trim();
    const detail = String(item.detail || '').trim();
    if (!title || !detail) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      type: ['keyword', 'impact', 'summary', 'project', 'format', 'education', 'polish', 'general'].includes(item.type) ? item.type : 'general',
      title: title.slice(0, 80),
      detail: detail.slice(0, 400),
      priority: Number(item.priority) || 2,
    });
  }
  return merged.slice(0, 6);
}

export function blendAi(local, ai, semanticScore = null) {
  if (!ai || typeof ai !== 'object') return { ...local, semanticScore: semanticScore ?? local.semanticScore ?? null };
  const aiScore = validAiScore(ai.score);
  const finalScore = aiScore === null ? local.score : round(local.score * 0.65 + aiScore * 0.35);
  const aiStrengths = Array.isArray(ai.strengths) ? ai.strengths.map(String).filter(Boolean).slice(0, 4) : [];
  const aiGaps = Array.isArray(ai.gaps) ? ai.gaps.map(String).filter(Boolean).slice(0, 4) : [];
  return {
    ...local,
    score: finalScore,
    band: scoreBand(finalScore),
    aiScore,
    mode: 'ai',
    semanticScore: semanticScore ?? local.semanticScore ?? null,
    summary: String(ai.summary || '').trim().slice(0, 500) || local.summary,
    strengths: unique([...aiStrengths, ...local.strengths]).slice(0, 5),
    gaps: unique([...aiGaps, ...local.gaps]).slice(0, 5),
    suggestions: mergeSuggestions(local.suggestions, ai.suggestions),
  };
}

export function jobMatch(profile, job, options = {}) {
  const jd = parseJobDescription(jobToDescription(job), job);
  return { jd, analysis: analyzeMatch(profile, jd, options) };
}

export function rankJobs(profile, jobs, limit = 6) {
  if (!profile || !Array.isArray(jobs)) return [];
  return jobs
    .map((job) => {
      const { jd, analysis } = jobMatch(profile, job);
      return { job, jd, analysis, score: analysis.score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

