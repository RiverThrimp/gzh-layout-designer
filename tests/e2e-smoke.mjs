import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { once } from "node:events";

const urlArg = process.argv.find((arg) => arg.startsWith("--url="))?.slice("--url=".length);
const serveDir = process.argv.includes("--dist") ? "dist" : process.env.SERVE_DIR || "";
const port = 8891;
const serverArgs = ["server.mjs"];
if (serveDir) serverArgs.push(`--serve-dir=${serveDir}`);
const server = urlArg
  ? null
  : spawn(process.execPath, serverArgs, {
      cwd: new URL("../", import.meta.url),
      env: { ...process.env, PORT: String(port) },
      stdio: ["ignore", "pipe", "pipe"],
    });
let serverError = "";
server?.stderr.on("data", (chunk) => {
  serverError += chunk.toString();
});

try {
  const baseUrl = urlArg || `http://127.0.0.1:${port}/`;
  if (!urlArg) await waitForServer(baseUrl, () => serverError);
  const html = await fetchText(baseUrl);
  const robots = await fetchText(new URL("robots.txt", baseUrl));
  const contentPages = await Promise.all(
    [
      "guides/copy-to-wechat.html",
      "guides/wechat-layout-tips.html",
      "templates/",
      "templates/product-launch.html",
      "templates/course-conversion.html",
      "changelog/",
    ].map((path) => fetchText(new URL(path, baseUrl))),
  );

  assert.match(html, /微信公众号文章编辑/);
  assert.match(html, /复制到公众号/);
  assert.match(html, /模板资源库/);
  assert.match(html, /主题选择器/);
  assert.match(html, /媒体元素/);
  assert.match(html, /插入视频卡片/);
  assert.match(html, /插入六宫格/);
  assert.match(html, /更新所选媒体/);
  assert.match(html, /反馈/);
  assert.doesNotMatch(html, /商业广告位/);
  assert.doesNotMatch(html, /赞助推荐/);
  assert.doesNotMatch(contentPages.join("\n"), /赞助推荐/);
  assert.doesNotMatch(contentPages.join("\n"), /正文可见字数/);
  assert.match(robots, /Allow: \//);
  assert.match(contentPages.join("\n"), /公众号文章怎么复制到微信后台/);
  assert.match(contentPages.join("\n"), /公众号模板库/);
  assert.match(contentPages.join("\n"), /更新日志/);
  if (serveDir === "dist" || urlArg) {
    assert.doesNotMatch(html, /src\/app\.js/);
    assert.doesNotMatch(html, /src\/styles\.css/);
    assert.match(html, /assets\/app\.[a-f0-9]{10}\.js/);
    assert.match(html, /assets\/styles\.[a-f0-9]{10}\.css/);
    contentPages.forEach((page) => {
      assert.doesNotMatch(page, /src\/styles\.css/);
      assert.match(page, /assets\/styles\.[a-f0-9]{10}\.css/);
    });
    assert.equal(await fetchStatus(new URL("src/app.js", baseUrl)), 404);
  } else {
    const appJs = await fetchText(`http://127.0.0.1:${port}/src/app.js`);
    const dataJs = await fetchText(`http://127.0.0.1:${port}/src/data.js`);
    const utilsJs = await fetchText(`http://127.0.0.1:${port}/src/utils.js`);
    const js = `${appJs}\n${dataJs}\n${utilsJs}`;
    assert.match(js, /templates/);
    assert.match(js, /customTheme/);
    assert.match(js, /upsertImageBlock/);
    assert.match(js, /updateSelectedMedia/);
    assert.match(js, /buildSixGridHtml/);
    assert.match(js, /STATE_VERSION/);
    assert.match(js, /debouncedPushHistory/);
  }
  await runBrowserFlow(baseUrl);
  console.log("e2e-smoke passed");
} finally {
  server?.kill("SIGTERM");
}

async function waitForServer(url, getServerError = () => "") {
  const started = Date.now();
  while (Date.now() - started < 5000) {
    try {
      await fetchText(url);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
  }
  throw new Error(`server did not start${getServerError() ? `\n${getServerError()}` : ""}`);
}

async function fetchText(url) {
  const response = await fetch(String(url));
  assert.equal(response.ok, true, `${url} returned ${response.status}`);
  return response.text();
}

async function fetchStatus(url) {
  const response = await fetch(String(url));
  return response.status;
}

async function runBrowserFlow(url) {
  const chromePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const remotePort = 9330 + Math.floor(Math.random() * 400);
  const profileDir = `/private/tmp/gzh-layout-e2e-profile-${process.pid}-${remotePort}`;
  const chrome = spawn(
    chromePath,
    [
      "--headless",
      "--disable-gpu",
      "--disable-component-update",
      "--disable-background-networking",
      `--remote-debugging-port=${remotePort}`,
      `--user-data-dir=${profileDir}`,
      url,
    ],
    { stdio: ["ignore", "ignore", "ignore"] },
  );

  try {
    const wsUrl = await waitForPageWebSocketUrl(remotePort, url);
    const client = await createCdpClient(wsUrl);
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await waitForRuntime(client, "document.querySelector('#template-library')?.children.length === 12");

    await client.send("Runtime.evaluate", {
      expression: `
        document.querySelector('[data-insert="code"]').click();
        document.querySelector('[data-insert="table"]').click();
      `,
    });

    await waitForRuntime(
      client,
      `
        document.querySelector('#editor [data-kind="code"]') &&
        document.querySelector('#editor table') &&
        document.querySelector('#wechat-preview pre') &&
        document.querySelector('#wechat-preview table')
      `,
    );

    const desktop = await evaluateJson(client, `
      ({
        themes: document.querySelectorAll('.theme-card').length,
        templates: document.querySelectorAll('.template-card').length,
        hasCode: Boolean(document.querySelector('#wechat-preview pre')),
        hasTable: Boolean(document.querySelector('#wechat-preview table')),
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      })
    `);
    assert.deepEqual(desktop, {
      themes: 12,
      templates: 12,
      hasCode: true,
      hasTable: true,
      overflowX: false,
    });

    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1180,
      height: 760,
      deviceScaleFactor: 1,
      mobile: false,
    });
    const laptop = await evaluateJson(client, `
      new Promise((resolve) => requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        requestAnimationFrame(() => {
          const previewRight = document.querySelector('.preview-column').getBoundingClientRect().right;
          const rightPanelRect = document.querySelector('.right-panel').getBoundingClientRect();
          resolve({
            columns: getComputedStyle(document.querySelector('.workspace')).gridTemplateColumns.split(' ').length,
            rightPanelVisibleInFirstViewport: rightPanelRect.top < 140 && rightPanelRect.left > previewRight - 1,
            overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          });
        });
      }))
    `);
    assert.deepEqual(laptop, {
      columns: 3,
      rightPanelVisibleInFirstViewport: true,
      overflowX: false,
    });

    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1024,
      height: 760,
      deviceScaleFactor: 1,
      mobile: false,
    });
    const compactLaptop = await evaluateJson(client, `
      (() => {
        const rightPanelRect = document.querySelector('.right-panel').getBoundingClientRect();
        const previewRect = document.querySelector('.preview-column').getBoundingClientRect();
        return {
          columns: getComputedStyle(document.querySelector('.workspace')).gridTemplateColumns.split(' ').length,
          overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          rightPanelVisibleInFirstViewport: rightPanelRect.top < 140 && rightPanelRect.right <= window.innerWidth + 1,
          previewBelowControls: previewRect.top > rightPanelRect.top + 120,
        };
      })()
    `);
    assert.deepEqual(compactLaptop, {
      columns: 2,
      overflowX: false,
      rightPanelVisibleInFirstViewport: true,
      previewBelowControls: true,
    });

    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 900,
      height: 760,
      deviceScaleFactor: 1,
      mobile: false,
    });
    const narrowLaptop = await evaluateJson(client, `
      (() => {
        window.scrollTo(0, 0);
        const rightPanelRect = document.querySelector('.right-panel').getBoundingClientRect();
        const previewRect = document.querySelector('.preview-column').getBoundingClientRect();
        return {
          columns: getComputedStyle(document.querySelector('.workspace')).gridTemplateColumns.split(' ').length,
          overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          rightPanelBeforePreview: rightPanelRect.top < previewRect.top,
        };
      })()
    `);
    assert.deepEqual(narrowLaptop, {
      columns: 1,
      overflowX: false,
      rightPanelBeforePreview: true,
    });

    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 900,
      deviceScaleFactor: 1,
      mobile: true,
    });
    const mobile = await evaluateJson(client, `
      ({
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        copyLabel: getComputedStyle(document.querySelector('#copy-button'), '::after').content,
      })
    `);
    assert.equal(mobile.overflowX, false);
    assert.match(mobile.copyLabel, /复制/);

    await client.close();
  } finally {
    chrome.kill("SIGTERM");
    await once(chrome, "exit").catch(() => {});
  }
}

async function waitForPageWebSocketUrl(port, pageUrl) {
  const endpoint = `http://127.0.0.1:${port}/json/list`;
  const started = Date.now();
  while (Date.now() - started < 8000) {
    try {
      const targets = JSON.parse(await fetchText(endpoint));
      const target = targets.find((item) => item.type === "page" && item.url === pageUrl) || targets.find((item) => item.type === "page");
      if (target?.webSocketDebuggerUrl) return target.webSocketDebuggerUrl;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
  }
  throw new Error("Chrome page DevTools endpoint did not start");
}

async function createCdpClient(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await once(ws, "open");
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(new Error(message.error.message)) : resolve(message.result || {});
    }
  });

  return {
    send(method, params = {}) {
      const callId = ++id;
      ws.send(JSON.stringify({ id: callId, method, params }));
      return new Promise((resolve, reject) => pending.set(callId, { resolve, reject }));
    },
    close() {
      ws.close();
    },
  };
}

async function waitForRuntime(client, expression) {
  const started = Date.now();
  while (Date.now() - started < 6000) {
    const result = await evaluateJson(client, `Boolean(${expression})`);
    if (result === true) return;
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  throw new Error(`condition did not become true: ${expression}`);
}

async function evaluateJson(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "Runtime.evaluate failed");
  }
  return result.result.value;
}
