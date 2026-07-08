import { Check, Copy } from "lucide-react";
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  type ReactElement,
  type ReactNode,
} from "react";
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
  tableLabel?: string;
  onCopyCode?: (code: string, id: string) => void;
};

type CalloutType = "note" | "claim" | "caveat" | "implementation" | "source";

const CALLOUT_LABELS: Record<CalloutType, string> = {
  note: "Note",
  claim: "Claim",
  caveat: "Caveat",
  implementation: "Implementation",
  source: "Source",
};

const CALLOUT_PATTERN =
  /^\s*\[!(NOTE|CLAIM|CAVEAT|IMPLEMENTATION|SOURCE)]\s*/i;

export default function MarkdownRenderer({
  content,
  headings = [],
  copiedCode,
  copyCodeLabel = "Copy code",
  tableLabel = "Scrollable table",
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
        h1: createHeadingComponent(
          "h1",
          headingIdResolver,
          "mb-5 mt-12 text-3xl font-semibold"
        ),
        h2: createHeadingComponent(
          "h2",
          headingIdResolver,
          "mb-4 mt-10 border-b border-white/10 pb-2 text-2xl font-semibold"
        ),
        h3: createHeadingComponent(
          "h3",
          headingIdResolver,
          "mb-3 mt-8 text-xl font-semibold"
        ),
        h4: createHeadingComponent(
          "h4",
          headingIdResolver,
          "mb-2 mt-7 text-lg font-semibold"
        ),
        h5: createHeadingComponent(
          "h5",
          headingIdResolver,
          "mb-2 mt-6 text-base font-semibold"
        ),
        h6: createHeadingComponent(
          "h6",
          headingIdResolver,
          "mb-2 mt-5 text-sm font-semibold"
        ),
        img: ({ node: _node, alt, ...props }: any) => (
          <img
            {...props}
            alt={alt || ""}
            loading="lazy"
            decoding="async"
            sizes="(min-width: 1024px) 768px, calc(100vw - 48px)"
            className="h-auto max-w-full rounded-lg border border-white/10"
          />
        ),
        pre: ({ node: _node, children, ...props }: any) => {
          const code = extractCode(children);
          const codeId = code ? `code-${hashString(code)}` : "";
          const meta = extractRenderedCodeMeta(children);

          return (
            <div className="group relative">
              {meta.language || meta.filename ? (
                <div className="code-block-meta flex items-center justify-between gap-3 rounded-t-lg border border-slate-200 bg-slate-100/80 px-4 py-2 text-xs text-slate-600 dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-300">
                  <span className="min-w-0 truncate">
                    {meta.filename ?? "Code"}
                  </span>
                  {meta.language ? (
                    <span className="shrink-0 font-mono uppercase tracking-wide text-sky-700 dark:text-sky-200">
                      {meta.language}
                    </span>
                  ) : null}
                </div>
              ) : null}
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
                    <Check className="h-4 w-4 text-sky-300" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              ) : null}
            </div>
          );
        },
        table: ({ node: _node, children, ...props }: any) => (
          <div
            className="technical-table-wrap"
            role="region"
            aria-label={tableLabel}
            tabIndex={0}
          >
            <table {...props}>{children}</table>
          </div>
        ),
        code: ({ node: _node, className, children, ...props }: any) => {
          const codeText = String(children ?? "");
          const meta = parseCodeMeta(className, _node);
          const isBlock =
            /language-(\w+)/.test(className || "") || codeText.includes("\n");
          const isInline = !isBlock;
          return isInline ? (
            <code
              className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-sm"
              {...props}
            >
              {children}
            </code>
          ) : (
            <code
              className={className}
              data-language={meta.language}
              data-filename={meta.filename}
              {...props}
            >
              {children}
            </code>
          );
        },
        blockquote: ({ node: _node, children, ...props }: any) => {
          const callout = extractCallout(children);
          if (!callout) return <blockquote {...props}>{children}</blockquote>;

          return (
            <aside
              className="article-callout my-6 rounded-lg border border-sky-200/80 bg-sky-50/80 p-4 dark:border-sky-500/20 dark:bg-sky-500/10"
              data-callout-type={callout.type}
            >
              <div className="article-callout-label mb-2 text-sm font-semibold text-sky-900 dark:text-sky-200">
                {CALLOUT_LABELS[callout.type]}
              </div>
              <div className="article-callout-body text-sm leading-7 text-slate-700 dark:text-slate-200">
                {callout.children}
              </div>
            </aside>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function createHeadingComponent(
  Tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6",
  resolveHeadingId: (text: string) => string | undefined,
  className: string
) {
  return ({ node: _node, children, ...props }: any) => {
    const text = String(children).replace(/\*\*/g, "");
    const id = resolveHeadingId(text);
    return (
      <Tag
        id={id}
        className={`${className} group scroll-mt-24`}
        {...props}
      >
        {children}
        {id ? (
          <a
            href={`#${id}`}
            aria-label={`Link to ${text}`}
            className="heading-anchor-link not-prose ml-2 text-sm opacity-0 transition-opacity group-hover:opacity-70 focus:opacity-100"
          >
            #
          </a>
        ) : null}
      </Tag>
    );
  };
}

function createHeadingIdResolver(headings: MarkdownHeading[]) {
  const occurrences = new Map<string, number>();

  return (text: string) => {
    const occurrence = occurrences.get(text) ?? 0;
    occurrences.set(text, occurrence + 1);
    const matchingHeadings = headings.filter(heading => heading.text === text);
    return matchingHeadings[occurrence]?.id;
  };
}

function extractCode(children: any) {
  const code = children?.props?.children;
  if (Array.isArray(code)) return String(code[0] ?? "");
  return typeof code === "string" ? code : "";
}

function extractRenderedCodeMeta(children: ReactNode) {
  const codeElement = Children.toArray(children).find(isValidElement);
  const props = (codeElement?.props ?? {}) as {
    className?: string;
    node?: unknown;
    "data-language"?: string;
    "data-filename"?: string;
  };
  const parsedMeta = parseCodeMeta(props.className, props.node);

  return {
    language: props["data-language"] ?? parsedMeta.language,
    filename: props["data-filename"] ?? parsedMeta.filename,
  };
}

function parseCodeMeta(className: string | undefined, node: any) {
  const language = /language-([^\s]+)/.exec(className ?? "")?.[1];
  const meta = typeof node?.data?.meta === "string" ? node.data.meta : "";
  const filename =
    /(?:title|filename)="([^"]+)"/.exec(meta)?.[1] ??
    /(?:title|filename)=([^\s]+)/.exec(meta)?.[1];

  return { language, filename };
}

function extractCallout(children: ReactNode) {
  const text = extractText(children);
  const match = CALLOUT_PATTERN.exec(text);
  if (!match) return null;

  const type = match[1].toLowerCase() as CalloutType;
  return {
    type,
    children: stripCalloutMarker(children),
  };
}

function extractText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (isValidElement(node)) {
    return extractText((node.props as { children?: ReactNode }).children);
  }
  return "";
}

function stripCalloutMarker(children: ReactNode) {
  let stripped = false;

  function visit(node: ReactNode): ReactNode {
    if (stripped) return node;
    if (typeof node === "string") {
      const nextValue = node.replace(CALLOUT_PATTERN, "");
      stripped = nextValue !== node;
      return nextValue;
    }
    if (Array.isArray(node)) return node.map(visit);
    if (isValidElement(node)) {
      const props = node.props as { children?: ReactNode };
      if (!props.children) return node;
      return cloneElement(node as ReactElement<{ children?: ReactNode }>, {
        ...props,
        children: visit(props.children),
      });
    }
    return node;
  }

  return visit(children);
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index++) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
