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
  | "in_revision"
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
  suggestedAction?: string;
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

export type AgentSignalInput = {
  question?: string | null;
  scopeType?: string | null;
  scopeValue?: string | null;
  runId?: string | null;
  count?: number;
  firstSeenAt?: Date | string;
  lastSeenAt?: Date | string;
};

export type AgentRefusalSignalInput = AgentSignalInput & {
  refusalReason?: string | null;
};

export type AgentSignalBuilderInput =
  | ({ kind: "agent_question" } & AgentSignalInput)
  | ({ kind: "agent_low_confidence" } & AgentSignalInput)
  | ({ kind: "agent_refusal" } & AgentRefusalSignalInput);

export type ArticleFeedbackSignalInput = {
  articleSlug?: string | null;
  feedbackType: string;
  count?: number;
  excerpt?: string | null;
  firstSeenAt?: Date | string;
  lastSeenAt?: Date | string;
};

export type PublishFreshnessSignalInput = {
  checkCode: string;
  articleSlug?: string | null;
  message: string;
  sourceRef?: string | null;
  firstSeenAt?: Date | string;
  lastSeenAt?: Date | string;
};

const READER_SIGNAL_KINDS: readonly ReaderSignalKind[] = [
  "search_miss",
  "agent_question",
  "agent_low_confidence",
  "agent_refusal",
  "article_feedback",
  "content_audit",
  "publish_freshness",
];

export function buildSearchMissSignal(
  input: SearchMissSignalInput
): ReaderSignal {
  const normalizedQuery = normalizeSignalText(
    input.normalizedQuery || input.query
  );
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
    suggestedAction: "Open editor with a safe search-miss intent.",
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
    suggestedAction: "Review the audit finding and edit the affected article.",
  };
}

export function buildAgentQuestionSignal(
  input: AgentSignalInput
): ReaderSignal {
  const count = input.count ?? 1;
  const questionKey = normalizeSignalText(input.question || input.runId || "");
  const scope = buildScopeKey(input.scopeType, input.scopeValue);
  const excerpt = buildSafeExcerpt(input.question, "Agent reader question");

  return {
    id: `agent_question:${scope}:${questionKey || "unknown"}`,
    kind: "agent_question",
    status: "new",
    severity: count >= 3 ? "medium" : "low",
    ...getScopeSignalFields(input.scopeType, input.scopeValue),
    query: excerpt,
    excerpt,
    sourceRef: input.runId ?? undefined,
    count,
    firstSeenAt: toSignalIsoString(input.firstSeenAt),
    lastSeenAt: toSignalIsoString(input.lastSeenAt),
    suggestedAction: "Open the Agent trace or draft a public answer.",
  };
}

export function buildAgentLowConfidenceSignal(
  input: AgentSignalInput
): ReaderSignal {
  const count = input.count ?? 1;
  const questionOrRunKey = normalizeSignalText(
    input.question || input.runId || ""
  );
  const scope = buildScopeKey(input.scopeType, input.scopeValue);
  const excerpt = buildSafeExcerpt(
    input.question || input.runId,
    "Low-confidence Agent answer"
  );

  return {
    id: `agent_low_confidence:${scope}:${questionOrRunKey || "unknown"}`,
    kind: "agent_low_confidence",
    status: "new",
    severity: count >= 2 ? "high" : "medium",
    ...getScopeSignalFields(input.scopeType, input.scopeValue),
    query: excerpt,
    excerpt,
    sourceRef: input.runId ?? undefined,
    count,
    firstSeenAt: toSignalIsoString(input.firstSeenAt),
    lastSeenAt: toSignalIsoString(input.lastSeenAt),
    suggestedAction: "Review retrieval coverage and Agent trace evidence.",
  };
}

export function buildAgentRefusalSignal(
  input: AgentRefusalSignalInput
): ReaderSignal {
  const count = input.count ?? 1;
  const reasonOrQuestionKey = normalizeSignalText(
    input.refusalReason || input.question || input.runId || ""
  );
  const scope = buildScopeKey(input.scopeType, input.scopeValue);
  const excerpt = buildSafeExcerpt(
    input.refusalReason || input.question || input.runId,
    "Agent refusal"
  );

  return {
    id: `agent_refusal:${scope}:${reasonOrQuestionKey || "unknown"}`,
    kind: "agent_refusal",
    status: "new",
    severity: count >= 3 ? "high" : "medium",
    ...getScopeSignalFields(input.scopeType, input.scopeValue),
    query: excerpt,
    excerpt,
    sourceRef: input.runId ?? undefined,
    count,
    firstSeenAt: toSignalIsoString(input.firstSeenAt),
    lastSeenAt: toSignalIsoString(input.lastSeenAt),
    suggestedAction: "Decide whether the refusal reflects a real coverage gap.",
  };
}

export function buildArticleFeedbackSignal(
  input: ArticleFeedbackSignalInput
): ReaderSignal {
  const count = input.count ?? 1;
  const feedbackType = normalizeSignalCode(input.feedbackType || "other");
  const articleOrGlobal = normalizeSignalCode(input.articleSlug || "global");

  return {
    id: `article_feedback:${articleOrGlobal}:${feedbackType}`,
    kind: "article_feedback",
    status: "new",
    severity: getArticleFeedbackSeverity(feedbackType, count),
    articleSlug: input.articleSlug ?? undefined,
    excerpt: buildSafeExcerpt(input.excerpt, "Reader feedback"),
    count,
    firstSeenAt: toSignalIsoString(input.firstSeenAt),
    lastSeenAt: toSignalIsoString(input.lastSeenAt),
    suggestedAction: "Open a safe editor intent for this feedback theme.",
  };
}

export function buildPublishFreshnessSignal(
  input: PublishFreshnessSignalInput
): ReaderSignal {
  const checkCode = normalizeSignalCode(input.checkCode || "unknown");
  const articleOrGlobal = normalizeSignalCode(input.articleSlug || "global");

  return {
    id: `publish_freshness:${checkCode}:${articleOrGlobal}`,
    kind: "publish_freshness",
    status: "new",
    severity: getPublishFreshnessSeverity(checkCode),
    articleSlug: input.articleSlug ?? undefined,
    excerpt: buildSafeExcerpt(input.message, "Publish freshness finding"),
    sourceRef: input.sourceRef ?? checkCode,
    firstSeenAt: toSignalIsoString(input.firstSeenAt),
    lastSeenAt: toSignalIsoString(input.lastSeenAt),
    suggestedAction: "Run content verification and inspect release readiness.",
  };
}

export function buildSearchMissSignals(inputs: SearchMissSignalInput[]) {
  return inputs.map(buildSearchMissSignal).sort(compareReaderSignals);
}

export function buildContentAuditSignals(inputs: ContentAuditSignalInput[]) {
  return inputs.map(buildContentAuditSignal).sort(compareReaderSignals);
}

export function buildAgentSignals(inputs: AgentSignalBuilderInput[]) {
  return inputs
    .map(input => {
      if (input.kind === "agent_question") return buildAgentQuestionSignal(input);
      if (input.kind === "agent_low_confidence")
        return buildAgentLowConfidenceSignal(input);
      return buildAgentRefusalSignal(input);
    })
    .sort(compareReaderSignals);
}

export function normalizeSignalSource(
  source?: string | null
): ReaderSignalKind | null {
  if (!source) return null;
  const normalized = normalizeSignalCode(source);
  if (normalized === "agent_radar") return "agent_question";
  return READER_SIGNAL_KINDS.includes(normalized as ReaderSignalKind)
    ? (normalized as ReaderSignalKind)
    : null;
}

export function normalizeSignalText(value: string) {
  return redactDirectContact(value)
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("en-US")
    .slice(0, 180);
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

function getArticleFeedbackSeverity(
  feedbackType: string,
  count: number
): ReaderSignalSeverity {
  if (feedbackType === "not_useful") return count >= 2 ? "high" : "medium";
  return "low";
}

function getPublishFreshnessSeverity(checkCode: string): ReaderSignalSeverity {
  if (
    [
      "hidden_draft_exposed",
      "hidden_content_exposed",
      "draft_exposed",
      "missing_public_route",
      "missing_sitemap",
      "missing_rss",
      "missing_archive",
      "stale_public_agent_index",
    ].includes(checkCode)
  ) {
    return "high";
  }
  if (checkCode.includes("unavailable")) return "medium";
  return "low";
}

function buildScopeKey(
  scopeType: string | null | undefined,
  scopeValue: string | null | undefined
) {
  const type = normalizeSignalCode(scopeType || "site");
  const value = scopeValue ? normalizeSignalCode(scopeValue) : "";
  return value ? `${type}:${value}` : type;
}

function getScopeSignalFields(
  scopeType: string | null | undefined,
  scopeValue: string | null | undefined
): Pick<ReaderSignal, "articleSlug" | "trackSlug"> {
  if (!scopeValue) return {};
  const normalizedType = normalizeSignalCode(scopeType || "");
  if (normalizedType === "post") return { articleSlug: scopeValue };
  if (normalizedType === "track") return { trackSlug: scopeValue };
  return {};
}

function normalizeSignalCode(value: string) {
  return normalizeSignalText(value)
    .replace(/[^a-z0-9_:-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildSafeExcerpt(
  value: string | null | undefined,
  fallback: string
) {
  const excerpt = redactDirectContact(value || fallback)
    .replace(/\s+/g, " ")
    .trim();
  return excerpt.slice(0, 240);
}

function toSignalIsoString(value: Date | string | undefined) {
  return value ? toIsoString(value) : new Date(0).toISOString();
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
