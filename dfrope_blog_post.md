# Dynamic Frequency RoPE: 长序列Transformer的积分频率调制

## 摘要

本文提出了**Dynamic Frequency RoPE (DF-RoPE)**，这是一种针对长序列Transformer的改进位置编码方法。传统的RoPE（Rotary Position Embedding）在超长序列外推时会遇到两个主要问题：

1. **周期性混叠**（Periodic Aliasing）：有效频率分量重复，导致远距离位置难以区分
2. **高频分量退化**：由于数值精度和分布偏移效应，高频通道变得不可靠

DF-RoPE通过引入**缓慢的、确定性的频率调制**来解决这些问题。核心思想是使用**积分相位公式**，在局部保持标准RoPE行为的同时，注入缓慢的绝对相位分量来消除长距离位置歧义。

## 核心贡献

### 1. 形式化结构性限制

我们证明了一个重要的理论结果：**RoPE旋转族内的精确相对位置不变性必然意味着线性相位**。这意味着任何引入非线性相位的RoPE修改都会打破精确的平移不变性，因此需要被视为受控扰动。

**命题 1**（非线性相位不可行性）：假设相位函数 $\phi_k$ 满足精确相对位置不变性，且不是病态的不连续函数。那么 $\phi_k$ 必须满足Cauchy函数方程，因此：

$$\phi_k(t) \equiv \omega_k t \pmod{2\pi}$$

对于某个常数 $\omega_k$ 和所有 $t \in \mathbb{Z}$。换句话说，$\phi_k(m)$ 在模 $2\pi$ 意义下关于 $m$ 是线性的。

### 2. DF-RoPE方法

我们定义一个缓慢的调制函数 $f: \mathbb{R} \to \mathbb{R}$，均值为1。为了具体性，我们使用正弦调制：

$$f(t) = 1 + \alpha \sin(\omega_{\text{mod}} t)$$

其中 $0 \leq \alpha \ll 1$，$\omega_{\text{mod}}$ 相对于RoPE频率较小。关键创新是将通道相位定义为调制函数的**积分**：

$$\phi_k(m) = \omega_k \int_0^m f(t) \, dt$$

对于正弦调制，积分有闭式解：

$$\phi_k(m) = \omega_k \left[ m - \frac{\alpha}{\omega_{\text{mod}}} (\cos(\omega_{\text{mod}} m) - 1) \right]$$

瞬时角频率为 $\frac{d}{dm}\phi_k(m) = \omega_k f(m)$，因此DF-RoPE可以被解释为用缓慢的乘法因子调制每个基频 $\omega_k$。

### 3. 偏差界限

对于两个位置 $m, n \in \mathbb{Z}$，相位差为：

$$\Delta\phi_k(n, m) = \phi_k(n) - \phi_k(m) = \omega_k \int_m^n f(t) \, dt$$

我们通过以下方式衡量与标准RoPE的偏差：

$$\delta\phi_k(n, m) := \Delta\phi_k(n, m) - \omega_k(n - m)$$

**命题 2**（全局界限）：对于所有整数 $m, n$：

$$|\delta\phi_k(n, m)| \leq 2\beta_k$$

其中 $\beta_k := \frac{\omega_k \alpha}{\omega_{\text{mod}}}$ 是调制指数。

**命题 3**（局部短跨度界限）：设 $L := |n - m|$。如果 $L \ll T_{\text{mod}}$，那么：

$$|\delta\phi_k(n, m)| \leq \omega_k \alpha L + O((\omega_{\text{mod}} L)^2 \beta_k)$$

### 4. 频域解释：DF-RoPE作为频率调制

对于正弦调制，将公式代入旋转公式：

$$\exp(i\phi_k(m)) = \exp(i\omega_k m) \exp(-i\beta_k \cos(\omega_{\text{mod}} m)) \exp(i\beta_k)$$

最后一项是常数相位。剩余因子是经典的**频率调制**（FM）。

使用Bessel函数展开：

$$\exp(-i\beta \cos x) = \sum_{n=-\infty}^{\infty} i^{-n} J_n(\beta) \exp(in x)$$

结合后得到：

$$\exp(i\phi_k(m)) \propto \sum_{n=-\infty}^{\infty} i^{-n} J_n(\beta_k) \exp(i(\omega_k + n\omega_{\text{mod}})m)$$

因此，**DF-RoPE在每个基频 $\omega_k$ 周围创建无限的边带阶梯**。对于小的 $\beta_k$，只有 $n \in \{0, \pm 1\}$ 显著贡献，其中 $J_{\pm 1}(\beta_k) \approx \pm \beta_k / 2$。

### 5. 自适应调制指数控制

调制强度由调制指数 $\beta_k$ 控制。为了保持注意力扰动可控，更直接的方法是参数化和限制 $\beta_k$，而不是全局调整 $\alpha$。

**逐头缩放**：设 $h$ 索引注意力头。给定估计的典型注意力跨度 $L_h$（例如，校准语料库上注意力质量的高百分位距离），定义逐头、逐通道指数：

$$\beta_{k,h} = \text{clip}_{[0, \beta_{\max}]} \left( \frac{\beta_0}{1 + c \omega_k L_h} \right)$$

并设置相应的幅度：

$$\alpha_{k,h} = \beta_{k,h} \frac{\omega_{\text{mod}}}{\omega_k}$$

这确保了全局偏差界限 $|\delta\phi_{k,h}| \leq 2\beta_{k,h} \leq 2\beta_{\max}$ 对每个头和通道成立，同时减少长距离头或高频通道上的调制。

## 实现细节

### 块级评估和稳定递归

直接评估 $\sin(\phi_k(m))$ 和 $\cos(\phi_k(m))$ 对于非常大的 $m$ 可能会导致精度损失。我们推荐块级方案。设 $B$ 为块大小（例如2048）。在每个块的开始，从公式精确计算相位。在块内，使用递归：

```python
phi_k[m + 1] = phi_k[m] + omega_k * f_k[m]
f_k[m] = 1 + alpha_k * sin(omega_mod * m)
```

并通过小角度 $\omega_k f_{k,h}[m]$ 的旋转更新 $(\cos \phi_{k,h}, \sin \phi_{k,h})$。应用补偿求和（例如Kahan）用于相位增量，并定期重新归一化 $(\cos \phi_{k,h}, \sin \phi_{k,h})$ 到单位长度以减轻漂移。

### 复杂度分析

渐近成本保持 $O(Md)$，与标准RoPE相同。开销来自评估缓慢调制和周期性重新归一化。

## 实验协议

我们概述了一组最小实验来验证DF-RoPE：

1. **机制检查**：
   - 边带的频谱验证
   - 数值偏移敏感性匹配命题4
   - 长距离相位签名的碰撞率分析

2. **下游任务**：
   - 多深度的密钥/针检索
   - 合成长距离关联回忆
   - 长上下文基准测试（例如LongBench）

3. **基线对比**：标准RoPE、PI、YaRN和LongRoPE

4. **消融研究**：
   - 单频率 vs 多频率调制
   - 调制指数调度
   - 逐头缩放

## 讨论

DF-RoPE以受控的、有界的绝对相位信号换取精确的平移不变性。频域视图阐明了如何在不破坏局部分辨率的情况下注入缓慢结构。

**局限性**：
- 单频调制下的残余周期性
- 需要仔细选择 $\omega_{\text{mod}}$ 和 $\beta$ 调度

**扩展方向**：
- 多频率或弱非周期调制是自然扩展
- 缓慢变化的chirp或低频噪声可以减少严格的周期性

## 结论

我们提出了DF-RoPE，一种积分频率调制的旋转位置嵌入。我们形式化了精确相对不变性需要线性相位的必要性，推导了偏差和偏移敏感性界限，并提供了频域谱解释。DF-RoPE与标准RoPE实现兼容，并允许逐头调制指数控制和稳定的块级评估。

## 参考文献

1. Su, J., Lu, Y., Pan, S., Murtadha, A., Wen, B., & Liu, Y. (2021). *RoFormer: Enhanced Transformer with Rotary Position Embedding*. arXiv:2104.09864.

2. Chen, S., Wong, S., Chen, L., & Tian, Y. (2023). *Extending Context Window of Large Language Models via Positional Interpolation*. arXiv:2306.15595.

3. Peng, B., Quesnelle, J., Fan, H., & Shippole, E. (2023). *YaRN: Efficient Context Window Extension of Large Language Models*. arXiv:2309.00071.

4. Ding, Y., Zhang, L. L., Zhang, C., Xu, Y., Shang, N., Xu, J., Yang, F., & Yang, M. (2024). *LongRoPE: Extending LLM Context Window Beyond 2 Million Tokens*. arXiv:2402.13753.

5. Veisi, A., Fartoot, D., & Amirzadeh, H. (2025). *Context-aware Rotary Position Embedding*. arXiv:2507.23083.

---

**关键词**：Transformer, 位置编码, RoPE, 长序列, 频率调制, 注意力机制

**发布日期**：2026年1月23日

**作者**：AI研究团队
