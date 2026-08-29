#!/usr/bin/env node
/**
 * agent-upgrade-functional.mjs
 *
 * Automated functional checks F01-F12 for the blog-agent (assistant)
 * upgrade. Requires the dev server to be running at http://localhost:3000.
 *
 * Targets the current assistant UI: the panel exposes exactly three class
 * hooks (.agent-liquid-launcher, .agent-launcher-orb, .agent-liquid-panel);
 * every header/composer control is located by its bilingual aria-label
 * instead of per-button classes.
 *
 * Prints one line per check: "PASS|FAIL|MANUAL <id> <note>" and a final
 * summary line. A FAIL exits 1 and a MANUAL result exits 2. The checks create
 * conversations and consume Agent quota, so callers must opt in with
 * QA_ALLOW_WRITES=1. Remote targets also require QA_ALLOW_REMOTE=1.
 *
 * Usage: node scripts/qa/agent-upgrade-functional.mjs
 */

import { chromium } from "playwright";

const BASE_URL = process.env.QA_BASE_URL ?? "http://localhost:3000";
const ALLOW_WRITES = process.env.QA_ALLOW_WRITES === "1";
const ALLOW_REMOTE = process.env.QA_ALLOW_REMOTE === "1";
const HOME = `${BASE_URL}/`;
const POST_PATH = "/post/long-horizon-agents-continuous-convergence";
const POST_URL = `${BASE_URL}${POST_PATH}`;
const OTHER_POST_PATH = "/post/goal-harness-agent-phase-protocol";
const STREAM_PATH = "/api/agent/stream";
const SENT_QUESTION = "解释这篇文章里的核心机制。";

/* ------------------------------------------------------------------ */
/* locators: only three class hooks + bilingual aria-labels            */
/* ------------------------------------------------------------------ */

const LAUNCHER = ".agent-liquid-launcher";
const PANEL = ".agent-liquid-panel";
const COMPOSER_TEXTAREA = `${PANEL} textarea`;

// Bilingual accessible names of the icon-only controls.
const CLOSE_NAME = /^(关闭助手|Close assistant)$/i;
const HISTORY_NAME = /^(历史|History)$/i;
const NEW_THREAD_NAME = /^(新对话|New thread)$/i;
const SEND_NAME = /^(发送|Send)$/i;
const STOP_NAME = /^(停止生成|Stop generating)$/i;
const RETRY_NAME = /^(重试|Retry)$/i;

// Context row (<p> directly under the header divider).
const CONTEXT_ROW_TEXT =
  /当前阅读|Currently reading|可检索全部公开笔记|Searches all public notes/i;
const POST_CONTEXT_TEXT = /当前阅读|Currently reading/i;
const SITE_LINE = /可检索全部公开笔记|Searches all public notes/i;

// Empty-state intro line (rendered immediately in the current build).
const EMPTY_INTRO_TEXT =
  /可以直接问这篇笔记|Ask about this note directly|可以让我查找|Have me search/i;

// Sources render as a collapsed block whose summary matches this.
const SOURCE_TEXT = /来源|source/i;
const SOURCE_SUMMARY_TEXT = /\d+\s*(个来源|source)/i;

const MODEL_NOT_CONFIGURED =
  /线上模型服务暂未配置|model service is not configured/i;
const FAILURE_MARKERS =
  /草稿已保留|未能完成回答|已停止生成|Generation stopped|timed out|请求超时|未能回答/;

const results = [];

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
      "Functional QA creates Agent runs; set QA_ALLOW_WRITES=1 to continue"
    );
  }
}

function report(id, status, note) {
  const line = `${status} ${id} ${note}`;
  console.log(line);
  results.push({ id, status, note });
}

function summaryNote() {
  return `${results.map(r => `${r.id}=${r.status}`).join(" ")}`;
}

/* ------------------------------------------------------------------ */
/* shared helpers                                                      */
/* ------------------------------------------------------------------ */

async function gotoIdle(page, url) {
  await page.goto(url, { waitUntil: "load", timeout: 60_000 });
  await page
    .waitForLoadState("networkidle", { timeout: 15_000 })
    .catch(() => {});
}

async function openPanel(page) {
  const panel = page.locator(PANEL);
  if (!(await panel.isVisible().catch(() => false))) {
    await page.locator(LAUNCHER).first().click();
  }
  await panel.waitFor({ state: "visible", timeout: 15_000 });
  await page.waitForTimeout(250);
  return panel;
}

function headerButton(page, name) {
  return page.locator(PANEL).getByRole("button", { name }).first();
}

const closeButton = page => headerButton(page, CLOSE_NAME);
const historyButton = page => headerButton(page, HISTORY_NAME);
const newThreadButton = page => headerButton(page, NEW_THREAD_NAME);

function composer(page) {
  return page.locator(COMPOSER_TEXTAREA).first();
}

/** Composer action button (send while idle, stop while sending). */
function sendButton(page) {
  return page.locator(`${PANEL} form button`).last();
}

function stopButton(page) {
  return page.locator(PANEL).getByRole("button", { name: STOP_NAME }).first();
}

async function sendLabel(page) {
  return (await sendButton(page).getAttribute("aria-label")) ?? "";
}

async function isSending(page) {
  return STOP_NAME.test(await sendLabel(page));
}

/**
 * The message scroller is the only overflow-y-auto div inside the panel
 * while the empty state / a plain conversation is showing (history list
 * and expanded source list only exist transiently and are not relevant
 * when this helper is used).
 */
function messageScroller(page) {
  return page.locator(`${PANEL} div.overflow-y-auto`).first();
}

/**
 * The context row <p> directly under the header divider, identified by
 * its bilingual content. (A raw text-chain locator resolves to the
 * innermost prefix span, so the structural p is used for the full text.)
 */
function contextRow(page) {
  return page
    .locator(`${PANEL} header + div p`)
    .filter({ hasText: CONTEXT_ROW_TEXT })
    .first();
}

async function contextRowText(page) {
  return (
    (await contextRow(page)
      .innerText()
      .catch(() => "")) ?? ""
  ).trim();
}

/** Empty state = intro line visible, or zero messages in the scroller. */
async function emptyStateVisible(page) {
  const intro = page.locator(PANEL).getByText(EMPTY_INTRO_TEXT).first();
  if (await intro.isVisible().catch(() => false)) return true;
  const articleCount = await messageScroller(page)
    .locator("article")
    .count()
    .catch(() => -1);
  return articleCount === 0;
}

async function findNewThread(page) {
  const locator = newThreadButton(page);
  if (await locator.isVisible().catch(() => false)) return locator;
  return null;
}

function streamRequestFilter(request) {
  return request.url().includes(STREAM_PATH);
}

/** Submit a message through the composer (textarea + Enter). */
async function submitMessage(page, text) {
  const textarea = composer(page);
  await textarea.waitFor({ state: "visible", timeout: 10_000 });
  await textarea.click();
  await page.keyboard.type(text);
  await page.keyboard.press("Enter");
}

async function waitFor(predicate, timeoutMs, stepMs = 200) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return true;
    await new Promise(resolve => setTimeout(resolve, stepMs));
  }
  return false;
}

/** Best-effort SPA navigation to home via the site header link. */
async function navigateHome(page) {
  try {
    const link = page.locator(".site-header a[href='/']").first();
    if (await link.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await link.click();
      await page
        .locator(".article-card")
        .first()
        .waitFor({ state: "visible", timeout: 15_000 });
      await page
        .waitForLoadState("networkidle", { timeout: 8_000 })
        .catch(() => {});
      return "spa";
    }
  } catch {
    /* fall through to full load */
  }
  await gotoIdle(page, HOME);
  return "full-reload";
}

/**
 * Best-effort SPA navigation to a post different from avoidPath by
 * clicking an a[href^="/post/"] link; falls back to a full load.
 */
async function navigateToAnotherPost(page, avoidPath) {
  try {
    const links = page.locator("a[href^='/post/']");
    await links
      .first()
      .waitFor({ state: "visible", timeout: 15_000 })
      .catch(() => {});
    const count = await links.count();
    let target = null;
    for (let i = 0; i < count; i += 1) {
      const link = links.nth(i);
      if (!(await link.isVisible().catch(() => false))) continue;
      const href = await link.getAttribute("href").catch(() => null);
      if (href && href !== avoidPath) {
        target = link;
        break;
      }
    }
    if (!target && count > 0) target = links.first();
    if (target) {
      await target.click();
      await page
        .locator("h1.article-page-title")
        .waitFor({ state: "visible", timeout: 15_000 });
      await page
        .waitForLoadState("networkidle", { timeout: 8_000 })
        .catch(() => {});
      return "spa";
    }
  } catch {
    /* fall through to full load */
  }
  await gotoIdle(page, `${BASE_URL}${OTHER_POST_PATH}`);
  return "full-reload";
}

async function articleTitle(page) {
  return (
    await page
      .locator("h1.article-page-title")
      .first()
      .innerText()
      .catch(() => "")
  ).trim();
}

/* ------------------------------------------------------------------ */
/* checks                                                              */
/* ------------------------------------------------------------------ */

async function f01(context) {
  const page = await context.newPage();
  try {
    await gotoIdle(page, HOME);
    const launcher = page.locator(LAUNCHER).first();
    const panel = page.locator(PANEL);

    const launcherBefore = await launcher.isVisible().catch(() => false);
    const panelBefore = await panel.isVisible().catch(() => false);
    const expandedBefore = await launcher.getAttribute("aria-expanded");

    await launcher.click();
    await panel.waitFor({ state: "visible", timeout: 10_000 });
    const launcherWhileOpen = await launcher.isVisible().catch(() => false);
    const expandedWhileOpen = await launcher.getAttribute("aria-expanded");
    const overflowOk = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1
    );

    await closeButton(page).click();
    await panel.waitFor({ state: "hidden", timeout: 10_000 });
    await page.waitForTimeout(250);
    const launcherAfterClose = await launcher.isVisible().catch(() => false);
    const expandedAfterClose = await launcher.getAttribute("aria-expanded");

    await gotoIdle(page, `${BASE_URL}/algorithms`);
    await openPanel(page);
    const trackLauncherHidden = !(await page
      .locator(LAUNCHER)
      .first()
      .isVisible()
      .catch(() => false));

    const toggles =
      launcherBefore &&
      !panelBefore &&
      !launcherWhileOpen && // launcher is display:none while the panel is open
      launcherAfterClose &&
      trackLauncherHidden;

    report(
      "F01",
      toggles && overflowOk ? "PASS" : "FAIL",
      `launcherVisibleBefore=${launcherBefore}; panelInitiallyVisible=${panelBefore}; ` +
        `launcherHiddenWhileOpen=${!launcherWhileOpen}; launcherVisibleAfterClose=${launcherAfterClose}; ` +
        `trackLauncherHidden=${trackLauncherHidden}; ` +
        `aria-expanded ${expandedBefore ?? "null"}->${expandedWhileOpen}->${expandedAfterClose ?? "null"}; ` +
        `noHorizontalOverflow=${overflowOk}`
    );
  } catch (error) {
    report("F01", "FAIL", `error: ${error?.message ?? error}`);
  } finally {
    await page.close().catch(() => {});
  }
}

async function f02(context) {
  const page = await context.newPage();
  try {
    // Post page: context row must carry the "currently reading" prefix
    // plus the post title.
    await gotoIdle(page, POST_URL);
    await openPanel(page);
    const title = await articleTitle(page);
    const rowOnPost = await contextRowText(page);
    const showsTitleOnPost =
      title.length > 0 &&
      POST_CONTEXT_TEXT.test(rowOnPost) &&
      rowOnPost.includes(title);

    // SPA-navigate to home: context row must switch to the site-wide line.
    const homeNav = await navigateHome(page);
    await openPanel(page);
    const rowOnHome = await contextRowText(page);
    const showsSiteLine = SITE_LINE.test(rowOnHome);

    // SPA-navigate to a different post via an a[href^="/post/"] link:
    // the row must update to the new title.
    const postNav = await navigateToAnotherPost(page, POST_PATH);
    await openPanel(page);
    const backTitle = await articleTitle(page);
    const backPath = new URL(page.url()).pathname;
    const rowBackOnPost = await contextRowText(page);
    const updatesOnNavigate =
      backPath !== POST_PATH &&
      backTitle !== title &&
      backTitle.length > 0 &&
      POST_CONTEXT_TEXT.test(rowBackOnPost) &&
      rowBackOnPost.includes(backTitle);

    const ok = showsTitleOnPost && showsSiteLine && updatesOnNavigate;
    report(
      "F02",
      ok ? "PASS" : "FAIL",
      `postTitleShown=${showsTitleOnPost}; siteLineOnHome=${showsSiteLine}; ` +
        `updatesOnNavigate=${updatesOnNavigate} (nav: ${homeNav}, ${postNav}, path: ${backPath}); ` +
        `rowOnPost="${rowOnPost.slice(0, 60).replace(/\s+/g, " ")}"`
    );
  } catch (error) {
    report("F02", "FAIL", `error: ${error?.message ?? error}`);
  } finally {
    await page.close().catch(() => {});
  }
}

async function f03(context) {
  const page = await context.newPage();
  const streamRequests = [];
  page.on("request", request => {
    if (streamRequestFilter(request)) streamRequests.push(request.url());
  });
  try {
    await gotoIdle(page, POST_URL);
    await openPanel(page);

    // The empty state renders an intro line followed by starter prompt
    // buttons; the starters are the buttons below it inside the scroller.
    const intro = page.locator(PANEL).getByText(EMPTY_INTRO_TEXT).first();
    const introVisible = await intro
      .waitFor({ state: "visible", timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    const starter = messageScroller(page).getByRole("button").first();
    const starterVisible =
      introVisible &&
      (await starter
        .waitFor({ state: "visible", timeout: 5_000 })
        .then(() => true)
        .catch(() => false));
    if (!starterVisible) {
      report("F03", "FAIL", "no starter prompts rendered in the empty state");
      return;
    }

    await starter.click();
    const fired = await waitFor(() => streamRequests.length > 0, 8_000);
    // A single starter click must produce exactly one stream request.
    await page.waitForTimeout(2_500);
    report(
      "F03",
      fired && streamRequests.length === 1 ? "PASS" : "FAIL",
      `stream requests after starter click: ${streamRequests.length} (expected exactly 1)`
    );
  } catch (error) {
    report("F03", "FAIL", `error: ${error?.message ?? error}`);
  } finally {
    await page.close().catch(() => {});
  }
}

async function f04(context) {
  const page = await context.newPage();
  const streamRequests = [];
  page.on("request", request => {
    if (streamRequestFilter(request)) streamRequests.push(request.url());
  });
  try {
    await gotoIdle(page, HOME);
    await openPanel(page);
    await submitMessage(page, "双重提交测试：只应发出一次请求。");
    // Rapid second attempt right after Enter: a plain click on the
    // composer button. After the type=button fix this must never act as
    // stop-then-resend — the stream request count must stay at exactly 1.
    await sendButton(page)
      .click({ timeout: 2_000 })
      .catch(() => {});
    await page.waitForTimeout(3_000);
    const requestsAfterRapid = streamRequests.length;

    // Let the turn settle so the button returns to its idle send state,
    // then assert it is type="button" (after the fix it always is).
    const settled = await waitFor(async () => !(await isSending(page)), 60_000);
    const buttonType = await sendButton(page)
      .getAttribute("type")
      .catch(() => null);
    const ok = requestsAfterRapid === 1 && settled && buttonType === "button";
    report(
      "F04",
      ok ? "PASS" : "FAIL",
      `stream requests after rapid Enter-then-click: ${requestsAfterRapid} (expected exactly 1); ` +
        `settled=${settled}; idle composerButtonType=${buttonType ?? "null"} (expected "button")`
    );
  } catch (error) {
    report("F04", "FAIL", `error: ${error?.message ?? error}`);
  } finally {
    await page.close().catch(() => {});
  }
}

async function f05(context) {
  const page = await context.newPage();
  try {
    await gotoIdle(page, HOME);
    await openPanel(page);
    const textarea = composer(page);
    await textarea.waitFor({ state: "visible", timeout: 10_000 });
    await textarea.click();
    await page.keyboard.type("第一行");
    await page.keyboard.press("Shift+Enter");
    await page.keyboard.type("第二行");
    const value = await textarea.inputValue();
    const newlineInserted = value.includes("第一行\n第二行");

    await textarea.fill(
      Array.from({ length: 30 }, (_, index) => `粘贴行 ${index + 1}`).join("\n")
    );
    await page.waitForTimeout(200);
    const height = await textarea.evaluate(element =>
      Math.ceil(element.getBoundingClientRect().height)
    );
    const heightCapped = height <= 112;
    await sendButton(page).click();
    await waitFor(() => isSending(page), 5_000);
    const heightAfterSubmit = await textarea.evaluate(element =>
      Math.ceil(element.getBoundingClientRect().height)
    );
    const heightReset = heightAfterSubmit <= 48;
    if (await isSending(page)) await stopButton(page).click();

    report(
      "F05",
      newlineInserted && heightCapped && heightReset ? "PASS" : "FAIL",
      `shiftEnterNewline=${newlineInserted}; heightAfter30Lines=${height}px; ` +
        `heightAfterSubmit=${heightAfterSubmit}px`
    );
  } catch (error) {
    report("F05", "FAIL", `error: ${error?.message ?? error}`);
  } finally {
    await page.close().catch(() => {});
  }
}

/**
 * Send one real question with no interception and classify the outcome.
 * Returns "answered" | "server_failed" | "timeout" | "harness_error",
 * plus recovery-card visibility and the server-side failure evidence.
 */
async function runRealSend(context) {
  const page = await context.newPage();
  const streamResponses = [];
  page.on("response", response => {
    if (response.url().includes(STREAM_PATH)) streamResponses.push(response);
  });
  try {
    await gotoIdle(page, POST_URL);
    await openPanel(page);
    await submitMessage(page, SENT_QUESTION);

    // Grace period: give React a moment to flip the composer into the
    // sending state before we start polling for it to settle again.
    await page.waitForTimeout(1_500);
    const settled = await waitFor(async () => !(await isSending(page)), 60_000);
    if (!settled) return { outcome: "timeout", page };
    await page.waitForTimeout(800);

    const text = await page.locator(PANEL).innerText();
    const recoveryVisible = await page
      .locator(PANEL)
      .getByRole("button", { name: RETRY_NAME })
      .first()
      .isVisible()
      .catch(() => false);

    // Inspect the raw stream responses for the server-side verdict.
    let httpStatus = null;
    let serverErrorCode = null;
    let streamStatus = null;
    for (const response of streamResponses) {
      if (response.status() >= 400) httpStatus = response.status();
      const body = await response.text().catch(() => "");
      if (!serverErrorCode) {
        const code = body.match(/"errorCode"\s*:\s*"([^"]+)"/);
        if (code) serverErrorCode = code[1];
      }
      if (!streamStatus) {
        const status = body.match(
          /"status"\s*:\s*"(failed|blocked|completed)"/
        );
        if (status) streamStatus = status[1];
      }
    }

    return {
      outcome: "settled",
      page,
      text,
      recoveryVisible,
      httpStatus,
      serverErrorCode,
      streamStatus,
      sawStreamRequest: streamResponses.length > 0,
    };
  } catch (error) {
    return {
      outcome: "harness_error",
      page,
      error: `${error?.message ?? error}`,
    };
  }
}

async function f06f11(context) {
  const result = await runRealSend(context);
  const { page } = result;
  try {
    if (result.outcome === "timeout") {
      report("F06", "FAIL", "send did not settle within 60s");
      report(
        "F11",
        "MANUAL",
        "no completed answer within 60s; verify source cards manually"
      );
      return;
    }
    if (result.outcome === "harness_error") {
      report("F06", "FAIL", `harness error during real send (${result.error})`);
      report(
        "F11",
        "MANUAL",
        "no completed answer; verify source cards manually"
      );
      return;
    }

    const {
      text,
      recoveryVisible,
      httpStatus,
      serverErrorCode,
      streamStatus,
      sawStreamRequest,
    } = result;

    // Local env carries an invalid model key: a real stream ends in a
    // failed status. Treat every server-side failure (model_not_configured,
    // agent_generation_failed, non-2xx HTTP, failed/blocked final status,
    // or the localized failure notices) as not locally verifiable.
    const serverFailed =
      !sawStreamRequest ||
      httpStatus !== null ||
      streamStatus === "failed" ||
      streamStatus === "blocked" ||
      Boolean(serverErrorCode) ||
      MODEL_NOT_CONFIGURED.test(text) ||
      FAILURE_MARKERS.test(text);

    if (serverFailed) {
      const reason = !sawStreamRequest
        ? "no stream request observed"
        : (serverErrorCode ??
          (httpStatus !== null
            ? `http ${httpStatus}`
            : (streamStatus ?? "failure notice in panel")));
      if (recoveryVisible) {
        report(
          "F06",
          "MANUAL",
          `stream failed server-side (${reason}) and the recovery card is shown; ` +
            "verify answer streaming manually once a model key is configured"
        );
        report(
          "F11",
          "MANUAL",
          `no completed answer locally (${reason}); verify source cards manually`
        );
      } else {
        report(
          "F06",
          "FAIL",
          `stream failed server-side (${reason}) but no recovery card rendered`
        );
        report(
          "F11",
          "MANUAL",
          `no completed answer locally (${reason}); verify source cards manually`
        );
      }
      return;
    }

    // The turn settled with no server failure signal: treat as answered.
    report(
      "F06",
      "PASS",
      "question sent; assistant answer completed within 60s"
    );

    // Sources render as a collapsed block whose summary matches /来源|source/i.
    const hasSourceSummary = SOURCE_SUMMARY_TEXT.test(text);
    const sourceToggle = page
      .locator(PANEL)
      .getByRole("button", { name: SOURCE_TEXT })
      .first();
    const sourceToggleVisible = await sourceToggle
      .isVisible()
      .catch(() => false);
    const sourcesShown = hasSourceSummary || sourceToggleVisible;
    if (sourceToggleVisible) await sourceToggle.click();
    const expandedSourceCount = await page
      .locator(`${PANEL} [data-agent-source-id]`)
      .count();
    const sourceLinkCount = await page
      .locator(`${PANEL} [data-agent-source-id] a[href]`)
      .count();
    const summaryCountMatch = text.match(/(\d+)\s*(?:个来源|source)/i);
    const summaryCount = summaryCountMatch
      ? Number.parseInt(summaryCountMatch[1], 10)
      : 0;
    const expandedSourcesValid =
      sourceToggleVisible &&
      expandedSourceCount === summaryCount &&
      sourceLinkCount > 0;
    report(
      "F11",
      sourcesShown && expandedSourcesValid ? "PASS" : "FAIL",
      `summaryText=${hasSourceSummary}; toggleButton=${sourceToggleVisible}; ` +
        `summaryCount=${summaryCount}; expandedCards=${expandedSourceCount}; links=${sourceLinkCount}`
    );
  } finally {
    await page.close().catch(() => {});
  }
}

async function f07(context) {
  const page = await context.newPage();
  let aborted = false;
  page.on("requestfailed", request => {
    if (
      streamRequestFilter(request) &&
      (request.failure()?.errorText ?? "").toLowerCase().includes("aborted")
    ) {
      aborted = true;
    }
  });
  try {
    // Hold the stream open so the panel stays in the sending state.
    await page.route(`**${STREAM_PATH}`, async route => {
      await new Promise(resolve => setTimeout(resolve, 6_000));
      try {
        await route.fulfill({
          status: 200,
          contentType: "text/event-stream",
          body: 'data: {"type":"final"}\n\n',
        });
      } catch {
        /* request already aborted */
      }
    });

    await gotoIdle(page, HOME);
    await openPanel(page);
    await submitMessage(page, "停止生成测试。");

    const becameStop = await waitFor(() => isSending(page), 6_000);
    if (!becameStop) {
      report("F07", "FAIL", "send button never switched to stop during stream");
      return;
    }
    await stopButton(page).click();
    const requestAborted = await waitFor(() => aborted, 6_000);
    const composerEnabled = await composer(page)
      .isEnabled()
      .catch(() => false);
    const labelBackToSend = await waitFor(
      async () => !(await isSending(page)),
      6_000
    );

    report(
      "F07",
      becameStop && requestAborted && composerEnabled && labelBackToSend
        ? "PASS"
        : "FAIL",
      `stopStateReached=${becameStop}; requestAborted=${requestAborted}; ` +
        `composerReEnabled=${composerEnabled}; labelBackToSend=${labelBackToSend}`
    );
  } catch (error) {
    report("F07", "FAIL", `error: ${error?.message ?? error}`);
  } finally {
    await page.close().catch(() => {});
  }
}

async function f08(context) {
  const page = await context.newPage();
  const question = "错误路径测试。";
  const conversationId = "11111111-1111-4111-8111-111111111111";
  const userMessageId = "22222222-2222-4222-8222-222222222222";
  let streamRequestCount = 0;
  const streamBodies = [];
  page.on("request", request => {
    if (streamRequestFilter(request)) streamRequestCount += 1;
  });
  try {
    await page.route(`**${STREAM_PATH}`, async route => {
      streamBodies.push(route.request().postDataJSON());
      const quota = {
        limit: 10,
        used: 1,
        remaining: 9,
        resetAt: "2026-06-06T16:00:00.000Z",
        tier: "anonymous",
        allowed: true,
      };
      const body = [
        `data: ${JSON.stringify({
          type: "status",
          stage: "understanding",
          elapsedMs: 2,
          conversationId,
          userMessageId,
        })}`,
        "",
        `data: ${JSON.stringify({
          type: "final",
          elapsedMs: 9,
          outcome: "failed",
          output: {
            status: "failed",
            conversationId,
            userMessageId,
            messageId: `assistant-failed-${streamBodies.length}`,
            quota,
            runStatus: "failed",
            errorCode: "agent_generation_failed",
          },
        })}`,
        "",
      ].join("\n");
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body,
      });
    });
    await gotoIdle(page, HOME);
    await openPanel(page);
    await submitMessage(page, question);

    const retryButton = page
      .locator(PANEL)
      .getByRole("button", { name: RETRY_NAME })
      .first();
    const retryVisible = await retryButton
      .waitFor({ state: "visible", timeout: 12_000 })
      .then(() => true)
      .catch(() => false);

    const panelText = await page.locator(PANEL).innerText();
    const stackPresent =
      /\bat\s+[^\n()]+\([^)]+:\d+:\d+\)/.test(panelText) ||
      panelText.includes("node_modules") ||
      /\bstack\s*trace\b/i.test(panelText);
    const userMessages = page
      .locator(`${PANEL} [data-agent-message-role="user"]`)
      .filter({ hasText: question });
    const userCountBeforeRetry = await userMessages.count();
    if (retryVisible) await retryButton.click();
    const secondRequest = await waitFor(() => streamRequestCount === 2, 8_000);
    await retryButton
      .waitFor({ state: "visible", timeout: 8_000 })
      .catch(() => {});
    const userCountAfterRetry = await userMessages.count();
    const retryDidNotDuplicateUser =
      userCountBeforeRetry === 1 && userCountAfterRetry === 1;
    const retryReusedPersistedUser =
      streamBodies.length === 2 &&
      !streamBodies[0]?.retryUserMessageId &&
      streamBodies[1]?.conversationId === conversationId &&
      streamBodies[1]?.retryUserMessageId === userMessageId &&
      streamBodies[1]?.message === question;

    report(
      "F08",
      retryVisible &&
        !stackPresent &&
        secondRequest &&
        retryDidNotDuplicateUser &&
        retryReusedPersistedUser
        ? "PASS"
        : "FAIL",
      `retryUiVisible=${retryVisible}; stackTextPresent=${stackPresent}; ` +
        `secondRequest=${secondRequest}; userMessages=${userCountBeforeRetry}->${userCountAfterRetry}; ` +
        `reusedPersistedUser=${retryReusedPersistedUser}`
    );
  } catch (error) {
    report("F08", "FAIL", `error: ${error?.message ?? error}`);
  } finally {
    await page.close().catch(() => {});
  }
}

async function f09(context) {
  const page = await context.newPage();
  try {
    await gotoIdle(page, HOME);
    await openPanel(page);
    const history = historyButton(page);
    await history.waitFor({ state: "visible", timeout: 10_000 });
    const before = await history.getAttribute("aria-expanded");

    await history.click();
    await page.waitForTimeout(300);
    const during = await history.getAttribute("aria-expanded");
    const textOpen = await page.locator(PANEL).innerText();
    const listShownWhileOpen =
      /最近对话|Recent conversations|暂无历史对话|No saved conversations/i.test(
        textOpen
      );

    const historyItems = page.locator(`${PANEL} [data-agent-conversation-id]`);
    // The list query can legitimately take longer than the panel animation,
    // especially while build/test jobs share the local server. F09 requires a
    // real saved thread, so wait for that observable state instead of sampling
    // the interim empty shell after a fixed 300 ms.
    await waitFor(async () => (await historyItems.count()) > 0, 10_000);
    const historyItemCount = await historyItems.count();
    if (historyItemCount > 0) await historyItems.first().click();
    const restored =
      historyItemCount > 0 &&
      (await waitFor(
        async () =>
          (await page.locator(`${PANEL} [data-agent-message-role]`).count()) >
          0,
        10_000
      ));
    const after = await history.getAttribute("aria-expanded");
    const textClosed = await page.locator(PANEL).innerText();
    const listHiddenAfterClose =
      !/最近对话|Recent conversations|暂无历史对话|No saved conversations/i.test(
        textClosed
      );

    const ok =
      (before === "false" || before === null) &&
      during === "true" &&
      (after === "false" || after === null) &&
      listShownWhileOpen &&
      listHiddenAfterClose &&
      restored;

    report(
      "F09",
      ok ? "PASS" : "FAIL",
      `aria-expanded ${before ?? "null"}->${during}->${after ?? "null"}; ` +
        `historyItems=${historyItemCount}; restored=${restored}; ` +
        `listShownWhileOpen=${listShownWhileOpen}; listHiddenAfterClose=${listHiddenAfterClose}`
    );
  } catch (error) {
    report("F09", "FAIL", `error: ${error?.message ?? error}`);
  } finally {
    await page.close().catch(() => {});
  }
}

async function f10(context) {
  const page = await context.newPage();
  try {
    await gotoIdle(page, POST_URL);
    await openPanel(page);
    const rowBefore = await contextRowText(page);

    const newThread = await findNewThread(page);
    if (!newThread) {
      report("F10", "FAIL", "new-thread control not found in the panel");
      return;
    }

    // Make sure there is something to clear: send a message when the empty
    // state is showing (the reply may succeed or error; both add messages).
    if (await emptyStateVisible(page)) {
      await submitMessage(page, "新建对话测试消息。");
      await waitFor(async () => !(await emptyStateVisible(page)), 15_000);
    }
    const hadMessages = !(await emptyStateVisible(page));
    const turnSettled = await waitFor(
      async () => !(await isSending(page)),
      60_000
    );

    await newThread.click();
    const cleared = await waitFor(() => emptyStateVisible(page), 8_000);
    const rowAfter = await contextRowText(page);
    const contextPersisted =
      rowBefore.trim().length > 0 && rowAfter.trim() === rowBefore.trim();
    await historyButton(page).click();
    const historyPreserved =
      (await page.locator(`${PANEL} [data-agent-conversation-id]`).count()) > 0;

    report(
      "F10",
      hadMessages &&
        turnSettled &&
        cleared &&
        contextPersisted &&
        historyPreserved
        ? "PASS"
        : "FAIL",
      `hadMessages=${hadMessages}; turnSettled=${turnSettled}; clearedToEmptyState=${cleared}; ` +
        `contextRowPersisted=${contextPersisted}; historyPreserved=${historyPreserved}`
    );
  } catch (error) {
    report("F10", "FAIL", `error: ${error?.message ?? error}`);
  } finally {
    await page.close().catch(() => {});
  }
}

async function f12(context) {
  const page = await context.newPage();
  try {
    await gotoIdle(page, HOME);
    await openPanel(page);

    const hasNewThread = Boolean(await findNewThread(page));

    // The send button is disabled while the draft is empty, which makes it
    // unreachable via Tab; type a draft so the full sequence is focusable.
    await composer(page)
      .click({ timeout: 10_000 })
      .catch(() => {});
    await page.keyboard.type("焦点检查");

    // Expected DOM/tab order inside the panel:
    // history -> new thread -> close -> starter prompts -> textarea -> send.
    // Start the walk from the history button.
    await historyButton(page).focus();

    const targets = {
      newThread: null,
      close: null,
      textarea: null,
      send: null,
    };
    for (let step = 0; step < 40; step += 1) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const element = document.activeElement;
        if (!element || element === document.body) return null;
        const style = window.getComputedStyle(element);
        return {
          tagName: element.tagName,
          ariaLabel: element.getAttribute("aria-label") ?? "",
          inForm: Boolean(element.closest("form")),
          focusRing:
            style.outlineStyle !== "none" || style.boxShadow !== "none",
          visible:
            typeof element.checkVisibility === "function"
              ? element.checkVisibility()
              : element.getClientRects().length > 0,
        };
      });
      if (!info) continue;

      if (targets.newThread === null && NEW_THREAD_NAME.test(info.ariaLabel)) {
        targets.newThread = { step, ...info };
      }
      if (targets.close === null && CLOSE_NAME.test(info.ariaLabel)) {
        targets.close = { step, ...info };
      }
      if (targets.textarea === null && info.tagName === "TEXTAREA") {
        targets.textarea = { step, ...info };
      }
      if (
        targets.send === null &&
        info.inForm &&
        /发送|Send|停止生成|Stop generating/i.test(info.ariaLabel)
      ) {
        targets.send = { step, ...info };
      }

      if (
        targets.close &&
        targets.textarea &&
        targets.send &&
        (!hasNewThread || targets.newThread)
      ) {
        break;
      }
    }

    const sendLabelOk = SEND_NAME.test(await sendLabel(page));

    const reached = {
      newThread: hasNewThread ? Boolean(targets.newThread) : true,
      close: Boolean(targets.close),
      textarea: Boolean(targets.textarea),
      send: Boolean(targets.send),
    };
    const ordered =
      targets.close &&
      targets.textarea &&
      targets.send &&
      targets.close.step < targets.textarea.step &&
      targets.textarea.step < targets.send.step &&
      (!hasNewThread ||
        (targets.newThread && targets.newThread.step < targets.close.step));
    const focusVisible = [
      targets.newThread,
      targets.close,
      targets.textarea,
      targets.send,
    ]
      .filter(Boolean)
      .every(target => target.focusRing && target.visible);

    const ok =
      Object.values(reached).every(Boolean) &&
      ordered &&
      focusVisible &&
      sendLabelOk;

    report(
      "F12",
      ok ? "PASS" : "FAIL",
      `reached=${JSON.stringify(reached)}; tabOrder=${JSON.stringify({
        newThread: targets.newThread?.step ?? null,
        close: targets.close?.step ?? null,
        textarea: targets.textarea?.step ?? null,
        send: targets.send?.step ?? null,
      })}; focusVisible=${focusVisible}; ` +
        `sendAriaLabel=${sendLabelOk}; newThreadControlPresent=${hasNewThread}`
    );
  } catch (error) {
    report("F12", "FAIL", `error: ${error?.message ?? error}`);
  } finally {
    await page.close().catch(() => {});
  }
}

/* ------------------------------------------------------------------ */
/* main                                                                */
/* ------------------------------------------------------------------ */

async function main() {
  assertSafeTarget();
  console.log(`agent-upgrade functional QA against ${BASE_URL}`);

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    console.log(
      `FAIL F00 could not launch chromium: ${error?.message ?? error}`
    );
    console.log("SUMMARY: browser launch failed; no checks executed");
    process.exitCode = 1;
    return;
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "zh-CN",
    deviceScaleFactor: 1,
  });

  try {
    await f01(context);
    await f02(context);
    await f03(context);
    await f04(context);
    await f05(context);
    await f06f11(context);
    await f07(context);
    await f08(context);
    await f09(context);
    await f10(context);
    await f12(context);
  } catch (error) {
    report(
      "F00",
      "FAIL",
      `unexpected harness error: ${error?.message ?? error}`
    );
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }

  const pass = results.filter(r => r.status === "PASS").length;
  const fail = results.filter(r => r.status === "FAIL").length;
  const manual = results.filter(r => r.status === "MANUAL").length;
  console.log(
    `SUMMARY: ${pass} PASS / ${fail} FAIL / ${manual} MANUAL of ${results.length} checks — ${summaryNote()}`
  );
  process.exitCode = fail > 0 ? 1 : manual > 0 ? 2 : 0;
}

main().catch(error => {
  console.log(`FAIL F00 fatal: ${error?.message ?? error}`);
  console.log("SUMMARY: fatal harness error");
  process.exitCode = 1;
});
