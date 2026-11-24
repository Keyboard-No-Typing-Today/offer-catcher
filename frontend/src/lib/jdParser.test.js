import { describe, it, expect } from 'vitest';
import { parseJobDescription } from './jdParser.js';
import { SAMPLE_JD } from './sampleData.js';

describe('parseJobDescription', () => {
  it('splits required and preferred skills and reads education', () => {
    const jd = parseJobDescription(SAMPLE_JD);
    expect(jd.title).toContain('前端开发实习生');
    expect(jd.company).toBe('微光科技');
    expect(jd.type).toBe('internship');
    expect(jd.requiredSkills.map((skill) => skill.name)).toEqual(expect.arrayContaining(['React', 'TypeScript', 'HTML', 'CSS', 'Node.js']));
    expect(jd.preferredSkills.map((skill) => skill.name)).toContain('前端性能优化');
    expect(jd.educationLevel).toBe(3);
    expect(jd.location).toContain('深圳');
  });
});
