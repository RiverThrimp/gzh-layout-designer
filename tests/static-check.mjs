import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [html, appJs, dataJs, utilsJs, css, robots, sitemap] = await Promise.all([
  read("index.html"),
  read("src/app.js"),
  read("src/data.js"),
  read("src/utils.js"),
  read("src/styles.css"),
  read("robots.txt"),
  read("sitemap.xml"),
]);

const js = appJs + "\n" + dataJs + "\n" + utilsJs;

[
  "package.json",
  ".gitignore",
  "server.mjs",
  "README.md",
  "index.html",
  "src/app.js",
  "src/data.js",
  "src/utils.js",
  "src/styles.css",
  "robots.txt",
  "sitemap.xml",
  "docs/2026-06-02-gzh-layout-designer.md",
  "docs/2026-06-03-quality-hardening.md",
  "docs/components/editor-workspace.md",
].forEach((file) => {
  assert.ok(existsSync(new URL(file, root)), `missing ${file}`);
});

assert.match(html, /公众号排版设计器_免费微信公众号编辑器/);
assert.match(html, /name="description"/);
assert.match(html, /application\/ld\+json/);
assert.match(html, /id="editor"/);
assert.match(html, /id="copy-button"/);
assert.match(html, /id="ad-enabled"/);
assert.match(html, /id="theme-select"/);
assert.match(html, /id="template-library"/);
assert.match(html, /id="template-search"/);
assert.match(html, /id="image-file"/);
assert.match(html, /id="insert-video-button"/);
assert.match(html, /id="insert-six-grid-button"/);
assert.match(html, /data-insert="code"/);
assert.match(html, /data-insert="table"/);
assert.match(html, /id="media-selection-status"/);
assert.match(html, /id="update-media-button"/);
assert.match(html, /id="length-check"/);
assert.match(html, /id="enrich-button"/);
assert.match(js, /buildArticleHtml/);
assert.match(js, /copyRichArticle/);
assert.match(js, /localStorage/);
assert.match(js, /ClipboardItem/);
assert.match(js, /applyCustomTheme/);
assert.match(js, /renderTemplateLibrary/);
assert.match(js, /insertLocalImage/);
assert.match(js, /videoNodeToWechatHtml/);
assert.match(js, /sanitizeMediaUrl/);
assert.match(js, /selectMediaNode/);
assert.match(js, /updateSelectedMedia/);
assert.match(js, /upsertImageBlock/);
assert.match(js, /sixGridNodeToWechatHtml/);
assert.match(js, /MIN_AD_TEXT_LENGTH/);
assert.match(js, /appendVisibleEnrichment/);
assert.match(js, /caseStudy/);
assert.match(js, /debouncedPushHistory/);
assert.match(js, /STATE_VERSION/);
assert.match(css, /template-library/);
assert.match(css, /figure\[data-kind="video"\]/);
assert.match(css, /data-kind="six-grid"/);
assert.match(css, /is-selected-media/);
assert.match(css, /length-check/);
assert.match(css, /@media \(max-width: 1260px\)/);
assert.match(robots, /Sitemap:/);
assert.match(sitemap, /<urlset/);

console.log("static-check passed");
