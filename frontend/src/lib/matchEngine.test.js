import { describe, it, expect } from 'vitest';
import { parseResume } from './resumeProfile.js';
import { parseJobDescription } from './jdParser.js';
import { analyzeMatch, blendAi, jobMatch, rankJobs, scoreBand, semanticToScore } from './matchEngine.js';
import { SAMPLE_RESUME, SAMPLE_JD } from './sampleData.js';
import { JOBS } from '../data/jobs.js';

const profile = parseResume(SAMPLE_RESUME);
const jd = parseJobDescription(SAMPLE_JD);

describe('analyzeMatch', () => {
  it('produces a useful score, dimensions and actionable suggestions', () => {
    const result = analyzeMatch(profile, jd);
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.dimensions.skills).toBeGreaterThan(50);
    expect(result.matchedSkills).toEqual(expect.arrayContaining(['React', 'TypeScript']));
    expect(result.suggestions.length).toBeGreaterThanOrEqual(3);
    expect(result.suggestions[0]).toHaveProperty('title');
    expect(result.suggestions[0]).toHaveProperty('detail');
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.gaps.length).toBeGreaterThan(0);
  });

  it('handles an empty profile without throwing', () => {
    const result = analyzeMatch(parseResume(''), jd);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.dimensions.skills).toBe(0);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });
});

describe('blendAi', () => {
  it('blends local and AI scores and keeps the local result as fallback', () => {
    const local = analyzeMatch(profile, jd);
    const merged = blendAi(local, {
      score: 90,
      summary: 'AI 总结',
      strengths: ['AI 优势'],
      gaps: ['AI 差距'],
      suggestions: [{ type: 'impact', title: 'AI 建议', detail: '具体做法', priority: 1 }],
    }, 78);
    expect(merged.score).toBe(Math.round(local.score * 0.65 + 90 * 0.35));
    expect(merged.mode).toBe('ai');
    expect(merged.semanticScore).toBe(78);
    expect(merged.summary).toBe('AI 总结');
    expect(merged.suggestions.length).toBeGreaterThan(0);
  });

  it('ignores an invalid AI payload', () => {
    const local = analyzeMatch(profile, jd);
    const merged = blendAi(local, null, 50);
    expect(merged.score).toBe(local.score);
    expect(merged.semanticScore).toBe(50);
  });
});

describe('ranking and helpers', () => {
  it('ranks jobs in descending score order', () => {
    const ranked = rankJobs(profile, JOBS, 5);
    expect(ranked).toHaveLength(5);
    for (let index = 1; index < ranked.length; index += 1) {
      expect(ranked[index - 1].score).toBeGreaterThanOrEqual(ranked[index].score);
    }
  });

  it('scores a single job', () => {
    const result = jobMatch(profile, JOBS[0]);
    expect(result.jd.title).toBe(JOBS[0].title);
    expect(result.analysis.score).toBeGreaterThan(0);
  });

  it('maps bands and semantic scores', () => {
    expect(scoreBand(85).key).toBe('strong');
    expect(scoreBand(70).key).toBe('good');
    expect(scoreBand(55).key).toBe('stretch');
    expect(scoreBand(20).key).toBe('weak');
    expect(semanticToScore(0.2)).toBe(0);
    expect(semanticToScore(0.9)).toBe(100);
  });
});
