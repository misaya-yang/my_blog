# Gated FFN: Transformer 里的乘法通道

很多 Transformer 文章会把 FFN 一笔带过：attention 负责 token mixing，FFN 负责 channel mixing。这个说法没错，但太轻了。真正读模型结构时，FFN 往往是参数最多、计算最重、也最容易被误解的一块。

尤其是现代 LLM 里常见的 Gated FFN。它看起来只是把两层 MLP 换成了三组矩阵和一个逐元素乘法，但这个乘法并不是装饰。它改变了 FFN 的函数族：普通 FFN 像“先投影、再激活、再投回”；门控 FFN 更像“先判断哪些通道该开，再决定什么内容通过”。

这篇笔记会沿着数学形式往下走一小段，重点放在门控乘法改变了什么。目标不是背架构名词，而是把下面这个式子看懂：

$$
\mathrm{GatedFFN}(x)
=
W_d\left(\phi(W_gx)\odot W_ux\right).
$$

如果这个式子看懂了，GEGLU、SwiGLU、LLaMA 里的 MLP 结构就不再神秘。

## 1. 普通 FFN 到底在做什么

Transformer block 里的标准 FFN 通常写成：

$$
\mathrm{FFN}(x)=W_2\,\sigma(W_1x+b_1)+b_2.
$$

对一个 token 的 hidden state $x\in\mathbb{R}^{d}$，它先升维到 $d_{\mathrm{ff}}$：

$$
h=\sigma(W_1x+b_1),\qquad h\in\mathbb{R}^{d_{\mathrm{ff}}},
$$

再投回模型维度：

$$
y=W_2h+b_2,\qquad y\in\mathbb{R}^{d}.
$$

这里有一个容易忽略的事实：FFN 是逐 token 独立的。它不会直接看旁边 token。token 之间的信息交换主要发生在 attention；FFN 做的是每个 token 内部的特征变换。

所以一个粗略但有用的分工是：

```text
Attention: which other tokens should I look at?
FFN: after looking, how should this token's representation be reshaped?
```

普通 FFN 的表达能力来自两个东西：升维和非线性。升维给出更多中间通道，激活函数让模型不只是线性变换。

但普通 FFN 有一个结构上的“直通感”：$W_1x$ 生成的中间通道经过激活后，整体被 $W_2$ 混合回去。它没有显式地区分：

```text
哪个通道应该打开？
哪个内容应该通过？
```

门控 FFN 就是在这里切了一刀。

## 2. GLU 的直觉：让一个分支决定另一个分支

Gated Linear Unit 最早在 gated convolutional language modeling 里系统使用。最朴素的 GLU 可以写成：

$$
\mathrm{GLU}(x)= (W_ux+b_u)\odot \sigma(W_gx+b_g).
$$

它有两条分支：

- value branch: $W_ux+b_u$
- gate branch: $\sigma(W_gx+b_g)$

gate branch 的输出在 $[0,1]$ 附近，逐元素乘到 value branch 上。直觉上，它像一个连续门：

```text
value says: I have these features.
gate says: let these features pass, suppress those.
```

这和普通激活函数有细微但重要的区别。普通 FFN 只有一个中间表示 $h=\sigma(W_1x)$。门控结构则把中间层拆成“内容”和“开关”两种角色。

## 3. Transformer 里的门控 FFN

把 GLU 思路放进 Transformer FFN，常见形式是：

$$
\mathrm{GatedFFN}(x)
=
W_d\left(\phi(W_gx)\odot W_ux\right).
$$

其中：

- $W_g$ 是 gate projection。
- $W_u$ 是 up/value projection。
- $W_d$ 是 down projection。
- $\phi$ 可以是 sigmoid、ReLU、GELU、Swish / SiLU。

几种常见变体可以放在一张表里：

| Variant | Gate Function                  | Form                             |
| ------- | ------------------------------ | -------------------------------- |
| GLU     | $\sigma(z)$                    | $\sigma(W_gx)\odot W_ux$         |
| ReGLU   | $\mathrm{ReLU}(z)$             | $\mathrm{ReLU}(W_gx)\odot W_ux$  |
| GEGLU   | $\mathrm{GELU}(z)$             | $\mathrm{GELU}(W_gx)\odot W_ux$  |
| SwiGLU  | $\mathrm{Swish}(z)=z\sigma(z)$ | $\mathrm{Swish}(W_gx)\odot W_ux$ |

Shazeer 的 GLU variants 论文对这些变体做过系统比较，PaLM 和 LLaMA 系列也都采用了 SwiGLU 风格的 FFN。真正值得抓住的不是哪个名字更流行，而是门控乘法让 FFN 多了一种输入依赖的控制机制。

## 4. 参数量为什么没有直接翻倍

普通 FFN 有两组主矩阵：

$$
W_1\in\mathbb{R}^{d_{\mathrm{ff}}\times d},\qquad
W_2\in\mathbb{R}^{d\times d_{\mathrm{ff}}}.
$$

如果 $d_{\mathrm{ff}}=4d$，参数量大约是：

$$
4d^2+4d^2=8d^2.
$$

门控 FFN 有三组矩阵：

$$
W_g,W_u\in\mathbb{R}^{d_{\mathrm{gate}}\times d},\qquad
W_d\in\mathbb{R}^{d\times d_{\mathrm{gate}}}.
$$

参数量大约是：

$$
3dd_{\mathrm{gate}}.
$$

如果想和普通 $4d$ FFN 参数量接近，可以令：

$$
3dd_{\mathrm{gate}}\approx 8d^2
\quad\Rightarrow\quad
d_{\mathrm{gate}}\approx \frac{8}{3}d.
$$

所以很多实现里，SwiGLU 的 hidden dimension 会比普通 FFN 的 $4d$ 小一些。它不是白白多一组矩阵，而是在相近参数预算下，把表达方式从“单分支激活”换成“双分支门控”。

## 5. 往数学底层看：输入依赖的对角算子

把门控 FFN 写得更暴露一点：

$$
g(x)=\phi(W_gx),
\qquad
u(x)=W_ux.
$$

逐元素乘法可以写成对角矩阵：

$$
g(x)\odot u(x)
=
\mathrm{diag}(g(x))\,u(x).
$$

于是：

$$
\mathrm{GatedFFN}(x)
=
W_d\,\mathrm{diag}(\phi(W_gx))\,W_ux.
$$

这就是门控 FFN 最关键的数学视角：

> 它把一个固定线性投影 $W_dW_u$，变成了由输入 $x$ 自己调制的线性算子。

普通线性层是：

$$
y=Ax.
$$

门控 FFN 在局部看更像：

$$
y=A(x)x,
\qquad
A(x)=W_d\,\mathrm{diag}(\phi(W_gx))\,W_u.
$$

矩阵 $A(x)$ 会随着输入变化。不同 token、不同语义状态，会打开不同的中间通道。这个性质是普通 FFN 不显式具备的。

## 6. 乘法到底带来了什么

如果 $\phi$ 在某个区域近似线性，那么：

$$
\phi(W_gx)\odot W_ux
\approx
(W_gx)\odot(W_ux).
$$

第 $i$ 个中间通道是：

$$
((W_gx)_i)((W_ux)_i).
$$

展开来看，它包含输入坐标之间的二阶交互：

$$
\left(\sum_j W_{g,ij}x_j\right)
\left(\sum_k W_{u,ik}x_k\right).
$$

这不是说 Gated FFN 等价于完整二阶网络，但它确实给 FFN 引入了一种便宜的乘法交互。普通 FFN 也有非线性，但门控结构把“选择”和“内容”分成两条可学习投影，再让它们相乘。

这个乘法有三个效果：

1. **Feature selection:** gate 可以压低不该通过的通道。
2. **Conditional computation inside dense FFN:** 每个 token 仍走同一套矩阵，但通道激活模式不同。
3. **Richer interactions:** value branch 和 gate branch 之间形成逐通道乘法耦合。

注意第三点很容易被说玄。它不是让模型突然拥有魔法，而是在参数预算相近时，改变中间层的函数族。

## 7. 为什么 SwiGLU 常见

SwiGLU 使用 Swish / SiLU 作为 gate：

$$
\mathrm{Swish}(z)=z\sigma(z).
$$

它不像 sigmoid 那样只给 $[0,1]$ 的软门，也不像 ReLU 那样硬切负半轴。Swish 的输出可以为负，并且在小负值附近保留平滑梯度。

这带来一种温和的偏置：

- gate 不是硬开关。
- 负值区域不会被完全扔掉。
- 梯度更平滑。
- 乘法分支仍然保留符号信息。

这也是不少现代大模型采用 SwiGLU 的原因之一：实现简单，在许多公开架构和实验设置里也常优于 ReLU/GELU FFN。

## 8. 它和 MoE gate 不是一回事

名字里都有 gate，但 Gated FFN 和 MoE router 不是一类东西。

MoE 的 gate 通常决定 token 分发到哪个 expert：

```text
token -> router -> top-k experts
```

Gated FFN 的 gate 是 dense channel gate：

```text
token -> same FFN matrices -> channel-wise modulation
```

每个 token 仍然走同一套 $W_g,W_u,W_d$，没有专家选择、没有 token dropping、没有负载均衡损失。它更像是在单个 FFN 内部做连续通道调制，而不是在多个专家之间路由。

这个区别很重要。否则很容易把所有“门控”都混成一种概念。

## 9. 一个最小 PyTorch 实现

```python
import torch
import torch.nn as nn
import torch.nn.functional as F


class SwiGLUFFN(nn.Module):
    def __init__(self, d_model: int, hidden_dim: int):
        super().__init__()
        self.w_gate = nn.Linear(d_model, hidden_dim, bias=False)
        self.w_up = nn.Linear(d_model, hidden_dim, bias=False)
        self.w_down = nn.Linear(hidden_dim, d_model, bias=False)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        gate = F.silu(self.w_gate(x))
        value = self.w_up(x)
        return self.w_down(gate * value)
```

对应公式就是：

$$
W_d\left(\mathrm{SiLU}(W_gx)\odot W_ux\right).
$$

实现上最容易忽略的是 hidden_dim。为了和普通 FFN 参数量接近，不能简单照抄 $4d$，否则参数和计算都会增加很多。实际模型还会把 hidden_dim 对齐到某个 `multiple_of`，方便硬件和张量并行。

## 10. 实践里的几个判断

工程上选择 FFN 结构时，几个问题比架构名更重要：

| Question             | Why it matters                                 |
| -------------------- | ---------------------------------------------- |
| 参数预算是否固定？   | Gated FFN 需要调小 hidden_dim 才公平。         |
| 激活分布是否稳定？   | gate 饱和会让部分通道长期关闭或梯度变弱。      |
| 是否使用 bias？      | 很多 LLM FFN 省略 bias，但小模型未必总是最优。 |
| 混合精度是否稳定？   | 乘法分支会放大数值尺度问题。                   |
| 是否需要可解释诊断？ | gate activation 可以作为通道选择信号观察。     |

门控 FFN 很强，但它不是免费的。多一条分支意味着更多矩阵乘、更多激活存储，以及更复杂的初始化/尺度问题。

## 11. 读模型配置时怎么快速识别

看到一个 Transformer MLP，如果它长这样：

```text
gate_proj
up_proj
down_proj
```

大概率就是 Gated FFN / SwiGLU 风格。

如果它长这样：

```text
fc1
fc2
activation
```

更可能是普通 FFN。

从参数形状也能看出来：

```text
普通 FFN:
  W1: d -> 4d
  W2: 4d -> d

Gated FFN:
  W_gate: d -> ~8d/3
  W_up:   d -> ~8d/3
  W_down: ~8d/3 -> d
```

这不是死规则，但足够帮助你读大部分开源模型代码。

## 12. Failure Boundaries

门控 FFN 容易被写成“比普通 FFN 更高级”。更准确的说法是：

> 它在相近参数预算下，给 FFN 增加了输入依赖的通道调制和乘法交互。

它不保证：

- 小数据上一定更好。
- 所有任务上都优于普通 GELU FFN。
- 训练永远更稳定。
- 可以忽略参数量、公平对比和实现细节。

尤其是做 ablation 时，一定要控制参数量和 FLOPs。否则你比较的可能不是“门控是否有效”，而是“更大模型是否有效”。

## 13. Takeaway

普通 FFN 可以理解成：

```text
project up -> activate -> project down
```

Gated FFN 可以理解成：

```text
make content -> make gate -> multiply -> project down
```

更数学一点：

$$
\mathrm{GatedFFN}(x)
=
W_d\,\mathrm{diag}(\phi(W_gx))\,W_ux.
$$

这个形式说明，门控 FFN 不是简单多了一层激活，而是让 token 自己生成一个通道级对角算子，去调制自己的 value projection。

读 Transformer MLP 时，可以先问一句：

> 这里的 FFN 只是一个非线性投影，还是一个输入依赖的通道控制器？

这个问题一问出来，普通 FFN 和 Gated FFN 的差别就清楚了。

## References

- Yann N. Dauphin et al., [Language Modeling with Gated Convolutional Networks](https://arxiv.org/abs/1612.08083), 2017.
- Noam Shazeer, [GLU Variants Improve Transformer](https://arxiv.org/abs/2002.05202), 2020.
- Aakanksha Chowdhery et al., [PaLM: Scaling Language Modeling with Pathways](https://arxiv.org/abs/2204.02311), 2022.
- Hugo Touvron et al., [LLaMA: Open and Efficient Foundation Language Models](https://arxiv.org/abs/2302.13971), 2023.
