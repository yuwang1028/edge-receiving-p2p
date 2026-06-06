# BRAINSTORM · Bacumen UI research

Inbox for research findings and design ideas. Latest at top.

---

## [Research] 2026-04-24 — Product-shot prototypes for hero visuals (Config / Timeline / Artifact)

Three components render as "product screenshots" on the marketing site:

- **AgentBuilderDemo** → *Config Panel* (cursor-driven form-fill + typewriter)
- **WorkflowVisualizer** → *Live Timeline* (vertical rail, one-active-expanded, CTA bar)
- **LiveArtifactPanel** → *Live Artifact* (streaming document + trace pill)

Goal: find real 2026 products using each pattern (with URLs), plus alternative shapes that could read more premium than our current implementations.

All URLs below were surfaced via WebSearch in this session; confidence notes indicate whether I fetched the page or only saw it in search results.

---

### PROTOTYPE 1 · Config Panel — products using the pattern

| Product | URL | Confidence | What to borrow |
|---|---|---|---|
| **Cohere North — Agent Studio** | https://cohere.com/north/agent-studio | ✅ fetched | Our current reference. Single-card layout: name / description / model select / tool chips. Clean field labels, no-code framing. |
| **LangGraph Studio + LangSmith Playground** | https://docs.langchain.com/langsmith/studio · https://changelog.langchain.com/announcements/langsmith-dataset-integration-in-langgraph-studio | ✅ search | **Time-travel debug**: rewind to any step checkpoint, edit state, fork a new execution path. Open any LLM run in Playground mid-flight. Split pane: graph left, inspect/run right. |
| **Sierra Ghostwriter** | https://winbuzzer.com/2026/03/26/sierra-ghostwriter-self-service-ai-agent-builder-xcxwbn/ · https://sierra.ai | ✅ search | Agent *building* an agent: no journey editing, no integrations, no simulations — you describe outcome in natural language and Ghostwriter generates the config. Very different payoff than our "Saved" pill. |
| **CopilotKit × LangGraph** | https://www.copilotkit.ai/blog/easily-build-a-ui-for-your-ai-agent-in-minutes-langgraph-copilotkit | ✅ search | Pre-built React components (chat panel + action list) that wrap a LangGraph agent. Shows config + live action log side-by-side. |
| **n8n 2.0** | https://n8n.io/ai · https://n8n.io/workflows/?categories=AI | ✅ search | Node-graph canvas with **every reasoning step traceable on canvas** (Jan 2026 release). 70+ native AI nodes, sandboxed code exec, persistent agent memory. |
| **Zapier Agents + Canvas** | https://zapier.com/ai | ✅ search | Linear-UX builder + Agents (autonomous teammates) + MCP server exposing 30K+ actions. Different philosophy: flow-first vs. graph-first. |
| **Lindy agent builder** | https://www.lindy.ai/blog/best-ai-agent-builders · https://lindy.ai | ✅ search | Trigger → action cards. Minimalist no-code. |
| **Decagon AOPs (Agent Operating Procedures)** | https://quiq.com/blog/sierra-ai-vs-decagon/ | ✅ search | Natural-language "procedure" text blocks instead of form fields. QA dashboard is a 2nd-screen payoff. |

### PROTOTYPE 1 · Alternative shapes that read more premium

1. **Split-pane: spec left, live stream right** ⭐ recommended
   - Refs: https://docs.langchain.com/langsmith/studio · https://platform.openai.com/playground · https://sdk.vercel.ai
   - Why stronger than our current card: "Saved" pill is a static payoff. A split-pane shows *consequence* — the agent actually does something. Proof-of-work beats proof-of-configuration for a marketing hero.
   - Moves to steal: left column ~420px fixed; right pane streams tokens ~25ms/token with an em-dash caret; 1px gradient divider (ink → transparent → ink) instead of flat slate-200.

2. **Graph canvas + floating inspector** — differentiation play
   - Refs: https://www.langchain.com/langgraph · https://n8n.io/ai · https://zapier.com/ai (Canvas mode)
   - Why stronger: signals "multi-step agent" as a *system* at a glance; graph-first reads as 2026 while form-first reads as chatbot-era. Distinguishes from Linear/Ramp white-card lookalikes.
   - Moves to steal: nodes snap in with spring (overshoot ~1.03, settle 180ms); inspector slides from right when cursor clicks a node; 24px dotted grid @ 4% ink.

3. **Terminal / build-log aesthetic** — ICP-dependent (only if audience is technical)
   - Refs: https://cognition.ai/blog/devin-2 · https://sdk.vercel.ai · https://modal.com · https://anthropic.com/claude-code
   - Why stronger: extreme density + monospaced reads as "engineer-grade product." Differentiates from the sea of white-card product-shots.
   - Moves to steal: JetBrains Mono / Berkeley Mono @ 13px; output lines prepend dim timestamp + green/amber status glyph; last-line cursor block pulses @ 1Hz; dark panel w/ faux traffic-light chrome.

4. **Stacked-card assembly** — "an agent is built" narrative
   - Refs: https://linear.app/changelog/2026-03-12-ui-refresh · https://attio.com/automations · https://ramp.com/ai
   - Why stronger: current prototype is one card *being filled*; stacked-assembly shows *composition* — Description lands → Tools stacks → Schedule stacks → Deploy snaps on top. More cinematic, more premium.
   - Moves to steal: each sub-card enters 40px Y-offset + 0→1 opacity over 280ms, 120ms stagger; drop-shadow intensity scales with stack depth; slight parallax on scroll.

---

### PROTOTYPE 2 · Live Timeline — products using the pattern

| Product | URL | Confidence | What to borrow |
|---|---|---|---|
| **LangSmith Observability** | https://www.langchain.com/langsmith/observability | ✅ search | Full visibility into agent behavior, step-by-step trace. Works with any framework via SDK. The gold standard for "show me what the agent did." |
| **LangGraph state checkpoints** | https://www.langchain.com/langgraph · https://github.com/langchain-ai/langgraph | ✅ search | State is persisted at every node. UI concept: rewindable timeline where each step has a state-snapshot you can diff. |
| **Linear UI refresh 2026-03** | https://linear.app/changelog/2026-03-12-ui-refresh | ✅ fetched | Consistent headers / nav / view controls across projects, issues, reviews, documents. Icons **redrawn + resized**; sidebars dimmer so main content stands out. Philosophy: *scan → navigate → focus*. Directly applicable to our step cards. |
| **Linear Automations** | https://linear.app/integrations/automations | ✅ search | Issue self-assignment on move-to-started; Linear Agent creates issues from Slack, auto-triages bugs, suggests duplicates (Mar 2026). |
| **Dagster** | https://dagster.io | ✅ search | Data assets as first-class citizens. Asset lineage graph > linear timeline. UI shows status per asset, not per step. |
| **Temporal durable execution** | https://www.kinde.com/learn/ai-for-software-engineering/ai-devops/orchestrating-multi-step-agents-temporal-dagster-langgraph-patterns-for-long-running-work/ | ✅ search | Workflow code runs to completion regardless of infra failures. UI: long-running timelines with resumable checkpoints. |
| **Devin 2.0 / 2.2 session UI** | https://cognition.ai/blog/devin-2 · https://cognition.ai/blog/introducing-devin-2-2 · https://docs.devin.ai/release-notes/2026 | ✅ search | **Bottom scrubber bar** (drag to rewind through agent history); chat auto-scrolls to match. Workspace tabs: Shell / Browser / Editor / Global Work. Preview-features toggle enables streaming thoughts inline. |
| **n8n execution traces** | https://n8n.io/ai | ✅ search | Every reasoning step renders on the same canvas as the workflow — no separate "traces" screen. |
| **Vercel AI SDK + LangSmith tracing** | https://docs.smith.langchain.com/observability/how_to_guides/trace_with_vercel_ai_sdk · https://langfuse.com/integrations/frameworks/vercel-ai-sdk | ✅ search | Tokens stream while traces are being captured server-side — "live" and "replayable" are the same view. |

### PROTOTYPE 2 · Alternative shapes that read more premium

1. **Dense trace table + inline sparkline timeline** ⭐ recommended for compliance vertical
   - Refs: https://www.langchain.com/langsmith/observability · https://langfuse.com · https://dagster.io
   - Why stronger: for a KYC / compliance ICP, a **dense table with per-row latency + status + tool + cost** reads as "auditable infra" more than a vertical rail of friendly cards. The rail says "tour my workflow"; the table says "here's the evidence."
   - Moves to steal: tabular-nums mono for durations; 1.2x row height; flame-graph bar in one column; click-row → side-panel with full span detail.

2. **Horizontal flame-graph with child-span drilldown**
   - Refs: LangSmith traces (https://docs.langchain.com/langsmith/studio) · Datadog APM · browser DevTools Performance tab
   - Why stronger: shows **parallelism** (IDV and Sanctions screen can run concurrently). A vertical rail hides concurrency.
   - Moves to steal: colored bars per tool (Persona = coral, Refinitiv = teal, policy-check = ink); hover reveals tool call JSON in a popover; collapse/expand child spans.

3. **Swimlane (per-actor) timeline**
   - Refs: https://incident.io · https://temporal.io UI · Jira Timeline view
   - Why stronger: KYC specifically has clear "actors" — customer / IDV provider / watchlist provider / Bacumen runtime / analyst. A swimlane shows which actor is doing what at which time. Reads as operational truth, not demo script.
   - Moves to steal: 4-5 fixed lanes with pale alternating backgrounds; task bars span time; handoff arrows between lanes.

4. **Scrubbable playback with rewind/fork UI** — differentiation + premium
   - Refs: https://docs.devin.ai/release-notes/2026 (scrubber) · https://docs.langchain.com/langsmith/studio (fork execution)
   - Why stronger: the "I can replay this decision at audit time" pitch is a real buyer value for KYC/compliance. A scrubber is a UI metaphor that directly communicates that.
   - Moves to steal: bottom bar with draggable playhead; timestamps above; "Fork at this step" button that creates an alternate branch.

---

### PROTOTYPE 3 · Live Artifact — products using the pattern

| Product | URL | Confidence | What to borrow |
|---|---|---|---|
| **Claude Artifacts** | https://albato.com/blog/publications/how-to-use-claude-artifacts-guide · https://claude.ai | ✅ search | Side-panel rendered artifact next to chat. 2026 updates: persistent storage across sessions, direct API calls, MCP integrations. Publish + share via link. |
| **Perplexity answer pages** | https://sureprompts.com/blog/best-perplexity-prompts-2026 · https://perplexity.ai | ✅ search | **Inline numbered citations**; source cards below the answer; threaded follow-up chat keeps context. Every fact traceable to source in one click. |
| **Harvey AI platform** | https://www.harvey.ai/platform · https://www.harvey.ai/solutions/litigation | ✅ search | Legal memo drafting. Compliance evaluation runs in Microsoft Word (inside the existing doc, not a separate app). Summary + missing-provisions + policy-deviation flags. |
| **Abridge — linked evidence** | https://www.abridge.com · https://soapnoteai.com/soap-note-guides-and-example/best-ai-medical-scribes-2026/ | ✅ search | **Every note element links back to the moment in the transcript where it was said**. Direct analog to our policy→signal chain — but better, because the citation is a *timestamp in source audio*, not just a doc reference. |
| **Nuance DAX Copilot** | https://soapnoteai.com/soap-note-guides-and-example/best-ai-medical-scribes-2026/ | ✅ search | Deep Epic / Cerner integration. Artifact appears *inside* existing EHR workflow — no separate UI. |
| **Devin Workspace** | https://cognition.ai/blog/devin-2 · https://docs.devin.ai/release-notes/2026 | ✅ search | Artifact = code diffs + browser + shell + global work view. Workspace IS the artifact. |
| **Spellbook (legal AI)** | https://www.spellbook.legal/learn/legal-ai-tools | ✅ search | Comparison of legal AI tools with doc-review / compliance-check UIs. |

### PROTOTYPE 3 · Alternative shapes that read more premium

1. **Split-pane: artifact + reasoning trace** ⭐ recommended (strongest competitive moat)
   - Refs: https://claude.ai (Artifacts + chat) · https://www.harvey.ai/platform · https://www.perplexity.ai
   - Why stronger: our current card is a doc. A split-pane shows **doc + reasoning**. For compliance, the reasoning is the product — "why did the AI approve?" — not the memo. Moves the visual weight from artifact-as-output to artifact-as-evidence-of-reasoning.
   - Moves to steal: left = memo streaming in (current component); right = agent chain-of-thought panel with tool calls, citations, confidence deltas; hovering a paragraph on left highlights the reasoning rows on right.

2. **Citation-anchored marginalia**
   - Refs: https://www.perplexity.ai · https://www.abridge.com · https://claude.ai Artifacts citation mode
   - Why stronger: the strongest trust signal in compliance is "I can click any sentence and see where it came from." Current card has one footer trace pill; a citation-anchored version has a pill **next to every claim**.
   - Moves to steal: superscript numbered citations inline; right margin has a column of tiny source cards; hovering a citation zooms its source card; "Show provenance" toggle that draws leader lines from claims to sources.

3. **Policy-check ledger view** — unique to compliance vertical
   - Refs: https://www.harvey.ai/solutions/litigation · Ironclad CLM · ComplyAdvantage
   - Why stronger: swap the "memo + table" layout for a **policy-checklist ledger** where each policy rule is a row, Value + Evidence + Pass/Fail + Reasoning collapse into that row. Reads as "I ran the policy and here's the verdict, line by line" — more compliance-native than a memo.
   - Moves to steal: ledger rows with 4 columns (Rule / Value / Policy / Verdict); green/amber/red LEDs; click a row to expand into the narrative reasoning. Footer summary: "14 pass · 1 warn · 0 fail."

4. **In-document agent edits (diff view)**
   - Refs: https://cognition.ai/blog/devin-2 (code diffs) · Notion AI / Grammarly in-doc suggestions · https://www.harvey.ai/platform (in-Word compliance)
   - Why stronger: instead of producing a NEW memo, the agent **edits the applicant's existing submission** in-place with colored insertions/deletions and margin comments. For KYC this is powerful because it says "the agent augmented your analyst's work, not replaced it."
   - Moves to steal: green insertions, red strikethroughs, margin notes with author label "Bacumen"; "Accept all / Reject all / Review each" CTA bar at top.

---

### Gaps vs current components

- **No consequence-layer.** All three prototypes show configuration / process / output in isolation. None show the next step (who consumed the memo? what did the analyst decide? did the decision stick?). Split-pane or scrubbable designs close this gap.
- **No provenance layer inside the artifact.** Current LiveArtifactPanel has one trace pill in the footer. Competitors (Perplexity / Abridge / Harvey) embed citations inline — strongest trust signal we're missing.
- **Concurrency is invisible.** Current Timeline is vertical sequential. Real KYC has parallelism (IDV + sanctions run in parallel). Flame-graph or swimlane shapes express this.
- **No "rewind / replay" UI.** Our Timeline animates once and stops. Devin's scrubber + LangGraph's time-travel are 2026 idioms that directly communicate "auditable." Big miss for compliance ICP.

### Recommended additions to TODO.md

- [ ] **Prototype #1 (Config Panel) — test Shape 1 (split-pane: spec + live output stream)** as a drop-in replacement for AgentBuilderDemo. Target: Hero right column + StackedScenes "Describe" scene.
- [ ] **Prototype #2 (Timeline) — add a dense trace-table variant** (Shape 1). Put it alongside the current rail on the `/platform` page as a "Runtime observability" section. Keeps the marketing rail for storytelling; the table serves the buyer doing diligence.
- [ ] **Prototype #3 (Artifact) — add inline citations** (Shape 2 moves). Retrofit current component rather than replace: numbered superscripts on paragraph sentences + right-margin source strip. Low risk, high trust signal.
- [ ] **Prototype #2 — add a scrubber bar** (Shape 4 move) to the Timeline card. One of the strongest "audit-ready" UI metaphors in 2026 and aligned with Bacumen's value prop.
- [ ] **Policy-ledger variant** (Shape 3 of Prototype 3) for a second Skills-page section that's compliance-native rather than document-native.

### Priority read for design direction

If we only make **one change** across the three components, it should be **Prototype 3 Shape 1 (split-pane: artifact + reasoning trace)**. Reasons:
1. Highest competitive-moat signal (nobody else in KYC-compliance is showing the reasoning alongside the memo).
2. Directly aligned with our "audit-ready AI" value prop.
3. Reuses current LiveArtifactPanel as the left half — no throwaway work.
4. Claude Artifacts already educated the market on what this looks like, so it reads as familiar-premium.
