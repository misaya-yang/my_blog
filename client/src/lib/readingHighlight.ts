import { createLowlight } from "lowlight";
import python from "highlight.js/lib/languages/python";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";

const highlighter = createLowlight({
  python,
  javascript,
  typescript,
  json,
  bash,
});

type Root = ReturnType<typeof highlighter.highlight>;
type Element = Extract<Root["children"][number], { type: "element" }>;

/** Highlight declared code languages only. Unknown/plain-text fences stay readable. */
export function readingHighlight() {
  return (tree: Root) => {
    const visit = (node: Root | Element) => {
      for (const child of node.children) {
        if (child.type !== "element") continue;
        if (
          node.type === "element" &&
          node.tagName === "pre" &&
          child.tagName === "code"
        ) {
          const classes =
            (child.properties.className as string[] | undefined) ?? [];
          const language = classes
            .find(name => name.startsWith("language-"))
            ?.slice(9);
          if (!language || !highlighter.registered(language)) continue;
          const source = child.children
            .map(part => (part.type === "text" ? part.value : ""))
            .join("");
          child.children = highlighter.highlight(language, source)
            .children as Element["children"];
          child.properties.className = ["hljs", ...classes];
        } else visit(child);
      }
    };
    visit(tree);
  };
}
