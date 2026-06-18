# EVQ-Cosh: RoPE as a Finite Spectral Budget

RoPE 很容易被当成一个已经定型的组件：选一个 `base`，生成一张 inverse-frequency table，然后把旋转塞进 attention。真正有意思的地方反而藏在这张表里：有限的 rotary channel 到底把频率预算花在了哪里？

EVQ-Cosh 只碰这一层。它不改变 RoPE operator，不引入可学习位置参数，也不宣称替代推理期长度外推技巧；它把 RoPE inverse frequency initialization 写成一个可推导的 allocation rule。

## 1. RoPE 里有两个不同问题

RoPE 通常被描述成一种位置算子：在 attention 的二维通道平面上施加旋转相位，让相对位置信息进入内积。这个描述解释了 operator mechanics，但没有完全回答另一个问题：这些旋转频率为什么按现在这种方式分布？

实际实现里可以把 RoPE 拆成两层：

- **Operator definition:** attention 里如何做旋转。
- **Frequency allocation:** 有限的 rotary frequency pairs 如何分配到不同尺度。

几何 RoPE 使用近似几何级数的 inverse-frequency table，是非常强的默认基线。但它仍然是一个 allocation choice，不是数学上唯一的选择。当 rotary channel 数有限时，frequency allocation 就是光谱预算的分配问题。

EVQ-Cosh 针对第二层：保留旋转算子，只改变 inverse frequencies 的初始化。

## 2. 有限光谱预算视角

令 $\phi \in [0,1]$ 是 log-frequency coordinate，并定义：

$$
\omega(\phi)=b^{-\phi}.
$$

如果一个 head 使用 $K=d_{\mathrm{rot}}/2$ 个 rotary frequency pairs，频率表可以看成由密度 $\rho(\phi)$ 诱导的一组 quantile：

$$
\phi_k = F_\rho^{-1}(u_k), \qquad
\omega_k=b^{-\phi_k}.
$$

几何 RoPE 近似对应 log-frequency 上的均匀密度，也就是 $\rho(\phi)\equiv 1$。EVQ-Cosh 把 $\rho$ 变成显式设计对象：在 channel 数不变的情况下，频率质量可以在高频和低频区域之间重新分配。

这里的直觉是尺度之间存在 capacity mismatch。高频负责局部精细分辨率，低频负责长距离相位分离。上下文长度变长时，低频重叠会成为瓶颈；因此，均匀 log-frequency allocation 未必总是最合适的默认点。

## 3. Broadband Collision Surrogate

EVQ-Cosh 引入一个解析 surrogate 来表达 allocation pressure。对满足 $\int_0^1\rho(\phi)\,d\phi=1$ 的正密度，定义：

$$
\mathcal{C}_{\mathrm{app}}[\rho]
=
\frac{\alpha}{2}\int_0^1 \rho(\phi)^2\,d\phi
+
\frac{\beta}{2}\iint_{[0,1]^2}\rho(\phi)\rho(\psi)\min(\phi,\psi)\,d\phi d\psi.
$$

第一项惩罚过度集中，第二项用 cumulative Green-kernel 结构刻画低频重叠。这个 surrogate 不是大模型训练目标的完整替代品，也不试图解释所有 end-to-end dynamics；它的价值在于足够明确、可求解，并且可以直接映射到初始化。

约束变分解给出：

$$
\rho''(\phi)-\tau^2\rho(\phi)=0,
\qquad
\tau=\sqrt{\beta/\alpha}.
$$

结合边界与归一化条件，可以得到闭式密度族：

$$
\rho_\tau(\phi)
=
\frac{\tau\cosh(\tau(1-\phi))}{\sinh\tau}.
$$

于是 EVQ-Cosh 变成一个由 $\tau$ 控制的一参数 allocation family。

## 4. Closed-Form Inverse-CDF Initialization

$\rho_\tau$ 的 CDF 有闭式形式，因此可以直接做 inverse-CDF sampling：

$$
\phi_k(\tau)
=
1-\frac{1}{\tau}
\operatorname{arcsinh}\left((1-u_k)\sinh\tau\right),
\qquad
u_k=\frac{k+1/2}{K}.
$$

然后把 inverse frequencies 设为：

$$
\omega_k^{\mathrm{EVQ}}=b^{-\phi_k(\tau)}.
$$

最小实现可以写成：

```python
def evq_cosh_inv_freq(K, L, d_eff, base):
    # K: number of frequency pairs = d_rot / 2
    tau = d_eff / math.sqrt(L)
    u = torch.arange(K, dtype=torch.float32).add_(0.5).div_(K)
    phi = 1 - torch.asinh((1 - u) * math.sinh(tau)) / tau
    return base ** (-phi)
```

落地时要区分两个量：$K=d_{\mathrm{rot}}/2$ 来自实际 rotary channel 数，$d_{\mathrm{eff}}$ 是设计里用于 operating rule 的有效维度。压缩 RoPE、partial RoPE 或多查询变体里，这两个量不能混着用。

## 5. Geometric RoPE 是一个极限点

EVQ-Cosh 家族有一个重要极限：

$$
\lim_{\tau\to 0}\phi_k(\tau)=u_k.
$$

也就是说，几何 RoPE 可以看成 EVQ-Cosh 在 $\tau\to 0$ 时的连续极限。两个实际含义很直接：

- EVQ-Cosh 改的是频率分配，不是旋转算子。
- 当 $\tau$ 足够小时，初始化会平滑退回几何分配。

这样一来，几何 RoPE 不再只是一个不可拆的默认表，而是更大 allocation family 里的一个可解释点。

## 6. Operating Rule

一个实用默认值是：

$$
\tau=\frac{d_{\mathrm{eff}}}{\sqrt{L}}.
$$

其中 $L$ 是训练上下文长度，$d_{\mathrm{eff}}$ 是有效 attention head dimension。

这应该被理解成 operating rule，而不是全局最优解。它来自小 $\tau$ transport-scale argument：收益项和 channel-load 项的阶数不同，最终给出关于 $L$ 的平方根依赖。工程上，它的角色是提供一个无需大规模搜索的起点。

## 7. 和长上下文外推方法的关系

EVQ-Cosh 与 YaRN、NTK-aware scaling、LongRoPE 这类推理期方法不在同一层工作：

- YaRN、NTK-aware scaling、LongRoPE 处理 inference-time positional range scaling。
- EVQ-Cosh 设置 training-time frequency allocation initialization。
- 两者可以组合：一个改变初始化基底，另一个改变推理时位置如何映射。

它也不同于 learned-position 策略。EVQ-Cosh 不增加可学习位置参数，不加辅助损失，也不依赖 fine-tuning 时重新学习频率表。

一句话概括：

> EVQ-Cosh 是一个闭式、零辅助参数的 RoPE inverse-frequency initialization rule，用来显式分配有限 rotary channels 的 log-frequency 预算。

## 8. 边界

这个推导依赖前面的解析 surrogate。它能提供结构化直觉，但不能替代端到端训练评测。几个边界必须提前说清楚：

- EVQ-Cosh 不替代所有 inference-time scaling 方法。
- EVQ-Cosh 不保证所有下游任务都有提升。
- $\tau=d_{\mathrm{eff}}/\sqrt{L}$ 是默认 operating point，不是全局最优。
- 频率重分配存在 waterbed trade-off：长距离分离可能改善，局部分辨率预算也会随之移动。
- 对 compressed-rope 架构，需要显式区分 $d_{\mathrm{rot}}$、$K$ 和 $d_{\mathrm{eff}}$。

这类方法最容易被写坏的地方，是把“有解析结构”直接写成“性能一定更强”。更稳妥的说法是：它暴露并约束了一个原本隐式存在的自由度。

## 9. Implementation Focus

在标准 Transformer 代码里，EVQ-Cosh 通常只改 RoPE initialization path：

1. 根据 context length 和 effective dimension 计算 $\tau$。
2. 构造 midpoint quantiles $u_k$。
3. 用 closed-form inverse-CDF 得到 $\phi_k(\tau)$。
4. 设置 inverse frequencies $\omega_k=b^{-\phi_k}$。
5. 保持 rotation、attention、optimizer 和 training loop 不变。

这个改动很小，但检查点要清楚：初始化表、上下文长度、head 维度和 partial-rotary 规则都应该被记录进实验配置，否则后续很难复现实验差异。

## 10. Core Takeaway

RoPE 不只是旋转算子，也包含一张有限频率表。只要 channel 数有限，这张表就天然是一个 spectral-budget allocation 问题。

EVQ-Cosh 做的事很窄：把这个隐式分配问题写成一个解析 density，得到闭式 inverse-CDF，并把它落到 RoPE inverse-frequency initialization。它不负责替代 attention，不负责解决所有长上下文外推，也不负责神奇地提升所有任务。

它的价值在于提供一个清晰分解：

- operator design
- training-time frequency allocation
- inference-time range scaling

EVQ-Cosh 只处理中间层。正因为边界足够窄，它才适合被实现、复现、消融和讨论。

**Keywords**: EVQ-Cosh, RoPE, Transformer, positional encoding, long-context, frequency allocation

**Author**: Misaya Yang
