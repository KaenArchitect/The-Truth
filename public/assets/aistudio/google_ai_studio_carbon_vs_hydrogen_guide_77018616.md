# Carbon vs. Hydrogen: Building & Powering "The Truth" in Google AI Studio

Neither model replaces the other—**Gemini 4 Carbon** (launched Oct 28, 2026) and **Gemini 4 Hydrogen** (just launched Nov 12, 2026, adapted directly from Carbon) share the exact same $1\text{M}$-token unified context window and $65{,}536$-token synchronous output ceiling, but they are tuned for opposite ends of the engineering loop.

---

## 1. Head-to-Head: Gemini 4 Carbon vs. Gemini 4 Hydrogen

| Dimension | Gemini 4 Carbon (`gemini-4-carbon`) | Gemini 4 Hydrogen (`gemini-4-hydrogen`) | Winner for "The Truth" |
| :--- | :--- | :--- | :--- |
| **Core Strength** | Maximum frontier reasoning; tests hypotheses across massive repos, hard physics/math, and security audits | High-speed execution, clean front-end UI/layout generation in fewer prompts, and low-token efficiency | **Both (Paired)** |
| **Context & Output** | $1\text{M}$ context / $65{,}536$ sync output (up to $1\text{M}$ background decode) | $1\text{M}$ context / $65{,}536$ sync output (up to $1\text{M}$ background decode) | **Tie** (Zero mid-sentence cutoffs) |
| **Thinking Levels** | Deep sustained reasoning (`low`, `medium`, `high`) | `low`, `medium`, `high` (default), plus **`xhigh`** | **Hydrogen** for tunable speed-to-depth |
| **Free Tier in API / Studio** | Paid tier (intro promo active through Nov 30, 2026) | **Yes — Free tier included** (rate-limited) | **Hydrogen** |
| **Paid API Pricing** | **\$2.00** / $1\text{M}$ in • **\$10.00** / $1\text{M}$ out *(until Nov 30; \$4 / \$20 Dec 1+)* | **\$1.50** / $1\text{M}$ in • **\$7.50** / $1\text{M}$ out *(flat across full $1\text{M}$ window)* | **Hydrogen** ($62.5\%$ cheaper vs. standard Carbon) |
| **Prompt-Injection Defense** | Strong frontier alignment | **$2.3\times$ more resilient** on Gray Swan IPI & $12\times$ fewer tool shortcuts | **Hydrogen** (blocks shill prompt-injection in Challenges) |

---

## 2. Which One Should You Pick?

### A. Inside AI Studio Build Mode (Writing & Refactoring Your Code)
1. **Use Carbon FIRST for the Heavy Architectural Split:**
   * Splitting your $2{,}850$-line `the_truth_thermodynamic_audit.tsx` into 7 modular TypeScript files, wiring Express/Node SSE streaming routes, and locking down Firestore security rules without dropping a single line of your 23 preloaded audits is textbook **Carbon** territory. Take advantage of Carbon's half-off introductory pricing before November 30.
2. **Switch to Hydrogen for Fast UI Polish & Visual Iteration:**
   * Once the multi-file structure is standing, switch the Build Mode dropdown to **Hydrogen**. Google specifically tuned Hydrogen for interactive web layouts, animations, and CSS/SVG polish—it finishes UI edits roughly $2\times$ faster while burning fewer tokens.

### B. Inside Your Live App's Backend (`/api/audit` & `/api/invariant`)
Instead of legacy `gemini-3-flash-preview`, wire **both** Gemini 4 models into your Node.js server routes:
* **Route `/api/audit` & Breakdowns $\rightarrow$ `gemini-4-hydrogen` (`thinking_level: "medium"` or `"high"`):**
  * Streams the 6-invariant scan (`01` $\rightarrow$ `06`) fast so your central reactor sphere animates smoothly, never truncates thanks to its $64\text{K}$ output cap, costs just \$1.50 / \$7.50 per million tokens (or \$0 on the Free tier while testing), and resists indirect prompt injection from poisoned web pages during Google Search grounding.
* **Route `/api/invariant` (`CHALLENGE` mode) $\rightarrow$ `gemini-4-carbon` (or `gemini-4-hydrogen` on `xhigh`):**
  * When a PoS defender or premined-PoW shill tries to out-argue the Cantillon Energy-Arbitrage Law, **Carbon** acts as an unbreakable senior physicist—testing their claim against codebase constants and dismantling category errors without caving.

---

## 3. Step-by-Step Launch Workflow in Google AI Studio

### Step 1: Open Build Mode With Carbon
1. Open **Google AI Studio** and click **Build** in the left sidebar.
2. Select **Web App** (React + Node.js full-stack runtime) and select **Gemini 4 Carbon** for Turn 1 (the initial multi-file split).
3. Click **Add files (`+`)** and attach your full **`the_truth_thermodynamic_audit.tsx`** backup.

### Step 2: Paste the Updated Carbon + Hydrogen Master Prompt
Paste this prompt so Carbon builds the clean multi-file app and wires **Hydrogen + Carbon** into your server-side API routes:

```text
Refactor and wire the attached `the_truth_thermodynamic_audit.tsx` into a production-ready multi-file full-stack React + TypeScript + Node.js application in AI Studio Build mode.

STRICT NON-NEGOTIABLE RULES:
1. DO NOT ABRIDGE, SUMMARIZE, OR ALTER ANY AUDIT TEXT OR RUBRIC RULES: Preserve 100% of `PRELOADED_AUDITS`, `GENIUS_FORENSIC_ESSAYS`, `GRADING_RUBRIC_SPEC`, `PASSED_COHORT_GAINS`, `FAILED_COHORT_GAINS`, and `GEMINI_SYSTEM_PROMPT` verbatim.
2. CLEAN MULTI-FILE ARCHITECTURE:
   - `src/data/rubricSpec.ts` -> Rubric brackets, alias map, and deterministic physics/energy-arbitrage guardrails (`deriveGradeFromTotal`, `enforceEnergyArbitrageLawOnAudit`, `clampSingleInvariantByPhysics`).
   - `src/data/preloadedAudits.ts` -> Complete unabridged `PRELOADED_AUDITS` and `GENIUS_FORENSIC_ESSAYS`.
   - `src/data/gainsCohortData.ts` -> Empirical cohort market return data and trajectories.
   - `src/components/OrbitalNodes.tsx` -> Shared `requestAnimationFrame` wave scheduler, `HarmonicProjectBubble`, and `PinnedOrbitalNode`.
   - `src/components/WartimeSpliceSimulator.tsx` -> `TopologyMeshCanvas` and `WartimeSpliceSimulator`.
   - `src/components/ThermodynamicGainsModal.tsx` -> Interactive cohort divergence chart & live spot sync modal.
   - `src/App.tsx` -> Main stage, Google-style centered landing search dock, Sync Invariant comparison panel, Rubric modal, and Archive Vault modal.
3. HYBRID CARBON + HYDROGEN SERVER-SIDE BACKEND (NODE.JS):
   - Use `process.env.GEMINI_API_KEY` exclusively on the server so no key is ever exposed to the browser.
   - `POST /api/audit`: Use `gemini-4-hydrogen` (`thinking_level: "high"`, `max_output_tokens: 32768`) for Stage 0 Google Search grounding and Stage 1 SSE streaming 6-invariant structured JSON audits so the 01->06 sphere progress animates fast and cheaply.
   - `POST /api/invariant`: Use `gemini-4-hydrogen` (`thinking_level: "medium"`) for `REAUDIT` and `BREAKDOWN`, and route `CHALLENGE` adjudication to `gemini-4-carbon` (`thinking_level: "high"`, `max_output_tokens: 24576`) for maximum physics and codebase rigor.
   - Add per-IP rate limiting on live AI endpoints + honor a `STRICT_CREDIT_LOCK` env toggle while keeping cached/archived reads 100% unlimited and free.
4. SHARED PERSISTENT FIRESTORE ARCHIVE:
   - Provision Firebase Firestore + Anonymous Auth so any newly audited token or adjudicated challenge verdict is saved once and served to all visitors at 0 API credits.
5. APPLY TWO SURGICAL UI UPGRADES:
   - Increase all harmonic wave amplitudes by +25% (1.25x crest multiplier) across the central nucleus sphere, the 6 orbital satellite bubbles, `PinnedOrbitalNode`, and `HarmonicProjectBubble` while keeping E = 0 (score 0.0) spheres completely flatlined.
   - Add a subtle, lightweight clickable cumulative gains reference line directly underneath the "Passed // E > 0" header (`~+2,015% Cycle • 12x ->`) and underneath the "Failed // E = 0" header (`~+59.4% • -11.7% Ex-TAO ->`) in both desktop and mobile sidebars that opens `ThermodynamicGainsModal` when clicked.
6. VERIFICATION:
   - Verify clean TypeScript compilation across all files, test the blank centered landing screen -> slide-up search transition, and verify the Live Gains modal and Wartime Partition Simulator render with zero layout shift.
```

### Step 3: Switch to Hydrogen for Day-to-Day Tweaks & Publish
1. After Carbon finishes the multi-file split, switch your AI Studio model selector to **`gemini-4-hydrogen`** for any fast visual or copy tweaks.
2. Click **Publish** in the top-right corner to deploy the full-stack container to **Google Cloud Run** (`*.ai.studio` or your custom domain).