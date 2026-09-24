import { normalizeMarkdownMath } from "@shared/markdown-math";
import { Check, Copy } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Options } from "react-markdown";
import { readingHighlight } from "@/lib/readingHighlight";
import "highlight.js/styles/github-dark.min.css";
import remarkGfm from "remark-gfm";

type Pluggable = NonNullable<Options["remarkPlugins"]>[number];

/**
 * Formula support (KaTeX, with its fonts and styles) is a third of this
 * renderer's weight, so it lives in MathMarkdownRenderer and arrives only
 * for text that has formulas.
 */
export type MarkdownMath = { remark: Pluggable; rehype: Pluggable };

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
  onCopyCode?: (
    code: string,
    id: string
  ) => void | boolean | Promise<void | boolean>;
  math?: MarkdownMath;
};

function MarkdownRenderer({
  content,
  headings = [],
  copiedCode,
  copyCodeLabel = "Copy code",
  tableLabel = "Scrollable table",
  onCopyCode,
  math,
}: MarkdownRendererProps) {
  const headingIdResolver = createHeadingIdResolver(headings);

  return (
    <ReactMarkdown
      remarkPlugins={math ? [remarkGfm, math.remark] : [remarkGfm]}
      rehypePlugins={
        math ? [math.rehype, readingHighlight] : [readingHighlight]
      }
      components={{
        h1: createHeadingComponent(
          "h1",
          headingIdResolver,
          "mb-5 mt-12 text-3xl font-semibold"
        ),
        h2: createHeadingComponent(
          "h2",
          headingIdResolver,
          "mb-4 mt-10 border-b border-border pb-2 text-2xl font-semibold"
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
            className="h-auto max-w-full rounded-lg border border-border"
          />
        ),
        pre: ({ node, children, ...props }: any) => {
          const code = extractCode(children);
          const codeId = code ? `code-${hashString(code)}` : "";
          const language =
            node?.children?.[0]?.properties?.className
              ?.find((name: string) => name.startsWith("language-"))
              ?.replace("language-", "") || "Code";

          return (
            <div className="markdown-code-block">
              <div className="markdown-code-toolbar">
                <span>{language}</span>
                {code && onCopyCode ? (
                  <CodeCopyButton
                    code={code}
                    codeId={codeId}
                    label={copyCodeLabel}
                    copied={copiedCode === codeId}
                    onCopy={onCopyCode}
                  />
                ) : null}
              </div>
              <pre className="overflow-x-auto" tabIndex={0} {...props}>
                {children}
              </pre>
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
          const isBlock =
            /language-(\w+)/.test(className || "") || codeText.includes("\n");
          const isInline = !isBlock;
          return isInline ? (
            <code
              className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm"
              {...props}
            >
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
      {normalizeMarkdownMath(content)}
    </ReactMarkdown>
  );
}

function CodeCopyButton({
  code,
  codeId,
  label,
  copied,
  onCopy,
}: {
  code: string;
  codeId: string;
  label: string;
  copied: boolean;
  onCopy: NonNullable<MarkdownRendererProps["onCopyCode"]>;
}) {
  const [localCopied, setLocalCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="markdown-code-copy"
      onClick={async () => {
        const result = await onCopy(code, codeId);
        if (result === false || !mounted.current) return;
        setLocalCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setLocalCopied(false), 2000);
      }}
    >
      {copied || localCopied ? (
        <Check className="h-4 w-4 text-primary" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}

function createHeadingComponent(
  Tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6",
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
    const matchingHeadings = headings.filter(heading => heading.text === text);
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

// Reading-position updates must not remount headings, formulas or focused code.
export default memo(MarkdownRenderer);
