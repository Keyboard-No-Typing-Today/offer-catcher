import { config } from '../config.js';
import { AiError } from './deepseek.js';

function abortAfter(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { controller, clear: () => clearTimeout(timer) };
}

export function cosineSimilarity(a = [], b = []) {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function semanticToScore(cosine) {
  const value = Number(cosine);
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(((value - 0.2) / 0.7) * 100)));
}

async function requestEmbeddings(input) {
  const { controller, clear } = abortAfter(config.embedding.timeoutMs);
  try {
    const response = await fetch(config.embedding.baseUrl + '/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + config.embedding.apiKey,
      },
      body: JSON.stringify({ model: config.embedding.model, input }),
      signal: controller.signal,
    });
    const text = await response.text();
    let payload = null;
    try { payload = text ? JSON.parse(text) : null; } catch { payload = null; }
    if (!response.ok) {
      const message = payload?.error?.message || text.slice(0, 300) || '向量服务返回错误';
      throw new AiError(message, 'embedding_error', response.status);
    }
    const rows = payload?.data;
    if (!Array.isArray(rows) || !rows.length) throw new AiError('向量服务没有返回数据', 'embedding_empty');
    return rows
      .slice()
      .sort((a, b) => (a.index || 0) - (b.index || 0))
      .map((row) => row.embedding);
  } catch (error) {
    if (error instanceof AiError) throw error;
    if (error.name === 'AbortError') throw new AiError('向量服务响应超时', 'embedding_timeout', 504);
    throw new AiError('无法连接向量服务：' + (error.message || '网络错误'), 'embedding_network', 502);
  } finally {
    clear();
  }
}

export async function embedTexts(texts = []) {
  if (!config.embedding.apiKey) throw new AiError('服务端未配置 embedding API key', 'embedding_not_configured', 503);
  const cleaned = texts.map((text) => String(text || '').slice(0, 8000));
  const batches = [];
  for (let index = 0; index < cleaned.length; index += config.embedding.batchSize) {
    batches.push(cleaned.slice(index, index + config.embedding.batchSize));
  }
  const vectors = [];
  for (const batch of batches) {
    const rows = await requestEmbeddings(batch);
    vectors.push(...rows);
  }
  return vectors;
}
