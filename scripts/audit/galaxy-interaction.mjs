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
  await page.locator("[data-return-angle]").waitFor();
  const host = page.locator("[data-return-angle]");
  const controls = page.locator(".galaxy-visual");
  const drag = async () => {
    await page.mouse.move(940, 320);
    await page.mouse.down();
    await page.mouse.move(730, 470, { steps: 15 });
  };
  await drag();
  assert.equal(await controls.getAttribute("data-dragging"), "true");
  await page.screenshot({ path: ".cache/rose-ui-qa/13-active-trail.png" });
  await page.mouse.up();
  assert.equal(await controls.getAttribute("data-dragging"), "false");
  await page.mouse.move(1100, 200, { steps: 20 });
  assert.equal(await controls.getAttribute("data-dragging"), "false");
  await page.waitForFunction(
    () =>
      Number(
        document.querySelector("[data-return-angle]").dataset.returnAngle
      ) < 0.002,
    {},
    { timeout: 10000 }
  );
  await drag();
  await page.mouse.up();
  await page.waitForTimeout(150);
  await drag();
  assert.equal(await controls.getAttribute("data-dragging"), "true");
  await page.mouse.up();
  // Browser losing capture, focus, or the pointerup event must never latch dragging.
  for (const kind of ["lostpointercapture", "blur", "buttons"]) {
    await drag();
    if (kind === "blur")
      await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    else if (kind === "lostpointercapture")
      await controls.evaluate(n =>
        n.dispatchEvent(
          new PointerEvent("lostpointercapture", { pointerId: 1 })
        )
      );
    else
      await page.evaluate(() =>
        window.dispatchEvent(
          new PointerEvent("pointermove", {
            pointerId: 1,
            buttons: 0,
            clientX: 900,
            clientY: 300,
          })
        )
      );
    assert.equal(await controls.getAttribute("data-dragging"), "false", kind);
    await page.mouse.up();
  }
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
      dragRelease: true,
      regrab: true,
      lostCapture: true,
      blur: true,
      missingPointerUp: true,
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
