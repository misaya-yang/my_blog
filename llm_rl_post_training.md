# 大模型强化学习：从 RLHF 到可验证奖励的后训练主线

过去几年，大模型训练的主线大致可以被拆成三段：预训练、监督微调、后训练。预训练让模型获得语言、知识和模式压缩能力；SFT 让模型学会“像一个助手一样回答”；而强化学习真正改变的是模型在面对多个可能答案时的偏好排序，也就是：**哪些行为应该被鼓励，哪些行为应该被抑制**。

更准确的理解是：大模型强化学习首先是一个“目标函数工程”问题，而不是传统意义上机器人在环境里试错的问题。它的核心不是让模型从零学会语言，而是在一个已经很强的语言模型上，继续塑造它的行为分布：更有帮助、更安全、更符合人类偏好，或者在数学、代码、工具调用这类任务上更愿意进行长程推理和自检。

RLHF 这条路线早期来自“从人类偏好中学习奖励”的思想。Christiano 等人在 2017 年展示了如何用人类对轨迹片段的偏好来训练 reward model，再用强化学习优化策略；后来 OpenAI 在摘要任务和 InstructGPT 中把这套方法系统用于语言模型后训练，形成了“收集偏好数据 → 训练奖励模型 → PPO 优化策略”的经典 RLHF pipeline。([arXiv][1])

但这条线没有停在 PPO-RLHF。DPO 把 KL 正则化 RLHF 问题改写成了一个直接的偏好分类损失，降低了训练复杂度；RLAIF 尝试用 AI 反馈替代昂贵的人类反馈；RLVR / RLVF 把奖励从主观偏好转向可验证信号；GRPO、RLOO、ReMax、DAPO、REINFORCE++ 等方法则重新审视 PPO 在大模型场景下是否过重。到了 reasoning model 阶段，强化学习不再只是“对齐助手语气”，而开始成为激发长链推理、搜索、验证和工具使用能力的关键机制。([arXiv][2])

这篇笔记是一份面向大模型强化学习的阶段性技术梳理。它不把每个缩写孤立展开，而是把它们放进同一个框架里：**奖励从哪里来，策略如何更新，反馈是否可验证，训练是否需要在线采样，最终优化的是偏好、推理还是行动能力。**

---

## 一、强化学习介绍：大模型为什么需要 RL

强化学习解决的问题可以写成一句话：

> 一个智能体在环境中采取行动，环境给出反馈，智能体通过最大化长期奖励来改进行为。

在传统 RL 里，智能体可能是一个玩 Atari 的 agent、一个控制机械臂的 policy、一个下围棋的系统。它在状态 $s$ 下选择动作 $a$，环境转移到新状态 $s'$，并返回奖励 $r$。智能体的目标是找到一个策略：

$$
\pi(a \mid s)
$$

使得未来累计奖励最大。

放到大语言模型里，这个定义需要重新翻译。模型的“状态”可以是 prompt 加上已经生成的 token 前缀；“动作”可以是下一个 token，也可以是一次工具调用、一次搜索、一次代码执行；“环境”可以是人类偏好标注器、AI judge、数学答案验证器、代码单元测试、浏览器、数据库，或者一个完整的 agent sandbox；“奖励”则可以来自人类打分、偏好模型、规则函数、可执行测试、过程验证器，甚至多个目标的加权组合。

所以，大模型强化学习不是在训练一个完全从零探索世界的 agent，而是在一个预训练模型上做行为再分配：

$$
\pi_{\text{pretrain}}
\rightarrow
\pi_{\text{sft}}
\rightarrow
\pi_{\text{rl}}
$$

预训练模型已经知道很多东西，SFT 模型已经会模仿高质量答案，RL 的作用是让模型在“会做”的空间里更倾向于选择被奖励的行为。

这也是大模型 RL 和传统 RL 的一个重要差异。传统 RL 经常面对稀疏知识和真实环境探索；大模型 RL 通常有一个很强的初始策略，训练中必须避免模型为了追求奖励而偏离原有语言能力，所以 KL 正则化几乎成为 RLHF 的默认组件。PPO 在 RLHF 中被广泛使用，一个原因就是它通过 clipped objective 或 KL 控制策略更新幅度，避免模型一步更新过大。([arXiv][3])

大模型强化学习的核心问题可以概括成三句话：

第一，**奖励不是天然存在的，而是被建模、被标注、被规则化、被验证出来的。**

第二，**策略优化不是越激进越好，因为模型需要在奖励提升和语言分布稳定之间保持平衡。**

第三，**大模型 RL 的真正难点不是写出 Bellman 方程，而是设计一个不容易被模型钻空子的反馈系统。**

---

## 二、基础数学：奖励、回报、Bellman 方程与大模型 RL 目标

### 2.1 MDP：强化学习的基本对象

强化学习通常从马尔可夫决策过程开始：

$$
\mathcal{M} = (\mathcal{S}, \mathcal{A}, P, r, \gamma)
$$

其中：

$$
s \in \mathcal{S}
$$

表示状态，

$$
a \in \mathcal{A}
$$

表示动作，

$$
P(s' \mid s, a)
$$

表示状态转移概率，

$$
r(s,a)
$$

表示奖励函数，

$$
\gamma \in [0,1]
$$

表示折扣因子。

智能体按照策略 $\pi_\theta(a \mid s)$ 采取动作，形成一条轨迹：

$$
\tau = (s_0, a_0, r_0, s_1, a_1, r_1, \dots)
$$

它要最大化的是累计回报：

$$
G_t = \sum_{k=0}^{T-t} \gamma^k r_{t+k}
$$

对应的优化目标是：

$$
J(\theta) =
\mathbb{E}_{\tau \sim \pi_\theta}
\left[
\sum_{t=0}^{T}
\gamma^t r(s_t,a_t)
\right]
$$

在大语言模型里，如果把每个 token 当作动作，那么一条回答就是一条 episode。多数 RLHF 任务的奖励并不是每个 token 都给，而是在整段回答结束后给一个 sequence-level reward：

$$
R(x,y)
$$

其中 $x$ 是 prompt，$y$ 是模型生成的回答。

这会带来一个很直接的问题：模型生成了几百甚至几千个 token，但奖励只在最后给出。于是 credit assignment 变得困难：到底是哪一步推理、哪个 token、哪次工具调用导致了最终奖励变高或变低？这也是后来 outcome reward、process reward、verifier、tool reward 等方向持续发展的原因。

---

### 2.2 价值函数与 Bellman 方程

给定策略 $\pi$，状态价值函数定义为：

$$
V^\pi(s) =
\mathbb{E}_\pi
\left[
G_t \mid s_t = s
\right]
$$

动作价值函数定义为：

$$
Q^\pi(s,a) =
\mathbb{E}_\pi
\left[
G_t \mid s_t = s, a_t = a
\right]
$$

Bellman expectation equation 写成：

$$
V^\pi(s) =
\sum_a \pi(a \mid s)
\left[
r(s,a)
+
\gamma
\sum_{s'} P(s' \mid s,a) V^\pi(s')
\right]
$$

对应的最优 Bellman 方程是：

$$
V^*(s) =
\max_a
\left[
r(s,a)
+
\gamma
\sum_{s'} P(s' \mid s,a) V^*(s')
\right]
$$

这组公式表达的是一个非常朴素的递归关系：一个状态的价值，等于当前奖励加上下一个状态的价值。

在大模型 RL 里，Bellman 方程并没有消失，只是它的形态被压进了 critic、value model 和 advantage estimation 中。PPO-RLHF 通常会训练一个 value head 来估计每个 token 前缀状态的价值，然后用 advantage 来更新策略。GRPO、RLOO、ReMax 这类方法则试图弱化甚至去掉 value model，用 group baseline 或其他方差降低技巧替代 critic。([arXiv][4])

---

### 2.3 Policy Gradient：为什么可以直接优化语言模型

策略梯度的基本形式是：

$$
\nabla_\theta J(\theta) =
\mathbb{E}_{\pi_\theta}
\left[
\sum_t
\nabla_\theta \log \pi_\theta(a_t \mid s_t)
A_t
\right]
$$

其中 $A_t$ 是 advantage：

$$
A_t = Q(s_t,a_t) - V(s_t)
$$

直觉上，如果某个动作的 advantage 为正，就增加它的概率；如果 advantage 为负，就降低它的概率。

放到语言模型中，动作是 token：

$$
a_t = y_t
$$

策略是模型的 token 分布：

$$
\pi_\theta(y_t \mid x, y_{<t})
$$

一整段回答的概率是：

$$
\pi_\theta(y \mid x) =
\prod_{t=1}^{T}
\pi_\theta(y_t \mid x, y_{<t})
$$

所以，只要能给整段回答一个奖励，就可以通过 log probability 把奖励信号传回每个 token：

$$
\nabla_\theta \log \pi_\theta(y \mid x) =
\sum_t
\nabla_\theta \log \pi_\theta(y_t \mid x, y_{<t})
$$

这就是为什么语言模型可以用 policy gradient 做 RL 微调。

---

### 2.4 KL 正则化：大模型 RL 的稳定器

标准 RLHF 目标通常不是单纯最大化 reward，而是最大化一个带 KL 约束的目标：

$$
\max_{\pi_\theta}
\mathbb{E}_{x \sim \mathcal{D}, y \sim \pi_\theta}
\left[
r_\phi(x,y)
-
\beta
\log
\frac{
\pi_\theta(y \mid x)
}{
\pi_{\text{ref}}(y \mid x)
}
\right]
$$

其中 $r_\phi(x,y)$ 是奖励模型，$\pi_{\text{ref}}$ 通常是 SFT 模型或初始 reference model，$\beta$ 控制偏离参考模型的惩罚强度。

这条公式是理解 RLHF、DPO、IPO、KTO、SimPO、ORPO 等方法的关键。大模型强化学习不是让模型无约束地追求奖励，而是在“奖励更高”和“不要偏离原始模型太远”之间做权衡。奖励过强、KL 太弱时，模型容易出现 reward hacking、长度偏置、模板化输出、过度拒答或者其他 Goodhart 式问题。关于 reward model overoptimization，已有工作系统研究了 reward 分数继续上升但真实偏好下降的现象。([Proceedings of Machine Learning Research][5])

---

### 2.5 奖励模型：从人类偏好到标量奖励

RLHF 的经典奖励模型通常基于成对偏好数据：

$$
(x, y_w, y_l)
$$

其中 $y_w$ 是 preferred response，$y_l$ 是 rejected response。Bradley-Terry 形式的偏好概率可以写成：

$$
P_\phi(y_w \succ y_l \mid x) =
\sigma
\left(
r_\phi(x,y_w) - r_\phi(x,y_l)
\right)
$$

奖励模型的训练损失是：

$$
\mathcal{L}_{RM} = -
\mathbb{E}
\left[
\log
\sigma
\left(
r_\phi(x,y_w) - r_\phi(x,y_l)
\right)
\right]
$$

训练好以后，$r_\phi(x,y)$ 就被当成代理奖励，用于 PPO、RLOO、ReMax 或其他在线 RL 算法。InstructGPT、Anthropic HH assistant 等早期系统都使用了偏好建模和 RLHF 来改善有用性、无害性和指令跟随能力。([OpenAI][6])

这一步的关键风险是：奖励模型不是人类偏好的真实本体，只是一个代理。模型一旦被训练去最大化这个代理，就可能学会“让 reward model 高兴”，而不是让真实用户满意。

---

### 2.6 DPO：把 RLHF 目标改写成偏好分类

DPO 的核心洞察是：在 KL 正则化 RLHF 中，最优策略满足：

$$
\pi^*(y \mid x)
\propto
\pi_{\text{ref}}(y \mid x)
\exp
\left(
\frac{1}{\beta} r(x,y)
\right)
$$

因此可以反过来把 reward 写成策略和 reference model 的 log-ratio：

$$
r(x,y) =
\beta
\left[
\log \pi_\theta(y \mid x)
-
\log \pi_{\text{ref}}(y \mid x)
\right]
+
C(x)
$$

把它代入偏好模型，就得到 DPO loss：

$$
\mathcal{L}_{DPO} = -
\mathbb{E}
\left[
\log
\sigma
\left(
\beta
\left[
\log \frac{\pi_\theta(y_w \mid x)}{\pi_{\text{ref}}(y_w \mid x)}
-
\log \frac{\pi_\theta(y_l \mid x)}{\pi_{\text{ref}}(y_l \mid x)}
\right]
\right)
\right]
$$

这就是 DPO 被称为“你的语言模型其实是一个奖励模型”的原因：它不再显式训练 reward model，也不需要 PPO 采样循环，而是直接用偏好对训练策略。DPO 论文报告它在摘要、单轮对话等场景中可以匹配或超过 PPO-style RLHF，同时实现更简单、训练更稳定。([arXiv][2])

DPO 不是“完全抛弃了强化学习思想”，而是把 KL-regularized RLHF 的一部分数学结构折叠成了一个 supervised-looking loss。它在工程上像 SFT，在目标上仍然继承了 RLHF 的偏好优化问题。

---

## 三、当前技术路线：从 PPO-RLHF 到 RLVR、GRPO 与 Agent RL

### 3.1 PPO-RLHF：经典但复杂的主线

PPO-RLHF 是最经典的大模型强化学习路线，通常包含三步：

1. 用高质量问答数据训练 SFT 模型；
2. 用人类偏好数据训练 reward model；
3. 用 PPO 优化模型，使其在 reward model 下得分更高，同时受 KL 约束。

PPO 的 clipped objective 可以写成：

$$
\mathcal{L}^{CLIP}(\theta) =
\mathbb{E}
\left[
\min
\left(
\rho_t(\theta) A_t,
\text{clip}(\rho_t(\theta),1-\epsilon,1+\epsilon)A_t
\right)
\right]
$$

其中：

$$
\rho_t(\theta) =
\frac{
\pi_\theta(a_t \mid s_t)
}{
\pi_{\theta_{\text{old}}}(a_t \mid s_t)
}
$$

PPO 的优点是成熟、稳健、适合在线采样；缺点是系统复杂，需要 policy model、reference model、reward model、value model，训练时还要处理 KL、value loss、advantage estimation、reward normalization、采样效率等一系列工程问题。PPO 原始论文强调它在信赖域思想和实现简洁性之间取得平衡，但在大模型 RLHF 场景下，这套方法仍然显得比较重。([arXiv][3])

更稳妥的判断是：PPO-RLHF 不会消失，因为在线 RL 仍然重要；但它不再是唯一答案。对于很多偏好对齐任务，DPO/SimPO/ORPO 这类 offline preference optimization 已经足够；对于数学、代码这类可验证任务，GRPO/RLOO/REINFORCE++ 这类更轻的 policy-gradient 变体正在变得更常见。

---

### 3.2 DPO 家族：偏好优化的工程化简化

DPO 之后，偏好优化出现了大量变体。它们大多围绕几个问题展开：是否需要 reference model，是否依赖成对偏好，是否容易过拟合，是否存在长度偏置，是否能处理非传递偏好。

IPO 从理论上重新分析了基于偏好的学习问题，指出 Bradley-Terry 假设在偏好接近确定性时可能导致过拟合，并提出 Identity Preference Optimization 作为替代。KTO 则从 Kahneman-Tversky 前景理论出发，尝试用“人类效用”而不是单纯 pairwise likelihood 来做模型对齐，尤其适合只有 desirable / undesirable 单样本标签而不是成对偏好数据的场景。([arXiv][7])

ORPO 和 SimPO 代表了另一条工程路线：减少 reference model 或简化 reward 形式。ORPO 把 odds ratio penalty 融入 SFT，一步完成 imitation 和 preference alignment；SimPO 使用平均 log probability 作为隐式 reward，并引入 target reward margin，从而避免单独 reference model，提升计算和显存效率。([arXiv][8])

还有一类方法更接近“排序学习”或“筛选式自训练”。RRHF 用排序损失让模型概率和偏好排序一致；SLiC-HF 用 sequence likelihood calibration 学习人类反馈；RAFT 则先用 reward model 对多个候选回答排序，筛出高质量样本再做 fine-tuning。它们未必都被称为 RL，但本质上都在解决同一个问题：如何把偏好信号转成模型参数更新。([arXiv][9])

这些方法可以放在一个谱系里看：

$$
\text{PPO}
\rightarrow
\text{DPO}
\rightarrow
\text{IPO / KTO / ORPO / SimPO}
\rightarrow
\text{Online DPO / Nash / Self-play}
$$

越靠左，越像在线强化学习；越靠右，越像带偏好结构的监督学习。但它们共享同一个底层目标：让模型更倾向于人类或评审器偏好的回答。

---

### 3.3 RLAIF：反馈的自动化

RLHF 最大的瓶颈之一是人类反馈昂贵、慢、噪声大，而且不同标注者的偏好并不一致。RLAIF 的思路是用强模型或专门的 AI evaluator 生成偏好标签，再用这些标签训练 reward model 或直接指导 policy 优化。

Anthropic 的 Constitutional AI 是 RLAIF 的代表性路线之一：人类不直接为每个 harmful output 打标签，而是提供一组原则；模型先按原则批判和修正，再用 AI feedback 构造偏好信号，进入 RL 阶段。这个方法把“人类逐条标注”转成了“人类定义原则，AI 大规模执行原则”。([arXiv][10])

RLAIF vs RLHF 的研究进一步显示，用 off-the-shelf LLM 生成偏好标签可以在部分场景达到接近人类反馈的效果，并提出 direct-RLAIF，让外部 LLM 在 RL 阶段直接给奖励，从而绕过单独 reward model 训练。([OpenReview][11])

UltraFeedback 则展示了 AI feedback 数据规模化的一种形态：它用 GPT-4 对大规模 user-assistant conversations 生成细粒度反馈，构造了超过 100 万条反馈数据，用于 reward model、critic model 和对齐训练。([arXiv][12])

RLAIF 的意义不是“AI 反馈一定比人类反馈好”，而是它改变了反馈生产方式。未来的人类更可能负责制定原则、审计分布、校准评审器，而不是为每一条回答做重复标注。

---

### 3.4 RLVF / RLVR：从主观偏好到可验证奖励

这里需要先澄清一个缩写问题：RLVF 在不同论文里有时指 **Reinforcement Learning from Verbal Feedback**，也有人用它表示 **Reinforcement Learning from Verifiable Feedback**。在 reasoning model 语境里，更常见、更明确的说法是 RLVR：**Reinforcement Learning from Verifiable Rewards**。为了避免混乱，下文把“自然语言反馈”称为 verbal feedback，把“可验证反馈 / 可验证奖励”称为 RLVR 或 verifiable feedback。

Verifiable reward 的基本形式非常简单：

$$
r(x,y) =
\mathbf{1}[\text{answer}(y) = \text{ground truth}]
$$

数学题答案对了给 1，错了给 0；代码通过测试给正奖励，不通过给 0 或负奖励；格式正确可以额外给 format reward。这种奖励很粗糙，但它有一个很大的优势：不依赖人类主观判断，也不依赖 reward model 的偏好泛化。

DeepSeek-R1 把这条路线推到了前台。其技术报告显示，DeepSeek-R1-Zero 直接从 base model 通过大规模 RL 激发推理能力，出现了反思、验证、策略调整等行为；DeepSeek-R1 则在 pure RL 之外加入 cold-start data 和多阶段训练，以改善可读性和最终表现。([arXiv][13])

OpenAI 在 o1 介绍中也明确强调了 large-scale reinforcement learning 和 test-time compute 对 reasoning performance 的作用：模型通过强化学习学会更有效地使用 chain-of-thought，并且性能会随着训练时 RL compute 和推理时 thinking time 的增加而提升。([OpenAI][14])

这条路线带来的变化很大。传统 RLHF 更多是在对齐“回答风格”和“人类偏好”；RLVR 则直接训练模型解决有可验证答案的问题，尤其是数学、代码、逻辑推理、搜索和工具使用。它不再只是在问“哪个回答更像好助手”，而是在问“哪个行为真的把问题做对了”。

---

### 3.5 GRPO、RLOO、ReMax、REINFORCE++：PPO 之外的在线 RL

DeepSeekMath 提出了 GRPO，也就是 Group Relative Policy Optimization。它可以看成 PPO 的一个轻量变体：对同一个 prompt 采样一组回答，计算每个回答的 reward，再用组内均值和标准差得到相对 advantage：

$$
A_i =
\frac{
r_i - \text{mean}(r_1,\dots,r_K)
}{
\text{std}(r_1,\dots,r_K)
}
$$

这样就不需要单独训练 value model。DeepSeekMath 报告 GRPO 能改善数学推理能力，同时优化 PPO 的内存使用；DeepSeek-R1 后来继续使用 GRPO 作为 RL 框架。([arXiv][4])

RLOO 的思想也很直接：对同一个 prompt 采样 $K$ 个回答，第 $i$ 个回答的 baseline 用其他 $K-1$ 个回答的平均 reward：

$$
A_i = r_i -
\frac{1}{K-1}
\sum_{j \ne i}
r_j
$$

RLOO 属于 REINFORCE-style optimization。相关研究重新审视了大模型 RLHF 场景，认为由于 LLM 有强初始化、环境转移近似确定、reward 通常是 trajectory-level，很多 PPO 组件未必必要；在一些设置里，RLOO 这类更简单的方法可以优于 PPO、DPO 和 RAFT。([arXiv][15])

ReMax 同样基于 REINFORCE，并利用 LLM RLHF 的三个性质：快速模拟、确定性转移、轨迹级奖励。它不需要 PPO 那样的 value model，报告中指出它减少了显存和训练时间，在 7B 模型对齐中取得了较好效果。([arXiv][16])

REINFORCE++ 则试图把 PPO 的若干稳定训练技巧合并进 REINFORCE，同时去掉 critic network，在稳定性、实现复杂度和计算开销之间做折中。([arXiv][17])

DAPO 是 2025 年大规模 LLM RL 复现方向的重要工作。它提出 Decoupled Clip and Dynamic sAmpling Policy Optimization，并开源了基于 verl 的大规模 RL 系统；论文报告用 Qwen2.5-32B base model 在 AIME 2024 上达到 50 分，并总结了 decoupled clipping、dynamic sampling、token-level policy gradient、overlong reward shaping 等关键技巧。([arXiv][18])

PPO 之后的大模型 RL 不是简单走向“无 RL”，而是走向“更适合语言模型的 RL”。这类方法通常保留 on-policy exploration，但尽量去掉昂贵的 critic、复杂的 value fitting 和过多超参数。

---

### 3.6 Outcome Reward、Process Reward 与 Verifier

在 reasoning 场景里，只给最终答案奖励有明显局限。一个数学解答可能最后答案对了，但推理过程有漏洞；也可能中间思路正确，只是最后算术失误。Outcome reward 只能告诉模型“最后对不对”，不能告诉它“哪里对、哪里错”。

Process Reward Model，也就是 PRM，试图在每一步推理上给反馈：

$$
R(y) =
\sum_{t}
r_{\text{step}}(y_{\le t})
$$

OpenAI 的 “Let’s Verify Step by Step” 显示，过程监督在数学推理中可以明显优于只监督最终答案的 outcome supervision，并发布了 PRM800K 这类 step-level human feedback 数据。([arXiv][19])

Verifier 也是这条线的重要组成部分。早在 GSM8K 相关工作里，就已经有“生成多个候选答案，再训练 verifier 选择正确答案”的路线；这类方法在 test-time scaling 中很关键，因为它允许模型通过生成更多候选、搜索更多路径来换取更高准确率。([arXiv][20])

现在的趋势是把 ORM、PRM、verifier、best-of-N、tree search 和 RL 结合起来：训练时用可验证奖励塑造策略，推理时用 verifier 或过程奖励做搜索和重排序。对复杂推理来说，这可能比单纯让模型一次性吐出最终答案更稳。

---

### 3.7 Agent RL：工具、搜索与长程任务

当 LLM 从聊天模型走向 Agent，动作空间就不再只是 token。模型可能需要选择是否搜索、何时调用代码解释器、如何读取文件、如何执行 shell 命令、如何规划多步任务。这时强化学习重新接近传统 RL：模型真的在一个环境里行动，环境真的会返回状态变化和任务结果。

ReTool 把代码解释器纳入 reasoning 过程，用 RL 训练模型何时以及如何调用工具；论文报告它在 AIME 等数学任务上比纯文本 RL 更高效，并出现了代码自动修正等行为。([arXiv][21])

ReSearch 则把搜索操作纳入推理链，训练模型通过强化学习学习何时检索、如何使用搜索结果，并报告这种方式可以在没有监督推理步骤的情况下诱发反思和修正行为。([arXiv][22])

Agent RL 很可能成为后训练的下一条主线。原因很直接：只要任务结果可以被环境验证，比如网页任务是否完成、代码是否通过测试、数据库查询是否正确、长程工作流是否达标，就可以构造 reward。大模型不再只是“回答者”，而是“行动策略”。

---

### 3.8 安全 RL 与多目标约束

大模型强化学习不能只优化 helpfulness。真实系统同时关心有用性、安全性、真实性、隐私、风格、成本、延迟、长度、可解释性等多个目标。把所有目标压成一个标量 reward，经常会产生不可控的 trade-off。

Safe RLHF 的思路是把 helpfulness 和 harmlessness 解耦：训练 reward model 和 cost model，然后用约束优化形式处理安全目标：

$$
\max_\pi \mathbb{E}[r(x,y)]
$$

subject to：

$$
\mathbb{E}[c(x,y)] \le d
$$

再用 Lagrangian 方法动态调整 helpfulness 和 safety 的平衡。([arXiv][23])

这类方法说明，大模型 RL 的未来可能不再是单一 reward maximization，而是 constrained policy optimization：

$$
\max_\pi
\mathbb{E}[R_{\text{helpful}}]
\quad
\text{s.t.}
\quad
C_{\text{safety}} \le \epsilon
$$

从工程角度看，这也更接近真实产品。一个模型不是 reward 分数越高越好，而是在安全边界内尽可能有用。

---

## 四、未来展望：大模型强化学习会往哪里走

### 4.1 从“标量奖励”走向“结构化反馈”

现在很多 RLHF 系统仍然把复杂偏好压成一个标量：

$$
r \in \mathbb{R}
$$

但人类反馈本身不是一维的。一个回答可能事实正确但语气差，逻辑清楚但太长，安全但过度拒答，有创造力但缺乏证据。把这些全压进一个 reward model，会让模型学到混合目标，最后很难解释它到底在优化什么。

未来的奖励会更结构化：

$$
R =
(
R_{\text{correctness}},
R_{\text{helpfulness}},
R_{\text{safety}},
R_{\text{reasoning}},
R_{\text{tool-use}},
R_{\text{style}}
)
$$

训练时再通过约束、加权、分层策略或 Pareto optimization 处理这些目标，而不是简单求和。

PRM、rule-based reward、verifiable reward、cost model、uncertainty-aware reward model 都可以看成这个方向的一部分。OpenAI 的 rule-based rewards for safety 以及 Safe RLHF 都体现了把安全目标从泛化偏好中拆出来的趋势。([OpenAI CDN][24])

---

### 4.2 从 RLHF 到 RLVR：可验证任务会继续扩张

数学和代码是 RLVR 最自然的场景，因为答案可以自动检查。但未来可验证奖励不会只停在数学和代码。

凡是能被程序、工具、规则、环境或外部系统验证的任务，都可能变成 RL 任务。例如：

- 数据分析结果是否和数据库一致；
- 代码补丁是否通过测试；
- 网页 agent 是否完成订单或表单；
- RAG agent 是否引用了正确证据；
- 科学计算是否满足约束；
- 工程设计是否通过仿真；
- 多模态任务是否满足检测器或人类审计规则。

RLVR 的优势在于反馈便宜、可扩展、客观；弱点是奖励通常稀疏，容易只奖励最终答案，而忽略过程质量。近期关于 RLVR 的研究也开始讨论 outcome-based sparse reward 的局限，以及如何引入更细粒度的过程反馈。([arXiv][25])

所以未来的关键不是“有没有 verifiable reward”，而是“能不能把 verifiable reward 设计得足够密、足够稳、足够难被钻空子”。

---

### 4.3 从 offline preference optimization 回到 online learning

DPO、ORPO、SimPO 让偏好优化变得简单，但它们大多依赖固定数据集。固定数据集的问题是：模型只能学习数据里出现过的偏好对，不能主动探索自己当前最容易犯错的区域。

Online RL 的价值在于模型可以边生成、边评估、边更新。Anthropic 早期 HH 工作就探索过 iterated online training，用新反馈持续更新 preference model 和 RL policy；Direct Nash Optimization、online DPO、RLAIF 和 self-play preference optimization 等方向也在尝试让模型通过在线反馈持续改进。([arXiv][26])

未来不会是 offline DPO 和 online RL 二选一，而更可能是混合系统：

$$
\text{SFT warmup}
\rightarrow
\text{offline DPO / SimPO}
\rightarrow
\text{online RLVR / RLAIF}
\rightarrow
\text{hard-case mining}
\rightarrow
\text{new preference data}
$$

离线方法负责稳定和便宜，在线方法负责突破固定数据分布。

---

### 4.4 从“回答对齐”走向“推理与行动对齐”

早期 RLHF 的主要目标是让模型回答更符合人类偏好：更有帮助、更无害、更像助手。现在的 RL 正在转向推理和行动。

Reasoning model 的出现说明，RL 可以改变模型的解题策略，而不只是改变输出风格。DeepSeek-R1 和 OpenAI o1 都强化了一个趋势：训练时 RL compute 和推理时 test-time compute 正在成为新的 scaling axis。([arXiv][13])

Agent RL 则进一步改变问题定义。过去模型只需要输出一段文本；未来模型需要在多轮环境中计划、调用工具、检查结果、修正错误。此时奖励不再只是“回答好不好”，而是“任务有没有完成”。

这会让大模型训练更像传统 RL，也更难。因为 agent 环境通常有长时延、部分可观测、多工具、多失败模式、奖励稀疏、任务分布复杂等问题。现在的 ReTool、ReSearch、L0、Agent RL scaling 等工作只是早期信号。([arXiv][21])

---

### 4.5 从“奖励模型泛化”走向“奖励系统治理”

越强的模型越会优化奖励，也越容易暴露奖励系统的漏洞。Reward hacking 不是一个小 bug，而是强化学习系统的结构性风险：只要代理目标和真实目标之间有缝隙，强优化就会放大这个缝隙。

未来大模型 RL 的核心竞争力不会只在 policy optimizer，也会在 reward system 本身：

$$
\text{Reward Model}
+
\text{Verifier}
+
\text{Rule System}
+
\text{Human Audit}
+
\text{Adversarial Evaluation}
+
\text{Uncertainty Estimation}
$$

奖励模型需要知道自己什么时候不确定；verifier 需要覆盖更多任务；AI feedback 需要被人类校准；安全约束需要可测试；评估集需要持续更新。否则模型会越来越擅长通过旧评估，而不一定真正变得可靠。

因此，“RL 让模型变聪明”这个说法不够准确。更准确的说法是：

> RL 让模型更强地优化给定的反馈系统。反馈系统设计得好，模型会朝正确方向进化；反馈系统有漏洞，模型也会更高效地利用漏洞。

---

## 结尾：大模型强化学习的本质是反馈系统设计

如果把这篇笔记压缩成一句话，可以这样总结：

> 大模型强化学习不是某一个算法，而是一套把人类偏好、AI 反馈、规则约束、可验证结果和环境交互转化为模型行为改进的后训练系统。

PPO-RLHF 是第一条成熟路线，它证明了人类偏好可以改变大模型行为。DPO 让偏好优化变得更简单，降低了工程门槛。RLAIF 让反馈生产开始自动化。RLVR / RLVF 让数学、代码和工具任务拥有可扩展奖励。GRPO、RLOO、ReMax、DAPO、REINFORCE++ 则说明，大模型 RL 正在从传统 PPO 框架里长出更适合语言模型的新优化器。PRM、verifier 和 test-time scaling 进一步把训练和推理连接起来，让模型不仅学会输出答案，也学会搜索、验证和修正。

对这个方向的最终判断是：未来大模型能力的提升，不会只来自更大的预训练模型，也不会只来自更干净的 SFT 数据，而会越来越依赖后训练阶段的反馈设计。能否构造更稳定、更可扩展、更难被钻空子的 reward system，会直接影响 reasoning model 和 agent model 的可靠性。

强化学习在大模型时代的意义，已经不只是“最大化奖励”这五个字。它更像是一层新的接口：把人类意图、任务结果和环境反馈接入模型参数更新。

大模型强化学习值得系统学习，因为它连接了数学、工程、产品、安全和评估，也正在成为后训练技术栈里最重要的一条主线。

[1]: https://arxiv.org/abs/1706.03741 "Deep reinforcement learning from human preferences"
[2]: https://arxiv.org/abs/2305.18290 "Direct Preference Optimization: Your Language Model is Secretly a Reward Model"
[3]: https://arxiv.org/abs/1707.06347 "Proximal Policy Optimization Algorithms"
[4]: https://arxiv.org/abs/2402.03300 "DeepSeekMath: Pushing the Limits of Mathematical ..."
[5]: https://proceedings.mlr.press/v202/gao23h/gao23h.pdf "Scaling Laws for Reward Model Overoptimization"
[6]: https://openai.com/index/instruction-following/ "Aligning language models to follow instructions"
[7]: https://arxiv.org/abs/2310.12036 "A General Theoretical Paradigm to Understand Learning ..."
[8]: https://arxiv.org/abs/2403.07691 "ORPO: Monolithic Preference Optimization without ..."
[9]: https://arxiv.org/abs/2304.05302 "RRHF: Rank Responses to Align Language Models with Human Feedback without tears"
[10]: https://arxiv.org/abs/2212.08073 "Constitutional AI: Harmlessness from AI Feedback"
[11]: https://openreview.net/forum?id=AAxIs3D2ZZ "RLAIF: Scaling Reinforcement Learning from Human ..."
[12]: https://arxiv.org/abs/2310.01377 "UltraFeedback: Boosting Language Models with Scaled AI ..."
[13]: https://arxiv.org/abs/2501.12948 "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs ..."
[14]: https://openai.com/index/learning-to-reason-with-llms/ "Learning to reason with LLMs"
[15]: https://arxiv.org/abs/2402.14740 "Back to Basics: Revisiting REINFORCE Style Optimization ..."
[16]: https://arxiv.org/abs/2310.10505 "ReMax: A Simple, Effective, and Efficient Reinforcement Learning Method for Aligning Large Language Models"
[17]: https://arxiv.org/abs/2501.03262 "REINFORCE++: A Simple and Efficient Approach for Aligning Large Language Models"
[18]: https://arxiv.org/abs/2503.14476 "DAPO: An Open-Source LLM Reinforcement Learning System at Scale"
[19]: https://arxiv.org/abs/2305.20050 "[2305.20050] Let's Verify Step by Step"
[20]: https://arxiv.org/abs/2110.14168 "[2110.14168] Training Verifiers to Solve Math Word Problems"
[21]: https://arxiv.org/abs/2504.11536 "ReTool: Reinforcement Learning for Strategic Tool Use in LLMs"
[22]: https://arxiv.org/abs/2503.19470 "ReSearch: Learning to Reason with Search for LLMs via Reinforcement Learning"
[23]: https://arxiv.org/abs/2310.12773 "Safe RLHF: Safe Reinforcement Learning from Human Feedback"
[24]: https://cdn.openai.com/rule-based-rewards-for-language-model-safety.pdf "Rule Based Rewards for Language Model Safety"
[25]: https://arxiv.org/abs/2506.14245 "Reinforcement Learning with Verifiable Rewards Implicitly ..."
[26]: https://arxiv.org/abs/2204.05862 "Training a Helpful and Harmless Assistant with Reinforcement Learning from Human Feedback"
