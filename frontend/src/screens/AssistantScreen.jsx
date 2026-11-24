import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUp, BriefcaseBusiness, Eraser, Loader2, Sparkles, Wifi, WifiOff,
} from 'lucide-react';
import Chip from '../components/Chip.jsx';
import Button from '../components/Button.jsx';
import useAppStore from '../store/useAppStore.js';
import { useToastStore } from '../store/useToastStore.js';
import { STARTER_PROMPTS, localAssistantReply } from '../lib/localAssistant.js';
import { chatWithAi, checkHealth } from '../lib/api.js';
import { getJob } from '../data/jobs.js';
import { cleanMarkdown } from '../lib/format.js';
import { hapticTap } from '../hooks/useHaptics.js';

export default function AssistantScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useAppStore((state) => state.profile);
  const analyses = useAppStore((state) => state.analyses);
  const tracker = useAppStore((state) => state.tracker);
  const chatMessages = useAppStore((state) => state.chatMessages);
  const addChatMessage = useAppStore((state) => state.addChatMessage);
  const clearChat = useAppStore((state) => state.clearChat);
  const settings = useAppStore((state) => state.settings);
  const showToast = useToastStore((state) => state.showToast);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [connection, setConnection] = useState('checking');
  const scrollRef = useRef(null);
  const consumedPrompt = useRef(false);

  const latest = analyses[0] || null;

  const context = useMemo(() => ({
    profile,
    tracker,
    analyses,
    latestAnalysis: latest,
  }), [profile, tracker, analyses, latest]);

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
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [chatMessages.length, sending]);

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
    if (settings.aiEnabled && connection === 'ai') {
      try {
        const response = await chatWithAi(settings.apiBaseUrl, {
          messages: history,
          profile: profile ? {
            name: profile.name,
            skills: profile.skills.map((skill) => skill.name),
            yearsExperience: profile.yearsExperience,
            educationLabel: profile.educationLabel,
            quantifiedCount: profile.quantifiedCount,
          } : null,
          context: {
            latestAnalysis: latest ? {
              jobTitle: latest.jobTitle,
              company: latest.company,
              score: latest.score,
              missingSkills: latest.missingSkills,
              gaps: latest.gaps,
            } : null,
            trackerCount: tracker.length,
          },
        });
        const data = response?.data || response;
        if (data?.reply) reply = { reply: data.reply, mode: 'ai', jobIds: [] };
      } catch {
        /* fall back to local */
      }
    }

    if (!reply) {
      const local = localAssistantReply(text, context);
      reply = { ...local, mode: 'local' };
    }

    addChatMessage({ role: 'assistant', content: cleanMarkdown(reply.reply), jobIds: reply.jobIds || [], mode: reply.mode || 'local' });
    setSending(false);
  };

  useEffect(() => {
    const prompt = location.state?.prompt;
    if (!prompt || consumedPrompt.current) return;
    consumedPrompt.current = true;
    setInput(prompt);
    send(prompt);
  }, [location.state, send]);

  return (
    <div className="page page--tab assistant-page">
      <div className="assistant-head">
        <div className="between">
          <div>
            <div className="home-date">CONVERSATION · {chatMessages.length} MESSAGES</div>
            <h1 className="assistant-title mt-6">助手</h1>
            <p className="assistant-sub">
              {connection === 'ai' ? 'AI 已连接 · 可以追问、改写、比较岗位' : connection === 'checking' ? '正在检查 AI 连接…' : '本地模式 · 离线也能找岗位、看进度'}
            </p>
          </div>
          <div className="icon-btn" aria-hidden="true">
            {connection === 'ai' ? <Wifi size={18} /> : connection === 'checking' ? <Loader2 size={18} className="spin--ink" style={{ animation: 'spin 1s linear infinite' }} /> : <WifiOff size={18} />}
          </div>
        </div>
      </div>

      <div className="assistant-scroll hide-scrollbar" ref={scrollRef}>
        {!chatMessages.length ? (
          <div className="assistant-empty">
            <div className="assistant-empty-title">把问题丢过来，<br />我帮你把它拆小。</div>
            <div className="assistant-empty-text">
              「这个岗位值不值得投？」「帮我找几个前端实习」「我的简历还差什么？」
              都可以直接问。没有网络时，我会用本地规则回答。
            </div>
            <div className="starter hide-scrollbar">
              {STARTER_PROMPTS.map((prompt) => (
                <Chip as="button" key={prompt} tone="soft" onClick={() => send(prompt)}>{prompt}</Chip>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-list">
            {chatMessages.map((message) => (
              <div className={'bubble ' + (message.role === 'user' ? 'bubble--user' : 'bubble--assistant')} key={message.id}>
                <div>{message.content}</div>
                {message.jobIds?.length ? (
                  <div className="chat-job-list">
                    {message.jobIds.map((id) => {
                      const job = getJob(id);
                      if (!job) return null;
                      return (
                        <button type="button" className="chat-job" key={id} onClick={() => navigate('/jobs/' + id)}>
                          <span>{job.title} · {job.company}</span>
                          <BriefcaseBusiness size={12} />
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                <div className="bubble-meta">
                  {message.role === 'user' ? '你' : message.mode === 'ai' ? 'AI 助手' : '本地助手'}
                </div>
              </div>
            ))}
            {sending ? (
              <div className="bubble bubble--assistant">
                <span className="row gap-6"><span className="spin spin--ink" /> 正在想…</span>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {chatMessages.length ? (
        <div className="between mb-8">
          <span className="tiny muted">{connection === 'ai' ? 'AI 已连接' : '本地模式'}</span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => { clearChat(); showToast('对话已清空'); }}>
            <Eraser size={13} /> 清空
          </button>
        </div>
      ) : null}

      <div className="chat-composer">
        <input
          className="input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(input); } }}
          placeholder="问岗位、简历、进度…"
          aria-label="输入消息"
        />
        <Button size="icon" className="btn--icon" aria-label="发送" onClick={() => send(input)} disabled={!input.trim() || sending}>
          <ArrowUp size={18} />
        </Button>
      </div>

      <div className="footer-note">
        <Sparkles size={11} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
        {connection === 'ai' ? '回复由 AI 生成，请核对事实。' : '本地模式不联网；AI 增强可在「我的」里配置。'}
      </div>
    </div>
  );
}
