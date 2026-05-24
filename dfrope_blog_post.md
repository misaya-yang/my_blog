EVQ-Cosh reframes Rotary Position Embedding (RoPE) as a finite spectral-budget problem: frequencies are chosen by initialization, and this choice can be derived from an explicit allocation rule rather than left implicit in defaults. The article keeps to a technical, third-person style and avoids unpublished experimental metrics or training-log details.

## 1. RoPE Frequency Allocation as a Design Variable

RoPE is usually described as a positional operator that applies rotating phase transforms to each attention pair on a fixed set of 2-D channel planes. That description explains the operator mechanics, but it does not fully specify how frequencies are chosen.

A practical RoPE implementation exposes two separable layers:

- **Operator definition**: the rotation mechanism used inside attention.
- **Frequency allocation**: the finite set of rotary frequencies assigned to pairs.

Geometric RoPE uses an approximately geometric inverse-frequency table and is a strong practical baseline. It is however a specific allocation choice, not a mathematical necessity. With finite rotary channels, frequency allocation is the explicit place where a spectral budget is spent.

EVQ-Cosh targets this second layer only: it keeps the RoPE operator unchanged, introduces no learned positional parameters, and changes only the initialization of inverse frequencies.

## 2. Finite Spectral Budget View

Let $\phi \in [0,1]$ be a log-frequency coordinate and define:

$$
\omega(\phi)=b^{-\phi}.
$$

If a head uses $K=d_{\mathrm{rot}}/2$ rotary frequency pairs, the table is represented by quantiles induced by a density $\rho(\phi)$:

$$
\phi_k = F_\rho^{-1}(u_k), \qquad
\omega_k=b^{-\phi_k}.
$$

Geometric RoPE corresponds to approximately uniform density in log-frequency, i.e., $\rho(\phi)\equiv 1$. EVQ-Cosh treats $\rho$ as a design object: with the same number of channels, frequency mass can be redistributed across low and high frequency regions.

The key implication is capacity mismatch across scales. High frequencies carry finer local resolution, while low frequencies are responsible for long-distance phase separation. Under long-context pressure, low-frequency overlap becomes a practical bottleneck, so uniform log-frequency allocation is not always the intended default.

## 3. Broadband Collision Surrogate

EVQ-Cosh introduces an analytic surrogate to express allocation constraints. For a positive density $\rho$ with $\int_0^1\rho(\phi)\,d\phi=1$, define:

$$
\mathcal{C}_{\mathrm{app}}[\rho]
=
\frac{\alpha}{2}\int_0^1 \rho(\phi)^2\,d\phi
+
\frac{\beta}{2}\iint_{[0,1]^2}\rho(\phi)\rho(\psi)\min(\phi,\psi)\,d\phi d\psi.
$$

The first term discourages excessive concentration. The second term captures low-frequency overlap through a cumulative Green-kernel structure. The surrogate is not claimed to equal the full training objective of a large transformer; it is an explicit, tractable replacement that can be mapped directly into initialization.

The constrained variational solution yields:

$$
\rho''(\phi)-\tau^2\rho(\phi)=0,
\qquad
\tau=\sqrt{\beta/\alpha}.
$$

With boundary and normalization constraints, EVQ-Cosh obtains the closed-form family:

$$
\rho_\tau(\phi)
=
\frac{\tau\cosh(\tau(1-\phi))}{\sinh\tau}.
$$

This is a one-parameter allocation family controlled by $\tau$.

## 4. Closed-Form Inverse-CDF Initialization

Because $\rho_\tau$ has a closed-form CDF, inverse-CDF sampling is analytic:

$$
\phi_k(\tau)
=
1-\frac{1}{\tau}
\operatorname{arcsinh}\left((1-u_k)\sinh\tau\right),
\qquad
u_k=\frac{k+1/2}{K}.
$$

EVQ-Cosh then sets inverse frequencies as:

$$
\omega_k^{\mathrm{EVQ}}=b^{-\phi_k(\tau)}.
$$

Minimal implementation template:

```python
def evq_cosh_inv_freq(K, L, d_eff, base):
    # K: number of frequency pairs = d_rot / 2
    tau = d_eff / math.sqrt(L)
    u = torch.arange(K, dtype=torch.float32).add_(0.5).div_(K)
    phi = 1 - torch.asinh((1 - u) * math.sinh(tau)) / tau
    return base ** (-phi)
```

In deployment, this function should use the architecture's effective rotary channel count for $K=d_{\mathrm{rot}}/2$, while the operating dimension is defined by the model design.

## 5. Geometric RoPE as a Continuous Limit

The EVQ-Cosh family has a key limit behavior:

$$
\lim_{\tau\to 0}\phi_k(\tau)=u_k.
$$

Hence geometric RoPE is recovered as the $\tau\to 0$ continuous limit of EVQ-Cosh. Two practical consequences follow:

- EVQ-Cosh changes frequency allocation continuously, not the rotation operator itself.
- For sufficiently small $\tau$, initialization smoothly returns to geometric allocation.

Geometric RoPE therefore becomes a specific point in a broader, interpretable family rather than an unexamined baseline.

## 6. Operating Rule

The practical default is:

$$
\tau=\frac{d_{\mathrm{eff}}}{\sqrt{L}}.
$$

Here $L$ denotes training context length and $d_{\mathrm{eff}}$ denotes effective attention head dimension.

This should be used as an operating rule, not as a universal optimum. It comes from a small-$\tau$ transport-scale argument in which benefit and channel-load terms exhibit different orders, yielding the square-root dependence on $L$. In practice, it provides a strong no-search default.

## 7. Relation to Long-Context Methods

EVQ-Cosh and inference-time scaling methods operate on different stages:

- YaRN, NTK-aware scaling, LongRoPE, and similar methods handle inference-time positional range scaling.
- EVQ-Cosh sets a training-time initialization for frequency allocation.
- They can be combined: one changes the initialization substrate, the other changes how positions are mapped during inference.

EVQ-Cosh is also distinct from learned-position strategies. It adds no learned positional parameters, introduces no extra objective terms, and does not depend on the model learning a new frequency table during fine-tuning.

In short:

> EVQ-Cosh is a closed-form, zero-auxiliary-parameter initialization rule for RoPE inverse frequencies that explicitly allocates finite rotary channels across log-frequency.

## 8. Limits and Boundaries

The derivation is based on the analytic surrogate above, which is informative but not a full replacement for end-to-end training dynamics. Its limits are explicit:

- EVQ-Cosh does not replace all inference-time scaling methods.
- EVQ-Cosh does not guarantee uniform gains across all downstream tasks.
- $\tau=d_{\mathrm{eff}}/\sqrt{L}$ is a default operating point, not a global optimum.
- Frequency reallocation can create a waterbed trade-off: long-range separation may improve while local allocation shifts.
- For compressed-rope architectures, $d_{\mathrm{rot}}$, $K$, and $d_{\mathrm{eff}}$ should be distinguished explicitly.

## 9. Implementation Focus

In standard transformer code, EVQ-Cosh typically changes only the RoPE initialization path:

1. Compute $\tau$ from context length and effective dimension.
2. Build midpoint quantiles $u_k$.
3. Apply closed-form inverse-CDF to get $\phi_k(\tau)$.
4. Set inverse frequencies as $\omega_k=b^{-\phi_k}$.
5. Keep all existing rotation, attention, optimizer, and training code unchanged.

This keeps EVQ-Cosh lightweight, auditable, and easy to integrate into existing long-context baselines.

## 10. Core Takeaway

RoPE is not only a rotation operator; it also includes a finite frequency table. With finite channels, that table becomes a spectrum-budget allocation problem. EVQ-Cosh makes this allocation explicit, derives a closed-form family, and implements it directly via an inverse-CDF initialization.

This yields a useful decomposition:

- operator design,
- training-time frequency allocation,
- inference-time range scaling.

EVQ-Cosh addresses only the middle layer. Its value lies in making an implicit degree of freedom explicit and providing a compact initialization rule with clear structure.

**Keywords**: EVQ-Cosh, RoPE, Transformer, positional encoding, long-context, frequency allocation

**Author**: Misaya Yang
