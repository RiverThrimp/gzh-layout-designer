export const STORAGE_KEY = "gzh-layout-designer-state";
export const MIN_AD_TEXT_LENGTH = 300;
export const STATE_VERSION = 2;

export const themes = {
  clean: {
    name: "清爽专业",
    group: "通用",
    desc: "适合知识科普、企业公告",
    accent: "#0f8b7f",
    soft: "#eef8f6",
    text: "#172126",
  },
  editorial: {
    name: "杂志专栏",
    group: "内容",
    desc: "适合观点文章、深度长文",
    accent: "#7c4d2d",
    soft: "#f7f0ea",
    text: "#1f1c19",
  },
  launch: {
    name: "产品发布",
    group: "商业",
    desc: "适合活动、产品介绍",
    accent: "#2f64d6",
    soft: "#eef3ff",
    text: "#151b2c",
  },
  tech: {
    name: "科技蓝",
    group: "行业",
    desc: "适合 AI、SaaS、开发者内容",
    accent: "#1f6feb",
    soft: "#edf5ff",
    text: "#15213a",
  },
  finance: {
    name: "金融绿",
    group: "行业",
    desc: "适合财经、投研、咨询报告",
    accent: "#1f7a4d",
    soft: "#edf7f1",
    text: "#16251d",
  },
  warm: {
    name: "暖橙转化",
    group: "商业",
    desc: "适合课程、训练营、服务转化",
    accent: "#c85d25",
    soft: "#fff1e8",
    text: "#2c211b",
  },
  red: {
    name: "醒目红",
    group: "运营",
    desc: "适合活动通知、节日营销",
    accent: "#d63b3b",
    soft: "#fff0f0",
    text: "#2b1c1c",
  },
  purple: {
    name: "创作者紫",
    group: "内容",
    desc: "适合个人 IP、灵感随笔",
    accent: "#7556c8",
    soft: "#f2efff",
    text: "#201b31",
  },
  minimal: {
    name: "极简灰",
    group: "通用",
    desc: "适合公告、周报、说明文",
    accent: "#4f5d64",
    soft: "#f1f3f4",
    text: "#1f262a",
  },
  gold: {
    name: "质感金",
    group: "品牌",
    desc: "适合品牌故事、高端服务",
    accent: "#a87924",
    soft: "#fbf4e4",
    text: "#241f16",
  },
  fresh: {
    name: "清新青",
    group: "生活",
    desc: "适合教育、健康、生活方式",
    accent: "#229e9d",
    soft: "#eaf8f7",
    text: "#162827",
  },
  custom: {
    name: "自定义",
    group: "自定义",
    desc: "使用下方颜色选择器生成",
    accent: "#0f8b7f",
    soft: "#eef8f6",
    text: "#172126",
  },
};

export const templates = {
  knowledge: {
    category: "knowledge",
    name: "知识科普",
    desc: "观点解释、方法拆解、行业科普",
    title: "一篇公众号文章如何排版更清楚",
    summary: "把开头、正文层级、重点提示和结尾行动统一整理，读者更容易读完。",
    html: `
      <h2>先给读者一个明确结论</h2>
      <p>公众号文章的排版不是堆样式，而是帮助读者快速判断这篇内容是否值得继续阅读。</p>
      <blockquote>好的排版应该让标题、重点、案例和行动建议一眼可见。</blockquote>
      <h2>正文保持稳定节奏</h2>
      <p>每个小节控制在 3 到 5 段，长句拆短，关键信息用提示块承接。</p>
      <section data-kind="tip">编辑建议：一屏内尽量只出现一个核心观点，避免连续堆叠复杂装饰。</section>
      <ul><li>标题负责分层</li><li>引用负责强调</li><li>清单负责降低理解成本</li></ul>
    `,
  },
  product: {
    category: "business",
    name: "产品介绍",
    desc: "SaaS、工具、服务方案介绍",
    title: "低成本搭建企业公众号内容系统",
    summary: "用模板化编辑、广告推荐卡和导出流程，把公众号内容生产做成稳定工作流。",
    html: `
      <h2>为什么企业需要标准化排版</h2>
      <p>企业公众号不仅要好看，还要稳定承接品牌表达、销售线索和用户教育。</p>
      <section data-kind="tip">适用场景：SaaS 产品更新、行业方案解读、客户案例复盘。</section>
      <h2>推荐的文章结构</h2>
      <ul><li>问题背景</li><li>解决方案</li><li>核心收益</li><li>行动入口</li></ul>
      <p>完成编辑后复制富文本到微信公众平台，再做最终校对和发布。</p>
    `,
  },
  news: {
    category: "operation",
    name: "活动通知",
    desc: "公开课、直播、沙龙、会议通知",
    title: "活动通知：本周内容增长公开课",
    summary: "面向新媒体编辑和企业市场团队，分享公众号排版、选题和转化路径。",
    html: `
      <h2>活动信息</h2>
      <p>时间：本周五 20:00。地点：线上直播间。</p>
      <p>对象：公众号运营、新媒体编辑、企业市场负责人。</p>
      <h2>你会获得什么</h2>
      <ul><li>一套可复用的文章结构</li><li>公众号广告位设计思路</li><li>低成本内容生产流程</li></ul>
      <blockquote>报名后请提前准备一篇正在编辑的公众号草稿。</blockquote>
    `,
  },
  caseStudy: {
    category: "business",
    name: "客户案例",
    desc: "B 端案例复盘、项目成果展示",
    title: "一个 B 端团队如何把内容转化率提升 32%",
    summary: "从问题背景、解决方案、执行过程和结果指标四个层次写清楚客户案例。",
    html: `
      <h2>客户背景</h2>
      <p>客户是一家成长型 SaaS 公司，公众号承担产品教育、线索收集和客户信任建设。</p>
      <h2>遇到的问题</h2>
      <ul><li>文章结构不稳定</li><li>读者看到中段容易流失</li><li>广告转化入口不统一</li></ul>
      <section data-kind="tip">关键动作：统一文章模板、固定行动入口、将案例结果前置。</section>
      <h2>结果复盘</h2>
      <p>上线后，文章平均阅读完成率和咨询点击率均有提升，后续持续按同一结构复用。</p>
    `,
  },
  interview: {
    category: "brand",
    name: "人物访谈",
    desc: "创始人访谈、专家观点、员工故事",
    title: "和一位内容负责人聊聊长期主义",
    summary: "用问答结构沉淀人物观点，让品牌表达更真实、更可信。",
    html: `
      <h2>为什么开始做这件事</h2>
      <p>最初的动机很简单：把复杂经验整理成更多人可以复用的方法。</p>
      <blockquote>真正能持续产生价值的内容，往往来自长期的一线观察。</blockquote>
      <h2>三个关键判断</h2>
      <ul><li>内容要服务具体用户</li><li>表达要有可验证经验</li><li>结尾要给出下一步行动</li></ul>
    `,
  },
  listicle: {
    category: "knowledge",
    name: "清单合集",
    desc: "工具推荐、书单、资料包、方法清单",
    title: "新媒体编辑常用的 7 个排版检查点",
    summary: "发布前按清单快速检查标题、摘要、层级、重点、图片和行动入口。",
    html: `
      <h2>发布前检查</h2>
      <ul><li>标题是否清楚说明收益</li><li>摘要是否交代文章价值</li><li>每个小节是否只有一个重点</li><li>图片说明是否完整</li></ul>
      <section data-kind="tip">建议：把这份清单保存为团队 SOP，减少反复返工。</section>
      <h2>最后一步</h2>
      <p>复制到微信后台后，再用手机预览检查行距、广告卡片和链接是否正常。</p>
    `,
  },
  newsletter: {
    category: "brand",
    name: "周报月报",
    desc: "品牌动态、产品进展、团队月报",
    title: "本月内容增长复盘",
    summary: "用固定栏目记录进展、数据、问题和下月重点。",
    html: `
      <h2>本月关键进展</h2>
      <p>完成了内容模板梳理、广告位统一和公众号编辑流程优化。</p>
      <h2>数据观察</h2>
      <ul><li>高完成率文章通常结构更短</li><li>案例类内容更容易带来咨询</li><li>标题需要明确目标读者</li></ul>
      <h2>下月计划</h2>
      <p>继续补齐模板库，并用真实文章验证每套模板的转化表现。</p>
    `,
  },
  course: {
    category: "business",
    name: "课程转化",
    desc: "训练营、咨询服务、资料包售卖",
    title: "7 天搭建公众号内容转化系统",
    summary: "面向企业市场和新媒体编辑，用一套模板完成选题、排版和转化承接。",
    html: `
      <h2>这门课解决什么问题</h2>
      <p>很多团队不是不会写，而是缺少稳定的结构、样式和转化入口。</p>
      <section data-kind="tip">适合人群：企业市场、新媒体运营、个人知识服务创作者。</section>
      <h2>你会获得</h2>
      <ul><li>公众号文章结构模板</li><li>广告位和行动入口设计</li><li>可复用的发布检查清单</li></ul>
    `,
  },
  recruitment: {
    category: "operation",
    name: "招聘启事",
    desc: "团队招聘、合伙人招募、项目招募",
    title: "我们正在寻找一位内容运营伙伴",
    summary: "用清楚的岗位信息、团队介绍和投递方式提高招聘转化。",
    html: `
      <h2>我们是谁</h2>
      <p>我们正在做一个面向公众号创作者的低成本排版和内容生产工具。</p>
      <h2>你会负责</h2>
      <ul><li>整理模板库和内容案例</li><li>维护公众号更新节奏</li><li>跟踪用户反馈并优化产品文案</li></ul>
      <h2>如何投递</h2>
      <p>请发送简历、作品和你最满意的一篇公众号文章。</p>
    `,
  },
  privateDomain: {
    category: "community",
    name: "社群招募",
    desc: "私域引流、社群共创、会员招募",
    title: "加入公众号排版共创群",
    summary: "面向新媒体编辑和独立创作者，一起打磨可复用的公众号模板库。",
    html: `
      <h2>这个社群适合谁</h2>
      <p>如果你经常写公众号，又希望减少排版时间，这个社群适合你。</p>
      <h2>你可以获得</h2>
      <ul><li>每周新增模板</li><li>真实文章改版案例</li><li>工具更新优先体验</li></ul>
      <blockquote>我们更关注稳定产出，而不是一次性的花哨样式。</blockquote>
    `,
  },
  announcement: {
    category: "operation",
    name: "公告声明",
    desc: "产品公告、服务变更、品牌声明",
    title: "服务更新公告",
    summary: "用明确结构说明变化范围、影响用户、处理方式和联系方式。",
    html: `
      <h2>更新内容</h2>
      <p>我们对公众号排版设计器的模板库、主题选择器和导出流程做了升级。</p>
      <h2>影响范围</h2>
      <p>已有草稿仍保存在本地浏览器，复制和导出功能保持不变。</p>
      <section data-kind="tip">如遇到样式显示异常，请先刷新页面并重新复制到微信后台。</section>
    `,
  },
  brandStory: {
    category: "brand",
    name: "品牌故事",
    desc: "品牌理念、产品初心、年度叙事",
    title: "为什么我们要做一个低成本公众号排版工具",
    summary: "把产品初心、用户痛点和长期路线讲清楚，为品牌建立可信表达。",
    html: `
      <h2>从一个真实问题开始</h2>
      <p>很多创作者写完文章后，还要花大量时间处理排版、广告位和导出细节。</p>
      <h2>我们的判断</h2>
      <blockquote>好工具应该把重复劳动降到最低，把时间还给内容本身。</blockquote>
      <h2>下一步</h2>
      <p>继续补齐模板库、样式库和广告组件，让团队可以快速低成本发布内容。</p>
    `,
  },
};

export const sixGridItems = [
  { title: "写作", desc: "把选题和大纲先定下来", color: "#0f8b7f", icon: "01" },
  { title: "排版", desc: "标题、引用、清单统一风格", color: "#1f6feb", icon: "02" },
  { title: "插图", desc: "六宫格承接核心卖点", color: "#c85d25", icon: "03" },
  { title: "广告", desc: "赞助卡片自然进入正文", color: "#7556c8", icon: "04" },
  { title: "复制", desc: "一键复制到公众号后台", color: "#1f7a4d", icon: "05" },
  { title: "发布", desc: "手机预览后完成发布", color: "#a87924", icon: "06" },
];
