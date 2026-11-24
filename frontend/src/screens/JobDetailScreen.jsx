import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight, Bookmark, BookmarkCheck, BriefcaseBusiness, ClipboardList,
  MapPin, Sparkles, Target, Wallet, Check, TriangleAlert,
} from 'lucide-react';
import TopBar from '../components/TopBar.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Chip from '../components/Chip.jsx';
import ScoreRing from '../components/ScoreRing.jsx';
import DimensionBar from '../components/DimensionBar.jsx';
import EmptyState from '../components/EmptyState.jsx';
import StatusPill from '../components/StatusPill.jsx';
import useAppStore from '../store/useAppStore.js';
import { useToastStore } from '../store/useToastStore.js';
import { getJob, fieldLabel, fieldColor } from '../data/jobs.js';
import { jobMatch } from '../lib/matchEngine.js';
import { DIMENSION_LABELS } from '../lib/matchEngine.js';
import { hapticSuccess } from '../hooks/useHaptics.js';

export default function JobDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const job = getJob(id);
  const profile = useAppStore((state) => state.profile);
  const savedJobIds = useAppStore((state) => state.savedJobIds);
  const toggleSavedJob = useAppStore((state) => state.toggleSavedJob);
  const tracker = useAppStore((state) => state.tracker);
  const addTracker = useAppStore((state) => state.addTracker);
  const showToast = useToastStore((state) => state.showToast);

  const match = useMemo(() => (job && profile ? jobMatch(profile, job) : null), [job, profile]);
  const saved = job ? savedJobIds.includes(job.id) : false;
  const trackerEntry = job ? tracker.find((item) => item.jobId === job.id) || tracker.find((item) => item.title === job.title && item.company === job.company) : null;

  if (!job) {
    return (
      <div className="page">
        <TopBar title="岗位详情" />
        <EmptyState
          icon={<BriefcaseBusiness size={24} />}
          title="岗位不存在"
          description="它可能已经从示例岗位库里移除。"
          action={<Button onClick={() => navigate('/jobs')}>回到岗位库</Button>}
        />
      </div>
    );
  }

  const addToTracker = () => {
    if (trackerEntry) {
      navigate('/tracker');
      return;
    }
    addTracker({ jobId: job.id, title: job.title, company: job.company, status: 'saved', notes: '从岗位库加入，等待投递。' });
    hapticSuccess();
    showToast('已加入投递进度');
  };

  return (
    <div className="page">
      <TopBar
        title="岗位详情"
        subtitle={fieldLabel(job.field)}
        right={(
          <button
            type="button"
            className={'save-btn' + (saved ? ' save-btn--active' : '')}
            aria-label={saved ? '取消收藏' : '收藏岗位'}
            onClick={() => { toggleSavedJob(job.id); showToast(saved ? '已取消收藏' : '已收藏'); }}
          >
            {saved ? <BookmarkCheck size={21} /> : <Bookmark size={21} />}
          </button>
        )}
      />

      <Card className="job-detail-hero">
        <div className="between">
          <div className="row gap-6">
            <span className="dot" style={{ color: fieldColor(job.field), background: fieldColor(job.field) }} />
            <span className="eyebrow" style={{ color: 'rgba(245,240,230,0.6)' }}>{fieldLabel(job.field)} · {job.type === 'internship' ? '实习' : '全职'}</span>
          </div>
          {match ? <ScoreRing score={match.analysis.score} size={76} stroke={6} label="MATCH" dark /> : null}
        </div>
        <div className="job-title mt-12" style={{ fontSize: 28 }}>{job.title}</div>
        <div className="job-company" style={{ color: 'rgba(245,240,230,0.65)' }}>{job.company}</div>
        <div className="job-meta mt-10" style={{ color: 'rgba(245,240,230,0.65)' }}>
          <span><MapPin size={12} />{job.location}</span>
          <span><Wallet size={12} />{job.salary}</span>
        </div>
        <div className="job-tags mt-12">
          {job.tags.map((tag) => (
            <span className="tag" key={tag} style={{ background: 'rgba(245,240,230,0.1)', color: 'rgba(245,240,230,0.75)' }}>{tag}</span>
          ))}
        </div>
        <div className="row gap-8 mt-16">
          <Button variant="paper" size="sm" icon={<Target size={15} />} onClick={() => navigate('/analyze?job=' + job.id)}>
            分析匹配
          </Button>
          <Button variant="ghost" size="sm" icon={<ClipboardList size={15} />} onClick={addToTracker} style={{ color: 'var(--paper)', borderColor: 'rgba(245,240,230,0.2)' }}>
            {trackerEntry ? '查看进度' : '加入进度'}
          </Button>
        </div>
      </Card>

      {match ? (
        <section className="result-section">
          <div className="between mb-10">
            <h3 className="result-section-title">快速匹配</h3>
            <span className={'result-band' + (match.analysis.band.tone === 'success' ? ' result-band--success' : match.analysis.band.tone === 'warning' ? ' result-band--warning' : match.analysis.band.tone === 'danger' ? ' result-band--danger' : '')}>
              {match.analysis.band.label}
            </span>
          </div>
          <Card className="card--flat">
            <p className="small ink-2">{match.analysis.summary}</p>
            <div className="stack gap-10 mt-12">
              {(match.analysis.dimensions.skills != null) ? (
                <>
                  <DimensionBar label={DIMENSION_LABELS.skills} score={match.analysis.dimensions.skills} />
                  <DimensionBar label={DIMENSION_LABELS.experience} score={match.analysis.dimensions.experience} tone="amber" />
                  <DimensionBar label={DIMENSION_LABELS.keywords} score={match.analysis.dimensions.keywords} tone="sage" />
                </>
              ) : null}
            </div>
            <div className="row wrap gap-6 mt-12">
              {match.analysis.matchedSkills.slice(0, 5).map((skill) => <Chip key={skill} tone="success"><Check size={10} />{skill}</Chip>)}
              {match.analysis.missingSkills.slice(0, 3).map((skill) => <Chip key={skill} tone="warning">{skill}</Chip>)}
            </div>
            <div className="mt-12">
              <Button size="sm" variant="outline" onClick={() => navigate('/analyze?job=' + job.id)}>看完整分析</Button>
            </div>
          </Card>
        </section>
      ) : (
        <Card className="card--sage mt-16">
          <div className="row gap-10">
            <Sparkles size={18} />
            <div>
              <div className="strong small">导入简历后可以看匹配度</div>
              <div className="tiny muted mt-4">这份简历会留在本机，随时可清空。</div>
            </div>
          </div>
          <div className="mt-10">
            <Button size="sm" variant="paper" onClick={() => navigate('/resume?onboarding=1')}>导入简历</Button>
          </div>
        </Card>
      )}

      {trackerEntry ? (
        <Card className="card--tight mt-16">
          <div className="between">
            <div className="row gap-8"><span className="small strong">当前进度</span><StatusPill status={trackerEntry.status} /></div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate('/tracker')}>去更新</button>
          </div>
        </Card>
      ) : null}

      <section className="job-detail-section">
        <h3 className="result-section-title">岗位描述</h3>
        <p className="job-detail-text mt-10">{job.description}</p>
      </section>

      <section className="job-detail-section">
        <h3 className="result-section-title">任职要求</h3>
        <p className="job-detail-text mt-10">{job.requirements}</p>
      </section>

      <div className="result-actions">
        <Button block icon={<Target size={17} />} onClick={() => navigate('/analyze?job=' + job.id)}>用我的简历分析这个岗位</Button>
        <Button variant="outline" block icon={<ArrowRight size={15} />} onClick={() => navigate('/jobs')}>继续浏览岗位</Button>
      </div>

      <div className="footer-note">
        <TriangleAlert size={11} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
        示例岗位仅用于课程演示。
      </div>
    </div>
  );
}
