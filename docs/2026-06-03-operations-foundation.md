# 运营基础能力落地记录

## 需求来源

用户希望按照运营建议推进，让网站可以实际给用户使用，并作为后续自媒体内容增长入口。

## 实现内容

- 首页顶部新增教程、模板、更新日志和反馈入口。
- 首页 SEO 区新增内部链接，连接教程、模板库和更新日志。
- 新增教程页：
  - `guides/copy-to-wechat.html`
  - `guides/wechat-layout-tips.html`
- 新增模板内容页：
  - `templates/index.html`
  - `templates/product-launch.html`
  - `templates/course-conversion.html`
- 新增更新日志页：
  - `changelog/index.html`
- 新增内容页通用样式。
- `sitemap.xml` 增加新增内容页地址。
- 构建脚本支持将 `guides/`、`templates/`、`changelog/` 复制到 `dist/` 并替换为构建后的 CSS。

## Before / After

Before：网站只有工具首页，用户可以使用工具，但缺少反馈入口、教程入口和可持续收录的内容页。

After：网站具备基础运营入口，用户可以查看教程、模板和更新日志，也可以通过邮件反馈问题。搜索引擎可以发现更多长尾内容页。

## 影响范围

- 修改首页导航和 SEO 区。
- 新增静态内容页和样式。
- 修改构建脚本和 sitemap。
- 不改变编辑器核心逻辑、复制导出逻辑和 GitHub Pages 发布策略。

## 测试记录

- `npm run lint`：静态检查通过。
- `npm run test:e2e`：本地真实浏览器烟测通过，覆盖首页、内容页和响应式断点。
- `npm run build`：构建通过，内容页复制到 `dist/` 并替换为构建后的哈希 CSS。
- `npm run test:dist`：发布产物真实浏览器烟测通过。
- `npm run test:live`：线上真实浏览器烟测通过，覆盖 GitHub Pages 首页、教程页、模板页、更新日志和源码路径 404。

## 已知风险

- 反馈入口暂时使用邮件，不如表单稳定；后续可替换为飞书表单、腾讯问卷或自建反馈接口。
- 当前没有接入访问统计；需要后续选择 Umami、Plausible 或自建事件上报。
- 内容页只是首批种子内容，后续需要持续扩展长尾教程和模板案例。

## 回滚方式

- 删除新增的 `guides/`、`templates/`、`changelog/` 目录。
- 恢复 `index.html` 顶部导航和 SEO 区。
- 恢复 `src/styles.css` 内容页样式。
- 恢复 `scripts/build.mjs` 和 `sitemap.xml`。
