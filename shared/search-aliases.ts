export type SearchRecoveryTopicConfig = {
  id: string;
  labelKey: string;
  query: string;
  href: string;
  aliases: string[];
};

export const SEARCH_RECOVERY_TOPICS = [
  {
    id: "agent-systems",
    labelKey: "track.topic.agentSystems",
    query: "AgentLoop",
    href: "/search?q=AgentLoop",
    aliases: [
      "agent",
      "agents",
      "agentloop",
      "智能体",
      "loop",
      "runtime",
      "运行时",
    ],
  },
  {
    id: "rag-retrieval",
    labelKey: "track.topic.ragRetrieval",
    query: "Evidence Packet",
    href: "/search?q=Evidence%20Packet",
    aliases: [
      "rag",
      "retrieval",
      "检索",
      "证据",
      "evidence",
      "packet",
      "证据包",
    ],
  },
  {
    id: "harness-engine",
    labelKey: "track.topic.harnessEngine",
    query: "Harness Engine",
    href: "/search?q=Harness%20Engine",
    aliases: [
      "harness",
      "eval",
      "evaluation",
      "评测",
      "trace",
      "tool",
      "工具",
    ],
  },
  {
    id: "isohc",
    labelKey: "track.topic.isohc",
    query: "IsoHC",
    href: "/search?q=IsoHC",
    aliases: [
      "iso",
      "isohc",
      "residual",
      "残差",
      "稳定性",
      "正交",
      "invariant",
      "不变量",
    ],
  },
  {
    id: "long-context",
    labelKey: "track.topic.longContext",
    query: "Long Context",
    href: "/algorithms",
    aliases: [
      "long",
      "context",
      "上下文",
      "rope",
      "position",
      "位置编码",
      "长上下文",
    ],
  },
  {
    id: "context-engineering",
    labelKey: "track.topic.contextEngineering",
    query: "Context Engineering",
    href: "/applications",
    aliases: ["context", "上下文", "context engineering", "rag", "agent", "evidence"],
  },
] as const satisfies SearchRecoveryTopicConfig[];

export const SEARCH_ALIAS_EXPANSIONS: Record<string, string[]> = {
  agent: ["agent", "agents", "智能体", "agentloop", "loop", "runtime", "运行时"],
  agents: ["agent", "agents", "智能体", "agentloop", "loop", "runtime", "运行时"],
  智能体: [
    "agent systems",
    "agent harness",
    "agentloop",
    "agent routing",
    "loop",
    "runtime",
    "运行时",
  ],
  循环: ["agentloop", "loop", "runtime", "运行时"],
  rag: ["rag", "retrieval", "检索", "证据", "evidence", "packet", "证据包"],
  retrieval: ["rag", "retrieval", "检索", "evidence", "packet"],
  检索: ["rag", "retrieval", "evidence", "packet"],
  证据: ["rag", "evidence", "packet", "证据包"],
  harness: ["harness", "evaluation", "评测", "trace", "tool", "工具"],
  eval: ["harness", "evaluation", "评测", "trace"],
  iso: ["isohc", "residual", "残差", "稳定性", "正交", "invariant", "不变量"],
  isohc: ["iso", "residual", "残差", "稳定性", "正交", "invariant", "不变量"],
  残差: ["isohc", "residual", "stability", "稳定性"],
  rope: ["rope", "position", "位置编码", "long context", "长上下文"],
  位置编码: ["rope", "position", "position encoding", "long context", "长上下文"],
  context: ["context", "上下文", "long context", "context engineering"],
  上下文: ["context", "context engineering", "long context"],
  ffn: ["ffn", "gated ffn", "swiglu", "geglu", "门控", "通道", "mlp"],
  swiglu: ["ffn", "gated ffn", "swiglu", "门控"],
  门控: ["ffn", "gated ffn", "swiglu", "通道"],
  flow: ["flow matching", "diffusion", "生成", "扩散", "transport", "运输"],
  diffusion: ["flow matching", "diffusion", "生成", "扩散", "transport"],
  生成: ["flow matching", "diffusion", "generative", "transport", "运输"],
  扩散: ["flow matching", "diffusion", "generative"],
  rlhf: ["rlhf", "reinforcement learning", "强化学习", "post-training", "后训练"],
  rlvr: ["rlvr", "verifiable rewards", "可验证奖励", "强化学习", "后训练"],
  dpo: ["dpo", "preference optimization", "偏好优化", "rlhf"],
  grpo: ["grpo", "reinforcement learning", "强化学习", "rlvr"],
  强化学习: ["rlhf", "reinforcement learning", "rlvr", "grpo", "后训练"],
  后训练: ["post-training", "rlhf", "dpo", "rlvr", "偏好优化"],
  偏好优化: ["preference optimization", "dpo", "rlhf"],
};

const STOP_WORDS = new Set(["ai", "the", "and"]);

export function normalizeSearchText(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function tokenizeSearchQuery(normalizedQuery: string): string[] {
  if (!/\s/.test(normalizedQuery)) return normalizedQuery ? [normalizedQuery] : [];
  return normalizedQuery
    .split(/\s+/)
    .map(token => token.trim())
    .filter(token => token.length >= 2 && !STOP_WORDS.has(token));
}

export function queryContainsSearchAlias(
  normalizedQuery: string,
  queryTokens: string[],
  alias: string
): boolean {
  const normalizedAlias = normalizeSearchText(alias);
  if (!normalizedAlias) return false;
  if (/^[a-z0-9-]+$/.test(normalizedAlias)) {
    return queryTokens.includes(normalizedAlias);
  }
  return normalizedQuery.includes(normalizedAlias);
}

export function expandSearchToken(token: string): string[] {
  const normalizedToken = normalizeSearchText(token);
  return uniqueSearchTerms([
    normalizedToken,
    ...(SEARCH_ALIAS_EXPANSIONS[normalizedToken] ?? []),
  ]);
}

export function getAliasGroupsForQuery(
  normalizedQuery: string,
  queryTokens = tokenizeSearchQuery(normalizedQuery)
): string[][] {
  return Object.entries(SEARCH_ALIAS_EXPANSIONS)
    .filter(([alias]) => queryContainsSearchAlias(normalizedQuery, queryTokens, alias))
    .map(([, expansions]) => uniqueSearchTerms(expansions))
    .filter(group => group.length > 0);
}

export function getSearchHighlightNeedles(query: string): string[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  const queryTokens = tokenizeSearchQuery(normalizedQuery);
  const tokenGroups = queryTokens.map(token => expandSearchToken(token));
  const aliasGroups = getAliasGroupsForQuery(normalizedQuery, queryTokens);

  return uniqueSearchTerms([
    normalizedQuery,
    ...tokenGroups.flat(),
    ...aliasGroups.flat(),
  ])
    .filter(term => term.length >= 2)
    .sort((a, b) => b.length - a.length);
}

function uniqueSearchTerms(values: string[]): string[] {
  return Array.from(new Set(values.map(normalizeSearchText).filter(Boolean)));
}
