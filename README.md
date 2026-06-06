# Bacumen.ai — marketing site

Next.js 16 / React 19 / Tailwind v4 marketing site for **Bacumen.ai**, built from the
spec in `Bacumen_Website_Brief_for_ClaudeCode.md`.

## What's built

- **IA & pages** (all routes in brief §3):
  - `/` — Home with Cohere-North-style **LiveArtifactPanel** in the hero that
    cycles through the 4 Skills' output artifacts.
  - `/platform` — Runtime overview, 6 module cards, comparison, trust layer.
  - `/skills` — 4-card grid + a single **ComingSoonPanel**.
  - `/skills/[slug]` — Full Skill detail template. Centerpiece is the
    `SkillWorkflowSection` that pairs a vertical **WorkflowVisualizer** (the
    process) with a **LiveArtifactPanel** (the output the agent produces).
  - `/integrations` — Filterable grid over ~30 integrations.
  - `/pricing` — 3 tiers, every CTA opens the demo modal.
  - `/customers` — 3 case-study cards.
  - `/customers/[slug]` — Long-form case study template.
  - `/about` — Mission, founder bios (verbatim from brief §7.2), hiring.
  - `/demo` — Standalone request-demo form, supports `?skill=kyc` preselect.
  - `/api/demo-request` — POST stub (validates with zod, `console.log`, returns 200;
    forwards to `DEMO_WEBHOOK_URL` if set).
  - `/dev/workflow` — Dev-only QA page that renders all 4 Skill workflows +
    artifacts stacked. Returns 404 in production.
- **Design system** (tokens in `app/globals.css` via Tailwind v4 `@theme`):
  navy / teal / ink / muted / cream, typography scale (`.text-display-xl` …),
  unified motion clock `--t-1..t-5`, dark/light section utilities, hairline grid
  + film-grain overlays, teal caret blink, active-node soft pulse.
- **Centerpiece components:**
  - `components/live-artifact-panel.tsx` — Cohere-North-style agent-writes-an-artifact
    visual. Variable-speed typewriter, cursor, staggered table rows, corner brackets,
    scan-line overlay. Respects `prefers-reduced-motion`.
  - `components/workflow-visualizer.tsx` — node-flow with pulsing active ring,
    gradient progress path, click-to-open detail sheet, `IntersectionObserver`
    autoplay, hover-to-pause.
- **SEO/assets:** `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`,
  `app/icon.tsx`.

## Run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`. Hit `/dev/workflow` to see all 4 Skill animations
stacked for QA.

## Scripts

- `npm run dev` — start Next dev server
- `npm run build` — production build (Turbopack)
- `npm start` — serve the production build
- `npm run typecheck` — strict TS check, no emit
- `npm run lint` — eslint

## Environment

Copy `.env.example` → `.env.local`:

- `NEXT_PUBLIC_SITE_URL` — canonical site URL (defaults to `https://bacumen.ai`)
- `DEMO_WEBHOOK_URL` — optional; when set, the API route also POSTs the demo
  payload here (Slack / HubSpot / webhook.site, etc.)

## Add a new Skill

Edit `lib/skills.ts`:

1. Add the new slug to the `SkillSlug` union.
2. Append a new entry to the `skills` array with the full shape (`steps`,
   `bigNumbers`, `integrations`, `before`, `after`, `policyYamlPreview`,
   `artifact`).
3. In `components/skill-icon.tsx`, add the slug → Lucide icon mapping.
4. The Skill detail page (`app/skills/[slug]/page.tsx`) picks it up via
   `generateStaticParams`.

## Add a new integration

Edit `lib/integrations.ts`:

1. Add an entry to the `integrations` array (`name`, `slug`, `category`,
   `usedBy`, `status`).
2. If it's a new category, add it to `integrationCategories` too.
3. The filter UI on `/integrations` picks it up automatically.

## Deploy

Push to GitHub, connect to Vercel, set the env vars above, attach
`bacumen.ai` + `www` redirect. That's it. The sitemap/robots routes are
generated at build via Next's built-in metadata routes.

## Decisions

Judgment calls made during the build that aren't spelled out in the brief:

1. **npm instead of pnpm.** The brief prescribes pnpm; the local environment
   has no pnpm binary. Scripts and docs use `npm`. Switch by renaming the lockfile
   and rerunning `pnpm install`.
2. **No Storybook.** Brief allowed fallback to `/dev/workflow` — taken.
3. **Next.js 16 + React 19**, not 15 as the brief said — current
   `create-next-app` output. Turbopack is enabled.
4. **Tailwind v4 with `@theme`** instead of `tailwind.config.ts` — matches the
   brief's requested version. All design tokens live in `app/globals.css`.
5. **Repo lives at the root of this directory**, not in a nested
   `bacumen-website/` folder as the brief's §8 tree suggests.
6. **Inter Display fallback.** Brief requires local Inter Display. Without the
   `.woff2`, the display scale is aliased to Inter 700 with a tuned letter-spacing
   (-0.02em at display-xl) — noticeably less polished than real Inter Display.
   Drop the file into `app/fonts/InterDisplay.woff2` and swap the `next/font/google`
   Inter-as-Display registration in `app/layout.tsx` for `next/font/local` to fix.
7. **Added `Instrument Serif` font variable** as an optional display accent for
   future editorial flourishes; not used by any component yet but loaded.
8. **Case studies are TSX, not MDX.** Brief's §8 aspirational MDX system
   replaced with typed data in `lib/cases.ts`. Upgrade by adding `@next/mdx`
   if longer-form content is needed later.
9. **Skill roadmap** (brief §4.3 expansion): chose the minimal approach after
   user direction — single `ComingSoonPanel` at the bottom of `/skills`, no
   per-category roadmap or per-stub pages. Keeps the site tight.
10. **Signature component pair.** Brief had only `WorkflowVisualizer`. Added
    `LiveArtifactPanel` (Cohere North reference) and compose both in
    `SkillWorkflowSection`. Process on the left, output on the right.
11. **Unified motion clock** — `--t-1..t-5` CSS variables + two named eases
    (`--ease-entrance`, `--ease-spring-ish`). Every timing in the codebase
    should pick from this scale.
12. **Demo form:** zod validation + client-side free-email-domain rejection
    (gmail/yahoo/outlook/hotmail/etc.). Free-email submission is blocked at
    the form level with an inline error, not just at the API.
13. **`data-demo-trigger` delegation.** Any element in the tree with that
    attribute opens the modal via a document-level click listener in
    `DemoModalProvider`. Supports `data-demo-skill=kyc` to preselect and
    `data-demo-source=...` for analytics tagging.
14. **Placeholder customer wordmarks** on the trust row — the brief defers
    the real customer decision. Replace in `components/trust-row.tsx`.
15. **`@vercel/analytics` active**, Plausible placeholder `<script>` in
    `app/layout.tsx` left commented out.

## Accessibility

- Skip link at the top of every page (`components/skip-link.tsx`).
- Every interactive element has a visible teal focus ring via
  `:focus-visible` in `app/globals.css`.
- All animations honor `prefers-reduced-motion: reduce` — the override in
  globals.css snaps durations to 0.001ms, and the LiveArtifactPanel /
  WorkflowVisualizer also check the media query directly and render their
  final state instantly.

## Outstanding / nice-to-have

- Real customer logos on `/` trust row.
- Real Inter Display `.woff2` in `app/fonts/`.
- Case-study MDX pipeline if the copy grows.
- Per-locale strings if/when i18n lands (brief v1 is English-only).
