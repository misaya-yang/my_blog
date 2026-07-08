export type ReaderSignalKind =
  | "search_miss"
  | "agent_question"
  | "agent_low_confidence"
  | "agent_refusal"
  | "article_feedback"
  | "content_audit"
  | "publish_freshness";

export type ReaderSignalStatus =
  | "new"
  | "triaged"
  | "planned"
  | "resolved"
  | "ignored";

export type ReaderSignalSeverity = "low" | "medium" | "high";

export type ReaderSignal = {
  id: string;
  kind: ReaderSignalKind;
  status: ReaderSignalStatus;
  severity: ReaderSignalSeverity;
  articleSlug?: string;
  trackSlug?: string;
  query?: string;
  excerpt?: string;
  sourceRef?: string;
  count?: number;
  firstSeenAt: string;
  lastSeenAt: string;
  resolvedAt?: string;
  notes?: string;
};

export type SearchMissSignalInput = {
  query: string;
  normalizedQuery: string;
  count: number;
  firstSeenAt: Date | string;
  lastSeenAt: Date | string;
  suggestedPrompt?: string;
};

export type ContentAuditSignalInput = {
  severity: "failure" | "warning" | "suggestion";
  code: string;
  file: string;
  articleSlug?: string;
  line?: number;
  message: string;
  evidence?: string;
};

export function buildSearchMissSignal(
  input: SearchMissSignalInput
): ReaderSignal {
  const normalizedQuery = redactDirectContact(input.normalizedQuery);
  const query = redactDirectContact(input.query).trim().slice(0, 120);
  const excerpt = redactDirectContact(
    input.suggestedPrompt ??
      `Write or connect a public note that answers: ${input.query}`
  );

  return {
    id: `search_miss:${normalizedQuery}`,
    kind: "search_miss",
    status: "new",
    severity: input.count > 1 ? "high" : "medium",
    query,
    excerpt,
    count: input.count,
    firstSeenAt: toIsoString(input.firstSeenAt),
    lastSeenAt: toIsoString(input.lastSeenAt),
  };
}

export function buildContentAuditSignal(
  input: ContentAuditSignalInput
): ReaderSignal {
  const location = input.line ? String(input.line) : "file";
  const owner = input.articleSlug ?? input.file;
  const sourceRef = input.line ? `${input.file}:${input.line}` : input.file;

  return {
    id: `content_audit:${owner}:${input.code}:${location}`,
    kind: "content_audit",
    status: "new",
    severity: getContentAuditSeverity(input.severity),
    articleSlug: input.articleSlug,
    excerpt: redactDirectContact(input.evidence ?? input.message),
    sourceRef,
    firstSeenAt: new Date(0).toISOString(),
    lastSeenAt: new Date(0).toISOString(),
  };
}

export function buildSearchMissSignals(inputs: SearchMissSignalInput[]) {
  return inputs.map(buildSearchMissSignal).sort(compareReaderSignals);
}

export function buildContentAuditSignals(inputs: ContentAuditSignalInput[]) {
  return inputs.map(buildContentAuditSignal).sort(compareReaderSignals);
}

function getContentAuditSeverity(
  severity: ContentAuditSignalInput["severity"]
): ReaderSignalSeverity {
  if (severity === "failure") return "high";
  if (severity === "warning") return "medium";
  return "low";
}

function compareReaderSignals(a: ReaderSignal, b: ReaderSignal) {
  return (
    getSeverityWeight(b.severity) - getSeverityWeight(a.severity) ||
    (b.count ?? 0) - (a.count ?? 0) ||
    b.lastSeenAt.localeCompare(a.lastSeenAt) ||
    a.id.localeCompare(b.id)
  );
}

function getSeverityWeight(severity: ReaderSignalSeverity) {
  if (severity === "high") return 3;
  if (severity === "medium") return 2;
  return 1;
}

function toIsoString(value: Date | string) {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

function redactDirectContact(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "[redacted-ip]");
}
