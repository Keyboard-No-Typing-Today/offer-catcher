import { Capacitor } from '@capacitor/core';

export class ApiError extends Error {
  constructor(message, code = 'api_error', status = 0) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export function isNativePlatform() {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
}

export function getDefaultApiBase() {
  const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_BASE_URL : '';
  if (env) return normalizeApiBase(env);
  if (isNativePlatform()) return 'http://localhost:3001/api';
  return '/api';
}

export function normalizeApiBase(value) {
  const raw = String(value || '').trim();
  if (!raw) return getDefaultApiBase();
  let base = raw.replace(/\/+$/, '');
  if (!/\/api$/i.test(base)) base += '/api';
  return base;
}

async function parseResponse(response) {
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = null; }
  if (!response.ok) {
    const message = payload?.message || payload?.error?.message || `请求失败（HTTP ${response.status}）`;
    throw new ApiError(message, payload?.code || 'http_error', response.status);
  }
  return payload;
}

async function request(baseUrl, path, options = {}) {
  const base = normalizeApiBase(baseUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 45000);
  try {
    const response = await fetch(`${base}${path}`, {
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    return await parseResponse(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === 'AbortError') {
      throw new ApiError('AI 服务响应超时，请检查网络或减少输入长度后重试。', 'timeout');
    }
    throw new ApiError('无法连接 AI 服务。请确认代理已启动，并在设置里检查服务地址。', 'network');
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkHealth(baseUrl) {
  return request(baseUrl, '/health', { timeoutMs: 6000 });
}

export async function analyzeWithAi(baseUrl, payload) {
  return request(baseUrl, '/ai/analyze', { method: 'POST', body: payload, timeoutMs: 90000 });
}

export async function chatWithAi(baseUrl, payload) {
  return request(baseUrl, '/ai/chat', { method: 'POST', body: payload, timeoutMs: 60000 });
}

export async function embedWithAi(baseUrl, texts) {
  return request(baseUrl, '/ai/embed', { method: 'POST', body: { texts }, timeoutMs: 45000 });
}

export async function transcribeAudio(baseUrl, { audio, mimeType = 'audio/wav' }) {
  return request(baseUrl, '/ai/transcribe', {
    method: 'POST',
    body: { audio, mimeType },
    timeoutMs: 90000,
  });
}

