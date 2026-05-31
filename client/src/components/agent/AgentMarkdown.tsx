import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type AgentMarkdownProps = {
  children: string;
};

export function AgentMarkdown({ children }: AgentMarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
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
      {children}
    </ReactMarkdown>
  );
}
