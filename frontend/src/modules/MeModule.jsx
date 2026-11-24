import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Dialog, Input, List, Switch, Tag, Toast } from 'antd-mobile';
import {
  ChevronRight, Database, Download, FileText, Info, RefreshCw, ShieldCheck, Sparkles, Trash2, UserRound, Wifi, WifiOff,
} from 'lucide-react';
import useAppStore from '../store/useAppStore.js';
import { checkHealth } from '../lib/api.js';
import { downloadText } from '../lib/format.js';
import { isNativePlatform } from '../lib/storage.js';
import { APP_NAME, APP_VERSION } from '../lib/constants.js';
import { ROLE_PROFILES, ROLE_SOURCE } from '../data/roles.js';

export default function MeModule() {
  const navigate = useNavigate();
  const profile = useAppStore((state) => state.profile);
  const settings = useAppStore((state) => state.settings);
  const aiStatus = useAppStore((state) => state.aiStatus);
  const setSettings = useAppStore((state) => state.setSettings);
  const setAiStatus = useAppStore((state) => state.setAiStatus);
  const resetUserData = useAppStore((state) => state.resetUserData);
  const resetEverything = useAppStore((state) => state.resetEverything);
  const [apiBase, setApiBase] = useState(settings.apiBaseUrl);
  const [checking, setChecking] = useState(false);

  useEffect(() => { setApiBase(settings.apiBaseUrl); }, [settings.apiBaseUrl]);

  const status = settings.aiEnabled ? (aiStatus?.state || 'unknown') : 'disabled';
  const samples = ROLE_PROFILES.reduce((sum, role) => sum + (role.sampleCount || 0), 0);

  const saveBase = () => {
    setSettings({ apiBaseUrl: apiBase });
    Toast.show({ content: '代理地址已保存' });
  };

  const runCheck = async () => {
    setChecking(true);
    setAiStatus({ state: 'checking', message: '正在连接 AI 代理…', models: null });
    try {
      const health = await checkHealth(apiBase);
      const enabled = Boolean(health?.chat?.enabled);
      setAiStatus({
        state: enabled ? 'online' : 'offline',
        message: enabled ? 'AI 代理已连接' : '代理可达，但聊天模型未配置',
        models: health || null,
      });
      setSettings({ apiBaseUrl: apiBase, lastAiCheck: Date.now() });
      Toast.show({ icon: enabled ? 'success' : undefined, content: enabled ? 'AI 连接成功' : '代理可达，但模型未就绪' });
    } catch (error) {
      setAiStatus({ state: 'offline', message: error.message || '连接失败', models: null });
      Toast.show({ content: '连接失败，检查代理是否启动' });
    } finally {
      setChecking(false);
    }
  };

  const exportData = async () => {
    const json = useAppStore.getState().exportData();
    try {
      if (isNativePlatform()) {
        const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
        await Filesystem.writeFile({
          path: 'offer-catcher-export.json',
          data: json,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        Toast.show({ icon: 'success', content: '已保存到 Documents/offer-catcher-export.json' });
      } else {
        downloadText('offer-catcher-export.json', json);
        Toast.show({ icon: 'success', content: '数据已导出' });
      }
    } catch (error) {
      Toast.show({ content: '导出失败：' + (error.message || '请稍后重试') });
    }
  };

  const reset = async (mode) => {
    const content = mode === 'everything'
      ? '恢复出厂会删除简历、分析、对话和设置。确定继续？'
      : '清空简历、分析和对话，保留 AI 设置？';
    const confirmed = await Dialog.confirm({ content, confirmText: '确认删除' });
    if (!confirmed) return;
    if (mode === 'everything') resetEverything();
    else resetUserData();
    Toast.show({ content: '本机数据已清空' });
    navigate('/');
  };

  const statusView = {
    ai: { text: 'AI 已连接', color: 'success', icon: <Wifi size={12} /> },
    online: { text: 'AI 已连接', color: 'success', icon: <Wifi size={12} /> },
    offline: { text: '离线 / 本地模式', color: 'warning', icon: <WifiOff size={12} /> },
    checking: { text: '连接中…', color: 'default', icon: <RefreshCw size={12} /> },
    disabled: { text: 'AI 已关闭', color: 'default', icon: <WifiOff size={12} /> },
    unknown: { text: '未检测', color: 'default', icon: <WifiOff size={12} /> },
  }[status] || { text: status, color: 'default', icon: null };

  return (
    <div className="m-page m-me-page">
      <header className="m-top">
        <div>
          <div className="m-eyebrow">MINE</div>
          <h1 className="m-page-title">我的</h1>
        </div>
        <span className="m-muted m-small">v{APP_VERSION}</span>
      </header>

      {profile ? (
        <div className="m-me-profile">
          <div className="m-me-avatar">{(profile.name || '同').slice(0, 1)}</div>
          <div className="m-me-profile-main">
            <div className="m-me-name">{profile.name || '同学'}</div>
            <div className="m-muted">{profile.educationLabel || '学历待填'} · {profile.yearsExperience ? profile.yearsExperience + ' 年经历' : '应届 / 实习经历'}</div>
            <div className="m-me-stats">
              <span><b>{profile.completeness || 0}</b>完整度</span>
              <span><b>{profile.skills?.length || 0}</b>技能</span>
              <span><b>{profile.quantifiedCount || 0}</b>量化</span>
            </div>
          </div>
          <button type="button" className="m-icon-btn" aria-label="更新简历" onClick={() => navigate('/')}>
            <FileText size={18} />
          </button>
        </div>
      ) : (
        <div className="m-me-empty" onClick={() => navigate('/')}>
          <UserRound size={20} />
          <div><b>还没有导入简历</b><span>去「匹配」页导入后，这里会显示你的画像。</span></div>
          <ChevronRight size={16} />
        </div>
      )}

      <div className="m-me-section">
        <div className="m-me-section-title"><Sparkles size={13} /> AI 服务</div>
        <List className="m-me-list">
          <List.Item
            prefix={<Sparkles size={17} />}
            extra={<Switch checked={settings.aiEnabled} onChange={(value) => setSettings({ aiEnabled: value })} />}
            description="关闭后只使用本地匹配和本地问答，完全不联网。"
          >
            AI 增强
          </List.Item>
          <List.Item prefix={<Wifi size={17} />} extra={<Tag color={statusView.color} fill="outline">{statusView.text}</Tag>} description="本机 Express 代理 / 局域网 / 部署后的 HTTPS 地址。">
            <div className="m-me-field">
              <div className="m-me-field-label">代理地址</div>
              <div className="m-me-field-row">
                <Input value={apiBase} onChange={setApiBase} placeholder="http://localhost:3001/api" />
                <Button size="small" fill="outline" onClick={saveBase}>保存</Button>
              </div>
            </div>
          </List.Item>
          <List.Item prefix={<RefreshCw size={17} />} onClick={runCheck} arrow>
            {checking ? '正在测试连接…' : '测试 AI 连接'}
          </List.Item>
        </List>
      </div>

      <div className="m-me-section">
        <div className="m-me-section-title"><Database size={13} /> 数据</div>
        <List className="m-me-list">
          <List.Item prefix={<Download size={17} />} onClick={exportData} arrow description="JSON 备份；包含简历、画像匹配和设置，不包含 API key。">
            导出本机数据
          </List.Item>
          <List.Item prefix={<Trash2 size={17} />} onClick={() => reset('clear')} arrow description="删除简历、分析和对话，保留 AI 设置。">
            清空本机数据
          </List.Item>
          <List.Item prefix={<Trash2 size={17} />} onClick={() => reset('everything')} arrow description="恢复所有默认设置，包括代理地址。">
            恢复出厂
          </List.Item>
        </List>
      </div>

      <div className="m-me-section">
        <div className="m-me-section-title"><Info size={13} /> 关于</div>
        <List className="m-me-list">
          <List.Item prefix={<ShieldCheck size={17} />} description="简历默认只在本机解析；开启 AI 时只把分析所需文字发送到你配置的代理。">
            隐私说明
          </List.Item>
          <List.Item prefix={<Database size={17} />} description={ROLE_SOURCE + ' 语义排序使用阿里云 Qwen embedding；原始简历不入库。'}>
            岗位画像数据
          </List.Item>
          <List.Item prefix={<Info size={17} />} extra={<span className="m-muted m-small">v{APP_VERSION}</span>}>
            {APP_NAME}
          </List.Item>
        </List>
      </div>

      <div className="m-me-footer">
        <span>本地优先 · 你的简历不应该成为别人的数据</span>
        <span>{samples} 份简历 · {ROLE_PROFILES.length} 个方向画像</span>
      </div>
    </div>
  );
}
