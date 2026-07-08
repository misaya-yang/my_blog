export type ManageReaderSignal = {
  id: string;
  kind: string;
  status: string;
  severity: string;
  articleSlug?: string | null;
  trackSlug?: string | null;
  query?: string | null;
  excerpt?: string | null;
  sourceRef?: string | null;
  count?: number | null;
  firstSeenAt?: Date | string | null;
  lastSeenAt?: Date | string | null;
};

type Translator = (key: string) => string;

export function getReaderSignalKindLabel(kind: string, t: Translator) {
  const labels: Record<string, string> = {
    search_miss: t("manage.readerSignals.kind.searchMiss"),
    agent_question: t("manage.readerSignals.kind.agentQuestion"),
    agent_low_confidence: t("manage.readerSignals.kind.agentLowConfidence"),
    agent_refusal: t("manage.readerSignals.kind.agentRefusal"),
    article_feedback: t("manage.readerSignals.kind.articleFeedback"),
    content_audit: t("manage.readerSignals.kind.contentAudit"),
    publish_freshness: t("manage.readerSignals.kind.publishFreshness"),
  };
  return labels[kind] ?? kind;
}

export function getReaderSignalSeverityLabel(
  severity: string,
  t: Translator
) {
  const labels: Record<string, string> = {
    high: t("manage.readerSignals.severity.high"),
    medium: t("manage.readerSignals.severity.medium"),
    low: t("manage.readerSignals.severity.low"),
  };
  return labels[severity] ?? severity;
}

export function getReaderSignalPrimaryText(signal: ManageReaderSignal) {
  return (
    signal.articleSlug ||
    signal.query ||
    signal.trackSlug ||
    signal.sourceRef ||
    signal.id
  );
}
