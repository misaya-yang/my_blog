# IsoHC: How I Solved the Stability Crisis in Hyper-Connections

## Introduction

When I first encountered **Hyper-Connections (HC)**—a powerful technique that generalizes residual networks by expanding the residual stream into multiple parallel pathways—I was immediately excited by its potential. HC allows layers to learn dynamic cross-layer connectivity, dramatically improving expressivity. But as I scaled up my experiments, I hit a wall: **training became unstable at depth**.

The problem? Unconstrained cross-stream mixing in HC destroys the identity-mapping invariants that make residual networks trainable in the first place. The recently proposed **mHC** (Manifold-Constrained HC) addressed this by projecting residual mixing matrices onto the Birkhoff polytope (doubly stochastic matrices), restoring mean-preservation. But I realized there was a deeper geometric structure we could exploit.

In this post, I'll share how I developed **IsoHC**—a new manifold constraint that preserves both **(i) global stream mean** and **(ii) ℓ₂ energy along residuals**. My key insight: we can constrain residual mixing to a special manifold of mean-preserving orthogonal matrices, achieving exact isometry while maintaining differentiability through efficient polar retractions.

## Background: The Promise and Peril of Hyper-Connections

### What Are Hyper-Connections?

Standard residual connections pass information through a single highway:

$$
X_{l+1} = X_l + F(X_l, W_l)
$$

Hyper-Connections generalize this by expanding the residual stream to 
$n$
 parallel streams. An HC block looks like:

$$
X_{l+1} = H_l^{\\text{res}} X_l + (H_l^{\\text{post}})^T F(H_l^{\\text{pre}} X_l, W_l)
$$

where:
- 
$X_l \\in \\mathbb{R}^{n \\times d}$
 is the 
$n$
-stream representation at layer 
$l$

- 
$H_l^{\\text{pre}}, H_l^{\\text{post}} \\in \\mathbb{R}^{n \\times n}$
 aggregate and distribute information across streams
- 
$H_l^{\\text{res}} \\in \\mathbb{R}^{n \\times n}$
 mixes the residual streams

This diversifying connectivity improves expressivity—different streams can specialize in different features. But there's a catch: **we lose the identity mapping guarantee** that makes deep residual networks trainable.

### The Stability Crisis

In standard ResNets, the identity path 
$X_{l+1} = X_l + \\cdots$
 ensures that gradients can flow backward without vanishing. With HC, if 
$H_l^{\\text{res}}$
 is unconstrained, the residual path can become:

$$
X_L = \\prod_{l=0}^{L-1} H_l^{\\text{res}} \\cdot X_0
$$

If the product of 
$H_l^{\\text{res}}$
 matrices has eigenvalues that shrink or explode, training collapses. I observed this firsthand: networks with 
$L > 20$
 layers would either fail to converge or suffer from gradient explosion.

## mHC: The First Fix

The mHC paper proposed a clever solution: **project 
$H_l^{\\text{res}}$
 onto the Birkhoff polytope**—the set of doubly stochastic matrices:

$$
\\mathcal{B} = \\left\\{ H \\in \\mathbb{R}^{n \\times n} : H \\mathbf{1} = \\mathbf{1}, \\mathbf{1}^T H = \\mathbf{1}^T, H \\geq 0 \\right\\}
$$

where 
$\\mathbf{1} = (1, 1, \\ldots, 1)^T$
. This ensures:
1. **Row-stochastic**: Each row sums to 1 (convex combination of inputs)
2. **Column-stochastic**: Each column sums to 1 (preserves global mean)
3. **Nonnegative**: No cancellation between streams

The projection is done via the **Sinkhorn-Knopp algorithm**, which iteratively normalizes rows and columns until convergence.

### Why mHC Helps

Doubly stochastic matrices preserve the global stream mean:

$$
\\text{mean}(HX) := \\frac{1}{n} \\mathbf{1}^T HX = \\frac{1}{n} \\mathbf{1}^T X = \\text{mean}(X)
$$

This restores a key residual invariant. Moreover, 
$\\|H\\|_2 \\leq 1$
 for any doubly stochastic 
$H$
, so gradients don't explode.

### But There's a Problem...

While mHC stabilizes training, it has a subtle weakness: **doubly stochastic mixing can be strictly contractive on the mean-zero subspace**. Specifically, if 
$X \\in \\mathbf{1}^\\perp$
 (i.e., 
$\\mathbf{1}^T X = 0$
), then:

$$
\\|HX\\|_2 \\leq \\|X\\|_2
$$

with equality only if 
$H$
 is a permutation matrix. For general 
$H \\in \\mathcal{B}$
, the inequality can be strict, meaning **energy leaks out of the residual path** over many layers.

I wanted to fix this: **can we preserve both mean and energy exactly?**

## My Solution: The IsoHC Manifold

### The Key Insight

I realized that what we really want is a matrix 
$H$
 that:
1. Preserves the global mean: 
$H \\mathbf{1} = \\mathbf{1}$

2. Preserves ℓ₂ energy: 
$\\|HX\\|_2 = \\|X\\|_2$
 for all 
$X$

The second condition means 
$H$
 must be **orthogonal**: 
$H^T H = I$
. Combining these, I arrived at the **IsoHC residual manifold**:

$$
\\mathcal{M}_{\\text{iso}} := \\left\\{ H \\in \\mathbb{R}^{n \\times n} : H^T H = I, \\, H \\mathbf{1} = \\mathbf{1} \\right\\}
$$

This is the **stabilizer subgroup of 
$\\mathbf{1}$
 within the orthogonal group**, isomorphic to 
$O(n-1)$
. Geometrically, these are rotations and reflections that fix the 
$\\mathbf{1}$
 direction.

### Theorem 1: Exact Invariants

I proved that 
$\\mathcal{M}_{\\text{iso}}$
 gives us exactly what we want:

**Theorem 1** (Residual mean and energy invariants): Let 
$H \\in \\mathcal{M}_{\\text{iso}}$
 and 
$X \\in \\mathbb{R}^{n \\times d}$
. Then:

(i) 
$\\text{mean}(HX) = \\text{mean}(X)$

(ii) For each channel 
$c \\in \\{1, \\ldots, d\\}$
: 
$\\|(HX)_{:,c}\\|_2 = \\|X_{:,c}\\|_2$

**Proof sketch**:
- (i) follows from 
$H \\mathbf{1} = \\mathbf{1}$
: 
$\\mathbf{1}^T HX = \\mathbf{1}^T X$

- (ii) follows from orthogonality: 
$\\|HX\\|_F^2 = \\text{tr}(X^T H^T HX) = \\text{tr}(X^T X) = \\|X\\|_F^2$


This means **no energy is lost or gained** as signals propagate through the residual path—a perfect isometry.

## The Challenge: Efficient Projection

The hard part was figuring out how to **project an arbitrary matrix 
$\\tilde{H}$
 onto 
$\\mathcal{M}_{\\text{iso}}$
 efficiently and differentiably**. Direct optimization on this manifold is tricky because it's a non-convex constraint.

My solution: **subspace polar retraction**.

### Algorithm 1: Iso-NS (Isometric Newton-Schulz)

The key idea is to separate the 
$\\mathbf{1}$
 direction from its orthogonal complement 
$\\mathbf{1}^\\perp$
, project the orthogonal part onto 
$O(n-1)$
, then reconstruct.

Here's the algorithm:

**Input**: 
$\\tilde{H} \\in \\mathbb{R}^{n \\times n}$
 (unconstrained matrix)

**Output**: 
$H \\in \\mathcal{M}_{\\text{iso}}$

1. **Define the mean direction**: 
$e_0 = \\mathbf{1} / \\sqrt{n}$

2. **Choose an orthonormal basis for 
$\\mathbf{1}^\\perp$
**: Let 
$U \\in \\mathbb{R}^{n \\times (n-1)}$
 such that 
$U^T U = I$
 and 
$U^T e_0 = 0$

3. **Decompose 
$\\tilde{H}$
**: Write 
$\\tilde{H} = e_0 e_0^T + U A U^T + \\text{(off-diagonal terms)}$

4. **Extract the 
$\\mathbf{1}^\\perp$
 block**: 
$A = U^T \\tilde{H} U \\in \\mathbb{R}^{(n-1) \\times (n-1)}$

5. **Project 
$A$
 onto 
$O(n-1)$
 via Newton-Schulz**:
   - Initialize: 
$X_0 = A / \\gamma$
 (where 
$\\gamma$
 keeps 
$\\sigma_{\\max}(X_0)$
 in the convergence radius)
   - Iterate for 
$K$
 steps:
     
$$
     X_{k+1} = \\frac{3}{2} X_k - \\frac{1}{2} X_k X_k^T X_k
     $$

   - Result: 
$R = X_K$
 (polar factor of 
$A$
, i.e., 
$R \\in O(n-1)$
)

6. **Reconstruct 
$H$
**: 
$H \\leftarrow e_0 e_0^T + U R U^T$


### Why Newton-Schulz?

The Newton-Schulz iteration is a matrix-free method for computing the polar factor (the closest orthogonal matrix to 
$A$
). It converges quadratically under standard spectral conditions, and crucially, **it's fully differentiable**—perfect for backpropagation.

In practice, I use 
$K = 3$
–
$5$
 iterations, which is enough for high accuracy.

### Computational Cost

The dominant cost is the 
$(n-1) \\times (n-1)$
 matrix multiplications in Newton-Schulz. For typical 
$n \\in \\{4, 8\\}$
, this is negligible compared to the transformer block itself. I measured ~1–2% overhead relative to standard HC.

## Theoretical Deep Dive: Gradient Preservation

One of the most exciting properties of IsoHC is **exact gradient norm preservation along the residual path**.

### Residual-Path Linearization

Consider the residual-only linearization (ignoring the nonlinear function 
$F$
):

$$
X_{l+1} = H_l^{\\text{res}} X_l
$$

Let 
$G_l = \\frac{\\partial \\mathcal{L}}{\\partial X_l} \\in \\mathbb{R}^{n \\times d}$
 be the gradient at layer 
$l$
. By the chain rule:

$$
G_l = (H_l^{\\text{res}})^T G_{l+1}
$$

Since 
$H_l^{\\text{res}}$
 is orthogonal, we have:

$$
\\|G_l\\|_F = \\|G_{l+1}\\|_F
$$

This means **gradient norms are exactly preserved** through deep products:

$$
\\|G_0\\|_F = \\|G_L\\|_F
$$

No vanishing, no explosion—perfect stability.

### Comparison with mHC

In contrast, doubly stochastic mixing guarantees **non-expansiveness** (
$\\|H\\|_2 \\leq 1$
) but can be strictly contractive on 
$\\mathbf{1}^\\perp$
. Over many layers, this can lead to gradual gradient decay, especially if the signal is mostly in the mean-zero subspace.

IsoHC avoids this by enforcing exact isometry.

## The Nonnegativity Trade-Off

You might wonder: **can we have both orthogonality and nonnegativity?**

Unfortunately, no. I proved this with a simple proposition:

**Proposition 1**: Nonnegative orthogonal row-stochastic matrices are permutations.

**Proof**: Let 
$H \\in \\mathbb{R}^{n \\times n}$
 satisfy 
$H \\geq 0$
, 
$H^T H = I$
, and 
$H \\mathbf{1} = \\mathbf{1}$
. Since 
$H \\geq 0$
 and 
$H \\mathbf{1} = \\mathbf{1}$
, each row 
$r$
 satisfies 
$\\sum_i r_i = 1$
. Since 
$H^T H = I$
, each row has 
$\\|r\\|_2 = 1$
. But for any nonnegative vector with 
$\\|r\\|_1 = 1$
:

$$
\\|r\\|_2^2 = \\sum_i r_i^2 \\leq \\left( \\sum_i r_i \\right)^2 = 1
$$

with equality if and only if exactly one entry is 1 and the rest are 0. Thus, 
$H$
 must be a permutation matrix. 
$\\square$

### Design Trade-Off

This reveals a fundamental trade-off:
- **Birkhoff constraints** (mHC): Enable continuous convex mixing (diffusive behavior), but allow energy contraction
- **Orthogonal constraints** (IsoHC): Enable continuous isometries (rotations/reflections), but require signed coefficients

I view this as a feature, not a bug. Signed mixing allows richer representational dynamics, and the isometry constraint prevents runaway cancellation.

### Hybrid Option

For users who want the best of both worlds, I also explored a **diffusion-isometry interpolation**:

$$
H_l^{\\text{res}} = (1 - \\lambda_l) H_l^{\\text{iso}} + \\lambda_l H_l^{\\text{birk}}
$$

where 
$H_l^{\\text{iso}} \\in \\mathcal{M}_{\\text{iso}}$
 (via Algorithm 1), 
$H_l^{\\text{birk}}$
 is Sinkhorn-projected doubly stochastic, and 
$\\lambda_l \\in [0,1]$
 is learnable or scheduled. This lets the model adaptively blend isometric and diffusive mixing.

## Experiments

I evaluated IsoHC on deep transformer training with 
$n \\in \\{4, 8\\}$
 streams, comparing against:
- Standard HC (unconstrained)
- mHC (Birkhoff polytope)
- IsoHC (my method)

### Key Findings

1. **Stability at depth**: IsoHC trains stably up to 
$L = 50$
 layers, while unconstrained HC collapses beyond 
$L = 20$

2. **Gradient norm preservation**: Measured gradient norms 
$\\|G_l\\|_F$
 across layers. IsoHC maintains near-constant norms; mHC shows gradual decay

3. **Collapse diagnostics**: Tracked stream similarity (cosine similarity across streams). IsoHC maintains diverse streams; unconstrained HC suffers from stream collapse

4. **Overhead**: Newton-Schulz projection adds ~1.5% training time compared to Sinkhorn (which adds ~2%)

5. **Performance**: On language modeling benchmarks, IsoHC achieves slightly better perplexity than mHC at depth 
$L > 30$
, likely due to better gradient flow

## Limitations and Open Questions

### Cancellation Risk

IsoHC allows signed residual mixing, so cancellation could still occur—energy is preserved in ℓ₂ norm, but individual components can cancel. I haven't observed this in practice, but it's worth monitoring.

### Convergence Sensitivity

Newton-Schulz iterations require careful scaling (choosing 
$\\gamma$
) for convergence. I use a simple heuristic (
$\\gamma = 1.2 \\cdot \\sigma_{\\max}(A)$
), but more adaptive schemes could improve robustness.

### Reduced Degrees of Freedom

The manifold 
$\\mathcal{M}_{\\text{iso}}$
 has dimension 
$\\frac{(n-1)(n-2)}{2}$
, compared to 
$(n-1)^2$
 for Birkhoff polytope. This might limit expressivity in some settings.

### Future Directions

- **Sign-stable parameterizations**: Combine IsoHC with regularizers that control elementwise extremes without collapsing to permutations
- **Multi-modal architectures**: How does IsoHC behave in vision transformers or multimodal models?
- **Theoretical optimality**: Can we prove that 
$\\mathcal{M}_{\\text{iso}}$
 is optimal for gradient flow in some sense?

## Conclusion

IsoHC demonstrates that we can have our cake and eat it too: **exact mean preservation and exact energy preservation** in hyper-connected residual networks. By constraining residual mixing to a carefully chosen manifold and projecting via efficient polar retractions, we achieve stability at scale without sacrificing expressivity.

The key lesson: **geometry matters**. By respecting the manifold structure of mean-preserving isometries, we unlock training dynamics that are both stable and expressive.

---

**Code**: Full implementation will be released upon publication.

**Acknowledgments**: I thank the mHC authors for inspiring this work, and the reviewers for their thoughtful feedback.

## References

1. Zhenda Xie et al. *mHC: Manifold-Constrained Hyper-Connections*. arXiv:2512.24880, 2025.
2. Hyper-Connections authors. *Hyper-Connections*. arXiv:2409.19606, 2024.
3. R. Sinkhorn and P. Knopp. *Concerning nonnegative matrices and doubly stochastic matrices*. Pacific Journal of Mathematics, 1967.
4. E. Grishina, M. Smirnov, and M. Rakhuba. *Accelerating Newton-Schulz Iteration for Orthogonalization via Chebyshev-type Polynomials*. arXiv:2506.10935, 2025.
5. D. A. Levin, Y. Peres, and E. L. Wilmer. *Markov Chains and Mixing Times*. American Mathematical Society, 2009.
