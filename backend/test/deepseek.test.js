import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractJson } from '../src/ai/deepseek.js';

test('extractJson parses plain JSON', () => {
  const value = extractJson('{"score": 80, "summary": "ok"}');
  assert.equal(value.score, 80);
  assert.equal(value.summary, 'ok');
});

test('extractJson strips markdown fences', () => {
  const value = extractJson('\u0060\u0060\u0060json\n{"score": 70}\n\u0060\u0060\u0060');
  assert.equal(value.score, 70);
});

test('extractJson repairs trailing garbage after the object', () => {
  const value = extractJson('{"score":74,"summary":"x","suggestions":[{"title":"a"}]},"}');
  assert.equal(value.score, 74);
  assert.equal(value.suggestions.length, 1);
});

test('extractJson throws on invalid input', () => {
  assert.throws(() => extractJson('no json here'), /JSON/);
  assert.throws(() => extractJson(''), /没有返回内容/);
});
