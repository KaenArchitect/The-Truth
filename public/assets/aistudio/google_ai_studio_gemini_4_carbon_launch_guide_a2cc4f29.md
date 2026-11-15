# Launching "The Truth — Thermodynamic Audit" in Google AI Studio + Gemini 4 Carbon

Skip Vercel completely. **Google AI Studio Build Mode** paired with **Gemini 4 Carbon (`gemini-4-carbon`)** gives you a native multi-file React + Node.js full-stack container, automatic server-side API key protection, built-in Firebase Firestore provisioning, and 1-click **Google Cloud Run** hosting—with zero serverless timeout hacks.

---

## Why AI Studio + Carbon Crushes Vercel for This App

1. **Zero Single-File Ceiling (1M Context + Multi-File Harness):**
   * AI Studio Build Mode runs on the multi-file agentic harness powered by **Gemini 4 Carbon** ($1{,}048{,}576$-token unified window and $65{,}536+$ output decode).
   * It splits your $2{,}850$-line `the_truth_thermodynamic_audit.tsx` backup cleanly across dedicated data and component files while preserving **100% of all 23+ preloaded tokens at full, unabridged Genius forensic depth**.
2. **Automatic Server-Side `GEMINI_API_KEY` Secret:**
   * Build Mode automatically stores `GEMINI_API_KEY` as a server-side secret inside **Settings $\rightarrow$ Secrets** and routes Gemini calls through its built-in Node.js backend—never exposing your key in browser DevTools.
3. **No 10-Second Serverless Timeouts on Live Grounded Scans:**
   * A live Google Search grounding pull + 6-invariant SSE streaming audit takes $12\text{--}25\text{ seconds}$. Because AI Studio publishes directly to **Google Cloud Run** containers rather than restricted lambdas, streaming connections stay rock-solid from Invariant `01` through `06`.
4. **Native Firebase Firestore + Auth Provisioning:**
   * Build Mode natively provisions Cloud Firestore and Authentication right inside your workspace, matching the exact `archived_audits` shared vault architecture already built into your `.tsx` file.
5. **1-Click Publish to `*.ai.studio` or Custom Domain:**
   * Clicking **Publish** in the top-right corner deploys both the React frontend and Node.js backend to managed Cloud Run with a free `.ai.studio` subdomain (e.g., `the-truth.ai.studio`) or a custom domain with managed Cloud DNS and SSL.

---

## Step-by-Step Launch Workflow in Google AI Studio

### Step 1: Open Build Mode & Select Gemini 4 Carbon
1. Open **Google AI Studio** and click **Build** in the left navigation bar.
2. Select **Web App** (React + Node.js full-stack runtime) and choose **Gemini 4 Carbon** (`gemini-4-carbon`) as your builder model so it holds the entire $170\text{ KB}$ codebase in working memory without dropping a single line.

### Step 2: Attach Your Unabridged `.tsx` Backup
1. Click the **Add files (`+`)** button in the Build Mode prompt box.
2. Upload your complete **`the_truth_thermodynamic_audit.tsx`** file (the full backup containing all unabridged `PRELOADED_AUDITS`, `GENIUS_FORENSIC_ESSAYS`, `WartimeSpliceSimulator`, and `ThermodynamicGainsModal`).

### Step 3: Paste the Master Carbon Kickoff Prompt
Copy and paste the exact prompt below into Build Mode so Carbon modularizes the project, moves the Gemini calls to the Node.js backend, applies your final two visual upgrades, and wires Firestore without touching a single word of your audits:

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
3. MOVE ALL GEMINI API CALLS SERVER-SIDE (NODE.JS BACKEND):
   - Use the server-side `process.env.GEMINI_API_KEY` secret exclusively on the Node.js backend so no API key ever touches client code.
   - Create `POST /api/audit` (runs Stage 0 Google Search grounding + Stage 1 SSE streaming 6-invariant structured JSON audit so the 6-stage progress sphere 01->06 animates live).
   - Create `POST /api/invariant` (handles low-token single-invariant `REAUDIT`, `CHALLENGE`, and `BREAKDOWN` requests).
   - Add per-IP rate limiting on live AI endpoints + honor a `STRICT_CREDIT_LOCK` env toggle while keeping cached/archived reads 100% unlimited and free.
4. SHARED PERSISTENT FIRESTORE ARCHIVE:
   - Provision Firebase Firestore + Anonymous Auth so any newly audited token or adjudicated challenge verdict is saved once on the backend and streamed to all users at 0 API credits.
5. APPLY TWO SURGICAL UI UPGRADES:
   - Increase all harmonic wave amplitudes by +25% (1.25x crest multiplier) across the central nucleus sphere, the 6 orbital satellite bubbles, `PinnedOrbitalNode`, and `HarmonicProjectBubble` while keeping E = 0 (score 0.0) spheres completely flatlined.
   - Add a subtle, lightweight clickable cumulative gains reference line directly underneath the "Passed // E > 0" header (`~+2,015% Cycle • 12x ->`) and underneath the "Failed // E = 0" header (`~+59.4% • -11.7% Ex-TAO ->`) in both desktop and mobile sidebars that opens `ThermodynamicGainsModal` when clicked.
6. VERIFICATION:
   - Verify every file compiles cleanly with zero missing imports, test the blank centered landing screen -> slide-up search transition, and verify the Live Gains modal and Wartime Partition Simulator render without layout shift.
```

---

## Step 4: Tune Your Runtime Model Mix (Cost vs. Firepower)

Inside your Node.js `/api/audit` and `/api/invariant` routes, you can get the best of speed, cost, and deep reasoning:
* **Fast Grounded Scans & Breakdowns (`gemini-3-flash-preview` or `gemini-4-argon`):** Keeps full 6-invariant SSE streaming scans snappy and ultra-affordable, especially with 95% implicit prompt caching on `GEMINI_SYSTEM_PROMPT`.
* **Heavyweight Challenge Adjudication (`gemini-4-carbon`):** If you want an unbreakable physicist adjudicating tricky user challenges in `/api/invariant`, point `mode === 'CHALLENGE'` at `gemini-4-carbon` with a bounded `thinking_level` so it dismantles every thermodynamics or tokenomics fallacy with surgical precision.

---

## Step 5: Publish Live to Cloud Run in 3 Clicks

1. Verify your `GEMINI_API_KEY` is active under **Settings $\rightarrow$ Secrets** (configured automatically by AI Studio).
2. Click **Publish** in the top-right corner of Build Mode.
3. Pick your free **`*.ai.studio`** subdomain (or attach your custom domain if linked to a paid Google Cloud project) and click **Publish your app**.