import { Check, Copy } from "lucide-react";
import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

type MarkdownHeading = {
  id: string;
  text: string;
  level: number;
};

type MarkdownRendererProps = {
  content: string;
  headings?: MarkdownHeading[];
  copiedCode?: string | null;
  copyCodeLabel?: string;
  onCopyCode?: (code: string, id: string) => void;
};

export default function MarkdownRenderer({
  content,
  headings = [],
  copiedCode,
  copyCodeLabel = "Copy code",
  onCopyCode,
}: MarkdownRendererProps) {
  useEffect(() => {
    void import("highlight.js/styles/github-dark.min.css");
    void import("katex/dist/katex.min.css");
  }, []);

  const headingIdResolver = createHeadingIdResolver(headings);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeHighlight]}
      components={{
        h1: createHeadingComponent("h1", headingIdResolver, "mb-5 mt-12 text-3xl font-semibold"),
        h2: createHeadingComponent(
          "h2",
          headingIdResolver,
          "mb-4 mt-10 border-b border-sky-200/10 pb-2 text-2xl font-semibold"
        ),
        h3: createHeadingComponent("h3", headingIdResolver, "mb-3 mt-8 text-xl font-semibold"),
        img: ({ node: _node, alt, ...props }: any) => (
          <img
            {...props}
            alt={alt || ""}
            loading="lazy"
            decoding="async"
            sizes="(min-width: 1024px) 768px, calc(100vw - 48px)"
            className="h-auto max-w-full rounded-lg border border-sky-200/10"
          />
        ),
        pre: ({ node: _node, children, ...props }: any) => {
          const code = extractCode(children);
          const codeId = code ? `code-${hashString(code)}` : "";

          return (
            <div className="group relative">
              <pre className="overflow-x-auto" {...props}>
                {children}
              </pre>
              {code && onCopyCode ? (
                <button
                  aria-label={copyCodeLabel}
                  onClick={() => onCopyCode(code, codeId)}
                  className="absolute right-3 top-3 rounded-md bg-slate-900/85 p-2 opacity-90 transition-colors hover:bg-slate-800 hover:opacity-100 focus-visible:opacity-100"
                >
                  {copiedCode === codeId ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              ) : null}
            </div>
          );
        },
        table: ({ node: _node, children, ...props }: any) => (
          <div className="technical-table-wrap" role="region" aria-label="Scrollable table" tabIndex={0}>
            <table {...props}>{children}</table>
          </div>
        ),
        code: ({ node: _node, className, children, ...props }: any) => {
          const isInline = !/language-(\w+)/.test(className || "");
          return isInline ? (
            <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-sm" {...props}>
              {children}
            </code>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function createHeadingComponent(
  Tag: "h1" | "h2" | "h3",
  resolveHeadingId: (text: string) => string | undefined,
  className: string
) {
  return ({ node: _node, children, ...props }: any) => {
    const text = String(children).replace(/\*\*/g, "");
    return (
      <Tag id={resolveHeadingId(text)} className={className} {...props}>
        {children}
      </Tag>
    );
  };
}

function createHeadingIdResolver(headings: MarkdownHeading[]) {
  const occurrences = new Map<string, number>();

  return (text: string) => {
    const occurrence = occurrences.get(text) ?? 0;
    occurrences.set(text, occurrence + 1);
    const matchingHeadings = headings.filter((heading) => heading.text === text);
    return matchingHeadings[occurrence]?.id;
  };
}

function extractCode(children: any) {
  const code = children?.props?.children;
  if (Array.isArray(code)) return String(code[0] ?? "");
  return typeof code === "string" ? code : "";
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index++) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
