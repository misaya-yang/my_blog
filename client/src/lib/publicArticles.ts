export const publicArticleTitlesBySlug: Record<string, string> = {
  "agent-harness-engine-evaluating-tool-using-agents":
    "Agent Harness Engine: Evaluating Tool-Using Agents",
  "rag-evidence-packet-context-compiler":
    "Evidence Packet: Agentic RAG 的上下文编译接口",
  "agent-loop-observable-tool-using-agents":
    "Agent Loop: 从 ReAct 模式到可观测运行时",
  "goal-harness-agent-phase-protocol":
    "Goal Harness: 让 Codex / Claude Code 持续完整工作的工程协议",
  "long-horizon-agents-continuous-convergence":
    "长程 Agent 为什么难：从单步能力到持续收敛",
  "isohc-fixed-vector-isometric-residual-mixing":
    "IsoHC: Fixed-Vector Isometric Residual Mixing",
  "gated-ffn-multiplicative-channel-control":
    "Gated FFN: Transformer 里的乘法通道",
  "flow-matching-generative-transport":
    "Flow Matching：从扩散噪声到确定性运输",
};

export function getPublicArticleTitle(slug: string) {
  return publicArticleTitlesBySlug[slug] ?? slug.replace(/-/g, " ");
}
