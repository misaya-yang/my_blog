IsoHC studies a narrow stability problem in stream-based residual architectures: how to mix multiple residual streams without destroying the invariants that make deep residual networks trainable. The method constrains the residual mixing operator to preserve both the global stream mean and Euclidean energy. This article summarizes the technical mechanism without disclosing unpublished experimental metrics or run-level details.

## 1. Motivation

Residual architectures are stable partly because they keep an identity path through depth:

$$
x_{l+1}=x_l+F(x_l,\theta_l).
$$

Hyper-Connection style models generalize this idea by expanding the residual stream into multiple parallel streams. A simplified residual transport step can be written as:

$$
X_{l+1}=H_l^{\mathrm{res}}X_l+\mathcal{A}_l(X_l),
$$

where $X_l\in\mathbb{R}^{n\times d}$ contains $n$ residual streams and $H_l^{\mathrm{res}}\in\mathbb{R}^{n\times n}$ mixes those streams.

This additional mixing increases expressivity, but it also introduces a new stability risk. If the residual mixing matrices are unconstrained, the product of many such matrices can amplify or contract signals in ways that are not present in a standard identity residual path.

The core question is:

> What constraint on residual stream mixing preserves the useful invariants of residual networks while still allowing nontrivial cross-stream interaction?

## 2. From Mean Preservation to Isometry

A common stabilizing strategy is to constrain stream mixing to preserve the global stream mean. Doubly stochastic matrices provide one route:

$$
H\mathbf{1}=\mathbf{1},
\qquad
\mathbf{1}^{\top}H=\mathbf{1}^{\top}.
$$

This keeps the stream average invariant. However, mean preservation alone does not guarantee that the mean-zero component of the residual signal keeps its energy. A mixing matrix can preserve the mean while still acting diffusively on the complementary subspace.

IsoHC strengthens the constraint by requiring residual transport to be both mean-preserving and orthogonal:

$$
\mathcal{M}_{\mathrm{iso}}
=
\{H\in\mathbb{R}^{n\times n}: H^\top H=I,\ H\mathbf{1}=\mathbf{1}\}.
$$

This is the subgroup of the orthogonal group that fixes the all-ones direction. Equivalently, it is an orthogonal transform on the mean-zero subspace plus an identity action on the mean direction.

## 3. Exact Invariants

Let $H\in\mathcal{M}_{\mathrm{iso}}$ and $X\in\mathbb{R}^{n\times d}$. The stream mean is preserved:

$$
\frac{1}{n}\mathbf{1}^{\top}HX
=
\frac{1}{n}\mathbf{1}^{\top}X.
$$

The residual energy is also preserved:

$$
\|HX\|_F^2
=
\mathrm{tr}(X^\top H^\top HX)
=
\mathrm{tr}(X^\top X)
=
\|X\|_F^2.
$$

Thus IsoHC preserves both the average stream direction and the full Frobenius energy of the stream tensor. This is the main distinction from purely stochastic or diffusive mixing constraints.

## 4. Fixed-Vector Orthogonal Decomposition

The constraint can be implemented by separating the fixed mean direction from its orthogonal complement.

Define:

$$
e_0=\frac{\mathbf{1}}{\sqrt{n}}.
$$

Choose an orthonormal basis $U\in\mathbb{R}^{n\times(n-1)}$ for the complement of $e_0$:

$$
U^\top U=I,
\qquad
U^\top e_0=0.
$$

Any IsoHC mixing matrix can then be represented as:

$$
H=e_0e_0^\top+URU^\top,
$$

where $R\in O(n-1)$ is an orthogonal transform on the mean-zero subspace.

This decomposition makes the constraint practical: instead of projecting a full matrix directly onto a fixed-vector manifold, the implementation projects only the complement block onto an orthogonal group.

## 5. Differentiable Projection

The repository implements an IsoHC projection path in `isohc/projection.py`. Given an unconstrained raw matrix $\widetilde{H}$, the projection proceeds conceptually as follows:

1. Construct the fixed direction $e_0$ and complement basis $U$.
2. Extract the complement block:
   $$
   A=U^\top \widetilde{H}U.
   $$
3. Project $A$ to an orthogonal factor $R$ using a polar retraction.
4. Reconstruct:
   $$
   H=e_0e_0^\top+URU^\top.
   $$

The polar factor can be computed by iterative Newton-Schulz style updates:

$$
X_{k+1}=\frac{1}{2}X_k(3I-X_k^\top X_k).
$$

The code also includes diagnostic and fallback paths so the projection can be monitored during training.

## 6. Gradient Stability Interpretation

Consider residual-only propagation:

$$
X_{l+1}=H_lX_l.
$$

During backpropagation:

$$
G_l=H_l^\top G_{l+1}.
$$

If each $H_l$ is IsoHC-constrained, then:

$$
\|G_l\|_F=\|G_{l+1}\|_F.
$$

The same isometry that preserves forward residual energy also preserves backward gradient energy through the residual transport path. This gives a clean geometric explanation for why the constraint targets both exploding and vanishing modes.

## 7. Implementation Mapping

The `isoHC` repository separates the mechanism into small modules:

- `isohc/projection.py`: fixed-vector orthogonal projection utilities.
- `isohc/layers.py`: residual stream mixing layers.
- `isohc/transformer.py`: Transformer integration.
- `lm/mixing.py`: language-model mixing ablations.
- `gnn/projection.py` and `gnn/models.py`: graph-neural-network variants.

The implementation tracks two central diagnostics:

$$
\|H^\top H-I\|_F
$$

and:

$$
\|H\mathbf{1}-\mathbf{1}\|_2.
$$

These diagnostics directly correspond to the two defining constraints.

## 8. Precision and Engineering Considerations

Projection precision is an important engineering detail. The projection operation is numerically more sensitive than ordinary unconstrained matrix multiplication, especially when low-precision arithmetic is used throughout the entire projection path.

A practical implementation should distinguish:

- parameter storage dtype,
- activation dtype,
- projection computation dtype,
- diagnostic computation dtype.

The safest pattern is to keep the projection math in a higher-precision path while allowing the surrounding model to use lower precision where appropriate.

## 9. Relation to Doubly Stochastic Mixing

Doubly stochastic constraints preserve stream means and are naturally non-expansive. IsoHC chooses a different trade-off:

- It removes the nonnegativity requirement.
- It keeps exact orthogonality.
- It preserves energy on the mean-zero subspace.
- It allows signed rotations and reflections rather than only convex averaging.

This is useful when diffusion is not desired. For very deep residual stacks, repeated non-expansive averaging can collapse stream diversity, while isometric mixing preserves the norm of the complementary components.

## 10. Evidence Framing

The repository evaluates IsoHC through projection sanity checks, residual-only propagation probes, Transformer smoke tests, real-text diagnostics, and GNN variants. The public technical conclusion should be framed carefully:

- IsoHC is a stability mechanism, not a standalone claim of universal task superiority.
- The strongest claim is geometric: the constraint exactly preserves mean and energy by construction.
- Empirical artifacts support the stability story, but broader downstream claims require larger and more standardized evaluation.
- GNN results should be interpreted jointly with architecture choices such as stream embeddings, readout design, and message-branch handling.

## 11. Core Takeaway

IsoHC replaces a diffusion-style residual mixing constraint with a fixed-vector isometric constraint:

$$
H^\top H=I,
\qquad
H\mathbf{1}=\mathbf{1}.
$$

This preserves the global stream mean and residual energy simultaneously. The method is compact, auditable, and directly implementable via a complement-space polar projection.

The main contribution is not another generic residual block. It is a geometric stabilization rule for stream-based residual transport: keep the mean direction fixed, rotate the residual complement isometrically, and monitor the constraints explicitly during training.

**Keywords**: IsoHC, Hyper-Connections, residual mixing, orthogonal projection, Transformer stability, GNN stability

**Author**: Misaya Yang
