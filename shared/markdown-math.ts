/** Accept conventional LaTeX delimiters before Markdown interprets `=` as a heading.
 * Code fences and inline code are deliberately opaque to this conversion.
 */
export function normalizeMarkdownMath(content: string): string {
  const protectedCode: string[] = [];
  // A sentinel absent from the input makes restoration lossless even for arbitrary content.
  let sentinel = "\u0000math-code";
  while (content.includes(sentinel)) sentinel += "-";
  const protect = (code: string) =>
    `${sentinel}${protectedCode.push(code) - 1}\u0000`;
  let fence: { marker: string; length: number } | undefined;
  let block: string[] = [];
  const lines: string[] = [];
  for (const line of content.split("\n")) {
    const match = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (fence) {
      block.push(line);
      if (
        match &&
        match[1][0] === fence.marker &&
        match[1].length >= fence.length &&
        !match[2].trim()
      ) {
        lines.push(protect(block.join("\n")));
        block = [];
        fence = undefined;
      }
    } else if (match) {
      fence = { marker: match[1][0], length: match[1].length };
      block = [line];
    } else lines.push(line);
  }
  if (block.length) lines.push(protect(block.join("\n")));
  const result = lines
    .join("\n")
    .replace(/(`+)([^`]|(?!\1)`)*?\1/g, protect)
    .replace(
      /\\\[([\s\S]*?)\\\]/g,
      (_, math: string) => `\n$$\n${math.trim()}\n$$\n`
    )
    .replace(/\\\(([^\n]*?)\\\)/g, (_, math: string) => `$${math.trim()}$`);
  return result.replace(
    new RegExp(`${sentinel}(\\d+)\u0000`, "g"),
    (_, index: string) => protectedCode[Number(index)]
  );
}
