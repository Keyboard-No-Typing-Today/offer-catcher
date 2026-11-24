export const STARTER_PROMPTS = [
  '我的简历最适合哪个方向？',
  '帮我改一下简历，应该先补什么？',
  '这个方向面试会问什么？',
  '帮我写一段自我介绍',
];

export function localMentorReply(message, { profile, topRoles = [] } = {}) {
  const text = String(message || '').trim();
  if (!profile) {
    return '你还没有导入简历。先在「匹配」页导入 PDF/DOCX 或粘贴文本，我才能根据你的真实经历回答。';
  }
  const best = topRoles[0];
  const missing = (best?.local?.missingSkills || []).slice(0, 4);
  if (!text || /你好|hi|hello|在吗/i.test(text)) {
    return '你好，我是你的求职助手。基于你导入的简历，我可以帮你看方向、改简历、准备面试问题。';
  }
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
