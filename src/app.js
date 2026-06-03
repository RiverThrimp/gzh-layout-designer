import {
  debounce,
  escapeHtml,
  escapeAttribute,
  sanitizeText,
  sanitizeUrl,
  sanitizeMediaUrl,
  slugify,
} from "./utils.js";
import {
  STORAGE_KEY,
  MIN_AD_TEXT_LENGTH,
  STATE_VERSION,
  themes,
  templates,
  sixGridItems,
} from "./data.js";

const els = {
  title: document.querySelector("#article-title"),
  author: document.querySelector("#article-author"),
  date: document.querySelector("#article-date"),
  summary: document.querySelector("#article-summary"),
  editor: document.querySelector("#editor"),
  preview: document.querySelector("#wechat-preview"),
  wordCount: document.querySelector("#word-count"),
  themeSelect: document.querySelector("#theme-select"),
  themeList: document.querySelector("#theme-list"),
  customAccent: document.querySelector("#custom-accent"),
  customSoft: document.querySelector("#custom-soft"),
  customText: document.querySelector("#custom-text"),
  applyCustomTheme: document.querySelector("#apply-custom-theme"),
  templateSearch: document.querySelector("#template-search"),
  templateCategory: document.querySelector("#template-category"),
  templateCount: document.querySelector("#template-count"),
  templateLibrary: document.querySelector("#template-library"),
  mediaSelectionStatus: document.querySelector("#media-selection-status"),
  imageFile: document.querySelector("#image-file"),
  imageUrl: document.querySelector("#image-url"),
  imageCaption: document.querySelector("#image-caption"),
  insertImage: document.querySelector("#insert-image-button"),
  updateMedia: document.querySelector("#update-media-button"),
  clearMediaSelection: document.querySelector("#clear-media-selection-button"),
  videoTitle: document.querySelector("#video-title"),
  videoUrl: document.querySelector("#video-url"),
  videoCover: document.querySelector("#video-cover"),
  insertVideo: document.querySelector("#insert-video-button"),
  insertSixGrid: document.querySelector("#insert-six-grid-button"),
  adBrand: document.querySelector("#ad-brand"),
  adCopy: document.querySelector("#ad-copy"),
  adLink: document.querySelector("#ad-link"),
  adEnabled: document.querySelector("#ad-enabled"),
  lengthCheck: document.querySelector("#length-check"),
  enrichButton: document.querySelector("#enrich-button"),
  status: document.querySelector("#status-message"),
  toast: document.querySelector("#toast"),
};

let activeTheme = "clean";
let toastTimer = null;
let selectedMediaNode = null;

let undoStack = [];
let redoStack = [];
let debouncedRenderPreview;
let debouncedAutoSave;
let debouncedPushHistory;

init();

function init() {
  els.date.value = new Date().toISOString().slice(0, 10);
  renderThemes();
  renderTemplateLibrary();
  restoreState();
  if (!els.editor.innerHTML.trim()) {
    applyTemplate("knowledge", false);
  }
  undoStack = [snapshotEditor()];
  redoStack = [];
  debouncedRenderPreview = debounce(renderPreviewCore, 150);
  debouncedAutoSave = debounce(() => {
    saveState(false);
    els.status.textContent = "已自动保存";
  }, 2000);
  debouncedPushHistory = debounce(pushHistory, 500);
  bindEvents();
  renderPreviewCore();
}

function bindEvents() {
  document.querySelector("#sample-button").addEventListener("click", () => applyTemplate("knowledge"));
  document.querySelector("#save-button").addEventListener("click", () => saveState(true));
  document.querySelector("#copy-button").addEventListener("click", copyRichArticle);
  document.querySelector("#copy-html-button").addEventListener("click", copyHtmlSource);
  document.querySelector("#download-button").addEventListener("click", downloadHtml);
  document.querySelector("#clear-button").addEventListener("click", clearDraft);
  els.enrichButton.addEventListener("click", appendVisibleEnrichment);
  els.themeSelect.addEventListener("change", () => setActiveTheme(els.themeSelect.value));
  els.applyCustomTheme.addEventListener("click", applyCustomTheme);
  els.templateSearch.addEventListener("input", renderTemplateLibrary);
  els.templateCategory.addEventListener("change", renderTemplateLibrary);
  els.insertImage.addEventListener("click", insertImageFromPanel);
  els.updateMedia.addEventListener("click", updateSelectedMedia);
  els.clearMediaSelection.addEventListener("click", clearMediaSelection);
  els.insertVideo.addEventListener("click", insertVideoFromPanel);
  els.insertSixGrid.addEventListener("click", () => {
    insertSixGridBlock({ append: true });
    setStatus("已插入六宫格");
  });
  els.imageFile.addEventListener("change", insertLocalImage);
  els.editor.addEventListener("click", handleEditorClick);

  els.editor.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      pushHistory();
      undo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
      e.preventDefault();
      redo();
    }
  });

  document.querySelectorAll("[data-insert]").forEach((button) => {
    button.addEventListener("mousedown", (e) => e.preventDefault());
    button.addEventListener("click", () => insertBlock(button.dataset.insert));
  });

  document.querySelectorAll("[data-size]").forEach((button) => {
    button.addEventListener("click", () => {
      document
        .querySelectorAll("[data-size]")
        .forEach((item) => item.classList.toggle("is-active", item === button));
      els.preview.classList.toggle("phone-preview", button.dataset.size === "phone");
      els.preview.classList.toggle("wide-preview", button.dataset.size === "wide");
    });
  });

  [
    els.title,
    els.author,
    els.date,
    els.summary,
    els.editor,
    els.adBrand,
    els.adCopy,
    els.adLink,
    els.adEnabled,
    els.customAccent,
    els.customSoft,
    els.customText,
  ].forEach((item) =>
    item.addEventListener("input", () => {
      if (item === els.editor) {
        debouncedPushHistory();
      }
      debouncedRenderPreview();
      debouncedAutoSave();
    }),
  );
}

function snapshotEditor() {
  return els.editor.innerHTML;
}

function pushHistory() {
  const state = snapshotEditor();
  if (undoStack.length > 0 && undoStack[undoStack.length - 1] === state) return;
  undoStack.push(state);
  if (undoStack.length > 50) undoStack.shift();
  redoStack = [];
}

function undo() {
  if (undoStack.length <= 1) {
    setStatus("没有可撤销的操作");
    return;
  }
  redoStack.push(undoStack.pop());
  els.editor.innerHTML = undoStack[undoStack.length - 1];
  clearMediaSelection(false);
  renderPreviewCore();
  setStatus("已撤销");
  debouncedAutoSave();
}

function redo() {
  if (!redoStack.length) {
    setStatus("没有可重做的操作");
    return;
  }
  const state = redoStack.pop();
  undoStack.push(state);
  els.editor.innerHTML = state;
  clearMediaSelection(false);
  renderPreviewCore();
  setStatus("已重做");
  debouncedAutoSave();
}

function handleEditorClick(event) {
  const media = event.target.closest("figure, [data-kind='six-grid'], [data-grid-card]");
  if (!media || !els.editor.contains(media)) return;
  const node = media.matches("[data-grid-card]") ? media : media.closest("figure, [data-kind='six-grid']");
  selectMediaNode(node);
}

function selectMediaNode(node) {
  clearMediaSelection(false);
  selectedMediaNode = node;
  selectedMediaNode.classList.add("is-selected-media");
  hydrateMediaPanel(node);
  renderMediaSelectionStatus();
}

function clearMediaSelection(notify = true) {
  if (selectedMediaNode) {
    selectedMediaNode.classList.remove("is-selected-media");
  }
  selectedMediaNode = null;
  renderMediaSelectionStatus();
  if (notify) setStatus("已取消媒体选择");
}

function hydrateMediaPanel(node) {
  const kind = getMediaKind(node);
  if (kind === "image") {
    const image = node.querySelector("img");
    els.imageUrl.value = image?.getAttribute("src") || "";
    els.imageCaption.value = node.querySelector("figcaption")?.textContent.trim() || image?.getAttribute("alt") || "";
  }
  if (kind === "video") {
    const image = node.querySelector("img");
    els.videoTitle.value = node.querySelector("figcaption")?.textContent.trim() || "";
    els.videoUrl.value = node.dataset.url || "";
    els.videoCover.value = image?.getAttribute("src") || "";
  }
  if (kind === "grid-card") {
    const image = node.querySelector("img");
    els.imageUrl.value = image?.getAttribute("src") || "";
    els.imageCaption.value = node.querySelector("strong")?.textContent.trim() || "";
  }
}

function renderMediaSelectionStatus() {
  const kind = getMediaKind(selectedMediaNode);
  const labels = {
    image: "已选中图片",
    video: "已选中视频卡片",
    "six-grid": "已选中六宫格",
    "grid-card": "已选中六宫格卡片",
  };
  els.mediaSelectionStatus.textContent = labels[kind] || "未选中媒体块";
  els.insertImage.textContent = kind === "image" || kind === "grid-card" ? "更新图片" : "插入图片";
}

function getMediaKind(node) {
  if (!node || !isEditorNode(node)) return "";
  if (node.matches?.("[data-grid-card]")) return "grid-card";
  if (node.dataset?.kind === "video") return "video";
  if (node.dataset?.kind === "six-grid") return "six-grid";
  if (node.dataset?.kind === "image" || node.tagName?.toLowerCase() === "figure") return "image";
  return "";
}

function isEditorNode(node) {
  return Boolean(node?.isConnected && els.editor.contains(node));
}

function renderThemes() {
  els.themeSelect.innerHTML = "";
  els.themeList.innerHTML = "";
  Object.entries(themes).forEach(([key, theme]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = `${theme.group} · ${theme.name}`;
    option.selected = key === activeTheme;
    els.themeSelect.appendChild(option);

    const button = document.createElement("button");
    button.type = "button";
    button.className = `theme-card${key === activeTheme ? " is-active" : ""}`;
    button.innerHTML = `
      <span class="swatch" style="background:${theme.accent}"></span>
      <span><strong>${escapeHtml(theme.name)}</strong><small>${escapeHtml(theme.desc)}</small></span>
    `;
    button.addEventListener("click", () => {
      setActiveTheme(key);
    });
    els.themeList.appendChild(button);
  });
  syncCustomThemeFields();
}

function setActiveTheme(key) {
  activeTheme = themes[key] ? key : "clean";
  renderThemes();
  renderPreviewCore();
  saveState(false);
}

function applyCustomTheme() {
  themes.custom = {
    ...themes.custom,
    accent: els.customAccent.value,
    soft: els.customSoft.value,
    text: els.customText.value,
  };
  setActiveTheme("custom");
  setStatus("已应用自定义主题");
}

function syncCustomThemeFields() {
  const theme = themes[activeTheme] || themes.clean;
  els.customAccent.value = theme.accent;
  els.customSoft.value = theme.soft;
  els.customText.value = theme.text;
}

function renderTemplateLibrary() {
  const keyword = els.templateSearch.value.trim().toLowerCase();
  const category = els.templateCategory.value;
  const list = Object.entries(templates).filter(([, template]) => {
    const categoryMatched = category === "all" || template.category === category;
    const text = `${template.name} ${template.desc} ${template.title} ${template.summary}`.toLowerCase();
    return categoryMatched && (!keyword || text.includes(keyword));
  });

  els.templateCount.textContent = `${list.length} 个模板`;
  els.templateLibrary.innerHTML = "";
  list.forEach(([key, template]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "template-card";
    button.innerHTML = `
      <span>${escapeHtml(template.name)}</span>
      <strong>${escapeHtml(template.title)}</strong>
      <small>${escapeHtml(template.desc)}</small>
    `;
    button.addEventListener("click", () => applyTemplate(key));
    els.templateLibrary.appendChild(button);
  });
}

function applyTemplate(key, notify = true) {
  const template = templates[key] || templates.knowledge;
  els.title.value = template.title;
  els.summary.value = template.summary;
  els.editor.innerHTML = normalizeEditorHtml(template.html);
  pushHistory();
  renderPreviewCore();
  if (notify) showToast("已套用模板");
}

function insertBlock(type) {
  const blocks = {
    h2: "<h2>新的小标题</h2>",
    p: "<p>在这里输入正文内容。</p>",
    quote: "<blockquote>这里是一句需要强调的观点。</blockquote>",
    tip: '<section data-kind="tip">提示：这里写重点信息、行动建议或注意事项。</section>',
    list: "<ul><li>第一条要点</li><li>第二条要点</li><li>第三条要点</li></ul>",
    image:
      '<figure data-kind="image"><div>图片占位：粘贴到微信后台前替换为正式图片</div><figcaption>图片说明</figcaption></figure>',
    video:
      '<figure data-kind="video" data-url="https://mp.weixin.qq.com/"><div>视频封面占位</div><figcaption>视频标题</figcaption></figure>',
    sixgrid: buildSixGridHtml(sixGridItems),
    divider: "<hr />",
    code: '<div data-kind="code"><code>// 在这里粘贴代码</code></div>',
    table:
      '<table data-kind="table"><tr><th>表头 1</th><th>表头 2</th></tr><tr><td>内容 1</td><td>内容 2</td></tr></table>',
  };
  insertEditorHtml(blocks[type] || blocks.p);
}

function renderPreviewCore() {
  if (selectedMediaNode && !isEditorNode(selectedMediaNode)) {
    clearMediaSelection(false);
  }
  const html = buildArticleHtml();
  els.preview.innerHTML = html;
  const textLength = getVisibleArticleLength();
  els.wordCount.textContent = `${textLength} 字`;
  renderLengthCheck(textLength);
}

function getVisibleArticleLength() {
  const text = [els.title.value, els.summary.value, els.editor.innerText].join("");
  return text.replace(/\s/g, "").length;
}

function renderLengthCheck(textLength) {
  const ready = textLength >= MIN_AD_TEXT_LENGTH;
  els.lengthCheck.textContent = `正文可见字数：${textLength} / ${MIN_AD_TEXT_LENGTH}`;
  els.lengthCheck.classList.toggle("is-ready", ready);
  els.lengthCheck.classList.toggle("is-warning", !ready && els.adEnabled.checked);
}

function buildArticleHtml() {
  const theme = themes[activeTheme];
  const title = escapeHtml(els.title.value.trim() || "未命名文章");
  const author = escapeHtml(els.author.value.trim() || "作者");
  const date = escapeHtml(els.date.value || new Date().toISOString().slice(0, 10));
  const summary = escapeHtml(els.summary.value.trim());
  const bodyHtml = editorToWechatHtml(theme);
  const adHtml = els.adEnabled.checked ? buildAdHtml(theme) : "";

  return `
    <section style="max-width:677px;margin:0 auto;color:${theme.text};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;">
      <h1 style="margin:0 0 12px;font-size:24px;line-height:1.35;font-weight:800;color:${theme.text};">${title}</h1>
      <p style="margin:0 0 18px;font-size:13px;line-height:1.7;color:#7a858c;">${author} · ${date}</p>
      ${
        summary
          ? `<p style="margin:0 0 22px;padding:12px 14px;border-radius:6px;background:${theme.soft};font-size:15px;line-height:1.8;color:${theme.text};">${summary}</p>`
          : ""
      }
      ${bodyHtml}
      ${adHtml}
    </section>
  `;
}

function editorToWechatHtml(theme) {
  const container = document.createElement("div");
  container.innerHTML = normalizeEditorHtml(els.editor.innerHTML);
  container.querySelectorAll("script,style,iframe,object").forEach((node) => node.remove());
  const html = Array.from(container.childNodes)
    .map((node) => nodeToWechatHtml(node, theme))
    .join("");
  return html || `<p style="${paragraphStyle()}">正文待补充。</p>`;
}

function nodeToWechatHtml(node, theme) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent.trim();
    return text ? `<p style="${paragraphStyle()}">${escapeHtml(text)}</p>` : "";
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const tag = node.tagName.toLowerCase();

  if (tag === "h2") {
    return `<h2 style="margin:28px 0 12px;padding-left:12px;border-left:4px solid ${theme.accent};font-size:20px;line-height:1.45;color:${theme.text};">${innerInline(node, theme)}</h2>`;
  }
  if (tag === "blockquote") {
    return `<blockquote style="margin:18px 0;padding:12px 14px;border-left:4px solid ${theme.accent};background:${theme.soft};font-size:15px;line-height:1.9;color:${theme.text};">${innerInline(node, theme)}</blockquote>`;
  }
  if (tag === "ul" || tag === "ol") {
    const items = Array.from(node.querySelectorAll("li"))
      .map((li) => `<li style="margin:6px 0;">${innerInline(li, theme)}</li>`)
      .join("");
    return `<ul style="margin:16px 0;padding-left:24px;font-size:15px;line-height:1.9;color:${theme.text};">${items}</ul>`;
  }
  if (tag === "hr") {
    return `<p style="margin:26px 0;border-top:1px solid #d9e1e4;height:1px;line-height:1px;"></p>`;
  }
  if (node.dataset?.kind === "six-grid") {
    return sixGridNodeToWechatHtml(node, theme);
  }
  if (tag === "figure" && node.dataset?.kind === "video") {
    return videoNodeToWechatHtml(node, theme);
  }
  if (tag === "figure") {
    return imageNodeToWechatHtml(node, theme);
  }
  if (tag === "img") {
    const src = sanitizeMediaUrl(node.getAttribute("src"));
    if (!src) return "";
    return `<p style="margin:18px 0;text-align:center;"><img src="${escapeAttribute(src)}" alt="${escapeAttribute(node.getAttribute("alt") || "")}" style="max-width:100%;height:auto;border-radius:6px;display:block;margin:0 auto;"/></p>`;
  }
  if (tag === "video" || tag === "iframe") {
    return `<section style="margin:18px 0;padding:24px 16px;border:1px dashed ${theme.accent};border-radius:6px;text-align:center;background:#fbfcfc;color:#7a858c;font-size:14px;">图片占位<br/><span style="font-size:12px;">发布前请在微信后台替换为正式图片</span></section>`;
  }
  if (node.dataset?.kind === "tip") {
    return `<section style="margin:18px 0;padding:14px 16px;border-radius:6px;background:${theme.soft};border:1px solid ${theme.accent};font-size:15px;line-height:1.85;color:${theme.text};">${innerInline(node, theme)}</section>`;
  }
  if (node.dataset?.kind === "code") {
    const codeText = node.querySelector("code")?.textContent ?? node.textContent;
    return `<pre style="margin:18px 0;padding:14px 16px;border-radius:6px;background:#f4f6f8;border:1px solid #e1e5e9;font-size:14px;line-height:1.7;overflow-x:auto;color:${theme.text};font-family:monospace;">${escapeHtml(codeText.trim())}</pre>`;
  }
  if (tag === "table") {
    const rows = Array.from(node.querySelectorAll("tr"))
      .map((tr) => {
        const cells = Array.from(tr.children)
          .map((cell) => {
            const cellTag = cell.tagName.toLowerCase();
            const style =
              cellTag === "th"
                ? `padding:10px 12px;background:${theme.soft};font-weight:700;border-bottom:2px solid ${theme.accent};text-align:left;`
                : `padding:10px 12px;border-bottom:1px solid #e1e5e9;`;
            return `<${cellTag} style="${style}">${innerInline(cell, theme)}</${cellTag}>`;
          })
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");
    return `<table style="width:100%;border-collapse:collapse;margin:18px 0;font-size:14px;line-height:1.7;color:${theme.text};">${rows}</table>`;
  }
  if (tag === "p" || tag === "div" || tag === "section") {
    return `<p style="${paragraphStyle()}">${innerInline(node, theme)}</p>`;
  }

  return `<p style="${paragraphStyle()}">${sanitizeText(node.textContent)}</p>`;
}

function innerInline(node, theme) {
  const parts = [];
  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent.replace(/\n/g, " ");
      if (text) parts.push(escapeHtml(text));
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const tag = child.tagName.toLowerCase();
      if (tag === "br") {
        parts.push("<br/>");
      } else if (tag === "strong" || tag === "b") {
        parts.push(`<strong>${innerInline(child, theme)}</strong>`);
      } else if (tag === "em" || tag === "i") {
        parts.push(`<em>${innerInline(child, theme)}</em>`);
      } else if (tag === "a") {
        const href = sanitizeUrl(child.getAttribute("href"));
        parts.push(`<a href="${href}" style="color:${theme.accent};text-decoration:none;">${innerInline(child, theme)}</a>`);
      } else if (tag === "span" || tag === "code") {
        parts.push(innerInline(child, theme));
      } else {
        parts.push(escapeHtml(child.textContent));
      }
    }
  }
  return parts.join("") || "";
}

function sixGridNodeToWechatHtml(node, theme) {
  const cards = Array.from(node.querySelectorAll("[data-grid-card]"));
  if (!cards.length) return "";

  const rows = [];
  for (let i = 0; i < cards.length; i += 2) {
    const pair = cards.slice(i, i + 2);
    const cells = pair
      .map((card) => {
        const image = card.querySelector("img");
        const title = card.querySelector("strong")?.textContent.trim() || "";
        const desc = card.querySelector("span")?.textContent.trim() || "";
        const src = sanitizeMediaUrl(image?.getAttribute("src"));

        const imageHtml = src
          ? `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(title)}" style="width:100%;height:auto;border-radius:6px;display:block;margin:0 0 8px;"/>`
          : `<p style="margin:0 0 8px;padding:22px 8px;border-radius:6px;background:${theme.soft};color:#7a858c;text-align:center;">${escapeHtml(title || "图片占位")}</p>`;

        return `
          <td style="width:50%;padding:8px;vertical-align:top;font-size:14px;line-height:1.6;">
            ${imageHtml}
            <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:${theme.text};line-height:1.45;">${escapeHtml(title)}</p>
            <p style="margin:0;font-size:12px;color:#7a858c;line-height:1.55;">${escapeHtml(desc)}</p>
          </td>
        `;
      })
      .join("");

    const fillCell = pair.length === 1 ? '<td style="width:50%;padding:8px;"></td>' : "";
    rows.push(`<tr>${cells}${fillCell}</tr>`);
  }

  return `
    <table style="width:100%;border-collapse:collapse;margin:20px 0;background:${theme.soft};">
      <tbody>${rows.join("")}</tbody>
    </table>
  `;
}

function imageNodeToWechatHtml(node, theme) {
  const image = node.querySelector("img");
  const caption = node.querySelector("figcaption")?.textContent.trim() || "";
  const src = sanitizeMediaUrl(image?.getAttribute("src"));
  if (!src) {
    return `<section style="margin:18px 0;padding:24px 16px;border:1px dashed ${theme.accent};border-radius:6px;text-align:center;background:#fbfcfc;color:#7a858c;font-size:14px;">图片占位<br/><span style="font-size:12px;">发布前请在微信后台替换为正式图片</span></section>`;
  }

  return `
    <section style="margin:18px 0;text-align:center;">
      <img src="${escapeAttribute(src)}" alt="${escapeAttribute(caption)}" style="max-width:100%;height:auto;border-radius:6px;display:block;margin:0 auto;"/>
      ${
        caption
          ? `<p style="margin:8px 0 0;font-size:12px;line-height:1.6;color:#7a858c;text-align:center;">${escapeHtml(caption)}</p>`
          : ""
      }
    </section>
  `;
}

function videoNodeToWechatHtml(node, theme) {
  const title = node.querySelector("figcaption")?.textContent.trim() || "视频内容";
  const url = sanitizeUrl(node.dataset.url || node.querySelector("a")?.getAttribute("href"));
  const cover = sanitizeMediaUrl(node.querySelector("img")?.getAttribute("src"));
  const coverHtml = cover
    ? `<img src="${escapeAttribute(cover)}" alt="${escapeAttribute(title)}" style="width:100%;height:auto;border-radius:6px;display:block;margin:0 0 10px;"/>`
    : `<p style="margin:0 0 10px;padding:26px 16px;border-radius:6px;background:#ffffff;color:#7a858c;text-align:center;">视频封面占位</p>`;

  return `
    <section style="margin:20px 0;padding:14px;border-radius:6px;border:1px solid ${theme.accent};background:${theme.soft};">
      ${coverHtml}
      <p style="margin:0 0 8px;font-size:16px;font-weight:700;line-height:1.5;color:${theme.text};">${escapeHtml(title)}</p>
      <p style="margin:0 0 10px;font-size:13px;line-height:1.7;color:#7a858c;">视频需要在微信公众平台后台确认插入，当前导出为可点击视频卡片。</p>
      <a href="${url}" style="color:${theme.accent};font-size:14px;text-decoration:none;">打开视频链接</a>
    </section>
  `;
}

function buildAdHtml(theme) {
  const brand = escapeHtml(els.adBrand.value.trim() || "赞助推荐");
  const copy = escapeHtml(els.adCopy.value.trim() || "这里展示 B 端广告合作内容。");
  const link = sanitizeUrl(els.adLink.value);
  return `
    <section style="margin:30px 0 0;padding:16px;border-radius:6px;border:1px solid ${theme.accent};background:${theme.soft};">
      <p style="margin:0 0 6px;font-size:12px;color:#7a858c;line-height:1.6;">赞助推荐</p>
      <p style="margin:0 0 8px;font-size:17px;font-weight:700;line-height:1.5;color:${theme.text};">${brand}</p>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.8;color:${theme.text};">${copy}</p>
      <a href="${link}" style="color:${theme.accent};font-size:14px;text-decoration:none;">了解合作方案</a>
    </section>
  `;
}

function appendVisibleEnrichment() {
  const additions = [
    "<h2>补充说明</h2>",
    "<p>为了让读者更清楚地理解这套公众号排版工作流，建议在正式发布前补充使用场景、适合人群和落地步骤。这样既能提升文章完整度，也能让后续广告推荐更自然地承接正文内容。</p>",
    "<p>实际使用时，可以先完成标题和摘要，再用六宫格展示核心能力，最后把广告卡片放在总结之后。读者读完正文后再看到商业推荐，接受度会更高，转化路径也更清晰。</p>",
  ].join("");
  insertEditorHtml(additions, { append: true });
  setStatus("已追加可见补充说明");
}

function insertSixGridBlock(options = {}) {
  insertEditorHtml(buildSixGridHtml(sixGridItems), options);
}

function buildSixGridHtml(items) {
  return `
    <section data-kind="six-grid">
      ${items
        .map(
          (item) => `
            <section data-grid-card>
              <img src="${escapeAttribute(buildIllustrationDataUrl(item))}" alt="${escapeAttribute(item.title)}" />
              <strong>${escapeHtml(item.title)}</strong>
              <span>${escapeHtml(item.desc)}</span>
            </section>
          `,
        )
        .join("")}
    </section>
  `;
}

function buildIllustrationDataUrl(item) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="420" height="300" viewBox="0 0 420 300">
      <rect width="420" height="300" rx="28" fill="${item.color}"/>
      <circle cx="330" cy="72" r="48" fill="rgba(255,255,255,0.22)"/>
      <circle cx="92" cy="232" r="66" fill="rgba(255,255,255,0.16)"/>
      <rect x="48" y="54" width="188" height="28" rx="14" fill="rgba(255,255,255,0.38)"/>
      <rect x="48" y="104" width="286" height="22" rx="11" fill="rgba(255,255,255,0.28)"/>
      <rect x="48" y="142" width="238" height="22" rx="11" fill="rgba(255,255,255,0.24)"/>
      <rect x="48" y="190" width="96" height="58" rx="16" fill="rgba(255,255,255,0.26)"/>
      <text x="305" y="222" fill="#fff" font-family="Arial, sans-serif" font-size="64" font-weight="700">${item.icon}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function insertLocalImage() {
  const file = els.imageFile.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    setStatus("请选择图片文件");
    return;
  }
  const dataUrl = await readFileAsDataUrl(file);
  upsertImageBlock(dataUrl, els.imageCaption.value || file.name);
  els.imageFile.value = "";
  setStatus(selectedMediaNode ? "已更新所选图片" : "已插入本地图片");
}

function insertImageFromPanel() {
  const src = sanitizeMediaUrl(els.imageUrl.value);
  if (!src) {
    setStatus("请填写有效的图片链接，或选择本地图片");
    return;
  }
  upsertImageBlock(src, els.imageCaption.value);
  setStatus(selectedMediaNode ? "已更新所选图片" : "已插入图片");
}

function insertVideoFromPanel() {
  if (getMediaKind(selectedMediaNode) === "video") {
    updateVideoNode(selectedMediaNode);
    setStatus("已更新所选视频卡片");
    return;
  }
  const url = sanitizeUrl(els.videoUrl.value);
  const title = els.videoTitle.value.trim() || "视频标题";
  const cover = sanitizeMediaUrl(els.videoCover.value);
  const coverHtml = cover
    ? `<img src="${escapeAttribute(cover)}" alt="${escapeAttribute(title)}" />`
    : "<div>视频封面占位</div>";
  const html = `<figure data-kind="video" data-url="${url}">${coverHtml}<figcaption>${escapeHtml(title)}</figcaption></figure>`;
  insertEditorHtml(html, { append: true });
  setStatus("已插入视频卡片");
}

function updateSelectedMedia() {
  const kind = getMediaKind(selectedMediaNode);
  if (!kind) {
    setStatus("请先在编辑区选择图片、视频或六宫格卡片");
    return;
  }
  if (kind === "image" || kind === "grid-card") {
    insertImageFromPanel();
    return;
  }
  if (kind === "video") {
    insertVideoFromPanel();
    return;
  }
  if (kind === "six-grid") {
    setStatus("请选择六宫格中的单个卡片来更新图片");
  }
}

function upsertImageBlock(src, caption = "") {
  const safeSrc = sanitizeMediaUrl(src);
  if (!safeSrc) return;
  const kind = getMediaKind(selectedMediaNode);
  if (kind === "image") {
    updateImageNode(selectedMediaNode, safeSrc, caption);
    pushHistory();
    renderPreviewCore();
    saveState(false);
    return;
  }
  if (kind === "grid-card") {
    updateGridCardNode(selectedMediaNode, safeSrc, caption);
    pushHistory();
    renderPreviewCore();
    saveState(false);
    return;
  }
  const html = `<figure data-kind="image"><img src="${escapeAttribute(safeSrc)}" alt="${escapeAttribute(caption)}" /><figcaption>${escapeHtml(caption || "图片说明")}</figcaption></figure>`;
  insertEditorHtml(html, { append: true });
}

function updateImageNode(node, src, caption = "") {
  let image = node.querySelector("img");
  if (!image) {
    node.innerHTML = "";
    image = document.createElement("img");
    node.appendChild(image);
  }
  image.setAttribute("src", src);
  image.setAttribute("alt", caption || "");

  let figcaption = node.querySelector("figcaption");
  if (!figcaption) {
    figcaption = document.createElement("figcaption");
    node.appendChild(figcaption);
  }
  figcaption.textContent = caption || "图片说明";
}

function updateGridCardNode(node, src, caption = "") {
  const image = node.querySelector("img") || document.createElement("img");
  image.setAttribute("src", src);
  image.setAttribute("alt", caption || "");
  if (!image.parentElement) node.prepend(image);
  const title = node.querySelector("strong");
  if (title && caption) title.textContent = caption;
}

function updateVideoNode(node) {
  const url = sanitizeUrl(els.videoUrl.value);
  const title = els.videoTitle.value.trim() || "视频标题";
  const cover = sanitizeMediaUrl(els.videoCover.value);
  node.dataset.url = url;
  node.innerHTML = `${
    cover ? `<img src="${escapeAttribute(cover)}" alt="${escapeAttribute(title)}" />` : "<div>视频封面占位</div>"
  }<figcaption>${escapeHtml(title)}</figcaption>`;
  pushHistory();
  renderPreviewCore();
  saveState(false);
}

function insertEditorHtml(html, options = {}) {
  if (options.append) {
    els.editor.insertAdjacentHTML("beforeend", html);
  } else {
    els.editor.focus();
    const selection = window.getSelection();
    if (!selection.rangeCount || !els.editor.contains(selection.getRangeAt(0).commonAncestorContainer)) {
      els.editor.insertAdjacentHTML("beforeend", html);
    } else {
      const range = selection.getRangeAt(0);
      let node = range.commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
      // 找到编辑器的直接子块级元素
      let block = node;
      while (block && block.parentElement !== els.editor) {
        block = block.parentElement;
      }
      if (block && block !== els.editor) {
        block.insertAdjacentHTML("afterend", html);
      } else {
        // fallback: 在编辑器末尾插入
        els.editor.insertAdjacentHTML("beforeend", html);
      }
    }
  }
  pushHistory();
  debouncedRenderPreview();
  debouncedAutoSave();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

async function copyRichArticle() {
  const html = buildArticleHtml();
  const text = els.preview.innerText;
  warnIfAdTextIsShort();
  try {
    if (navigator.clipboard?.write && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);
    } else {
      copyBySelection(html);
    }
    setStatus("已复制富文本，可粘贴到微信公众平台后台");
  } catch (error) {
    copyBySelection(html);
    setStatus("已使用兼容模式复制");
  }
}

async function copyHtmlSource() {
  const html = buildArticleHtml();
  warnIfAdTextIsShort();
  try {
    await navigator.clipboard.writeText(html);
    setStatus("已复制 HTML 源码");
  } catch (error) {
    copyBySelection(`<pre>${escapeHtml(html)}</pre>`);
    setStatus("已使用兼容模式复制 HTML");
  }
}

function copyBySelection(html) {
  const holder = document.createElement("div");
  holder.style.position = "fixed";
  holder.style.left = "-9999px";
  holder.innerHTML = html;
  document.body.appendChild(holder);
  const range = document.createRange();
  range.selectNodeContents(holder);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  document.execCommand("copy");
  selection.removeAllRanges();
  holder.remove();
}

function downloadHtml() {
  warnIfAdTextIsShort();
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><title>${escapeHtml(
    els.title.value,
  )}</title></head><body>${buildArticleHtml()}</body></html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugify(els.title.value || "gzh-article")}.html`;
  a.click();
  URL.revokeObjectURL(url);
  setStatus("已下载 HTML 文件");
}

function warnIfAdTextIsShort() {
  const textLength = getVisibleArticleLength();
  if (els.adEnabled.checked && textLength < MIN_AD_TEXT_LENGTH) {
    showToast(`正文不足 ${MIN_AD_TEXT_LENGTH} 字，请补充可见内容后再插入广告`);
  }
}

function saveState(notify = true) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: STATE_VERSION,
      activeTheme,
      customTheme: themes.custom,
      title: els.title.value,
      author: els.author.value,
      date: els.date.value,
      summary: els.summary.value,
      editor: els.editor.innerHTML,
      adBrand: els.adBrand.value,
      adCopy: els.adCopy.value,
      adLink: els.adLink.value,
      adEnabled: els.adEnabled.checked,
    }),
  );
  if (notify) setStatus("草稿已保存到本地浏览器");
}

function restoreState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const state = JSON.parse(raw);
    if (!state.version) {
      // migrating from v1 to v2
    }
    if (state.customTheme) {
      themes.custom = { ...themes.custom, ...state.customTheme };
    }
    activeTheme = themes[state.activeTheme] ? state.activeTheme : activeTheme;
    els.title.value = state.title || els.title.value;
    els.author.value = state.author || els.author.value;
    els.date.value = state.date || els.date.value;
    els.summary.value = state.summary || els.summary.value;
    els.editor.innerHTML = state.editor || els.editor.innerHTML;
    els.adBrand.value = state.adBrand || els.adBrand.value;
    els.adCopy.value = state.adCopy || els.adCopy.value;
    els.adLink.value = state.adLink || els.adLink.value;
    els.adEnabled.checked = state.adEnabled !== false;
    renderThemes();
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function clearDraft() {
  els.title.value = "";
  els.summary.value = "";
  els.editor.innerHTML = "<p>在这里输入新的公众号文章。</p>";
  pushHistory();
  renderPreviewCore();
  setStatus("已清空当前草稿");
}

function normalizeEditorHtml(html) {
  return String(html)
    .replace(/<br\s*\/?>/gi, "")
    .replace(/\sdata-mce-[^=]+="[^"]*"/gi, "")
    .trim();
}

function paragraphStyle() {
  return "margin:14px 0;font-size:15px;line-height:1.95;color:inherit;text-align:left;";
}

function setStatus(message) {
  els.status.textContent = message;
  showToast(message);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove("is-visible"), 1800);
}
