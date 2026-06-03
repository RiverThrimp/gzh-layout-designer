# 发布产物混淆加固记录

## 需求来源

用户确认项目已经发布到 GitHub Pages 免费域名后，要求提高前端代码安全性，增加别人逆向和直接复制源码的成本，并要求立即落地。

## 实现内容

- 新增 `scripts/build.mjs` 构建脚本。
- 引入开发依赖 `esbuild` 和 `javascript-obfuscator`。
- `npm run build` 从静态检查改为生成 `dist/` 发布产物。
- 发布 JS 从 `src/app.js` 入口打包为单个哈希文件。
- 发布 JS 启用压缩、变量名压缩、字符串数组和 base64 字符串混淆。
- 发布 CSS 压缩为哈希文件。
- 发布 HTML 改写为引用 `assets/app.<hash>.js` 和 `assets/styles.<hash>.css`。
- 构建时不生成 sourcemap。
- `dist/` 加入 `.gitignore`，避免提交构建产物。
- `server.mjs` 支持通过 `SERVE_DIR=dist` 服务发布产物。
- 新增 `npm run test:dist`，对当前 `dist/` 跑真实浏览器烟测。
- 发布策略改为 `gh-pages` 分支只提交 `dist/` 构建产物。
- 更新 README 的质量检查和 GitHub Pages 部署说明。

## Before / After

Before：GitHub Pages 直接发布 `main / root`，浏览器可以直接访问 `src/app.js`、`src/data.js`、`src/utils.js` 和未压缩 CSS。

After：GitHub Pages 改为发布 `gh-pages / root`。该分支只提交 `dist/` 构建产物，线上页面只引用哈希命名的压缩 CSS 和混淆 JS，不暴露源码模块路径，不生成 sourcemap。

## 影响范围

- 只改变构建、部署和测试流程。
- 不改变编辑器功能、模板数据、导出 HTML 逻辑、广告字数检测和本地保存行为。
- 本地开发仍可运行 `npm start` 查看源码版本。
- 发布前可运行 `npm run test:dist` 验证构建产物。

## 测试记录

- `npm run lint`：静态检查通过。
- `npm run build`：生成 `dist/index.html`、哈希 JS 和哈希 CSS，通过。
- `npm run test:e2e`：源码模式真实浏览器烟测通过。
- `npm run test:e2e -- --dist`：发布产物模式真实浏览器烟测通过。
- `npm run test:dist`：发布产物模式真实浏览器烟测通过。本地沙箱内监听端口受限，已按权限流程在沙箱外重跑通过。

## 已知风险

- 前端代码无法真正保密。混淆只能提高逆向成本，不能防止高能力攻击者还原运行逻辑。
- 若 GitHub Pages 仍配置为 `main / root`，线上仍会发布源码目录。需要在 Pages 设置中把 Source 切到 `gh-pages / root`。
- JS 混淆可能增加产物体积，并使线上调试更困难。

## 回滚方式

- 将 `package.json` 的 `build` 恢复为 `node tests/static-check.mjs`。
- 删除 `scripts/build.mjs` 和本记录文档。
- 删除 `package-lock.json` 并移除 `esbuild`、`javascript-obfuscator` 开发依赖。
- 将 README 的部署方式恢复为 `main / root` 分支部署说明。
