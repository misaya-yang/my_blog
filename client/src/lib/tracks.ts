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
  topics: Array<{ labelKey: string; metaKey: string }>;
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
      { labelKey: "track.topic.positionEncoding", metaKey: "track.topic.rope" },
      { labelKey: "track.topic.isohc", metaKey: "track.topic.stability" },
      { labelKey: "track.topic.longContext", metaKey: "track.topic.scaling" },
      { labelKey: "track.topic.residualMixing", metaKey: "track.topic.architecture" },
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
      { labelKey: "track.topic.agentSystems", metaKey: "track.topic.toolUse" },
      { labelKey: "track.topic.harnessEngine", metaKey: "track.topic.evaluation" },
      { labelKey: "track.topic.ragRetrieval", metaKey: "track.topic.grounding" },
      { labelKey: "track.topic.contextEngineering", metaKey: "track.topic.memory" },
      { labelKey: "track.topic.fineTuning", metaKey: "track.topic.adaptation" },
      { labelKey: "track.topic.observability", metaKey: "track.topic.reliability" },
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
