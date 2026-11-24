import { describe, expect, it } from 'vitest';
import profileData from '../../../shared/role-profiles.json';
import { ROLE_PROFILES, roleToJd } from './roles.js';
import { analyzeMatch } from '../lib/matchEngine.js';

describe('resume-derived role profiles', () => {
  it('contains 10 directions aggregating 21 resumes', () => {
    expect(ROLE_PROFILES).toHaveLength(10);
    const samples = ROLE_PROFILES.reduce((sum, role) => sum + role.sampleCount, 0);
    expect(samples).toBe(21);
  });

  it('has a 1024-d Qwen embedding for every direction', () => {
    expect(profileData.embedding.model).toBe('qwen3.7-text-embedding');
    for (const role of ROLE_PROFILES) {
      expect(role.embedding).toHaveLength(1024);
      expect(role.embedding.every((value) => Number.isFinite(value))).toBe(true);
    }
  });

  it('converts a direction into a matchable profile JD', () => {
    const jd = roleToJd(ROLE_PROFILES[0]);
    expect(jd.title).toContain('方向');
    expect(jd.requiredSkills.length).toBeGreaterThan(0);
    const result = analyzeMatch({
      skills: jd.requiredSkills.slice(0, 3).map((skill) => ({ name: skill.name })),
      rawText: jd.requiredSkills.map((skill) => skill.name).join(' '),
      sections: { experience: '项目经历', projects: '项目' },
      completeness: 80,
      quantifiedCount: 2,
    }, jd);
    expect(result.score).toBeGreaterThan(0);
    expect(result.matchedSkills.length).toBeGreaterThan(0);
  });
});
