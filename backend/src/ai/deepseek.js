import { config } from '../config.js';

export class AiError extends Error {
  constructor(message, code = 'ai_error', status = 502) {
    super(message);
    this.name = 'AiError';
    this.code = code;
    this.status = status;
  }
}

function abortAfter(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { controller, clear: () => clearTimeout(timer) };
}

async function requestJson(url, body, apiKey, timeoutMs) {
  const { controller, clear } = abortAfter(timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    let payload = null;
    try { payload = text ? JSON.parse(text) : null; } catch { payload = null; }
    if (!response.ok) {
      const message = payload?.error?.message || text.slice(0, 300) || 'AI 服务返回错误';
      throw new AiError(message, 'provider_error', response.status);
    }
    return payload;
  } catch (error) {
    if (error instanceof AiError) throw error;
    if (error.name === 'AbortError') throw new AiError('AI 服务响应超时', 'timeout', 504);
    throw new AiError('无法连接 AI 服务：' + (error.message || '网络错误'), 'network', 502);
  } finally {
    clear();
  }
}

export async function chatCompletion({ messages, model, temperature = 0.3, maxTokens = config.chat.maxTokens, jsonMode = false }) {
  if (!config.chat.apiKey) throw new AiError('服务端未配置聊天 API key', 'not_configured', 503);
  const body = {
    model: model || config.chat.model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };
  if (jsonMode) body.response_format = { type: 'json_object' };
  const payload = await requestJson(
    config.chat.baseUrl + '/chat/completions',
    body,
    config.chat.apiKey,
    config.chat.timeoutMs
  );
  const choice = payload?.choices?.[0];
  if (!choice) throw new AiError('AI 返回格式异常', 'bad_response');
  return {
    content: choice.message?.content || '',
    reasoning: choice.message?.reasoning_content || '',
    finishReason: choice.finish_reason || '',
    model: payload.model || model || config.chat.model,
    usage: payload.usage || null,
  };
}

function parseObject(candidate) {
  try {
    const parsed = JSON.parse(candidate);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function extractJson(text) {
  const raw = String(text || '').trim();
  if (!raw) throw new AiError('AI 没有返回内容', 'empty_response');
  const cleaned = raw.replace(/^\x60\x60\x60(?:json)?/i, '').replace(/\x60\x60\x60$/i, '').trim();
  const direct = parseObject(cleaned);
  if (direct) return direct;

  const start = cleaned.indexOf('{');
  if (start < 0) throw new AiError('AI 没有返回 JSON', 'invalid_json');

  const candidates = [];
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < cleaned.length; index += 1) {
    const char = cleaned[index];
    if (inString) {
      if (escaped) { escaped = false; continue; }
      if (char === '\\') { escaped = true; continue; }
      if (char === '"') inString = false;
      continue;
    }
    if (char === '"') { inString = true; continue; }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        candidates.push(cleaned.slice(start, index + 1));
        break;
      }
    }
  }

  const lastArrayClose = cleaned.lastIndexOf('}]');
  if (lastArrayClose > start) {
    candidates.push(cleaned.slice(start, lastArrayClose + 2) + '}');
  }

  for (let trim = 0; trim <= 16; trim += 1) {
    const base = cleaned.slice(start, cleaned.length - trim).trimEnd();
    if (!base) continue;
    candidates.push(base + '}', base + ']}', base + '}]}');
  }

  for (const candidate of candidates) {
    const parsed = parseObject(candidate);
    if (parsed) return parsed;
  }
  throw new AiError('AI 返回的 JSON 无法解析', 'invalid_json');
}

export async function chatJson({ messages, maxTokens, temperature = 0.2, model, fallbackModel }) {
  const first = await chatCompletion({ messages, maxTokens, temperature, model });
  try {
    return { json: extractJson(first.content), raw: first };
  } catch (error) {
    const repairMessages = [
      ...messages,
      { role: 'assistant', content: first.content || '(empty)' },
      { role: 'user', content: '你上一条不是合法 JSON。请只输出一个合法 JSON 对象，不要 markdown，不要解释。' },
    ];
    const second = await chatCompletion({
      messages: repairMessages,
      maxTokens,
      temperature: 0,
      model: fallbackModel || config.chat.fallbackModel,
    });
    return { json: extractJson(second.content), raw: second };
  }
}
