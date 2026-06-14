# AI Tech Blog UI 升级 TODO List

日期：2026-06-13

## 设计判断

我把这个站读成：面向工程师、AI builder、长上下文系统读者的技术博客和研究型阅读产品。视觉语言应保留暗色研究笔记气质，但从“AI 控制台装饰感”收敛到“技术研究杂志 + 可信阅读助手”。

改版模式：Redesign - Preserve。保留现有路由、文章 URL、内容结构、双语能力、Agent QA 产品层和 SEO 结构。升级重点是视觉系统、阅读路径、移动端顺序、可访问性和内容发现。

目标设计拨盘：

- DESIGN_VARIANCE: 6。保留不完全对称的编辑感，减少装饰性控制台元素。
- MOTION_INTENSITY: 4。保留进入和 hover 反馈，不做滚动劫持和无意义循环动画。
- VISUAL_DENSITY: 4。提升扫描效率，不把博客做成空洞作品集。

## 本次证据

本地服务：`http://localhost:3000/`

已检查页面和流程：

- 首页桌面和移动端。
- 推荐文章：`/post/goal-harness-agent-phase-protocol`。
- 搜索无结果恢复：`/search?q=zzzz-no-hit-ui-audit`。
- 移动端浮动阅读助手。

证据文件：

- `docs/product_optimization/reports/ui-upgrade-audit-2026-06-13/ai-tech-blog-home-desktop-full.png`
- `docs/product_optimization/reports/ui-upgrade-audit-2026-06-13/ai-tech-blog-home-mobile-snapshot.md`
- `docs/product_optimization/reports/ui-upgrade-audit-2026-06-13/ai-tech-blog-post-goal-harness-snapshot.md`
- `docs/product_optimization/reports/ui-upgrade-audit-2026-06-13/ai-tech-blog-search-zero-mobile-snapshot-deep.md`
- `docs/product_optimization/reports/ui-upgrade-audit-2026-06-13/ai-tech-blog-agent-mobile-snapshot.md`

关键观察：

- 首页移动端没有横向溢出，但第一篇文章大约在 `y=3061px` 才出现。
- 文章页桌面正文大约从 `y=1428px` 开始，移动端正文大约从 `y=1438px` 开始。
- 文章导读层桌面约 `592px` 高，移动端约 `639px` 高。
- 搜索无结果页有较好的恢复路径和 Agent 入口。
- 移动端阅读助手视觉上可用，但在可访问性树里更像 generic 容器，不像清晰的 dialog 或 region。
- 公共页面检查期间没有前端 console warning。

## 2026-06-13 当前代码复核

注意：上面的“关键观察”来自第一轮截图和快照。当前工作区已经有一批未提交 UI 改动，最新 `docs/product_optimization/reports/ui-layout-checks-latest.json` 显示多项原 P0 已经通过自动化指标，应从“待修复”改为“回归守门”。

最新量化结果：

- 首页 390x844：第一篇文章 `y=1135.17`，搜索栏 `y=923.80`，header `72px`，无横向溢出。
- 首页 1440x1000：第一篇文章 `y=1223.88`，搜索栏 `y=1018.09`，header `72px`，无横向溢出。
- 文章页 390x844：正文 `y=837.98`，导读层 `365.23px`，无横向溢出。
- 文章页 1440x1000：正文 `y=859.41`，导读层 `290.05px`，无横向溢出。
- 搜索无结果 390x844：恢复动作 `y=732.86`，清空搜索存在，无横向溢出。
- 移动端阅读助手：launcher 绑定 panel，panel 已是 `role="dialog"` + `aria-modal="true"`，焦点进入、Escape 关闭、焦点返回 launcher 均通过。

当前 Todo 状态：

| 项目 | 当前状态 | 下一步判断 |
| --- | --- | --- |
| UI-00 单一公共视觉 Token 合约 | 仍待做 | 最高优先级。当前仍存在 `public-components.css` 和 `visual-refresh.css` 双层覆盖，后续视觉升级会继续漂移。 |
| UI-01 首页移动端内容顺序 | 已通过当前指标 | 转为回归守门。保留阈值：390px 第一篇文章 `y < 1450`，搜索栏尽早出现。 |
| UI-02 文章页导读层压缩 | 已通过当前指标 | 转为回归守门。保留阈值：移动正文 `y < 950`，桌面正文 `y < 1050`。 |
| UI-03 加载、空态、错误态 | 部分完成 | Track 加载态已改善，继续补齐文章列表 skeleton、慢网 copy、error recovery，不要用大空框。 |
| UI-04 阅读助手可访问 surface | 已通过当前指标 | 转为回归守门。继续补桌面 complementary region 和 z-index 文档。 |
| UI-05 降低通用 AI 视觉模板感 | 仍待做 | 进入下一轮主设计任务。需要收敛星空、网格、glow、radial gradient 和轨道图的模板感。 |
| UI-06 首页三任务结构 | 部分完成 | 最新文章已更早露出，仍需让 Start / Continue / Find 的产品层级更明确。 |
| UI-07 编辑型文章卡 | 部分完成 | 缩略图系统已出现雏形，下一步是卡片节奏、featured 规则、移动端前两篇视觉保留。 |
| UI-08 搜索结果和无结果恢复 | 部分完成 | 主恢复动作已可见，继续强化 Agent 是 primary recovery 的语义和视觉层级。 |
| UI-09 导航作为阅读工具 | 当前已满足核心要求 | Header 搜索入口和高度指标已通过，后续只做拥挤状态检查。 |
| UI-10 长文阅读排版 | 仍待做 | 重点检查代码块、表格、长标题、中英混排行长和 reading surface 的 glass 感。 |
| UI-11 系列和 Track 连续性 | 已有组件雏形 | `SeriesProgress` 已出现，下一步补集成验收和首页 / track / 文章尾部一致性。 |
| UI-12 文章视觉资产系统 | 可进入验收 | `client/public/images/article-thumbs/` 已有 6 张缩略图，主题映射已降低重复，下一步补 alt、CLS、重复率验收。 |
| UI-13 目的性动效 | 仍待做 | 减少 shiny sweep 和装饰性 hover，补 reduced-motion 浏览器检查。 |
| UI-14 UI QA Gate | 已有脚本雏形 | `scripts/audit/ui-layout.ts` 和 latest json 已存在，下一步扩到归档、track、文章长标题、代码块/表格。 |
| UI-15 文案语域 | 仍待做 | 统一“开始阅读 / 继续阅读 / 搜索主题 / 问助手 / 订阅”这些用户意图标签。 |

## 2026-06-14 继续审查记录

第二轮按移动端首屏和“避免通用 AI 模板感”继续检查首页、搜索无结果、文章页、AI 算法 Track 和 AI 应用 Track。当前没有发现横向溢出或断裂型布局问题，主要剩下密度和语义细节。

本轮已处理：

- 搜索无结果移动端：恢复动作优先级更高，手机上隐藏次级 scope 说明，避免主恢复卡底部贴近首屏边缘。
- Track 移动端：统计块改为紧凑三列，加载中不再显示 `...`，改为 value skeleton，减少“数据坏了”的观感。
- 文章缩略图：宽泛的 agent / harness / evaluation 主题不再全部落到同一张图，使用稳定 hash 分配到多个视觉主题。
- 视觉 token 残留：移除 violet shadow，并扫过 purple / violet / em dash 关键词，避免蓝紫 AI 模板感回流。

继续保留为下一批 TODO：

- UI-00 仍是最高优先级。当前样式已经可用，但 `public-components.css` 与 `visual-refresh.css` 的职责边界仍未完全收敛。
- UI-03 从“待做”调整为“部分完成”。Track 加载态已改善，仍需补全文章列表慢网、错误态、空态的完整矩阵。
- UI-08 从“部分完成”继续保留。移动端恢复动作已能优先出现，下一步应让 Agent primary recovery 的文案和视觉权重在桌面 / 移动一致。
- UI-12 从“资产雏形”调整为“可进入验收”。下一步检查每张缩略图的 alt、CLS、主题命中和重复率。

## 当前执行优先级

### 第一批：稳定视觉系统，防止返工

1. UI-00：合并 public visual token 和公共组件样式归属。
2. UI-14：把最新 layout checks 变成正式回归 gate。
3. UI-05：在 token 合并后收敛星空、网格、glow、radial gradient。

### 第二批：把首页从“漂亮入口”改成“阅读任务台”

1. UI-06：明确 Start here、Continue reading、Find a topic 三个任务。
2. UI-07：文章卡继续从 ledger tile 进化成 editorial teaser。
3. UI-03：补 loading / empty / error 的可信状态。

### 第三批：让文章页成为主产品体验

1. UI-10：优化正文、代码块、表格、长标题、TOC 和 reading surface。
2. UI-11：统一系列进度组件在首页、track、文章页、文章尾部的权重。
3. UI-13：只保留表达层级和反馈的动效。

### 第四批：把 Agent 和搜索嵌入阅读系统

1. UI-08：搜索无结果把 Agent 作为 primary recovery。
2. UI-04：保持移动端 dialog 回归测试，补桌面 region 语义。
3. UI-15：收敛文案，让一个用户意图只对应一个标签。

## 产品北极星

把博客升级成一个“认真研究出版物 + 内嵌阅读助手”：

1. 新读者在一屏内知道两条研究主线是什么。
2. 老读者能快速找到最新文章和继续阅读路径，尤其是移动端。
3. 文章页能更快进入正文，同时保留有用的导读。
4. 搜索和 Agent QA 是阅读系统的一部分，不是悬浮外挂。
5. 暗色视觉系统要安静、可信、独特，不像通用 AI 蓝紫科幻模板。

## P0 TODO

### UI-00 建立单一公共视觉 Token 合约（待做）

问题：`public-components.css` 定义了一套公共壳，`visual-refresh.css` 又覆盖了大量同名类，包括背景、面板、导航、文章卡、搜索栏、阅读面板。后续 UI 很容易出现“改一处，另一处覆盖回来”的漂移。

证据：

- `client/src/main.tsx` 同时导入 `public-components.css` 和 `visual-refresh.css`。
- `client/src/styles/public-components.css` 定义公共基础类。
- `client/src/styles/visual-refresh.css` 重新定义主要公共类。

TODO：

- 建立 public token 层：surface、border、accent、text、radius、shadow、motion。
- 把 `.glass-panel`、`.article-card`、`.home-search-dock`、`.research-index-row`、`.page-title`、`.article-entry-layer` 合并为单一规则族。
- `visual-refresh.css` 只保留路由级组合样式，或在迁移后退役。
- 在 CSS 中明确注释：token 层、layout primitive 层、route-specific 层分别归谁管。

验收：

- 搜索 `.article-card`、`.glass-panel`、`.home-search-dock`、`.research-index-row` 时只有一个主规则族。
- 首页、文章、搜索、归档、AI 算法、AI 应用视觉不回退。
- 合并后 `pnpm check`、`pnpm test`、`pnpm build` 通过。

### UI-01 修复首页移动端内容顺序（当前已通过，转回归守门）

问题：移动端第一篇文章出现在大约 `y=3061px`，前面堆了阅读线索、统计、快捷链接、About、热门标签和订阅。博客的核心价值被推得太后。

证据：

- `Home.tsx` 中 secondary intro/sidebar block 位于 `#research-index` 之前。
- 运行时指标显示 `.research-grid` 大约在 `y=2986px`，第一张 `.article-card` 大约在 `y=3061px`。

TODO：

- 移动端顺序调整为：hero、两个 track 卡、搜索栏、最新文章、研究索引、About/标签/订阅。
- 桌面保留更丰富的布局，但移动端用 CSS order 或组件拆分优先文章内容。
- 在 hero 下方增加紧凑的“继续阅读”入口，指向推荐文章。
- 移动端把订阅模块移到文章列表之后。

验收：

- 390x844 下，第一篇最新文章出现在 `y=1450px` 之前。
- 首页搜索栏在首屏或首屏后一小段内可见。
- 360、390、768、1024、1440 宽度下没有横向溢出。

### UI-02 压缩文章页导读层（当前已通过，转回归守门）

问题：`阅读入口` 有价值，但现在像第二个 hero，把正文推得太晚。

证据：

- 桌面文章标题高约 `218px`。
- `.article-entry-layer` 桌面约 `592px`，移动端约 `639px`。
- 正文桌面和移动端都在 `y=1400px` 之后才开始。
- `PostDetail.tsx` 先渲染导读层、分享、视觉图、TOC，再进入正文。

TODO：

- 把 `阅读入口` 改成紧凑 reading brief：一行摘要、两个元信息 chip、一个可展开的“怎么读”抽屉。
- 默认只展示两个事实：核心主张和系列位置。
- 背景、实现映射、限制说明放进可折叠详情区。
- Agent 伴读 prompt 放到标题附近的紧凑行，或正文第一节之后，不再塞进大型 pre-body 模块。
- 分享动作桌面只在能单行放下时展示，移动端收敛成一个 Share 按钮或菜单。

验收：

- 390x844 下，文章正文在 `y=950px` 前出现。
- 1440x1000 下，文章正文在 `y=1050px` 前出现。
- 导读层仍保留系列导航和 Agent prompt。
- 键盘用户可以展开或收起额外导读详情。

### UI-03 把黑盒加载态改成可理解状态（待做）

问题：首张首页截图中，`最新笔记` 区域在数据完成前显示两个大空框，看起来像内容坏了。

TODO：

- 把大空框换成文章形 skeleton：标题线、摘要线、标签、meta row。
- 为慢网加载添加中英文 loading copy。
- 1200ms 后显示“仍在加载公开笔记”的延迟状态。
- 空态要链接到归档和搜索，并提供 Agent QA 作为恢复路径。

验收：

- 延迟 `posts.list` 时，用户知道正在加载什么。
- loading、empty、error 三种状态视觉不同。
- 公共页加载态不只依赖 spinner 或空白框。

### UI-04 把阅读助手升级为一等可访问 Surface（当前已通过，转回归守门）

问题：移动端 Agent QA 视觉清晰，但可访问性快照里是 generic 容器，不是明确 dialog/region。焦点管理和读屏语义需要补齐。

证据：

- launcher 有 `aria-expanded`，但 panel 是 fixed generic wrapper。
- panel 内容是 `<section>`，移动端作为覆盖层时没有 `role="dialog"` 或 `aria-modal`。

TODO：

- 移动端把助手 panel 渲染为 dialog：`role="dialog"`、`aria-modal="true"`、`aria-labelledby`、focus trap。
- 桌面若保持非 modal，则渲染为带标题的 complementary region。
- launcher 和 panel 用 `aria-controls` 连接。
- 关闭时焦点返回 launcher。
- 增加 Escape 关闭，并确认不影响输入法组合输入。
- 文档化 z-index：launcher、panel、header、toast 的层级。

验收：

- 键盘可以打开、使用、关闭助手，并且焦点不丢失。
- 读屏树中助手 surface 名为“阅读助手”。
- 非输入组合状态下 Escape 能关闭 panel。
- 移动端 dialog 打开时，背后内容不会被误聚焦。

## P1 TODO

### UI-05 降低通用 AI 视觉模板感（待做）

问题：暗色研究方向是对的，但当前蓝紫 radial gradient、网格线、发光阴影、轨道 hero 图叠加后，容易像通用 AI 科幻模板。

证据：

- `visual-refresh.css` 使用多处 radial gradient、cobalt/violet glow、固定网格和 hover sweep。
- hero 使用 `/images/research-orbit-hero.jpg`，符合主题但辨识度偏通用。

TODO：

- 只保留一个主 accent：cobalt 或 cyan，不要 cobalt、violet、teal 同时抢戏。
- 用更低对比的编辑质感替代大面积 glow：轻噪声、淡技术线稿、文章抽象图。
- 删除不表达状态的装饰点。
- hero 图改得更像博客自己的研究视觉：减少暗裁切、用概念说明型图像，或生成一张和文章主题相关的技术 collage。
- 不要每张卡都复用同一种发光和扫光。

验收：

- 视觉审查只看到一个主 accent。
- 背景仍是暗色，但不和正文抢对比。
- hero 图像能识别为本站视觉，而不是 stock AI orbit。

### UI-06 把首页重组为三个清晰任务（部分完成）

问题：首页同时承担 hero、推荐文章、双 track、搜索、系列、统计、快捷链接、About、标签、订阅、最新、研究索引。每块都有用，但层级平均。

TODO：

- 任务 1：Start here。推荐文章和两条 track 入口。
- 任务 2：Continue reading。最新文章和活跃系列。
- 任务 3：Find a topic。搜索、标签、归档、Agent QA。
- 统计只保留真正建立信任的内容，阅读量优先级低于阅读路径。
- About 收成短 byline，完整信息放 `/about`。
- 订阅移动端放到文章列表之后，或更靠近 footer/文章尾部。

验收：

- 新读者 5 秒内能识别开始读、看最新、搜索主题三个路径。
- 最新文章是 hero 之后的视觉中心。
- 移动端 sidebar 内容不压过文章内容。

### UI-07 把文章卡从 Ledger Tile 升级为编辑型 Teaser（部分完成）

问题：文章卡功能正常，但无封面文章的数字 ledger 视觉重复且装饰性强。移动端隐藏视觉后，文章之间区分度下降。

TODO：

- 用语义 track mark 或小型生成/派生缩略图替代数字 ledger。
- 移动端前 1 到 2 篇保留视觉缩略图，后续再压缩。
- 系列位置改成更易扫读的一行，不要堆过多 pill。
- 每张卡最多展示 3 个 pill。
- `阅读全文` 只在必要时显示，因为整张卡已经可点击。

验收：

- 最新列表有节奏，不依赖 fake UI screenshot。
- 390px 下卡片仍然可读。
- 第一张文章明显是主故事。

### UI-08 强化搜索结果和无结果恢复层级（部分完成）

问题：搜索无结果内容质量不错，但视觉仍像嵌套暗色卡。主恢复动作应更清楚。

TODO：

- 无结果时，把“询问阅读助手”作为 primary action，相关主题放到下方。
- 相关主题桌面用紧凑 query chip 或双列卡。
- 增加一句说明：助手会基于公开文章、标签、分类和当前 query 检索。
- 增加“清空搜索”动作。
- 保留隐私说明，但视觉降级。

验收：

- 移动端无结果标题后，不滚动也能看到主恢复动作。
- query chip 可键盘访问且 accessible name 清楚。
- search empty、loading、zero、success 四种状态布局不同。

### UI-09 让导航更像阅读工具（当前已满足核心要求）

问题：桌面主导航隐藏 Search，移动端 header 可见语言、登录、菜单，但没有直接搜索入口。搜索是博客核心路径。

TODO：

- 桌面和移动端 header 增加 icon-only 搜索按钮。
- 桌面导航高度保持 72px 或更低，1024px 不换行。
- 文章页 compact header 展示 Back、Search、language 和助手入口，不拥挤。
- 如果移动端空间紧，把 login 收进菜单。

验收：

- 任意公共路由一击可达搜索。
- Header 高度不超过 72px。
- 1024px 桌面不换行。

### UI-10 优化长文阅读排版（待做）

问题：正文可读，但标题和 pre-body 堆叠压过正文。阅读面板也稍像大 glass 卡，而不是安静的编辑阅读面。

TODO：

- 长中英混排标题限制字号和行数。
- 桌面正文可适度加宽，但控制行长：中文不超过约 72 字，英文不超过约 78 字符。
- 减弱 reading surface 的 glass 感，保留安静背景和边界。
- 提升代码块对比、复制按钮可见性、表格横向滚动提示和标题间距。
- reading progress bar 若继续保留，应语义化或降低 z-index，避免和 header/assistant 竞争。

验收：

- 长标题桌面不超过 3 行，移动端不超过 4 行。
- 正文更早出现，但导读信息仍够用。
- 代码块和表格通过键盘与移动端 overflow 检查。

### UI-11 产品化系列和 Track 连续性（已有组件雏形）

问题：系列结构很有价值，但在首页、track 页、文章导读、文章尾部重复出现，权重和样式不统一。

TODO：

- 建一个可复用 `SeriesProgress` 组件，提供 compact、card、footer 三种 variant。
- 统一 start series、previous、next、track overview。
- 首页只展示活跃系列名和一个 next article action。
- 文章页把系列上下文压缩到标题上方或旁边，不再占用大块 mid-header。

验收：

- 首页、track 页、文章页的系列 UI 一致。
- 任意文章中都能一击进入系列前后文。
- 组件测试覆盖系列第一篇、中间篇、最后篇。

## P2 TODO

### UI-12 建立独特的文章视觉资产系统（已有资产雏形）

TODO：

- 生成或设计 6 到 10 套可复用文章缩略图：
  - residual flow map
  - position encoding field
  - context compiler packet
  - agent trace ladder
  - evaluation harness loop
  - retrieval evidence mesh
- 放到 `public/images/article-thumbs/`。
- 按标签或系列做 deterministic thumbnail mapping。
- 有意义图片写 alt，纯装饰图片用空 alt。

验收：

- 文章列表不再依赖数字占位。
- 每个公开系列有可识别视觉语言。
- 图片预留尺寸，不引入 CLS。

### UI-13 让动效有目的（待做）

TODO：

- `motion-reveal` 只用于首屏层级出现。
- 卡片和按钮只保留小幅 transform/opacity 反馈。
- 删除或减少每张卡的 shiny sweep hover。
- 不做 scroll hijack。
- 保留 `prefers-reduced-motion`，并为它增加浏览器检查。

验收：

- 动效表达层级或反馈，不做装饰。
- reduced motion 下关闭入场和扫光效果。
- 移动端 INP 仍健康。

### UI-14 增加 UI QA Gate（已有脚本雏形）

TODO：

- 增加脚本，捕获首页、文章、搜索、归档、AI 算法、AI 应用的桌面和移动端状态。
- 记录运行时指标：第一篇文章 y-position、文章正文 y-position、横向溢出、header 高度、助手 dialog 焦点。
- 产出类似现有 `po-*-browser-checks.json` 的轻量断言文件。

验收：

- UI 改动若把正文或第一篇文章推过阈值，会被检查拦住。
- 移动端最新文章位置被量化记录。
- 搜索无结果和 Agent 打开状态进入检查集。

### UI-15 打磨文案语域（待做）

TODO：

- 中文保持“说人话”的技术表达。
- 避免通用 AI 产品文案。
- 如果“阅读线索”“阅读入口”“研究路径”不能清楚区分，就合并标签。
- 删除搜索、索引、阅读线索一起出现时的近义重复。
- 英文模式不要直译得生硬。

验收：

- 一个用户意图只有一个标签：搜索、继续阅读、开始系列、问助手、订阅。
- 不在每个 section 下方塞装饰性 microcopy。
- 双语按钮不出现尴尬换行。

## 建议实施 Phase

### Phase A: Visual Foundation

- 合并 CSS 归属。
- 定义 public design tokens。
- 收敛 accent 和 glow。
- 加 UI QA 路由指标。

退出标准：视觉壳稳定，token 清楚，baseline 截图和指标可复现。

### Phase B: Home Product Flow

- 重排移动端首页。
- 按 Start、Continue、Find 重组首页。
- 重做文章卡和加载态。
- 移动端下移 sidebar/subscribe。

退出标准：移动端最新文章出现在 `y=1450px` 前，首页读者路径清楚。

### Phase C: Article Reading

- 压缩导读层。
- 重排分享和 Agent prompt。
- 优化正文、代码、表格、TOC、系列连续性。
- 验证长标题。

退出标准：移动端正文 `y=950px` 前出现，桌面正文 `y=1050px` 前出现。

### Phase D: Discovery And Agent

- 升级搜索无结果恢复。
- Header 加搜索入口。
- 阅读助手改成可访问 dialog/region。
- 把 Agent prompt 稳定嵌入搜索和文章流。

退出标准：搜索、无结果、助手打开状态通过键盘和 snapshot 检查。

### Phase E: Asset And Polish Pass

- 增加文章缩略图系统。
- 清理文案标签。
- 调整动效和 reduced-motion。
- 跑完整浏览器 QA。

退出标准：站点像一个独特研究出版物，不像通用暗色 AI 模板。

## 实施注意

- 不改公开路由 slug 和文章 URL。
- 继续沿用现有 Radix/shadcn primitives 和 Tailwind v4。
- 这轮保留 lucide，因为项目已经依赖它，不额外混入第二套 icon family。
- 不做隐藏博客内容的 landing page。首屏必须仍然是可用阅读入口。
- 不手画装饰 SVG。需要视觉资产时用真实图、生成缩略图或仅做轻量纹理。
- 公共壳继续 dark-only，除非后续品牌决策明确要 light mode。
