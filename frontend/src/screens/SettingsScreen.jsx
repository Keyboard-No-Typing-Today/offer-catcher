import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, Database, Download, FileText, Info, Loader2, RefreshCw,
  ShieldCheck, Sparkles, Trash2, UserRound, Wifi, WifiOff,
} from 'lucide-react';
import TopBar from '../components/TopBar.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Chip from '../components/Chip.jsx';
import Field from '../components/Field.jsx';
import Sheet from '../components/Sheet.jsx';
import Avatar from '../components/Avatar.jsx';
import useAppStore from '../store/useAppStore.js';
import { useToastStore } from '../store/useToastStore.js';
import { checkHealth } from '../lib/api.js';
import { isNativePlatform } from '../lib/storage.js';
import { downloadText, formatDate } from '../lib/format.js';
import { APP_NAME, APP_VERSION } from '../lib/constants.js';
import { hapticSuccess } from '../hooks/useHaptics.js';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const profile = useAppStore((state) => state.profile);
  const settings = useAppStore((state) => state.settings);
  const analyses = useAppStore((state) => state.analyses);
  const tracker = useAppStore((state) => state.tracker);
  const savedJobIds = useAppStore((state) => state.savedJobIds);
  const setSettings = useAppStore((state) => state.setSettings);
  const setAiStatus = useAppStore((state) => state.setAiStatus);
  const aiStatus = useAppStore((state) => state.aiStatus);
  const resetUserData = useAppStore((state) => state.resetUserData);
  const resetEverything = useAppStore((state) => state.resetEverything);
  const showToast = useToastStore((state) => state.showToast);

  const [apiBase, setApiBase] = useState(settings.apiBaseUrl);
  const [checking, setChecking] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState('clear');

  const status = aiStatus?.state || 'unknown';

  useEffect(() => {
    setApiBase(settings.apiBaseUrl);
  }, [settings.apiBaseUrl]);

  const runCheck = async () => {
    setChecking(true);
    setAiStatus({ state: 'checking', message: '正在连接 AI 代理…', models: null });
    try {
      const health = await checkHealth(apiBase);
      const chatEnabled = Boolean(health?.chat?.enabled);
      setAiStatus({
        state: chatEnabled ? 'online' : 'offline',
        message: chatEnabled ? 'AI 代理已连接' : '代理可达，但聊天模型未配置',
        models: health || null,
      });
      setSettings({ apiBaseUrl: apiBase, lastAiCheck: Date.now() });
      showToast(chatEnabled ? 'AI 连接成功' : '代理可达，但模型未就绪');
      if (chatEnabled) hapticSuccess();
    } catch (error) {
      setAiStatus({ state: 'offline', message: error.message || '连接失败', models: null });
      showToast('连接失败，检查地址或代理是否启动');
    } finally {
      setChecking(false);
    }
  };

  const saveApiBase = () => {
    setSettings({ apiBaseUrl: apiBase });
    showToast('服务地址已保存');
  };

  const exportData = async () => {
    const json = useAppStore.getState().exportData();
    try {
      if (isNativePlatform()) {
        const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
        const result = await Filesystem.writeFile({
          path: 'offer-catcher-export.json',
          data: json,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        showToast('已保存到 Documents/offer-catcher-export.json');
        return result;
      }
      downloadText('offer-catcher-export.json', json);
      showToast('数据已导出');
      return true;
    } catch (error) {
      showToast('导出失败：' + (error.message || '请稍后重试'));
      return false;
    }
  };

  const openConfirm = (mode) => {
    setConfirmMode(mode);
    setConfirmOpen(true);
  };

  const doReset = () => {
    if (confirmMode === 'everything') {
      resetEverything();
      setConfirmOpen(false);
      navigate('/welcome', { replace: true });
      return;
    }
    resetUserData();
    setConfirmOpen(false);
    navigate('/welcome', { replace: true });
  };

  return (
    <div className="page page--tab">
      <TopBar title="我的" subtitle="本机数据、AI 连接和关于" back={false} line />

      {profile ? (
        <Card>
          <div className="profile-head">
            <Avatar name={profile.name} size="lg" />
            <div className="flex-1">
              <div className="profile-name">{profile.name}</div>
              <div className="profile-sub">{profile.educationLabel} · {profile.yearsExperience ? profile.yearsExperience + ' 年经验' : '应届/经验待填'}</div>
            </div>
            <button type="button" className="icon-btn icon-btn--ghost" aria-label="编辑简历" onClick={() => navigate('/resume')}>
              <FileText size={18} />
            </button>
          </div>
          <div className="profile-stats">
            <div className="profile-stat"><b>{profile.completeness}</b><span>完整度</span></div>
            <div className="profile-stat"><b>{profile.skills.length}</b><span>技能</span></div>
            <div className="profile-stat"><b>{analyses.length}</b><span>分析</span></div>
          </div>
          <div className="row gap-8 mt-12">
            <Button variant="outline" size="sm" block onClick={() => navigate('/resume')}>编辑简历</Button>
            <Button variant="outline" size="sm" block onClick={() => navigate('/tracker')}>投递进度</Button>
          </div>
        </Card>
      ) : (
        <Card className="card--accent">
          <div className="row gap-10">
            <UserRound size={20} />
            <div>
              <div className="strong">还没有简历</div>
              <div className="small" style={{ opacity: 0.8 }}>导入后才能做匹配。</div>
            </div>
          </div>
          <div className="mt-12">
            <Button variant="paper" size="sm" onClick={() => navigate('/resume?onboarding=1')}>导入简历</Button>
          </div>
        </Card>
      )}

      <section className="settings-group">
        <div className="settings-group-title">AI 服务</div>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-icon"><Sparkles size={16} /></div>
            <div className="settings-main">
              <div className="settings-label">AI 增强</div>
              <div className="settings-sub">关闭后只使用本地规则，完全离线。</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.aiEnabled}
              aria-label="AI 增强开关"
              onClick={() => setSettings({ aiEnabled: !settings.aiEnabled })}
              style={{
                width: 46, height: 27, borderRadius: 99, border: '1px solid var(--line)',
                background: settings.aiEnabled ? 'var(--ink)' : 'var(--paper-2)', position: 'relative',
              }}
            >
              <span style={{
                position: 'absolute', top: 3, left: settings.aiEnabled ? 22 : 3, width: 19, height: 19,
                borderRadius: 99, background: settings.aiEnabled ? 'var(--paper)' : 'var(--muted)',
                transition: 'left 180ms var(--ease-out)',
              }} />
            </button>
          </div>

          <div className="settings-row" style={{ alignItems: 'flex-start' }}>
            <div className="settings-icon"><Wifi size={16} /></div>
            <div className="settings-main">
              <div className="between">
                <div className="settings-label">代理地址</div>
                <span className="ai-status">
                  <span className={'ai-status-dot' + (status === 'online' ? ' ai-status-dot--online' : status === 'offline' ? ' ai-status-dot--offline' : status === 'checking' ? ' ai-status-dot--checking' : '')} />
                  {status === 'online' ? '在线' : status === 'offline' ? '未连接' : status === 'checking' ? '检测中' : '未检测'}
                </span>
              </div>
              <div className="settings-sub">本机或局域网上的 Express 代理；也可以填部署后的 HTTPS 地址。</div>
              <div className="input-row mt-8">
                <input className="input" value={apiBase} onChange={(event) => setApiBase(event.target.value)} placeholder="http://192.168.x.x:3001/api" />
                <Button size="sm" variant="outline" onClick={saveApiBase}>保存</Button>
              </div>
              <div className="row gap-8 mt-8">
                <Button size="sm" loading={checking} icon={checking ? null : <RefreshCw size={13} />} onClick={runCheck}>测试连接</Button>
                {status === 'offline' ? <span className="tiny muted">先运行 npm run server</span> : null}
              </div>
              {aiStatus?.message ? <div className="hint mt-6">{aiStatus.message}</div> : null}
              {aiStatus?.models?.chat?.model ? <div className="hint">聊天模型：{aiStatus.models.chat.model}{aiStatus.models.embedding?.model ? ' · 向量模型：' + aiStatus.models.embedding.model : ''}</div> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="settings-group">
        <div className="settings-group-title">数据</div>
        <div className="settings-card">
          <button type="button" className="settings-row settings-row--tap" onClick={() => navigate('/resume')} style={{ width: '100%', textAlign: 'left', background: 'transparent' }}>
            <div className="settings-icon"><FileText size={16} /></div>
            <div className="settings-main"><div className="settings-label">简历与解析结果</div><div className="settings-sub">本地存储，可随时替换</div></div>
            <ChevronRight size={15} className="settings-end" />
          </button>
          <button type="button" className="settings-row settings-row--tap" onClick={() => navigate('/tracker')} style={{ width: '100%', textAlign: 'left', background: 'transparent' }}>
            <div className="settings-icon"><Database size={16} /></div>
            <div className="settings-main"><div className="settings-label">投递记录</div><div className="settings-sub">{tracker.length} 条 · 收藏岗位 {savedJobIds.length} 个</div></div>
            <ChevronRight size={15} className="settings-end" />
          </button>
          <button type="button" className="settings-row settings-row--tap" onClick={exportData} style={{ width: '100%', textAlign: 'left', background: 'transparent' }}>
            <div className="settings-icon"><Download size={16} /></div>
            <div className="settings-main"><div className="settings-label">导出数据</div><div className="settings-sub">JSON 备份；不包含 API key</div></div>
            <ChevronRight size={15} className="settings-end" />
          </button>
          <button type="button" className="settings-row settings-row--tap" onClick={() => openConfirm('clear')} style={{ width: '100%', textAlign: 'left', background: 'transparent' }}>
            <div className="settings-icon"><Trash2 size={16} /></div>
            <div className="settings-main"><div className="settings-label settings-danger">清空本机数据</div><div className="settings-sub">简历、分析、收藏和投递记录</div></div>
            <ChevronRight size={15} className="settings-end" />
          </button>
        </div>
      </section>

      <section className="settings-group">
        <div className="settings-group-title">关于</div>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-icon"><Info size={16} /></div>
            <div className="settings-main"><div className="settings-label">{APP_NAME}</div><div className="settings-sub">EE5415 个人项目 · v{APP_VERSION}</div></div>
            <span className="tiny muted">2026</span>
          </div>
          <div className="settings-row">
            <div className="settings-icon"><ShieldCheck size={16} /></div>
            <div className="settings-main"><div className="settings-label">隐私说明</div><div className="settings-sub">简历不离开设备；开启 AI 时只发送分析所需的文本到你自己配置的代理。</div></div>
          </div>
        </div>
      </section>

      <div className="row gap-8 mt-16">
        <Button variant="ghost" size="sm" block onClick={() => openConfirm('everything')}>恢复出厂</Button>
      </div>

      <div className="footer-note">
        <Sparkles size={11} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
        本地优先 · 你的简历不应该成为别人的数据
        <br />
        {settings.lastAiCheck ? '上次检测：' + formatDate(settings.lastAiCheck, 'long') : 'AI 尚未检测'}
      </div>

      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)} title={confirmMode === 'everything' ? '恢复出厂设置？' : '清空本机数据？'}>
        <div className="small ink-2" style={{ lineHeight: 1.7 }}>
          {confirmMode === 'everything'
            ? '会删除简历、分析、收藏、投递记录和 AI 设置。这个操作不可撤销。'
            : '会删除简历、分析、收藏和投递记录，但保留 AI 设置。这个操作不可撤销。'}
        </div>
        <div className="row gap-8 mt-20">
          <Button variant="outline" block onClick={() => setConfirmOpen(false)}>取消</Button>
          <Button variant="danger" block onClick={doReset}>确认删除</Button>
        </div>
      </Sheet>
    </div>
  );
}
