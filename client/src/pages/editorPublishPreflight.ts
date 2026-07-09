export type EditorPreflightSeverity = "blocker" | "warning";

export type EditorPreflightIssueCode =
  | "missing_title"
  | "missing_content"
  | "invalid_series_order"
  | "invalid_featured_rank"
  | "missing_excerpt"
  | "missing_category"
  | "missing_tags"
  | "short_content"
  | "series_without_order"
  | "track_without_taxonomy";

export type EditorPreflightIssue = {
  code: EditorPreflightIssueCode;
  severity: EditorPreflightSeverity;
};

export type EditorPublishPreflightInput = {
  title: string;
  content: string;
  excerpt: string;
  categoryId: number | null;
  selectedTags: number[];
  seriesSlug: string;
  seriesOrder: string;
  featuredRank: string;
  pinnedTrack: "none" | "algorithms" | "applications";
};

export type EditorPublishPreflight = {
  blockers: EditorPreflightIssue[];
  warnings: EditorPreflightIssue[];
  canPublish: boolean;
};

const MIN_CONTENT_LENGTH_WARNING = 160;

export function buildEditorPublishPreflight(
  input: EditorPublishPreflightInput
): EditorPublishPreflight {
  const issues: EditorPreflightIssue[] = [];
  const title = input.title.trim();
  const content = input.content.trim();
  const excerpt = input.excerpt.trim();
  const seriesSlug = input.seriesSlug.trim();
  const seriesOrder = input.seriesOrder.trim();
  const featuredRank = input.featuredRank.trim();

  if (!title) addIssue(issues, "missing_title", "blocker");
  if (!content) addIssue(issues, "missing_content", "blocker");
  if (seriesOrder && !isPositiveNumber(seriesOrder)) {
    addIssue(issues, "invalid_series_order", "blocker");
  }
  if (featuredRank && !isPositiveNumber(featuredRank)) {
    addIssue(issues, "invalid_featured_rank", "blocker");
  }

  if (!excerpt) addIssue(issues, "missing_excerpt", "warning");
  if (!input.categoryId) addIssue(issues, "missing_category", "warning");
  if (input.selectedTags.length === 0) {
    addIssue(issues, "missing_tags", "warning");
  }
  if (content && content.length < MIN_CONTENT_LENGTH_WARNING) {
    addIssue(issues, "short_content", "warning");
  }
  if (seriesSlug && !seriesOrder) {
    addIssue(issues, "series_without_order", "warning");
  }
  if (
    input.pinnedTrack !== "none" &&
    (!input.categoryId || input.selectedTags.length === 0)
  ) {
    addIssue(issues, "track_without_taxonomy", "warning");
  }

  const blockers = issues.filter(issue => issue.severity === "blocker");
  const warnings = issues.filter(issue => issue.severity === "warning");
  return {
    blockers,
    warnings,
    canPublish: blockers.length === 0,
  };
}

function addIssue(
  issues: EditorPreflightIssue[],
  code: EditorPreflightIssueCode,
  severity: EditorPreflightSeverity
) {
  issues.push({ code, severity });
}

function isPositiveNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
}
