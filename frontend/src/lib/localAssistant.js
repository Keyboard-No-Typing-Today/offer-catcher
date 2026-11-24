import { JOBS } from '../data/jobs.js';
import { rankJobs } from './matchEngine.js';

const FIELD_WORDS = {
  前端: 'frontend', 后端: 'backend', 产品: 'product', 设计: 'design', 数据: 'data',
  测试: 'testing', 运维: 'devops', 算法: 'algorithm', 市场: 'marketing', 人力: 'hr',
};

export const STARTER_PROMPTS = [
  '帮我找几个前端实习',
  '我的简历适合什么岗位？',
  '我现在投递进展怎么样？',
  '怎么判断一个 JD 值不值得投？',
];

function detectField(text) {
  for (const word of Object.keys(FIELD_WORDS)) {
    if (text.includes(word)) return FIELD_WORDS[word];
  }
  return null;
}

function cleanQuery(text) {
  return text
    .replace(/帮我|请|找|推荐|搜索|一下|几个|有没有|看看|岗位|工作|实习|职位/g, ' ')
    .replace(/[，。！？、,.!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function trackerSummary(tracker) {
  const list = Array.isArray(tracker) ? tracker : [];
  const counts = { saved: 0, applied: 0, interview: 0, offer: 0, rejected: 0 };
  for (const item of list) {
    if (counts[item.status] !== undefined) counts[item.status] += 1;
  }
  return '你现在有 ' + list.length + ' 条投递记录：已投 ' + counts.applied + ' 条，面试中 ' + counts.interview + ' 条，Offer ' + counts.offer + ' 条，收藏 ' + counts.saved + ' 条。去「进度」页可以更新状态和备注。';
}

function jobLine(job, score) {
  const parts = [job.title, job.company, job.location];
  if (score) parts.push('匹配 ' + score + '%');
  return parts.join(' · ');
}

function recommendJobs(text, context) {
  const field = detectField(text);
  const query = cleanQuery(text);
  let candidates = JOBS;
  if (field) candidates = candidates.filter((job) => job.field === field);
  if (query.length >= 2) {
    const words = query.split(' ').filter((word) => word.length >= 2);
    const matched = candidates.filter((job) => {
      const haystack = [job.title, job.company, job.description].concat(job.tags || []).join(' ');
      return words.some((word) => haystack.includes(word));
    });
    if (matched.length) candidates = matched;
  }
  if (!candidates.length) return null;
  if (context && context.profile) {
    const ranked = rankJobs(context.profile, candidates, 3);
    const lines = ranked.map((item, index) => (index + 1) + '. ' + jobLine(item.job, item.score));
    return {
      reply: ['按你的简历和岗位要求做了个快速排序，这 3 个可以先看：', ''].concat(lines).concat(['', '点开岗位卡片可以看详情，或直接做一次完整匹配。']).join('\n'),
      jobIds: ranked.map((item) => item.job.id),
    };
  }
  const sample = candidates.slice(0, 3);
  const lines = sample.map((job, index) => (index + 1) + '. ' + jobLine(job));
  return {
    reply: ['先给你 3 个方向匹配的岗位：', ''].concat(lines).concat(['', '导入简历后，我可以按匹配度重新排序。']).join('\n'),
    jobIds: sample.map((job) => job.id),
  };
}

export function localAssistantReply(message, context = {}) {
  const text = String(message || '').trim();
  if (!text) return { reply: '想聊点什么？我可以帮你找岗位、看投递进度，或者解释匹配结果。' };

  if (/^(hi|hello|你好|嗨|在吗)/i.test(text)) {
    return { reply: '你好，我是 Offer 捕手。现在运行在本地模式：不联网也能帮你看简历、找岗位、理投递进度。需要更深入的改写建议时，再到设置里连接 AI 代理。' };
  }

  if (/帮助|能做什么|怎么用|help/i.test(text)) {
    return {
      reply: [
        '我现在能做这些事：',
        '',
        '· 「找前端实习」——按方向筛岗位，有简历时会按匹配度排序',
        '· 「我的简历怎么样」——看简历完整度和短板',
        '· 「投递进展」——汇总你的进度',
        '· 「这个 JD 值得投吗」——告诉你怎么看匹配结果',
        '',
        '如果要逐条改写建议，打开「分析」页做一次完整匹配。',
      ].join('\n'),
    };
  }

  if (/投递|进度|进展|记录|tracker/i.test(text)) {
    return { reply: trackerSummary(context.tracker) };
  }

  if (/简历|resume|cv/i.test(text) && /怎么样|如何|建议|问题|短板|改/i.test(text)) {
    if (!context.profile) return { reply: '你还没有导入简历。去「我的 → 简历」上传 PDF/DOCX，或者先用示例简历看看效果。' };
    const p = context.profile;
    const issues = [];
    if (p.quantifiedCount < 2) issues.push('量化结果偏少，至少补 2 处数字');
    if (!p.sections.projects) issues.push('缺少项目板块');
    if (!p.sections.summary) issues.push('缺少岗位定制简介');
    if (p.skills.length < 5) issues.push('技能关键词偏少');
    const issueText = issues.length ? issues.map((item) => '· ' + item).join('\n') : '结构已经不错，接下来针对具体 JD 做关键词微调。';
    return {
      reply: [
        '你的简历目前完整度 ' + p.completeness + '/100，识别到 ' + p.skills.length + ' 项技能，' + p.quantifiedCount + ' 处量化结果。',
        '',
        issues.length ? '最值得先改的：' : '整体判断：',
        issueText,
        '',
        '想看具体岗位的差距，去「分析」页粘贴 JD。',
      ].join('\n'),
    };
  }

  if (/匹配|值得投|分析|jd|岗位要求/i.test(text) && !/找|推荐|搜索/.test(text)) {
    return { reply: '判断一个 JD 值不值得投，看三件事：核心技能是否命中、经验年限是否够、简历里有没有可讲的证据。打开「分析」页粘贴 JD，我会给出分项分数和逐条建议。' };
  }

  if (/找|推荐|搜索|岗位|实习|工作|职位/i.test(text)) {
    const result = recommendJobs(text, context);
    if (result) return result;
    return { reply: '这个方向暂时没有找到合适的岗位。可以换一个关键词，或去「岗位」页按领域筛选。' };
  }

  return {
    reply: [
      '我记下了：「' + text.slice(0, 60) + '」。',
      '',
      '本地模式下我最擅长找岗位、读简历、理投递进度。如果你想要针对某个 JD 的逐条改写建议，打开「分析」页；如果已经连上 AI 代理，我会给出更具体的建议。',
    ].join('\n'),
  };
}

