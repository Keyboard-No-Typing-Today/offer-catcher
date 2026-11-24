import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { config, embeddingEnabled } from './config.js';
import { embedTexts, cosineSimilarity } from './ai/embeddings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CORPUS_DIR = path.resolve(__dirname, '..', 'excellent_resumes');
const CACHE_DIR = path.resolve(__dirname, '..', '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'rag-embeddings.json');

let corpusCache = null;
let indexPromise = null;

function chunkText(text, maxLength = 720, overlap = 100) {
  const paragraphs = String(text || '')
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  const chunks = [];
  let current = '';
  for (const paragraph of paragraphs) {
    if (current && current.length + paragraph.length + 1 > maxLength) {
      chunks.push(current.trim());
      current = current.slice(-overlap) + '\n' + paragraph;
    } else {
      current += (current ? '\n' : '') + paragraph;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function loadCorpus() {
  if (corpusCache) return corpusCache;
  if (!fs.existsSync(CORPUS_DIR)) { corpusCache = []; return corpusCache; }
  const files = fs.readdirSync(CORPUS_DIR, { recursive: true })
    .filter((entry) => typeof entry === 'string' && entry.toLowerCase().endsWith('.txt'));
  const chunks = [];
  for (const relative of files) {
    const absolute = path.join(CORPUS_DIR, relative);
    let text = '';
    try { text = fs.readFileSync(absolute, 'utf8'); } catch { continue; }
    const category = relative.split(/[\\/]/)[0] || 'general';
    const parts = chunkText(text);
    parts.forEach((part, index) => {
      if (part.length < 40) return;
      chunks.push({
        id: relative.replace(/[\\/]/g, '-') + '-' + index,
        category,
        file: relative,
        text: part,
      });
    });
  }
  corpusCache = chunks;
  return chunks;
}

function contentHash(chunks) {
  const hash = crypto.createHash('sha1');
  hash.update(config.embedding.model);
  for (const chunk of chunks) hash.update(chunk.id + '|' + chunk.text);
  return hash.digest('hex');
}

async function buildIndex() {
  const chunks = loadCorpus();
  if (!chunks.length) return { chunks, vectors: [] };
  const hash = contentHash(chunks);
  try {
    const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    if (cached.hash === hash && cached.model === config.embedding.model && Array.isArray(cached.vectors) && cached.vectors.length === chunks.length) {
      return { chunks, vectors: cached.vectors };
    }
  } catch {
    /* cache miss */
  }
  const vectors = await embedTexts(chunks.map((chunk) => chunk.text));
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ hash, model: config.embedding.model, createdAt: new Date().toISOString(), vectors }));
  } catch (error) {
    console.warn('[RAG] 无法写入向量缓存:', error.message);
  }
  return { chunks, vectors };
}

function getIndex() {
  if (!indexPromise) {
    indexPromise = buildIndex().catch((error) => {
      console.warn('[RAG] 构建索引失败，将跳过 RAG:', error.message);
      return { chunks: [], vectors: [] };
    });
  }
  return indexPromise;
}

export async function getRagExamples(queryText, topK = 2) {
  if (!embeddingEnabled()) return [];
  try {
    const { chunks, vectors } = await getIndex();
    if (!chunks.length || !vectors.length) return [];
    const [queryVector] = await embedTexts([String(queryText || '').slice(0, 6000)]);
    if (!queryVector) return [];
    return chunks
      .map((chunk, index) => ({
        category: chunk.category,
        text: chunk.text.slice(0, 700),
        score: Number(cosineSimilarity(queryVector, vectors[index]).toFixed(4)),
      }))
      .sort((a, b) => b.score - a.score)
      .filter((item) => item.score > 0.15)
      .slice(0, topK);
  } catch (error) {
    console.warn('[RAG] 检索失败:', error.message);
    return [];
  }
}

export function ragStats() {
  const chunks = loadCorpus();
  return {
    files: new Set(chunks.map((chunk) => chunk.file)).size,
    chunks: chunks.length,
  };
}
