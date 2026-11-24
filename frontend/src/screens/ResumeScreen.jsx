import { useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText, Upload, Sparkles, ShieldCheck, CheckCircle2, RefreshCw, Trash2, PenLine,
} from 'lucide-react';
import TopBar from '../components/TopBar.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Chip from '../components/Chip.jsx';
import Field from '../components/Field.jsx';
import useAppStore from '../store/useAppStore.js';
import { useToastStore } from '../store/useToastStore.js';
import { extractTextFromFile, isAcceptedFile, ACCEPTED_EXTENSIONS } from '../lib/fileParser.js';
import { parseResume } from '../lib/resumeProfile.js';
import { SAMPLE_RESUME } from '../lib/sampleData.js';
import { categoryLabel, groupSkills } from '../lib/skills.js';
import { hapticSuccess } from '../hooks/useHaptics.js';

export default function ResumeScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const onboarding = params.get('onboarding') === '1';
  const profile = useAppStore((state) => state.profile);
  const saveProfile = useAppStore((state) => state.saveProfile);
  const showToast = useToastStore((state) => state.showToast);

  const [text, setText] = useState(profile?.rawText || '');
  const [fileName, setFileName] = useState(profile?.fileName || '');
  const [fileType, setFileType] = useState(profile?.fileType || 'text/plain');
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);

  const preview = useMemo(() => {
    if (text.trim().length < 30) return null;
    return parseResume(text, { fileName: fileName || '手动输入', fileType });
  }, [text, fileName, fileType]);

  const handleFile = async (file) => {
    if (!file) return;
    if (!isAcceptedFile(file)) {
      setError('仅支持 PDF、DOCX、TXT、Markdown 文件。');
      return;
    }
    setReading(true);
    setError('');
    try {
      const result = await extractTextFromFile(file);
      setText(result.text);
      setFileName(result.fileName);
      setFileType(result.fileType);
      showToast('已读取文件，请检查下方文本是否完整');
    } catch (err) {
      setError(err.message || '读取失败');
    } finally {
      setReading(false);
    }
  };

  const save = () => {
    if (!preview) {
      setError('至少需要 30 个字的简历内容。');
      return;
    }
    saveProfile(preview);
    hapticSuccess();
    showToast('简历已保存到本机');
    if (onboarding) navigate('/', { replace: true });
    else navigate(-1);
  };

  const useSample = () => {
    setText(SAMPLE_RESUME);
    setFileName('示例简历.txt');
    setFileType('text/plain');
    setError('');
  };

  return (
    <div className="page">
      <TopBar
        title={onboarding ? '先放一份简历' : '我的简历'}
        subtitle={onboarding ? '本地解析，不上传' : '导入后随时可以手动修正'}
        onBack={() => navigate(-1)}
      />

      {error ? (
        <Card className="card--flat" style={{ borderColor: 'var(--danger-soft)', background: 'var(--danger-soft)' }}>
          <div className="small" style={{ color: 'var(--danger)' }}>{error}</div>
        </Card>
      ) : null}

      {!text ? (
        <>
          <div
            className={'upload-zone' + (drag ? ' upload-zone--active' : '')}
            onDragOver={(event) => { event.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDrag(false);
              handleFile(event.dataTransfer.files?.[0]);
            }}
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => { if (event.key === 'Enter') fileRef.current?.click(); }}
          >
            <div className="upload-icon"><Upload size={25} /></div>
            <div className="upload-title">{reading ? '正在读取…' : '把简历拖进来'}</div>
            <div className="upload-text">
              支持 PDF / DOCX / TXT / Markdown，最大 10MB。
              扫描版 PDF 可能读不到文字，可以直接粘贴。
            </div>
            <div className="mt-12">
              <Button size="sm" variant="paper" icon={<FileText size={15} />} onClick={(event) => { event.stopPropagation(); fileRef.current?.click(); }}>
                选择文件
              </Button>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS.join(',')}
            className="sr-only"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
          <div className="row gap-8 mt-12">
            <Button variant="outline" block icon={<PenLine size={15} />} onClick={() => { setText(' '); setFileName('手动输入'); }}>
              直接粘贴
            </Button>
            <Button variant="ghost" block icon={<Sparkles size={15} />} onClick={useSample}>
              用示例
            </Button>
          </div>
          <Card className="card--flat mt-16">
            <div className="row gap-10">
              <ShieldCheck size={18} />
              <div>
                <div className="strong small">简历不会离开这台设备</div>
                <div className="tiny muted mt-4">解析和匹配都在本地完成；只有你主动开启 AI 增强时，才会把必要文本发给自己的代理服务。</div>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <>
          <Card className="card--tight">
            <div className="between">
              <div className="row gap-10">
                <div className="list-icon"><FileText size={17} /></div>
                <div>
                  <div className="strong small">{fileName || '手动输入的简历'}</div>
                  <div className="tiny muted mt-4">{text.length} 字 · {preview ? preview.completeness + '/100 完整度' : '待解析'}</div>
                </div>
              </div>
              <div className="row gap-4">
                <button type="button" className="icon-btn icon-btn--ghost" aria-label="重新导入" onClick={() => fileRef.current?.click()}>
                  <RefreshCw size={16} />
                </button>
                <button type="button" className="icon-btn icon-btn--ghost" aria-label="清空" onClick={() => { setText(''); setFileName(''); setError(''); }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </Card>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS.join(',')}
            className="sr-only"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />

          <div className="mt-16">
            <Field label="简历正文" hint="解析结果不理想时，直接在这里改；右侧的匹配分析会同步更新。">
              <textarea
                className="textarea textarea--tall"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="把简历文本粘贴到这里…"
                spellCheck={false}
              />
            </Field>
          </div>

          {preview ? (
            <>
              <div className="profile-stats mt-12">
                <div className="profile-stat"><b>{preview.completeness}</b><span>完整度</span></div>
                <div className="profile-stat"><b>{preview.skills.length}</b><span>技能</span></div>
                <div className="profile-stat"><b>{preview.quantifiedCount}</b><span>量化结果</span></div>
              </div>

              <Card className="card--flat mt-12">
                <div className="between">
                  <div className="strong small">识别到的技能</div>
                  <span className="tiny muted">{preview.skills.length} 项</span>
                </div>
                {preview.skills.length ? (
                  <div className="skill-cloud mt-10">
                    {groupSkills(preview.skills).map((group) => (
                      group.items.map((skill) => (
                        <Chip key={skill.name} tone="soft">{skill.name}</Chip>
                      ))
                    ))}
                  </div>
                ) : (
                  <div className="tiny muted mt-8">还没有识别到技能。把「专业技能」板块写清楚，或在项目 bullet 里写明工具和语言。</div>
                )}
                <div className="divider" />
                <div className="row wrap gap-8">
                  {preview.email ? <Chip tone="success">{preview.email}</Chip> : <Chip tone="warning">缺邮箱</Chip>}
                  {preview.phone ? <Chip tone="success">{preview.phone}</Chip> : <Chip tone="warning">缺电话</Chip>}
                  <Chip tone="soft">{preview.educationLabel}</Chip>
                  <Chip tone="soft">{preview.yearsExperience ? preview.yearsExperience + ' 年经验' : '应届 / 经验待填'}</Chip>
                </div>
              </Card>

              <div className="row gap-8 mt-16">
                <Button variant="outline" block icon={<Sparkles size={15} />} onClick={useSample}>换成示例</Button>
                <Button block icon={<CheckCircle2 size={16} />} onClick={save}>
                  {onboarding ? '保存并开始' : '保存简历'}
                </Button>
              </div>
            </>
          ) : (
            <Card className="card--flat mt-12">
              <div className="small muted">再写一点内容（至少 30 个字），我才能识别板块和技能。</div>
            </Card>
          )}
        </>
      )}

      <div className="footer-note">
        <ShieldCheck size={11} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
        本地解析 · 随时可在「我的」里清空
      </div>
    </div>
  );
}
