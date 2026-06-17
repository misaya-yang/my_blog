# Dynamic Frequency RoPE: Notes on Long-Sequence Position Encoding

## Introduction

Long-context Transformers put pressure on a simple question: how much positional signal can RoPE preserve when inference length moves far beyond the range used during training?

This note sketches **Dynamic Frequency RoPE (DF-RoPE)** as one possible design: a slow deterministic frequency modulation that keeps local RoPE behavior close to linear phase while adding a small amount of long-range phase variation.

## The Problem: Why RoPE Struggles with Long Sequences

RoPE encodes position by rotating token representations in a high-dimensional space. For position $m$ and frequency $\\omega_k$, the phase is:

$$
\\phi_k(m) = \\omega_k m \\pmod{2\\pi}
$$

This is well behaved inside the range where the model was trained. At much longer lengths, two issues become more visible:

### 1. Periodic Aliasing

Since the phase wraps around every $2\\pi$, positions can become hard to distinguish when a channel has wrapped many times. For some $k$ and position pairs:

$$
\\Delta \\phi_k(n,m) \\equiv \\phi_k(n) - \\phi_k(m) \\pmod{2\\pi}
$$

That can weaken long-range discrimination in channels that otherwise encode precise local offsets.

### 2. High-Frequency Degradation

By construction, higher-frequency components $\\omega_k$ satisfy local relative position behavior more tightly, but they also wrap faster. As sequence length grows, those channels can become less useful for long-range offsets.

## Dynamic Frequency RoPE

The design starts from a small observation: exact relative position invariance implies linear phase. A slow controlled deviation from that phase can preserve local behavior while adding a source of long-range disambiguation.

### The Core Idea: Integral Frequency Modulation

Instead of using a fixed frequency $\\omega_k$, use a slowly drifting frequency $\\omega_k(t)$. The phase becomes:

$$
\\phi_k(m) = \\int_0^m \\omega_k(t) \\, dt
$$

One simple modulation is sinusoidal:

$$
f(t) = 1 + \\alpha \\sin(\\omega_{\\text{mod}} t)
$$

where $0 < \\alpha \\ll 1$ and $\\omega_{\\text{mod}}$ is much smaller than the base RoPE frequencies. This gives:

$$
\\phi_k(m) = \\omega_k \\int_0^m f(t) \\, dt = \\omega_k \\left[ m - \\frac{\\alpha}{\\omega_{\\text{mod}}} \\cos(\\omega_{\\text{mod}} m) + \\frac{\\alpha}{\\omega_{\\text{mod}}} \\right]
$$

### Why This Works

Locally, when $\\omega_{\\text{mod}} m$ changes slowly, the phase remains close to standard RoPE:

$$
\\Delta \\phi_k(n,m) \\approx \\omega_k (n - m)
$$

Globally, the accumulated phase drift breaks exact periodicity. The relative phase difference becomes:

$$
\\Delta \\phi_k(n,m) = \\omega_k \\left[ (n-m) - \\frac{\\alpha}{\\omega_{\\text{mod}}} (\\cos(\\omega_{\\text{mod}} n) - \\cos(\\omega_{\\text{mod}} m)) \\right]
$$

The second term is the **modulation-induced perturbation**. It is bounded by $2\\alpha \\omega_k / \\omega_{\\text{mod}}$ and can separate positions that would otherwise share the same wrapped phase.

## Theoretical Guarantees

The basic perturbation bound is:

**Theorem (Modulation Perturbation Bound)**: For all positions
$n, m$
:

$$
\\left| \\Delta \\phi_k(n,m) - \\omega_k(n-m) \\right| \\leq \\frac{2\\alpha \\omega_k}{\\omega_{\\text{mod}}}
$$

This gives a tuning constraint: keep $\\alpha$ small enough to avoid damaging local offsets, while making $\\alpha \\omega_k / \\omega_{\\text{mod}}$ large enough to matter at long distances.

### Translation Invariance Perturbation

The analysis also measures how much DF-RoPE violates translation invariance (a key property of standard RoPE). For a shift
$\\tau$
:

$$
\\left| \\Delta \\phi_k(n+\\tau, m+\\tau) - \\Delta \\phi_k(n,m) \\right| \\leq \\frac{4\\alpha \\omega_k}{\\omega_{\\text{mod}}} \\left| \\sin\\left(\\frac{\\omega_{\\text{mod}} \\tau}{2}\\right) \\right|
$$

This bound shows that the perturbation grows with
$\\tau$
, but slowly, which is exactly the desired behavior for injecting absolute positional information without destroying local structure.

## Frequency-Domain Perspective

DF-RoPE can also be analyzed through the lens of **frequency modulation (FM)**. In signal processing, FM with a sinusoidal carrier produces sidebands described by Bessel functions:

$$
e^{i \\beta \\sin(\\omega_{\\text{mod}} t)} = \\sum_{n=-\\infty}^{\\infty} J_n(\\beta) e^{i n \\omega_{\\text{mod}} t}
$$

where
$\\beta = \\alpha \\omega_k / \\omega_{\\text{mod}}$
is the **modulation index**. For small
$\\beta$
, the spectrum is dominated by the carrier and first-order sidebands:

$$
J_0(\\beta) \\approx 1, \\quad J_{\\pm 1}(\\beta) \\approx \\pm \\frac{\\beta}{2}
$$

This means DF-RoPE effectively spreads each RoPE frequency
$\\omega_k$
into a narrow band around
$\\omega_k \\pm \\omega_{\\text{mod}}$
, enriching the spectral diversity without creating high-frequency noise.

### Multi-Frequency Extension

Motivated by this FM perspective, DF-RoPE can also use **multiple modulation frequencies**:

$$
f(t) = 1 + \\sum_{j=1}^{J} \\alpha_j \\sin(\\omega_j t)
$$

This creates a richer phase landscape, further reducing aliasing while maintaining computational efficiency.

## Adaptive Modulation Index Control

One practical challenge is choosing the right modulation strength for each attention head. Different heads specialize in different ranges: some focus on local context, while others handle long-range dependencies. DF-RoPE addresses this with a **per-head modulation index control** scheme:

For head
$h$
with base frequencies
$\\{\\omega_k^{(h)}\\}$
, compute:

$$
\\beta_h = \\frac{\\alpha \\cdot \\text{median}(\\{\\omega_k^{(h)}\\})}{\\omega_{\\text{mod}}}
$$

Then scale
$\\alpha_h$
to keep
$\\beta_h$
within a target range (e.g., 0.1-0.5). This ensures that:

- Low-frequency heads (long-range) get stronger modulation
- High-frequency heads (local) get weaker modulation

## Implementation Details

The implementation uses two key optimizations:

### 1. Block-Level Evaluation

Instead of computing
$\\int_0^m f(t) dt$
from scratch for every position, precompute it in blocks:

```python
def compute_phase_blocks(m_max, omega_k, alpha, omega_mod, block_size=1024):
    phases = []
    for block_start in range(0, m_max, block_size):
        block_end = min(block_start + block_size, m_max)
        t = np.arange(block_start, block_end)
        integral = t - (alpha / omega_mod) * (np.cos(omega_mod * t) - 1)
        phases.append(omega_k * integral)
    return np.concatenate(phases)
```

### 2. Stable Recursive Computation

For online inference, use a numerically stable recursive formula:

$$
\\phi_k(m+1) = \\phi_k(m) + \\omega_k f(m)
$$

with periodic renormalization to prevent floating-point drift.

## Evaluation Protocol

The method should be evaluated on long-sequence language modeling tasks against:

- Standard RoPE
- Position Interpolation (PI)
- YaRN
- LongRoPE

Useful checks include:

- Perplexity at multiple extrapolation lengths.
- Local attention pattern drift relative to standard RoPE.
- Long-range retrieval or needle-style probes.
- Runtime and memory overhead from phase modulation.

## Discussion and Future Work

### Why DF-RoPE Works

The success of DF-RoPE comes from a simple principle: **perfect translation invariance is not required to model sequences**. A controlled, slow-varying phase drift yields:

1. **Local fidelity**: Nearby positions still have nearly-linear phase relationships
2. **Global disambiguation**: Far-apart positions accumulate enough phase difference to be distinguishable
3. **Spectral richness**: FM sidebands provide additional frequency diversity

### Limitations and Open Questions

- **Hyperparameter tuning**: Choosing
  $\\alpha$
  and
  $\\omega_{\\text{mod}}$
  still requires some trial-and-error
- **Multi-modal sequences**: How does DF-RoPE behave with mixed modalities (text + images)?
- **Theoretical optimality**: Is sinusoidal modulation the best choice, or can an optimal
  $f(t)$
  be derived from first principles?

### Connections to Other Work

DF-RoPE shares conceptual similarities with:

- **CARoPE** (Context-Aware RoPE): Both inject context-dependent phase adjustments
- **YaRN** (Yet another RoPE extensioN): Both modify frequency schedules, but YaRN uses static scaling while DF-RoPE uses dynamic modulation
- **LongRoPE**: Both target extrapolation, but LongRoPE focuses on frequency rescaling while DF-RoPE uses FM

## Conclusion

Dynamic Frequency RoPE is a small design sketch: keep the useful local behavior of rotary embeddings, then borrow frequency modulation to add controlled long-range phase variation.

The key takeaway: controlled symmetry breaking is a useful lens for long-context position encoding.

---

**Code and experiments**: Treat this draft as a design note until a full implementation and evaluation table are attached.
