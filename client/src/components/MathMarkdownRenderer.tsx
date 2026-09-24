import type { ComponentProps } from "react";
import "katex/dist/katex.min.css";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import MarkdownRenderer, { type MarkdownMath } from "./MarkdownRenderer";

const math: MarkdownMath = { remark: remarkMath, rehype: rehypeKatex };

/** The Markdown renderer with formulas, for text that has them. */
export default function MathMarkdownRenderer(
  props: Omit<ComponentProps<typeof MarkdownRenderer>, "math">
) {
  return <MarkdownRenderer {...props} math={math} />;
}
