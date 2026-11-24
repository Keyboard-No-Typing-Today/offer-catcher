import { useEffect, useRef, useState } from 'react';

function writeString(view, offset, value) {
  for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
}

function encodeWav(chunks, sampleRate) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const buffer = new ArrayBuffer(44 + total * 2);
  const view = new DataView(buffer);
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + total * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, total * 2, true);
  let offset = 44;
  for (const chunk of chunks) {
    for (let i = 0; i < chunk.length; i += 1) {
      const sample = Math.max(-1, Math.min(1, chunk[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([view], { type: 'audio/wav' });
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
    reader.onerror = () => reject(new Error('音频编码失败'));
    reader.readAsDataURL(blob);
  });
}

export function useVoiceRecorder({ maxSeconds = 60 } = {}) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');
  const refs = useRef({ stream: null, context: null, source: null, processor: null, chunks: [], timer: null, limit: null, startedAt: 0 });

  const cleanup = () => {
    const current = refs.current;
    if (current.timer) clearInterval(current.timer);
    if (current.limit) clearTimeout(current.limit);
    current.timer = null;
    current.limit = null;
    try { current.processor?.disconnect(); } catch { /* noop */ }
    try { current.source?.disconnect(); } catch { /* noop */ }
    try { current.stream?.getTracks().forEach((track) => track.stop()); } catch { /* noop */ }
    if (current.context && current.context.state !== 'closed') current.context.close().catch(() => {});
    current.stream = null;
    current.context = null;
    current.source = null;
    current.processor = null;
  };

  useEffect(() => () => cleanup(), []);

  const stop = async () => {
    const current = refs.current;
    if (!current.context) return null;
    cleanup();
    setRecording(false);
    const chunks = current.chunks;
    const sampleRate = current.sampleRate || 48000;
    current.chunks = [];
    if (!chunks.length) {
      setError('没有录到声音，请重试。');
      return null;
    }
    const blob = encodeWav(chunks, sampleRate);
    if (blob.size > 8 * 1024 * 1024) {
      setError('录音超过 8MB，请控制在 60 秒内。');
      return null;
    }
    const audio = await blobToBase64(blob);
    const seconds = Math.round(chunks.reduce((sum, chunk) => sum + chunk.length, 0) / sampleRate);
    setDuration(seconds);
    return { audio, mimeType: 'audio/wav', duration: seconds };
  };

  const start = async () => {
    setError('');
    if (recording) return false;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('当前环境不支持录音。');
      return false;
    }
    let stream = null;
    let context = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext({ sampleRate: 16000 });
      if (context.state === 'suspended') await context.resume();
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      const chunks = [];
      processor.onaudioprocess = (event) => {
        chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
      };
      source.connect(processor);
      processor.connect(context.destination);
      refs.current = {
        stream, context, source, processor, chunks,
        sampleRate: context.sampleRate,
        startedAt: Date.now(),
        timer: setInterval(() => setDuration(Math.round((Date.now() - refs.current.startedAt) / 1000)), 250),
        limit: setTimeout(() => {
          setError('已达到 60 秒上限，正在结束录音…');
        }, maxSeconds * 1000),
      };
      setDuration(0);
      setRecording(true);
      return true;
    } catch (err) {
      try { stream?.getTracks().forEach((track) => track.stop()); } catch { /* noop */ }
      try { context?.close(); } catch { /* noop */ }
      const denied = err?.name === 'NotAllowedError' || err?.name === 'SecurityError';
      setError(denied ? '麦克风权限未开启，请在系统设置中允许录音。' : '无法打开麦克风，请检查设备。');
      return false;
    }
  };

  const cancel = () => {
    cleanup();
    refs.current.chunks = [];
    setRecording(false);
    setDuration(0);
    setError('');
  };

  return { recording, duration, error, start, stop, cancel };
}
