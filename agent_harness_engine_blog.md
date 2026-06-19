# Agent Harness Engine: Evaluating Tool-Using Agents Under Controlled Context

第一次认真看 Agent trace 时，最不舒服的地方不是模型答错了，而是很难说清楚它到底从哪一步开始错。

它可能检索到了相似但无关的材料，可能工具参数少了一个字段，可能在第三轮 observation 后忘了最初的约束，也可能只是被一个看起来合理的中间结果带偏。最后用户看到的是一句“助手没有完成回答”，但工程上这句话没有任何诊断价值。

更稳妥的做法，是把 Agent 开发拆成两个问题：

```text
模型能不能给出一个聪明动作？
系统能不能复盘这个动作为什么发生？
```

**Agent Harness Engine** 关心的是第二个问题。它不是为了让一次 demo 看起来更厉害，而是把工具型 Agent 的运行过程变成可比较、可复现、可定位的实验对象。

## 1. 先别急着调 prompt

工具型 Agent 的失败经常被归因于 prompt 不够好，但很多问题其实不在 prompt 里。

几个博客 Agent 和代码 Agent 都容易遇到的症状：

- 模型知道要查资料，但查的是全站而不是当前文章。
- 工具调用成功了，但返回结果没有进入下一轮上下文。
- 回答里引用了来源，但 source card 指向了错误页面。
- 任务其实已经失败，运行时仍然继续烧 token。
- 一次回归通过了，换一个相邻问题就完全不稳定。

如果没有 harness，这些问题会混在一起。开发者只能在聊天记录里猜：是不是检索差？是不是模型差？是不是上下文太长？是不是 UI 没传 route context？

Harness 的价值，是先把这些变量拆开。

```text
Task Spec
  -> Context Builder
  -> Agent Runtime
  -> Tool Sandbox
  -> Trace Store
  -> Evaluator
```

这条链路里的每一层都应该留下证据。否则所谓“Agent 质量”只是对一次 transcript 的印象。

## 2. Task Spec: 把任务写成可失败的东西

一个好的任务规格不只是用户问题，它至少要包含：

```ts
type TaskSpec = {
  input: string;
  scope: "site" | "current_post" | "track" | "admin";
  allowedTools: string[];
  successCriteria: string[];
  refusalCriteria?: string[];
  budgets: {
    maxSteps: number;
    maxToolCalls: number;
    maxTokens: number;
  };
};
```

关键在于：任务必须允许系统明确失败。

比如“解释这篇文章的核心机制”不是一个完整 task spec。更好的写法是：

```text
Given: 当前页面是公开文章 Agent Loop
When: 用户问“这篇文章的核心是什么？”
Then:
  - retrieval 必须注入当前文章上下文
  - 回答必须引用当前文章 source
  - 不得引用 hidden/admin/draft 内容
  - 如果没有当前文章上下文，必须返回可诊断失败
```

这样失败才会变成具体类型，而不是一句“模型没答好”。

## 3. Context Builder: Agent 真正吃进去的东西

Agent 的上下文不是越多越好。上下文首先是一个预算接口。

Context Builder 至少要回答五个问题：

- 当前页面、用户身份、会话历史是否进入上下文？
- 检索结果是原文 chunk、摘要，还是结构化证据？
- 哪些工具结果保留原文，哪些只保留状态？
- 什么内容因为权限、token budget 或质量原因被裁掉？
- 裁剪过程有没有 trace，可以在后台复盘？

同一个模型、同一个问题，只要 context builder 改了，Agent 行为就可能完全不同。所以 harness 应该让 context policy 成为可替换模块，而不是藏在 prompt 字符串里。

更可靠的做法，是把它写成一个显式对象：

```ts
type BuiltContext = {
  route: {
    type: "home" | "post" | "track" | "admin";
    slug?: string;
  };
  evidence: EvidencePacket[];
  memory: ConversationSummary[];
  toolSchemas: ToolSchema[];
  budget: ContextBudgetReport;
  omissions: ContextOmission[];
};
```

`omissions` 很重要。很多 Agent bug 不在“给了什么”，而在“不知道自己没给什么”。

## 4. Tool Sandbox: 工具不是字符串

工具调用如果只是 prompt 里的自然语言约定，很快会失控。Harness 需要把工具看成 typed capabilities：

```ts
type ToolCall = {
  name: "search_posts" | "open_post" | "run_eval";
  input: unknown;
  validatedInput?: object;
  result?: object;
  status: "ok" | "invalid_input" | "denied" | "failed";
  latencyMs: number;
};
```

这样一来，失败就能分层：

- 参数 schema 不合法。
- 工具被权限策略拒绝。
- 工具运行失败。
- 工具结果为空。
- 工具结果有内容，但模型没有正确使用。

这五种失败的修复方向完全不同。如果 harness 不记录它们，开发会退回到“再改改 prompt”。

## 5. Trace Store: 让一次运行可以被重放

一个有用的 trace 不需要很华丽，但要足够诚实。

一次有用的 Agent run 至少应该留下这些事件：

```text
run_started
context_built
model_called
tool_called
tool_returned
context_rebuilt
answer_generated
sources_selected
run_finished
```

每个事件都应该有版本信息：模型版本、prompt 版本、retrieval policy、chunker 版本、工具 schema 版本。否则你今天修好的问题，明天可能因为一个无关改动重新出现，却没有办法定位。

对于博客 Agent 这种产品，trace 还有一个额外价值：它能告诉作者读者到底卡在哪里。不是“用户体验不好”这种空话，而是更具体的故障信号：

```text
用户经常问 IsoHC，但 retrieval 命中 ISO 8601。
用户问当前文章，routeContext 没有传入。
用户要找 AgentLoop，但 source card 指向了 Evidence Packet。
```

这类信号比泛泛的访问量更接近内容产品的真实反馈。

## 6. Evaluator: 不要只看最终答案

Agent 评测至少应该分三层：

| Layer | 问题 | 尽量用什么判断 |
| --- | --- | --- |
| Completion | 有没有走到合法终态？ | deterministic check |
| Path | 工具、检索、权限顺序是否正确？ | trace assertion |
| Quality | 回答是否有帮助、有引用、不过度发挥？ | rubric / model judge |

最终答案当然重要，但只看最终答案会漏掉很多结构性问题。

比如一个回答看起来正确，但它引用了 hidden draft；这不是质量小瑕疵，而是权限事故。又比如模型答对了，但没有使用检索结果；这说明当前题碰巧在模型记忆里，不能证明 RAG 可用。

所以 failure taxonomy 比单次回答分数更重要：

- retrieval miss
- wrong-source citation
- current-page context missing
- quota-before-model failure
- hidden content exposure
- premature stop
- no-progress loop
- unsupported external question

这些类别才是后续迭代的路线图。

## 7. 一个最小可用版本

如果只做博客 Agent 的第一版 harness，不需要一开始就做复杂平台。最小闭环可以是：

```text
golden questions
  -> retrieval debug
  -> source-card assertion
  -> local eval report
  -> regression screenshot
```

对应到产品里，大概是：

- `/manage/agent` 可以跑固定问题集。
- 每道题记录 normalized query、alias expansion、retrieved source、selected source。
- 当前文章问题必须检查 routeContext 是否注入。
- hidden/admin/draft 内容永远不能进 public source。
- 每次发布前跑一次本地 eval 和浏览器回归。

这已经能救下很多“看起来有 Agent，实际不能用”的情况。

## 8. 边界

Harness 也会让人产生一种错觉：只要评测集过了，Agent 就可靠了。

这当然不成立。Harness 只能覆盖你写进去的问题类型。真实用户会问更短、更乱、更口语化的问题，也会在页面上下文里省略大量信息。Harness 的任务不是替代真实使用，而是把已经发现的失败变成不会反复出现的回归项。

还有一点：不要让 evaluator 看到 Agent 没看到的信息。否则评测会变成事后诸葛亮。一个公平的 evaluator 应该基于同样的 public source、同样的权限范围、同样的上下文限制来判断。

## 9. Takeaway

Agent Harness Engine 的核心不是“多包一层框架”，而是把 Agent 的每次行动拆成可检查的证据：

```text
task + context + tool trace + source decision + eval result
```

有了这层，Agent 开发才从 prompt 感觉变成工程循环。你可以知道是哪类问题在失败，也可以知道一次修复有没有真正保护住真实用户路径。

这就是 Agent 产品化最朴素的分界线：不是它偶尔能答得多聪明，而是它答错时系统能不能定位错在哪里。
