# Flow Matching：从扩散噪声到确定性运输

Flow Matching 最容易被讲成“比 Diffusion 更快的新训练目标”。这个说法有一点道理，但太窄。更关键的转向，是把生成模型从“反向去噪”改写成“分布运输”：先选一条从噪声分布走向数据分布的概率路径，再学习路径上每个位置应该移动的速度场。

换句话说，模型不再只回答“这个 noisy sample 里原图是什么”，而是在回答一个更动力系统的问题：

> 当前点处在生成轨迹的哪个阶段，下一步应该往哪个方向走？

这个视角把很多看似分散的路线统一到同一套连续时间和分布运输框架里：Continuous Normalizing Flow、Probability Flow ODE、Diffusion、Rectified Flow、Optimal Transport、Stochastic Interpolants，甚至离散数据和几何空间上的生成模型。Flow Matching 不只是一个 loss，而是一种重新组织生成建模问题的语言。

## 1. 从去噪到运输

先把图像、音频、视频这些具体模态都放下。生成模型的底层问题可以写得很朴素：从一个简单分布采样噪声，再把它推到数据分布。

$$
p_0(z)=\mathcal{N}(0, I)
$$

$$
p_1(x)=p_{\text{data}}(x)
$$

Flow Matching 把这个过程写成一个时间相关的 ODE：

$$
\frac{dx_t}{dt}=v_t(x_t), \quad x_0 \sim p_0, \quad x_1 \sim p_{\text{data}}
$$

这里的 $v_t(x)$ 是模型要学的 velocity field。只要速度场足够准，从 $t=0$ 积分到 $t=1$，噪声分布就会被推到数据分布。

从密度演化的角度看，这个 ODE 对应连续性方程：

$$
\frac{\partial p_t(x)}{\partial t}+\nabla \cdot \left(p_t(x)v_t(x)\right)=0
$$

这也是 Flow Matching 和普通回归任务的分界。它学到的不是一张图的局部修补函数，而是推动整个概率分布流动的动力系统。

Diffusion 的直觉通常来自随机过程：把数据逐渐破坏成噪声，再学习反向过程。Flow Matching 的直觉来自确定性运输：设计一条概率路径，再学习路径上的速度。两者并不互斥。在 Gaussian path 下，Diffusion 的 probability flow ODE 与 Flow Matching 可以落到同一个连续时间框架里，只是参数化和训练信号不同。

## 2. 核心训练目标：学速度，而不是模拟轨迹

Flow Matching 的训练从一条人为定义的概率路径开始。给定真实样本 $x_1$ 和噪声样本 $x_0$，常见插值形式是：

$$
x_t=\alpha_t x_1+\sigma_t x_0
$$

最简单的线性路径则是：

$$
x_t=(1-t)x_0+t x_1
$$

这条路径的目标速度很直接：

$$
u_t=\frac{dx_t}{dt}=x_1-x_0
$$

训练目标就是速度回归：

$$
\mathcal{L}_{\text{FM}}(\theta)=
\mathbb{E}_{t,x_0,x_1}
\left[
\left\|
v_\theta(x_t,t)-(x_1-x_0)
\right\|^2
\right]
$$

工程上，这一点非常干净。训练时不需要真的求解 ODE，也不需要模拟完整 SDE 轨迹。随机采样一个时间 $t$，构造 $x_t$，让网络预测当前位置的速度即可。

这个公式看起来过于简单，成立的关键在于 marginal velocity。单条 conditional path 的速度由人为构造，但 MSE 下的最优模型会学习所有可能路径经过同一位置时的条件期望。模型没有机械记住每一对噪声和样本之间的直线，而是在学习平均意义上的速度场。

Conditional Flow Matching 把这件事推广成更一般的 CNF 训练目标。它保留了类似 Diffusion 的稳定回归形式，同时让采样天然落到 ODE solver 上。这也是后来 Rectified Flow、OT-CFM 和许多大模型训练 recipe 能接上的原因。

## 3. Rectified Flow：直线只是起点

Rectified Flow 常用的路径可以写成：

$$
x_t=(1-t)z+t x,\quad z \sim \mathcal{N}(0,I),\quad x\sim p_{\text{data}}
$$

目标速度就是：

$$
u_t=x-z
$$

直线路径的吸引力很明显。如果轨迹真的足够直，采样时就不需要很多步。理想情况下，Euler 一步就能给出粗略生成结果：

$$
x_1 \approx x_0+v_\theta(x_0,0)
$$

但这里有个常见误解：训练时的 conditional path 是直线，不等于模型最终学到的 marginal flow 处处都是直线。不同噪声点和数据点的路径会交叠，同一个 $x_t$ 可能来自很多配对，模型学到的是平均速度场。这个平均场可以弯曲，也可能在高密度区域变得复杂。

所以 Rectified Flow 的价值不只是“路径画成直线”。更准确的拆法是：

1. path 决定监督信号的形状。
2. coupling 决定噪声样本和数据样本如何配对。
3. solver 决定推理时要付出多少数值积分成本。

把这三件事拆开，Flow Matching 才不容易被简化成一句“直线插值训练”。

## 4. OT-CFM：配对往往比路径更重要

最朴素的训练会随机采样一个噪声 $z$，再随机采样一个数据点 $x$，把它们配成一对。这个做法简单，但不一定高效。一个噪声点可能被配到距离很远的数据点，目标速度会变大，训练方差也会变高。

Optimal Transport Conditional Flow Matching 的思路是，在 minibatch 内先做更合理的配对，让噪声样本和数据样本之间的运输距离更短、更稳定。这样得到的路径仍可保持简单形式，但监督信号更干净。

这也是 Flow Matching 里容易被低估的工程点。很多讨论只盯着 path，比如是否使用线性插值、是否使用 Gaussian path。实际训练里，coupling 直接影响目标速度的分布、梯度方差和少步采样质量。

不过 OT 也不是万能按钮。条件生成里还要处理文本、类别、视频首帧、语音条件等额外约束。只按几何距离做 minibatch OT，可能让训练时的配对分布和推理时条件分布错开。对文本到图像、类别条件生成和视频生成来说，condition alignment 本身就是 coupling 设计的一部分。

## 5. 它和 Diffusion 的关系

Diffusion 通常从正向加噪过程出发：

$$
dx=f(x,t)dt+g(t)dW_t
$$

模型学习 score：

$$
\nabla_x \log p_t(x)
$$

采样时再通过 reverse SDE 或 probability flow ODE 回到数据分布。Flow Matching 则直接指定 probability path，并学习路径上的 velocity field。

两者的差异不应被讲成“谁完全替代谁”。Diffusion 的 score/SDE 工具链成熟，训练经验和采样器积累很深。Flow Matching 的优势是目标更直接，ODE 采样自然，和直线路径、OT 配对、Transformer backbone 的组合很顺。

更稳妥的表述是：

> Diffusion 用去噪语言描述生成，Flow Matching 用速度场语言描述生成。

当底层框架切到连续时间之后，两种语言经常能互相翻译。真正影响系统表现的，是路径、输出参数化、时间采样、loss weighting、guidance、backbone、数据管线和 solver 的共同设计。

## 6. Stochastic Interpolants：把 flow 和 diffusion 放进同一个框架

Stochastic Interpolants 提供了更大的统一视角。它不只关心一条确定性直线，而是构造更一般的随机插值过程，把两个分布连接起来。

这种插值既可以导出 deterministic probability flow，也可以导出带扩散项的 SDE dynamics。换一个角度看，flows、diffusions、score-based models、Schroedinger bridge 都是在选择不同路径、不同动力学、不同训练信号。

一个简化后的图景是：

$$
\text{Generative Modeling}
=
\text{Path Design}
+
\text{Vector Field or Score Estimation}
+
\text{Numerical Sampling}
$$

这对理解 Flow Matching 很有帮助。它不是孤立 trick，而是连续时间生成模型的一种组织方式。Rectified Flow 强调直线和 reflow，OT-CFM 强调配对，Stochastic Interpolants 强调统一的插值框架，Diffusion 则从随机过程和 score estimation 进入同一片区域。

## 7. 最小训练循环

把细节全部拿掉，Flow Matching 的核心训练代码很短：

```python
# x: data sample, shape [B, C, H, W]
# cond: optional text or class condition

z = torch.randn_like(x)
t = torch.rand(x.shape[0], device=x.device)
t_view = t.view(-1, 1, 1, 1)

# Linear interpolation path.
x_t = (1 - t_view) * z + t_view * x

# Target velocity.
target_v = x - z

# The model predicts velocity at (x_t, t).
pred_v = model(x_t, t, cond)

loss = ((pred_v - target_v) ** 2).mean()
loss.backward()
optimizer.step()
```

采样时从噪声开始积分：

```python
x = torch.randn(shape, device=device)

for i in range(num_steps):
    t = torch.full((batch_size,), i / num_steps, device=device)
    dt = 1.0 / num_steps
    v = model(x, t, cond)
    x = x + dt * v
```

这只是 Euler solver。真实系统会继续叠加 Heun 或 midpoint、timestep schedule、loss weighting、classifier-free guidance、latent autoencoder、DiT 或 MMDiT backbone、caption pipeline 和数据清洗。Flow Matching 的 loss 很简洁，但现代生成模型的成败仍然是系统工程。

Stable Diffusion 3 使用 reweighted Rectified Flow formulation 与 MMDiT backbone，并做了从 450M 到 8B 参数规模的 scaling study。FLUX.1-dev 的模型卡把它描述为 12B rectified flow transformer。Meta Movie Gen 也把 Flow Matching 放进图像、视频和音频生成系统里。这些系统说明，Flow Matching 已经从理论训练目标进入多模态大模型的主训练范式之一。

## 8. 为什么它在 2024 之后变得重要

原因主要有四个。

第一，训练目标足够直接。Velocity regression 比很多 likelihood-based CNF 训练更容易落地，训练时也不必反复求解 ODE。

第二，推理接口清晰。采样就是解 ODE，少步采样优化有明确抓手。对大模型服务来说，NFE 直接对应延迟和成本。

第三，它和 Transformer scaling 贴合。图像、视频、音频生成逐渐从 U-Net 迁移到 DiT、MMDiT 和其他 Transformer backbone。连续时间 velocity prediction 与这些架构的组合很自然。

第四，它是一套可扩展语言。图像 latent、视频 latent、音频、语音、蛋白质结构、几何空间、离散 token，都能在“路径、速度场、采样器”的框架下继续扩展。不同模态不必共享同一个具体公式，但可以共享同一组设计问题。

## 9. 仍在变化的前沿

少步和一步生成是最直接的方向。标准 Flow Matching 学 instantaneous velocity，采样仍需多步积分。后续工作开始研究 average velocity、distillation、consistency 和有限步目标，试图把质量压到 1 到 4 个 NFE 内。

另一个方向是 Transition Matching。它不再把无穷小时间步上的速度场当成唯一目标，而是直接学习更有表达力的 Markov transition kernels。这个方向未必会替代 Flow Matching，但提醒了一个现实问题：如果服务端真正关心有限步采样质量，连续时间速度场不一定是唯一建模方式。

Discrete Flow Matching 则把 flow paradigm 推向语言和离散数据。连续空间里的插值不能原样搬到 token 空间，离散生成需要新的路径、状态转移和训练目标。它是否会挑战自回归语言模型还不好判断，但“非自回归、可并行、迭代 refinement”的离散生成范式值得继续跟。

几何空间上的 Flow Matching 也很有意义。蛋白质、分子、材料和机器人轨迹不是普通欧氏像素数据，往往带有旋转、平移、刚体或流形约束。Riemannian Flow Matching、SE(3) Flow Matching、FoldFlow 等工作把路径设计和等变架构结合起来，让生成过程尊重数据本身的几何结构。

## 10. 不要把它神化

Flow Matching 很强，但不是免费午餐。

ODE 采样仍然有 discretization error。步数太少会伤质量，步数太多会提高成本。路径更直只是在降低这个矛盾，不是在消灭它。

路径和时间采样很敏感。线性路径、Gaussian path、OT path、timestep sampling、loss weighting 都会改变训练稳定性。大系统里看似同一个 Flow Matching objective，背后 recipe 可能完全不同。

条件生成不能只看几何距离。文本条件、类别条件、视频条件会改变“合理配对”的定义。无条件生成里表现很好的 OT 策略，放进条件生成可能会引入偏差。

Guidance 也没有完全定型。Classifier-free guidance 可以迁移到 velocity prediction，但 Flow Matching 还存在通过 source distribution、path 或 solver 侧改造来做 guidance 的空间。

最后，现代生成模型并不会只剩下 Flow Matching。Latent Diffusion、score-based model、consistency model、autoregressive model、transition-based model 都还在发展。更稳妥的判断是：Flow Matching 已经成为多模态生成模型的一条主线，而不是唯一答案。

## 11. 学习路径

学习这条线可以按这个顺序走。

1. 先理解 CNF 和 ODE flow。重点是 $dx/dt=v_t(x)$ 如何推动分布变化，以及连续性方程在说什么。
2. 再理解 Diffusion 的 probability flow ODE。这样才能看清 Diffusion 和 Flow Matching 的翻译关系。
3. 推导 Flow Matching 与 Conditional Flow Matching。重点不是背公式，而是理解 conditional velocity regression 为什么能学到 marginal velocity field。
4. 做一个 2D toy example，比如 two moons 或 8 gaussians。观察随机 coupling、OT coupling、不同 solver 和不同步数对轨迹的影响。
5. 读 Rectified Flow、OT-CFM、Stochastic Interpolants。三者分别对应直线路径、配对优化和统一框架。
6. 最后再读 SD3、FLUX、Movie Gen 这类系统。先有底层理解，再读工程系统，才能区分哪些收益来自 Flow Matching，哪些来自 backbone、数据、caption、latent space 和 scaling recipe。

## 12. 结语

Flow Matching 真正改变的不是一句“更快的 Diffusion”，而是生成模型的表述方式。

以前常见的讲法是：

$$
\text{noise prediction} \rightarrow \text{denoising} \rightarrow \text{sampling}
$$

Flow Matching 把问题改写成：

$$
\text{probability path} \rightarrow \text{velocity field} \rightarrow \text{transport}
$$

这个改写很有价值。它让 CNF、Diffusion、Probability Flow ODE、Rectified Flow、Optimal Transport、Schroedinger Bridge、Stochastic Interpolants、Riemannian Flow 和 Discrete Flow Matching 都能放进“路径、速度场、采样器”的框架里讨论。

对这条路线的判断很简单：Flow Matching 的核心不是“比 Diffusion 快”这么单一，而是把生成模型重新理解为一个可设计、可优化、可扩展的分布运输问题。速度场只是入口，更值得研究的是路径怎么选、样本怎么配、采样怎么做、条件怎么对齐，以及这些选择如何进入真实的多模态系统。

## References

1. Lipman et al., [Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747)
2. Tong et al., [Improving and Generalizing Flow-Based Generative Models with Minibatch Optimal Transport](https://arxiv.org/abs/2302.00482)
3. Liu et al., [Flow Straight and Fast: Learning to Generate and Transfer Data with Rectified Flow](https://arxiv.org/abs/2209.03003)
4. Albergo and Vanden-Eijnden, [Stochastic Interpolants: A Unifying Framework for Flows and Diffusions](https://arxiv.org/abs/2303.08797)
5. Esser et al., [Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206)
6. Black Forest Labs, [FLUX.1-dev model card](https://huggingface.co/black-forest-labs/FLUX.1-dev)
7. Meta, [Movie Gen: A Cast of Media Foundation Models](https://arxiv.org/abs/2410.13720)
8. Gat et al., [Discrete Flow Matching](https://arxiv.org/abs/2407.15595)
9. Chen and Lipman, [Flow Matching on General Geometries](https://arxiv.org/abs/2302.03660)
10. Meta AI, [Flow Matching Guide and Code](https://ai.meta.com/research/publications/flow-matching-guide-and-code/)
