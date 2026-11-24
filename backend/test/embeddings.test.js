import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cosineSimilarity, semanticToScore } from '../src/ai/embeddings.js';

test('cosineSimilarity handles identical and orthogonal vectors', () => {
  assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
  assert.equal(cosineSimilarity([], [1]), 0);
  assert.equal(cosineSimilarity([0, 0], [1, 1]), 0);
});

test('semanticToScore maps cosine to a 0-100 score', () => {
  assert.equal(semanticToScore(0.2), 0);
  assert.equal(semanticToScore(0.55), 50);
  assert.equal(semanticToScore(0.9), 100);
  assert.equal(semanticToScore(null), 0);
});
