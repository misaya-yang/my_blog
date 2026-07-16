import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

type Viewport = {
  name: string;
  width: number;
  height: number;
};

type LayoutMetric = {
  route: string;
  viewport: Viewport;
  checks: Record<string, boolean>;
  measurements: Record<string, number | string | boolean | null>;
};

type UiLayoutReport = {
  generatedAt: string;
  baseUrl: string;
  passed: boolean;
  results: LayoutMetric[];
};

const require = createRequire(import.meta.url);
const baseUrl = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";
const outputPath =
  process.argv
    .find(arg => arg.startsWith("--output="))
    ?.slice("--output=".length) ??
  "docs/product_optimization/reports/ui-layout-checks-latest.json";

async function main() {
  const playwright = loadPlaywright();
  const browser = await playwright.chromium.launch();
  const results: LayoutMetric[] = [];

  try {
    results.push(
      await inspectHome(browser, { name: "mobile", width: 390, height: 844 }),
      await inspectHome(browser, {
        name: "desktop",
        width: 1440,
        height: 1000,
      }),
      await inspectPost(browser, { name: "mobile", width: 390, height: 844 }),
      await inspectPost(browser, {
        name: "desktop",
        width: 1440,
        height: 1000,
      }),
      await inspectSearchZero(browser, {
        name: "mobile",
        width: 390,
        height: 844,
      }),
      await inspectArchive(browser, {
        name: "mobile",
        width: 390,
        height: 844,
      }),
      await inspectArchive(browser, {
        name: "desktop",
        width: 1440,
        height: 1000,
      }),
      await inspectTaxonomy(browser, {
        name: "mobile",
        width: 390,
        height: 844,
      }),
      await inspectTaxonomy(browser, {
        name: "desktop",
        width: 1440,
        height: 1000,
      }),
      await inspectAgentDialog(browser, {
        name: "mobile",
        width: 390,
        height: 844,
      }),
      await inspectAgentDialog(browser, {
        name: "tablet",
        width: 1024,
        height: 768,
      }),
      await inspectAgentAnswerFixture(browser, {
        name: "mobile",
        width: 390,
        height: 844,
      }),
      await inspectAgentAnswerFixture(browser, {
        name: "desktop",
        width: 1440,
        height: 900,
      }),
      await inspectAccessibilityRoute(
        browser,
        { name: "a11y-home-320", width: 320, height: 844 },
        "/",
        "main"
      ),
      await inspectAccessibilityRoute(
        browser,
        { name: "a11y-post-320", width: 320, height: 844 },
        "/post/goal-harness-agent-phase-protocol",
        "[data-article-markdown-ready] + *"
      ),
      await inspectAccessibilityRoute(
        browser,
        { name: "a11y-search-zero-320", width: 320, height: 844 },
        "/search?q=zzzz-no-hit-ui-audit",
        ".search-recovery-primary"
      ),
      await inspectAccessibilityRoute(
        browser,
        { name: "a11y-manage-320", width: 320, height: 844 },
        "/manage",
        ".auth-required-shell, .owner-ops-page"
      ),
      await inspectAccessibilityRoute(
        browser,
        { name: "a11y-manage-agent-320", width: 320, height: 844 },
        "/manage/agent",
        ".auth-required-shell, .agent-console-page"
      )
    );
  } finally {
    await browser.close();
  }

  const report: UiLayoutReport = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    passed: results.every(result =>
      Object.values(result.checks).every(Boolean)
    ),
    results,
  };

  await mkdir(dirname(resolve(outputPath)), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);

  if (!report.passed) {
    console.error(`UI layout audit failed. See ${outputPath}`);
    process.exit(1);
  }

  console.log(`UI layout audit passed. See ${outputPath}`);
}

function loadPlaywright() {
  try {
    return require("playwright") as {
      chromium: {
        launch: () => Promise<BrowserLike>;
      };
    };
  } catch {
    throw new Error(
      "Playwright is required for audit:ui. Run in an environment with Playwright available, or install it as a dev dependency before using this gate."
    );
  }
}

async function inspectHome(browser: BrowserLike, viewport: Viewport) {
  const page = await newMeasuredPage(browser, viewport);
  await gotoAndWait(
    page,
    `${baseUrl}/`,
    ".home-featured-note-body, .home-note-error"
  );
  await page.waitForSelector(
    "#research-index .article-card, .home-index-error"
  );

  const measurements = await page.evaluate(() => {
    const featuredNote = document.querySelector(".home-featured-note-body");
    const firstArticle = document.querySelector(
      "#research-index .article-card"
    );
    const researchIndex = document.querySelector("#research-index");
    const header = document.querySelector(".site-header");
    const searchDock = document.querySelector(".home-search-dock");
    return {
      featuredNoteY: rectTop(featuredNote),
      firstArticleY: rectTop(firstArticle),
      researchIndexY: rectTop(researchIndex),
      headerHeight: rectHeight(header),
      searchDockY: rectTop(searchDock),
      bodyScrollWidth: document.body.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };

    function rectTop(element: Element | null) {
      return element?.getBoundingClientRect().top ?? null;
    }

    function rectHeight(element: Element | null) {
      return element?.getBoundingClientRect().height ?? null;
    }
  });

  await page.close();

  return {
    route: "/",
    viewport,
    measurements,
    checks: {
      noHorizontalOverflow:
        measurements.bodyScrollWidth <= measurements.viewportWidth &&
        measurements.documentScrollWidth <= measurements.viewportWidth,
      headerHeightWithinLimit: Number(measurements.headerHeight ?? 0) <= 72,
      featuredNoteVisibleSoon:
        Number(measurements.featuredNoteY ?? Infinity) <=
        (viewport.width < 768 ? 420 : 460),
      firstArticleVisibleSoon:
        viewport.width < 768
          ? Number(measurements.firstArticleY ?? Infinity) <= 2600
          : true,
      researchIndexFollowsPrimaryMap:
        Number(measurements.researchIndexY ?? Infinity) <=
        (viewport.width < 768 ? 2100 : 980),
      searchDockEarly:
        viewport.width < 768
          ? Number(measurements.searchDockY ?? Infinity) <=
            viewport.height + 120
          : true,
    },
  };
}

async function inspectPost(browser: BrowserLike, viewport: Viewport) {
  const page = await newMeasuredPage(browser, viewport);
  await gotoAndWait(
    page,
    `${baseUrl}/post/goal-harness-agent-phase-protocol`,
    "[data-article-markdown-ready] + *"
  );

  const measurements = await page.evaluate(() => {
    const header = document.querySelector(".site-header");
    const prose = document.querySelector(".article-prose");
    const entry = document.querySelector(".article-entry-layer");
    const feedback = document.querySelector<HTMLElement>(
      ".article-feedback-panel"
    );
    const feedbackSubmit = feedback?.querySelector<HTMLButtonElement>(
      'button[type="submit"]'
    );
    const subscription = document.querySelector<HTMLElement>(
      ".article-subscription-panel"
    );
    const subscriptionSubmit =
      subscription?.querySelector<HTMLButtonElement>('button[type="submit"]');
    return {
      headerHeight: rectHeight(header),
      proseY: rectTop(prose),
      entryHeight: rectHeight(entry),
      preBodyAuthorUtilityCount: document.querySelectorAll(
        '.article-reading-header a[href*="scholar.google"], .article-reading-header button'
      ).length,
      feedbackHeight: rectHeight(feedback),
      feedbackClientWidth: feedback?.clientWidth ?? null,
      feedbackScrollWidth: feedback?.scrollWidth ?? null,
      feedbackSentimentButtons: feedback?.querySelectorAll(
        'button[aria-pressed="false"], button[aria-pressed="true"]'
      ).length ?? 0,
      feedbackDetailToggle: Boolean(
        feedback?.querySelector(".article-feedback-detail-toggle")
      ),
      feedbackDetailExpanded:
        feedback
          ?.querySelector(".article-feedback-detail-toggle")
          ?.getAttribute("aria-expanded") ?? null,
      feedbackTextareaCount:
        feedback?.querySelectorAll("textarea").length ?? 0,
      feedbackInputCount: feedback?.querySelectorAll("input").length ?? 0,
      feedbackSubmitExists: Boolean(feedbackSubmit),
      feedbackSubmitDisabled: feedbackSubmit?.disabled ?? null,
      subscriptionHeight: rectHeight(subscription),
      subscriptionClientWidth: subscription?.clientWidth ?? null,
      subscriptionScrollWidth: subscription?.scrollWidth ?? null,
      subscriptionInputCount:
        subscription?.querySelectorAll("input").length ?? 0,
      subscriptionLanguageControl: Boolean(
        subscription?.querySelector(".subscription-language-control")
      ),
      subscriptionDetailToggle: Boolean(
        subscription?.querySelector(".subscription-details-toggle")
      ),
      subscriptionDetailExpanded:
        subscription
          ?.querySelector(".subscription-details-toggle")
          ?.getAttribute("aria-expanded") ?? null,
      subscriptionSubmitExists: Boolean(subscriptionSubmit),
      subscriptionRssLink: Boolean(
        subscription?.querySelector('a[href="/rss.xml"]')
      ),
      bodyScrollWidth: document.body.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };

    function rectTop(element: Element | null) {
      return element?.getBoundingClientRect().top ?? null;
    }

    function rectHeight(element: Element | null) {
      return element?.getBoundingClientRect().height ?? null;
    }
  });

  await page.close();

  return {
    route: "/post/goal-harness-agent-phase-protocol",
    viewport,
    measurements,
    checks: {
      noHorizontalOverflow:
        measurements.bodyScrollWidth <= measurements.viewportWidth &&
        measurements.documentScrollWidth <= measurements.viewportWidth,
      headerHeightWithinLimit: Number(measurements.headerHeight ?? 0) <= 72,
      proseStartsSoon:
        viewport.width < 768
          ? Number(measurements.proseY ?? Infinity) <= 590
          : Number(measurements.proseY ?? Infinity) <= 520,
      noPreBodyAuthorUtilities:
        Number(measurements.preBodyAuthorUtilityCount) === 0,
      entryLayerCompact:
        Number(measurements.entryHeight ?? Infinity) <=
        (viewport.width < 768 ? 390 : 300),
      feedbackNoHorizontalOverflow:
        Number(measurements.feedbackScrollWidth ?? Infinity) <=
        Number(measurements.feedbackClientWidth ?? 0) + 1,
      feedbackProgressiveDefault:
        Number(measurements.feedbackTextareaCount) === 0 &&
        Number(measurements.feedbackInputCount) === 0 &&
        measurements.feedbackDetailExpanded === "false",
      feedbackActionsAvailable:
        Number(measurements.feedbackSentimentButtons) === 2 &&
        Boolean(measurements.feedbackDetailToggle) &&
        Boolean(measurements.feedbackSubmitExists),
      feedbackCompact:
        Number(measurements.feedbackHeight ?? Infinity) <=
        (viewport.width < 768 ? 360 : 330),
      feedbackSubmitWaitsForSignal:
        measurements.feedbackSubmitDisabled === true,
      subscriptionNoHorizontalOverflow:
        Number(measurements.subscriptionScrollWidth ?? Infinity) <=
        Number(measurements.subscriptionClientWidth ?? 0) + 1,
      subscriptionProgressiveDefault:
        Number(measurements.subscriptionInputCount) === 1 &&
        measurements.subscriptionLanguageControl === false &&
        measurements.subscriptionDetailExpanded === "false",
      subscriptionActionsAvailable:
        Boolean(measurements.subscriptionDetailToggle) &&
        Boolean(measurements.subscriptionSubmitExists) &&
        Boolean(measurements.subscriptionRssLink),
      subscriptionCompact:
        Number(measurements.subscriptionHeight ?? Infinity) <=
        (viewport.width < 768 ? 340 : 300),
    },
  };
}

async function inspectSearchZero(browser: BrowserLike, viewport: Viewport) {
  const page = await newMeasuredPage(browser, viewport);
  await gotoAndWait(
    page,
    `${baseUrl}/search?q=zzzz-no-hit-ui-audit`,
    ".search-recovery-primary"
  );

  const measurements = await page.evaluate(() => {
    const recovery = document.querySelector(".search-recovery-primary");
    const action = document.querySelector(".search-recovery-agent-button");
    return {
      recoveryY: rectTop(recovery),
      actionY: rectTop(action),
      clearExists: Boolean(document.querySelector(".search-recovery-clear")),
      bodyScrollWidth: document.body.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };

    function rectTop(element: Element | null) {
      return element?.getBoundingClientRect().top ?? null;
    }
  });

  await page.close();

  return {
    route: "/search?q=zzzz-no-hit-ui-audit",
    viewport,
    measurements,
    checks: {
      noHorizontalOverflow:
        measurements.bodyScrollWidth <= measurements.viewportWidth &&
        measurements.documentScrollWidth <= measurements.viewportWidth,
      primaryRecoveryVisible:
        Number(measurements.recoveryY ?? Infinity) < viewport.height,
      agentActionVisible:
        Number(measurements.actionY ?? Infinity) < viewport.height,
      clearSearchAvailable: Boolean(measurements.clearExists),
    },
  };
}

async function inspectArchive(browser: BrowserLike, viewport: Viewport) {
  const page = await newMeasuredPage(browser, viewport);
  await gotoAndWait(page, `${baseUrl}/archive`, ".archive-post-row");

  const measurements = await page.evaluate(() => {
    const summary = document.querySelector(".archive-summary-strip");
    const firstRow = document.querySelector(".archive-post-row");
    const firstTitle = document.querySelector(".archive-post-title");
    return {
      summaryTop: rectTop(summary),
      firstRowTop: rectTop(firstRow),
      firstRowHeight: rectHeight(firstRow),
      firstTitleLineHeight: computedLineHeight(firstTitle),
      rowCount: document.querySelectorAll(".archive-post-row").length,
      bodyScrollWidth: document.body.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };

    function rectTop(element: Element | null) {
      return element?.getBoundingClientRect().top ?? null;
    }

    function rectHeight(element: Element | null) {
      return element?.getBoundingClientRect().height ?? null;
    }

    function computedLineHeight(element: Element | null) {
      if (!element) return null;
      return window.getComputedStyle(element).lineHeight;
    }
  });

  await page.close();

  return {
    route: "/archive",
    viewport,
    measurements,
    checks: {
      noHorizontalOverflow:
        Number(measurements.bodyScrollWidth) <=
          Number(measurements.viewportWidth) &&
        Number(measurements.documentScrollWidth) <=
          Number(measurements.viewportWidth),
      archiveRowsPresent: Number(measurements.rowCount) > 0,
      summaryVisibleSoon:
        Number(measurements.summaryTop ?? Infinity) <=
        (viewport.width < 768 ? viewport.height + 80 : 520),
      firstRowVisibleSoon:
        Number(measurements.firstRowTop ?? Infinity) <=
        (viewport.width < 768 ? 1200 : 760),
      rowDensityReadable:
        Number(measurements.firstRowHeight ?? 0) >= 56 &&
        Number(measurements.firstRowHeight ?? Infinity) <=
          (viewport.width < 768 ? 260 : 150),
      titleLineHeightReadable:
        parseFloat(String(measurements.firstTitleLineHeight ?? "0")) >= 22,
    },
  };
}

async function inspectTaxonomy(browser: BrowserLike, viewport: Viewport) {
  const page = await newMeasuredPage(browser, viewport);
  await gotoAndWait(
    page,
    `${baseUrl}/categories/ai-applications`,
    ".taxonomy-article-row"
  );

  const measurements = await page.evaluate(() => {
    const sidePanel = document.querySelector(".taxonomy-side-panel");
    const notesSurface = document.querySelector(".taxonomy-notes-surface");
    const firstRow = document.querySelector(".taxonomy-article-row");
    const firstTitle = document.querySelector(".taxonomy-article-title");
    return {
      sidePanelTop: rectTop(sidePanel),
      sidePanelHeight: rectHeight(sidePanel),
      notesTop: rectTop(notesSurface),
      firstRowTop: rectTop(firstRow),
      firstRowHeight: rectHeight(firstRow),
      firstTitleLineHeight: computedLineHeight(firstTitle),
      rowCount: document.querySelectorAll(".taxonomy-article-row").length,
      sideTagCount: sidePanel?.querySelectorAll(".article-tag").length ?? 0,
      bodyScrollWidth: document.body.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };

    function rectTop(element: Element | null) {
      return element?.getBoundingClientRect().top ?? null;
    }

    function rectHeight(element: Element | null) {
      return element?.getBoundingClientRect().height ?? null;
    }

    function computedLineHeight(element: Element | null) {
      if (!element) return null;
      return window.getComputedStyle(element).lineHeight;
    }
  });

  await page.close();

  return {
    route: "/categories/ai-applications",
    viewport,
    measurements,
    checks: {
      noHorizontalOverflow:
        Number(measurements.bodyScrollWidth) <=
          Number(measurements.viewportWidth) &&
        Number(measurements.documentScrollWidth) <=
          Number(measurements.viewportWidth),
      taxonomyRowsPresent: Number(measurements.rowCount) > 0,
      relatedTagsBounded: Number(measurements.sideTagCount) <= 12,
      sidePanelAfterNotesOnMobile:
        viewport.width >= 1024 ||
        Number(measurements.sidePanelTop ?? Infinity) >
          Number(measurements.notesTop ?? -Infinity),
      notesSurfaceVisibleSoon:
        Number(measurements.notesTop ?? Infinity) <=
        (viewport.width < 768 ? 760 : 520),
      firstRowVisibleSoon:
        Number(measurements.firstRowTop ?? Infinity) <=
        (viewport.width < 768 ? 980 : 760),
      rowDensityReadable:
        Number(measurements.firstRowHeight ?? 0) >= 88 &&
        Number(measurements.firstRowHeight ?? Infinity) <=
          (viewport.width < 768 ? 260 : 190),
      titleLineHeightReadable:
        parseFloat(String(measurements.firstTitleLineHeight ?? "0")) >= 22,
    },
  };
}

async function inspectAgentDialog(browser: BrowserLike, viewport: Viewport) {
  const page = await newMeasuredPage(browser, viewport);
  const triggerSelector =
    viewport.width < 768
      ? "[data-mobile-agent-trigger]"
      : ".agent-liquid-launcher";
  await gotoAndWait(page, `${baseUrl}/`, ".home-index-spread");
  await page.waitForSelector(triggerSelector);
  await page.click(triggerSelector);
  await page.waitForSelector(".agent-liquid-panel");
  await page.waitForTimeout(120);

  const measurements = await page.evaluate(() => {
    const trigger = document.querySelector(
      window.innerWidth < 768
        ? "[data-mobile-agent-trigger]"
        : ".agent-liquid-launcher"
    );
    const launcher = document.querySelector(".agent-liquid-launcher");
    const panel = document.querySelector(".agent-liquid-panel");
    const routeSurface = document.querySelector<HTMLElement>(
      "[data-route-surface]"
    );
    return {
      triggerControls: trigger?.getAttribute("aria-controls") ?? null,
      triggerExpanded: trigger?.getAttribute("aria-expanded") ?? null,
      floatingLauncherHidden:
        launcher instanceof HTMLElement
          ? window.getComputedStyle(launcher).display === "none"
          : true,
      panelRole: panel?.getAttribute("role") ?? null,
      panelModal: panel?.getAttribute("aria-modal") ?? null,
      panelLabelledBy: panel?.getAttribute("aria-labelledby") ?? null,
      activeElementInsidePanel:
        panel?.contains(document.activeElement) ?? false,
      bodyPosition: document.body.style.position,
      routeSurfaceInert: routeSurface?.inert ?? false,
      routeSurfaceAriaHidden:
        routeSurface?.getAttribute("aria-hidden") ?? null,
    };
  });

  await page.keyboard.press("Shift+Tab");
  const reverseTabTrapped = await page.evaluate(
    () =>
      document
        .querySelector(".agent-liquid-panel")
        ?.contains(document.activeElement) ?? false
  );
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => {
    window.scrollTo(0, 600);
  });
  await page.waitForTimeout(60);
  const scrollAfter = await page.evaluate(() => window.scrollY);

  await page.keyboard.press("Escape");
  await page.waitForTimeout(120);
  const afterEscape = await page.evaluate(() => {
    const trigger = document.querySelector(
      window.innerWidth < 768
        ? "[data-mobile-agent-trigger]"
        : ".agent-liquid-launcher"
    );
    const routeSurface = document.querySelector<HTMLElement>(
      "[data-route-surface]"
    );
    return {
      panelExists: Boolean(document.querySelector(".agent-liquid-panel")),
      activeIsTrigger: document.activeElement === trigger,
      triggerExpanded: trigger?.getAttribute("aria-expanded") ?? null,
      bodyPosition: document.body.style.position,
      routeSurfaceInert: routeSurface?.inert ?? false,
      routeSurfaceAriaHidden:
        routeSurface?.getAttribute("aria-hidden") ?? null,
    };
  });
  await page.close();

  return {
    route: "/",
    viewport,
    measurements: {
      ...measurements,
      reverseTabTrapped,
      scrollBefore,
      scrollAfter,
      ...afterEscape,
    },
    checks: {
      triggerControlsPanel: Boolean(measurements.triggerControls),
      triggerReflectsOpenState: measurements.triggerExpanded === "true",
      mobileFloatingLauncherHidden:
        viewport.width >= 768 || Boolean(measurements.floatingLauncherHidden),
      panelIsDialog: measurements.panelRole === "dialog",
      panelIsModal: measurements.panelModal === "true",
      panelHasName: Boolean(measurements.panelLabelledBy),
      focusEnteredPanel: Boolean(measurements.activeElementInsidePanel),
      reverseTabStaysInPanel: reverseTabTrapped,
      modalLocksBackgroundScroll: scrollBefore === scrollAfter,
      modalMakesRouteInert: Boolean(measurements.routeSurfaceInert),
      modalHidesRouteFromAccessibilityTree:
        measurements.routeSurfaceAriaHidden === "true",
      escapeClosesPanel: !afterEscape.panelExists,
      focusReturnsToTrigger: afterEscape.activeIsTrigger,
      closeRestoresTriggerState: afterEscape.triggerExpanded === "false",
      closeRestoresBody: afterEscape.bodyPosition === "",
      closeRestoresRoute:
        !afterEscape.routeSurfaceInert &&
        afterEscape.routeSurfaceAriaHidden === null,
    },
  };
}

async function inspectAgentAnswerFixture(
  browser: BrowserLike,
  viewport: Viewport
) {
  const page = await newMeasuredPage(browser, viewport);
  const triggerSelector =
    viewport.width < 768
      ? "[data-mobile-agent-trigger]"
      : ".agent-liquid-launcher";
  await gotoAndWait(
    page,
    `${baseUrl}/post/goal-harness-agent-phase-protocol`,
    "[data-article-markdown-ready] + *"
  );
  await page.waitForSelector(triggerSelector);
  await page.click(triggerSelector);
  await page.waitForSelector(".agent-liquid-panel");
  await page.waitForSelector(".agent-message-scroll");
  await page.waitForTimeout(120);

  const measurements = await page.evaluate(() => {
    const scroller = document.querySelector<HTMLElement>(
      ".agent-message-scroll"
    );
    if (!scroller) {
      return {
        fixtureMounted: false,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
        panelClientWidth: null,
        panelScrollWidth: null,
        scrollerClientWidth: null,
        scrollerScrollWidth: null,
        messageBubbleClientWidth: null,
        messageBubbleScrollWidth: null,
        sourceClientWidth: null,
        sourceScrollWidth: null,
        sourceTotal: 0,
        sourceChipCount: 0,
        sourceListCount: 0,
        expandedSourceClientWidth: null,
        expandedSourceScrollWidth: null,
        expandedSourceClientHeight: null,
        expandedSourceScrollHeight: null,
        relatedClientWidth: null,
        relatedScrollWidth: null,
        sourceToggleExpanded: null,
        panelTop: null,
        panelBottom: null,
        scrollerTop: null,
        scrollerBottom: null,
        answerTop: null,
        answerBottom: null,
        sourceSummaryTop: null,
        sourceSummaryBottom: null,
        composerTop: null,
        composerBottom: null,
      };
    }

    scroller.innerHTML = `
      <div class="space-y-4">
        <article class="agent-message-row flex min-w-0 gap-3 justify-start">
          <span class="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-md border border-slate-700 bg-slate-950/55 text-slate-300" aria-hidden="true"></span>
          <div class="agent-message-bubble agent-message-bubble-assistant w-full max-w-[calc(100%-2.75rem)] rounded-md border border-slate-700/70 bg-slate-950/35 px-3.5 py-2.5 text-sm leading-6 text-slate-200">
            <div class="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-li:my-1">
              <p class="agent-fixture-answer-start">这是一段足够长的伴读回答，用于验证回答完成后读者仍然先看到答案，而不是被来源区块推到面板底部。它覆盖中文长句、英文术语 RLHF / retrieval / source grounding，以及不会自动产生横向滚动的超长词 longretrievalgroundingcitationidentifierwithoutspaces。</p>
              <p>第二段继续模拟真实回答内容，包含列表、解释和小结。布局要求是正文仍然可读，来源入口保持可追溯但默认收起，输入框在当前视口内可继续使用。</p>
            </div>
            <div class="agent-sources mt-3 border-t border-slate-800/80 pt-3" data-source-total="5">
              <div class="agent-source-summary flex min-w-0 flex-wrap items-center justify-between gap-2 text-xs">
                <div class="flex min-w-0 flex-1 items-center gap-2">
                  <span class="shrink-0 font-semibold text-slate-500">5 个来源</span>
                  <div class="agent-source-chips flex min-w-0 flex-1 items-center gap-1.5">
                    <span class="agent-source-chip truncate rounded-md border border-slate-700 bg-slate-950/35 px-2 py-0.5 text-[0.68rem] font-medium text-slate-400">大模型强化学习：从 RLHF 到可验证奖励</span>
                    <span class="agent-source-chip truncate rounded-md border border-slate-700 bg-slate-950/35 px-2 py-0.5 text-[0.68rem] font-medium text-slate-400">Agent Phase Harness 设计协议</span>
                    <span class="agent-source-chip shrink-0 rounded-md border border-slate-700 bg-slate-950/35 px-2 py-0.5 text-[0.68rem] font-medium text-slate-500">+3</span>
                  </div>
                </div>
                <button type="button" aria-expanded="false" class="agent-source-toggle inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border border-slate-700 bg-white/[0.025] px-2.5 py-1.5 text-xs font-medium text-slate-300">查看来源</button>
              </div>
            </div>
            <div class="agent-related-tasks mt-3 border-t border-slate-800 pt-3">
              <div class="agent-related-title mb-2 flex items-center gap-1.5 text-[0.72rem] font-semibold text-slate-500">继续阅读</div>
              <div class="agent-related-list grid gap-1.5">
                <button type="button" class="agent-related-button inline-flex min-w-0 items-center justify-between gap-2 rounded-md border border-slate-700 bg-white/[0.025] px-2.5 py-1.5 text-left text-xs leading-5 text-slate-300">
                  <span class="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">把这篇文章放进一条公开阅读路径。</span>
                </button>
                <button type="button" class="agent-related-button inline-flex min-w-0 items-center justify-between gap-2 rounded-md border border-slate-700 bg-white/[0.025] px-2.5 py-1.5 text-left text-xs leading-5 text-slate-300">
                  <span class="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">继续梳理 longfollowupreadingtaskwithoutspacesandwithoutscrolling。</span>
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>
    `;
    scroller.scrollTop = 0;

    const panel = document.querySelector<HTMLElement>(".agent-liquid-panel");
    const messageBubble =
      document.querySelector<HTMLElement>(".agent-message-bubble");
    const answerStart = document.querySelector<HTMLElement>(
      ".agent-fixture-answer-start"
    );
    const sourceSummary = document.querySelector<HTMLElement>(
      ".agent-source-summary"
    );
    const sources = document.querySelector<HTMLElement>(".agent-sources");
    const sourceToggle = document.querySelector<HTMLElement>(
      ".agent-source-toggle"
    );
    const collapsedSourceListCount =
      document.querySelectorAll(".agent-source-list").length;
    const relatedTasks = document.querySelector<HTMLElement>(
      ".agent-related-tasks"
    );
    let expandedSourceClientWidth: number | null = null;
    let expandedSourceScrollWidth: number | null = null;
    let expandedSourceClientHeight: number | null = null;
    let expandedSourceScrollHeight: number | null = null;
    if (sources) {
      const expandedList = document.createElement("div");
      expandedList.className =
        "agent-source-list mt-2 grid gap-2 overflow-y-auto overflow-x-hidden pr-1";
      expandedList.innerHTML = Array.from(
        { length: 8 },
        (_, index) => `
          <div class="agent-source-card rounded-md border border-slate-700/80 bg-slate-950/30 px-2.5 py-2">
            <div class="flex min-w-0 items-start gap-2.5">
              <span class="agent-source-icon mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md border" aria-hidden="true"></span>
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-semibold text-slate-100">来源 ${index + 1}：longsourceheadingwithoutspacesandwithoutlayoutoverflow</div>
                <details class="agent-source-detail mt-1">
                  <summary class="cursor-pointer list-none text-[0.7rem] font-medium text-slate-500">摘录与匹配依据</summary>
                  <p class="mt-1 text-xs leading-5 text-slate-500">这是一段展开来源摘录，包含 longsourceexcerptidentifierwithoutspacesandwithwrappingrequirements。</p>
                </details>
              </div>
            </div>
          </div>`
      ).join("");
      sources.appendChild(expandedList);
      expandedSourceClientWidth = expandedList.clientWidth;
      expandedSourceScrollWidth = expandedList.scrollWidth;
      expandedSourceClientHeight = expandedList.clientHeight;
      expandedSourceScrollHeight = expandedList.scrollHeight;
    }
    const composer = document.querySelector<HTMLElement>(
      ".agent-liquid-panel form"
    );
    const panelRect = rect(panel);
    const scrollerRect = rect(scroller);
    const answerRect = rect(answerStart);
    const composerRect = rect(composer);
    const sourceSummaryRect = rect(sourceSummary);

    return {
      fixtureMounted: true,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      panelClientWidth: panel?.clientWidth ?? null,
      panelScrollWidth: panel?.scrollWidth ?? null,
      scrollerClientWidth: scroller.clientWidth,
      scrollerScrollWidth: scroller.scrollWidth,
      messageBubbleClientWidth: messageBubble?.clientWidth ?? null,
      messageBubbleScrollWidth: messageBubble?.scrollWidth ?? null,
      sourceClientWidth: sources?.clientWidth ?? null,
      sourceScrollWidth: sources?.scrollWidth ?? null,
      expandedSourceClientWidth,
      expandedSourceScrollWidth,
      expandedSourceClientHeight,
      expandedSourceScrollHeight,
      sourceTotal: Number(sources?.dataset.sourceTotal ?? 0),
      sourceChipCount: document.querySelectorAll(".agent-source-chip").length,
      sourceListCount: collapsedSourceListCount,
      relatedClientWidth: relatedTasks?.clientWidth ?? null,
      relatedScrollWidth: relatedTasks?.scrollWidth ?? null,
      sourceToggleExpanded:
        sourceToggle?.getAttribute("aria-expanded") ?? null,
      panelTop: panelRect.top,
      panelBottom: panelRect.bottom,
      scrollerTop: scrollerRect.top,
      scrollerBottom: scrollerRect.bottom,
      answerTop: answerRect.top,
      answerBottom: answerRect.bottom,
      sourceSummaryTop: sourceSummaryRect.top,
      sourceSummaryBottom: sourceSummaryRect.bottom,
      composerTop: composerRect.top,
      composerBottom: composerRect.bottom,
    };

    function rect(element: Element | null) {
      const value = element?.getBoundingClientRect();
      return {
        top: value?.top ?? null,
        bottom: value?.bottom ?? null,
      };
    }
  });

  await page.close();

  const viewportHeight = Number(measurements.viewportHeight ?? 0);
  const panelClientWidth = Number(measurements.panelClientWidth ?? 0);
  const panelScrollWidth = Number(measurements.panelScrollWidth ?? Infinity);
  const scrollerClientWidth = Number(measurements.scrollerClientWidth ?? 0);
  const scrollerScrollWidth = Number(
    measurements.scrollerScrollWidth ?? Infinity
  );
  const bubbleClientWidth = Number(measurements.messageBubbleClientWidth ?? 0);
  const bubbleScrollWidth = Number(
    measurements.messageBubbleScrollWidth ?? Infinity
  );
  const sourceClientWidth = Number(measurements.sourceClientWidth ?? 0);
  const sourceScrollWidth = Number(
    measurements.sourceScrollWidth ?? Infinity
  );
  const expandedSourceClientWidth = Number(
    measurements.expandedSourceClientWidth ?? 0
  );
  const expandedSourceScrollWidth = Number(
    measurements.expandedSourceScrollWidth ?? Infinity
  );
  const expandedSourceClientHeight = Number(
    measurements.expandedSourceClientHeight ?? 0
  );
  const expandedSourceScrollHeight = Number(
    measurements.expandedSourceScrollHeight ?? 0
  );
  const relatedClientWidth = Number(measurements.relatedClientWidth ?? 0);
  const relatedScrollWidth = Number(
    measurements.relatedScrollWidth ?? Infinity
  );
  const answerTop = Number(measurements.answerTop ?? Infinity);
  const answerBottom = Number(measurements.answerBottom ?? Infinity);
  const scrollerTop = Number(measurements.scrollerTop ?? -Infinity);
  const scrollerBottom = Number(measurements.scrollerBottom ?? Infinity);
  const composerTop = Number(measurements.composerTop ?? Infinity);
  const composerBottom = Number(measurements.composerBottom ?? Infinity);
  const sourceSummaryBottom = Number(
    measurements.sourceSummaryBottom ?? Infinity
  );

  return {
    route: "/post/goal-harness-agent-phase-protocol#agent-answer-fixture",
    viewport,
    measurements,
    checks: {
      fixtureMounted: Boolean(measurements.fixtureMounted),
      noPanelHorizontalOverflow: panelScrollWidth <= panelClientWidth + 1,
      noMessageHorizontalOverflow:
        scrollerScrollWidth <= scrollerClientWidth + 1 &&
        bubbleScrollWidth <= bubbleClientWidth + 1 &&
        sourceScrollWidth <= sourceClientWidth + 1,
      answerStartsVisible:
        answerTop >= scrollerTop &&
        answerBottom <= Math.min(scrollerBottom, composerTop),
      sourcesCollapsedByDefault:
        Number(measurements.sourceTotal) === 5 &&
        Number(measurements.sourceListCount) === 0 &&
        measurements.sourceToggleExpanded === "false",
      expandedSourcesBounded:
        expandedSourceScrollHeight > expandedSourceClientHeight &&
        expandedSourceClientHeight <= Math.min(viewportHeight * 0.35, 320) + 1,
      expandedSourcesNoHorizontalOverflow:
        expandedSourceScrollWidth <= expandedSourceClientWidth + 1,
      relatedTasksNoHorizontalOverflow:
        relatedScrollWidth <= relatedClientWidth + 1,
      sourceSummaryCompact:
        Number(measurements.sourceChipCount) <= 3 &&
        sourceSummaryBottom <= composerTop,
      composerReachable:
        composerTop < viewportHeight && composerBottom <= viewportHeight + 1,
    },
  };
}

async function inspectAccessibilityRoute(
  browser: BrowserLike,
  viewport: Viewport,
  routePath: string,
  selector: string
) {
  const page = await newMeasuredPage(browser, viewport);
  await gotoAndWait(page, `${baseUrl}${routePath}`, selector);

  const measurements = await page.evaluate(() => {
    const mainCount = document.querySelectorAll("main, [role='main']").length;
    const primaryHeadingCount = document.querySelectorAll(
      "h1, [role='heading'][aria-level='1']"
    ).length;
    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "textarea:not([disabled])",
      "select:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");
    const focusableCount = Array.from(
      document.querySelectorAll<HTMLElement>(focusableSelector)
    ).filter(element => element.getAttribute("aria-hidden") !== "true").length;
    const unnamedIconOnlyButtonCount = Array.from(
      document.querySelectorAll<HTMLButtonElement>("button")
    ).filter(button => isIconOnlyButton(button) && !hasAccessibleName(button))
      .length;
    const timeWithoutDateTimeCount = Array.from(
      document.querySelectorAll<HTMLTimeElement>("time")
    ).filter(time => !time.dateTime).length;
    const activeNavWithoutCurrentCount = Array.from(
      document.querySelectorAll<HTMLElement>(".nav-ink-active, .nav-icon-button-active")
    ).filter(element => element.getAttribute("aria-current") !== "page").length;

    return {
      mainCount,
      primaryHeadingCount,
      focusableCount,
      unnamedIconOnlyButtonCount,
      timeWithoutDateTimeCount,
      activeNavWithoutCurrentCount,
      reducedMotionRulePresent: hasReducedMotionRule(),
      bodyScrollWidth: document.body.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };

    function isIconOnlyButton(button: HTMLButtonElement) {
      const text = (button.textContent ?? "").replace(/\s+/g, "").trim();
      if (text.length > 0) return false;
      return Boolean(button.querySelector("svg, img, [aria-hidden='true']"));
    }

    function hasAccessibleName(element: HTMLElement) {
      if (element.getAttribute("aria-label")?.trim()) return true;
      if (element.getAttribute("title")?.trim()) return true;
      const labelledBy = element.getAttribute("aria-labelledby");
      if (!labelledBy) return false;
      return labelledBy
        .split(/\s+/)
        .some(id => document.getElementById(id)?.textContent?.trim());
    }

    function hasReducedMotionRule() {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules)) {
            if (rule.cssText.includes("prefers-reduced-motion")) return true;
          }
        } catch {
          continue;
        }
      }
      return false;
    }
  });

  await page.close();

  return {
    route: `${routePath}#accessibility-baseline`,
    viewport,
    measurements,
    checks: {
      hasMainLandmark: Number(measurements.mainCount) >= 1,
      hasSinglePrimaryHeading: Number(measurements.primaryHeadingCount) === 1,
      focusableControlsAvailable: Number(measurements.focusableCount) > 0,
      iconOnlyButtonsHaveNames:
        Number(measurements.unnamedIconOnlyButtonCount) === 0,
      timeElementsHaveDateTime:
        Number(measurements.timeWithoutDateTimeCount) === 0,
      activeNavigationUsesAriaCurrent:
        Number(measurements.activeNavWithoutCurrentCount) === 0,
      reducedMotionRulePresent: Boolean(measurements.reducedMotionRulePresent),
      noHorizontalOverflowAt320:
        Number(measurements.bodyScrollWidth) <=
          Number(measurements.viewportWidth) &&
        Number(measurements.documentScrollWidth) <=
          Number(measurements.viewportWidth),
    },
  };
}

async function newMeasuredPage(browser: BrowserLike, viewport: Viewport) {
  return browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
  });
}

async function gotoAndWait(page: PageLike, url: string, selector: string) {
  await page.goto(url, { waitUntil: "load" });
  await page.waitForSelector(selector);
}

type BrowserLike = {
  newPage: (options: {
    viewport: { width: number; height: number };
  }) => Promise<PageLike>;
  close: () => Promise<void>;
};

type PageLike = {
  goto: (
    url: string,
    options?: { waitUntil?: "load" | "domcontentloaded" | "networkidle" }
  ) => Promise<unknown>;
  evaluate: <T>(callback: () => T) => Promise<T>;
  waitForSelector: (selector: string) => Promise<unknown>;
  waitForTimeout: (timeoutMs: number) => Promise<void>;
  click: (selector: string) => Promise<void>;
  getByRole: (
    role: string,
    options?: { name?: RegExp }
  ) => { click: () => Promise<void> };
  keyboard: { press: (key: string) => Promise<void> };
  close: () => Promise<void>;
};

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
