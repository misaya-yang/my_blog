#!/usr/bin/env node
/**
 * agent-upgrade-visual.mjs
 *
 * Visual QA captures for the blog-agent (assistant) upgrade.
 * Requires the dev server to be running at http://localhost:3000.
 *
 * For each viewport (1767x832, 1440x900, 1280x800, 768x900, 390x844) capture:
 *   (a) home, panel closed
 *   (b) home, panel open (empty state)
 *   (c) post, panel open (empty state)
 *   (d) post, panel with a completed sent question
 *   (e) mobile open (mobile viewport only)
 *
 * Theme variants at 1440x900: (b) and (c) with localStorage theme=dark and
 * theme=light set before load.
 *
 * Output: .audit/assistant-upgrade/final/ (relative to the repo root).
 * Full-viewport screenshots, nothing clipped. Every saved path is logged.
 * The script writes Agent conversations and quota usage, so it requires
 * QA_ALLOW_WRITES=1. Remote targets additionally require QA_ALLOW_REMOTE=1.
 *
 * Usage: node scripts/qa/agent-upgrade-visual.mjs
 */

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..", "..");
const OUT_DIR = join(repoRoot, ".audit", "assistant-upgrade", "final");

const BASE_URL = process.env.QA_BASE_URL ?? "http://localhost:3000";
const ALLOW_WRITES = process.env.QA_ALLOW_WRITES === "1";
const ALLOW_REMOTE = process.env.QA_ALLOW_REMOTE === "1";
const POST_PATH = "/post/long-horizon-agents-continuous-convergence";
const SENT_QUESTION = "解释这篇文章里的核心机制。";

const LAUNCHER = ".agent-liquid-launcher";
const PANEL = ".agent-liquid-panel";
const PANEL_SHELL = "[data-agent-panel-shell]";
const RESIZE_HANDLE = "[data-agent-resize-handle]";
const COMPOSER_TEXTAREA = ".agent-liquid-panel form textarea";

const VIEWPORTS = [
  { name: "1767x832", width: 1767, height: 832 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "768x900", width: 768, height: 900 },
  { name: "390x844", width: 390, height: 844 },
];

const THEME_VARIANTS = ["dark", "light"];
const THEME_VIEWPORT = { name: "1440x900", width: 1440, height: 900 };

let failures = 0;
let saved = 0;

function assertSafeTarget() {
  const target = new URL(BASE_URL);
  if (target.username || target.password) {
    throw new Error("QA_BASE_URL must not contain credentials");
  }
  const loopback = ["localhost", "127.0.0.1", "::1"].includes(target.hostname);
  if (!loopback && !ALLOW_REMOTE) {
    throw new Error("Remote QA requires QA_ALLOW_REMOTE=1");
  }
  if (!ALLOW_WRITES) {
    throw new Error(
      "Visual QA creates Agent runs; set QA_ALLOW_WRITES=1 to continue"
    );
  }
}

function log(...args) {
  console.log(...args);
}

/** Navigate and wait for load + (best-effort) network idle. */
async function gotoIdle(page, url) {
  const response = await page.goto(url, { waitUntil: "load", timeout: 60_000 });
  if (!response?.ok()) {
    throw new Error(
      `navigation failed with HTTP ${response?.status() ?? "none"}`
    );
  }
  await page
    .waitForLoadState("networkidle", { timeout: 15_000 })
    .catch(() => {});
  await assertRenderedPage(page, false);
}

/** Open the agent panel if it is not already open. */
async function openPanel(page) {
  const panel = page.locator(PANEL);
  if (!(await panel.isVisible().catch(() => false))) {
    await page.locator(LAUNCHER).first().click();
  }
  await panel.waitFor({ state: "visible", timeout: 15_000 });
  await page
    .waitForLoadState("networkidle", { timeout: 8_000 })
    .catch(() => {});
  await page.waitForTimeout(350);
  await assertRenderedPage(page, true);
}

async function assertRenderedPage(page, panelExpected) {
  const result = await page.evaluate(
    ({ panelExpectedValue, panelSelector, shellSelector, resizeSelector }) => {
      const panel = document.querySelector(panelSelector);
      const shell = document.querySelector(shellSelector);
      const resizeHandle = document.querySelector(resizeSelector);
      const composer = panel?.querySelector("form");
      const panelRect = panel?.getBoundingClientRect();
      const desktopPanel = window.innerWidth >= 768;
      return {
        bodyTextLength: document.body.innerText.trim().length,
        horizontalOverflow:
          document.documentElement.scrollWidth > window.innerWidth + 1,
        overlay: Boolean(
          document.querySelector(
            "vite-error-overlay, nextjs-portal, #webpack-dev-server-client-overlay"
          )
        ),
        panelMissing: panelExpectedValue && !panel,
        resizeHandleMissing:
          panelExpectedValue && desktopPanel && !resizeHandle,
        desktopDefaultTooLarge: Boolean(
          panelExpectedValue &&
            desktopPanel &&
            shell &&
            (shell.getBoundingClientRect().width > 410 ||
              shell.getBoundingClientRect().height > 660)
        ),
        panelOutOfBounds: Boolean(
          panelRect &&
            (panelRect.left < -1 ||
              panelRect.right > window.innerWidth + 1 ||
              panelRect.top < -1 ||
              panelRect.bottom > window.innerHeight + 1)
        ),
        composerHidden: Boolean(
          panelExpectedValue &&
            (!composer ||
              composer.getBoundingClientRect().bottom > window.innerHeight + 1)
        ),
      };
    },
    {
      panelExpectedValue: panelExpected,
      panelSelector: PANEL,
      shellSelector: PANEL_SHELL,
      resizeSelector: RESIZE_HANDLE,
    }
  );
  const failed =
    result.bodyTextLength === 0 ||
    result.horizontalOverflow ||
    result.overlay ||
    result.panelMissing ||
    result.resizeHandleMissing ||
    result.desktopDefaultTooLarge ||
    result.panelOutOfBounds ||
    result.composerHidden;
  if (failed)
    throw new Error(`render assertion failed: ${JSON.stringify(result)}`);
}

async function assertPanelResizable(page) {
  const shell = page.locator(PANEL_SHELL);
  const handle = page.locator(RESIZE_HANDLE);
  await handle.waitFor({ state: "visible", timeout: 10_000 });
  const before = await shell.boundingBox();
  if (!before) throw new Error("resize shell has no bounding box");

  await handle.focus();
  await handle.press("ArrowRight");
  await handle.press("ArrowDown");
  const resized = await shell.boundingBox();
  if (
    !resized ||
    resized.width >= before.width - 8 ||
    resized.height >= before.height - 8
  ) {
    throw new Error(
      `keyboard resize did not shrink the panel: ${JSON.stringify({ before, resized })}`
    );
  }

  await handle.press("Home");
  const reset = await shell.boundingBox();
  if (
    !reset ||
    Math.abs(reset.width - before.width) > 1 ||
    Math.abs(reset.height - before.height) > 1
  ) {
    throw new Error(
      `Home did not restore the default panel size: ${JSON.stringify({ before, reset })}`
    );
  }
}

/** Full-viewport screenshot; logs the saved path. */
async function shot(page, name) {
  const filePath = join(OUT_DIR, name);
  try {
    await page.screenshot({ path: filePath, fullPage: false });
    saved += 1;
    log(`saved ${filePath}`);
  } catch (error) {
    failures += 1;
    log(`FAILED ${filePath}: ${error?.message ?? error}`);
  }
}

async function captureViewport(browser, vp) {
  log(`--- viewport ${vp.name} ---`);
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    locale: "zh-CN",
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const runtimeErrors = new Set();
  page.on("console", message => {
    if (["error", "warning"].includes(message.type())) {
      runtimeErrors.add(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", error =>
    runtimeErrors.add(`pageerror: ${error.message}`)
  );

  try {
    // (a) home, panel closed
    await gotoIdle(page, `${BASE_URL}/`);
    await shot(page, `home-closed-${vp.name}.png`);

    // (b) home, panel open, empty state
    await openPanel(page);
    await shot(page, `home-open-${vp.name}.png`);
    if (vp.name === "768x900") await assertPanelResizable(page);

    // (c) post, panel open, empty state
    await gotoIdle(page, `${BASE_URL}${POST_PATH}`);
    await openPanel(page);
    await shot(page, `post-open-${vp.name}.png`);

    // (d) post with a sent question: type + Enter, wait 12s, capture whatever
    // state results (streaming, answer, or error).
    try {
      const textarea = page.locator(COMPOSER_TEXTAREA).first();
      await textarea.waitFor({ state: "visible", timeout: 10_000 });
      await textarea.click();
      await page.keyboard.type(SENT_QUESTION);
      await page.keyboard.press("Enter");
      await page
        .locator(PANEL)
        .getByRole("button", { name: /^(发送|Send)$/i })
        .waitFor({ state: "visible", timeout: 60_000 });
      await page.waitForTimeout(400);
    } catch (error) {
      log(
        `note: sending the question failed at ${vp.name}: ${error?.message ?? error}`
      );
      failures += 1;
    }
    await shot(page, `post-sent-${vp.name}.png`);

    // (e) mobile open (mobile viewport only)
    if (vp.width < 768) {
      await gotoIdle(page, `${BASE_URL}/`);
      await openPanel(page);
      await shot(page, `mobile-open-${vp.name}.png`);
    } else {
      log(`skipped mobile-open at ${vp.name} (desktop viewport)`);
    }
  } catch (error) {
    failures += 1;
    log(`viewport ${vp.name} aborted: ${error?.message ?? error}`);
  } finally {
    if (runtimeErrors.size > 0) {
      failures += 1;
      log(
        `viewport ${vp.name} runtime errors: ${[...runtimeErrors].join(" | ")}`
      );
    }
    await context.close().catch(() => {});
  }
}

/** Dark/light variants of (b) home-open and (c) post-open at 1440x900. */
async function captureThemed(browser, theme) {
  log(`--- theme variant: ${theme} at ${THEME_VIEWPORT.name} ---`);
  const context = await browser.newContext({
    viewport: { width: THEME_VIEWPORT.width, height: THEME_VIEWPORT.height },
    locale: "zh-CN",
    deviceScaleFactor: 1,
  });
  // Set the persisted theme before any page script runs.
  await context.addInitScript(
    ([key, value]) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        /* storage unavailable */
      }
    },
    ["theme", theme]
  );

  const page = await context.newPage();
  const runtimeErrors = new Set();
  page.on("console", message => {
    if (["error", "warning"].includes(message.type())) {
      runtimeErrors.add(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", error =>
    runtimeErrors.add(`pageerror: ${error.message}`)
  );
  try {
    await gotoIdle(page, `${BASE_URL}/`);
    await openPanel(page);
    await shot(page, `home-open-${theme}-${THEME_VIEWPORT.name}.png`);

    await gotoIdle(page, `${BASE_URL}${POST_PATH}`);
    await openPanel(page);
    await shot(page, `post-open-${theme}-${THEME_VIEWPORT.name}.png`);
  } catch (error) {
    failures += 1;
    log(`theme variant ${theme} aborted: ${error?.message ?? error}`);
  } finally {
    if (runtimeErrors.size > 0) {
      failures += 1;
      log(`theme ${theme} runtime errors: ${[...runtimeErrors].join(" | ")}`);
    }
    await context.close().catch(() => {});
  }
}

async function main() {
  assertSafeTarget();
  await mkdir(OUT_DIR, { recursive: true });
  log(`agent-upgrade visual QA against ${BASE_URL}`);
  log(`output directory: ${OUT_DIR}`);

  const browser = await chromium.launch({ headless: true });
  try {
    for (const vp of VIEWPORTS) {
      await captureViewport(browser, vp);
    }
    for (const theme of THEME_VARIANTS) {
      await captureThemed(browser, theme);
    }
  } finally {
    await browser.close().catch(() => {});
  }

  log(`SUMMARY: ${saved} saved / ${failures} failed`);
  process.exitCode = failures > 0 ? 1 : 0;
}

// Report-only like the functional harness: status lives in the SUMMARY line,
// and the exit code stays 0 so callers grep the report instead of gating on
// transient capture failures.
main().catch(error => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  log(`SUMMARY: ${saved} saved / ${failures + 1} failed (fatal: ${message})`);
  process.exitCode = 1;
});
