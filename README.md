# 公众号排版设计器

一个可直接部署到 GitHub Pages 的免费微信公众号文章排版工具。

## 核心能力

- 浏览器内编辑公众号标题、摘要、正文和作者信息。
- 插入标题、正文、引用、提示、清单、图片占位和分割线。
- 插入本地图片、远程图片和视频卡片。
- 插入六宫格插图，用于产品卖点、步骤说明和案例拆解。
- 点击编辑区媒体块后，可在右侧面板更新当前图片、视频或六宫格卡片。
- 选择适配不同内容场景的排版主题。
- 使用主题选择器快速切换 12 套首发主题。
- 通过颜色选择器自定义主题色、浅底色和正文色。
- 使用模板资源库搜索并套用知识、商业、运营、品牌、社群等场景模板。
- 预览接近微信图文宽度的文章效果。
- 复制富文本到微信公众平台后台，或导出 HTML。
- 本地浏览器保存草稿，不上传用户内容。
- 提供基础 SEO：标题、描述、关键词、结构化数据、robots、sitemap。

## 本地运行

```bash
npm start
```

打开 `http://127.0.0.1:8791`。

## 质量检查

```bash
npm run lint
npm run test:e2e
npm run build
npm run test:dist
npm run test:live
```

`npm run test:e2e` 会启动本地服务，并调用 Chrome headless 执行真实浏览器烟测。macOS 默认使用：

```bash
/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
```

如果在其他环境运行，请先设置 `CHROME_PATH`。

`npm run build` 会生成 `dist/` 发布产物：源码模块会被打包为单个哈希文件，JS 会压缩并混淆，CSS 会压缩，不生成 sourcemap。`npm run test:dist` 会对当前 `dist/` 产物跑一次真实浏览器烟测，请先运行 `npm run build`。发布后运行 `npm run test:live` 验证 GitHub Pages 线上页面。

## GitHub Pages 部署

这是纯静态项目。当前建议把构建后的 `dist/` 内容提交到 `gh-pages` 分支，避免把源码目录直接作为 GitHub Pages 站点暴露：

1. Repository Settings
2. Pages
3. Build and deployment
4. Source 选择 `Deploy from a branch`
5. Branch 选择 `gh-pages` 和 `/root`
6. 每次发布前先运行 `npm run lint`、`npm run build`、`npm run test:e2e`、`npm run test:dist`
7. 将 `dist/` 内容提交到 `gh-pages` 分支并推送
8. 发布完成后运行 `npm run test:live`

当前免费域名为 `https://riverthrimp.github.io/gzh-layout-designer/`，已经写入 `index.html`、`robots.txt`、`sitemap.xml`。

## SEO 说明

项目已经做了技术基础，但“百度搜索第一”不能保证。真实排名还取决于域名历史、外链、内容质量、收录速度、用户行为、页面速度、竞争强度和持续更新。

建议后续补充：

- 独立域名和百度搜索资源平台验证。
- 多篇长尾关键词内容页，例如“公众号排版工具怎么用”“微信公众号编辑器免费推荐”。
- 可公开索引的模板库页面。
- 真实案例页和更新日志。
- 合规的广告合作页。

## 开源项目借鉴方向

- doocs/md：适合借鉴 Markdown 编辑、自定义主题、草稿管理和图床扩展边界。
- huasheng_editor：MIT 许可，适合借鉴多主题组织、图片本地处理和一键复制流程。
- md2wechat-skill：主题和结构化排版模块很完整，但偏商业许可，建议只借鉴产品分层，不直接复制代码或样式。
