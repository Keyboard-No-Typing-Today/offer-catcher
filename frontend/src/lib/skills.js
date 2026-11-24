// Skill dictionary and matcher shared by resume parsing, JD parsing and scoring.
// Keep aliases lowercase for Latin terms; Chinese aliases are matched literally.

export const CATEGORY_LABELS = {
  frontend: '前端',
  backend: '后端',
  data: '数据',
  algorithm: '算法',
  product: '产品',
  design: '设计',
  testing: '测试',
  devops: '运维',
  marketing: '市场',
  hr: '人力',
  general: '通用',
};

export const SKILLS = [
  // frontend
  { name: 'React', category: 'frontend', aliases: ['react', 'react.js', 'reactjs'] },
  { name: 'Vue', category: 'frontend', aliases: ['vue', 'vue.js', 'vuejs'] },
  { name: 'Angular', category: 'frontend', aliases: ['angular'] },
  { name: 'TypeScript', category: 'frontend', aliases: ['typescript', 'ts'] },
  { name: 'JavaScript', category: 'frontend', aliases: ['javascript', 'es6'] },
  { name: 'HTML', category: 'frontend', aliases: ['html', 'html5'] },
  { name: 'CSS', category: 'frontend', aliases: ['css', 'css3'] },
  { name: 'Sass', category: 'frontend', aliases: ['sass', 'scss'] },
  { name: 'Tailwind CSS', category: 'frontend', aliases: ['tailwind'] },
  { name: 'Webpack', category: 'frontend', aliases: ['webpack'] },
  { name: 'Vite', category: 'frontend', aliases: ['vite'] },
  { name: 'Next.js', category: 'frontend', aliases: ['next.js', 'nextjs'] },
  { name: 'Nuxt', category: 'frontend', aliases: ['nuxt'] },
  { name: '小程序', category: 'frontend', aliases: ['小程序', '微信小程序'] },
  { name: '移动端开发', category: 'frontend', aliases: ['移动端', 'h5', '响应式'] },
  { name: '前端性能优化', category: 'frontend', aliases: ['性能优化', '首屏', '懒加载'] },
  { name: '可视化图表', category: 'frontend', aliases: ['可视化', 'echarts', 'd3', '图表'] },
  { name: 'Canvas / WebGL', category: 'frontend', aliases: ['canvas', 'webgl'] },
  { name: '组件库', category: 'frontend', aliases: ['组件库', '组件化', 'design system'] },
  { name: '微前端', category: 'frontend', aliases: ['微前端'] },
  { name: 'SSR', category: 'frontend', aliases: ['ssr', '服务端渲染'] },

  // backend
  { name: 'Java', category: 'backend', aliases: ['java'] },
  { name: 'Spring', category: 'backend', aliases: ['spring', 'spring boot', 'springboot'] },
  { name: 'Go', category: 'backend', aliases: ['golang', 'go'], boundary: true },
  { name: 'Python', category: 'backend', aliases: ['python'] },
  { name: 'Node.js', category: 'backend', aliases: ['node.js', 'nodejs', 'node'] },
  { name: 'Express', category: 'backend', aliases: ['express'] },
  { name: 'Django', category: 'backend', aliases: ['django'] },
  { name: 'Flask', category: 'backend', aliases: ['flask'] },
  { name: 'MySQL', category: 'backend', aliases: ['mysql'] },
  { name: 'PostgreSQL', category: 'backend', aliases: ['postgresql', 'postgres'] },
  { name: 'Redis', category: 'backend', aliases: ['redis'] },
  { name: 'MongoDB', category: 'backend', aliases: ['mongodb', 'mongo'] },
  { name: 'Kafka', category: 'backend', aliases: ['kafka'] },
  { name: 'RabbitMQ', category: 'backend', aliases: ['rabbitmq'] },
  { name: '微服务', category: 'backend', aliases: ['微服务', 'microservice'] },
  { name: '分布式系统', category: 'backend', aliases: ['分布式', 'distributed'] },
  { name: '高并发', category: 'backend', aliases: ['高并发', '高性能'] },
  { name: 'REST API', category: 'backend', aliases: ['rest', 'restful', 'api 设计'] },
  { name: 'GraphQL', category: 'backend', aliases: ['graphql'] },
  { name: 'gRPC', category: 'backend', aliases: ['grpc', 'protobuf'] },
  { name: 'Linux', category: 'devops', aliases: ['linux', 'unix'] },
  { name: 'Shell', category: 'devops', aliases: ['shell', 'bash'] },
  { name: 'Git', category: 'devops', aliases: ['git', 'github', 'gitlab'] },

  // data
  { name: 'SQL', category: 'data', aliases: ['sql'] },
  { name: 'Pandas', category: 'data', aliases: ['pandas'] },
  { name: 'NumPy', category: 'data', aliases: ['numpy'] },
  { name: 'R', category: 'data', aliases: ['r语言'], boundary: true },
  { name: 'Excel', category: 'data', aliases: ['excel', '电子表格'] },
  { name: 'Tableau', category: 'data', aliases: ['tableau'] },
  { name: 'Power BI', category: 'data', aliases: ['power bi', 'powerbi'] },
  { name: 'Spark', category: 'data', aliases: ['spark'] },
  { name: 'Flink', category: 'data', aliases: ['flink'] },
  { name: 'Hive', category: 'data', aliases: ['hive'] },
  { name: 'Hadoop', category: 'data', aliases: ['hadoop'] },
  { name: '数据仓库', category: 'data', aliases: ['数据仓库', '数仓'] },
  { name: 'ETL', category: 'data', aliases: ['etl', '数据清洗'] },
  { name: 'A/B 测试', category: 'data', aliases: ['a/b', 'ab test', 'ab测试', 'a/b测试'] },
  { name: '统计分析', category: 'data', aliases: ['统计', '假设检验', '回归分析'] },
  { name: '数据可视化', category: 'data', aliases: ['数据可视化'] },
  { name: '埋点', category: 'data', aliases: ['埋点', '数据采集'] },
  { name: '数据分析', category: 'data', aliases: ['数据分析', '数据驱动'] },

  // algorithm / AI
  { name: '机器学习', category: 'algorithm', aliases: ['机器学习', 'machine learning', 'ml'] },
  { name: '深度学习', category: 'algorithm', aliases: ['深度学习', 'deep learning', 'dl'] },
  { name: 'NLP', category: 'algorithm', aliases: ['nlp', '自然语言处理'] },
  { name: '计算机视觉', category: 'algorithm', aliases: ['计算机视觉', 'computer vision'] },
  { name: '推荐系统', category: 'algorithm', aliases: ['推荐系统', '推荐算法'] },
  { name: 'PyTorch', category: 'algorithm', aliases: ['pytorch'] },
  { name: 'TensorFlow', category: 'algorithm', aliases: ['tensorflow'] },
  { name: 'Transformer', category: 'algorithm', aliases: ['transformer', 'attention'] },
  { name: '大模型 / LLM', category: 'algorithm', aliases: ['llm', '大模型', 'aigc', 'rag', 'prompt'] },
  { name: '特征工程', category: 'algorithm', aliases: ['特征工程', 'feature engineering'] },
  { name: '强化学习', category: 'algorithm', aliases: ['强化学习', 'reinforcement learning'] },

  // product
  { name: '需求分析', category: 'product', aliases: ['需求分析', '需求调研'] },
  { name: '用户研究', category: 'product', aliases: ['用户研究', '用户调研', '用研'] },
  { name: '竞品分析', category: 'product', aliases: ['竞品分析', '竞品调研'] },
  { name: 'PRD', category: 'product', aliases: ['prd', '需求文档'] },
  { name: '原型设计', category: 'product', aliases: ['原型', 'axure', '墨刀'] },

  { name: '项目管理', category: 'product', aliases: ['项目管理', '敏捷', 'scrum'] },
  { name: '增长', category: 'product', aliases: ['增长', 'growth'] },
  { name: '商业化', category: 'product', aliases: ['商业化', '变现'] },

  // design
  { name: 'UI 设计', category: 'design', aliases: ['ui', '界面设计'] },
  { name: 'UX 设计', category: 'design', aliases: ['ux', '用户体验', '交互设计'] },
  { name: 'Figma', category: 'design', aliases: ['figma'] },
  { name: 'Sketch', category: 'design', aliases: ['sketch'] },
  { name: 'Adobe XD', category: 'design', aliases: ['adobe xd', 'xd'] },
  { name: 'Photoshop', category: 'design', aliases: ['photoshop', 'ps'] },
  { name: 'Illustrator', category: 'design', aliases: ['illustrator'] },
  { name: '设计系统', category: 'design', aliases: ['设计系统', 'design system'] },
  { name: '动效设计', category: 'design', aliases: ['动效', 'motion'] },
  { name: '作品集', category: 'design', aliases: ['作品集', 'portfolio'] },

  // testing
  { name: '自动化测试', category: 'testing', aliases: ['自动化测试', 'automation test'] },
  { name: '测试用例', category: 'testing', aliases: ['测试用例', 'test case'] },
  { name: '接口测试', category: 'testing', aliases: ['接口测试', 'api 测试'] },
  { name: '性能测试', category: 'testing', aliases: ['性能测试', '压测'] },
  { name: 'Selenium', category: 'testing', aliases: ['selenium'] },
  { name: 'Appium', category: 'testing', aliases: ['appium'] },
  { name: 'JMeter', category: 'testing', aliases: ['jmeter'] },
  { name: 'Postman', category: 'testing', aliases: ['postman'] },
  { name: 'CI/CD', category: 'testing', aliases: ['ci/cd', 'cicd', '持续集成'] },

  // devops
  { name: 'Docker', category: 'devops', aliases: ['docker'] },
  { name: 'Kubernetes', category: 'devops', aliases: ['kubernetes', 'k8s'] },
  { name: 'Jenkins', category: 'devops', aliases: ['jenkins'] },
  { name: 'GitLab CI', category: 'devops', aliases: ['gitlab ci', 'gitlab-ci'] },
  { name: 'AWS', category: 'devops', aliases: ['aws', 'amazon web services'] },
  { name: '阿里云', category: 'devops', aliases: ['阿里云', 'aliyun'] },
  { name: '腾讯云', category: 'devops', aliases: ['腾讯云', 'tencent cloud'] },
  { name: 'Nginx', category: 'devops', aliases: ['nginx'] },
  { name: 'Prometheus', category: 'devops', aliases: ['prometheus'] },
  { name: 'Grafana', category: 'devops', aliases: ['grafana'] },
  { name: 'Terraform', category: 'devops', aliases: ['terraform'] },
  { name: 'Ansible', category: 'devops', aliases: ['ansible'] },

  // marketing
  { name: '市场调研', category: 'marketing', aliases: ['市场调研', '市场研究'] },
  { name: '品牌营销', category: 'marketing', aliases: ['品牌', 'branding'] },
  { name: '内容营销', category: 'marketing', aliases: ['内容营销', '内容运营'] },
  { name: '社交媒体', category: 'marketing', aliases: ['社交媒体', 'social media', '小红书', '抖音'] },
  { name: 'SEO / SEM', category: 'marketing', aliases: ['seo', 'sem', '搜索优化'] },
  { name: '广告投放', category: 'marketing', aliases: ['投放', '广告优化'] },
  { name: '活动策划', category: 'marketing', aliases: ['活动策划', '活动运营'] },
  { name: '文案', category: 'marketing', aliases: ['文案', 'copywriting'] },
  { name: '用户画像', category: 'marketing', aliases: ['用户画像'] },
  { name: '转化率优化', category: 'marketing', aliases: ['转化率', 'cro'] },

  // hr
  { name: '招聘', category: 'hr', aliases: ['招聘', 'recruiting'] },
  { name: '面试', category: 'hr', aliases: ['面试', 'interview'] },
  { name: '薪酬绩效', category: 'hr', aliases: ['薪酬', '绩效', 'compensation'] },
  { name: '员工关系', category: 'hr', aliases: ['员工关系', 'employee relations'] },
  { name: '培训发展', category: 'hr', aliases: ['培训', '组织发展', 'od'] },
  { name: 'HRBP', category: 'hr', aliases: ['hrbp'] },
  { name: '劳动法', category: 'hr', aliases: ['劳动法', '劳动合同'] },

  // general
  { name: '英语', category: 'general', aliases: ['英语', 'english', 'cet-6', 'cet6', '雅思', '托福', 'ielts', 'toefl'] },
  { name: '沟通能力', category: 'general', aliases: ['沟通', 'communication'] },
  { name: '团队协作', category: 'general', aliases: ['团队协作', '团队合作', 'collaboration'] },
  { name: '领导力', category: 'general', aliases: ['领导力', 'leadership', '负责人'] },

];

const ALIAS_INDEX = [];
for (const skill of SKILLS) {
  for (const alias of skill.aliases) {
    ALIAS_INDEX.push({ skill, alias: alias.toLowerCase(), boundary: Boolean(skill.boundary) || /^[a-z0-9]{1,3}$/i.test(alias) });
  }
}

export function normalize(text = '') {
  return String(text)
    .replace(/\r\n?/g, '\n')
    .replace(/[\u00a0\u3000]/g, ' ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countAlias(text, alias, boundary) {
  if (!alias) return 0;
  const pureLatin = /^[a-z0-9]+$/i.test(alias);
  if (boundary || pureLatin) {
    const re = new RegExp('(^|[^a-z0-9])' + escapeRegExp(alias) + '(?=$|[^a-z0-9])', 'gi');
    return (text.match(re) || []).length;
  }
  let count = 0;
  let index = 0;
  while ((index = text.indexOf(alias, index)) !== -1) {
    count += 1;
    index += alias.length;
  }
  return count;
}

export function findSkills(text, options = {}) {
  const haystack = normalize(text).toLowerCase();
  if (!haystack) return [];
  const found = new Map();
  for (const entry of ALIAS_INDEX) {
    const count = countAlias(haystack, entry.alias, entry.boundary);
    if (!count) continue;
    const key = entry.skill.name;
    const current = found.get(key);
    if (current) {
      current.count = Math.max(current.count, count);
    } else {
      found.set(key, { name: entry.skill.name, category: entry.skill.category, count });
    }
  }
  const list = [...found.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  if (options.limit) return list.slice(0, options.limit);
  return list;
}

export function skillNames(text) {
  return findSkills(text).map((item) => item.name);
}

export function categoryLabel(category) {
  return CATEGORY_LABELS[category] || category;
}

export function groupSkills(skills) {
  const groups = new Map();
  for (const skill of skills) {
    const list = groups.get(skill.category) || [];
    list.push(skill);
    groups.set(skill.category, list);
  }
  return [...groups.entries()].map(([category, items]) => ({ category, label: categoryLabel(category), items }));
}

export function isKnownSkill(name) {
  return SKILLS.some((skill) => skill.name === name);
}

export const SKILL_NAMES = SKILLS.map((skill) => skill.name);

