import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, BriefcaseBusiness, ClipboardPaste, FileText, ListChecks,
  Sparkles, Target, TrendingUp, ChevronRight,
} from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import ScoreRing from '../components/ScoreRing.jsx';
import Avatar from '../components/Avatar.jsx';
import JobCard from '../components/JobCard.jsx';
import useAppStore from '../store/useAppStore.js';
import { JOBS } from '../data/jobs.js';
import { rankJobs } from '../lib/matchEngine.js';
import { formatDate, timeAgo } from '../lib/format.js';
import { DEMO_TIP } from '../lib/sampleData.js';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const profile = useAppStore((state) => state.profile);
  const analyses = useAppStore((state) => state.analyses);
  const tracker = useAppStore((state) => state.tracker);
  const savedJobIds = useAppStore((state) => state.savedJobIds);
  const toggleSavedJob = useAppStore((state) => state.toggleSavedJob);

  const latest = analyses[0] || null;
  const applied = tracker.filter((item) => item.status !== 'saved').length;
  const interviewing = tracker.filter((item) => item.status === 'interview').length;
  const ranked = useMemo(() => (profile ? rankJobs(profile, JOBS, 3) : []), [profile]);

  return (
    <div className="page page--tab">
      <div className="home-greeting">
        <div className="between">
          <span className="home-date">{new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}</span>
          {profile ? <Avatar name={profile.name} /> : null}
        </div>
        <h1 className="home-title">
          {greeting()}{profile ? '，' + profile.name : ''}。<br />
          今天投得<em>更准</em>一点。
        </h1>
        <p className="home-sub">
          {profile
            ? '简历已在本机。先看一个岗位，再决定把时间花在哪里。'
            : '导入简历后，我会按岗位要求帮你排优先级。'}
        </p>
      </div>

      <Card className="card--ink home-hero">
        <div className="hero-grid">
          <div>
            <div className="eyebrow">NEXT MOVE</div>
            <div className="home-hero-title mt-8">
              {latest ? '把差距，变成下一次的改动。' : '先分析一个你最想去的岗位。'}
            </div>
            <div className="home-hero-text">
              {latest
                ? latest.jobTitle + ' · ' + latest.company
                : '粘贴 JD，30 秒看到匹配度和行动清单。'}
            </div>
            <div className="mt-16">
              <Button variant="paper" size="sm" icon={<ClipboardPaste size={15} />} onClick={() => navigate('/analyze')}>
                {latest ? '分析新 JD' : '开始分析'}
              </Button>
            </div>
          </div>
          <div className="hero-ring">
            <ScoreRing
              score={latest ? latest.score : 0}
              size={98}
              stroke={7}
              label={latest ? 'LAST MATCH' : 'READY'}
              dark
            />
          </div>
        </div>
      </Card>

      <div className="stat-grid mt-12">
        <div className="stat"><div className="stat-value">{analyses.length}</div><div className="stat-label">份分析</div></div>
        <div className="stat"><div className="stat-value">{applied}</div><div className="stat-label">已投递</div></div>
        <div className="stat"><div className="stat-value">{interviewing}</div><div className="stat-label">面试中</div></div>
      </div>

      <div className="quick-grid mt-16">
        <button type="button" className="quick" onClick={() => navigate('/analyze')}>
          <span className="quick-icon"><Target size={17} /></span>
          <span className="quick-title">分析 JD</span>
          <span className="quick-text">粘贴岗位描述，看匹配度和差距</span>
        </button>
        <button type="button" className="quick" onClick={() => navigate('/jobs')}>
          <span className="quick-icon"><BriefcaseBusiness size={17} /></span>
          <span className="quick-title">浏览岗位</span>
          <span className="quick-text">按领域筛选，收藏值得投的岗位</span>
        </button>
        <button type="button" className="quick" onClick={() => navigate('/resume')}>
          <span className="quick-icon"><FileText size={17} /></span>
          <span className="quick-title">更新简历</span>
          <span className="quick-text">重新导入或手动修正简历内容</span>
        </button>
        <button type="button" className="quick" onClick={() => navigate('/tracker')}>
          <span className="quick-icon"><ListChecks size={17} /></span>
          <span className="quick-title">投递进度</span>
          <span className="quick-text">{tracker.length} 条记录，更新状态和备注</span>
        </button>
      </div>

      {analyses.length > 0 ? (
        <section className="result-section">
          <div className="between mb-8">
            <div className="row gap-8"><span className="eyebrow">RECENT</span><h3 className="result-section-title">最近分析</h3></div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate('/tracker')}>全部</button>
          </div>
          <div>
            {analyses.slice(0, 3).map((item) => (
              <div
                className="recent-row"
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate('/result/' + item.id)}
                onKeyDown={(event) => { if (event.key === 'Enter') navigate('/result/' + item.id); }}
              >
                <ScoreRing score={item.score} size={44} stroke={4} label="" />
                <div className="recent-main">
                  <div className="recent-title">{item.jobTitle}</div>
                  <div className="recent-sub">{item.company} · {timeAgo(item.createdAt)} · {item.mode === 'ai' ? 'AI 增强' : '本地分析'}</div>
                </div>
                <ChevronRight size={16} className="muted" />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {profile && ranked.length > 0 ? (
        <section className="result-section">
          <div className="between mb-8">
            <div className="row gap-8"><span className="eyebrow">FOR YOU</span><h3 className="result-section-title">按你的简历排序</h3></div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate('/jobs')}>更多</button>
          </div>
          <div className="job-list">
            {ranked.map((item) => (
              <JobCard
                key={item.job.id}
                job={item.job}
                score={item.score}
                saved={savedJobIds.includes(item.job.id)}
                onOpen={() => navigate('/jobs/' + item.job.id)}
                onSave={() => toggleSavedJob(item.job.id)}
                compact
              />
            ))}
          </div>
        </section>
      ) : null}

      {!profile ? (
        <section className="result-section">
          <Card className="card--sage">
            <div className="row gap-10">
              <Sparkles size={18} />
              <div>
                <div className="strong">还没有简历？</div>
                <div className="small muted mt-4">导入 PDF/DOCX，或先用示例简历体验完整流程。</div>
              </div>
            </div>
            <div className="row gap-8 mt-12">
              <Button size="sm" variant="paper" onClick={() => navigate('/resume')}>导入简历</Button>
              <Button size="sm" variant="ghost" onClick={() => { useAppStore.getState().loadSample(); }}>加载示例</Button>
            </div>
          </Card>
        </section>
      ) : null}

      <section className="result-section">
        <Card className="card--flat tip-card">
          <div className="eyebrow">FIELD NOTE</div>
          <div className="small ink-2 mt-8" style={{ lineHeight: 1.7 }}>{DEMO_TIP}</div>
        </Card>
      </section>

      <div className="footer-note">
        <TrendingUp size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
        {formatDate(Date.now(), 'long')} · Offer 捕手
      </div>
    </div>
  );
}
