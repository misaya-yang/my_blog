import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
await mkdir(".cache/rose-ui-qa", { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: process.platform === "darwin" ? ["--use-angle=metal"] : [],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1274, height: 718 },
  });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => {
    if (m.type() === "error" && /shader|WebGL|GL_INVALID/.test(m.text()))
      errors.push(m.text());
  });
  await page.goto(process.env.BASE_URL || "http://localhost:3000/");
  // The legacy galaxy controls were retired; retain the public UI checks.
  const button = page.locator(".observatory-paper-picker button").nth(4);
  await button.scrollIntoViewIfNeeded();
  await button.hover();
  await page.waitForTimeout(250);
  const on = await button.evaluate(n => getComputedStyle(n).backgroundColor);
  await page.mouse.move(5, 5);
  await page.waitForTimeout(400);
  const off = await button.evaluate(n => getComputedStyle(n).backgroundColor);
  assert.notEqual(on, off);
  assert.equal(off, "rgba(0, 0, 0, 0)");
  // Closed <details> must be expanded; querying its children is not a hover test.
  await page.goto(
    new URL("/algorithms", process.env.BASE_URL || "http://localhost:3000/")
      .href
  );
  await page.locator(".track-path-section > summary").click();
  const step = page.locator(".series-step").first();
  await step.hover();
  const stepStyle = await step.evaluate(n => {
    const s = getComputedStyle(n);
    return {
      hovered: n.matches(":hover"),
      border: s.borderWidth,
      outline: s.outlineStyle,
      paddingTop: parseFloat(s.paddingTop),
      paddingLeft: parseFloat(s.paddingLeft),
    };
  });
  assert.equal(stepStyle.hovered, true);
  assert.equal(stepStyle.border, "0px");
  assert.equal(stepStyle.outline, "none");
  assert.ok(stepStyle.paddingTop >= 14 && stepStyle.paddingLeft >= 18);
  await step.focus();
  await page.keyboard.press("Tab");
  const focusStyle = await page.evaluate(() => {
    const s = getComputedStyle(document.activeElement);
    return {
      visible: document.activeElement.matches(":focus-visible"),
      offset: parseFloat(s.outlineOffset),
      radius: parseFloat(s.borderRadius),
    };
  });
  assert.equal(focusStyle.visible, true);
  assert.ok(focusStyle.offset >= 6 && focusStyle.radius >= 10);
  console.log(
    JSON.stringify({
      hover: { on, off },
      seriesSpacing: stepStyle,
      keyboardSpacing: focusStyle,
      errors,
    })
  );
  assert.equal(errors.length, 0);
} finally {
  await browser.close();
}
