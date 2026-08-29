import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";

type AgentMarkdownProps = {
  children: string;
};

export function AgentMarkdown({ children }: AgentMarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[[rehypeKatex, { strict: "ignore", throwOnError: false }]]}
      components={{
        a: ({ node: _node, href, children: linkChildren, ...props }) => (
          <a {...props} href={href} target="_blank" rel="noreferrer">
            {linkChildren}
          </a>
        ),
        // Model-authored Markdown must not make the reader's browser fetch
        // arbitrary third-party pixels. Source links remain explicit and
        // user-initiated; images degrade to their accessible label.
        img: ({ node: _node, alt }) =>
          alt ? <span>{alt}</span> : null,
        code: ({
          node: _node,
          className,
          children: codeChildren,
          ...props
        }) => {
          const inline =
            !className && !String(codeChildren).endsWith("\n");
          return inline ? (
            <code
              {...props}
              className="rounded-[0.3rem] border border-[var(--border)] bg-[var(--surface-inline)] px-1.5 py-0.5 font-mono text-[0.86em] text-[var(--fg)]"
            >
              {codeChildren}
            </code>
          ) : (
            <code {...props} className={className}>
              {codeChildren}
            </code>
          );
        },
      }}
    >
      {normalizeMathDelimiters(children)}
    </ReactMarkdown>
  );
}

function normalizeMathDelimiters(markdown: string) {
  return markdown
    .replace(/\\\[((?:.|\n)*?)\\\]/g, (_, formula: string) => `$$${formula}$$`)
    .replace(/\\\(((?:.|\n)*?)\\\)/g, (_, formula: string) => `$${formula}$`);
}
