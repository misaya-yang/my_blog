# Test Infrastructure: WebGL Rose Galaxy Cinematic Upgrade

## 1. Test Philosophy & Framework Architecture

The WebGL Rose Galaxy test infrastructure is strictly **opaque-box, requirement-driven, and mathematically grounded**, derived directly from the authoritative specifications in `ORIGINAL_REQUEST.md` (R1–R4), `docs/galaxy-cinematic-upgrade.md`, and the OpenAI Astra reference shader analysis.

### Principles
1. **Opaque-Box Requirement Verification**: Tests verify observable behavioral and mathematical invariants (optical distribution power laws, decay rates, Euler orientations, hash determinism, contrast ratios, and lifecycle cleanups) rather than private implementation details.
2. **Zero Dummy/Facade Passes**: Every assertion exercises genuine numerical formulas, state machines, and DOM/WebGL contracts. No dummy passing assertions or superficial checks.
3. **Multi-Tier Pyramid**:
   - **Tier 1 — Feature Coverage**: Exhaustive unit-to-component coverage (≥5 test cases per core feature) validating baseline parameters and expected operational envelopes.
   - **Tier 2 — Boundary & Corner Cases**: Stressing system boundaries (degenerate vectors, micro-dt, extreme aspect ratios, DPR clamping, zero wake, reduced motion, context loss).
   - **Tier 3 — Cross-Feature Combinations**: Testing concurrent subsystems (drag during wake, scroll during drag, route navigation during intro reveal, theme toggle during constellation cross-fade).
   - **Tier 4 — Real-World Application Scenarios**: Full user journey simulations through the application's core routes and interaction cycles.

---

## 2. Feature Inventory & Tier Mapping

| Feature ID | Feature Name | Requirement Source | Tier 1 Tests | Tier 2 Tests | Tier 3 Tests | Total Tests |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **F1** | Power-Law Star Brightness (`aBright`) | ORIGINAL_REQUEST §R1 | 5 | 2 | 1 | 8 |
| **F2** | ACES Filmic White-Core Roll-off | ORIGINAL_REQUEST §R1 | 5 | 1 | 1 | 7 |
| **F3** | Diffraction Spikes & Prominence Gate | ORIGINAL_REQUEST §R1 | 5 | 2 | 1 | 8 |
| **F4** | Mip-Pyramid Bloom Pipeline | ORIGINAL_REQUEST §R1 | 5 | 2 | 1 | 8 |
| **F5** | Intro Reveal Timeline & Arc Convergence | ORIGINAL_REQUEST §R1 | 5 | 2 | 2 | 9 |
| **F6** | High-Contrast DayInk Light Mode | ORIGINAL_REQUEST §R1 | 5 | 2 | 2 | 9 |
| **F7** | Optical & Bloom Unit Verification | ORIGINAL_REQUEST §R1 | 5 | 1 | 1 | 7 |
| **F8** | Localized Gaussian Wake Dynamics | ORIGINAL_REQUEST §R2 | 5 | 3 | 2 | 10 |
| **F9** | 3D Trackball Drag Interaction | ORIGINAL_REQUEST §R2 | 5 | 2 | 2 | 9 |
| **F10** | Canonical Home Euler Slerp Restore | ORIGINAL_REQUEST §R2 | 5 | 2 | 2 | 9 |
| **F11** | Scroll Parallax & Camera Dynamics | ORIGINAL_REQUEST §R2 | 5 | 2 | 2 | 9 |
| **F12** | Navigation Intro Scatter Prevention | ORIGINAL_REQUEST §R3 | 5 | 2 | 2 | 9 |
| **F13** | Deterministic Constellation Morphing | ORIGINAL_REQUEST §R3 | 5 | 3 | 2 | 10 |
| **F14** | Text Quiet Zones & WCAG Contrast | ORIGINAL_REQUEST §R3 | 5 | 2 | 2 | 9 |
| **F15** | Responsive Viewport & Reduced Motion | ORIGINAL_REQUEST §R3 | 5 | 3 | 2 | 10 |
| **F16** | GPU Buffer & Geometry Teardown | ORIGINAL_REQUEST §R4 | 5 | 2 | 1 | 8 |
| **F17** | Global Hook & Closure Cleanup | ORIGINAL_REQUEST §R4 | 5 | 1 | 1 | 7 |
| **F18** | Zero-Allocation Render Loop & Reflow Cache | ORIGINAL_REQUEST §R4 | 5 | 2 | 1 | 8 |
| **F19** | WebGL Context Lost/Restored Resilience | ORIGINAL_REQUEST §R4 | 5 | 2 | 2 | 9 |
| **F20** | Automated Test & Typecheck Pass | ORIGINAL_REQUEST §R4 | 5 | 1 | 1 | 7 |
| **Total** | | | **100** | **40** | **31** | **171** |

---

## 3. Test Architecture & Execution

### 3.1 Test Framework & Runner
- **Runner**: Vitest 2.1.9 (`pnpm test` / `vitest run`)
- **Type Checker**: TypeScript 5.9.3 (`pnpm check` / `tsc --noEmit`)
- **Location**: `client/src/test/e2e/`
- **File Layout**:
  - `client/src/test/e2e/harness/testHarness.ts`: Headless DOM/WebGL mock environment, contrast calculator, timing pump, pointer event dispatchers.
  - `client/src/test/e2e/tier1-features/optics.test.ts`: Optical pipeline, power-law distributions, diffraction spikes, bloom pyramid, dayInk.
  - `client/src/test/e2e/tier1-features/wake.test.ts`: Pointer wake footprint, Gaussian brush, mass stratification, decay lifetime, drag suppression.
  - `client/src/test/e2e/tier1-features/trackball.test.ts`: Trackball hyperbolic mapping, coherent rigid drag, coast inertia, home Euler slerp.
  - `client/src/test/e2e/tier1-features/constellation.test.ts`: Deterministic FNV-1a hash, Mulberry32 PRNG, 4 curve families, texture baking, inner heart anchor.
  - `client/src/test/e2e/tier1-features/quietZones.test.ts`: Text quiet zones, `readableArea` mask attenuation, contrast verification ≥4.5:1, scroll parallax.
  - `client/src/test/e2e/tier1-features/lifecycle.test.ts`: GPU buffer disposal, event listener cleanup, window hook teardown, context lost/restored resilience.
  - `client/src/test/e2e/tier2-boundaries/boundaries.test.ts`: Degenerate inputs, empty slugs, zero wake, max velocity capping, extreme viewports, DPR limits.
  - `client/src/test/e2e/tier3-combinations/combinations.test.ts`: Concurrent interactions (drag + wake suppression, scroll + drag, nav + intro, theme + morph).
  - `client/src/test/e2e/tier4-scenarios/scenarios.test.ts`: Full real-world multi-step user scenarios (Scenarios 1–5).

### 3.2 Test Case Format & Semantics
Every test case follows the canonical AAA (Arrange-Act-Assert) pattern:
- **Arrange**: Set up deterministic mathematical fixtures, mock DOM surfaces, or camera parameters.
- **Act**: Execute production functions (`createGalaxy`, `getAmbientProfile`, `RotationMotion`, `PointerWake`, `BloomPyramidPass`, `getScrollMotion`).
- **Assert**: Assert observable outputs against authoritative formulas and requirements from `ORIGINAL_REQUEST.md`.

---

## 4. Real-World Application Scenarios (Tier 4)

- **Scenario 1: Landing Intro & Canonical Settle**
  - Path: `/` (Home)
  - Lifecycle: User opens site on desktop; intro reveal timeline advances over 3.2s from elliptical scatter disc to settled rose; bloom flare activates at $u \in [0.55, 0.95]$; settle confirms canonical Euler orientation $(0.28, -0.50, -0.40)$ without visual snapping.
- **Scenario 2: Article Reader & Quiet-Zone Contrast**
  - Path: `/post/flow`
  - Lifecycle: Navigation to article triggers deterministic FNV-1a hash and Mulberry32 PRNG; rhodonea constellation generates; `readableArea()` attenuates particle density over `.paper-reader-main`; verified text contrast ratio exceeds WCAG AA $\ge 4.5:1$ (dark: 17.27:1, light: 15.03:1).
- **Scenario 3: Reader-to-Archive Navigation & Morphing**
  - Path: `/post/flow` $\to$ `/archive`
  - Lifecycle: User navigates from reading view to timeline archive; constellation smoothly cross-fades via exponential decay ($1 - e^{-5 \cdot dt}$) into `/archive` ambient profile; quiet boxes adapt to `.archive-timeline`; no canvas re-mount or context flash occurs.
- **Scenario 4: DayInk / Night Mode Theme Switching**
  - Path: Multi-route (`/`, `/post/flow`, `/archive`)
  - Lifecycle: Toggle between dark and light themes; dark mode applies ACES Filmic tone mapping and bloom; light mode disables bloom, activates `NormalBlending`, sets paper atmosphere (`#f8fafc`), and renders saturated ink motes with watercolor halos without gray wash-out or white-core erasure.
- **Scenario 5: Mobile Interaction Under Coarse Pointer Constraints**
  - Viewport: $390 \times 844\text{px}$, DPR 1.25, Coarse Pointer
  - Lifecycle: Particle draw range throttled to 2,800 dust and 128 stars ($-42\%$ load); render throttled to 30fps; user performs rapid trackball drag followed by inertial coast; gentle slerp returns galaxy to canonical home pose within 3.5s without jelly distortion.

---

## 5. Quality & Coverage Thresholds

| Metric | Target Floor | Verification Command |
| :--- | :--- | :--- |
| **Test Suites Passing** | 100% (0 failures) | `pnpm test` |
| **TypeScript Compilation** | 0 errors | `pnpm check` |
| **Tier 1 Feature Coverage** | $\ge 5$ tests per feature | Vitest Tier 1 suite |
| **Text Contrast Floor** | $\ge 4.5:1$ (WCAG AA) | Colorimetric assertion in Quiet Zones suite |
| **Canonical Euler Tolerance** | $\Delta \theta < 0.003\text{ rad}$ | Quaternion angle assertion in Trackball suite |
| **Wake Lifetime Cap** | $\le 3.2\text{s}$ | Impulse expiration assertion in Wake suite |
| **Mobile DPR Cap** | $\le 1.25$ | Viewport configuration assertion in Boundaries suite |
