我写 IsoHC 的时候，真正困扰我的不是“能不能再设计一个残差混合矩阵”。这个问题太容易给出一个看起来漂亮的答案。真正麻烦的是：如果把一个残差流拆成多条 stream，再让它们在每一层互相混合，什么量应该被完整保留下来？

标准残差网络有一条很朴素的生命线：

$$
x_{l+1}=x_l+F(x_l,\theta_l).
$$

无论 $F$ 多复杂，$x_l$ 至少有一条 identity path 穿过深度。很多深层网络的稳定性，都在某种程度上依赖这条路径。Hyper-Connection 这类多 stream 结构把残差流展开成矩阵：

$$
X_l\in\mathbb{R}^{n\times d},
$$

其中 $n$ 是 stream 数，$d$ 是每条 stream 的 hidden dimension。此时一个简化的 residual transport 可以写成：

$$
X_{l+1}=H_l^{\mathrm{res}}X_l+\mathcal{A}_l(X_l),
$$

问题也随之出现：$H_l^{\mathrm{res}}$ 不是 identity，而是每层都会变的混合矩阵。单层看起来很温和的混合，乘过几十层、几百层之后，可能把某些方向悄悄放大，也可能把有用差异磨平。

IsoHC 试图回答的是一个很窄的问题：

> 多 stream 残差混合能不能既允许 stream 之间互动，又不要破坏残差网络最该保留的几何量？

这篇笔记只讲机制和数学边界，不把它写成“万能稳定性方案”。

## 1. Motivation

直觉可以从两个极端开始。

如果所有 stream 只是简单平均，模型会很稳定，但 expressivity 会受限；如果所有 stream 都可以自由线性混合，模型会更灵活，但深度方向的谱行为会变得难以控制。

于是问题变成：混合矩阵 $H$ 至少应该满足什么？

一个自然答案是保留 stream mean。令 $\mathbf{1}$ 表示全 1 向量，stream mean 是：

$$
\bar{x}
=\frac{1}{n}\mathbf{1}^{\top}X.
$$

如果 $H\mathbf{1}=\mathbf{1}$ 且 $\mathbf{1}^{\top}H=\mathbf{1}^{\top}$，那么平均 stream 不会漂移。这就是 doubly stochastic 约束带来的直觉安全感。

但这个答案还不够。因为 mean 只是一个方向，真正承载差异的是 mean-zero subspace：

$$
\left\{v\in\mathbb{R}^{n}:\mathbf{1}^{\top}v=0\right\}.
$$

如果这个子空间里的能量被反复压缩，多个 stream 会越来越像；如果被反复放大，深度方向又会变得尖锐。只保留均值，还不足以说明残差流的几何没有被改坏。

## 2. From Mean Preservation to Isometry

IsoHC 的约束是：

$$
\mathcal{M}_{\mathrm{iso}}
=
\{H\in\mathbb{R}^{n\times n}: H^\top H=I,\ H\mathbf{1}=\mathbf{1}\}.
$$

这句话很短，但信息量很大。

- $H^\top H=I$：混合矩阵是正交的，不改变欧氏长度。
- $H\mathbf{1}=\mathbf{1}$：全 1 方向是 fixed vector，stream mean 不被移动。

换一个更几何的说法：IsoHC 不碰 mean direction，只在 mean-zero subspace 上做旋转或反射。

这和 doubly stochastic 的气质不同。Doubly stochastic 更像“扩散后仍然保持总量”，IsoHC 更像“换一个坐标角度，但不磨损能量”。这就是它值得单独拿出来看的地方。

## 3. Exact Invariants

令 $H\in\mathcal{M}_{\mathrm{iso}}$，$X\in\mathbb{R}^{n\times d}$。

stream mean 保持不变：

$$
\frac{1}{n}\mathbf{1}^{\top}HX
=
\frac{1}{n}\mathbf{1}^{\top}X.
$$

Frobenius energy 也保持不变：

$$
\|HX\|_F^2
=
\mathrm{tr}(X^\top H^\top HX)
=
\mathrm{tr}(X^\top X)
=
\|X\|_F^2.
$$

所以 IsoHC 同时保留两个量：

```text
mean(HX) = mean(X)
energy(HX) = energy(X)
```

这不是说网络整体永远不放大信号。注意 $\mathcal{A}_l(X_l)$ 仍然会注入 attention、MLP 或其它 block 的输出。IsoHC 只约束 residual transport 这条路径，让它不要在混合 stream 时额外制造不受控的谱变化。

## 4. Fixed-Vector Orthogonal Decomposition

实现上，最方便的做法是把全 1 方向拆出来。

定义：

$$
e_0=\frac{\mathbf{1}}{\sqrt{n}}.
$$

再选一组正交基 $U\in\mathbb{R}^{n\times(n-1)}$ 张成 $e_0$ 的正交补：

$$
U^\top U=I,\qquad U^\top e_0=0.
$$

任何 IsoHC 矩阵都可以写成：

$$
H
=
e_0e_0^\top
+UQU^\top,
\qquad Q\in O(n-1).
$$

这就是固定向量正交分解。$e_0e_0^\top$ 保留平均方向，$UQU^\top$ 在剩下的差异方向上做等距变换。

从工程角度看，这个分解还有一个好处：实现时不需要在完整 $n\times n$ 空间里硬投影“既正交又固定 $\mathbf{1}$”的矩阵，只需要在 $n-1$ 维子空间里参数化或投影 $Q$。

## 5. A Small Mental Model

可以把每个 token 的 residual stream 看成一把扇子。mean direction 是扇子的柄，mean-zero directions 是扇面里各条骨架之间的相对差异。

Doubly stochastic mixing 会保证扇子的中心不跑掉，但扇面可能被慢慢压平。IsoHC 要求更强：中心不跑，扇面长度也不变，只允许旋转。

这个比喻不严谨，但对理解约束很有帮助：

```text
mean preservation: center does not drift
isometry: relative energy does not leak
```

如果关心深层残差路径的稳定性，第二句话往往比第一句话更关键。

## 6. Why Not Just Identity?

一个合理的反问是：如果稳定性这么重要，为什么不直接用 identity transport？

因为多 stream 结构本来就是为了让不同残差路径之间交换信息。完全 identity 最安全，但也最保守。IsoHC 想要的是一个折中：

- 允许 stream 之间发生非平凡混合。
- 不让 residual transport 改变 stream mean。
- 不让 residual transport 改变 residual energy。
- 把不稳定性尽量留给可观测、可初始化、可归因的其它 block。

换句话说，IsoHC 不是在消灭混合，而是在给混合加几何护栏。

## 7. Implementation Mapping

一个概念化实现可以写成：

```python
def project_to_isohc(raw_h, basis_u, e0):
    # raw_h is an unconstrained matrix on the mean-zero subspace
    q = orthogonal_projection(raw_h)
    fixed = e0[:, None] @ e0[None, :]
    residual = basis_u @ q @ basis_u.T
    return fixed + residual
```

真实实现里还要处理几件事：

- `basis_u` 应该稳定构造，避免每次初始化带来不必要差异。
- `orthogonal_projection` 可以通过 QR、Cayley、polar decomposition 或其它方式实现。
- 如果使用混合精度训练，需要注意投影步骤的数值误差。
- 当 $n$ 很小时，约束空间很小；当 $n$ 变大时，投影成本和参数化方式需要重新评估。

更稳妥的理解是：IsoHC 是一个 projection path，而不是一个纯 prompt-level 概念。只要实现里不能稳定地把矩阵送回 $\mathcal{M}_{\mathrm{iso}}$，上面的数学都只是纸面安全。

## 8. Precision and Engineering Considerations

正交约束在数学上干净，在工程里却不总是便宜。

几个容易踩的点：

1. **投影误差。** 有限精度下 $H^\top H$ 不会精确等于 $I$，需要 sanity check。
2. **初始化尺度。** 如果其它分支初始化过大，IsoHC 只能保护 residual transport，不能保护整个 block。
3. **频繁投影成本。** 每一步都做昂贵投影可能不划算，需要权衡参数化和训练效率。
4. **stream 数选择。** $n$ 不是越大越好。stream 越多，混合空间越大，调参和诊断也越复杂。

所以不该把 IsoHC 理解成一个随手替换的 trick。它更适合在已经明确看到 residual stream mixing 稳定性问题时使用。

## 9. Relation to Doubly Stochastic Constraints

Doubly stochastic 约束满足：

$$
H\mathbf{1}=\mathbf{1},\qquad \mathbf{1}^{\top}H=\mathbf{1}^{\top}.
$$

它的优点是直观、非负、像概率转移矩阵，也很容易解释为 stream 之间的加权平均。

但它通常不是 isometry。即使 mean 被保留，mean-zero component 也可能被收缩。长期堆叠后，这种收缩会改变 stream 差异的表达方式。

IsoHC 则放弃非负性，换来正交等距：

| Constraint | Preserves Mean | Preserves Energy | Allows Signed Mixing |
| --- | --- | --- | --- |
| Doubly stochastic | Yes | Not guaranteed | No |
| IsoHC | Yes | Yes | Yes |

这张表也说明了边界：IsoHC 不是“更自然的概率混合”，而是“更硬的几何约束”。

## 10. Evidence Framing

这类方法最容易被写坏的地方，是把稳定性机制写成性能宣言。

公开结论最好放窄：

- IsoHC 是 residual transport 的几何约束。
- 它精确保留 stream mean 和 Frobenius energy。
- 它提供了不同于 doubly stochastic mixing 的稳定性偏置。
- 它不自动证明所有任务上更强。
- 真正的任务收益需要标准化、可复现、跨尺度评测。

这不是谦虚用语，而是工程事实。一个约束可以非常漂亮，但最终仍要面对训练速度、数值误差、任务分布、模型规模和实现成本。

## 11. Core Takeaway

IsoHC 的核心可以压成一句话：

```text
Residual mixing should move information across streams without drifting the stream mean or leaking residual energy.
```

用数学写就是：

$$
H\in\{H:H^\top H=I,\ H\mathbf{1}=\mathbf{1}\}.
$$

它保留一条固定平均方向，同时在剩余子空间里做正交变换。这样，多 stream 残差结构不必退回 identity，也不必接受无约束混合带来的谱风险。

如果把深层网络看成很多层微小几何操作的叠加，IsoHC 想守住的不是某个宏大的故事，而是两个很朴素的量：平均不漂，能量不漏。

**Keywords**: IsoHC, Hyper-Connections, residual mixing, orthogonal projection, Transformer stability, GNN stability
