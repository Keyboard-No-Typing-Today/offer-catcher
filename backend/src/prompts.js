import { config } from './config.js';

export function truncate(value, max) {
  const text = String(value || '');
  return text.length > max ? text.slice(0, max) + '\n...[已截断]' : text;
}

const ANALYSIS_SCHEMA = [
  '{',
  '  "score": 0-100 的整数,',
  '  "summary": "2-3 句话的整体判断，点出最关键的一条优势和一个差距",',
  '  "strengths": ["3-5 条，必须引用简历里的事实"],',
  '  "gaps": ["2-4 条，具体到缺什么证据或差多少"],',
  '  "dimensions": { "skills": 0-100, "experience": 0-100, "education": 0-100, "keywords": 0-100, "quality": 0-100 },',
  '  "suggestions": [',
  '    { "type": "keyword|impact|summary|project|format|education|polish", "title": "短标题", "detail": "具体到可以今天动手改什么", "priority": 1-3 }',
  '  ]',
  '}',
].join('\n');

export function buildAnalysisMessages({ resumeText, jdText, local, examples = [], job }) {
  const localSummary = local ? JSON.stringify({
    score: local.score,
    dimensions: local.dimensions,
    matchedSkills: local.matchedSkills,
    missingSkills: local.missingSkills,
    strengths: local.strengths,
    gaps: local.gaps,
  }, null, 2) : '无';

  const ragText = examples.length
    ? examples.map((item, index) => '[' + (index + 1) + '] ' + item.category + '\n' + truncate(item.text, 700)).join('\n\n')
    : '暂无';

  const system = [
    '你是 Offer 捕手，一名严格但友善的中文求职教练。',
    '你的任务是分析「候选人简历」和「目标岗位 JD」的匹配度，并给出可执行的简历改写建议。',
    '',
    '硬性规则：',
    '1. 只使用简历中真实出现的信息，不要编造经历、学历、公司或数字。',
    '2. 建议必须具体到「改哪一句、怎么改」，不要写“提升竞争力”这类空话。',
    '3. 中文输出，语气直接、专业，不奉承。',
    '4. 只输出一个合法 JSON 对象，不要 markdown，不要解释，不要前后缀。',
    '5. score 要参考本地规则初判，但可以根据整体叙事的说服力修正 ±8 分。',
    '',
    'JSON schema：',
    ANALYSIS_SCHEMA,
  ].join('\n');

  const user = [
    '【目标岗位】',
    (job?.title || '未命名岗位') + (job?.company ? ' @ ' + job.company : ''),
    '',
    '【岗位 JD】',
    truncate(jdText, config.limits.jdChars),
    '',
    '【候选人简历】',
    truncate(resumeText, config.limits.resumeChars),
    '',
    '【本地规则初判（供参考，不是答案）】',
    localSummary,
    '',
    '【优秀简历片段（只做写法参考，不要照抄内容）】',
    ragText,
    '',
    '请输出 JSON。',
  ].join('\n');

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

export function buildChatMessages({ messages, profile, context }) {
  const section = (key, max) => String(profile?.sections?.[key] || profile?.[key] || '').replace(/\s+/g, ' ').trim().slice(0, max);
  const profileSummary = profile
    ? [
        '姓名：' + (profile.name || '未填写'),
        '学历：' + (profile.educationLabel || '未填写'),
        '经验：约 ' + (profile.yearsExperience || 0) + ' 年',
        '技能：' + (profile.skills || []).slice(0, 18).join('、'),
        '个人简介：' + (section('summary', 700) || '未填写'),
        '教育经历：' + (section('education', 900) || '未填写'),
        '实习/工作经历：' + (section('experience', 2200) || '未填写'),
        '项目经历：' + (section('projects', 2200) || '未填写'),
        '量化结果：' + (profile.quantifiedCount || 0) + ' 处',
      ].join('\n')
    : '尚未导入简历';

  const analysisSummary = context?.latestAnalysis
    ? [
        '最近分析：' + context.latestAnalysis.jobTitle + ' @ ' + context.latestAnalysis.company,
        '匹配分：' + context.latestAnalysis.score,
        '缺失技能：' + (context.latestAnalysis.missingSkills || []).join('、'),
        '主要差距：' + (context.latestAnalysis.gaps || []).slice(0, 3).join('；'),
      ].join('\n')
    : '暂无分析记录';

  const directions = Array.isArray(context?.directions) ? context.directions.slice(0, 10) : [];
  const directionSummary = directions.length
    ? directions.map((item, index) => (index + 1) + '. ' + item.label + '（证据分 ' + item.score + '；待补：' + ((item.missingSkills || []).slice(0, 3).join('、') || '暂无明显缺口') + '）').join('\n')
    : '暂无方向画像上下文';

  const system = [
    '你是 Offer 捕手，一名中文求职助手。',
    '你帮助大学生判断岗位是否值得投、解释匹配结果、给出简历改写方向、管理投递节奏。',
    '',
    '风格：简洁、具体、像一位有经验的学长/学姐。不要空泛鼓励，不要编造候选人的经历。',
    '如果信息不足，直接问一个最关键的问题。',
    '回答控制在 4-6 句以内；需要清单时最多 3 条。',
    '用纯文本回答，不要使用 Markdown 的 **、#、\u0060 等标记。',
    '不要声称自己是招聘方，不要承诺面试或 offer。',
    '',
    '【候选人档案】',
    profileSummary,
    '',
    '【最近一次匹配】',
    analysisSummary,
    '',
    '【方向画像（来自脱敏简历聚合）】',
    directionSummary,
    '',
    '【要求】',
    '如果用户明确指定了某个方向（例如算法工程师），必须围绕该方向回答，不能擅自替换成“最接近的其他方向”。',
    '引用简历内容时必须来自上面的档案，不要编造项目或数字。',
  ].join('\n');

  return [
    { role: 'system', content: system },
    ...messages,
  ];
}