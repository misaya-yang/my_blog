# Evidence Packet: Agentic RAG 的上下文编译接口

RAG 很容易被理解成一条直线：用户问一句话，系统把相似 chunk 找出来，塞进 prompt，模型回答。这个版本当然能跑 demo，但一旦接到真正的 Assistant 里，问题就开始变得难看。

模型会问：这些 chunk 为什么进来了？

前端会问：来源卡片应该指向哪篇文章、哪个小节？

调试时会问：这是 query rewrite 错了，BM25 错了，rerank 错了，还是上下文裁剪把关键句删了？

这些问题都不是“再换一个向量库”能解决的。Agentic RAG 的关键不只是“如何检索到相关 chunk”，而是“如何把知识库结果变成 Agent 可以稳定消费、可以引用、可以复盘的上下文对象”。

这里从一个很小的接口切进去：**Evidence Packet**。它是 Assistant 与 KB 之间的结构化中间表示。KB 不再只是向量搜索服务，而是一个面向 Agent 的 **Context Compiler**：把原始文档、召回信号、来源元数据、token 预算和引用约束编译成可执行上下文。

这条链路可以压成：

```text
Raw Knowledge -> Retrieval Signals -> Evidence Packet -> Compiled Context -> Agent Execution
```

重点不是发明新的检索算法，而是把 RAG 从“搜索结果列表”提升为“Agent runtime 的上下文接口”。

## 先把边界放在桌面上

Evidence Packet 不是“已经做完一套企业级 RAG 平台”的包装词。它更像一个工程接口：当博客 Agent、文档助手或通用 Assistant 从原型走向产品时，知识如何被检索、裁剪、授权、引用和评测。

下面提到 Qdrant、BM25、rerank、MMR、GraphRAG 等组件时，它们都只是可替换路线。真正重要的不是选哪一个库，而是检索结果在进入模型前，有没有变成一个可观察、可治理的对象。

## 1. Problem Boundary

传统 RAG 接口通常接近：

```ts
search(query) => Chunk[]
```

这个接口适合原型，但对 Agent 不够。Agent 需要的不只是文本，还需要围绕文本的证据结构：

- 候选是 dense 召回、BM25 召回，还是二者融合得到的。
- 结果是否经过 rerank，是否为了多样性做过 MMR。
- chunk 属于哪个文档、章节、页码、版本和权限范围。
- 如果上下文超预算，哪些证据可以删，哪些必须保留。
- 最终回答应该引用哪一个 source，而不是笼统地说“根据知识库”。

因此，Agentic RAG 的接口应该从 `Chunk[]` 升级为一个 typed evidence object。这个对象既服务于模型上下文，也服务于 trace、debug、evaluation 和 citation。

## 2. Evidence Packet as an IR

Evidence Packet 可以被看作 RAG 管线的中间表示，类似编译器里的 IR。它既不是原始检索结果，也不是最终 prompt，而是两者之间可优化、可审计、可复用的结构。

```ts
type EvidencePacket = {
  objective: {
    originalQuery: string;
    intent?: "lookup" | "compare" | "summarize" | "diagnose" | "compose";
    rewrittenQueries?: string[];
  };

  retrieval: {
    mode: "dense" | "bm25" | "hybrid" | "hierarchical" | "multimodal";
    fusion?: "rrf" | "weighted";
    reranker?: string;
    diversity?: "mmr";
  };

  budget: {
    maxTokens: number;
    estimatedTokens: number;
    overflowPolicy: "drop" | "compress" | "summarize_parent";
  };

  policy: {
    requesterRole: "anonymous" | "user" | "admin";
    visibilityScope: ("public" | "admin" | "hidden")[];
    sessionId?: string;
    quotaClass?: "anonymous" | "authenticated" | "owner";
  };

  evidence: EvidenceItem[];
};

type EvidenceItem = {
  text: string;
  score: number;
  source: {
    documentId: string;
    title: string;
    sectionPath?: string;
    page?: number;
    url?: string;
    version?: string;
  };
  signals: {
    denseRank?: number;
    bm25Rank?: number;
    fusionScore?: number;
    rerankScore?: number;
    matchedTerms?: string[];
  };
  relations?: {
    parentId?: string;
    siblingIds?: string[];
    associatedImageIds?: string[];
  };
};
```

这个接口把“可回答性”从一段 prompt 中拆出来。Context Builder 可以基于它决定如何排序、压缩、展开父 chunk、保留图片描述或生成引用。Evaluator 也可以基于它判断 retrieval 是否命中、source 是否可信、context 是否足够。

`policy` 字段是产品化 Agent 的关键边界。匿名读者、登录用户和作者账号能够访问的内容、可继续的会话、可消耗的额度、可上传的文件都不同。Evidence Packet 应在进入模型窗口前完成权限裁剪，而不是依赖模型在回答时“自觉忽略”不该看到的材料。

## 3. Technical Direction

这类系统值得强调的技术方向不是“做一个企业聊天机器人”，而是 **Agentic RAG Infrastructure**：为通用 AI Assistant 构建一条可治理的上下文生产线。

这条线有三个原则。

**Retrieval is evidence construction.** 检索不是返回相似文本，而是构造一组带来源、分数、路径和互补关系的证据。dense、BM25、RRF、rerank、MMR 都只是 evidence construction 的不同阶段。

**Context is a compiled artifact.** 上下文不是把 top-k 拼进 prompt，而是在 token budget、任务 intent、证据多样性和引用要求之间做选择。编译目标不是“更多材料”，而是“足够、可解释、可引用的材料”。

**Trace is part of the interface.** 如果 Evidence Packet 记录了召回、融合、精排和裁剪过程，错误就能被定位到具体阶段。否则，RAG 失败只会变成一句模糊的“模型答错了”。

这与现代 agent 工程的方向是一致的。Anthropic 强调 agentic systems 应优先使用简单、可组合、透明的 workflow；OpenAI Agents SDK 把 tracing 和 guardrails 作为运行时一等概念。Evidence Packet 把同样的原则应用到 RAG 上下文层：让知识进入 Agent 之前先成为可观察对象。

## 4. Stack Map

围绕 Evidence Packet，参考技术栈可以被整理成几层。每一层都可以按产品阶段裁剪：博客 Agent 首版可以先从文章索引、会话历史和权限过滤开始，后续再扩展上传文件、混合检索和更细的评测。

```text
Document Layer
  -> Chunk & Metadata Layer
  -> Retrieval & Ranking Layer
  -> Evidence Packet
  -> Context Runtime
  -> AgentLoop Execution
```

| Layer                     | Responsibility                     | Example Components                                                                 |
| ------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------- |
| Document Layer            | 接收博客文章、文档、网页和附件     | Postgres metadata, object storage, document and segment records                    |
| Chunk & Metadata Layer    | 把原始材料切成可追溯知识单元       | token-aware chunking, section extraction, metadata extraction, source visibility   |
| Retrieval & Ranking Layer | 生成候选、融合排序、控制重复       | dense retrieval, BM25, hybrid search, RRF, rerank, MMR, metadata filters           |
| Evidence Layer            | 统一证据、来源、分数、权限和 trace | Evidence Packet, source hydration, citation metadata, retrieval provenance         |
| Context Runtime           | 把 evidence 编译成模型上下文       | context builder, budget manager, compressor, permission filter, session memory     |
| Agent Execution           | 基于上下文执行推理和工具调用       | model runtime, tool registry, streaming events, quota checks, trace/eval hooks     |

这张栈图更适合表达系统定位：它关注的不是单点 RAG demo，而是围绕 Agent 上下文生产建立的一套可迭代基础设施。

## 5. Retrieval Signals

Evidence Packet 的质量取决于它是否保留了足够多的检索信号。一个候选 chunk 不应该只有 `score`，还应该保留它在不同召回器里的排名和来源。

RRF 可以作为一个简单例子：

$$
\mathrm{RRF}(d)=\sum_i \frac{1}{k+\mathrm{rank}_i(d)}
$$

其中 $i$ 可以代表 dense retrieval、BM25 或其他候选列表。RRF 的价值不只是融合分数，而是承认不同召回器捕获的是不同信号：dense 更擅长语义相似，BM25 更擅长术语、编号和短查询。Qdrant 的 hybrid query 和 multi-representation search 也是沿着这个方向组织检索。

在 Evidence Packet 中保留 rank provenance 后，Context Builder 可以做更细的策略：

- dense 高、BM25 低：语义相关，但引用时需要确认具体术语是否匹配。
- BM25 高、dense 低：可能是精确字段、类名、配置名或编号命中。
- rerank 高、fusion 低：初始召回弱但二阶段语义判断强。
- 多个结果同页高分：需要 MMR 或 sibling collapse，避免重复占用上下文。

这类信息如果在检索阶段丢掉，后续 prompt 再精巧也很难补回来。

## 6. Context Selection as Optimization

Evidence Packet 进入 Agent 前，还要经过上下文选择。这个问题可以写成一个预算优化问题：

$$
E^\*=\arg\max_E \sum_{e_i\in E}u(e_i)
\quad
\mathrm{s.t.}
\quad
\sum_{e_i\in E}\mathrm{tokens}(e_i)\le B
$$

其中 $u(e_i)$ 不只是检索分数，还应包含 rerank relevance、source authority、diversity gain、citation value 和 task intent match。$B$ 是当前模型窗口里分配给 evidence 的 token budget。

这个形式能解释为什么 Context Builder 必须独立于 Retrieval：

- Retrieval 负责扩大候选空间。
- Rerank 负责提高相关性。
- MMR 负责控制重复。
- Source hydration 负责补齐引用证据。
- Context Builder 负责在预算内选择可执行上下文。

如果这些阶段都被塞进一次 `searchAndPrompt()`，系统无法做 ablation，也无法解释质量变化。

## 7. Reference Architecture Mapping

在博客 Agent 或通用 Assistant 的后续实现中，Evidence Packet 可以作为 RAG 和 Agent Loop 之间的边界对象。

`AgentLoop` 可以把流程拆为 `RAG_RETRIEVAL` 和 `CONTEXT_BUILDING`：前一阶段生成 evidence，后一阶段编译 context。这样检索失败、权限裁剪、上下文压缩和回答生成不会混在同一个黑盒 prompt 里。

chunking、token counting、section extraction 和 attachment metadata 属于编译前端。它们决定源材料如何被解析成带结构的 segment，而不是仅按固定窗口切割文本。

hybrid retrieval、BM25、RRF、rerank、MMR 和 metadata filters 属于优化器。它们不直接面向最终用户，而是把候选集合变成更适合 Agent 消费的 evidence set。

context builder、budget manager 和 compressor 属于编译后端。它们把 Evidence Packet 转成模型窗口里的最终上下文，同时处理长会话、访问权限、匿名/登录额度和文件作用域。

这个映射让技术栈不只是组件清单，而是一条清晰的工程路线：

```text
Chunking / Metadata
  -> Candidate Generation
  -> Fusion / Rerank / Diversity
  -> Evidence Packet
  -> Budgeted Context
  -> Agent Runtime
```

## 8. Evaluation Surface

Evidence Packet 还提供了比最终答案更细的评测面。一个 Agentic RAG 系统至少可以评估五类信号：

- **Evidence recall:** 正确来源是否进入候选集。
- **Source precision:** 进入上下文的证据是否来自正确文档和章节。
- **Context sufficiency:** 当前上下文是否足以回答问题。
- **Citation correctness:** 答案引用是否指向真实支撑来源。
- **Trace locality:** 失败是否能定位到 query rewrite、recall、fusion、rerank、MMR 或 context selection。

这与 Harness Engine 的方向是一致的：把开放式 Agent 行为拆成可比较证据，而不是只看一次漂亮回答。

## 9. Boundaries

Evidence Packet 不是新的向量数据库，也不是替代 reranker 的模型。它是一个接口层和工程抽象，因此边界需要说清楚：

- 如果 chunking 质量差，Evidence Packet 只能更清楚地暴露问题，不能凭空修复知识结构。
- 如果没有评测集，trace 再丰富也很难判断改动是否真的提升质量。
- 如果业务只需要一次简单 FAQ，完整 Evidence Packet 可能过重。
- 如果多模态处理依赖外部 VLM，成本、延迟和稳定性要单独纳入预算。
- 如果上传文件默认进入公共索引，隐私和权限风险会高于检索收益；文件 evidence 应默认绑定到会话或用户。

它适合的场景是通用 Assistant：任务类型多、知识源复杂、需要引用、需要审计，并且上下文策略会长期迭代。

## 10. Core Takeaway

Agentic RAG 的技术方向不应停留在“把向量库接到聊天框”。更有价值的抽象是把 KB 建成 Agent 的上下文编译器：

```text
Evidence Packet = retrieval signals + source metadata + budget policy + traceable context
```

这个抽象把 KB 服务和 Assistant runtime 解耦。底层可以替换 Qdrant、embedding、BM25、reranker 或 chunking 策略；上层 Agent 仍然消费同一种证据接口。系统因此获得可调试性、可预算性、可引用性和可评测性。

真正值得突出的不是“支持 RAG”，而是：

> 用 Evidence Packet 把 RAG 结果编译成 Agent 可执行、可追踪、可评测的上下文。

这是一个足够小、但技术方向清晰的 Agentic AI 基础设施切口。

## References

- Anthropic, [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- OpenAI Agents SDK, [Tracing](https://openai.github.io/openai-agents-python/tracing/)
- OpenAI Agents SDK, [Guardrails](https://openai.github.io/openai-agents-python/guardrails/)
- Qdrant, [Hybrid Queries](https://qdrant.tech/documentation/search/hybrid-queries/)
- Qdrant, [Multi-Representation Search](https://qdrant.tech/documentation/tutorials-search-engineering/multi-representation-search/)
- Microsoft GraphRAG, [Query Engine overview](https://microsoft.github.io/graphrag/query/overview/)
