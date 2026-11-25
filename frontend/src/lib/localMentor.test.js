import { describe, expect, it } from 'vitest';
import { ROLE_PROFILES, roleToJd } from '../data/roles.js';
import { analyzeMatch } from './matchEngine.js';
import { localMentorReply } from './localMentor.js';

const profile = {
  name: '测试同学',
  educationLabel: '本科',
  yearsExperience: 0.5,
  quantifiedCount: 2,
  rawText: 'React TypeScript 前端项目',
  skills: [{ name: 'React' }, { name: 'TypeScript' }, { name: 'Vue' }],
  sections: { summary: '前端方向', education: '本科', experience: '实习', projects: '项目', skills: 'React TypeScript' },
  completeness: 80,
};

const roleMatches = ROLE_PROFILES
  .map((role) => {
    const local = analyzeMatch(profile, roleToJd(role));
    return { role, local, score: local.score };
  })
  .sort((a, b) => b.score - a.score);

const topRoles = roleMatches.slice(0, 3);

describe('local mentor explicit direction handling', () => {
  it('answers the named direction instead of listing nearest directions', () => {
    const reply = localMentorReply(
      '请帮我根据「算法工程师」方向修改简历，并告诉我最该补的 3 个点。',
      { profile, topRoles, roleMatches },
    );
    expect(reply).toContain('算法工程师');
    expect(reply).toContain('最该补的 3 个点');
    expect(reply).not.toContain('最接近的三个方向');
    expect(reply).toMatch(/1\./);
    expect(reply).toMatch(/2\./);
    expect(reply).toMatch(/3\./);
  });

  it('keeps the nearest-direction answer when no direction is named', () => {
    const reply = localMentorReply('我适合什么方向？', { profile, topRoles, roleMatches });
    expect(reply).toContain('最接近的三个方向');
    expect(reply).toContain(roleMatches[0].role.label);
  });
});
