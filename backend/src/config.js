import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const trimUrl = (value) => String(value || '').replace(/\/+$/, '');

export const config = {
  port: Number(process.env.PORT || 3001),
  chat: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseUrl: trimUrl(process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'),
    model: process.env.DEEPSEEK_MODEL || 'deepseek-flash',
    fallbackModel: process.env.DEEPSEEK_FALLBACK_MODEL || 'deepseek-v4-pro',
    maxTokens: Number(process.env.DEEPSEEK_MAX_TOKENS || 6000),
    timeoutMs: Number(process.env.DEEPSEEK_TIMEOUT_MS || 90000),
  },
  embedding: {
    apiKey: process.env.EMBEDDING_API_KEY || '',
    baseUrl: trimUrl(process.env.EMBEDDING_BASE_URL || 'https://api.deepseek.com/v1'),
    model: process.env.EMBEDDING_MODEL || 'qwen3.7-text-embedding',
    dimensions: Number(process.env.EMBEDDING_DIMENSIONS || 1024),
    batchSize: Number(process.env.EMBEDDING_BATCH_SIZE || 8),
    timeoutMs: Number(process.env.EMBEDDING_TIMEOUT_MS || 45000),
  },
  limits: {
    resumeChars: 16000,
    jdChars: 10000,
    messageChars: 4000,
    messages: 12,
    suggestions: 6,
  },
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,https://localhost,capacitor://localhost,http://localhost:3001')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
};

export function chatEnabled() {
  return Boolean(config.chat.apiKey && config.chat.baseUrl && config.chat.model);
}

export function embeddingEnabled() {
  return Boolean(config.embedding.apiKey && config.embedding.baseUrl && config.embedding.model);
}

export function publicConfig() {
  return {
    chat: {
      enabled: chatEnabled(),
      model: config.chat.model,
      baseUrlHost: safeHost(config.chat.baseUrl),
    },
    embedding: {
      enabled: embeddingEnabled(),
      model: config.embedding.model,
      dimensions: config.embedding.dimensions,
      baseUrlHost: safeHost(config.embedding.baseUrl),
    },
  };
}

export function safeHost(url) {
  try { return new URL(url).host; } catch { return ''; }
}
