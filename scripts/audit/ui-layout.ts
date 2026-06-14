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
      await inspectAgentDialog(browser, {
        name: "mobile",
        width: 390,
        height: 844,
      })
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
  await gotoAndWait(page, `${baseUrl}/`, ".article-card");

  const measurements = await page.evaluate(() => {
    const firstArticle = document.querySelector(".article-card");
    const header = document.querySelector(".site-header");
    const searchDock = document.querySelector(".home-search-dock");
    return {
      firstArticleY: rectTop(firstArticle),
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
      firstArticleVisibleSoon:
        viewport.width < 768
          ? Number(measurements.firstArticleY ?? Infinity) <= 1450
          : true,
      searchDockEarly:
        viewport.width < 768
          ? Number(measurements.searchDockY ?? Infinity) <= viewport.height + 120
          : true,
    },
  };
}

async function inspectPost(browser: BrowserLike, viewport: Viewport) {
  const page = await newMeasuredPage(browser, viewport);
  await gotoAndWait(
    page,
    `${baseUrl}/post/goal-harness-agent-phase-protocol`,
    ".article-prose"
  );

  const measurements = await page.evaluate(() => {
    const header = document.querySelector(".site-header");
    const prose = document.querySelector(".article-prose");
    const entry = document.querySelector(".article-entry-layer");
    return {
      headerHeight: rectHeight(header),
      proseY: rectTop(prose),
      entryHeight: rectHeight(entry),
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
          ? Number(measurements.proseY ?? Infinity) <= 950
          : Number(measurements.proseY ?? Infinity) <= 1050,
      entryLayerCompact:
        Number(measurements.entryHeight ?? Infinity) <=
        (viewport.width < 768 ? 390 : 300),
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

async function inspectAgentDialog(browser: BrowserLike, viewport: Viewport) {
  const page = await newMeasuredPage(browser, viewport);
  await gotoAndWait(page, `${baseUrl}/`, ".agent-liquid-launcher");
  await page.getByRole("button", { name: /阅读助手|Reader/i }).click();
  await page.waitForSelector(".agent-liquid-panel");
  await page.waitForTimeout(120);

  const measurements = await page.evaluate(() => {
    const launcher = document.querySelector(".agent-liquid-launcher");
    const panel = document.querySelector(".agent-liquid-panel");
    return {
      launcherExpanded: launcher?.getAttribute("aria-expanded") ?? null,
      launcherControls: launcher?.getAttribute("aria-controls") ?? null,
      panelRole: panel?.getAttribute("role") ?? null,
      panelModal: panel?.getAttribute("aria-modal") ?? null,
      panelLabelledBy: panel?.getAttribute("aria-labelledby") ?? null,
      activeElementInsidePanel:
        panel?.contains(document.activeElement) ?? false,
    };
  });

  await page.keyboard.press("Escape");
  await page.waitForTimeout(120);
  const afterEscape = await page.evaluate(() => ({
    panelExists: Boolean(document.querySelector(".agent-liquid-panel")),
    activeIsLauncher:
      document.activeElement?.classList.contains("agent-liquid-launcher") ??
      false,
  }));
  await page.close();

  return {
    route: "/",
    viewport,
    measurements: { ...measurements, ...afterEscape },
    checks: {
      launcherControlsPanel: Boolean(measurements.launcherControls),
      panelIsDialog: measurements.panelRole === "dialog",
      panelIsModal: measurements.panelModal === "true",
      panelHasName: Boolean(measurements.panelLabelledBy),
      focusEnteredPanel: Boolean(measurements.activeElementInsidePanel),
      escapeClosesPanel: !afterEscape.panelExists,
      focusReturnsToLauncher: afterEscape.activeIsLauncher,
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
