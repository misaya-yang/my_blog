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
      rehypePlugins={[rehypeKatex]}
      components={{
        a: ({ node: _node, href, children: linkChildren, ...props }) => (
          <a
            {...props}
            href={href}
            target="_blank"
            rel="noreferrer"
          >
            {linkChildren}
          </a>
        ),
        code: ({ node: _node, className, children: codeChildren, ...props }) => {
          const inline = !className;
          return inline ? (
            <code
              {...props}
              className="rounded bg-slate-900/80 px-1.5 py-0.5 font-mono text-[0.92em] text-sky-100"
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
