import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Card, Dialog, Divider, NoticeBar, Popup, ProgressBar, Space, Tag, TextArea, Toast,
} from 'antd-mobile';
import {
  ArrowRight, BriefcaseBusiness, CheckCircle2, ChevronRight, FileText, RefreshCw,
  Sparkles, Target, Upload, WandSparkles,
} from 'lucide-react';
import useAppStore from '../store/useAppStore.js';
import { useRoleMatches } from '../hooks/useRoleMatches.js';
import { DIMENSION_LABELS } from '../lib/matchEngine.js';
import { parseResume } from '../lib/resumeProfile.js';
import { extractTextFromFile } from '../lib/fileParser.js';
import { ROLE_PROFILES, ROLE_SOURCE } from '../data/roles.js';
import { hapticTap } from '../hooks/useHaptics.js';

const DIMENSION_ORDER = ['skills', 'experience', 'education', 'keywords', 'quality'];

function scoreColor(score) {
  if (score >= 80) return '#5d7359';
  if (score >= 65) return '#cf4e2b';
  if (score >= 50) return '#c88a2a';
  return '#a9442d';
}

function initials(profile) {
  return (profile?.name || '同学').slice(0, 1);
}

export default function MatchModule() {
  const navigate = useNavigate();
  const profile = useAppStore((state) => state.profile);
  const saveProfile = useAppStore((state) => state.saveProfile);
  const { matches, loading, error } = useRoleMatches(profile);
  const [selected, setSelected] = useState(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const totalSamples = useMemo(
    () => ROLE_PROFILES.reduce((sum, role) => sum + (role.sampleCount || 0), 0),
    [],
  );
  const displaySkills = useMemo(() => {
    const roleSkills = new Set(ROLE_PROFILES.flatMap((role) => role.topSkills || []));
    return [...(profile?.skills || [])]
      .sort((a, b) => Number(roleSkills.has(b.name)) - Number(roleSkills.has(a.name)))
      .slice(0, 8);
  }, [profile]);

  async function applyResume(text, fileName = '粘贴的简历', fileType = 'text/plain') {
    const parsed = parseResume(text, { fileName, fileType });
    if (!parsed.rawText || parsed.rawText.length < 30) {
      Dialog.alert({ content: '没有读到足够的简历文字，请换一个可复制的 PDF/DOCX 或直接粘贴文本。' });
      return;
    }
    saveProfile({ ...parsed, updatedAt: Date.now() });
    setPasteOpen(false);
    setPasteText('');
    Toast.show({ icon: 'success', content: '简历已解析' });
    hapticTap();
  }

  async function onFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImporting(true);
    try {
      const extracted = await extractTextFromFile(file);
      await applyResume(extracted.text, extracted.fileName, extracted.fileType);
    } catch (err) {
      Dialog.alert({ content: err?.message || '文件解析失败，请换一个文件。' });
    } finally {
      setImporting(false);
    }
  }

  if (!profile) {
    return (
      <div className="m-page match-onboard">
        <div className="m-brand">
          <div className="m-brand-mark"><span>捕</span></div>
          <div>
            <div className="m-brand-name">Offer 捕手</div>
            <div className="m-brand-sub">把简历变成可解释的岗位匹配</div>
          </div>
        </div>

        <div className="m-hero">
          <div className="m-eyebrow">RESUME → ROLE FIT</div>
          <h1 className="m-hero-title">先懂你的简历，<br />再谈投哪里。</h1>
          <p className="m-hero-copy">
            基于你提供的 {totalSamples} 份方向简历，聚合出 {ROLE_PROFILES.length} 个岗位画像。
            导入自己的简历，看看你最接近哪个方向、还差什么。
          </p>
        </div>

        <Card className="m-card m-import-card">
          <div className="m-import-icon"><Upload size={22} /></div>
          <div className="m-import-title">导入简历，开始匹配</div>
          <div className="m-muted m-import-desc">支持 PDF / DOCX / TXT；解析在本机完成，不上传原文件。</div>
          <Button
            block
            color="primary"
            size="large"
            loading={importing}
            onClick={() => fileRef.current?.click()}
          >
            选择简历文件
          </Button>
          <Button
            block
            fill="outline"
            className="m-secondary-btn"
            onClick={() => setPasteOpen(true)}
          >
            没有文件？直接粘贴文本
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.txt,.md,.markdown"
            onChange={onFile}
            hidden
          />
        </Card>

        <NoticeBar
          className="m-notice"
          wrap
          content="岗位画像是脱敏聚合数据，不代表实时招聘岗位；个人简历不会进入岗位画像。"
          icon={<Sparkles size={14} />}
        />

        <div className="m-onboard-steps">
          <div><span>01</span><b>导入</b><small>本地解析简历</small></div>
          <div><span>02</span><b>匹配</b><small>本地 + Qwen 语义</small></div>
          <div><span>03</span><b>行动</b><small>看差距和改写建议</small></div>
        </div>

        <PastePopup
          visible={pasteOpen}
          value={pasteText}
          onChange={setPasteText}
          onClose={() => setPasteOpen(false)}
          onSubmit={() => applyResume(pasteText, '粘贴的简历', 'text/plain')}
        />
      </div>
    );
  }

  const best = matches[0] || null;

  return (
    <div className="m-page">
      <header className="m-top">
        <div>
          <div className="m-eyebrow">MATCH STUDIO</div>
          <h1 className="m-page-title">匹配</h1>
        </div>
        <Button
          size="small"
          fill="none"
          className="m-ghost-btn"
          onClick={() => fileRef.current?.click()}
        >
          <RefreshCw size={14} /> 更新简历
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.txt,.md,.markdown"
          onChange={onFile}
          hidden
        />
      </header>

      <Card className="m-card m-profile-card">
        <div className="m-avatar">{initials(profile)}</div>
        <div className="m-profile-main">
          <div className="m-profile-name">{profile.name || '同学'}</div>
          <div className="m-muted">
            {profile.educationLabel || '未填写学历'} · {profile.yearsExperience > 0 ? `约 ${profile.yearsExperience} 年经历` : '应届 / 实习经历'}
            {' · '}{profile.skills?.length || 0} 个技能
          </div>
          <ProgressBar
            percent={profile.completeness || 0}
            className="m-completeness"
            style={{ '--fill-color': '#cf4e2b' }}
          />
          <div className="m-muted m-small">简历完整度 {profile.completeness || 0}%</div>
        </div>
      </Card>

      <div className="m-tags">
        {displaySkills.map((skill) => (
          <Tag key={skill.name} fill="outline" className="m-tag">{skill.name}</Tag>
        ))}
      </div>

      {loading ? (
        <Card className="m-card m-loading-card">
          <Sparkles size={18} className="m-spin" />
          <span>正在用 Qwen embedding 做语义排序…</span>
        </Card>
      ) : null}
      {error ? <NoticeBar className="m-notice m-notice-warn" content={error} icon={<Sparkles size={14} />} /> : null}

      {best ? (
        <Card className="m-card m-best-card" onClick={() => setSelected(best)}>
          <div className="m-best-top">
            <div>
              <div className="m-eyebrow m-eyebrow-light">BEST FIT</div>
              <div className="m-best-title">{best.role.label}</div>
              <div className="m-best-desc">{best.band.label} · {best.role.sampleCount} 份样本共同点</div>
            </div>
            <div className="m-big-score" style={{ color: scoreColor(best.score) }}>
              {best.score}<small>/100</small>
            </div>
          </div>
          <div className="m-best-summary">{best.fitSummary}</div>
          <div className="m-best-bottom">
            <span className="m-semantic-pill">
              <Sparkles size={12} /> 语义 #{best.semanticRank || '—'}
            </span>
            <span className="m-more">查看匹配详情 <ChevronRight size={14} /></span>
          </div>
        </Card>
      ) : null}

      <div className="m-section-head">
        <div>
          <div className="m-eyebrow">RECOMMENDED DIRECTIONS</div>
          <h2 className="m-section-title">推荐方向</h2>
        </div>
        <span className="m-muted m-small">共 {matches.length} 个</span>
      </div>

      <div className="m-role-list">
        {matches.map((item, index) => (
          <div key={item.role.id} className="m-role-row" onClick={() => setSelected(item)}>
            <div className="m-role-rank">{String(index + 1).padStart(2, '0')}</div>
            <div className="m-role-main">
              <div className="m-role-name">{item.role.label}</div>
              <div className="m-role-sub">
                {(item.local.matchedSkills || []).slice(0, 3).join(' · ') || '补充技能后更准确'}
              </div>
            </div>
            <div className="m-role-score" style={{ color: scoreColor(item.score) }}>{item.score}</div>
            <ChevronRight size={15} className="m-muted" />
          </div>
        ))}
      </div>

      <div className="m-source-note">
        <CheckCircle2 size={13} />
        <span>{ROLE_SOURCE} 语义排序使用 Aliyun Qwen embedding。</span>
      </div>

      <Popup
        visible={Boolean(selected)}
        onMaskClick={() => setSelected(null)}
        bodyStyle={{ maxHeight: '88dvh', overflowY: 'auto', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
        destroyOnClose
      >
        {selected ? (
          <RoleDetail
            item={selected}
            onClose={() => setSelected(null)}
            onAsk={() => {
              setSelected(null);
              navigate('/assistant', { state: { prompt: '请帮我根据「' + selected.role.label + '」方向修改简历，并告诉我最该补的 3 个点。' } });
            }}
          />
        ) : null}
      </Popup>
    </div>
  );
}

function RoleDetail({ item, onClose, onAsk }) {
  const result = item.local;
  return (
    <div className="m-sheet">
      <div className="m-sheet-handle" />
      <div className="m-sheet-head">
        <div>
          <div className="m-eyebrow">DIRECTION FIT</div>
          <h2>{item.role.label}</h2>
          <div className="m-muted">{item.band.label} · 综合 {item.score} 分</div>
        </div>
        <div className="m-sheet-score" style={{ color: scoreColor(item.score) }}>{item.score}</div>
      </div>

      <p className="m-sheet-summary">{item.role.summary}</p>

      <div className="m-dimensions">
        {DIMENSION_ORDER.map((key) => (
          <div key={key} className="m-dimension">
            <div className="m-dimension-label">
              <span>{DIMENSION_LABELS[key]}</span><b>{result.dimensions[key]}</b>
            </div>
            <ProgressBar percent={result.dimensions[key]} style={{ '--fill-color': scoreColor(result.dimensions[key]) }} />
          </div>
        ))}
      </div>

      <Divider className="m-divider">共同点</Divider>
      <div className="m-pills">
        {(item.role.topSkills || []).slice(0, 10).map((skill) => (
          <Tag key={skill} color="primary" fill="outline" className="m-tag">{skill}</Tag>
        ))}
      </div>
      <div className="m-points">
        {(item.role.keyPoints || []).slice(0, 5).map((point) => (
          <div key={point} className="m-point">{point}</div>
        ))}
      </div>

      <Divider className="m-divider">你的命中与差距</Divider>
      <div className="m-two-cols">
        <div>
          <div className="m-mini-title"><CheckCircle2 size={13} /> 已命中</div>
          <div className="m-pills">
            {(result.matchedSkills || []).slice(0, 8).map((skill) => (
              <Tag key={skill} color="success" fill="outline" className="m-tag">{skill}</Tag>
            ))}
            {!result.matchedSkills?.length ? <span className="m-muted m-small">暂无</span> : null}
          </div>
        </div>
        <div>
          <div className="m-mini-title"><Target size={13} /> 待补</div>
          <div className="m-pills">
            {(result.missingSkills || []).slice(0, 8).map((skill) => (
              <Tag key={skill} color="warning" fill="outline" className="m-tag">{skill}</Tag>
            ))}
            {!result.missingSkills?.length ? <span className="m-muted m-small">暂无</span> : null}
          </div>
        </div>
      </div>

      <Divider className="m-divider">岗位画像要求</Divider>
      <ul className="m-list">
        {(item.role.requirements || []).map((requirement) => <li key={requirement}>{requirement}</li>)}
      </ul>

      <Divider className="m-divider">下一步改写</Divider>
      <div className="m-suggestions">
        {(result.suggestions || []).slice(0, 3).map((suggestion) => (
          <div key={suggestion.title} className="m-suggestion">
            <WandSparkles size={14} />
            <div><b>{suggestion.title}</b><p>{suggestion.detail}</p></div>
          </div>
        ))}
      </div>

      <div className="m-sheet-actions">
        <Button block color="primary" size="large" onClick={onAsk}>去问助手怎么改</Button>
        <Button block fill="outline" onClick={onClose}>收起</Button>
      </div>
      <div className="m-semantic-foot">
        <Sparkles size={12} /> Qwen embedding 语义排序：第 {item.semanticRank || '—'} 位
      </div>
    </div>
  );
}

function PastePopup({ visible, value, onChange, onClose, onSubmit }) {
  return (
    <Popup
      visible={visible}
      onMaskClick={onClose}
      bodyStyle={{ maxHeight: '86dvh', overflowY: 'auto', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
      destroyOnClose
    >
      <div className="m-sheet">
        <div className="m-sheet-handle" />
        <div className="m-sheet-head">
          <div>
            <div className="m-eyebrow">PASTE RESUME</div>
            <h2>粘贴简历文本</h2>
            <div className="m-muted">解析在本机完成，不上传原文件。</div>
          </div>
        </div>
        <TextArea
          value={value}
          onChange={onChange}
          placeholder="把简历内容粘贴到这里…"
          autoSize={{ minRows: 10, maxRows: 16 }}
          showCount
          maxLength={20000}
          className="m-textarea"
        />
        <div className="m-sheet-actions">
          <Button block color="primary" size="large" disabled={value.trim().length < 30} onClick={onSubmit}>
            解析并匹配
          </Button>
          <Button block fill="outline" onClick={onClose}>取消</Button>
        </div>
      </div>
    </Popup>
  );
}
