import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, BriefcaseBusiness, CheckCircle2, ClipboardPaste, FileText,
  Search, Sparkles, Target, X,
} from 'lucide-react';
import TopBar from '../components/TopBar.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Chip from '../components/Chip.jsx';
import Field from '../components/Field.jsx';
import Sheet from '../components/Sheet.jsx';
import useAppStore from '../store/useAppStore.js';
import { useToastStore } from '../store/useToastStore.js';
import { JOBS, getJob, filterJobs, fieldLabel } from '../data/jobs.js';
import { parseJobDescription, jobToDescription } from '../lib/jdParser.js';
import { analyzeMatch } from '../lib/matchEngine.js';
import { hapticSuccess } from '../hooks/useHaptics.js';

export default function AnalyzeScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const profile = useAppStore((state) => state.profile);
  const addAnalysis = useAppStore((state) => state.addAnalysis);
  const showToast = useToastStore((state) => state.showToast);

  const initialJob = getJob(params.get('job'));
  const [selectedJob, setSelectedJob] = useState(initialJob || null);
  const [jdText, setJdText] = useState(initialJob ? jobToDescription(initialJob) : '');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const jdPreview = useMemo(() => {
    if (jdText.trim().length < 30) return null;
    return parseJobDescription(jdText, selectedJob || null);
  }, [jdText, selectedJob]);

  const chooseJob = (job) => {
    setSelectedJob(job);
    setJdText(jobToDescription(job));
    setSheetOpen(false);
    setSearch('');
    setError('');
  };

  const start = () => {
    if (!profile) {
      setError('先导入一份简历，我才能做匹配。');
      return;
    }
    if (!jdPreview) {
      setError('JD 太短了，至少粘贴 30 个字，或从岗位库选一个。');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const local = analyzeMatch(profile, jdPreview);
      const entry = addAnalysis(jdPreview, local, { mode: 'local' });
      hapticSuccess();
      navigate('/result/' + entry.id, { state: { justCreated: true } });
    } catch (err) {
      setError(err.message || '分析失败，请重试。');
      setLoading(false);
    }
  };

  const filtered = filterJobs(JOBS, { keyword: search });

  return (
    <div className="page">
      <TopBar title="分析一个 JD" subtitle="先看匹配，再决定要不要投" />

      <div className="step-line">
        <div className="step step--active"><span className="step-dot">1</span>粘贴 JD</div>
        <div className="step-connector" />
        <div className="step"><span className="step-dot">2</span>看匹配</div>
        <div className="step-connector" />
        <div className="step"><span className="step-dot">3</span>改简历</div>
      </div>

      {!profile ? (
        <Card className="card--accent">
          <div className="row gap-10">
            <FileText size={20} />
            <div>
              <div className="strong">还没有简历</div>
              <div className="small" style={{ opacity: 0.8 }}>匹配需要先知道你的技能、经历和学历。</div>
            </div>
          </div>
          <div className="mt-12">
            <Button variant="paper" size="sm" icon={<ArrowRight size={15} />} onClick={() => navigate('/resume?onboarding=1')}>
              去导入简历
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="card--tight">
          <div className="between">
            <div className="row gap-10">
              <div className="list-icon"><FileText size={16} /></div>
              <div>
                <div className="strong small">{profile.name} 的简历</div>
                <div className="tiny muted mt-4">完整度 {profile.completeness}/100 · {profile.skills.length} 项技能</div>
              </div>
            </div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate('/resume')}>修改</button>
          </div>
        </Card>
      )}

      <div className="mt-16">
        <div className="between mb-8">
          <span className="label">目标岗位</span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setSheetOpen(true)}>
            <BriefcaseBusiness size={14} /> 从岗位库选择
          </button>
        </div>
        {selectedJob ? (
          <div className="selected-job">
            <div className="dot" style={{ color: 'var(--accent)', background: 'var(--accent)' }} />
            <div className="flex-1">
              <div className="strong small">{selectedJob.title}</div>
              <div className="tiny muted mt-4">{selectedJob.company} · {selectedJob.location} · {fieldLabel(selectedJob.field)}</div>
            </div>
            <button type="button" className="icon-btn icon-btn--ghost" aria-label="清除选择" onClick={() => { setSelectedJob(null); setJdText(''); }}>
              <X size={15} />
            </button>
          </div>
        ) : (
          <div className="selected-job">
            <ClipboardPaste size={17} className="muted" />
            <div className="flex-1 small muted">不选岗位也可以，直接把 JD 粘贴到下面。</div>
          </div>
        )}
      </div>

      <div className="mt-16">
        <Field label="岗位描述 / JD" hint="把招聘页面上的岗位职责和任职要求一起粘进来，匹配会更准。">
          <textarea
            className="textarea jd-textarea"
            value={jdText}
            onChange={(event) => { setJdText(event.target.value); setError(''); }}
            placeholder={'例如：\n岗位职责\n1. 参与核心产品前端开发…\n\n任职要求\n1. 熟悉 React、TypeScript…'}
            spellCheck={false}
          />
        </Field>
      </div>

      {jdPreview ? (
        <Card className="card--flat mt-12">
          <div className="between">
            <div className="strong small">已识别岗位要求</div>
            <Chip tone="soft">{jdPreview.type === 'internship' ? '实习' : '全职'}</Chip>
          </div>
          <div className="skill-cloud mt-10">
            {jdPreview.requiredSkills.length ? jdPreview.requiredSkills.slice(0, 10).map((skill) => (
              <Chip key={skill.name} tone="accent">{skill.name}</Chip>
            )) : <span className="tiny muted">没有识别到明确技能，建议把要求写得更具体。</span>}
            {jdPreview.preferredSkills.slice(0, 4).map((skill) => (
              <Chip key={skill.name} tone="soft">{skill.name} · 加分</Chip>
            ))}
          </div>
          <div className="row wrap gap-8 mt-10">
            <Chip tone="soft">{jdPreview.educationLabel}</Chip>
            <Chip tone="soft">{jdPreview.yearsRequired ? jdPreview.yearsRequired + ' 年经验' : '经验不限'}</Chip>
            {jdPreview.location && jdPreview.location !== '不限' ? <Chip tone="soft">{jdPreview.location}</Chip> : null}
          </div>
        </Card>
      ) : null}

      {error ? <div className="error-text mt-12">{error}</div> : null}

      <div className="mt-20">
        <Button size="lg" block icon={loading ? null : <Target size={18} />} loading={loading} onClick={start} disabled={!profile}>
          {loading ? '正在拆解岗位…' : '开始匹配'}
        </Button>
        <div className="hint text-center mt-8">
          先生成本地分析；如果连上了 AI 代理，结果页会自动补充 AI 建议。
        </div>
      </div>

      <div className="result-section">
        <Card className="card--sage">
          <div className="row gap-10">
            <Sparkles size={18} />
            <div>
              <div className="strong small">不知道投什么？</div>
              <div className="tiny muted mt-4">先浏览岗位库，按领域和关键词筛一筛，再回来做匹配。</div>
            </div>
          </div>
          <div className="mt-10">
            <Button size="sm" variant="paper" onClick={() => navigate('/jobs')}>去看岗位</Button>
          </div>
        </Card>
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="从岗位库选择">
        <div className="search-box">
          <Search size={15} className="muted" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索岗位、公司或技能" />
        </div>
        <div className="list mt-12">
          {filtered.slice(0, 20).map((job) => (
            <button
              type="button"
              className="list-item list-item--tap"
              key={job.id}
              onClick={() => chooseJob(job)}
              style={{ background: 'transparent', borderLeft: 0, borderRight: 0, borderTop: 0, width: '100%', textAlign: 'left' }}
            >
              <div className="list-icon"><BriefcaseBusiness size={16} /></div>
              <div className="list-main">
                <div className="list-title">{job.title}</div>
                <div className="list-sub">{job.company} · {job.location} · {fieldLabel(job.field)}</div>
              </div>
              <CheckCircle2 size={16} className="muted" />
            </button>
          ))}
          {!filtered.length ? <div className="empty-text text-center" style={{ padding: 20 }}>没有匹配的岗位，换个关键词试试。</div> : null}
        </div>
      </Sheet>
    </div>
  );
}
