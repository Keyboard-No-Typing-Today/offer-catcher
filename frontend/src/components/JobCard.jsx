import { Bookmark, BookmarkCheck, MapPin, Wallet, ArrowUpRight } from 'lucide-react';
import { fieldLabel, fieldColor } from '../data/jobs.js';
import { hapticTap } from '../hooks/useHaptics.js';

export default function JobCard({ job, score = null, saved = false, onOpen, onSave, compact = false }) {
  const open = () => {
    hapticTap('light');
    if (onOpen) onOpen(job);
  };
  const save = (event) => {
    event.stopPropagation();
    hapticTap('medium');
    if (onSave) onSave(job);
  };
  return (
    <article
      className={'job-card-wrap' + (saved ? ' job-card-wrap--saved' : '') + (compact ? ' job-card-wrap--compact' : '')}
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      }}
    >
      <div className="job-top">
        <div style={{ minWidth: 0 }}>
          <div className="row gap-6">
            <span className="dot" style={{ color: fieldColor(job.field), background: fieldColor(job.field) }} />
            <span className="eyebrow">{fieldLabel(job.field)}</span>
          </div>
          <div className="job-title mt-4">{job.title}</div>
          <div className="job-company">{job.company}</div>
        </div>
        <button
          type="button"
          className={'save-btn' + (saved ? ' save-btn--active' : '')}
          aria-label={saved ? '取消收藏' : '收藏岗位'}
          onClick={save}
        >
          {saved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
        </button>
      </div>

      <div className="job-meta">
        <span><MapPin size={12} />{job.location}</span>
        {!compact ? <span><Wallet size={12} />{job.salary}</span> : null}
        <span>{job.type === 'internship' ? '实习' : '全职'}</span>
      </div>

      {job.tags?.length ? (
        <div className="job-tags">
          {job.tags.slice(0, compact ? 3 : 5).map((tag) => (
            <span className="tag" key={tag}>{tag}</span>
          ))}
        </div>
      ) : null}

      <div className="between">
        {score !== null && score !== undefined ? (
          <span className="match-pill"><small>MATCH</small>&nbsp;{Math.round(score)}<small>%</small></span>
        ) : (
          <span className="tiny muted">查看岗位详情</span>
        )}
        <ArrowUpRight size={16} className="muted" />
      </div>
    </article>
  );
}
