import { findSkills, normalize } from './skills.js';

export const FIELD_KEYWORDS = {
  frontend: ['前端', 'react', 'vue', 'javascript', 'typescript', 'html', 'css', '小程序', 'h5', 'web'],
  backend: ['后端', 'java', 'go', 'python', 'node', 'spring', 'mysql', 'redis', '微服务', '服务端', 'api'],
  product: ['产品经理', '产品', '需求', '用户研究', 'prd', '增长', '商业化'],
  design: ['设计', 'ui', 'ux', 'figma', '视觉', '交互', '作品集'],
  data: ['数据', 'analyst', 'sql', 'tableau', 'spark', '数仓', 'bi', '分析'],
  testing: ['测试', 'qa', 'selenium', '自动化测试', '质量'],
  devops: ['运维', 'devops', 'sre', 'docker', 'kubernetes', 'k8s', 'ci/cd', '云'],
  algorithm: ['算法', '机器学习', '深度学习', 'nlp', '推荐', 'pytorch', '大模型', 'llm'],
  marketing: ['市场', '营销', '品牌', '运营', '投放', 'seo', '内容'],
  hr: ['hr', '人力', '招聘', '薪酬', '员工关系', 'hrbp'],
};

const HEADING_REQUIRED = ['任职要求', '岗位要求', '职位要求', '任职资格', '要求', 'requirements', 'qualifications', 'what you need'];
const HEADING_DUTIES = ['岗位职责', '工作内容', '职位描述', '职责', '你将', '工作职责', 'responsibilities', 'what you will do', 'about the role'];
const PREFERRED_RE = /优先|加分|plus|nice to have|preferred|更佳|尤佳/i;

function lineList(text) {
  return normalize(text).split('\n').map((line) => line.trim()).filter(Boolean);
}

function findHeadingIndex(lines, labels) {
  return lines.findIndex((line) => labels.some((label) => line.toLowerCase().replace(/[:：\s]/g, '').startsWith(label.replace(/\s/g, ''))));
}

function extractLabeledValue(lines, labels) {
  for (const line of lines.slice(0, 12)) {
    for (const label of labels) {
      const re = new RegExp('^' + label + '\\s*[:：]\\s*(.+)$', 'i');
      const match = line.match(re);
      if (match) return match[1].trim();
    }
  }
  return '';
}

function guessTitle(lines, job) {
  if (job?.title) return job.title;
  const labeled = extractLabeledValue(lines, ['岗位名称', '职位名称', '岗位', '职位', 'title', 'position']);
  if (labeled) return labeled;
  const first = lines.find((line) => line.length >= 2 && line.length <= 36 && !/^[-*•]/.test(line));
  if (first && !/公司|招聘|职责|要求/.test(first)) return first.replace(/[|｜].*$/, '').trim();
  return '目标岗位';
}

function guessCompany(lines, job) {
  if (job?.company) return job.company;
  const labeled = extractLabeledValue(lines, ['公司名称', '公司', '雇主', 'company', 'employer']);
  if (labeled) return labeled;
  const known = ['腾讯', '字节跳动', '阿里巴巴', '美团', '百度', '网易', '滴滴', '拼多多', '京东', '快手', '小红书', '华为', '小米', '招商银行', '中国平安'];
  const found = known.find((name) => lines.slice(0, 6).some((line) => line.includes(name)));
  return found || '目标公司';
}

function guessLocation(lines, job) {
  if (job?.location) return job.location;
  const labeled = extractLabeledValue(lines, ['工作地点', '地点', '城市', 'location']);
  if (labeled) return labeled;
  const cities = ['北京', '上海', '深圳', '广州', '杭州', '成都', '南京', '武汉', '西安', '苏州', '香港', '远程'];
  return cities.find((city) => lines.slice(0, 10).some((line) => line.includes(city))) || '不限';
}

function guessSalary(lines, job) {
  if (job?.salary) return job.salary;
  const labeled = extractLabeledValue(lines, ['薪资', '薪资范围', '待遇', 'salary']);
  if (labeled) return labeled;
  const match = normalize(lines.join('\n')).match(/(\d+(?:\.\d+)?\s*[kK万]?\s*[-~至]\s*\d+(?:\.\d+)?\s*[kK万]?(?:元\/天|元\/月|\/天|\/月)?)/);
  return match ? match[1] : '面议';
}

function guessYears(lines) {
  const text = normalize(lines.join('\n'));
  if (/应届|在校|实习|无经验|fresh graduate/i.test(text) && !/\d+\s*年/.test(text)) return 0;
  const range = text.match(/(\d+)\s*[-~至]\s*(\d+)\s*年/);
  if (range) return Number(range[1]);
  const single = text.match(/(\d+(?:\.\d+)?)\s*年(?:以上)?(?:相关)?(?:工作|实习|项目|行业)?经验/);
  return single ? Number(single[1]) : 0;
}

function guessEducation(lines) {
  const text = normalize(lines.join('\n')).toLowerCase();
  if (/学历不限|不限学历|no degree requirement/.test(text)) return { level: 0, label: '不限' };
  if (/博士|ph\.?d/.test(text)) return { level: 5, label: '博士' };
  if (/硕士|研究生|master/.test(text)) return { level: 4, label: '硕士' };
  if (/本科|学士|bachelor|undergraduate/.test(text)) return { level: 3, label: '本科' };
  if (/大专|专科|associate/.test(text)) return { level: 2, label: '大专' };
  return { level: 0, label: '不限' };
}

function inferField(title, skills) {
  const haystack = (title + ' ' + skills.map((skill) => skill.name).join(' ')).toLowerCase();
  let best = 'general';
  let bestScore = 0;
  for (const [field, words] of Object.entries(FIELD_KEYWORDS)) {
    const score = words.reduce((sum, word) => sum + (haystack.includes(word.toLowerCase()) ? 1 : 0), 0);
    if (score > bestScore) { best = field; bestScore = score; }
  }
  return best;
}

function collectSkills(lines) {
  const required = new Map();
  const preferred = new Map();
  for (const line of lines) {
    const segments = line.split(/[，,；;。]\s*/);
    for (const segment of segments) {
      const items = findSkills(segment);
      if (!items.length) continue;
      const target = PREFERRED_RE.test(segment) ? preferred : required;
      for (const item of items) {
        const current = target.get(item.name);
        if (current) current.count += item.count;
        else target.set(item.name, { name: item.name, category: item.category, count: item.count });
      }
    }
  }
  // Anything only mentioned as a nice-to-have should not be required.
  for (const name of preferred.keys()) required.delete(name);
  return { required: [...required.values()], preferred: [...preferred.values()] };
}

function collectKeywords(lines, title, skills) {
  const general = ['经验', '项目', '团队', '沟通', '业务', '产品', '用户', '数据', '增长', '设计', '开发', '测试', '运营', '管理', '分析', '优化', '架构', '协作', '学习', '英文', '文档', '需求'];
  const set = new Set(skills.map((skill) => skill.name));
  const text = lines.join(' ');
  for (const word of general) {
    if (text.includes(word)) set.add(word);
  }
  const titleTokens = title.split(/[\s/|｜·,，]+/).filter((token) => token.length >= 2 && token.length <= 8);
  for (const token of titleTokens) set.add(token);
  return [...set].slice(0, 18);
}

function extractSectionLines(lines, startLabels, stopLabels) {
  const start = findHeadingIndex(lines, startLabels);
  if (start < 0) return [];
  const stop = findHeadingIndex(lines.slice(start + 1), stopLabels);
  return lines.slice(start + 1, stop >= 0 ? start + 1 + stop : lines.length);
}

export function parseJobDescription(rawText, job = null) {
  const text = normalize(rawText || '');
  const lines = lineList(text);
  const title = guessTitle(lines, job);
  const company = guessCompany(lines, job);
  const location = guessLocation(lines, job);
  const salary = guessSalary(lines, job);
  const skills = collectSkills(lines);
  const duties = extractSectionLines(lines, HEADING_DUTIES, HEADING_REQUIRED);
  const requirementLines = extractSectionLines(lines, HEADING_REQUIRED, HEADING_DUTIES);
  const bullets = lines
    .map((line) => line.replace(/^\s*(?:[-*•·▪◦●○]|\d{1,2}[.、)）])\s*/, '').trim())
    .filter((line) => line.length >= 6 && line.length <= 220)
    .slice(0, 30);
  const education = guessEducation(lines);
  return {
    title,
    company,
    location,
    salary,
    field: job?.field || inferField(title, [...skills.required, ...skills.preferred]),
    type: job?.type || (/实习|intern/i.test(text) ? 'internship' : 'full-time'),
    rawText: text,
    summary: lines.slice(0, 3).join(' ').slice(0, 160),
    responsibilities: duties.length ? duties.join('\n') : lines.slice(0, 6).join('\n'),
    requirementsText: requirementLines.length ? requirementLines.join('\n') : lines.join('\n'),
    requiredSkills: skills.required,
    preferredSkills: skills.preferred,
    keywords: collectKeywords(lines, title, [...skills.required, ...skills.preferred]),
    yearsRequired: guessYears(lines),
    educationLevel: education.level,
    educationLabel: education.label,
    bullets,
    jobId: job?.id || null,
  };
}

export function jobToDescription(job) {
  return [
    `岗位：${job.title}`,
    `公司：${job.company}`,
    `地点：${job.location}`,
    `薪资：${job.salary}`,
    '',
    '岗位描述',
    job.description,
    '',
    '任职要求',
    job.requirements,
  ].join('\n');
}

