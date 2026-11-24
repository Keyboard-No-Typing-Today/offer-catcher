import { useNavigate } from 'react-router-dom';
import { Crosshair, FileText, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import Button from '../components/Button.jsx';
import useAppStore from '../store/useAppStore.js';

const features = [
  {
    title: '简历诊断，不是打分游戏',
    text: '从技能覆盖、经验相关、关键词和表达质量四个维度拆开看，告诉你先改哪一句。',
  },
  {
    title: '粘贴 JD，30 秒得到行动清单',
    text: '把岗位要求拆成「必须有 / 加分项」，对照简历找出真正的差距。',
  },
  {
    title: '投递进度，留在一个地方',
    text: '收藏、已投、面试、Offer 和拒绝，不用再翻聊天记录和邮箱。',
  },
];

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const profile = useAppStore((state) => state.profile);
  const loadSample = useAppStore((state) => state.loadSample);

  const start = () => navigate('/resume?onboarding=1');
  const demo = () => {
    if (profile) {
      navigate('/');
      return;
    }
    loadSample();
    navigate('/');
  };

  return (
    <div className="welcome">
      <div className="welcome-top">
        <div className="brand">
          <div className="brand-mark"><Crosshair size={19} /></div>
          <span className="brand-name">Offer 捕手</span>
        </div>
        <span className="eyebrow">EE5415 · 2026</span>
      </div>

      <div className="welcome-hero">
        <span className="welcome-kicker"><Sparkles size={11} /> 求职作战手册 · v1.0</span>
        <h1 className="welcome-title">
          把每一次投递，<br />
          变成一次<em>有准备</em>的出击。
        </h1>
        <p className="welcome-sub">
          导入简历，粘贴 JD。30 秒内看到匹配度、差距和下一步该改什么。
          简历只留在你的手机里。
        </p>

        <div className="orbit" aria-hidden="true">
          <div className="orbit-ring" />
          <div className="orbit-ring orbit-ring--2" />
          <div className="orbit-ring orbit-ring--3" />
          <div className="orbit-core"><Crosshair size={26} /></div>
          <span className="orbit-dot orbit-dot--a" />
          <span className="orbit-dot orbit-dot--b" />
          <span className="orbit-label orbit-label--a">SKILLS</span>
          <span className="orbit-label orbit-label--b">EVIDENCE</span>
        </div>
      </div>

      <div>
        <div className="welcome-actions">
          <Button size="lg" block icon={<FileText size={18} />} onClick={start}>
            {profile ? '重新导入简历' : '导入简历，开始'}
          </Button>
          <Button variant="outline" block icon={<ArrowRight size={18} />} onClick={demo}>
            {profile ? '继续使用' : '先用示例看看'}
          </Button>
        </div>
        <div className="welcome-note"><ShieldCheck size={11} /> 本地优先 · 简历不上传 · 可随时清空</div>
      </div>

      <div className="welcome-features">
        {features.map((feature, index) => (
          <div className="feature" key={feature.title}>
            <div className="feature-num">0{index + 1}</div>
            <div>
              <div className="feature-title">{feature.title}</div>
              <div className="feature-text">{feature.text}</div>
            </div>
          </div>
        ))}
      </div>


    </div>
  );
}