export type TrackKind = "algorithms" | "applications";

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
  topics: Array<{ label: string; meta: string }>;
  focusKeys: string[];
};

export const trackConfigs: Record<TrackKind, TrackConfig> = {
  algorithms: {
    kind: "algorithms",
    categorySlug: "ai-algorithms",
    href: "/algorithms",
    active: "algorithms",
    chipKeys: ["track.algorithms.chip1", "track.algorithms.chip2", "track.algorithms.chip3"],
    titleKey: "track.algorithms.title",
    subtitleKey: "track.algorithms.subtitle",
    overviewKey: "track.algorithms.overview",
    topicTitleKey: "track.algorithms.topicTitle",
    topics: [
      { label: "Position Encoding", meta: "RoPE" },
      { label: "IsoHC", meta: "Stability" },
      { label: "Long Context", meta: "Scaling" },
      { label: "Residual Mixing", meta: "Architecture" },
    ],
    focusKeys: [
      "home.focusTag1",
      "home.focusTag2",
      "home.focusTag3",
      "home.focusTag4",
      "home.focusTag5",
      "home.focusTag8",
    ],
  },
  applications: {
    kind: "applications",
    categorySlug: "ai-applications",
    href: "/applications",
    active: "applications",
    chipKeys: ["track.applications.chip1", "track.applications.chip2", "track.applications.chip3"],
    titleKey: "track.applications.title",
    subtitleKey: "track.applications.subtitle",
    overviewKey: "track.applications.overview",
    topicTitleKey: "track.applications.topicTitle",
    topics: [
      { label: "Agent Systems", meta: "Tool Use" },
      { label: "Harness Engine", meta: "Evaluation" },
      { label: "RAG & Retrieval", meta: "Grounding" },
      { label: "Context Engineering", meta: "Memory" },
      { label: "Fine-tuning", meta: "Adaptation" },
      { label: "Observability", meta: "Reliability" },
    ],
    focusKeys: [
      "track.applications.focus1",
      "track.applications.focus2",
      "track.applications.focus3",
      "track.applications.focus4",
      "track.applications.focus5",
      "track.applications.focus6",
    ],
  },
};
