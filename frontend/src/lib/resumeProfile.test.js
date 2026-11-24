import { describe, it, expect } from 'vitest';
import { parseResume } from './resumeProfile.js';
import { SAMPLE_RESUME } from './sampleData.js';

describe('parseResume', () => {
  it('extracts contact, sections, skills and education from a real-shaped resume', () => {
    const profile = parseResume(SAMPLE_RESUME, { fileName: 'sample.txt', fileType: 'text/plain' });
    expect(profile.name).toBe('林知夏');
    expect(profile.email).toBe('zhixia.lin@example.com');
    expect(profile.phone).toContain('13800138000');
    expect(profile.educationLevel).toBe(3);
    expect(profile.educationLabel).toBe('本科');
    expect(profile.sections.education).toContain('香港城市大学');
    expect(profile.sections.projects).toContain('CourseMate');
    expect(profile.skills.map((skill) => skill.name)).toEqual(expect.arrayContaining(['React', 'TypeScript', 'Node.js']));
    expect(profile.quantifiedCount).toBeGreaterThanOrEqual(3);
    expect(profile.completeness).toBeGreaterThan(70);
    expect(profile.yearsExperience).toBeGreaterThan(0);
  });

  it('does not crash on short or empty text', () => {
    const empty = parseResume('');
    expect(empty.name).toBe('同学');
    expect(empty.skills).toEqual([]);
    expect(empty.completeness).toBe(0);
    const short = parseResume('你好');
    expect(short.wordCount).toBeGreaterThan(0);
  });
});
