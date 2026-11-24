import { isNativePlatform } from './storage.js';

const SECTION_TITLES = {
  summary: '个人简介',
  education: '教育经历',
  experience: '实习 / 工作经历',
  projects: '项目经历',
  awards: '奖项与证书',
  campus: '校园经历',
  publications: '论文与成果',
};

function clean(value) {
  return String(value || '').trim();
}

export function buildResumeMarkdown(profile, targetRole) {
  if (!profile) return '';
  const lines = [];
  lines.push('# ' + (profile.name || '你的简历'));
  const contact = [profile.email, profile.phone, ...(profile.links || [])].filter(Boolean).join(' · ');
  if (contact) lines.push('', contact);
  lines.push('');
  lines.push('## 求职方向');
  lines.push(targetRole?.role?.label ? targetRole.role.label + '方向' : '待定');
  for (const [key, title] of Object.entries(SECTION_TITLES)) {
    const value = clean(profile.sections?.[key]);
    if (!value) continue;
    lines.push('', '## ' + title, '', value);
  }
  if (!profile.sections?.skills && (profile.skills || []).length) {
    lines.push('', '## 专业技能', '', profile.skills.map((skill) => skill.name).join(' · '));
  }
  lines.push('', '---', '');
  lines.push('> 由 Offer 捕手根据本机简历生成。当前导出 Markdown；PDF 版本在后续版本支持。');
  return lines.join('\n');
}

export function downloadMarkdown(filename, content) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function saveMarkdown(filename, content) {
  if (!isNativePlatform()) {
    downloadMarkdown(filename, content);
    return { native: false };
  }
  const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
  const result = await Filesystem.writeFile({
    path: filename,
    data: content,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
  });
  return { native: true, uri: result.uri };
}
