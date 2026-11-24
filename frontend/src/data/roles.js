import profileData from '../../../shared/role-profiles.json';

export const ROLE_SOURCE = profileData.source;
export const ROLE_EMBEDDING_META = profileData.embedding;
export const ROLE_PROFILES = profileData.profiles.map((role) => ({
  ...role,
  id: role.id || 'role-' + role.field,
}));

export function roleText(role) {
  return [
    '岗位方向：' + role.label,
    '画像摘要：' + role.summary,
    '高频技能：' + (role.topSkills || []).join('、'),
    '共同经历：' + (role.experienceThemes || []).join('、'),
    '关键点：' + (role.keyPoints || []).join('、'),
    '岗位要求：' + (role.requirements || []).join('；'),
    '关键词：' + (role.keywords || []).join('、'),
  ].join('\n');
}

export function roleToJd(role) {
  const skillNames = role.topSkills || [];
  const keywordNames = (role.keywords || []).filter((keyword) => !skillNames.includes(keyword));
  return {
    id: role.id,
    jobId: role.id,
    title: role.label + '方向',
    company: '岗位画像',
    location: '多城市',
    salary: '画像样本',
    field: role.field,
    type: 'role-profile',
    rawText: roleText(role),
    summary: String(role.summary || '').slice(0, 180),
    requiredSkills: skillNames.map((name) => ({ name, category: 'direction' })),
    preferredSkills: keywordNames.slice(0, 8).map((name) => ({ name, category: 'direction' })),
    keywords: role.keywords || [],
    yearsRequired: 0,
    educationLevel: 0,
    educationLabel: '不限',
    responsibilities: (role.experienceThemes || []).join('\n'),
    requirementsText: (role.requirements || []).join('\n'),
    bullets: [...(role.keyPoints || []), ...(role.requirements || [])],
  };
}
