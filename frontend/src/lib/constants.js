export const APP_VERSION = '2.0.2';
export const APP_NAME = 'Offer 捕手';

export const TRACKER_STATUSES = [
  { id: 'saved', label: '收藏', short: '收藏', tone: 'muted' },
  { id: 'applied', label: '已投递', short: '已投', tone: 'accent' },
  { id: 'interview', label: '面试中', short: '面试', tone: 'warning' },
  { id: 'offer', label: 'Offer', short: 'Offer', tone: 'success' },
  { id: 'rejected', label: '已拒绝', short: '拒绝', tone: 'danger' },
];

export const TRACKER_STATUS_MAP = Object.fromEntries(TRACKER_STATUSES.map((status) => [status.id, status]));

export const SUGGESTION_LABELS = {
  keyword: '关键词',
  impact: '结果量化',
  summary: '个人简介',
  project: '项目排序',
  format: '简历格式',
  education: '学历补强',
  polish: '最后打磨',
  general: '综合建议',
};

export const STORAGE_KEY = 'offer-catcher-mobile';

