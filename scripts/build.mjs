import { mkdir, readFile, rm, writeFile, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { build, transform } from "esbuild";
import JavaScriptObfuscator from "javascript-obfuscator";

const root = new URL("../", import.meta.url);
const dist = new URL("dist/", root);
const assets = new URL("assets/", dist);
const tempBundle = new URL(".app.bundle.js", dist);

await rm(dist, { recursive: true, force: true });
await mkdir(assets, { recursive: true });

await build({
  entryPoints: [new URL("src/app.js", root).pathname],
  bundle: true,
  format: "esm",
  target: ["es2020"],
  minify: true,
  sourcemap: false,
  legalComments: "none",
  outfile: tempBundle.pathname,
});

const bundledJs = await readFile(tempBundle, "utf8");
await rm(tempBundle, { force: true });

const obfuscatedJs = JavaScriptObfuscator.obfuscate(bundledJs, {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  identifierNamesGenerator: "hexadecimal",
  rotateStringArray: true,
  selfDefending: false,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 8,
  stringArray: true,
  stringArrayEncoding: ["base64"],
  stringArrayThreshold: 0.75,
  unicodeEscapeSequence: false,
}).getObfuscatedCode();

const css = await readFile(new URL("src/styles.css", root), "utf8");
const minifiedCss = await transform(css, {
  loader: "css",
  minify: true,
});

const jsName = `app.${hash(obfuscatedJs)}.js`;
const cssName = `styles.${hash(minifiedCss.code)}.css`;

await writeFile(new URL(`assets/${jsName}`, dist), obfuscatedJs);
await writeFile(new URL(`assets/${cssName}`, dist), minifiedCss.code);

const html = await readFile(new URL("index.html", root), "utf8");
const builtHtml = html
  .replace(/<link rel="stylesheet" href="src\/styles\.css" \/>/, `<link rel="stylesheet" href="assets/${cssName}" />`)
  .replace(/<script src="src\/app\.js" type="module"><\/script>/, `<script src="assets/${jsName}" type="module"></script>`)
  .replace(/\s{2,}/g, " ")
  .replace(/>\s+</g, "><")
  .trim();

await writeFile(new URL("index.html", dist), `${builtHtml}\n`);
await Promise.all(
  ["favicon.svg", "robots.txt", "sitemap.xml", "site.webmanifest"].map((file) =>
    copyFile(new URL(file, root), new URL(file, dist)),
  ),
);
await writeFile(new URL(".nojekyll", dist), "");

console.log(`build complete: dist/index.html, assets/${jsName}, assets/${cssName}`);

function hash(content) {
  return createHash("sha256").update(content).digest("hex").slice(0, 10);
}
