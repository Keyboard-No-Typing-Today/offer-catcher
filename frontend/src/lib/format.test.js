import { describe, it, expect } from 'vitest';
import { truncate, scoreLabel, initials, formatDate, cleanMarkdown } from './format.js';

describe('format helpers', () => {
  it('truncates long text', () => {
    expect(truncate('abcdefghij', 5)).toBe('abcd…');
  });
  it('labels scores', () => {
    expect(scoreLabel(85)).toBe('高度匹配');
    expect(scoreLabel(40)).toBe('暂不建议');
  });
  it('creates initials', () => {
    expect(initials('林知夏')).toBe('林');
    expect(initials('Ada Lovelace')).toBe('AL');
  });
  it('formats dates', () => {
    expect(formatDate(0)).toBe('');
    expect(formatDate('2026-11-24')).not.toBe('');
  });
  it('strips common Markdown markers from assistant text', () => {
    expect(cleanMarkdown('**B 端** 与 `React`')).toBe('B 端 与 React');
  });
});
