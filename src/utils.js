export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#96;");
}

export function sanitizeText(value) {
  return escapeHtml(String(value || "").trim());
}

export function sanitizeUrl(value) {
  const url = String(value || "").trim();
  if (/^https?:\/\//i.test(url)) return escapeHtml(url);
  return "https://example.com";
}

export function sanitizeMediaUrl(value) {
  const url = String(value || "").trim();
  if (/^https?:\/\//i.test(url) || /^data:image\//i.test(url)) return url;
  return "";
}

export function slugify(value) {
  const slug = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "gzh-article";
}
