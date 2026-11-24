import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight, Check, ClipboardList, Copy, FileText, Lightbulb, Loader2,
  MessageSquare, RefreshCw, Sparkles, TriangleAlert, X, Plus,
} from 'lucide-react';
import TopBar from '../components/TopBar.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Chip from '../components/Chip.jsx';
import ScoreRing from '../components/ScoreRing.jsx';
import DimensionBar from '../components/DimensionBar.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useAppStore from '../store/useAppStore.js';
import { useToastStore } from '../store/useToastStore.js';
import { analyzeWithAi, checkHealth } from '../lib/api.js';
import { blendAi, DIMENSION_LABELS, scoreBand } from '../lib/matchEngine.js';
import { copyText, timeAgo } from '../lib/format.js';
import { SUGGESTION_LABELS } from '../lib/constants.js';
import { hapticSuccess } from '../hooks/useHaptics.js';

const DIMENSION_KEYS = ['skills', 'experience', 'education', 'keywords', 'quality'];

export default function ResultScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const analysis = useAppStore((state) => state.analyses.find((item) => item.id === id) || null);
  const profile = useAppStore((state) => state.profile);
  const settings = useAppStore((state) => state.settings);
  const tracker = useAppStore((state) => state.tracker);
  const updateAnalysis = useAppStore((state) => state.updateAnalysis);
  const addTracker = useAppStore((state) => state.addTracker);
  const showToast = useToastStore((state) => state.showToast);

  const [aiPhase, setAiPhase] = useState('idle');
  const [aiError, setAiError] = useState('');
  const aiRunRef = useRef(null);

  const trackerEntry = useMemo(() => {
    if (!analysis) return null;
    return tracker.find((item) => (
      (analysis.jobId && item.jobId === analysis.jobId) ||
      (item.title === analysis.jobTitle && item.company === analysis.company)
    )) || null;
  }, [analysis, tracker]);

  const enhance = useCallback(async () => {
    const current = useAppStore.getState().analyses.find((item) => item.id === id);
    if (!current || !profile || current.mode === 'ai') return;
    if (aiRunRef.current === current.id) return;
    aiRunRef.current = current.id;
    setAiPhase('checking');
    setAiError('');
    try {
      const health = await checkHealth(settings.apiBaseUrl);
      if (!health?.chat?.enabled) {
        setAiPhase('disabled');
        return;
      }
      const response = await analyzeWithAi(settings.apiBaseUrl, {
        resumeText: profile.rawText,
        jdText: current.jdText,
        job: { title: current.jobTitle, company: current.company },
        local: {
          score: current.score,
          summary: current.summary,
          dimensions: current.dimensions,
          matchedSkills: current.matchedSkills,
          missingSkills: current.missingSkills,
          strengths: current.strengths,
          gaps: current.gaps,
          suggestions: current.suggestions,
        },
      });
      const data = response?.data || response;
      if (!data || !data.ai) throw new Error('AI 没有返回有效结果');
      const blended = blendAi(current, data.ai, data.semanticScore);
      updateAnalysis(current.id, blended);
      setAiPhase('done');
      hapticSuccess();
    } catch (error) {
      setAiPhase('error');
      setAiError(error.message || 'AI 增强暂时不可用，已保留本地分析。');
    }
  }, [id, profile, settings.apiBaseUrl, updateAnalysis]);

  useEffect(() => {
    if (!analysis) return;
    if (analysis.mode === 'ai') {
      setAiPhase('done');
      return;
    }
    if (!settings.aiEnabled) {
      setAiPhase('disabled');
      return;
    }
    enhance();
  }, [analysis?.id, analysis?.mode, settings.aiEnabled, enhance]);

  if (!analysis) {
    return (
      <div className="page">
        <TopBar title="匹配结果" />
        <EmptyState
          icon={<FileText size={24} />}
          title="找不到这份分析"
          description="它可能已经被删除。重新粘贴一个 JD 就可以生成新的结果。"
          action={<Button onClick={() => navigate('/analyze')}>分析一个 JD</Button>}
        />
      </div>
    );
  }

  const band = analysis.band || scoreBand(analysis.score);
  const bandTone = band.tone === 'success' ? 'success' : band.tone === 'warning' ? 'warning' : band.tone === 'danger' ? 'danger' : '';
  const trackerLabel = trackerEntry ? '已在投递进度中' : '加入投递进度';

  const copySuggestion = async (suggestion) => {
    await copyText(suggestion.title + '\n' + suggestion.detail);
    showToast('建议已复制');
  };

  const addToTracker = () => {
    if (trackerEntry) {
      navigate('/tracker');
      return;
    }
    addTracker({
      jobId: analysis.jobId,
      title: analysis.jobTitle,
      company: analysis.company,
      status: 'saved',
      notes: '来自匹配分析，准备投递。',
    });
    hapticSuccess();
    showToast('已加入投递进度');
  };

  const retryAi = () => {
    aiRunRef.current = null;
    setAiPhase('idle');
    enhance();
  };

  return (
    <div className="page">
      <TopBar
        title="匹配结果"
        subtitle={timeAgo(analysis.createdAt)}
        right={analysis.mode === 'ai'
          ? <span className="ai-badge"><Sparkles size={10} /> AI 增强</span>
          : <span className="local-badge">本地分析</span>}
      />

      {aiPhase === 'checking' ? (
        <div className="row gap-8 mb-12" style={{ color: 'var(--accent)' }}>
          <Loader2 size={14} className="spin--ink" style={{ animation: 'spin 1s linear infinite' }} />
          <span className="tiny">AI 正在补充更具体的建议…先看下面的本地分析。</span>
        </div>
      ) : null}
      {aiPhase === 'error' ? (
        <Card className="card--flat mb-12" style={{ background: 'var(--warning-soft)', borderColor: 'transparent' }}>
          <div className="between">
            <div className="row gap-8"><TriangleAlert size={15} /><span className="tiny">{aiError || 'AI 增强暂时不可用，当前为本地分析。'}</span></div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={retryAi}><RefreshCw size={12} /> 重试</button>
          </div>
        </Card>
      ) : null}
      {aiPhase === 'offline' || aiPhase === 'disabled' ? (
        <Card className="card--flat mb-12">
          <div className="row gap-8">
            <Lightbulb size={15} className="muted" />
            <span className="tiny muted">
              {aiPhase === 'offline' ? '当前离线，显示本地分析。' : 'AI 增强已关闭，显示本地分析。'}
              结果仍然完整可用；到「我的」里可以打开 AI。
            </span>
          </div>
        </Card>
      ) : null}

      <Card className="card--ink">
        <div className="result-head">
          <ScoreRing score={analysis.score} size={104} stroke={7} label="MATCH" dark />
          <div className="flex-1">
            <div className="eyebrow">TARGET ROLE</div>
            <div className="result-title mt-6">{analysis.jobTitle}</div>
            <div className="result-company">{analysis.company}</div>
            <span className={'result-band' + (bandTone ? ' result-band--' + bandTone : '')}>
              <span className="dot" />
              {band.label}
            </span>
          </div>
        </div>
        <div className="divider" style={{ background: 'rgba(245,240,230,0.14)' }} />
        <p className="result-summary" style={{ color: 'rgba(245,240,230,0.78)' }}>{analysis.summary}</p>
        <div className="row wrap gap-8 mt-12">
          {analysis.mode === 'ai' ? <Chip tone="success">AI 建议已合并</Chip> : <Chip tone="soft">本地规则分析</Chip>}
          {analysis.semanticScore != null ? <Chip tone="soft">语义相似度 {analysis.semanticScore}</Chip> : null}
          {analysis.aiScore != null ? <Chip tone="soft">AI 评分 {analysis.aiScore}</Chip> : null}
        </div>
      </Card>

      <section className="result-section">
        <div className="between mb-12">
          <h3 className="result-section-title">分项拆解</h3>
          <span className="eyebrow">DIMENSIONS</span>
        </div>
        <div className="stack gap-12">
          {DIMENSION_KEYS.map((key, index) => (
            <DimensionBar
              key={key}
              label={DIMENSION_LABELS[key]}
              score={analysis.dimensions?.[key] || 0}
              tone={index === 0 ? 'accent' : index === 4 ? 'sage' : 'amber'}
            />
          ))}
        </div>
      </section>

      <section className="result-section">
        <div className="between mb-12">
          <h3 className="result-section-title">你的优势</h3>
          <span className="eyebrow">STRENGTHS</span>
        </div>
        <Card className="card--flat">
          {analysis.strengths.map((item) => (
            <div className="strength-row" key={item}>
              <Check size={14} className="strength-mark" />
              <span>{item}</span>
            </div>
          ))}
        </Card>
      </section>

      <section className="result-section">
        <div className="between mb-12">
          <h3 className="result-section-title">需要补强</h3>
          <span className="eyebrow">GAPS</span>
        </div>
        <Card className="card--flat">
          {analysis.gaps.map((item) => (
            <div className="gap-row" key={item}>
              <TriangleAlert size={14} className="gap-mark" />
              <span>{item}</span>
            </div>
          ))}
        </Card>
      </section>

      <section className="result-section">
        <div className="between mb-12">
          <h3 className="result-section-title">技能对照</h3>
          <span className="eyebrow">SKILLS</span>
        </div>
        <Card className="card--flat">
          <div className="label">已命中</div>
          <div className="skill-cloud mt-8">
            {analysis.matchedSkills.length ? analysis.matchedSkills.map((skill) => (
              <Chip key={skill} tone="success"><Check size={11} /> {skill}</Chip>
            )) : <span className="tiny muted">暂时没有命中的核心技能，先补充项目证据。</span>}
          </div>
          <div className="divider" />
          <div className="label">待补充</div>
          <div className="skill-cloud mt-8">
            {analysis.missingSkills.length ? analysis.missingSkills.map((skill) => (
              <Chip key={skill} tone="warning"><Plus size={11} /> {skill}</Chip>
            )) : <span className="tiny muted">岗位要求的技能都覆盖到了。</span>}
          </div>
        </Card>
      </section>

      <section className="result-section">
        <div className="between mb-12">
          <h3 className="result-section-title">下一步怎么改</h3>
          <span className="eyebrow">ACTIONS</span>
        </div>
        <div>
          {analysis.suggestions.map((suggestion) => (
            <div className="suggestion" key={suggestion.title}>
              <div className="suggestion-head">
                <div className="suggestion-title">{suggestion.title}</div>
                <span className="suggestion-type">{SUGGESTION_LABELS[suggestion.type] || '建议'}</span>
              </div>
              <div className="suggestion-text">{suggestion.detail}</div>
              <div className="mt-8">
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => copySuggestion(suggestion)}>
                  <Copy size={12} /> 复制这条
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="result-actions">
        <Button block icon={<ClipboardList size={17} />} onClick={addToTracker}>
          {trackerLabel}
        </Button>
        <div className="row gap-8">
          <Button variant="outline" block icon={<ArrowRight size={15} />} onClick={() => navigate('/analyze')}>再分析一个</Button>
          <Button variant="ghost" block icon={<MessageSquare size={15} />} onClick={() => navigate('/assistant', { state: { prompt: '帮我根据这个岗位改写简历：' + analysis.jobTitle } })}>问助手</Button>
        </div>
        <Button variant="ghost" block icon={<X size={15} />} onClick={() => navigate('/')}>回到首页</Button>
      </div>

      <div className="footer-note">
        以下是本地规则 + {analysis.mode === 'ai' ? 'AI 补充' : '可选的 AI 增强'}，不是招聘方的最终判断。
      </div>
    </div>
  );
}
