import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BriefcaseBusiness, CalendarDays, ClipboardList, Plus, Pencil, Trash2,
  MapPin, ArrowRight,
} from 'lucide-react';
import TopBar from '../components/TopBar.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Chip from '../components/Chip.jsx';
import Field from '../components/Field.jsx';
import Sheet from '../components/Sheet.jsx';
import StatusPill from '../components/StatusPill.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useAppStore from '../store/useAppStore.js';
import { useToastStore } from '../store/useToastStore.js';
import { TRACKER_STATUSES, TRACKER_STATUS_MAP } from '../lib/constants.js';
import { formatDate } from '../lib/format.js';
import { hapticSuccess } from '../hooks/useHaptics.js';

const EMPTY_FORM = { title: '', company: '', status: 'saved', notes: '' };

export default function TrackerScreen() {
  const navigate = useNavigate();
  const tracker = useAppStore((state) => state.tracker);
  const addTracker = useAppStore((state) => state.addTracker);
  const updateTracker = useAppStore((state) => state.updateTracker);
  const removeTracker = useAppStore((state) => state.removeTracker);
  const showToast = useToastStore((state) => state.showToast);

  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const counts = useMemo(() => {
    const map = { all: tracker.length };
    for (const status of TRACKER_STATUSES) map[status.id] = 0;
    for (const item of tracker) if (map[item.status] !== undefined) map[item.status] += 1;
    return map;
  }, [tracker]);

  const visible = filter === 'all' ? tracker : tracker.filter((item) => item.status === filter);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({ title: item.title, company: item.company, status: item.status, notes: item.notes || '' });
    setOpen(true);
  };

  const save = () => {
    if (!form.title.trim()) {
      showToast('先写一个岗位名称');
      return;
    }
    const payload = {
      title: form.title.trim(),
      company: form.company.trim(),
      status: form.status,
      notes: form.notes.trim(),
    };
    if (editing) {
      updateTracker(editing.id, {
        ...payload,
        appliedAt: form.status === 'applied' && !editing.appliedAt ? Date.now() : editing.appliedAt,
      });
      showToast('进度已更新');
    } else {
      addTracker({ ...payload, appliedAt: form.status === 'applied' ? Date.now() : null });
      showToast('已加入投递进度');
    }
    hapticSuccess();
    setOpen(false);
  };

  const remove = () => {
    if (!editing) return;
    removeTracker(editing.id);
    setOpen(false);
    showToast('已删除这条记录');
  };

  return (
    <div className="page">
      <TopBar
        title="投递进度"
        subtitle="把每一次投递留在视野里"
        right={<Button size="sm" icon={<Plus size={14} />} onClick={openNew}>新增</Button>}
      />

      <div className="tracker-summary">
        <div className="tracker-summary-item"><b>{counts.all}</b><span>全部</span></div>
        <div className="tracker-summary-item"><b>{counts.applied}</b><span>已投</span></div>
        <div className="tracker-summary-item"><b>{counts.interview}</b><span>面试</span></div>
        <div className="tracker-summary-item"><b>{counts.offer}</b><span>Offer</span></div>
      </div>

      <div className="chip-row hide-scrollbar mt-16 mb-10">
        <Chip as="button" active={filter === 'all'} onClick={() => setFilter('all')}>全部</Chip>
        {TRACKER_STATUSES.map((status) => (
          <Chip as="button" key={status.id} active={filter === status.id} onClick={() => setFilter(status.id)}>
            {status.label}
          </Chip>
        ))}
      </div>

      {visible.length ? (
        <div>
          {visible.map((item) => (
            <article className="tracker-card" key={item.id}>
              <div className="tracker-card-top">
                <div>
                  <div className="tracker-title">{item.title}</div>
                  <div className="tracker-company">{item.company || '未填写公司'}</div>
                </div>
                <StatusPill status={item.status} />
              </div>
              {item.notes ? <div className="tracker-notes">{item.notes}</div> : null}
              <div className="between mt-10">
                <span className="tiny muted">
                  <CalendarDays size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 3 }} />
                  {formatDate(item.updatedAt || item.createdAt)}
                </span>
                <button type="button" className="icon-btn icon-btn--ghost" aria-label="编辑" onClick={() => openEdit(item)}>
                  <Pencil size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<ClipboardList size={24} />}
          title={filter === 'all' ? '还没有投递记录' : '这个状态还没有记录'}
          description="把想投的岗位加进来，用一个地方管理进度和跟进备注。"
          action={<Button onClick={openNew} icon={<Plus size={15} />}>新增一条记录</Button>}
        />
      )}

      <Card className="card--sage mt-20">
        <div className="row gap-10">
          <BriefcaseBusiness size={18} />
          <div>
            <div className="strong small">还没想好投什么？</div>
            <div className="tiny muted mt-4">去岗位库按方向筛一筛，再用简历做一次匹配。</div>
          </div>
        </div>
        <div className="mt-10">
          <Button size="sm" variant="paper" icon={<ArrowRight size={14} />} onClick={() => navigate('/jobs')}>去岗位库</Button>
        </div>
      </Card>

      <Sheet open={open} onClose={() => setOpen(false)} title={editing ? '编辑投递' : '新增投递'}>
        <div className="stack gap-12">
          <Field label="岗位名称">
            <input className="input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="例如：前端开发实习生" />
          </Field>
          <Field label="公司">
            <input className="input" value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} placeholder="例如：微光科技" />
          </Field>
          <Field label="当前状态">
            <div className="chip-row hide-scrollbar">
              {TRACKER_STATUSES.map((status) => (
                <Chip as="button" key={status.id} active={form.status === status.id} onClick={() => setForm({ ...form, status: status.id })}>
                  {status.label}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="备注" hint="记下 HR 的反馈、面试时间或下一步要跟进的事。">
            <textarea className="textarea" style={{ minHeight: 110 }} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="例如：周三投递，一周内反馈；准备一份作品集。" />
          </Field>
          <div className="row gap-8 mt-4">
            {editing ? <Button variant="danger" icon={<Trash2 size={15} />} onClick={remove}>删除</Button> : null}
            <Button block onClick={save}>{editing ? '保存修改' : '加入进度'}</Button>
          </div>
        </div>
      </Sheet>

      <div className="footer-note">
        <MapPin size={11} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
        记录只保存在本机；换设备前可以在「我的」里导出。
      </div>
    </div>
  );
}
