import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAiAnalysis, normalizeMessages, sanitizeText } from '../src/validate.js';

test('normalizeAiAnalysis keeps valid fields and clamps scores', () => {
  const result = normalizeAiAnalysis({
    score: 130,
    summary: '  总结  ',
    strengths: ['a', '', 2],
    gaps: ['b'],
    dimensions: { skills: 90, experience: 200, education: 'x' },
    suggestions: [
      { type: 'impact', title: '改结果', detail: '补数字', priority: 1 },
      { type: 'unknown', title: 'x', detail: 'y' },
      { title: '', detail: 'bad' },
    ],
  });
  assert.equal(result.score, 100);
  assert.equal(result.summary, '总结');

  const marked = normalizeAiAnalysis({ summary: '**重点** 与 `code`', strengths: ['**a**'], suggestions: [{ title: '**改**', detail: '`x`' }] });
  assert.equal(marked.summary, '重点 与 code');
  assert.deepEqual(marked.strengths, ['a']);
  assert.equal(marked.suggestions[0].title, '改');
  assert.equal(marked.suggestions[0].detail, 'x');
  assert.deepEqual(result.dimensions, { skills: 90, experience: 100 });
  assert.equal(result.suggestions.length, 2);
  assert.equal(result.suggestions[1].type, 'general');
});

test('normalizeAiAnalysis rejects empty objects', () => {
  assert.equal(normalizeAiAnalysis({}), null);
  assert.equal(normalizeAiAnalysis(null), null);
});

test('sanitizeText removes control chars and truncates', () => {
  assert.equal(sanitizeText('a\u0000b', 10), 'ab');
  assert.equal(sanitizeText('abcdef', 3), 'abc');
});

test('normalizeMessages keeps only valid roles and slices the tail', () => {
  const input = Array.from({ length: 20 }, (_, index) => ({ role: index % 2 ? 'user' : 'assistant', content: 'm' + index }));
  input.push({ role: 'system', content: 'nope' });
  const result = normalizeMessages(input);
  assert.equal(result.length, 12);
  assert.equal(result[0].content, 'm8');
  assert.ok(result.every((message) => message.role === 'user' || message.role === 'assistant'));
});
