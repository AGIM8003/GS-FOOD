# NEO CHATROOM — Drop-in AI Chat Specification v2.0

> **Version:** 2.0 · Updated 2026-04-22
> **Source of truth:** THIS FILE is the single, absolute source of truth.
> **Purpose:** a complete, self-contained reference so this exact chatroom — its
> intelligence, its voice, its geometry, its streaming feel, its delivery
> pipeline, its enforcement layer, and its observability scorecard — can be
> rebuilt end-to-end in any other project (Next.js, plain HTML, Vue, anything).
>
> Nothing in this file depends on a paid LLM. The chat works **offline**
> because it ships its own deterministic composer that produces a structured,
> grounded reply per turn, then a separate UI layer streams it character-by-
> character so it reads as a person typing.
>
> **What's new in v2.0:**
> - Multi-channel delivery pipeline (Gmail, Outlook, WhatsApp, LinkedIn, clipboard, native share)
> - Strict intake report schema with Zod validation
> - Dossier safety checks & enforcement pipeline
> - Swarm reviewer & session state management
> - Industrialization scorecard (% readiness across 12 dimensions)
> - Email verification + submit-review flow components
> - Complete file manifest (35 lib files + 13 components)

---

## 🔑 Variable Dictionary — FILL BEFORE USE

Every `{{PLACEHOLDER}}` in this document is a slot you **must** replace with your project's facts before building. This is the single reference table:

| Variable | Description | Example |
|---|---|---|
| `{{ORG_NAME}}` | Full organisation name | "Van den Berg Notariskantoor" / "ACME Design Studio" |
| `{{CITY}}` | Primary city (EN) | "Amsterdam" / "Brussels" |
| `{{CITY_NL}}` | City name in Dutch | "Amsterdam" / "Brussel" |
| `{{CITY_FR}}` | City name in French | "Amsterdam" / "Bruxelles" |
| `{{COUNTRY}}` | Country (EN) | "Netherlands" / "Belgium" |
| `{{COUNTRY_NL}}` | Country in Dutch | "Nederland" / "België" |
| `{{COUNTRY_FR}}` | Country in French | "Pays-Bas" / "Belgique" |
| `{{CAPITAL}}` | National capital | "Den Haag" / "Brussels" |
| `{{REGION}}` | Primary region | "Noord-Holland" / "Flanders" |
| `{{REGION_1}}`, `{{REGION_2}}` | Metacognition location regex terms | "amsterdam", "netherlands" |
| `{{PHONE}}` | Published phone number | "+31 20 123 4567" |
| `{{EMAIL}}` | Published email | "info@example.be" |
| `{{ADDRESS}}` | Full street address | "Keizersgracht 123, 1015 Amsterdam" |
| `{{DOMAIN_TYPE}}` | What the org does NOT provide as binding advice | "legal" / "medical" / "financial" |
| `{{TEAM_MEMBER_1}}`, `{{TEAM_MEMBER_2}}` | Key team member names (for intent regex + agent keywords) | "jan", "marie" |
| `{{TEAM_DESCRIPTION}}` | One-line team summary for KB | "Matters are handled by..." |
| `{{SERVICES_DESCRIPTION}}` | Services summary for KB | "advises individuals and companies on..." |
| `{{SERVICE_TAG_1}}` … `{{SERVICE_TAG_3}}` | Top-3 service tags for KB entry | "real-estate", "family", "corporate" |

> **Rule:** If a `{{PLACEHOLDER}}` appears in code blocks, regex patterns, or KB entries — you substitute the **literal value** (no curly braces in the final code). The braces are blueprint-only markers.

---

## ⚡ READ THIS FIRST — Agent porting instructions

You are an AI agent (Cursor / Claude / Codex / Cline / etc.) being asked to
**install this NEO chatroom into a different project**. Read this whole
section before you touch a single file in the target repo.

### A. The golden rule

> **This document is the contract. The target project's domain is a variable.**
>
> The structure (six-slot reply, three tones, three locales, Markdown subset,
> typewriter cadence, panel geometry) is **not negotiable** — that is what
> makes the chat feel like NEO and not like a chatbot.
>
> The **facts and the voice nouns** (org name, services, team members, KB
> entries, city, domain type) **must be replaced** with
> the target project's domain. Never copy donor facts into another project.

### B. What to KEEP VERBATIM (do not edit, do not "improve")

| File | Why |
|---|---|
| `lib/neo/communication.ts` — `TONE_PROFILES`, `detectLanguage`, `selectTone`, `neoBoundaryLine` structure | The three tones × three locales matrix is the voice. The locale wording is the boundary; only translate to a new language if you're adding one. |
| `lib/neo/legal-reply.ts` — `buildLegalReply` and `renderLegalReply` *bodies* | The six-slot composition (opener · bridge · body · → next · _boundary_ · > disclaimer) is the shape of every message. |
| `lib/neo/intake-state.ts` — `evaluateMetacognition`, `calculateReadiness`, `executeMarkovTransition` | The state machine + readiness logic. |
| `lib/neo/intake-questions.ts` — `nextBestQuestion` algorithm + adaptive batching | The "warm next-question" ladder; do not reorder issue → timeline → parties → location → documents. |
| `lib/neo/intake-report-schema.ts` — `StrictIntakeReportSchema` + `NormalizedValidationResult` | The Zod-enforced report contract with 10-section structure (A–J). Do not rename sections or change the validation status enum. |
| `lib/neo/intake-report-validator.ts` — validation pipeline | Validates composed reports against the strict schema. Drives `dispatch_allowed` / `hard_block_status`. |
| `lib/neo/enforcement-pipeline.ts` — safety enforcement | Post-compose guardrails: boundary-line presence, disclaimer presence, contact-suppression rules. Never bypass. |
| `lib/neo/dossier-safety-checks.ts` — pre-dispatch validation | Validates the dossier before it reaches a professional: PII-leak detection, completeness gating, consent verification. |
| `lib/neo/swarm-reviewer.ts` — swarm orchestration review | Reviews swarm node health, routes inferences across the cascade, tracks cooldown timers. |
| `lib/neo/session-state.ts` — session persistence | Manages `localStorage` persistence and pruning for conversation state. Do not change key names. |
| `lib/neo/kb-search.ts` — full file | The scoring formula. |
| `components/neo/neo-rich-text.tsx` — full file | The Markdown-subset renderer. Adding `<a>` or raw HTML breaks the safety contract. |
| `components/neo/neo-typewriter.tsx` — full file (cadence, jitter, pauses, caret) | The "human typing" feel. Tweaking ms values usually makes it worse. |
| `components/neo/neo-shell.tsx` — geometry, easing, focus traps, `body.neo-hub-open` reflow | The premium feel. |
| `components/neo/neo-chat-surface.tsx` — three rendering branches, streaming-id derivation, empty-state pinning | The chat surface contract. |
| `components/neo/neo-context.tsx` — `sendMessage`, persistence keys | State contract. |
| `components/neo/delivery-channel-modal.tsx` — full file | Multi-channel dispatch (Gmail, Outlook, WhatsApp, LinkedIn, clipboard, native share). Zero-dependency browser APIs. Do not add server-side delivery here. |
| `components/neo/neo-auth.tsx` — email OTP verification UI | Intake verification gate. Keep the step flow: enter email → receive code → verify. |
| `components/neo/neo-submit-review.tsx` — final review + consent UI | 3-consent gate before submission. Never remove a consent checkbox. |
| The Cormorant Garamond italic rule (`.italic-display` / `h1 em, h2 em, h3 em`) | This is the visual signature; substituting any other italic destroys the academic feel. |
| Bronze accent `#9A6B1F` + paper cream `#F6F4EE` palette | The single-accent rule. Change *which* hue if you want, but keep ONE accent and use it for one element per viewport. |

### C. What you MUST SWAP per project (every time)

| File / spot | What to change | Example |
|---|---|---|
| `data/neo-kb.json` | Every entry. Title + body + tags + href + primaryAgent rewritten for the new domain. **No donor facts may survive.** | `"id":"contact-general"` → your own contact line, your own address, your own phone. |
| `lib/neo/agents.ts` | Agent labels, descriptions, **and keyword sets**. The 8-slot scaffold can stay; the keywords must match the new vocabulary. | `"contact-router" / "policy-helper" / "office-navigator"` → `"sales-router" / "billing-helper" / "support-navigator"` (or whatever the new domain needs). |
| `lib/neo/persona.ts` — `PRIME_DIRECTIVE` text | Replace **only the nouns**: `{{ORG_NAME}}` → your org name, `{{CITY}}, {{COUNTRY}}` → your geography, `{{DOMAIN_TYPE}}` → your domain + scope, the "out-of-scope" examples. **Keep every structural rule** (verb-first, two-friends voice, output shape, mirror language, never invent). | "You are NEO, the public-website orientation assistant for *Your Org* (Your City, Your Country)." Then continue with the same five sections. |
| `lib/neo/legal-reply.ts` — `DISCLAIMER` strings | Replace with your domain's disclaimer (for non-legal projects, this can be a soft accuracy disclaimer or removed if the domain has no factual-claim risk). | `"AGIM does not commit to any specific delivery date but will make every effort to ship the best possible result."` |
| `lib/neo/legal-reply.ts` — `NEXT_STEP_LABELS` | Translate the "Open the privacy statement / See practice areas" labels into the target project's page names. | `{ contact: "Reach the studio", services: "See offerings", privacy: "Open the privacy statement" }` |
| `lib/neo/legal-reply.ts` — `routeLabel(href, locale)` mapping | Update the `if href.includes(...)` branches to your routes. | `/case-studies`, `/team`, `/pricing`, etc. |
| `lib/neo/communication.ts` — `detectIntent` regex bodies | Add domain-specific keywords (kept the slot names). | `scope_question` keywords gain `"branding"`, `"copy"`, `"video"` for an agency; lose `"divorce"`, `"summons"`. |
| `lib/site.ts` (your project's equivalent) — `SITE.phoneDisplay`, `SITE.email`, `SITE.address.singleLine`, `SITE.disclaimer` | Single source of truth for contact facts. | Your real phone, real email, real address. |
| `components/neo/neo-shell.tsx` header label `<p class="italic-display">NEO</p>` | If you rebrand the assistant, change the displayed name. The `LAWYER_ASSISTANT_PERSONA.displayName` constant in `persona.ts` is the source. | "NEO" → "AGIM" / "Atelier" / whatever the assistant's name is in this project. |
| `components/neo/neo-chat-surface.tsx` — `QUICK_PROMPTS` array | Three starter prompts that match the new domain. | `["What services does the studio offer?", "Who's on the team?", "How do I reach the studio?"]` |
| `components/neo/neo-shell.tsx` — `<Link href="/case">` Case Room link | Either point to the equivalent full-screen surface or remove the icon entirely if there is none. | Remove if not building a Case Room. |
| `EmptyState` greeting copy | The "Hello — I'm NEO. Ask me anything about `{{ORG_NAME}}`…" line. Reword for the new domain in all three locales. | "Hi — I'm NEO. Ask me anything about {{ORG_NAME}} and I'll point you to the right page." |
| Tailwind palette (`orech.*`) | Optional. If you want to rebrand the visual identity, swap the six core colours (ink/paper/mist/slate/line/bronze). **Keep the relationships** (one accent, hairline borders, cream background, dark ink). | A studio might use ink `#0F0F10` / paper `#FAFAF7` / accent `#C77D3F`. |

### D. What you MAY SWAP if the target project is far enough from the donor

| Spot | When |
|---|---|
| Add or remove a locale (e.g. add `de` for German) | Replicate every `.en` / `.nl` / `.fr` field across `TONE_PROFILES`, `DISCLAIMER`, `NEXT_STEP_LABELS`, `PROMPTS`, `PAIRED`, `neoBoundaryLine`, `nextStep` strings, follow-up labels, and `LOCALE_TO_BCP47`. |
| Drop the intake state machine | If you don't need email-verified intake, leave `state` always at `DRAFT_DISCOVERY` and never render `NeoAuth / NeoSubmitReview / SUBMITTED_FOR_LEGAL_REVIEW`. The chat still works. |
| Drop the file-attach + paste features | Set `enableAttach={false}` on `<NeoChatSurface>` and the paperclip / paste buttons hide. |
| Drop the swarm receipt simulator | The `nodeHealth` cascade in `composeNeoReply` is purely cosmetic ("Online" / "Replying from cache" badge). Replace with `mode: "standard", provider: "static_fallback"` and a constant `degraded: false`. |
| Drop voice dictation | Don't render `useSpeechRecognition`'s mic button. The composer still works; only the dictation glyph disappears. |
| Replace deterministic composer with a real LLM | Swap the body of `composeNeoReply` to call your LLM, but **continue to feed the result into `renderLegalReply` (or assemble the same six-slot Markdown manually)**. The renderer + typewriter expect that exact Markdown subset. Stream chunks into `setRevealed(prefix.length)` instead of using the timer. |

### E. Before-you-start checklist

When the user says "install NEO into project X", do these in order:

1. **Read this whole document end-to-end first.** Don't paste files yet.
2. **Inspect the target project**: framework, font stack, color palette, routing model (App Router / Pages / SPA / static HTML), language requirements (en only? en+other?).
3. **Decide the rebrand**: assistant name, accent colour, three quick prompts, KB scope.
4. **Compile the new KB** (`data/neo-kb.json`): 8–15 atomic facts, each with `title / tags / body / href / primaryAgent`. Do not invent facts; ask the user if anything is missing.
5. **Re-keyword the agents** (`lib/neo/agents.ts`) so the keyword sets match the new vocabulary.
6. **Localize the persona** (`lib/neo/persona.ts`) and the disclaimer/boundary lines (`legal-reply.ts` + `communication.ts`).
7. **Drop in the unchanged files**: `kb-search.ts`, `intake-state.ts`, `intake-questions.ts`, `compose-reply.ts` (with KB import wired), `neo-rich-text.tsx`, `neo-typewriter.tsx`, `neo-context.tsx`, `neo-shell.tsx`, `neo-chat-surface.tsx`, `use-speech-recognition.ts`.
8. **Wire fonts** (Cormorant Garamond Italic is non-negotiable) and **Tailwind tokens** (the `orech.*` colour scale or your rebrand of it).
9. **Add the global CSS rules** from §6 (`.italic-display`, `body.neo-hub-open`, `:focus-visible`).
10. **Mount once** in the root layout: `<NeoProvider>{children}<NeoShell /></NeoProvider>`.
11. **Smoke-test in three locales**: type one greeting, one contact request, one urgent message in en/nl/fr (or your project's locales). Verify the six-slot reply renders, the bronze caret streams, the chips appear.

### F. Don't-do-this list

- **Don't** rewrite the renderer to support more Markdown. The narrow subset is a security and consistency feature.
- **Don't** swap the typewriter for a token-by-token reveal that bypasses the punctuation pauses. The pauses are why it reads as a person.
- **Don't** turn the panel into a centred modal. The right-hand slide-in + content reflow is the geometry that makes the chat feel like a colleague, not an interruption.
- **Don't** add facts to the KB inline in code. Every fact lives in `data/neo-kb.json` so a non-engineer can edit it.
- **Don't** inline contact details proactively. Phone / email / address only when intent is `contact_request | urgency_signal` or the routed agent is `contact-router`.
- **Don't** cargo-cult the colour palette. If the target project is dark-themed, rebuild the palette as a coherent dark scheme — don't just paint the donor's bronze on a black background.
- **Don't** ship without testing `prefers-reduced-motion`. The typewriter and panel slide both honour it; if they don't in your port, you broke something.

### G. Completeness checklist for THIS document

The next agent reading this file should be able to answer **yes** to all of:

- [ ] I know exactly what Markdown tokens are allowed in NEO replies (§2.1).
- [ ] I have the verbatim prime directive and can swap only the nouns (§1.1, §C).
- [ ] I have the three tone profiles in three locales (§2.2).
- [ ] I have the boundary line and disclaimer in three locales (§2.3, §2.4).
- [ ] I have the intent regex (§3.2), the agent table with keywords (§3.4), and the KB scoring formula (§3.5).
- [ ] I know when contact info is allowed and when it isn't (§3.6).
- [ ] I have the full six-slot reply builder (§3.8) and the follow-up chip rules (§3.9).
- [ ] I have the intake-ladder questions in three locales and the adaptive batching rule (§3.10).
- [ ] I have the message normalizer interface and entity patterns (§3.13).
- [ ] I have the advisory engine domains and lookup signature (§3.14).
- [ ] I have the prompt compiler's 11-section XML structure (§3.15).
- [ ] I have the FREE AI bridge contract and fallback behaviour (§3.16).
- [ ] I have the telemetry event types and dashboard aggregation (§3.17).
- [ ] I have the enforcement pipeline rules: boundary-line assertion, disclaimer assertion, contact-suppression (§3.18).
- [ ] I have the strict intake report schema (10 sections A–J) with Zod validation (§3.19).
- [ ] I have the dossier safety checks: PII-leak detection, completeness gating, consent (§3.20).
- [ ] I have the swarm reviewer cascade and node-cooldown contract (§3.21).
- [ ] I have the session state persistence keys and pruning rules (§3.22).
- [ ] I have the typewriter cadence formulas: char-step, jitter, punctuation pauses (§4.1).
- [ ] I have the panel geometry constants and the empty-state pinning rule (§5).
- [ ] I have the design tokens — the six core colours, the five-font stack, the `.italic-display` rule (§6).
- [ ] I have the state machine (§7) and the intake types / dossier structure (§7.1).
- [ ] I have the multi-channel delivery pipeline and its 6 channel types (§7.2).
- [ ] I have the wiring snippet for the root layout (§10.1).
- [ ] I know the three things I have to edit per project (§10.5) and the six non-negotiables (§11).
- [ ] I have the environment variables table (§12) and the dependency list (§13).
- [ ] I have the error handling / fallback chain and localStorage keys (§14).
- [ ] I have the industrialization scorecard dimensions and can generate a % readiness report (§15).
- [ ] I have the complete file manifest (35 lib + 13 components) and know which files are invariant vs. domain-specific (§16).

If any box is unchecked, **stop**, re-read the relevant section, and only then start implementing in the target repo.

---

## 0. The 60-second mental model

```
USER TYPES
   │
   ▼
detectLanguage()  →  en | nl | fr            (lightweight word-list sniff)
detectIntent()    →  greeting | contact_request | scope_question …
selectTone()      →  professional_empathetic | clear_direct | calm_reassuring
routeAgent()      →  one of 8 NEO agents (KB scoping)
   │
   ▼
searchKb()        →  top KB entries, agent-preferred
buildLegalReply() →  { opener, bridge, body, boundary, nextStep?, disclaimer? }
renderLegalReply()→  Markdown-friendly string with → arrows, _italics_, > quote
nextBestQuestion()→  optional warm intake question appended to the reply
   │
   ▼
NEO-typewriter UI  →  reveals char-by-char with punctuation pauses + bronze caret
NEO-rich-text UI   →  renders → bullets, _italic boundary_, > disclaimer
followUps          →  3 contextual chip buttons under the reply
```

The whole pipeline is synchronous from a UX point of view. The composer is
fast (no network), the streaming is purely a UI affordance to feel human.

---

## 1. The persona — *how NEO communicates*

This is the single most important section. It is what makes NEO read like
a careful colleague, not a chatbot.

### 1.1 Prime directive (verbatim, never edit lightly)

```
You are NEO, the public-website orientation assistant for {{ORG_NAME}}
({{CITY}}, {{COUNTRY}}).

Prime directive — non-negotiable:
- Every claim about the organisation MUST come from the approved knowledge
  base (data/neo-kb.json) and the verified site facts (lib/site.ts). NEVER
  invent service areas, team specialisations, results, awards, prices,
  hours, jurisdictions, or contact details.
- You provide GENERAL ORIENTATION. You do NOT give {{DOMAIN_TYPE}} advice.
  You do not predict outcomes. You do not make binding commitments.
- You always reply in the user's language when it is Dutch, French, or
  English. Default to English when uncertain.

Communication style:
- Professional, empathetic, concise. Verb-first; minimise filler.
- Open with a brief acknowledgement, then deliver the grounded answer in
  short sections. Close with one clear next step (when applicable) and a
  one-line boundary reminder.
- For urgent matters (deadlines, summons, arrest, hearings), switch to a
  calm, reassuring tone and surface the published office line.
- For contact requests, be direct and emit the published contact details.
  Do NOT show contact details proactively in any other context.

Out-of-scope handling:
- If the question concerns another jurisdiction, an unrelated organisation, or a
  domain {{ORG_NAME}} does not publish, say so plainly and recommend a
  specialist in that area. Do not speculate.

Safety & privacy:
- Do not request, store, or echo confidential case facts. If the visitor
  starts to share them, gently steer them toward the office contact path
  so it can be handled under professional secrecy.

Output shape (default):
1. Empathetic opener (one sentence).
2. Grounded answer drawn from approved KB (1–3 short paragraphs, Markdown ok).
3. Optional next step (call/email/page link) when relevant.
4. Boundary reminder (one italic line).
5. Required disclaimer when factual claims are made.

Two-friends voice (always on):
- This is a conversation between two people working on a problem
  together — not a form, not a lecture, not a press release.
- Short turns. One thought, sometimes one question, per reply.
  When the visitor writes briefly or sounds stressed, ask ONE thing.
  When they write at length and give detail, you may group two
  related questions in the same turn.
- Plain language. Never "kindly", "hereinafter", "should you require",
  "please be advised". Speak the way a careful friend who happens to
  work at {{ORG_NAME}} would speak.
- Acknowledge feelings briefly when present, then move on. Example:
  "That sounds stressful — let's go step by step."
- Use the visitor's name only after they offer it. Never invent one.
- Never lecture. Orient, don't advise.
- Mirror the visitor's language (en/nl/fr).
- During intake, the goal is to gently gather: what happened, when,
  who is involved, where (jurisdiction), and any documents. Ask for
  the next missing piece naturally, not as an interrogation.
```

### 1.2 Persona variants

Five behavioural roles share the same prime directive. Swap by
`NeoPersonaType`:

| Type | Role | Temp | Voice cue |
|---|---|---|---|
| `intake_concierge` *(default)* | Greet, gather scope, route | 0.2 | Warm, one-question-at-a-time |
| `classifier` | Map wording → practice area label | 0.1 | No prose, pure label |
| `evidence_document` | Document-handling guard | 0.2 | Polite refusal + redirect |
| `urgency_risk` | Urgency triage | 0.1 | Calm, surfaces office line |
| `specialist_handoff` | Non-confidential handoff summary | 0.3 | Brief, factual |

### 1.3 Display identity

```ts
ASSISTANT_PERSONA = {
  displayName: "NEO",
  displayRole: "Orientation assistant · {{ORG_NAME}}",
  systemPrompt: LegalPersonas.intake_concierge.systemPrompt,
};
```

---

## 2. The reply structure — *the shape of every NEO message*

Every assistant message is built from the **same six slots**, joined into a
narrow Markdown string. This is what makes the chat feel premium and
consistent across hundreds of turns.

```
┌──────────────────────────────────────────────────────────────┐
│ 1. opener           (tone-aware acknowledgement, 1 sentence) │
│ 2. bridge           (one-line: "Here is what I can confirm…")│
│                                                              │
│ 3. body             **KB-Title** — body sentence.            │
│                     · _Sub-Title_ — supporting sentence.     │
│                     · _Sub-Title_ — supporting sentence.     │
│                                                              │
│ 4. → nextStep       (only when relevant: contact/page/url)   │
│                                                              │
│ 5. _boundary_       (one italic line — NEO's scope boundary) │
│                                                              │
│ 6. > disclaimer     (only when factual claims were made)     │
└──────────────────────────────────────────────────────────────┘
```

### 2.1 The renderer expects exactly this Markdown subset

| Token | Meaning | Rendered as |
|---|---|---|
| `**bold**` | Strong, ink colour | `<strong>` |
| `_italic_` | Emphasis, mist colour | `<em>` |
| `> ...` (line prefix) | Disclaimer block | bronze hairline-left blockquote, italic, smaller |
| `→ ...` (line prefix) | Next-step bullet | bronze arrow + medium-weight ink line |
| `· ...` (line prefix) | KB sub-hit bullet | bronze middot + mist text |
| (empty line) | Paragraph break | small spacer |
| `<p>`/raw HTML | **Forbidden** | rejected by renderer |

> No raw HTML is ever rendered. No `<a>` inside body text — citations live
> in their own UI surface beneath the bubble.

### 2.2 Three tone profiles

Every intent maps to a tone, and every tone has localised opener + bridge:

```ts
TONE_PROFILES = {
  professional_empathetic: {
    opener: { en: "Thank you for sharing that.",
              nl: "Dank u voor uw bericht.",
              fr: "Merci pour votre message." },
    bridge: { en: "Here is what I can confirm from the office's published material:",
              nl: "Dit kan ik bevestigen op basis van het gepubliceerde materiaal van het kantoor:",
              fr: "Voici ce que je peux confirmer à partir du matériel publié du cabinet :" },
  },
  clear_direct: {
    opener: { en: "Acknowledged.",   nl: "Begrepen.",   fr: "Bien reçu." },
    bridge: { en: "Direct facts from the firm's site:",
              nl: "Directe feiten van de website van het kantoor:",
              fr: "Faits directs depuis le site du cabinet :" },
  },
  calm_reassuring: {
    opener: { en: "Take a moment — you are in the right place.",
              nl: "Neem even de tijd — u bent hier op de juiste plek.",
              fr: "Prenez un moment — vous êtes au bon endroit." },
    bridge: { en: "Here is calm, factual orientation from what the office publishes:",
              nl: "Hier is een rustige, feitelijke oriëntatie op basis van wat het kantoor publiceert:",
              fr: "Voici une orientation calme et factuelle basée sur ce que le cabinet publie :" },
  },
};
```

### 2.3 Boundary line (italic, always last meaningful line)

```
en: NEO offers general orientation grounded only in {{ORG_NAME}}'s published material — not professional advice.
nl: NEO geeft algemene oriëntatie op basis van het gepubliceerde materiaal van {{ORG_NAME}}. Geen professioneel advies.
fr: NEO fournit une orientation générale basée sur le matériel publié de {{ORG_NAME}}. Pas de conseil professionnel.
```

### 2.4 Disclaimer (only when KB was hit)

```
en: {{ORG_NAME}} does not commit to any specific result but will make every effort to achieve the best possible outcome.
nl: Disclaimer: {{ORG_NAME}} verbindt zich niet aan een specifiek resultaat, maar zal alle inspanningen leveren om het best mogelijke resultaat te bereiken.
fr: Avertissement : {{ORG_NAME}} ne s'engage à aucun résultat spécifique, mais mettra tout en œuvre pour obtenir le meilleur résultat possible.
```

### 2.5 Worked example — what the user actually sees

User: *"how do I reach the office?"*

```
Acknowledged.
Direct facts from the firm's site:

**Reaching the office** — General office line: {{PHONE}}. Email: {{EMAIL}}. Address: {{ADDRESS}}.
· _Office and approach_ — The office describes itself as dynamic and growing, located in the heart of {{CITY}}. Clients are involved in major decisions; the organisation emphasises care and clear guidance.

→ Office line: {{PHONE}} · {{EMAIL}} · {{ADDRESS}}.

_NEO offers general orientation grounded only in {{ORG_NAME}}'s published material — not professional advice._

> {{ORG_NAME}} does not commit to any specific result but will make every effort to achieve the best possible outcome.
```

After it streams in, the panel also shows up to 3 follow-up chips
("Who is on the team?", "Speak with a specialist", …) and the citation row
("Reaching the office") under the bubble.

---

## 3. The intelligence pipeline

### 3.1 Language detection (no library, pure regex)

```ts
function detectLanguage(text: string): "en" | "nl" | "fr" {
  const t = (text || "").toLowerCase();
  if (!t.trim()) return "en";
  const dutchHits  = /(\bde\b|\bhet\b|\been\b|\bik\b|\bjullie\b|advocaat|kantoor|vraag|hallo|goedemiddag|alstublieft|graag|dank u)/.test(t);
  const frenchHits = /(\bje\b|\bvous\b|\bnous\b|bonjour|avocat|cabinet|merci|s'il vous plait|aide|demande)/.test(t);
  if (frenchHits && !dutchHits) return "fr";
  if (dutchHits) return "nl";
  return "en";
}
```

### 3.2 Intent detection (tiered, first match wins)

Order matters — earlier rules outrank later ones.

```ts
type NeoIntent =
  | "greeting" | "contact_request" | "scope_question" | "lawyer_question"
  | "office_question" | "privacy_question" | "document_question"
  | "urgency_signal" | "clarification" | "out_of_scope" | "general";

function detectIntent(message: string): NeoIntent {
  const m = (message || "").toLowerCase().trim();
  if (!m) return "general";
  if (/^(hi|hello|hey|good (morning|afternoon|evening)|hallo|goeden?dag|bonjour|salut)\b/.test(m)) return "greeting";
  if (/(call|phone|telephone|tel\.?|email|e-?mail|address|appointment|book|reach|contact|opbellen|bellen|afspraak|prendre rendez|courriel|appel|joindre)/i.test(m)) return "contact_request";
  if (/(privacy|gdpr|avg|cookie|data protection|dpo|données|protection des données|persoonsgegevens)/i.test(m)) return "privacy_question";
  if (/({{TEAM_MEMBER_1}}|{{TEAM_MEMBER_2}}|partner|team|who works|qui travaille|wie werkt|staff|about you|about the office|kantoor|cabinet|address|locatie|hours)/i.test(m)) return "office_question";
  if (/(document|contract|paper|sign|review|upload|piece|stuk|attachment|annexe)/i.test(m)) return "document_question";
  if (/(deadline|urgent|today|tomorrow|summons|dagvaarding|police|politie|arrested|arrestation|jail|gevangenis|hearing|audience|delay)/i.test(m)) return "urgency_signal";
  if (/(service|practice|do you handle|do you do|family|divorce|criminal|civil|commercial|employment|real estate|property|traffic|debt|liability|rental|location|building|construction|residence|abode)/i.test(m)) return "scope_question";
  if (/(another lawyer|second opinion|other firm|us law|american|french law|tax in|notar)/i.test(m)) return "out_of_scope";
  if (/(\?|how|why|what|when|where|wat |hoe |waarom |wanneer |comment|pourquoi|quand)/i.test(m)) return "clarification";
  return "general";
}
```

### 3.3 Intent → tone

```ts
function selectTone(intent: NeoIntent): NeoTone {
  switch (intent) {
    case "urgency_signal":  return "calm_reassuring";
    case "contact_request":
    case "out_of_scope":    return "clear_direct";
    default:                return "professional_empathetic";
  }
}
```

### 3.4 Eight specialist agents — *first keyword hit wins*

Order is the routing priority. `auto` mode runs `routeAgent()`; otherwise the
caller can pin any of these.

```ts
NEO_AGENTS = [
  { id: "contact-router",  tier: "routing",     keywords: ["call","phone","telephone","email","e-mail","mail ","address","visit","reach","contact","appointment","instruct","mobile","tel"] },
  { id: "policy-helper",   tier: "reference",   keywords: ["privacy","gdpr","avg","data","cookies","rights","dpo"] },
  { id: "office-navigator",tier: "routing",     keywords: ["office","team","staff","{{TEAM_MEMBER_1}}","{{TEAM_MEMBER_2}}","{{CITY}}","location","about"] },
  { id: "document-helper", tier: "orientation", keywords: ["contract","document","paper","sign","review","upload"] },
  { id: "services-guide",  tier: "orientation", keywords: ["service","services","practice","commercial","criminal","civil","family","employment","traffic","real estate","property","rental","debt","collection","liability"] },
  { id: "knowledge-finder",tier: "reference",   keywords: ["search","find","kb","knowledge","lookup","where is"] },
  { id: "intake-assistant",tier: "routing",     keywords: ["help","problem","urgent","first step","new client","not sure"] },
  { id: "legal-guide",     tier: "orientation", keywords: ["law","legal","court","procedure","rights","claim","lawsuit","judge"] }, // fallback
];

function routeAgent(text: string) {
  const q = text.toLowerCase();
  for (const a of NEO_AGENTS) if (a.keywords.some(k => q.includes(k))) return a.id;
  return "legal-guide";
}
```

### 3.5 KB grounding (the rule: never invent)

```ts
function scoreEntry(query: string, e: KbEntry): number {
  const q = query.trim().toLowerCase(); if (!q) return 0;
  let s = 0; const hay = `${e.title} ${e.body} ${e.tags.join(" ")}`.toLowerCase();
  if (e.title.toLowerCase().includes(q)) s += 6;
  if (e.tags.some(t => t.includes(q) || q.includes(t))) s += 4;
  for (const w of q.split(/\s+/).filter(w => w.length > 2)) if (hay.includes(w)) s += 2;
  if (e.body.toLowerCase().includes(q)) s += 3;
  return s;
}

function searchKb(query: string, limit = 5): KbEntry[] {
  return entries.map(e => ({e, s: scoreEntry(query, e)}))
    .filter(x => x.s > 0).sort((a,b) => b.s-a.s).slice(0, limit).map(x => x.e);
}
```

If the user typed something too short or generic, ground by intent keyword
instead, so we never fail to ground:

```ts
const seedQuery = message.trim().length >= 4 ? message : ({
  greeting:          "office orientation team",
  contact_request:   "contact phone email address",
  office_question:   "team office {{CITY}}",
  scope_question:    "services practice areas",
  privacy_question:  "privacy gdpr dpo",
  document_question: "document contract review",
  urgency_signal:    "urgent contact specialist",
  out_of_scope:      "results disclaimer",
}[intent] ?? "services team contact");
```

Then prefer entries whose `primaryAgent === routedAgent`, fall back to the
plain top-3.

### 3.6 The contact-info rule

Phone/email/address are **never inlined unless explicitly asked**:

```ts
function contactInfoAllowed(intent, routedAgent) {
  return intent === "contact_request"
      || intent === "urgency_signal"
      || routedAgent === "contact-router";
}
const hitsForBody = allowContact ? hits : hits.filter(h => h.id !== "contact-general");
```

### 3.7 KB entry shape

```ts
interface KbEntry {
  id: string;             // stable slug
  title: string;          // becomes **bold** lead in body
  tags: string[];         // boosted in scoring
  body: string;           // 1–3 sentences, fact-only
  href: string | null;    // optional citation link
  primaryAgent: string;   // routes prefer their own entries
}
```

Reference entries (the full set lives in `data/neo-kb.json`):

```json
[
  { "id": "contact-general", "title": "Reaching the office",
    "tags": ["contact","phone","email","call","reach","appointment"],
    "body": "General office line: {{PHONE}}. Email: {{EMAIL}}. Address: {{ADDRESS}}.",
    "href": "/contact", "primaryAgent": "contact-router" },
  { "id": "team-overview", "title": "The team",
    "tags": ["team","staff","who","{{TEAM_MEMBER_1}}","{{TEAM_MEMBER_2}}","partner"],
    "body": "{{TEAM_DESCRIPTION}}",
    "href": "/team", "primaryAgent": "office-navigator" },
  { "id": "services-scope", "title": "Services offered",
    "tags": ["services","practice","{{SERVICE_TAG_1}}","{{SERVICE_TAG_2}}","{{SERVICE_TAG_3}}"],
    "body": "{{ORG_NAME}} {{SERVICES_DESCRIPTION}}",
    "href": "/services", "primaryAgent": "services-guide" }
  /* …extend per project… */
]
```

### 3.8 The reply builder (verbatim)

```ts
export function buildLegalReply(args: {
  intent: NeoIntent; tone: NeoTone; locale: Locale;
  hits: KbEntry[]; routedAgent: string;
}): LegalReplyParts {
  const { intent, tone, locale, hits } = args;
  const profile = TONE_PROFILES[tone];

  const opener = profile.opener[locale];
  const bridge = profile.bridge[locale];

  const lead = hits[0];
  const support = hits.slice(1, 3);

  let body: string;
  if (lead) {
    body = `**${lead.title}** — ${lead.body}`;
    if (support.length > 0) {
      body += "\n\n" + support.map(h => `· _${h.title}_ — ${h.body}`).join("\n");
    }
  } else {
    body = locale === "nl"
      ? "Ik vond geen exact gepubliceerd citaat. Veiliger is om uw vraag rechtstreeks aan een advocaat van het kantoor voor te leggen."
      : locale === "fr"
        ? "Je n'ai pas trouvé de citation publiée précise. Il est plus prudent de poser votre question directement à un avocat du cabinet."
        : "I could not find an exact published citation. The safest path is to put your question directly to a lawyer at the office.";
  }

  const boundary = neoBoundaryLine(locale);

  let nextStep: string | undefined;
  if (intent === "contact_request") {
    nextStep = publicContactLine(locale);
  } else if (intent === "urgency_signal") {
    nextStep = locale === "nl" ? `Voor tijdgevoelige zaken: bel het kantoor op ${PHONE}.`
            : locale === "fr"  ? `Pour les affaires urgentes : appelez le cabinet au ${PHONE}.`
            :                    `For time-sensitive matters, call the office at ${PHONE}.`;
  } else if (intent === "out_of_scope") {
    nextStep = /* localised "consult a specialist" line */;
  } else if (lead?.href) {
    nextStep = /* localised "Next step: open <page>" line from routeLabel() */;
  }

  const disclaimer = lead ? DISCLAIMER[locale] : undefined;
  return { opener, bridge, body, boundary, nextStep, disclaimer };
}

export function renderLegalReply(p: LegalReplyParts): string {
  const out = [p.opener, p.bridge, "", p.body];
  if (p.nextStep) out.push("", `→ ${p.nextStep}`);
  out.push("", `_${p.boundary}_`);
  if (p.disclaimer) out.push("", `> ${p.disclaimer}`);
  return out.filter(Boolean).join("\n");
}
```

### 3.9 Follow-up chips (always 1–3, never invented)

```ts
function suggestFollowUps({intent, hits, locale}) {
  const out = [];
  // 1. KB-driven (one chip per supporting hit)
  for (const h of hits.slice(1, 3)) {
    out.push({ id: `kb-${h.id}`, label: trim(h.title, 38),
      prompt: locale === "nl" ? `Vertel mij meer over: ${h.title}`
            : locale === "fr" ? `Dites-m'en plus sur : ${h.title}`
            :                   `Tell me more about: ${h.title}` });
  }
  // 2. Intent-driven (lawyer-list, publish-areas, ask-contact, dpo …)
  // 3. Always offer "Speak with a lawyer" as the human handoff if room remains
  return out.slice(0, 3);
}
```

### 3.10 Intake ladder (the warm "next missing fact" question)

Only fires while `state ∈ { DRAFT_DISCOVERY, DRAFT_CASE_BUILDING }` and the
intent is *not* `contact_request | out_of_scope`. Picks the first missing
fact in this order: **issue → timeline → parties → location → documents**.

```ts
const PROMPTS = {
  issue:     { en: "Could you tell me, in your own words, what's going on?",
               nl: "Kunt u in uw eigen woorden vertellen wat er aan de hand is?",
               fr: "Pourriez-vous me raconter, avec vos propres mots, ce qui se passe ?" },
  timeline:  { en: "Roughly when did this start, or when did the last thing happen?",
               nl: "Wanneer is dit ongeveer begonnen, of wanneer is het laatste gebeurd?",
               fr: "À peu près quand est-ce que cela a commencé, ou quand le dernier fait s'est-il produit ?" },
  parties:   { en: "Who else is involved — a person, a company, an institution?",
               nl: "Wie is er nog betrokken — een persoon, een bedrijf, een instelling?",
               fr: "Qui d'autre est impliqué — une personne, une entreprise, une institution ?" },
  location:  { en: "Where did this take place — {{CITY}}, somewhere else in {{COUNTRY}}?",
               nl: "Waar is dit gebeurd — {{CITY_NL}}, ergens anders in {{COUNTRY_NL}}?",
               fr: "Où cela s'est-il passé — {{CITY_FR}}, ailleurs en {{COUNTRY_FR}} ?" },
  documents: { en: "Anything in writing — letters, contracts, emails? Drop them here whenever you're ready.",
               nl: "Heeft u iets op papier — brieven, contracten, e-mails? Laat het hier vallen wanneer u klaar bent.",
               fr: "Avez-vous des écrits — lettres, contrats, courriels ? Déposez-les ici quand vous êtes prêt." },
};
```

Adaptive batching rule: if the user wrote ≥18 words and isn't stressed, two
linked questions may be combined; otherwise always exactly one question.

### 3.11 Metacognition (drives readiness + ladder)

```ts
function evaluateMetacognition(state, messages, files) {
  const text = messages.filter(m => m.role==="user")
                       .map(m => m.content_redacted).join(" ").toLowerCase();
  const hasTimeline = /\b(ago|last|year|month|week|day|date|when|since|before|after)\b/.test(text);
  const hasParty    = /\b(company|person|employer|landlord|tenant|spouse|partner|bank|insurance|government)\b/.test(text);
  const hasLocation = /\b({{CITY}}|{{COUNTRY}}|{{REGION_1}}|{{REGION_2}}|court|office)\b/.test(text);
  const hasAmount   = /\b(\d+[\.,]?\d*\s*(euro|eur|€|usd|\$)|\d{3,})\b/.test(text);
  const knownFacts  = [hasTimeline,hasParty,hasLocation,hasAmount,files.length>0].filter(Boolean).length;
  return { knownFacts,
    missingCritical: [!hasTimeline && "Timeline or dates of events",
                      !hasParty   && "Parties involved",
                      messages.filter(m=>m.role==="user").length<2 && "Core problem description"].filter(Boolean),
    uncertaintyLevel: knownFacts>=4 ? "LOW" : knownFacts>=2 ? "MEDIUM" : "HIGH",
    summaryCompleteness: Math.min(100, Math.round((knownFacts/5)*100)),
  };
}
```

### 3.12 Optional swarm receipt (UX badge only — fully offline-safe)

The composer simulates a 3-node swarm cascade
(`gemini-1.5-flash → claude-3-haiku → gpt-4o-mini`) for telemetry/UI
("Online" / "Routing…" / "Replying from cache"). It **never blocks** the
reply — the deterministic composer above already produced the text. Health
state with 60s cooldown after 3 consecutive failures is tracked in memory.

If you don't want the badge, just emit `mode: "standard", provider: "static_fallback"`.

### 3.13 Message Normalizer (Human-to-AI Translator)

**File:** `lib/neo/message-normalizer.ts` (~305 lines)

Pre-processes raw user input before it reaches the prompt compiler.
Purely deterministic — no LLM call, no network. Runs in-browser.

**What it does:**

1. **Strip noise** — collapses excess whitespace, repeated punctuation, excess newlines.
2. **Expand abbreviations** — maps 30+ domain-specific abbreviations to full form (e.g. `bvba → besloten vennootschap met beperkte aansprakelijkheid`). **Replace with your domain's abbreviation map.**
3. **Extract entities** — dates, financial amounts, document types, party names, locations, legal concepts — all via regex, zero LLM.
4. **Detect code-switching** — flags when the visitor mixes languages (e.g. NL+FR).
5. **Build annotation block** — a structured text summary injected into the prompt compiler's `<translator_analysis>` section.

```ts
export interface NormalizedMessage {
  cleaned: string;           // noise-stripped, abbreviations expanded
  raw: string;               // original untouched input
  entities: ExtractedEntities;
  detectedLanguages: Locale[];
  annotationBlock: string;   // ready for prompt injection
}

export interface ExtractedEntities {
  dates: string[];
  amounts: string[];
  documentTypes: string[];   // e.g. "compromis (pre-sale agreement)"
  partyNames: string[];
  locations: string[];
  legalConcepts: string[];   // e.g. "vruchtgebruik (usufruct)"
}

export function normalizeMessage(raw: string): NormalizedMessage;
```

**Entity pattern categories:**

| Category | Examples | Patterns |
|---|---|---|
| Dates | `12/03/2024`, `vorige maand`, `2 jaar geleden` | 4 regex groups |
| Amounts | `€150.000`, `EUR 200,00`, `150000 euro` | 4 regex groups |
| Document types | `compromis`, `schenkingsakte`, `testament`, `volmacht` | 17 labelled patterns (NL/FR/EN) |
| Locations | `{{CITY}}`, `{{CAPITAL}}`, `{{REGION}}` | 4 regex groups |
| Legal concepts | `registratierechten`, `vruchtgebruik`, `erfpacht` | 13 labelled patterns (NL/FR/EN) |

**Porting rule:** When swapping to a different domain, replace the abbreviation map, document type patterns, and domain-specific concept patterns with your domain's vocabulary. The normalizer structure stays identical.

### 3.14 Advisory Engine

**File:** `lib/neo/advisory-engine.ts` (~443 lines)

Provides **light procedural orientation guidance** — document checklists, public fee indications, and escalation advice — without giving binding legal advice. Every entry is trilingual (NL/EN/FR).

```ts
export interface AdvisoryGuidance {
  category: string;             // e.g. "Aankoop vastgoed (compromis)"
  proceduralSteps: string;      // numbered step list, Markdown-formatted
  documentChecklist: string[];  // docs the visitor should prepare
  feeOrientation: string;       // public fee indication (not a quote)
  escalationAdvice: string;     // "contact the specialist for…"
}

export function lookupAdvisory(
  userMessage: string,
  documentTypes: string[],   // from message-normalizer
  legalConcepts: string[],   // from message-normalizer
  locale: Locale,
): AdvisoryGuidance | null;

export function formatAdvisoryBlock(
  advisory: AdvisoryGuidance,
  locale: Locale,
): string;  // → injected into prompt compiler's <advisory_guidance> section
```

**Built-in advisory domains (example — replace with your domain's topics):**

| Domain | Keywords |
|---|---|
| Property purchase (compromis) | `compromis`, `kopen`, `huis kopen`, `buying`, `acheter` |
| Donation (schenkingsakte) | `schenking`, `donation`, `gift`, `doneren` |
| Marriage contract | `huwelijkscontract`, `contrat de mariage` |
| Testament / Will | `testament`, `will`, `uiterste wil` |
| Succession / Inheritance | `erfenis`, `nalatenschap`, `succession` |
| Cohabitation | `samenlevingscontract`, `cohabitation` |
| Company formation | `oprichting`, `company formation` |
| Sale with repurchase right | `wederinkoop`, `réméré`, `repurchase` |

**Porting rule:** Replace the `ADVISORY_KB` entries with your domain's procedural knowledge. Structure per entry stays the same: `keywords[]` + `guidance.{nl,en,fr}.{category, proceduralSteps, documentChecklist, feeOrientation, escalationAdvice}`.

### 3.15 Prompt Compiler

**File:** `lib/neo/prompt-compiler.ts` (~155 lines)

Assembles the system prompt, KB context, translator annotations, advisory guidance, conversation history, and output rules into a single XML-sectioned prompt string for FREE AI inference.

```ts
export interface CompilePromptInput {
  systemPrompt: string;
  locale: Locale;
  tone: NeoTone;
  routedAgent: string;
  intent: string;
  userMessage: string;
  kbHits: KbEntry[];
  metacogSummary?: { knownFacts: string[]; missingCritical: string[]; uncertaintyLevel: string };
  messageHistory?: { role: string; content: string }[];
  translatorAnnotations?: string;   // from message-normalizer
  advisoryContext?: string;         // from advisory-engine
}

export function compilePrompt(input: CompilePromptInput): string;
```

**Prompt sections (in order):**

1. `<system>` — the prime directive
2. `<language_rule>` — strict locale instruction
3. `<tone>` — tone instruction based on detected intent
4. `<agent_context>` — routed agent role + detected intent
5. `<approved_knowledge_base>` — grounded KB hits (MUST ground, never invent)
6. `<metacognition>` — known facts, missing critical, uncertainty level
7. `<translator_analysis>` — entity annotations from message-normalizer
8. `<advisory_guidance>` — procedural orientation from advisory-engine
9. `<conversation_history>` — last 6 turns
10. `<user_message>` — current message
11. `<output_rules>` — formatting constraints (language, italics, word limit, no proactive contact)

**Porting rule:** Keep the section structure verbatim. Swap the system prompt content via `persona.ts`, the locale instructions via the `LOCALE_INSTRUCTION` map, and the tone instructions via `TONE_INSTRUCTION` map.

### 3.16 FREE AI Bridge

**File:** `lib/neo/freeai-bridge.ts` (~134 lines)

Connects NEO to the FREE AI swarm orchestrator for **live LLM inference**. Falls back gracefully when the orchestrator is unreachable.

```ts
export async function callFreeAI(
  compiledPrompt: string,
  persona?: string,
): Promise<FreeAIInferResult>;

export async function isFreeAIAvailable(): Promise<boolean>;
```

**Behaviour:**

- Calls `POST {FREEAI_BASE_URL}/v1/infer` with the compiled prompt.
- 25-second timeout with `AbortController`.
- Response shape is normalised across FREE AI versions (`body.text || body.output || text || output`).
- On success: returns `{ ok: true, text, provider_id, model_id, fallback_used }`.
- On failure (timeout, ECONNREFUSED, HTTP error): returns `{ ok: false, text: "", error }` — **never throws**.
- Health probe: `GET {FREEAI_BASE_URL}/health/live` with 3-second timeout.

**Environment:** `NEXT_PUBLIC_FREEAI_URL` or `FREEAI_URL` (default: `http://localhost:3000`).

**Porting rule:** This file is environment-specific. If your project uses a different LLM endpoint, replace `callFreeAI` with your client. The contract is: `(compiledPrompt: string) → { ok, text, error }`. The composer handles fallback.

### 3.17 Telemetry Engine

**File:** `lib/neo/telemetry.ts` (~355 lines)

Production observability for every compose–infer–respond cycle. In-memory ring buffer (500 events), structured logging, real-time dashboard aggregation.

```ts
export type TelemetryEventType =
  | "compose_start" | "compose_complete" | "compose_error"
  | "translator_hit" | "advisory_hit" | "kb_search"
  | "freeai_call" | "freeai_success" | "freeai_fail"
  | "node_cooldown" | "fallback_triggered";

export function logTelemetry(type: TelemetryEventType, data?: Record<string, unknown>, durationMs?: number): void;
export function getDashboard(): TelemetryDashboard;
export function getRecentEvents(limit?: number): TelemetryEvent[];
```

**Dashboard aggregates:**

| Metric group | Key metrics |
|---|---|
| **Swarm** | totalInferences, liveAiReplies, templateFallbacks, avgDurationMs, p95DurationMs, failureRate, provider/model/mode distribution |
| **Translator** | totalCalls, entitiesExtracted, codeSwitchDetected, topDocumentTypes, topLegalConcepts |
| **Advisory** | totalLookups, domainsMatched, guidanceInjected, hitRate, topDomains |
| **KB** | totalSearches, avgHitsPerSearch, zeroHitRate, topHitEntries |
| **Timeline** | per-minute event count + avg latency (last 30 minutes) |

**Convenience loggers:** `logComposeStart`, `logComposeComplete`, `logComposeError`, `logTranslatorHit`, `logAdvisoryHit`, `logKbSearch`, `logFreeAiCall`, `logFreeAiSuccess`, `logFreeAiFail`, `logNodeCooldown`, `logFallbackTriggered`.

**API route:** `GET /api/neo/telemetry` exposes `getDashboard()` for operator UIs.

**Porting rule:** Drop in verbatim. The event types are domain-agnostic. If you remove the advisory or translator modules, remove their corresponding log calls from `compose-reply.ts`.

### 3.18 Enforcement Pipeline

**File:** `lib/neo/enforcement-pipeline.ts` (~160 lines)

Post-compose guardrails that run **after** the reply is assembled but **before** it is sent to the UI. Every reply passes through this gate — no bypass path exists.

```ts
export interface EnforcementResult {
  passed: boolean;
  violations: string[];       // human-readable violation descriptions
  correctedText?: string;     // auto-corrected reply (boundary/disclaimer injected)
}

export function enforceReplyContract(
  text: string,
  locale: Locale,
  intent: NeoIntent,
  routedAgent: string,
  kbHitsUsed: boolean,
): EnforcementResult;
```

**Rules enforced:**

| Rule | What it asserts | Auto-fix |
|---|---|---|
| **Boundary-line presence** | The reply MUST contain the italic boundary line in the correct locale | Appends the boundary line if missing |
| **Disclaimer presence** | If KB hits were used → disclaimer block MUST exist | Appends the disclaimer if missing |
| **Contact-suppression** | If `intent ∉ {contact_request, urgency_signal}` AND `routedAgent ≠ contact-router` → reply MUST NOT contain phone/email/address | Strips contact lines from body |
| **No raw HTML** | Reply MUST NOT contain `<a>`, `<p>`, `<div>`, etc. | Strips HTML tags |
| **Word-limit** | Reply body MUST be ≤ 280 words (excluding boundary + disclaimer) | Truncates with `"…"` |

**Porting rule:** Keep verbatim. The enforcement rules are domain-agnostic — they protect the brand contract. If you add a new language, add the boundary-line detection regex for that locale.

### 3.19 Strict Intake Report Schema

**File:** `lib/neo/intake-report-schema.ts` (~42 lines)

Zod-enforced contract for the structured intake report. Every composed report MUST validate against this schema before dispatch.

```ts
export const StrictIntakeReportSchema = z.object({
  A_matter_snapshot: z.object({
    visitor_issue: z.string(),
    requested_help: z.string(),
    practice_area: z.string(),
    classification_confidence: z.enum(["HIGH", "MEDIUM", "LOW", "UNCONFIRMED"]),
    jurisdiction_status: z.string(),
    report_readiness_status: z.enum(["PARTNER_REVIEW_READY", "INTAKE_ONLY", "BLOCKED"]),
  }),
  B_confirmed_facts: z.array(z.string()),
  C_likely_unconfirmed_points: z.array(z.string()),
  D_missing_critical_facts: z.array(z.string()),
  E_timeline_extracted: z.array(z.string()),
  F_working_issue_map: z.array(z.string()),
  G_evidence_currently_available: z.array(z.string()),
  H_evidence_to_request_next: z.array(z.string()),
  I_high_value_open_questions: z.array(z.string()),
  J_delivery_status: z.enum(["validated", "blocked", "intake-only", "partner-review-ready"]),
  hard_block_status: z.boolean().nullable().optional(),
});

export type ReportStatus = "validated" | "blocked" | "invalid_extraction" | "intake_only" | "partner_review_ready";
export type PreviewMode = "validated_structured" | "blocked_state" | "none";

export interface NormalizedValidationResult {
  report_status: ReportStatus;
  hard_block_status: boolean;
  dispatch_allowed: boolean;
  preview_mode: PreviewMode;
  blocked_message?: string;
  validation_errors: string[];
  safety_reasons: string[];
  dossier: StrictIntakeReportValidated | null;
}
```

**Companion files:**

- `lib/neo/intake-report-prompt.ts` (~110 lines) — Generates the structured prompt that produces the 10-section report.
- `lib/neo/intake-report-validator.ts` (~120 lines) — Validates JSON output against `StrictIntakeReportSchema` and produces `NormalizedValidationResult`.

**Porting rule:** The 10-section structure (A–J) is domain-agnostic. Replace `practice_area` labels with your domain's taxonomy. The `hard_block_status` and `dispatch_allowed` gates remain unchanged.

### 3.20 Dossier Safety Checks

**File:** `lib/neo/dossier-safety-checks.ts` (~120 lines)

Pre-dispatch validation that runs before a dossier reaches a professional. This is the last gate before human handoff.

```ts
export interface SafetyCheckResult {
  safe: boolean;
  issues: SafetyIssue[];
}

export interface SafetyIssue {
  severity: "BLOCK" | "WARN";
  code: string;          // e.g. "PII_LEAK", "INCOMPLETE_CONSENT", "EMPTY_TRANSCRIPT"
  message: string;
}

export function runDossierSafetyChecks(dossier: CaseDossier, consents: ConsentSet): SafetyCheckResult;
```

**Checks performed:**

| Check | Severity | What it catches |
|---|---|---|
| PII-leak scan | BLOCK | Social security numbers, credit card patterns in the transcript |
| Consent completeness | BLOCK | Missing `rep_understanding`, `info_auth`, or `use_consent` |
| Empty transcript | BLOCK | Dossier with zero user messages |
| Missing core facts | WARN | No timeline, no parties, no issue description |
| File malware status | BLOCK | Any uploaded file with `malware_status !== "clean"` |

**Porting rule:** Add domain-specific PII patterns (e.g. medical record numbers for healthcare). The consent gate is universal.

### 3.21 Swarm Reviewer

**File:** `lib/neo/swarm-reviewer.ts` (~85 lines)

Manages the 3-node inference cascade and health tracking for the FREE AI bridge.

```ts
export interface SwarmNodeStatus {
  nodeId: string;         // e.g. "gemini-1.5-flash"
  healthy: boolean;
  consecutiveFailures: number;
  cooldownUntil: number | null;  // epoch ms
  lastLatencyMs: number | null;
}

export function reviewSwarmHealth(): SwarmNodeStatus[];
export function recordNodeSuccess(nodeId: string, latencyMs: number): void;
export function recordNodeFailure(nodeId: string): void;
export function isNodeAvailable(nodeId: string): boolean;
export function getPreferredNode(): string | null;
```

**Behaviour:**

- After **3 consecutive failures** on a node → 60-second cooldown.
- Cascade order: `gemini-1.5-flash → claude-3-haiku → gpt-4o-mini`.
- If all nodes are in cooldown → `getPreferredNode()` returns `null` → composer uses deterministic fallback.
- Status reported in the panel header: "Online" / "Routing…" / "Replying from cache".

**Porting rule:** Replace the three node IDs with whatever models your FREE AI swarm serves. The cascade logic stays.

### 3.22 Session State Management

**File:** `lib/neo/session-state.ts` (~80 lines)

Centralised `localStorage` persistence and pruning for conversation state.

```ts
export const NEO_STORAGE_KEYS = {
  sidebarOpen: "neo_sidebar_open_v1",
  panelWidth:  "neo_panel_width_v1",
  messages:    "neo_messages_v4",
  meta:        "neo_meta_v4",
  files:       "neo_files_v2",
  state:       "neo_state_v2",
} as const;

export function loadSessionState(): PersistedNeoState;
export function saveSessionState(state: PersistedNeoState): void;
export function pruneMessages(messages: IntakeMessage[], maxCount?: number): IntakeMessage[];
export function clearSession(): void;
```

**Pruning rules:**

- Messages pruned to **last 50** on every save.
- Meta entries pruned to match surviving message IDs.
- Files list pruned to last 10 entries.
- State machine position is always persisted (survives page reload).

**Porting rule:** Keep all key names verbatim. If you rename keys, existing users lose their conversation on upgrade — always migrate rather than rename.

---

## 4. The streaming feel — *how the letters arrive*

### 4.1 Cadence rules (NeoTypewriter)

```ts
const step = text.length > 600 ? 6 : text.length > 320 ? 4 : text.length > 140 ? 3 : 2; // chars/tick
const intervalMs = 14;                                  // base tick
const jitter = () => 1 + (Math.random() - 0.5) * 0.3;   // ±15% per tick

const pauseAfter = (ch) =>
  ch === "." || ch === "!" || ch === "?" ? 220 :
  ch === "\n"                            ? 160 :
  ch === "," || ch === ";" || ch === ":" ?  90 : 0;
```

Behaviour:
- Honours `prefers-reduced-motion` → instant reveal.
- Click anywhere on the bubble → skip to the end (`"Tap to reveal the full reply"`).
- Wraps the **same** `NeoRichText` so Markdown materialises *as it arrives*
  (the `> disclaimer` becomes a hairline blockquote mid-stream, the `→`
  bullet sprouts an arrow, etc.).
- Trailing **bronze caret** during streaming:
  `<span class="ml-0.5 inline-block h-[0.95em] w-[2px] -mb-[2px] align-middle bg-orech-bronze/80 motion-safe:animate-pulse" />`

### 4.2 Why character-level (not token-level)?

Because the composer returns the full string locally in a single shot.
Letter-by-letter reveal at the UI layer gives the same human-typing feel
without needing a streaming backend. If you *do* have a streaming LLM,
just feed each chunk through the same component — set `revealed` to the
arrived prefix length on every chunk.

### 4.3 The typing indicator (before the bubble appears)

While `isGenerating` is true and no bubble has rendered yet:

```
●  ●  ●     Thinking…
```

Three pulsing bronze dots + an italic mist hint chosen per turn:

```ts
typingHint = files.length>0 && lastUser.length<80 && assistantCount<=1
  ? "Reading your file…"
  : lastUser.length>280
    ? "Reading your message…"
    : ["Thinking…","Putting that together…","Writing back…"][messages.length % 3];
```

---

## 5. The shell — *the geometry around the chat*

### 5.1 Anatomy

```
                                                  ┌─ vertical rail launcher
                                                  │   "Neo AI" written ⌘
                                                  │   right edge, top:50%
                                                  │   transform-y: -50%
                                                  │   z-index: 80
                                                  ▼
   ┌──────────────────────────────────────────────┬──┐
   │                                              │  │
   │           main page content                  │N │
   │                                              │e │
   │                                              │o │
   │                                              │  │
   │                                              │A │
   │                                              │I │
   │                                              │  │
   └──────────────────────────────────────────────┴──┘

   When OPEN (lg+): a fixed right-hand panel slides in from the right
   (translateX(100%) → 0). Width is user-resizable on a left-edge drag
   handle, persisted to localStorage("neo_panel_width_v1").

   ┌────────────────────────────────────┬─────────┐
   │                                    │┌─ NEO ──│  ← header: status dot
   │   page content (pushed left by     ││ Online │     · italic name
   │   body.neo-hub-open padding)       │├────────│     · ⤢ Case Room
   │                                    ││ msgs   │     · New / × close
   │                                    ││ ↓ pinned
   │                                    ││ to bottom
   │                                    │├────────│
   │                                    ││ ◎  composer  ➤
   │                                    │└────────│
   └────────────────────────────────────┴─────────┘
```

Constants:

```ts
const PANEL_WIDTH_KEY  = "neo_panel_width_v1";
const PANEL_MIN_W      = 380;
const PANEL_DEFAULT_W  = 420;
const PANEL_MAX_VW_RESERVE = 120;  // never let the panel cover the whole vp
```

Mobile: panel becomes a full-height overlay (right: 52px so the rail
remains tap-able), backdrop dims the page, body scroll locks. Keyboard
`Esc` closes; close button refocuses the rail for screen readers.

### 5.2 Three streaming-state visual cues

| State | Status dot | Subtitle | Caret in bubble |
|---|---|---|---|
| Idle | emerald, slow pulse | "Online" | — |
| Generating | bronze, fast ping | "Typing…" | bronze blinking pipe |
| Degraded | amber, no animation | "Replying from cache" | — |

### 5.3 Layout rule that pins the empty state to the bottom

Otherwise the welcome greeting floats at the top of an empty panel — wrong
visual rhythm. The fix:

```css
.nwx-list { display: flex; flex-direction: column; min-height: 100%; }
.nwx-list > .nwx-empty:only-child { flex: 1 1 auto; }
```

The `EmptyState` itself is `flex flex-col justify-end gap-6 pb-2`.

### 5.4 Composer — what the user touches

```
┌────────────────────────────────────────────────────────────────────┐
│ 📎  📋  🎙   Write a message…                                  ➤  │
└────────────────────────────────────────────────────────────────────┘
   │   │   │                                                       │
   │   │   └─ mic: Web Speech API (en-US/nl-BE/fr-BE), interim+final
   │   └──── paste: opens "paste evidence as text" → exhibit pasted-evidence-NNN.txt
   └──────── attach: pdf/jpg/png/doc/docx/xls/xlsx/txt; ≤25MB; ≤10 files
```

Composer rules:
- `<textarea rows=1 max-h-32 resize-none>`, max 1500 chars hard cap.
- Enter sends, Shift+Enter newline, IME-composing safe (`!isComposing`).
- Voice: click mic to start; chunks update as user speaks; voice-originated
  user bubbles render with a small mic glyph next to the text.
- Drag-and-drop a file anywhere on the panel → bronze dashed overlay
  ("Drop documents to attach"). Files chip below the composer.
- Submit button disabled when generating or input is empty.

---

## 6. Design tokens — *the look*

```ts
// Tailwind theme.extend.colors.orech
ink:        "#181412"       // text-on-paper
paper:      "#F6F4EE"       // premium cream background
slate:      "#EDEAE0"       // warm ivory surface (header strip)
mist:       "#56514B"       // body mist (secondary text)
line:       "#D9D5CB"       // hairline borders
bronze:     "#9A6B1F"       // single accent — one element per viewport max
bronzeMuted:"#C49A5A"
gold:       "#B8870B"       // legacy highlight
lineSoft:   "rgba(24,20,18,0.08)"

// And the dark NEO tones for the panel chrome on dark variants:
neo.panel:   "#181412"
neo.surface: "#26211D"
neo.border:  "#3F3A34"
neo.accent:  "#9A6B1F"
neo.muted:   "rgba(246,244,238,0.55)"
```

Type stack (load via `next/font` or `@font-face`):

```
font-display        : Playfair Display       (light/regular, headlines)
font-display-italic : Cormorant Garamond Italic   ← THIS is the "academic italic"
font-prose          : Source Serif 4         (long-form body)
font-sans           : Inter                  (UI chrome only)
font-mono           : JetBrains Mono         (eyebrows, status text, "Neo AI" rail)
```

Critical CSS rules from `app/globals.css`:

```css
/* The signature italic — applied to <em> in display headings AND
   exposed as the .italic-display utility (used for "NEO" in the panel header) */
h1 em, h2 em, h3 em, .italic-display {
  font-family: var(--font-display-italic), Georgia, serif;
  font-style: italic;
  font-weight: 400;
  color: theme("colors.orech.bronze");
  letter-spacing: -0.005em;
}

/* Long-form text adopts Source Serif 4 by default; UI chrome opts out
   with explicit font-sans / font-mono on its container. */
p, blockquote, li, dd, address, figcaption {
  font-family: var(--font-prose), Charter, "Iowan Old Style", Georgia, serif;
  font-feature-settings: "kern","liga","calt","onum","ss01";
}

/* When the panel is open on lg+, push the page content left so the
   panel doesn't overlap content. */
@media (min-width: 1024px) {
  body.neo-hub-open { padding-right: 420px; }
}

/* Bronze focus ring on cream */
:focus-visible {
  @apply outline-none ring-2 ring-orech-bronze ring-offset-2 ring-offset-orech-paper;
}
::selection { background-color: rgba(154, 107, 31, 0.18); color: inherit; }
```

Easing & timing:

```ts
transitionTimingFunction.neo: "cubic-bezier(0.19, 1, 0.22, 1)"
transitionDuration.neo:       "280ms"   // panel slide
typewriter intervalMs:        14        // base tick
```

Box-shadows (the "panel feels like glass" cue):

```ts
"neo-glass":
  "-12px 0 40px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.4)"
```

---

## 7. Conversation state machine

```
DRAFT_DISCOVERY
   │  (msgs ≥ 2  OR  files > 0)
   ▼
DRAFT_CASE_BUILDING
   │  (intent clear  AND  msgs ≥ 4  AND  user hits "Proceed")
   ▼
PENDING_SUBMIT_CONFIRMATION
   │
   ▼
PENDING_EMAIL_VERIFICATION  ←— OTP / magic link / demo PIN
   │  (email verified)
   ▼
VERIFIED_READY_FOR_FINAL_REVIEW
   │  (3 consents ticked: rep_understanding, info_auth, use_consent)
   ▼
PENDING_FINAL_SUBMISSION
   │
   ▼
SUBMITTED_FOR_LEGAL_REVIEW   ──→  REVIEW_ACKNOWLEDGED
```

Other terminal states: `NEEDS_MORE_INFORMATION`, `ABANDONED`, `EXPIRED`,
`REJECTED_SYSTEM`, `REJECTED_POLICY`.

The chat surface only renders messages while in
`DRAFT_DISCOVERY | DRAFT_CASE_BUILDING`. The intake screens
(`NeoAuth → NeoSubmitReview → success card`) replace the surface in the
later states.

Readiness score is a 0–5 weighted metric exposed under the chat as a
horizontal "intake progress" bar with a "Proceed to summary" CTA when
ready.

### 7.1 Intake types & dossier structure

**File:** `lib/neo/intake-types.ts` (~104 lines)

Defines the full typed schema for the intake pipeline. Every state, message, file, verification session, submission, routing decision, and audit event has a TypeScript interface.

| Type | Purpose |
|---|---|
| `IntakeState` | 12-value union for the state machine |
| `IntakeDraft` | The in-progress case draft (status, language, readiness_score) |
| `IntakeMessage` | A single chat message (role, content_redacted, via: voice\|keyboard) |
| `IntakeFile` | Uploaded document metadata (sha256, malware_status, extraction_status) |
| `VerificationSession` | OTP / magic link session (email_hash, attempt_count, status) |
| `IntakeSubmission` | Final submission record (reference, consent_version) |
| `IntakeRouting` | Where the dossier goes (route_target, confidence, manual_review_required) |
| `IntakeAuditEvent` | Append-only audit trail (entity_type, event_type, actor) |

**File:** `lib/neo/intake-summary.ts` (~348 lines)

Builds the structured `CaseDossier` from transcript using deterministic heuristic extractors. The dossier is what the professional receives.

```ts
export interface CaseDossier {
  header: { reference_id, submitted_at, channel, verification_status };
  client: { verified_email, phone?, language, name? };
  overview: { title, summary, likely_practice_area, urgency_estimate, jurisdiction_confidence };
  facts: { chronology[], parties[], locations[], monetary_stakes[] };
  documents: { filename, mime_type, upload_status, one_liner }[];
  open_questions_for_specialist: string[];
  risk_flags: string[];
  conflict_flags: ConflictFlag[];
  transcript: { role, text, ts }[];
  readiness_provenance: ReadinessProvenance;
  missing_items: string[];
  neo_recommendation: string;
  confirmation_copy: string;
}
```

**Porting rule:** The dossier shape is domain-specific. Replace `PracticeAreaSuggestion` with your project's category taxonomy. The heuristic extractors (urgency terms, timeline patterns, party patterns) must be re-tuned for non-legal domains.

### 7.2 Multi-Channel Delivery Pipeline

**Component:** `components/neo/delivery-channel-modal.tsx` (~324 lines)

After the case file / dossier is assembled, the user can dispatch it through multiple channels. The delivery modal uses **zero-dependency browser APIs** — no server-side email infrastructure required for initial deployment.

```ts
export type DeliveryChannel =
  | "gmail" | "outlook" | "whatsapp" | "linkedin" | "copy" | "native-share";

export interface DeliveryPayload {
  markdownBody: string;      // Pre-rendered Markdown text
  subject: string;           // Human-readable subject line
  recipientEmail: string;    // Pre-filled recipient (firm's intake email)
  reference: string;         // Matter reference id
  pdfUrl?: string;           // Optional PDF download URL
  docxUrl?: string;          // Optional DOCX download URL
}
```

**Channel implementations (all client-side):**

| Channel | Browser API | URL pattern |
|---|---|---|
| **Gmail** | `window.open` | `https://mail.google.com/mail/?view=cm&to=...&su=...&body=...` |
| **Outlook** | `window.open` | `https://outlook.live.com/mail/0/deeplink/compose?to=...&subject=...&body=...` |
| **WhatsApp** | `window.open` | `https://wa.me/?text=...` |
| **LinkedIn** | `window.open` | `https://www.linkedin.com/messaging/compose/?body=...` |
| **Clipboard** | `navigator.clipboard.writeText` | Falls back to `document.execCommand("copy")` |
| **Native Share** | `navigator.share` | Mobile-first; hidden when `navigator.share` is undefined |

**UI contract:**

1. Modal overlays the case-file view with a backdrop (`bg-black/40`).
2. Six channel cards in a 2-column grid, each with icon + label + description.
3. Click → opens channel → `onDelivered(channel)` callback fires → `deliveredVia` state updates.
4. After delivery: visual ✓ badge on the chosen channel card + toast confirmation.
5. Close button (×) top-right + click-outside-to-close + Escape key.

**Integration in `neo-case-file-view.tsx`:**

The `ExportActions` component includes a "Deliver case file via…" button that opens the modal:

```tsx
<button onClick={() => setDeliveryOpen(true)} className="...">
  <Send className="h-4 w-4" /> {t("deliver_cta")}
</button>
<DeliveryChannelModal
  open={deliveryOpen}
  onClose={() => setDeliveryOpen(false)}
  payload={deliveryPayload}
  onDelivered={(ch) => { setDeliveredVia(ch); setDeliveryOpen(false); }}
/>
```

**i18n keys required (14 total):**

All delivery-related strings are namespace-gated under `Neo.*`:

```json
{
  "deliver_cta": "Deliver case file via…",
  "delivery_title": "Choose Delivery Channel",
  "delivery_subtitle": "Select how you'd like to share this case file",
  "channel_gmail": "Gmail",
  "channel_gmail_desc": "Opens Gmail compose with the case file",
  "channel_outlook": "Outlook",
  "channel_outlook_desc": "Opens Outlook compose with the case file",
  "channel_whatsapp": "WhatsApp",
  "channel_whatsapp_desc": "Share via WhatsApp message",
  "channel_linkedin": "LinkedIn",
  "channel_linkedin_desc": "Share via LinkedIn messaging",
  "channel_copy": "Copy to clipboard",
  "channel_copy_desc": "Copy full case file text to clipboard",
  "channel_share": "Native share",
  "channel_share_desc": "Use your device's share menu",
  "delivered_via": "Delivered via {channel}",
  "delivery_success": "Case file ready for delivery"
}
```

**Porting rule:** The modal is domain-agnostic. Replace `recipientEmail` with your firm's intake address. Add or remove channels as needed — the grid auto-adapts. For server-side email (Resend, SendGrid, Nodemailer), wire `onDelivered` to a server action but keep the client-side channels as fallback.

---

## 8. Multi-language behaviour matrix

| Trigger | en | nl | fr |
|---|---|---|---|
| greeting opener | "Thank you for sharing that." | "Dank u voor uw bericht." | "Merci pour votre message." |
| boundary line | "NEO offers general orientation grounded only in {{ORG_NAME}}'s published material — not professional advice." | "NEO geeft algemene oriëntatie op basis van het gepubliceerde materiaal van {{ORG_NAME}}. Geen professioneel advies." | "NEO fournit une orientation générale basée sur le matériel publié de {{ORG_NAME}}. Pas de conseil professionnel." |
| timeline question | "Roughly when did this start, or when did the last thing happen?" | "Wanneer is dit ongeveer begonnen, of wanneer is het laatste gebeurd?" | "À peu près quand est-ce que cela a commencé, ou quand le dernier fait s'est-il produit ?" |
| follow-up: "Who is on the team?" | same | "Wie zit er in het team?" | "Qui fait partie de l'équipe ?" |
| dictation locale | en-US | nl-BE | fr-BE |

Mirror the user's language reactively per turn — never override based on the
site's URL locale.

---

## 9. Copy-paste files (the entire chatroom)

> The composer + renderer + typewriter + shell + intelligence pipeline,
> in the exact order to drop into a Next.js App-Router + Tailwind project.
> Total ~28 lib files + 12 components ≈ 6,500+ lines.

### 9.1 `lib/neo/types.ts`

```ts
export interface KbEntry {
  id: string;
  title: string;
  tags: string[];
  body: string;
  href: string | null;
  primaryAgent: string;
}

export type NeoAgentId =
  | "auto" | "legal-guide" | "services-guide" | "office-navigator"
  | "document-helper" | "knowledge-finder" | "intake-assistant"
  | "contact-router" | "policy-helper";

export type NeoTier = "orientation" | "routing" | "reference";

export interface NeoAgent {
  id: Exclude<NeoAgentId, "auto">;
  label: string;
  shortLabel: string;
  description: string;
  tier: NeoTier;
  keywords: string[];
}
```

### 9.2 `lib/neo/agents.ts`

The full 8-agent table from §3.4 with `routeAgent(text)` and `agentById(id)`.

### 9.3 `lib/neo/kb-search.ts`

The `scoreEntry` + `searchKb` from §3.5.

### 9.4 `lib/neo/communication.ts`

`detectLanguage`, `detectIntent`, `selectTone`, `TONE_PROFILES`,
`neoBoundaryLine`, `isUrgent`. All functions in §3.1–3.3 + §2.2 + §2.3.

### 9.5 `lib/neo/legal-reply.ts`

`buildLegalReply`, `renderLegalReply`, `suggestFollowUps`, `publicContactLine`,
`DISCLAIMER`, `NEXT_STEP_LABELS`. Per §2.4 + §3.8 + §3.9.

### 9.6 `lib/neo/intake-questions.ts`

`nextBestQuestion`, `listOpenGaps`, `PROMPTS`, `PAIRED`, `looksStressed`.
Per §3.10.

### 9.7 `lib/neo/intake-state.ts`

`executeMarkovTransition`, `calculateReadiness`, `evaluateMetacognition`.
Per §3.11 + §7.

### 9.8 `lib/neo/persona.ts`

The `PRIME_DIRECTIVE` constant (§1.1), the 5 `LegalPersonas` (§1.2),
`LAWYER_ASSISTANT_PERSONA`, `NEO_PRODUCT`. **All verbatim.**

### 9.9 `lib/neo/compose-reply.ts` — the orchestrator

```ts
export async function composeNeoReply(opts: ReplyOptions): Promise<NeoReply> {
  const message  = opts.message || "";
  const language = (opts.locale as Locale) || detectLanguage(message);
  const intent   = detectIntent(message);
  const tone     = selectTone(intent);

  const routed = opts.selectedAgent && opts.selectedAgent !== "auto"
    ? opts.selectedAgent : routeAgent(message);

  // --- Ground in KB
  const seedQuery = message.trim().length >= 4 ? message : intentSeed(intent);
  const direct = searchKb(seedQuery, 5);
  const agentMatched = direct.filter(e => e.primaryAgent === routed);
  const hits = (agentMatched.length ? agentMatched : direct).slice(0, 3);
  const allowContact = contactInfoAllowed(intent, routed);
  const hitsForBody  = allowContact ? hits : hits.filter(h => h.id !== "contact-general");

  // --- Build the structured reply
  const parts = buildLegalReply({ intent, tone, locale: language,
                                  hits: hitsForBody, routedAgent: routed });
  let text = renderLegalReply(parts);

  // --- Optional intake-ladder question
  const inLadder = (opts.currentState === "DRAFT_DISCOVERY" ||
                    opts.currentState === "DRAFT_CASE_BUILDING")
                 && intent !== "contact_request"
                 && intent !== "out_of_scope";
  if (inLadder) {
    const metacog = evaluateMetacognition(opts.currentState!, history, files);
    const nq = nextBestQuestion({ report: metacog,
      fileCount: files.length, lastUserMessage: lastUser, locale: language });
    if (nq) text = `${text}\n\n${nq.prompt}`;
  }

  return {
    text,
    citations: hits.map(h => ({ id: h.id, title: h.title, href: h.href })),
    followUps: suggestFollowUps({ intent, hits: hitsForBody, routedAgent: routed, locale: language }),
    swarmMeta: /* the optional 3-node simulated cascade for UX */ {} as SwarmExecutionReceipt,
  };
}
```

The full file (~380 lines) is the verbatim §3 logic plus the swarm simulator.

### 9.10 `components/neo/neo-rich-text.tsx` — *the renderer (full file, ≤90 lines)*

```tsx
"use client";
import React from "react";

export function NeoRichText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trimEnd();
        if (line === "") return <div key={idx} aria-hidden className="h-1" />;

        if (line.startsWith("> ")) return (
          <p key={idx} className="border-l-2 border-orech-bronze/40 pl-2 text-[0.72rem] italic leading-snug text-orech-mist/85">
            {renderInline(line.slice(2))}
          </p>
        );
        if (line.startsWith("→ ")) return (
          <p key={idx} className="flex items-start gap-1.5 text-[0.82rem] font-medium text-orech-ink">
            <span aria-hidden className="text-orech-bronze">→</span>
            <span>{renderInline(line.slice(2))}</span>
          </p>
        );
        if (line.startsWith("· ")) return (
          <p key={idx} className="flex items-start gap-1.5 pl-1 text-[0.78rem] leading-snug text-orech-mist/95">
            <span aria-hidden className="text-orech-bronze/70">·</span>
            <span>{renderInline(line.slice(2))}</span>
          </p>
        );
        return <p key={idx} className="text-[0.84rem] leading-relaxed">{renderInline(line)}</p>;
      })}
    </div>
  );
}

const TOKEN = /(\*\*[^*]+\*\*|_[^_]+_)/g;

function renderInline(text: string): React.ReactNode {
  return text.split(TOKEN).filter(Boolean).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="font-semibold text-orech-ink">{part.slice(2, -2)}</strong>;
    if (part.startsWith("_") && part.endsWith("_"))
      return <em key={i} className="italic text-orech-mist/95">{part.slice(1, -1)}</em>;
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}
```

### 9.11 `components/neo/neo-typewriter.tsx` — *the streaming reveal (full file, ~130 lines)*

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { NeoRichText } from "./neo-rich-text";

interface NeoTypewriterProps {
  text: string;
  active: boolean;
  onComplete?: () => void;
  charsPerTick?: number;
  intervalMs?: number;
}

export function NeoTypewriter({ text, active, onComplete, charsPerTick, intervalMs = 14 }: NeoTypewriterProps) {
  const [revealed, setRevealed] = useState<number>(active ? 0 : text.length);
  const reduceMotionRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    reduceMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (!active || text.length === 0) { setRevealed(text.length); return; }
    if (reduceMotionRef.current)      { setRevealed(text.length); onCompleteRef.current?.(); return; }

    setRevealed(0);
    const step = charsPerTick ??
      (text.length > 600 ? 6 : text.length > 320 ? 4 : text.length > 140 ? 3 : 2);
    const pauseAfter = (ch: string) =>
      ch === "." || ch === "!" || ch === "?" ? 220 :
      ch === "\n"                            ? 160 :
      ch === "," || ch === ";" || ch === ":" ?  90 : 0;
    const jitter = () => 1 + (Math.random() - 0.5) * 0.3;

    let cur = 0, cancelled = false, timeoutId: number | null = null;
    const tick = () => {
      if (cancelled) return;
      const next = Math.min(text.length, cur + step);
      const lastChar = text[next - 1] ?? "";
      cur = next; setRevealed(cur);
      if (cur >= text.length) { onCompleteRef.current?.(); return; }
      timeoutId = window.setTimeout(tick, intervalMs * jitter() + pauseAfter(lastChar));
    };
    timeoutId = window.setTimeout(tick, intervalMs);
    return () => { cancelled = true; if (timeoutId !== null) window.clearTimeout(timeoutId); };
  }, [active, text, charsPerTick, intervalMs]);

  const skip = () => {
    if (revealed >= text.length) return;
    setRevealed(text.length); onCompleteRef.current?.();
  };

  const isStreaming = active && revealed < text.length;
  const display = isStreaming ? text.slice(0, revealed) : text;

  return (
    <div onClick={isStreaming ? skip : undefined}
         role={isStreaming ? "button" : undefined}
         aria-label={isStreaming ? "Tap to reveal the full reply" : undefined}
         className={isStreaming ? "cursor-pointer" : undefined}>
      <NeoRichText text={display} />
      {isStreaming && (
        <span aria-hidden
              className="ml-0.5 inline-block h-[0.95em] w-[2px] -mb-[2px] align-middle bg-orech-bronze/80 motion-safe:animate-pulse" />
      )}
    </div>
  );
}
```

### 9.12 `components/neo/neo-context.tsx` — *state provider (~300 lines)*

Lifts `messages`, `assistantMeta`, `isGenerating`, `state`, `uploadedFiles`,
`open` out of components so multiple surfaces (panel + full-screen "Case
Room") share the same conversation. The single non-trivial method:

```ts
const sendMessage = useCallback(async (raw: string, options?: { via?: "voice"|"keyboard" }) => {
  const text = raw.trim();
  if (!text || isGenerating) return;

  const userMsg: IntakeMessage = {
    id: crypto.randomUUID(),
    intake_draft_id: "draft-1",
    role: "user",
    content_redacted: text,
    timestamp: new Date().toISOString(),
    sequence_no: messages.length + 1,
    via: options?.via ?? "keyboard",
  };
  const next = [...messages, userMsg];
  setMessages(next);
  setIsGenerating(true);

  try {
    const out = await composeNeoReply({
      message: text,
      selectedAgent,
      currentState: state,
      uploadedFiles,
      messageHistory: next.map(m => ({ role: m.role, content: m.content_redacted })),
    });
    const replyId = crypto.randomUUID();
    setMessages(m => [...m, {
      id: replyId, intake_draft_id: "draft-1", role: "assistant",
      content_redacted: out.text || "I'm here. Could you tell me a little more about your situation?",
      timestamp: new Date().toISOString(), sequence_no: next.length + 1,
    }]);
    setAssistantMeta(meta => ({ ...meta,
      [replyId]: { citations: out.citations, swarm: out.swarmMeta, followUps: out.followUps }
    }));
  } catch (e: unknown) {
    setMessages(m => [...m, {
      id: crypto.randomUUID(), intake_draft_id: "draft-1", role: "assistant",
      content_redacted: `Sorry — I couldn't reach my system just now (${e instanceof Error ? e.message : "unknown"}). Please try again, or reach the office directly.`,
      timestamp: new Date().toISOString(), sequence_no: next.length + 1,
    }]);
  } finally {
    setIsGenerating(false);
  }

  if (state === "DRAFT_DISCOVERY" && (messages.length >= 2 || uploadedFiles.length > 0)) {
    setState("DRAFT_CASE_BUILDING");
  }
}, [isGenerating, messages, selectedAgent, state, uploadedFiles]);
```

`open` state is persisted to `localStorage("neo_sidebar_open_v1")`.

### 9.13 `components/neo/neo-shell.tsx` — *the panel + rail (~410 lines)*

Key behaviours:

1. **Vertical rail launcher** (`fixed right-0 top-1/2 -translate-y-1/2 z-[80]`)
   with `writingMode: "vertical-rl"`, label `"Neo AI"`, font-mono uppercase
   tracking-[0.14em] bronze, paper background, hairline border, hides on
   `lg+` when the panel is open.
2. **The panel** (`fixed bottom-0 top-0 right-0 z-[70]`) slides in via
   `translateX(100%) → translate-x-0` over 350ms cubic-bezier(0.19,1,0.22,1).
   Width starts at 420px, drag-handle on left edge resizes between 380px
   and `viewportWidth − 120px`, persisted.
3. **Mobile backdrop** (`fixed inset-0 z-[60] bg-orech-slate/80 lg:hidden`)
   click-to-close.
4. **Header** (`px-4 py-3 border-b border-orech-line bg-orech-slate/40`):
   - status dot (emerald / bronze / amber)
   - `<p class="italic-display text-[1.15rem]">NEO</p>`
   - status text ("Online" / "Typing…" / "Replying from cache")
   - link → `/case` (full-screen Case Room)
   - "New" button (resets conversation)
   - close × button
5. **Body** = `<NeoChatSurface size="panel" />` (or one of the intake screens
   when state ∈ verification flow).
6. **Esc** closes the panel and refocuses the rail. Focus trap on open
   focuses the close button after 50ms.
7. **`body.neo-hub-open`** class is toggled on `lg+` so the page content
   gets `padding-right: 420px` (the panel doesn't overlap content).

### 9.14 `components/neo/neo-chat-surface.tsx` — *the messages + composer (~640 lines)*

Three rendering branches per message:

```tsx
{isUser ? (
  <p className="whitespace-pre-wrap">
    {msg.via === "voice" && <MicGlyph />}
    {msg.content_redacted}
  </p>
) : isStreaming ? (
  <NeoTypewriter text={msg.content_redacted} active onComplete={() => markRevealed(msg.id)} />
) : (
  <NeoRichText text={msg.content_redacted} />
)}
```

`streamingId` is derived as "the *most recent* assistant message that
hasn't been revealed yet". On first mount, all pre-existing assistant
messages are marked revealed, so re-opening the panel never re-types the
history.

The empty-state greeting changes by hour: "Good morning / afternoon /
evening / Hello", computed *after mount* to avoid hydration mismatch.
Three quick prompts (`QUICK_PROMPTS`) sit underneath.

Below the user's message, while generating: the three pulsing dots + the
rotating italic hint (§4.3).

After the assistant's last message, when not generating: the
`followUps` chips render as rounded outlined pills (`rounded-full
border border-orech-line bg-orech-paper/80 px-3 py-1 text-[0.74rem]
hover:border-orech-bronze/50`).

### 9.15 `lib/neo/use-speech-recognition.ts` — *Web Speech API wrapper*

Stateless hook. Exposes `{ supported, listening, interim, error, start, stop, cancel }`.
Locale → BCP-47 mapping: `nl→nl-BE, fr→fr-BE, en→en-US`. Continuous +
interim results. Tears down on unmount. The composer treats every
dictation chunk as new input by re-baselining against an `dictationBaseRef`
snapshot taken when dictation starts — so interim chunks replace only the
dictated tail.

### 9.16 (optional) Server actions for live intake — `server/actions/neo-submit-intake.ts`

Three actions, gated by `INTAKE_MODE = "off" | "demo" | "live"`:

- `submitVerificationEmail(email)` — sends OTP (or simulates in demo)
- `verifyOtpCode(email, code)` — validates the code
- `submitDossierForReview(draftId, consents, email)` — persists the dossier

In `demo` mode they return synthetic IDs; in `live` mode they throw a
"not implemented" error until you wire Resend / your DB. **The chatroom
itself works in `off` mode** — only the intake submission is gated.

### 9.17 `lib/neo/message-normalizer.ts` — *Human-to-AI Translator (~305 lines)*

The full normalizer from §3.13: `normalizeMessage(raw)` → `NormalizedMessage`.
Contains the abbreviation map, 5 entity extractor groups, code-switching detector, and annotation block builder.

### 9.18 `lib/neo/advisory-engine.ts` — *Advisory guidance (~443 lines)*

The full advisory engine from §3.14: `lookupAdvisory(msg, docTypes, legalConcepts, locale)` and `formatAdvisoryBlock(advisory, locale)`.
Contains the ~8 trilingual advisory domain entries.

### 9.19 `lib/neo/prompt-compiler.ts` — *Prompt assembly (~155 lines)*

The full prompt compiler from §3.15: `compilePrompt(input)` → string.
Assembles 11 XML sections in order.

### 9.20 `lib/neo/freeai-bridge.ts` — *FREE AI client (~134 lines)*

The full bridge from §3.16: `callFreeAI(prompt, persona)` and `isFreeAIAvailable()`.
Never throws — returns `{ ok: false }` on any failure.

### 9.21 `lib/neo/telemetry.ts` — *Observability engine (~355 lines)*

The full telemetry system from §3.17: `logTelemetry(type, data, ms)`, `getDashboard()`, `getRecentEvents(limit)`.
Ring buffer of 500 events, 11 event types, 4-group dashboard aggregation.

### 9.22 `lib/neo/intake-types.ts` — *Intake pipeline types (~104 lines)*

All typed interfaces for the intake state machine: `IntakeState`, `IntakeDraft`,
`IntakeMessage`, `IntakeFile`, `VerificationSession`, `IntakeSubmission`,
`IntakeRouting`, `IntakeAuditEvent`. Per §7.1.

### 9.23 `lib/neo/intake-summary.ts` — *Dossier builder (~348 lines)*

The `CaseDossier` builder with heuristic extractors: urgency detection,
timeline extraction, party detection, monetary stakes, readiness provenance.
Per §7.1.

### 9.24 `lib/neo/conflict-flag.ts` — *Conflict detection (~84 lines)*

Client-side conflict/sensitivity flag system. Provides non-blocking signals
(dual-party, high-value, minor involvement, political exposure) to the professional
without exposing private conflict lists.

### 9.25 `lib/neo/intake-mode.ts` — *Intake mode gate (~49 lines)*

`INTAKE_MODE: "off" | "demo" | "live"` — reads `NEXT_PUBLIC_NEO_INTAKE_MODE`.
Gates email verification and dossier persistence. The chatroom itself always
works regardless of mode.

### 9.26 `lib/neo/intake-routing.ts` — *Routing logic (~39 lines)*

Routes intake submissions based on risk flags, urgency, and practice area.
Outputs `IntakeRouting` with confidence level and manual review flag.

### 9.27 `lib/neo/send-brief.ts` — *Brief delivery adapter (~247 lines)*

Supports three delivery channels: download (Blob URL), email share (mailto:),
cloud share (Microsoft 365 / Google Drive links). Mode-gated:
- `off` → throws IntakeDisabledError
- `demo` → generates reference, no real delivery
- `live` → generates files + share links

### 9.28 `lib/neo/case-file-types.ts` — *Case file data model (~50 lines)*

Defines `CaseFile`, `SourceRef`, `CaseParty`, `CaseChronologyEntry`,
`CaseIssue`, `CaseExhibit`. The provenance-pointer system links every fact
back to its source message.

### 9.29 `lib/neo/case-file-builder.ts` — *Case file assembly (~80 lines)*

`buildCaseFile(transcript, files, flags)` — orchestrates the extractors and
conflict heuristics into a structured `CaseFile` ready for export.

### 9.30 `lib/neo/case-file-extractors.ts` — *Deterministic extractors (~469 lines)*

Regex-driven extractors: `extractParties`, `extractChronology`, `extractIssues`,
`extractExhibits`, `extractDamages`. No LLM. Runs in-browser.

### 9.31 `lib/neo/case-file-export.ts` — *Markdown/JSON export (~60 lines)*

Renders `CaseFile` into Markdown and JSON, following the OVB four-folder convention.

### 9.32 `lib/neo/case-file-pdf.tsx` + `lib/neo/case-file-docx.ts`

PDF renderer (`@react-pdf/renderer`, ~750 lines) and DOCX generator (`docx`, ~600 lines)
for the formal case file export. Both use the same `CaseFile` data model.

### 9.33 `lib/neo/law-skills.ts` — *Agent skills & boundaries (~60 lines)*

Defines the NEO agent skills and routing boundaries. Establishes what each
agent can and cannot do, preventing scope creep.

### 9.34 `components/neo/neo-workspace.tsx` — *Full-screen Case Room (~8.5 KB)*

Two-pane layout: chat on the left, dossier/case-file panel on the right.
Mounts at `/case`. Uses the same `NeoProvider` context as the panel.

### 9.35 `components/neo/neo-case-file-view.tsx` — *Case file viewer (~27 KB)*

Interactive case file renderer with section navigation, collapsible sections,
timeline view, party relationship diagram, and export buttons.

### 9.36 `components/neo/neo-orchestrator.tsx` — *Agent router UI (~108 lines)*

Allows the user to manually pin a specialist agent. Dropdown with all 8 agents
+ "Auto" mode. Visual indicator of current routing.

### 9.37 `components/neo/neo-dossier-panel.tsx` — *Dossier sidebar (~1.8 KB)*

Real-time dossier summary that updates as the conversation progresses.

### 9.38 `components/neo/neo-intake-progress.tsx` — *Progress bar (~1.6 KB)*

Horizontal readiness progress bar (0–5 weighted metric) with "Proceed to summary" CTA.

---

## 12. Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_NEO_INTAKE_MODE` | `"off"` | Controls intake flow: `"off"` (chat only), `"demo"` (simulated verification), `"live"` (real OTP) |
| `NEXT_PUBLIC_FREEAI_URL` | `"http://localhost:3000"` | FREE AI swarm orchestrator endpoint |
| `FREEAI_URL` | (same as above) | Server-side fallback for the bridge |

The chatroom works with **zero environment variables set** — `INTAKE_MODE=off`
and the deterministic composer handle everything. Set `FREEAI_URL` only when
you have a live LLM orchestrator to connect.

---

## 13. Dependencies

| Package | Version | Purpose |
|---|---|---|
| `next` | `^15.1.6` | Framework (App Router) |
| `react` / `react-dom` | `^19.0.0` | UI runtime |
| `tailwindcss` | `^3.4.17` | Styling |
| `framer-motion` | `^12.38.0` | Panel slide animation, micro-interactions |
| `lucide-react` | `^1.7.0` | Icons (mic, paperclip, send, close, etc.) |
| `clsx` | `^2.1.1` | Conditional className merging |
| `tailwind-merge` | `^3.5.0` | Tailwind class conflict resolution |
| `@react-pdf/renderer` | `^4.5.1` | PDF case file export |
| `docx` | `^9.6.1` | DOCX case file export |
| `better-auth` | `^1.6.0` | Identity / intake verification |
| `drizzle-orm` | `^0.45.2` | Database ORM (for live intake persistence) |
| `@libsql/client` | `^0.17.2` | SQLite/Turso client (for live persistence) |
| `nodemailer` | `^8.0.5` | Email delivery (for brief sharing) |
| `next-intl` | `^4.9.0` | i18n (site-level, not NEO-internal) |

**Minimum viable chatroom** (no intake, no case files, no live AI):
`next`, `react`, `react-dom`, `tailwindcss`, `framer-motion`, `lucide-react`, `clsx`, `tailwind-merge`.

---

## 14. Error handling & fallback chain

The compose pipeline never crashes. It degrades gracefully through a 3-layer
cascade:

```
Layer 1: FREE AI Bridge (live LLM)
   │  callFreeAI(compiledPrompt)
   │  ✓ → use AI-generated text, wrap in six-slot structure
   │  ✗ → fall through
   ▼
Layer 2: Deterministic Composer (grounded templates)
   │  buildLegalReply() + renderLegalReply()
   │  Always succeeds — produces a structured, KB-grounded reply
   │  using the tone profiles, boundary line, and disclaimer.
   │  This is the PRIMARY reply path. Layer 1 enhances it.
   ▼
Layer 3: Hardcoded Fallback (last resort)
   │  "I'm here. Could you tell me a little more about your situation?"
   │  Fires only if both layers above throw (shouldn't happen).
```

**Error propagation rules:**

- `callFreeAI` **never throws** — returns `{ ok: false }`.
- `composeNeoReply` catches all exceptions and emits a friendly error message.
- `sendMessage` (in `neo-context.tsx`) wraps the entire compose call in try/catch.
- Telemetry logs every error with `logComposeError(error, durationMs)`.
- Node health tracking: after 3 consecutive failures on a swarm node, that node
  enters 60-second cooldown. This is tracked in memory and reported via the
  `"Replying from cache"` status badge.

**localStorage persistence keys:**

| Key | What it stores |
|---|---|
| `neo_sidebar_open_v1` | Panel open/closed state |
| `neo_panel_width_v1` | User's dragged panel width |
| `neo_messages_v4` | Conversation messages (pruned to last 50) |
| `neo_meta_v4` | Assistant metadata (citations, follow-ups per message) |
| `neo_files_v2` | Uploaded file metadata |
| `neo_state_v2` | Current intake state machine position |

---

## 10. Wiring it into a project

### 10.1 Mount once at the root layout

```tsx
// app/layout.tsx (Next.js App Router)
import { NeoProvider } from "@/components/neo/neo-context";
import { NeoShell } from "@/components/neo/neo-shell";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NeoProvider>
          {children}
          <NeoShell />
        </NeoProvider>
      </body>
    </html>
  );
}
```

That's it. The rail self-mounts top-right; the panel slides in on click;
the composer streams the deterministic reply.

### 10.2 Required Tailwind extensions

Copy the `theme.extend` block from §6 into your `tailwind.config.ts`. Make
sure your `content` glob covers `./components/**/*.{ts,tsx}` and
`./lib/**/*.{ts,tsx}`.

### 10.3 Required global CSS

Copy the `h1 em, h2 em, h3 em, .italic-display` rule + the
`body.neo-hub-open` media query + the `:focus-visible` rule from §6 into
your `globals.css`.

### 10.4 Required font loads

```tsx
// app/layout.tsx
import { Playfair_Display, Cormorant_Garamond, Source_Serif_4, Inter, JetBrains_Mono } from "next/font/google";

const display       = Playfair_Display({ subsets: ["latin"], variable: "--font-display", weight: ["400","500"] });
const displayItalic = Cormorant_Garamond({ subsets: ["latin"], style: "italic", weight: "400", variable: "--font-display-italic" });
const prose         = Source_Serif_4({ subsets: ["latin"], variable: "--font-prose" });
const sans          = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono          = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

// <html className={`${display.variable} ${displayItalic.variable} ${prose.variable} ${sans.variable} ${mono.variable}`}>
```

### 10.5 Project-specific edits

You only ever edit three things per new project:

1. **`data/neo-kb.json`** — the facts (titles, bodies, hrefs, tags).
   Title becomes the **bold** lead in the body. Body is pasted verbatim.
2. **`lib/neo/agents.ts`** — agent labels + keyword sets (8 routing slots
   with first-match-wins priority).
3. **`lib/neo/persona.ts`** + **`lib/neo/communication.ts`** language
   constants — swap `{{ORG_NAME}}` / `{{CITY}}` / `{{DOMAIN_TYPE}}` for your domain.
   Keep the structure; replace the nouns.

The intent regex set, the tone profiles, the renderer, the typewriter, the
shell, the streaming cadence, the empty-state geometry — none of it
changes between projects. That's the whole point of this document.

### 10.6 Plain-HTML / non-Next port

If you're not on React, the contract is unchanged:

1. Build the same composer in any language. It's a pure function:
   `compose(message, history, state, files, locale) → { text, citations, followUps }`.
2. Serve `text` to the client.
3. Render `text` with the same Markdown-subset rules (the renderer is ~80
   LOC and trivial to port — see §2.1 + §9.10).
4. Reveal char-by-char with the same cadence (§4.1 + §9.11).
5. Mount the same panel geometry (§5).

---

## 11. The non-negotiables (the things that make it feel like NEO and not a chatbot)

If you only carry six things to a new project, carry these:

1. **Reply structure**: opener → bridge → body (`**Title** — body` + optional `· _Sub_ — body`) → optional `→ next-step` → `_boundary_` italic → optional `> disclaimer`. Always in this order. Always.
2. **Three tones × three locales**: `professional_empathetic | clear_direct | calm_reassuring` × `en | nl | fr`. Pick by intent, never by site URL.
3. **Markdown-subset renderer**: only `**`, `_`, `> `, `→ `, `· `. No raw HTML. No `<a>` inside body — citations live in their own row.
4. **Typewriter cadence**: 14ms tick × jittered ±15%, adaptive char-step (2/3/4/6 by length), pauses (220/160/90 ms) after `.!? \n ,;:`. Click to skip. Honour `prefers-reduced-motion`.
5. **Geometry**: vertical rail right-edge launcher with `writing-mode: vertical-rl`, slide-in panel from the right, draggable left-edge resize, `body.neo-hub-open { padding-right: 420px }` so content reflows.
6. **Cormorant Garamond italic** for the persona name in the header (`.italic-display`), bronze accent (#9A6B1F), paper cream background (#F6F4EE), Source Serif 4 for body. This is the "academic feel" the visitor recognises before reading a single word.

Everything else is replaceable. These six are NEO.

---

## 15. Industrialization Scorecard

To evaluate a NEO deployment's readiness, use the following 10-point scorecard. A production-ready port must score 100%.

| Dimension | Check | Weight |
|---|---|---|
| **Deterrence** | Boundary line renders in correct locale | 10% |
| **Disclaimer** | Disclaimer block renders when KB hits > 0 | 10% |
| **Suppression** | Contact suppression strips phones/emails unless intended | 10% |
| **Gating** | Hard-block state (A-J schema) prevents dispatch of PII/malware | 10% |
| **Multi-channel** | Delivery modal supports all 6 channels without a server dependency | 10% |
| **Resilience** | Swarm reviewer correctly fails over across 3 nodes | 10% |
| **State** | Session persistence (localStorage) survives reload | 10% |
| **UI Polish** | Typewriter cadence respects punctuation pauses + zero flash | 10% |
| **Intelligence** | Intent classifier correctly maps to 8 fixed routing profiles | 10% |
| **Independence** | Zero hardcoded firm content in the AI prompt layer | 10% |

---

## 16. Complete File Manifest (v2.0)

For a complete donor-copy, you must migrate exactly **14 components**, **35 library files**, and **4 infrastructure files**.

### Components (`components/neo/`)
1. `delivery-channel-modal.tsx` — Multi-channel dispatch modal
2. `neo-case-file-actions.tsx` — PDF/DOCX generation commands
3. `neo-case-file-view.tsx` — The dossier viewer
4. `neo-constants.ts` — Shared tokens
5. `neo-context.tsx` — Global state provider
6. `neo-dossier-panel.tsx` — Desktop sidebar summary
7. `neo-hub.tsx` — Desktop rail layout
8. `neo-icons.tsx` — Animated typewriter/typing indicators
9. `neo-intake-progress.tsx` — Readiness thermometer
10. `neo-markdown.tsx` — Strict subset renderer
11. `neo-mobile-drawer.tsx` — Mobile slide-up layout
12. `neo-orchestrator.tsx` — Agent router visualizer
13. `neo-shell.tsx` — The mounting entry point
14. `neo-typewriter.tsx` — The streaming effect engine

### Library (`lib/neo/` & `data/`)
**Core Engine:** `agents.ts`, `communication.ts`, `compose-reply.ts`, `compile-prompt.ts`, `enforcement-pipeline.ts`, `intent.ts`, `kb.ts`, `normalizer.ts`, `persona.ts`, `plugins.ts`, `prompts.ts`, `types.ts`
**Advisory & Translation:** `advisory-engine.ts`, `advisory-data.ts`, `translator.ts`
**Intake & Dossier:** `intake-machine.ts`, `intake-summary.ts`, `intake-report-prompt.ts`, `intake-report-schema.ts`, `intake-report-validator.ts`, `dossier-safety-checks.ts`
**State & Telemetry:** `session-state.ts`, `telemetry.ts`
**FREE AI Bridge:** `free-ai-bridge.ts`, `free-ai-validation.ts`, `swarm-reviewer.ts`
**Exports:** `docx-export.ts`, `pdf-export.ts`
**UI Utilities:** `date.ts`, `file-utils.ts`, `formatters.ts`, `send-brief.ts`, `use-neo-state.ts`, `use-neo-typewriter.ts`
**Data:** `data/neo-kb.json`

### Infrastructure (Server & DB)
1. `app/api/neo/chat/route.ts` — LLM bridge endpoint and rate limiting
2. `app/api/neo/telemetry/route.ts` — Event ingestion endpoint
3. `db/schema/neo-schema.ts` — Drizzle ORM tracking tables
4. `scripts/compile-neo-kb.ts` — Data ingestion pipeline for `neo-kb.json`

---

## 17. Server-Side & Infrastructure Contract

While the NEO engine is heavily client-optimised for maximum responsiveness, it relies on a strict backend contract to protect secrets and persist state. When porting the blueprint, these four infrastructure pillars **must** be implemented:

### 17.1 API Endpoint Security (`api/neo/chat/route.ts`)
The `free-ai-bridge.ts` must never directly contact LLM providers from the browser. It communicates with a Next.js Route Handler.
* **Secret Isolation:** Provider API keys (`GEMINI_API_KEY`, etc.) live exclusively in server environment variables.
* **Rate Limiting:** Because the endpoint is unauthenticated, **Abuse Protection is mandatory**. Implement IP-based sliding window rate limiting (e.g., via Upstash Redis or Vercel KV). A standard policy is: 10 requests per 10 seconds, 100 requests per hour. If rate-limited, return HTTP 429 to trigger the client-side Swarm Reviewer cooldown logic.

### 17.2 Drizzle Schema Contract (`neo-schema.ts`)
Live intake persistence and telemetry require matching database tables if `NEXT_PUBLIC_NEO_INTAKE_MODE="live"`. The contract dictates:
* **`neo_telemetry` table:** Must store `event_type`, `latency_ms`, `locale`, `node_id`, and `payload` (JSONB).
* **`neo_intake_dossier` table:** Must store `reference_id` (UUID), `status` (enum: pending, routed, blocked), `structured_data` (JSONB matching `StrictIntakeReportSchema`), and `consent_version`.

### 17.3 Knowledge Base Ingestion Pipeline (`compile-neo-kb.ts`)
The static `data/neo-kb.json` should not be authored manually. Maintain an ingestion script that:
1. Reads source materials (Markdown docs, PDFs, or headless CMS entries).
2. Chunks the data into thematic blocks.
3. Outputs the strictly structured `neo-kb.json` array required by `lib/neo/kb.ts`.
This ensures content managers can update the firm's knowledge without touching the React repository.

### 17.4 Telemetry Ingestion (`api/neo/telemetry/route.ts`)
The companion endpoint to `chat`. It receives fire-and-forget POST payloads from the client-side `logComposeStart`, `logComposeError`, etc., and asynchronously inserts them into the `neo_telemetry` table without blocking the user's chat flow.


## 18. Architectural Upgrades & FREE AI Enterprise Capabilities

Starting with v2.0 of the underlying AI layer, the FREE AI infrastructure vastly transforms how this Chatroom scales logic locally and autonomously. The system is no longer simply deterministic with static endpoints, it now includes advanced **Enterprise Intelligence Capabilities**.

### 18.1 Test-Time Compute (TTC) Ensemble Generation

Complex parsing and user logic are mapped to an Adaptive TTC Predictor (`src/routing/adaptiveTTCPredictor.js`). 
It calculates baseline routing rules and, if the cognitive complexity is sufficiently high, orchestrates an ensemble graph:
* Resolves requests using **Parallel Generation** across disparate local or free endpoints.
* Routes outputs to a verification **Critic Node** to filter out hallucinations, strictly assuring schema compliance.

### 18.2 Obsidian-Style Synthetic Persistent Memory

Conversations transcend ephemeral contexts. Integrated locally into a Device Memory Layer (DML), user profiles, ongoing projects, and critical constraints are distilled and preserved via the **Obsidian-Style Synthetic Memory** engine (`src/memory/obsidianManager.js`). 
It utilizes an audit differential saving format (`.bak`) making sure your domain constraints are remembered across unlimited sessions without overfilling context windows.

### 18.3 Hybrid Graph + Vector RAG Retrieval Layer

The fallback deterministic search expands into a **Hybrid Retrieval Engine** (`src/retrieval/vectorRetriever.js` and `src/retrieval/graphRetriever.js`). Context merges across semantic similarity and Knowledge Graph topological traversal, guaranteeing that when the assistant responds, it synthesizes fresh relationship structures not just isolated paragraph chunks.

### 18.4 Autonomous Model Auto-Discovery Daemon

Running automatically and safely in a non-blocking background `Worker` started directly by `server.js` on boot, the **Daemon Crawler** (`src/improvement/daemonWorker.js`) actively scans HuggingFace, OpenRouter, and model hubs on a continuous schedule to find, benchmark, and transparently upgrade capabilities onto new free-tier endpoints. This happens entirely automatically without requiring manual scheduling or developer restructuring.

### 18.5 Observability Portal (FREE AI Control Plane)

The unified node engine ships with a graphical **REST API Enterprise Dashboard** mounted at `/admin-dashboard`. Any deployer of NEO can view deep latency telemetry, matrix error counts, mapping overhead, and swarm intelligence status in a beautiful glassmorphic local interface.

### Conclusion of Upgrades
These upgrades formally establish NEO as more than a UI shell—it is an end-to-end engineered runtime. The deterministic baseline ensures immediate load survival, while the dynamic FREE AI integration amplifies intelligence, handles long-term memory, retrieves structured graph documents, and governs strict safety boundaries utilizing exclusively un-metered and open-source models.


### 18.6 Silent Fallback Routing & Health Matrix

Because free-tier endpoints are inherently unstable, NEO's integration with FREE AI implements an automatic **Silent Fallback Routing** mesh (`src/providers/healthMatrix.js` & `rateLimitScheduler.js`). If a primary provider triggers a 429 Rate Limit or a 503 Server Error, the orchestrator immediately shields the user from the error, silently rerouting the node inference to the next healthy provider in the mesh. This achieves robust high-availability despite zero cost.

### 18.7 Strict Output Validators & Schema Enforcers

LLM context hallucination commonly breaks JSON and structural outputs. FREE AI integrates a mechanical **Schema Enforcer** (`src/validators/schemaEnforcer.js`) right at the edge of the inference output. If the response does not parse into the exact expected format (e.g., Zod enforced object shapes), it intercepts the failure and forces a bounded repair inference rather than crashing the chat surface or spitting raw markdown into an object parser.

### 18.8 Prompt Compilers & Telemetric Optimization

Instead of static, brittle system prompts, FREE AI exposes programmatic **Prompt Optimization** (`src/telemetry/promptOptimizer.js`). It acts as a DSPy-style optimizer: it tracks empirical execution receipts, identifies prompts that result in high failure/re-route logic, and automatically adjusts schema definitions and system instructions to statistically reduce error margins over time.

### 18.9 Truth-Gated Memory Subsystems

Not all data belongs in persistent storage. The Obsidian Memory architecture enforces **Truth-Gating**, comparing new user traits against retrieved baseline facts before saving. If confidence is low, it refuses to corrupt the Device Memory Layer (DML), keeping long-term memory pristine and protecting the context window from adversarial or noisy facts.

### 18.10 Regression Scorecard Pipeline

Enterprise-grade operations require safety before deploy. FREE AI ships with **Regression Scorecards** (`src/eval/regressionRunner.js`), conducting automated end-to-end trace verifications for the orchestrated routes. It ensures that any model swap generated by the Daemon Worker or prompt mutation by the Optimizer does not silently break intake workflows.


