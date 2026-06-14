# Goal Harness: 让 Codex / Claude Code 持续完整工作的工程协议

有一类 Coding Agent 失败很迷惑：它不是完全没做，也不是代码不能运行，而是“看起来到处都做了，真正用户路径还是断的”。

一次博客 Agent 改造就踩过这个坑。PRD 写得很完整，任务也“跑完了”，仓库里出现了 schema、router、UI、测试名、后台页和一堆看似正确的文案。但打开博客 Agent 一问当前文章，它并不知道当前页面；问一个口语问题，检索打偏；source card 看起来有来源，却不一定能定位到读者正在看的内容。

把这个问题归因成“模型能力不够”太粗了。更根本的原因是：长期目标被交给了 Agent，却没有配套一个能持续工作的运行协议。PRD 说明了产品想要什么，但没有把工作切成可冷启动、可验证、可回归、可交接的执行单元。于是 Agent 很容易做出一堆看起来像完成的改动：有表、有路由、有 UI、有测试名，但核心体验没有闭环，内容边界、quota、retrieval、source cards、mobile sheet、eval 和 admin trace 也没有被逐个锁住。

这里讨论一个更实用的抽象：**Goal Harness**。

Goal Harness 不靠新的框架，也不靠把 prompt 写得更长。它更像一套仓库内执行协议：把 PRD、Figma、代码库事实和测试要求编译成一个 phase folder，让新 Agent 可以在干净上下文里接手一个 phase，完成它，验证它，留下证据，再解锁下一个 phase。

```text
Product Intent
  -> Source Packet
  -> Feature Oracle
  -> Phase Contract
  -> Agent Execution
  -> Evidence Report
  -> Regression Bank
  -> Next Phase
```

核心目标只有一个：把“看起来跑完了”变成“可以交付、可以回放、可以继续”。

## Design Boundary

Goal Harness 不是 evaluation harness 的替代品。Anthropic 在 [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) 里区分了 agent harness 和 evaluation harness：前者让模型能行动，后者衡量行动结果。这里的 phase folder 属于 agent harness，但必须为 eval 留出接口。

Goal Harness 也不是“多 Agent 更高级”。Anthropic 的 [long-running harness](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) 文章强调 initializer agent、coding agent、progress file 和 clean handoff；后续 harness design 又进一步引入 planner / generator / evaluator 的分工。但这不意味着每个任务都应该上多 Agent。真正重要的是：任务被拆成可验证的增量，每个增量都有明确上下文、边界、证据和交接。

OpenAI Codex 的 [Skills](https://developers.openai.com/codex/skills)、[Subagents](https://developers.openai.com/codex/subagents)、[Rules](https://developers.openai.com/codex/rules) 和 [MCP](https://developers.openai.com/codex/mcp) 文档指向同一个工程方向：重复工作要沉淀成 skill，复杂上下文要隔离，工具和权限要显式。Claude Code 的 [Skills](https://code.claude.com/docs/en/skills)、[Subagents](https://code.claude.com/docs/en/sub-agents) 和 [Memory](https://code.claude.com/docs/en/memory) 也是类似逻辑：把长期任务从聊天上下文搬到项目文件和可复用协议里。

它更接近一种 repo 内协议：

- 哪些材料可信，哪些只是 untrusted source。
- 当前 phase 必须读什么，不该读什么。
- 能改哪些路径，不能碰哪些路径。
- 什么测试、浏览器检查、eval、rollback、compliance gate 必须通过。
- 如果失败，失败证据写在哪里。
- 什么条件下下一个 phase 才能开始。

在这个系列里，它的位置也很明确：`Agent Harness Engine` 讨论如何让工具型 Agent 的运行可观测；`Evidence Packet` 讨论知识如何被编译成 Agent 可消费的上下文；`Agent Loop` 讨论多步行动如何成为状态机。Goal Harness 补的是另一层：**当 Agent 自己变成开发者时，产品需求如何被编译成它可以持续执行的工作环境**。

## 0. Anthropic 的两段式解法

Anthropic 的 long-running harness 思路里，关键动作很朴素：不要让同一个 session 既搭环境、又理解需求、又写完整产品。长任务先交给 **Initializer Agent**，后续推进再交给 **Coding Agent**。这不是把工作拆给两个“人格”，而是把冷启动和增量开发拆成两类不同协议。

### 关键细节

Initializer Agent 只做准备，不追求马上把功能写完。它应该把仓库变成可连续工作的状态：

- 写一个 `init.sh`，让后续 session 可以一键安装依赖、启动开发服务器、跑基础检查。
- 建一个 `claude-progress.txt` 或等价进度日志，记录当前阶段、已完成项、失败项、下次入口。
- 做一次初始 git commit，给后续增量修改一个干净基线。
- 把用户的一句话需求展开成详尽 feature list。Anthropic 的示例里，`claude.ai clone` 这类需求会被拆成大量可验收功能点。
- 每个功能点初始标记为 `failing`，直到真实代码、测试、浏览器检查或人工验收把它翻成 `passing`。

Coding Agent 的职责刚好相反：它不重新发明全局计划，只在既有 harness 里做一小段增量。每个 session 读取进度日志和当前 failing feature，完成一组有限任务，跑验证，然后把结构化结果写回日志。完成之后留下的不是一句“已完成”，而是：改了什么、跑了什么、哪些 feature 从 failing 变成 passing、哪些 blocker 仍然存在、下一个 session 从哪里继续。

### 面试加分点

这个模式的亮点不在“用了多 Agent”，而在把长任务从聊天流搬进仓库状态。面试里如果只说“让 Claude Code 先规划再编码”，信息量不够；更有区分度的说法是：

- Initializer Agent 负责把自然语言需求编译成可执行测试簿，避免后续 session 被空泛 PRD 牵着走。
- `failing -> passing` 的 feature list 是轻量 acceptance test registry，不依赖模型自我感觉。
- `init.sh` 和初始 commit 解决环境可复现问题，进度日志解决上下文窗口断裂问题。
- Coding Agent 每轮只做小批量 failing items，天然形成可 code review、可回滚、可继续的增量。
- Goal Harness 可以把 Anthropic 的进度日志升级成 phase folder：Source Packet 记录可信上下文，Feature Oracle 记录 failing/passing，Phase Contract 限定读写边界，Evidence Report 记录验证证据。

所以这个抽象的重点不是“把 prompt 写得更长”，而是让 Agent 的工作环境本身带状态、带闸门、带恢复点。

## 1. PRD 不是执行协议

以博客 Agent 为例，`docs/agent_prd` 里已经有很多正确产品判断：

- 只做右下角助手，不做全屏 `/agent` 工作台。
- 公开用户只能检索 public published posts。
- quota 必须先于 retrieval 和 model call。
- 匿名用户 2 次/天，visitor 6 次/天。
- Supabase 先做 keyword / metadata retrieval，pgvector 和 PDF 延后。
- `/manage/agent` 后续要承担 retrieval debugger、trace、eval、article idea backlog。

这些判断没错。问题是它们没有被编译成 **不可跳过的执行闸门**。

一个 Coding Agent 读到“实现 Blog Agent MVP”时，很容易把所有层同时展开：schema、router、quota、retrieval、prompt、UI、source card、history、admin、eval。每个局部都能写一点，但没有一个阶段被完整锁死。最后最危险的状态是：仓库里出现了许多“像已经完成”的文件，而真实用户路径仍然断裂。

PRD 回答的是：

```text
目标到底是什么？
```

Goal Harness 必须回答的是：

```text
一个新 Agent 现在只能做哪一个 phase？
它凭什么知道自己做完了？
下一个 Agent 凭什么敢接着做？
```

这三个问题没有答案，goal mode 就会退化成一次很长的 vibe coding。

这次博客 Agent 的失败可以拆成更具体的 failure anatomy：

| Missing Layer     | Symptom                                                              | Better Harness Behavior                                                        |
| ----------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Baseline Evidence | Agent 开始写代码前没有固定当前 schema、route、test、UI 和检索边界。  | Phase 00 先产出 baseline report，再允许实现 phase 解锁。                       |
| Feature Oracle    | “能回答博客问题”太软，成功题、拒答题、quota 题没有被枚举。           | 把 public QA、hidden refusal、quota-before-model、source card 都写成验收案例。 |
| Phase Boundary    | schema、router、retrieval、UI、admin、eval 混在同一轮 goal 里。      | 按风险拆 phase，每个 phase 只允许有限 edit paths。                             |
| Regression Bank   | 新测试可能过了，但旧的阅读路径、移动端、隐藏内容边界没有被完整回归。 | 每个 phase 声明触碰哪部分 regression bank，release phase 跑完整银行。          |
| Evidence Report   | “完成”只存在于聊天总结里，下一轮 Agent 不知道哪些检查真的跑过。      | 每个 phase 写 report，记录命令、截图、eval、waiver、blocker 和 handoff。       |

这张表比“模型没做好”更有用，因为它把失败从模型性格问题还原成工程接口问题。

## 2. Source Packet: 先把上下文变成证据

长任务失败的第一类原因是上下文污染。Anthropic 的 [context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) 文章把 context 描述成有限资源：越长不等于越好，Agent 需要的是高信号、按需加载、可持续维护的上下文。

所以 Goal Harness 的第一步不是写 phase，而是写 Source Packet。

Source Packet 应该记录：

| Field                | Purpose                                                                      |
| -------------------- | ---------------------------------------------------------------------------- |
| Request Summary      | 用户真正想完成的产品/工程目标。                                              |
| Source Inventory     | PRD、Figma、截图、现有代码、外部文档分别来自哪里。                           |
| Trust Level          | 哪些是 repo fact，哪些是 untrusted user/design/web source。                  |
| Current System Shape | 当前路由、schema、测试、脚本、部署、已有模块。                               |
| Assumptions          | 不问也能安全推进的假设。                                                     |
| Unknowns             | 需要 stop 或 approval 的未知。                                               |
| Risk Tags            | UI、auth、payment、database、migration、AI/eval、external service、release。 |

这一步的价值是把“聊天里的理解”落到文件里。后续任何 Agent 都不需要猜上一轮在想什么。

## 3. Feature Oracle: 让“完成”变成可枚举对象

PRD 里最容易出问题的是验收条件。比如“Agent 可以回答博客问题”太软了。它应该被拆成 feature oracle：

```json
[
  {
    "id": "AGENT-QA-001",
    "category": "retrieval",
    "given": "public article Agent Loop is indexed",
    "when": "visitor asks what Agent Loop means",
    "then": "answer cites the Agent Loop post and shows a public source card",
    "evidence": "browser screenshot + eval row",
    "status": "pending"
  },
  {
    "id": "AGENT-PRIVACY-001",
    "category": "privacy",
    "given": "EVQ-Cosh is hidden/draft",
    "when": "anonymous user asks for EVQ details",
    "then": "assistant refuses or says no public source is available",
    "evidence": "unit test + eval refusal case",
    "status": "pending"
  }
]
```

Feature Oracle 有两个效果。

第一，它阻止 Agent 自己发明完成标准。第二，它让回归测试有了产品语义：不是“测试通过了吗”，而是“公开检索、隐藏内容边界、quota、source card、mobile sheet、trace review 这些用户可感知能力是否仍然成立”。

## 4. Phase Contract: 每个 phase 都是冷启动任务

一个 phase 文件不能只是 Markdown 说明。它应该有机器可解析的 contract，让 Agent 和 validator 都能读。

最小结构可以是：

```json
{
  "schema_version": "prd-phase-harness/v2",
  "phase": {
    "id": "AGENT-02",
    "status": "ready",
    "depends_on": ["AGENT-01"],
    "phase_file": "docs/blog_agent_harness/phase-02-quota-router.md"
  },
  "goal": {
    "target": "Implement quota-before-retrieval agent router",
    "plan_required": true,
    "completion_report": "docs/blog_agent_harness/reports/agent-02-quota-router.md"
  },
  "context": {
    "read_first": [
      "docs/blog_agent_harness/README.md",
      "docs/blog_agent_harness/phase-manifest.md"
    ],
    "primary_context": [
      "server/ai/router.ts",
      "server/ai/quota.ts",
      "server/agent.router.test.ts"
    ]
  },
  "boundaries": {
    "likely_edit_paths": ["server/ai/*", "server/agent.router.test.ts"],
    "do_not_edit": ["client/src/components/agent/*"]
  },
  "validation": {
    "commands": [
      {
        "id": "agent-router-tests",
        "command": "pnpm exec vitest run server/agent.router.test.ts",
        "expected": "quota blocks before retrieval/model calls",
        "required": true
      }
    ],
    "acceptance_gates": [
      "anonymous blocked on 3rd daily message",
      "visitor blocked on 7th daily message",
      "quota block does not call retrieval",
      "model errors are persisted"
    ]
  }
}
```

这不是为了“格式洁癖”。它解决的是 goal-mode Agent 的冷启动问题：新 Agent 不需要重新读完整 PRD，不需要猜当前该做什么，也不能轻易把 UI、retrieval 和 admin ops 混在同一个 phase 里。

## 5. 拆 phase 要按风险，不按文件夹

很多 PRD 拆解失败，是因为按“前端 / 后端 / 数据库”机械切分。真实交付更适合按风险切：

| Phase           | Dominant Risk               | Completion Evidence                 |
| --------------- | --------------------------- | ----------------------------------- |
| Baseline Audit  | 不知道当前系统真实状态      | route/test/schema/report baseline   |
| Knowledge Index | public/hidden 内容边界      | chunk tests + reindex report        |
| Quota Router    | 费用和滥用控制              | quota-before-model tests            |
| Assistant Shell | 真实用户路径是否可用        | desktop/mobile browser screenshots  |
| Answer Quality  | 来源 grounding 和拒答       | golden questions + trace            |
| History / Files | ownership、retention、scope | auth tests + cleanup checks         |
| Admin Ops       | 可观测和可运维              | retrieval debugger + eval dashboard |
| Release Gate    | 完整回归和部署风险          | full build/test/browser/eval report |

每个 phase 只承担一个主风险。这样 Agent 才能逐个打穿，而不是一次性把所有复杂度摊开。

## 6. 回归不是最后一步，是每个 phase 的出口

Agent Coding 最大的幻觉之一，是把“当前 phase 的新测试通过”当成“产品可用”。

真正的 phase exit 至少要有四层：

```text
Targeted Tests
  -> Regression Scope
  -> User Journey / Browser Check
  -> Evidence Report
```

对博客 Agent 来说，每次相关改动都应该至少问：

- public user 是否仍然无法检索 hidden/admin/draft 内容？
- quota block 是否仍然发生在 retrieval/model 之前？
- source card 是否链接到真实 public post？
- mobile bottom sheet 是否仍然可输入、可关闭、不会遮挡主要阅读路径？
- eval 里的成功题和拒答题是否都还过？
- `/manage/agent` 是否能解释一次失败 retrieval？

这些问题必须写进 phase contract，而不是靠 Agent 自觉记住。

Anthropic 的 agent eval 文章也强调，Agent 评估不能只看最终文本，还要看 transcript/trajectory 和最终环境状态。对 coding agent 来说，phase report 就是这种可回放轨迹的轻量版本：命令、失败、截图、trace、waiver、handoff 都应该存下来。

## 7. 完整回归要有 Regression Bank

逐 phase 回归解决的是局部质量；完整回归解决的是产品整体仍然成立。

一个 AI 应用的 Regression Bank 应该混合几类检查：

- **Code checks:** `pnpm check`, targeted vitest, full test, build。
- **Browser checks:** home、article、track、assistant open/send/source card、mobile sheet。
- **Knowledge checks:** reindex coverage、hidden exclusion、source metadata。
- **Agent evals:** golden questions、refusal cases、out-of-scope behavior。
- **Ops checks:** trace review、retrieval debugger、quota/cost visibility。
- **Safety checks:** auth boundary、PII、secret、external service approval。

更重要的是，每个 phase 要声明自己触碰了 Regression Bank 的哪一部分。最后 release phase 再跑完整银行。

Anthropic 在 agent eval 里把 capability eval 和 regression eval 分开：前者衡量 Agent 能不能爬上新的能力坡，后者保护已经能做的事不要倒退。Goal Harness 里的 Regression Bank 更接近后者。它不是为了证明 Agent 有多聪明，而是为了防止一个 phase 的“局部聪明”破坏另一个 phase 已经交付的能力。

这样 Agent 不会在 Phase 6 修 retrieval 时破坏 Phase 3 的 UI，也不会在 Phase 7 做 admin ops 时把 hidden content 暴露给 public answer。

## 8. Status 和 Handoff 是长期工作的骨架

一个 phase 不应该只有“做了/没做”。它需要状态机：

```text
draft -> ready -> planned -> in_progress -> passed
                                  └-> blocked
                                  └-> waived
```

`blocked` 不是失败羞耻，而是长期工程的正常状态。比如缺少 Supabase dashboard、缺少 SMTP、生产 migration 未授权、Figma 无访问权限，都应该被写进报告。下一位 Agent 看到报告后，应该知道哪些本地检查已完成，哪些外部动作还不能做。

这也是为什么 Anthropic long-running harness 强调 initializer、progress file 和 structured handoff。上下文窗口会结束，Agent 会换，但 repo 里的状态必须连续。

## 9. Goal Harness Skill

这次把这个方法沉淀成一个 `prd-phase-harness` skill。它的目标不是帮 Agent 写更多 Markdown，而是强迫它生成一种可执行文件夹：

```text
docs/<topic>/
├── README.md
├── source-packet.md
├── phase-manifest.md
├── phase-00-baseline-audit.md
├── phase-01-knowledge-index.md
├── phase-02-quota-router.md
└── reports/
    └── phase-report-template.md
```

每个 phase 同时有：

- Machine Contract JSON。
- grep-friendly Coding Agent Contract。
- exact `READ_FIRST` / `PRIMARY_CONTEXT`。
- bounded `LIKELY_EDIT_PATHS` / `DO_NOT_EDIT`。
- validation commands。
- browser/runtime checks。
- compliance gates。
- rollback plan。
- evidence output。
- stop conditions。

再配一个 validator：

```bash
python3 scripts/validate_harness_prd.py docs/<topic> --strict --quality-score
```

它至少应该抓住这些问题：

- phase-manifest 被误当作 phase。
- phase ID、文件名、manifest row、report path 不一致。
- dependency cycle。
- `VALIDATION_COMMANDS: run tests` 这种不可执行 gate。
- UI phase 没有 browser/viewport check。
- AI phase 没有 golden questions / trace evidence。
- migration phase 没有 rollback。
- auth/payment phase 没有 compliance gates。
- final docs 仍残留未决项、占位段落或无法执行的验收描述。

这才是 skill 的价值：不是让 Agent 更会写计划，而是让 Agent 写出来的计划可以被另一个 Agent 执行、质疑、回归和接手。

## Engineering Takeaway

Codex、Claude Code 这类 Agent 已经足够强，强到可以一次读很多文件、写很多代码、跑很多命令。问题是它们也足够强，强到会在没有边界时把复杂任务做成一堆“看起来完成”的半成品。

Goal Harness 的核心不是限制 Agent，而是给它一条持续工作的轨道：

- 用 Source Packet 管上下文。
- 用 Feature Oracle 管完成定义。
- 用 Phase Contract 管执行边界。
- 用 Evidence Report 管交接。
- 用 Regression Bank 管完整回归。
- 用 Status Machine 管长期连续性。

当这些东西存在时，goal mode 才真正有意义。否则，“请实现整个 Agent PRD”只是把不确定性一次性丢给模型。

更好的提问方式是：

```text
Complete AGENT-02 Quota Router.
Read only the harness README, manifest, this phase, and PRIMARY_CONTEXT.
Stay inside LIKELY_EDIT_PATHS.
Run the required tests and browser/runtime checks.
Write the phase report.
Do not unlock AGENT-03 until acceptance gates pass.
```

这听起来没有“一句话让 AI 做完整产品”那么浪漫，但它更接近真实软件工程。

真正解放 Agent 的不是给它无限大的任务，而是给它一套可以连续完成任务的环境。
