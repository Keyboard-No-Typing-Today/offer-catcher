export const STARTER_PROMPTS = [
  '我的简历最适合哪个方向？',
  '帮我改一下简历，应该先补什么？',
  '这个方向面试会问什么？',
  '帮我写一段自我介绍',
];


const ROLE_WORDS = {
  frontend: [/前端/i, /front[\s-]?end/i, /react/i, /vue/i],
  backend: [/后端/i, /back[\s-]?end/i, /java/i, /spring/i, /服务端/i],
  algorithm: [/算法/i, /机器学习/i, /深度学习/i, /nlp/i, /大模型/i, /machine learning/i],
  product: [/产品经理/i, /产品/i],
  design: [/ui设计/i, /ux/i, /设计师/i, /视觉设计/i],
  data: [/数据分析/i, /数据/i],
  testing: [/测试工程师/i, /测试/i, /qa/i],
  devops: [/运维/i, /devops/i, /sre/i],
  marketing: [/市场营销/i, /营销/i, /市场/i],
  hr: [/人力资源/i, /hrbp/i, /\bhr\b/i, /人力/i],
};

function findExplicitRole(text, roleMatches = []) {
  for (const [field, patterns] of Object.entries(ROLE_WORDS)) {
    if (!patterns.some((pattern) => pattern.test(text))) continue;
    const match = roleMatches.find((item) => item.role?.field === field);
    if (match) return match;
  }
  return null;
}

function explicitRoleAnswer(item, roleMatches) {
  const local = item.local || {};
  const label = item.role?.label || '目标方向';
  const missing = (local.missingSkills || []).slice(0, 3);
  const suggestions = (local.suggestions || []).slice(0, 3);
  const points = [];
  for (const skill of missing) {
    points.push('补「' + skill + '」的可验证证据：在技能栏和至少一个项目 bullet 里写清你用它做了什么、结果是什么。');
  }
  for (const suggestion of suggestions) {
    if (points.length >= 3) break;
    points.push(suggestion.title + '：' + suggestion.detail);
  }
  if (!points.length) points.push('把和目标方向最相关的项目前置，并补充 2–3 个量化结果，证明你的实际产出。');
  while (points.length < 3) points.push('把简历里的技能从“清单”改成“项目里的证据”，招聘方需要看到你真的用过。');
  return [
    '你指定的是「' + label + '」方向。按你当前简历，本地匹配 ' + (item.score ?? local.score ?? 0) + '/100。',
    '',
    '这个方向最该补的 3 个点：',
    ...points.slice(0, 3).map((point, index) => (index + 1) + '. ' + point),
    '',
    missing.length ? '当前缺口：' + missing.join('、') + '。' : '当前没有明显的硬技能缺口，优先把已有经历写得更可验证。',
    '下一步：把这份简历按「' + label + '」重写一版，再回来对比分数。',
  ].join('\n');
}

export function localMentorReply(message, { profile, topRoles = [], roleMatches = [] } = {}) {
  const text = String(message || '').trim();
  if (!profile) {
    return '你还没有导入简历。先在「匹配」页导入 PDF/DOCX 或粘贴文本，我才能根据你的真实经历回答。';
  }
  const best = topRoles[0];
  const missing = (best?.local?.missingSkills || []).slice(0, 4);
  if (!text || /你好|hi|hello|在吗/i.test(text)) {
    return '你好，我是你的求职助手。基于你导入的简历，我可以帮你看方向、改简历、准备面试问题。';
  }
  const explicit = findExplicitRole(text, roleMatches);
  if (explicit) return explicitRoleAnswer(explicit, roleMatches);

  if (/适合|方向|岗位|投什么|推荐/i.test(text)) {
    const lines = topRoles.slice(0, 3).map((item, index) => {
      const lacking = (item.local?.missingSkills || []).slice(0, 2).join('、') || '暂无明显缺口';
      return (index + 1) + '. ' + item.role.label + '（本地匹配 ' + item.score + '）—— 优先补：' + lacking;
    });
    return ['根据你的简历，最接近的三个方向是：', '', ...lines, '', '方向只是起点，最终要结合你真正想投的 JD 再判断。'].join('\n');
  }
  if (/改|简历|提升|优化|补/i.test(text)) {
    const tips = best?.local?.suggestions?.slice(0, 3) || [];
    if (!tips.length) return '你的简历结构已经比较完整，建议针对目标方向补充量化结果和关键词证据。';
    return ['先针对「' + best.role.label + '」方向改这三处：', '', ...tips.map((tip, index) => (index + 1) + '. ' + tip.title + '：' + tip.detail)].join('\n');
  }
  if (/面试|问什么|准备/i.test(text)) {
    return [
      '可以先准备三类问题：',
      '',
      '1. 项目追问：你最熟悉的项目里，哪个技术选择最难？为什么？结果怎么量化？',
      '2. 方向匹配：为什么选这个方向？你的哪段经历能证明？',
      '3. 差距补强：如果缺少 ' + (missing.join('、') || '某个技能') + '，你打算怎么补？有没有作品或课程能证明？',
    ].join('\n');
  }
  if (/自我介绍|介绍自己/i.test(text)) {
    const skills = (profile.skills || []).slice(0, 3).map((skill) => skill.name).join('、');
    return '可以这样开头：我是' + (profile.name || '一名求职者') + '，' + (profile.educationLabel || '') + '。我主要做 ' + (best?.role?.label || '目标方向') + '，熟悉 ' + (skills || '相关技能') + '，做过 ' + (profile.sections?.projects ? '完整项目' : '相关实践') + '。接下来希望把 ' + (missing.join('、') || '已有能力') + ' 补到能独立交付的程度。';
  }
  return '我可以帮你看方向、改简历、准备面试，也可以直接问「我适合什么方向」或者「帮我改简历」。';
}