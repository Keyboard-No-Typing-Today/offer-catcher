import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Dialog, Popup, Tag, TextArea, Toast } from 'antd-mobile';
import {
  ArrowUp, Download, Eraser, Loader2, Mic, MicOff, Sparkles, Wifi, WifiOff,
} from 'lucide-react';
import useAppStore from '../store/useAppStore.js';
import { ROLE_PROFILES, roleToJd } from '../data/roles.js';
import { analyzeMatch } from '../lib/matchEngine.js';
import { cleanMarkdown } from '../lib/format.js';
import { localMentorReply, STARTER_PROMPTS } from '../lib/localMentor.js';
import { buildResumeMarkdown, saveMarkdown } from '../lib/resumeMarkdown.js';
import { chatWithAi, checkHealth, transcribeAudio } from '../lib/api.js';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder.js';
import { hapticTap } from '../hooks/useHaptics.js';

export default function AssistantModule() {
  const location = useLocation();
  const profile = useAppStore((state) => state.profile);
  const chatMessages = useAppStore((state) => state.chatMessages);
  const addChatMessage = useAppStore((state) => state.addChatMessage);
  const clearChat = useAppStore((state) => state.clearChat);
  const settings = useAppStore((state) => state.settings);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [connection, setConnection] = useState('checking');
  const [markdown, setMarkdown] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const scrollEnd = useRef(null);
  const consumedPrompt = useRef(false);
  const lastVoiceError = useRef('');
  const voice = useVoiceRecorder({ maxSeconds: 60 });
  const stopVoiceRef = useRef(null);

  const roleMatches = useMemo(() => {
    if (!profile) return [];
    return ROLE_PROFILES
      .map((role) => {
        const jd = roleToJd(role);
        const local = analyzeMatch(profile, jd);
        return { role, jd, local, score: local.score };
      })
      .sort((a, b) => b.score - a.score);
  }, [profile]);
  const topRoles = useMemo(() => roleMatches.slice(0, 3), [roleMatches]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!settings.aiEnabled) {
        if (mounted) setConnection('local');
        return;
      }
      try {
        const health = await checkHealth(settings.apiBaseUrl);
        if (mounted) setConnection(health?.chat?.enabled ? 'ai' : 'local');
      } catch {
        if (mounted) setConnection('local');
      }
    })();
    return () => { mounted = false; };
  }, [settings.aiEnabled, settings.apiBaseUrl]);

  useEffect(() => {
    scrollEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatMessages.length, sending]);

  useEffect(() => {
    if (voice.error && voice.error !== lastVoiceError.current) {
      lastVoiceError.current = voice.error;
      Toast.show({ content: voice.error });
    }
  }, [voice.error]);

  const send = async (raw) => {
    const text = String(raw || '').trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    addChatMessage({ role: 'user', content: text });
    hapticTap('light');
    const history = [...chatMessages, { role: 'user', content: text }]
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .slice(-10)
      .map((message) => ({ role: message.role, content: message.content }));

    let reply = null;
    let activeConnection = connection;
    if (settings.aiEnabled && activeConnection !== 'ai') {
      try {
        const health = await checkHealth(settings.apiBaseUrl);
        if (health?.chat?.enabled) {
          activeConnection = 'ai';
          setConnection('ai');
        }
      } catch {
        /* keep local */
      }
    }
    if (settings.aiEnabled && activeConnection === 'ai') {
      try {
        const response = await chatWithAi(settings.apiBaseUrl, {
          messages: history,
          profile: profile ? {
            name: profile.name,
            skills: (profile.skills || []).map((skill) => skill.name),
            yearsExperience: profile.yearsExperience,
            educationLabel: profile.educationLabel,
            quantifiedCount: profile.quantifiedCount,
            summary: (profile.sections?.summary || '').slice(0, 800),
            education: (profile.sections?.education || '').slice(0, 1000),
            experience: (profile.sections?.experience || '').slice(0, 2400),
            projects: (profile.sections?.projects || '').slice(0, 2400),
          } : null,
          context: {
            topRoles: topRoles.map((item) => ({
              label: item.role.label,
              score: item.score,
              matchedSkills: (item.local.matchedSkills || []).slice(0, 5),
              missingSkills: (item.local.missingSkills || []).slice(0, 5),
            })),
            directions: roleMatches.map((item) => ({
              label: item.role.label,
              score: item.score,
              topSkills: (item.role.topSkills || []).slice(0, 6),
              missingSkills: (item.local.missingSkills || []).slice(0, 5),
            })),
            resumeSource: 'resume-corpus',
          },
        });
        const data = response?.data || response;
        if (data?.reply) reply = { reply: data.reply, mode: 'ai' };
      } catch {
        /* fall through to local */
      }
    }
    if (!reply) {
      reply = { reply: localMentorReply(text, { profile, topRoles, roleMatches }), mode: 'local' };
    }
    addChatMessage({ role: 'assistant', content: cleanMarkdown(reply.reply), mode: reply.mode });
    setSending(false);
  };

  useEffect(() => {
    const prompt = location.state?.prompt;
    if (!prompt || consumedPrompt.current) return;
    consumedPrompt.current = true;
    send(prompt);
  }, [location.state]);

  const confirmClear = async () => {
    const confirmed = await Dialog.confirm({ content: '清空当前对话记录？简历不会被删除。' });
    if (confirmed) {
      clearChat();
      Toast.show({ content: '对话已清空' });
    }
  };

  const openExport = () => {
    if (!profile) {
      Dialog.alert({ content: '先导入一份简历，才能生成 Markdown。' });
      return;
    }
    const best = topRoles[0] ? { role: topRoles[0].role, score: topRoles[0].score } : null;
    setMarkdown(buildResumeMarkdown(profile, best));
    setExportOpen(true);
  };

  const doSaveMarkdown = async () => {
    try {
      const result = await saveMarkdown('OfferCatcher-Resume.md', markdown);
      Toast.show({
        content: result.native ? '已保存到 Documents/OfferCatcher-Resume.md' : 'Markdown 已开始下载',
      });
      setExportOpen(false);
    } catch (error) {
      Toast.show({ content: '保存失败：' + (error.message || '请重试') });
    }
  };

  const handleMic = async () => {
    if (transcribing) return;
    if (voice.recording) {
      const audio = await voice.stop();
      if (!audio) return;
      setTranscribing(true);
      try {
        const response = await transcribeAudio(settings.apiBaseUrl, audio);
        const text = String(response?.data?.text || '').trim();
        if (text) {
          setInput((previous) => (previous ? previous + ' ' : '') + text);
          Toast.show({ icon: 'success', content: '语音已转成文字' });
        } else {
          Toast.show({ content: '没有识别到内容，请重试' });
        }
      } catch (error) {
        Dialog.alert({ content: error?.message || '语音识别失败，请稍后重试。' });
      } finally {
        setTranscribing(false);
      }
      return;
    }
    await voice.start();
  };

  stopVoiceRef.current = handleMic;

  useEffect(() => {
    if (voice.recording && voice.duration >= 60) stopVoiceRef.current?.();
  }, [voice.recording, voice.duration]);

  const empty = chatMessages.length === 0;

  return (
    <div className="m-page m-assistant-page">
      <header className="m-top m-assistant-top">
        <div>
          <div className="m-eyebrow">CONVERSATION</div>
          <h1 className="m-page-title">助手</h1>
          <div className={'m-connection ' + (connection === 'ai' ? 'is-ai' : 'is-local')}>
            {connection === 'ai' ? <Wifi size={11} /> : <WifiOff size={11} />}
            {connection === 'checking' ? '连接中…' : connection === 'ai' ? 'AI 已连接' : '本地模式'}
          </div>
        </div>
        <div className="m-head-actions">
          <Button size="small" fill="none" className="m-ghost-btn" onClick={openExport} disabled={!profile}>
            <Download size={14} /> Markdown
          </Button>
          <Button size="small" fill="none" className="m-ghost-btn" onClick={confirmClear}>
            <Eraser size={14} />
          </Button>
        </div>
      </header>

      {empty ? (
        <div className="m-chat-intro">
          <div className="m-chat-orb"><Sparkles size={22} /></div>
          <h2>把问题丢过来，<br />我帮你把它拆小。</h2>
          <p>
            {profile
              ? '我会结合你导入的简历和方向画像回答，不会用通用模板糊弄你。'
              : '先导入简历，我就能根据你的真实经历回答。'}
          </p>
          <div className="m-starters">
            {STARTER_PROMPTS.map((prompt) => (
              <button key={prompt} type="button" className="m-starter" onClick={() => send(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="m-chat-list">
          {chatMessages.map((message) => (
            <div key={message.id} className={'m-msg ' + (message.role === 'user' ? 'is-user' : 'is-assistant')}>
              <div className="m-msg-bubble">
                <div className="m-msg-text">{message.content}</div>
                {message.role === 'assistant' ? (
                  <Tag fill="outline" className="m-msg-mode">{message.mode === 'ai' ? 'AI' : '本地'}</Tag>
                ) : null}
              </div>
            </div>
          ))}
          {sending ? (
            <div className="m-msg is-assistant">
              <div className="m-msg-bubble m-typing"><Loader2 size={14} className="m-spin" /> 正在想怎么帮你拆…</div>
            </div>
          ) : null}
        </div>
      )}
      <div ref={scrollEnd} className="m-chat-end" />

      <div className={'m-composer ' + (voice.recording ? 'is-recording' : '')}>
        {voice.recording ? (
          <div className="m-recording">
            <span className="m-recording-dot" />
            <span>正在录音 {voice.duration}s</span>
            <button type="button" onClick={handleMic}>停止并转文字</button>
          </div>
        ) : null}
        <div className="m-composer-row">
          <TextArea
            value={input}
            onChange={setInput}
            placeholder={profile ? '问方向、改简历、准备面试…' : '先导入简历，或者先问我能做什么'}
            autoSize={{ minRows: 1, maxRows: 4 }}
            className="m-chat-input"
          />
          <button
            type="button"
            className={'m-mic-btn ' + (voice.recording ? 'is-recording' : '')}
            aria-label={voice.recording ? '停止录音' : '语音输入'}
            onClick={handleMic}
            disabled={transcribing}
          >
            {transcribing ? <Loader2 size={31} className="m-spin" /> : voice.recording ? <MicOff size={31} /> : <Mic size={31} />}
          </button>
          <button
            type="button"
            className="m-send-btn"
            aria-label="发送"
            disabled={!input.trim() || sending || transcribing}
            onClick={() => send(input)}
          >
            <ArrowUp size={18} />
          </button>
        </div>
        <div className="m-composer-foot">语音识别由 DeepSeek ASR 提供 · 回复仅供参考</div>
      </div>

      <Popup
        visible={exportOpen}
        onMaskClick={() => setExportOpen(false)}
        bodyStyle={{ maxHeight: '88dvh', overflowY: 'auto', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
        destroyOnClose
      >
        <div className="m-sheet m-export-sheet">
          <div className="m-sheet-handle" />
          <div className="m-sheet-head">
            <div>
              <div className="m-eyebrow">MARKDOWN RESUME</div>
              <h2>推荐 Markdown 简历</h2>
              <div className="m-muted">当前导出 Markdown；PDF 版本列为下一步。</div>
            </div>
          </div>
          <pre className="m-markdown-preview">{markdown}</pre>
          <div className="m-sheet-actions">
            <Button block color="primary" size="large" onClick={doSaveMarkdown}>保存 / 下载 .md</Button>
            <Button block fill="outline" onClick={() => setExportOpen(false)}>收起</Button>
          </div>
        </div>
      </Popup>
    </div>
  );
}