import { Router } from 'express';
import { config, chatEnabled, embeddingEnabled } from '../config.js';
import { AiError, chatCompletion, chatJson } from '../ai/deepseek.js';
import { cosineSimilarity, embedTexts, semanticToScore } from '../ai/embeddings.js';
import { getRagExamples } from '../rag.js';
import { buildAnalysisMessages, buildChatMessages } from '../prompts.js';
import { normalizeAiAnalysis, normalizeMessages, validateAnalyzeInput } from '../validate.js';

const router = Router();
const buckets = new Map();

function rateLimit(req, res, next) {
  const key = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const recent = (buckets.get(key) || []).filter((time) => now - time < 60000);
  if (recent.length >= 30) {
    return res.status(429).json({ success: false, message: '请求太频繁，请稍后再试。' });
  }
  recent.push(now);
  buckets.set(key, recent);
  next();
}

router.use(rateLimit);

router.post('/ai/analyze', async (req, res, next) => {
  try {
    const input = validateAnalyzeInput(req.body);
    if (input.error) return res.status(400).json({ success: false, message: input.error });
    if (!chatEnabled()) {
      return res.status(503).json({ success: false, message: '服务端未配置聊天模型，请使用本地分析。' });
    }

    let semanticScore = null;
    if (embeddingEnabled()) {
      try {
        const [resumeVector, jdVector] = await embedTexts([input.resumeText, input.jdText]);
        if (resumeVector && jdVector) semanticScore = semanticToScore(cosineSimilarity(resumeVector, jdVector));
      } catch (error) {
        console.warn('[AI] 语义相似度计算失败:', error.message);
      }
    }

    const examples = await getRagExamples(input.resumeText + '\n' + input.jdText, 2);
    const messages = buildAnalysisMessages({ ...input, examples });
    const { json, raw } = await chatJson({ messages, maxTokens: config.chat.maxTokens, temperature: 0.25 });
    const ai = normalizeAiAnalysis(json);
    if (!ai) throw new AiError('AI 返回的分析结构不完整，已保留本地结果。', 'bad_ai_shape');

    res.json({
      success: true,
      data: {
        ai,
        semanticScore,
        examples,
        model: raw.model,
        usage: raw.usage,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/ai/chat', async (req, res, next) => {
  try {
    if (!chatEnabled()) {
      return res.status(503).json({ success: false, message: '服务端未配置聊天模型，请使用本地助手。' });
    }
    const messages = normalizeMessages(req.body?.messages);
    if (!messages.length) return res.status(400).json({ success: false, message: '消息不能为空' });
    const prompt = buildChatMessages({
      messages,
      profile: req.body?.profile || null,
      context: req.body?.context || null,
    });
    const result = await chatCompletion({ messages: prompt, maxTokens: 1200, temperature: 0.45 });
    const reply = String(result.content || '').trim();
    if (!reply) throw new AiError('AI 没有返回内容，请重试。', 'empty_reply');
    res.json({ success: true, data: { reply, model: result.model, usage: result.usage } });
  } catch (error) {
    next(error);
  }
});

router.post('/ai/transcribe', async (req, res, next) => {
  try {
    const audio = req.body?.audio;
    if (typeof audio !== 'string' || !audio) {
      return res.status(400).json({ success: false, message: '缺少音频数据。' });
    }
    const buffer = Buffer.from(audio, 'base64');
    if (buffer.length < 100) {
      return res.status(400).json({ success: false, message: '音频太短，请重新录制。' });
    }
    if (buffer.length > 8 * 1024 * 1024) {
      return res.status(413).json({ success: false, message: '录音超过 8MB，请控制在 60 秒内。' });
    }
    if (!config.chat.apiKey) {
      return res.status(503).json({ success: false, message: '服务端未配置 DeepSeek API key。' });
    }
    const base = config.chat.baseUrl.replace(/\/+$/, '');
    const endpoint = /\/v1$/i.test(base) ? base.replace(/\/v1$/i, '') + '/v1/tools/asr' : base + '/tools/asr';
    const form = new FormData();
    form.append('file', new Blob([buffer], { type: String(req.body?.mimeType || 'audio/wav') }), 'speech.wav');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + config.chat.apiKey },
      body: form,
    });
    const raw = await response.text();
    let payload = null;
    try { payload = raw ? JSON.parse(raw) : null; } catch { payload = null; }
    if (!response.ok) {
      throw new AiError(payload?.error?.message || payload?.message || '语音识别失败，请稍后重试。', 'asr_error', response.status);
    }
    const text = String(payload?.text || '').trim();
    if (!text) throw new AiError('没有识别到语音内容，请靠近麦克风重试。', 'asr_empty');
    res.json({
      success: true,
      data: {
        text,
        durationMs: Number(payload?.duration_ms) || 0,
        requestId: payload?.request_id || '',
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/ai/embed', async (req, res, next) => {
  try {
    if (!embeddingEnabled()) {
      return res.status(503).json({ success: false, message: '服务端未配置 embedding 模型。' });
    }
    const texts = Array.isArray(req.body?.texts)
      ? req.body.texts.map((text) => String(text || '').slice(0, 8000)).filter(Boolean)
      : [];
    if (!texts.length) return res.status(400).json({ success: false, message: 'texts 不能为空' });
    if (texts.length > 20) return res.status(400).json({ success: false, message: '一次最多 20 段文本' });
    const vectors = await embedTexts(texts);
    res.json({
      success: true,
      data: {
        vectors,
        model: config.embedding.model,
        dimensions: vectors[0]?.length || config.embedding.dimensions,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;