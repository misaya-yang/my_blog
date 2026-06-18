import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("static client index metadata", () => {
  it("keeps root metadata for Vercel static-priority serving", () => {
    const html = readFileSync(join(process.cwd(), "client/index.html"), "utf8");

    expect(html).toContain(
      '<link rel="canonical" href="https://misaya.online/" />'
    );
    expect(html).toContain('<meta name="robots" content="index,follow" />');
    expect(html).toContain(
      '<meta property="og:url" content="https://misaya.online/" />'
    );
  });
});
