export type TrackKind = "algorithms" | "applications";

export type TrackSeriesConfig = {
  slug: string;
  titleKey: string;
  promiseKey: string;
  postSlugs: string[];
  expectedNextKeys: string[];
  conceptKeys: string[];
};

export type TrackConfig = {
  kind: TrackKind;
  categorySlug: "ai-algorithms" | "ai-applications";
  href: string;
  active: TrackKind;
  chipKeys: [string, string, string];
  titleKey: string;
  subtitleKey: string;
  overviewKey: string;
  topicTitleKey: string;
  topics: Array<{ labelKey: string; metaKey: string }>;
  focusKeys: string[];
  series: TrackSeriesConfig[];
};

export type TrackSeriesPost = {
  slug: string;
  category?: { slug?: string | null } | null;
  seriesSlug?: string | null;
};

export const trackConfigs: Record<TrackKind, TrackConfig> = {
  algorithms: {
    kind: "algorithms",
    categorySlug: "ai-algorithms",
    href: "/algorithms",
    active: "algorithms",
    chipKeys: [
      "track.algorithms.chip1",
      "track.algorithms.chip2",
      "track.algorithms.chip3",
    ],
    titleKey: "track.algorithms.title",
    subtitleKey: "track.algorithms.subtitle",
    overviewKey: "track.algorithms.overview",
    topicTitleKey: "track.algorithms.topicTitle",
    topics: [
      { labelKey: "track.topic.positionEncoding", metaKey: "track.topic.rope" },
      { labelKey: "track.topic.isohc", metaKey: "track.topic.stability" },
      { labelKey: "track.topic.longContext", metaKey: "track.topic.scaling" },
      {
        labelKey: "track.topic.residualMixing",
        metaKey: "track.topic.architecture",
      },
    ],
    focusKeys: [
      "home.focusTag1",
      "home.focusTag2",
      "home.focusTag3",
      "home.focusTag4",
      "home.focusTag5",
      "home.focusTag8",
    ],
    series: [
      {
        slug: "residual-stability",
        titleKey: "series.residualStability.title",
        promiseKey: "series.residualStability.promise",
        postSlugs: ["isohc-fixed-vector-isometric-residual-mixing"],
        expectedNextKeys: [
          "series.residualStability.next1",
          "series.residualStability.next2",
        ],
        conceptKeys: [
          "track.topic.residualMixing",
          "track.topic.stability",
          "track.topic.architecture",
        ],
      },
      {
        slug: "long-context-position-encoding",
        titleKey: "series.longContext.title",
        promiseKey: "series.longContext.promise",
        postSlugs: [],
        expectedNextKeys: [
          "series.longContext.next1",
          "series.longContext.next2",
        ],
        conceptKeys: [
          "track.topic.positionEncoding",
          "track.topic.rope",
          "track.topic.longContext",
        ],
      },
    ],
  },
  applications: {
    kind: "applications",
    categorySlug: "ai-applications",
    href: "/applications",
    active: "applications",
    chipKeys: [
      "track.applications.chip1",
      "track.applications.chip2",
      "track.applications.chip3",
    ],
    titleKey: "track.applications.title",
    subtitleKey: "track.applications.subtitle",
    overviewKey: "track.applications.overview",
    topicTitleKey: "track.applications.topicTitle",
    topics: [
      { labelKey: "track.topic.agentSystems", metaKey: "track.topic.toolUse" },
      {
        labelKey: "track.topic.harnessEngine",
        metaKey: "track.topic.evaluation",
      },
      {
        labelKey: "track.topic.ragRetrieval",
        metaKey: "track.topic.grounding",
      },
      {
        labelKey: "track.topic.contextEngineering",
        metaKey: "track.topic.memory",
      },
      { labelKey: "track.topic.fineTuning", metaKey: "track.topic.adaptation" },
      {
        labelKey: "track.topic.observability",
        metaKey: "track.topic.reliability",
      },
    ],
    focusKeys: [
      "track.applications.focus1",
      "track.applications.focus2",
      "track.applications.focus3",
      "track.applications.focus4",
      "track.applications.focus5",
      "track.applications.focus6",
    ],
    series: [
      {
        slug: "agent-runtime-systems",
        titleKey: "series.agentRuntime.title",
        promiseKey: "series.agentRuntime.promise",
        postSlugs: [
          "agent-harness-engine-evaluating-tool-using-agents",
          "rag-evidence-packet-context-compiler",
          "agent-loop-observable-tool-using-agents",
        ],
        expectedNextKeys: [
          "series.agentRuntime.next1",
          "series.agentRuntime.next2",
        ],
        conceptKeys: [
          "track.topic.agentSystems",
          "track.topic.harnessEngine",
          "track.topic.observability",
        ],
      },
      {
        slug: "agentic-rag-infrastructure",
        titleKey: "series.agenticRag.title",
        promiseKey: "series.agenticRag.promise",
        postSlugs: ["rag-evidence-packet-context-compiler"],
        expectedNextKeys: [
          "series.agenticRag.next1",
          "series.agenticRag.next2",
        ],
        conceptKeys: [
          "track.topic.ragRetrieval",
          "track.topic.contextEngineering",
          "track.topic.evaluation",
        ],
      },
    ],
  },
};

export function getPublicTrackSeries(
  track: TrackKind,
  posts: TrackSeriesPost[]
): TrackSeriesConfig[] {
  const config = trackConfigs[track];
  const postsBySlug = new Map(
    posts
      .filter(post => post.category?.slug === config.categorySlug)
      .map(post => [post.slug, post])
  );
  const claimedPostSlugs = new Set<string>();

  return config.series
    .map(series => {
      const postSlugs = series.postSlugs.filter(slug => {
        const post = postsBySlug.get(slug);
        if (!post || claimedPostSlugs.has(slug)) return false;
        if (post.seriesSlug && post.seriesSlug !== series.slug) return false;

        claimedPostSlugs.add(slug);
        return true;
      });

      return { ...series, postSlugs };
    })
    .filter(series => series.postSlugs.length > 0);
}
