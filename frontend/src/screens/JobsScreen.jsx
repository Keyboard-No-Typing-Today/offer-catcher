import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BriefcaseBusiness, Search, SlidersHorizontal, Bookmark, X } from 'lucide-react';
import Card from '../components/Card.jsx';
import Chip from '../components/Chip.jsx';
import JobCard from '../components/JobCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useAppStore from '../store/useAppStore.js';
import { JOBS, FIELDS, filterJobs, fieldLabel } from '../data/jobs.js';
import { jobMatch } from '../lib/matchEngine.js';

const TYPES = [
  { id: 'all', label: '全部类型' },
  { id: 'internship', label: '实习' },
  { id: 'full-time', label: '全职' },
];

export default function JobsScreen() {
  const navigate = useNavigate();
  const profile = useAppStore((state) => state.profile);
  const savedJobIds = useAppStore((state) => state.savedJobIds);
  const toggleSavedJob = useAppStore((state) => state.toggleSavedJob);

  const [search, setSearch] = useState('');
  const [field, setField] = useState('all');
  const [type, setType] = useState('all');
  const [onlySaved, setOnlySaved] = useState(false);

  const filtered = useMemo(() => {
    const base = filterJobs(JOBS, { field, keyword: search, type });
    return onlySaved ? base.filter((job) => savedJobIds.includes(job.id)) : base;
  }, [field, search, type, onlySaved, savedJobIds]);

  const scores = useMemo(() => {
    if (!profile) return {};
    const map = {};
    for (const job of filtered) {
      map[job.id] = jobMatch(profile, job).analysis.score;
    }
    return map;
  }, [filtered, profile]);

  return (
    <div className="page page--tab">
      <div className="jobs-head">
        <div className="between">
          <div>
            <div className="home-date">JOB BOARD · {JOBS.length} ROLES</div>
            <h1 className="jobs-title mt-6">岗位库</h1>
            <p className="jobs-sub">
              {profile ? '按你的简历实时估算匹配度。' : '导入简历后，这里会按匹配度排序。'}
            </p>
          </div>
          <div className="icon-btn" aria-hidden="true"><BriefcaseBusiness size={19} /></div>
        </div>
      </div>

      <div className="jobs-toolbar">
        <div className="search-box">
          <Search size={15} className="muted" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索岗位、公司、技能"
            aria-label="搜索岗位"
          />
          {search ? (
            <button type="button" className="save-btn" aria-label="清空搜索" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          ) : null}
        </div>

        <div className="chip-row hide-scrollbar mt-8">
          <Chip as="button" active={field === 'all'} onClick={() => setField('all')}>全部领域</Chip>
          {FIELDS.map((item) => (
            <Chip as="button" key={item.id} active={field === item.id} onClick={() => setField(item.id)}>
              {item.short}
            </Chip>
          ))}
        </div>
        <div className="chip-row hide-scrollbar mt-6">
          {TYPES.map((item) => (
            <Chip as="button" key={item.id} tone={type === item.id ? 'accent' : 'soft'} active={false} onClick={() => setType(item.id)}>
              {item.label}
            </Chip>
          ))}
          <Chip as="button" tone={onlySaved ? 'accent' : 'soft'} onClick={() => setOnlySaved((value) => !value)}>
            <Bookmark size={11} /> 只看收藏
          </Chip>
        </div>
      </div>

      <div className="between mb-8">
        <span className="tiny muted">{filtered.length} 个岗位</span>
        {profile ? <span className="tiny muted">按匹配度实时估算</span> : null}
      </div>

      {filtered.length ? (
        <div className="job-list">
          {filtered.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              score={scores[job.id]}
              saved={savedJobIds.includes(job.id)}
              onOpen={() => navigate('/jobs/' + job.id)}
              onSave={() => toggleSavedJob(job.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={onlySaved ? <Bookmark size={24} /> : <SlidersHorizontal size={24} />}
          title={onlySaved ? '还没有收藏岗位' : '没有找到匹配的岗位'}
          description={onlySaved ? '看到感兴趣的岗位时，点右上角的书签就能收藏。' : '换一个关键词或领域试试，岗位库里的示例数据覆盖 10 个方向。'}
          action={onlySaved ? <Chip as="button" tone="accent" onClick={() => setOnlySaved(false)}>查看全部岗位</Chip> : null}
        />
      )}

      <div className="footer-note">
        岗位为课程演示用示例数据，不对应真实招聘。
      </div>
    </div>
  );
}
