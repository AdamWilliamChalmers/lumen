# Lumen v2 — Full Design & Functionality Spec

## Product philosophy

Lumen is for people who want to use AI without losing themselves in it. The fear of cognitive offloading is real and specific: it's not "AI is bad", it's "I'm worried I'm becoming passive, outsourcing my thinking rather than doing it."

The tone of the entire extension must reflect this. Lumen is a mirror, not a nanny. It is curious, not judgmental. It never blocks. It creates moments of awareness — a beat before you send, a question to sit with, a pattern surfaced after the fact. The user should feel like they have a thoughtful coach watching alongside them, not a teacher marking them down.

---

## What changes from v1

### 1. Location: from floating widget → inline per-message strip

**Remove** the top-right floating widget entirely.

**Add** a thin inline strip that appears directly below each user message bubble, right-aligned (matching the bubble alignment), as a permanent part of the conversation thread.

This is the key UX shift. In-context feedback in the moment of action is far more powerful than a dashboard in the corner. The user sees their score where it matters — attached to the message that generated it.

### 2. The floating widget becomes a minimal session badge

Keep a small, unobtrusive badge in the top-right — but reduce it to:
- The Lumen wordmark (small, muted)
- A single coloured dot for the session score
- The session score number

It is not draggable in v2. It is a status indicator only. Clicking it opens a small popover showing the session score history (last 10 message scores as a sparkline).

### 3. Amber and red have distinct, graduated responses

Not just visual colour changes — each state triggers different UX behaviour.

---

## The inline strip (per-message)

### Visual spec

Appears below every user message, right-aligned. Height: 22px. Padding: 4px 0.

Contents (left to right, right-aligned):
1. `Lumen` label — 11px, muted grey (#666), font-weight 500, letter-spacing 0.2px
2. Coloured dot — 8px circle, colour matches state
3. Score number — 11px, same colour as dot
4. Short state label — 11px, muted
   - Green: `· focused`
   - Amber: `· [contextual nudge]`
   - Red: `· high offloading — see below`

The nudge at amber is not generic. It is generated from the content of the specific message (see signal-to-nudge mapping below).

### Green state (score 0–39)

Strip appears, dot is green (`#4caf50`), label shows `· focused`. No further action. Non-intrusive. The user should barely notice it when in green — it just confirms things are fine.

### Amber state (score 40–69)

Strip appears with amber dot (`#ffc107`). The nudge text is contextual — derived from the offloading signal that scored highest for that message. See nudge mapping.

No banner. No blocking. Just the strip. The idea: a light tap on the shoulder.

**Contextual nudge mapping (amber):**

| Highest signal | Nudge shown |
|---|---|
| Prompt length (short input) | `· what do you already know about this?` |
| Task framing (delegation) | `· could you draft a version yourself first?` |
| Passive acceptance (no engagement after long output) | `· what in that answer surprised you?` |
| Message velocity (rapid-fire) | `· what's the actual question here?` |

### Red state (score 70–100)

Strip appears with red dot (`#f44336`). Label: `· high offloading — see below`.

Additionally: a **red banner** appears *above the text input* (between the last AI response and the input box). This is not a modal. It does not block. It is a persistent in-thread intervention that stays visible until the user either dismisses it or sends their next message.

**Red banner contents:**

1. Header row: warning icon + `Lumen — high cognitive offloading detected` (12px, red, font-weight 600)
2. Two-sentence explanation of the pattern detected — derived from the conversation context. Not generic. Examples:
   - "You've sent four outputs requests without editing or questioning any of them. The letters won't feel like yours."
   - "You're asking for complete outputs on a topic you clearly have views about. The AI is doing the thinking you could be doing."
3. **Reflection box** — a small textarea with a placeholder prompt:
   - "What would you write differently here, even in rough notes?"
   - "What's your instinct before the AI answers?"
   - "What do you already know that's relevant here?"
   - (Rotate based on task type detected from prompt framing)
4. Two buttons: `Dismiss` (ghost) and `Send anyway →` (subtle red outline)

The user is never blocked. `Send anyway` always works. The reflection box is optional — but it stays visible and inviting.

**If the user types in the reflection box and then clicks Send anyway:** prepend their reflection to the next message as a hidden context note (not shown to the AI, tracked internally for score adjustment). This rewards engagement even when they still send.

**If the user types in the reflection box and it contains > 20 words:** reduce the next message's score by 15 points (cognitive credit for self-reflection before sending).

---

## Session score badge (top-right)

### Visual

Small pill, fixed top-right of `chat.openai.com` and `chatgpt.com`. Background: `#1a1a2e`. Border: `1px solid #2d2d4e`. Border-radius: 20px. Padding: 4px 12px. Z-index: 2147483647.

Contents: `Lumen` wordmark (11px, #9090aa) + coloured dot (7px) + session score number (11px).

### Popover (on click)

A small card drops down below the badge (not a modal — absolutely positioned). Contains:
- `Session score` header
- Sparkline: last 10 user message scores as a mini bar chart (drawn with inline SVG — 10 bars, colour-coded green/amber/red, 120px × 32px)
- Three stat rows: `Messages this session`, `Amber alerts`, `Red interventions`
- `Reset session` link (muted, small) — clears chrome.storage.session and resets all scores

The popover closes on any click outside it.

---

## Updated signal scoring

### Signal 1: Prompt length (weight 20%)

Score 0 if > 40 words. Score 50 if 15–40 words. Score 80 if 8–14 words. Score 100 if < 8 words.

Rationale: very short prompts indicate the user is not putting their own thinking in. Under 8 words is almost always pure delegation ("write me X", "do this").

### Signal 2: Message velocity (weight 25%)

Score 0 if < 2 messages in 3 minutes. Score 40 if 2–3 messages in 3 minutes. Score 70 if 4–5 messages in 3 minutes. Score 100 if > 5 messages in 3 minutes.

Rationale: rapid-fire prompting is a reliable proxy for a passive consumption loop. The user is not thinking between messages.

### Signal 3: Passive acceptance (weight 30%)

Score 0 if the prior AI response was < 100 words (short exchange, probably fine). Score 0 if the user's follow-up contains a question mark (they're engaging critically). Score 60 if prior AI response > 200 words and user follow-up < 15 words and no question mark. Score 100 if prior AI response > 300 words, user follow-up < 8 words, no question mark, and user follow-up contains no quote or reference to the AI's output.

Rationale: this signal catches the most dangerous pattern — getting a wall of AI text, skimming it (or not reading it), and immediately sending another request.

### Signal 4: Task framing (weight 25%)

High-offloading phrases (score 80–100): "write me", "do this", "create a", "generate a", "make me", "just do", "can you do", "produce a", "give me a full", "do it for me", "write the whole".

Medium-offloading phrases (score 40–60): "help me write", "improve this", "fix this", "rewrite this" (outsourcing editing, not just creation).

Low-offloading phrases (score 0–20): "how do I", "why does", "what is", "help me understand", "explain", "what would you change about", "does this make sense", "what am I missing".

Neutral (score 30): anything not matching the above.

---

## Contextual red banner text generation

The red banner's two-sentence explanation should not be generic. Derive it from the conversation pattern:

**Pattern: repeated full-output requests (3+ "write me" type prompts)**
> "You've asked for complete outputs [N] times in this conversation without editing or questioning the results. Each version is drifting further from your voice."

**Pattern: high velocity + short prompts**
> "You've sent [N] messages in the last [X] minutes with very little input of your own. You're in a consumption loop rather than a thinking one."

**Pattern: passive acceptance (long AI output, no engagement)**
> "The AI just wrote [N] words and you responded with [M]. That's a signal you may be skimming rather than reading critically."

**Pattern: mixed/general high score**
> "Your last [N] messages show low engagement — short inputs, quick requests, no questions back. The AI is doing the thinking you could be doing."

To keep this simple in v1 of v2 (no API calls): implement as template strings with variable substitution from the conversation state. No LLM call needed.

---

## File structure (revised)

```
lumen/
├── manifest.json          # Manifest V3 — chat.openai.com + chatgpt.com
├── content.js             # All logic: observer, scoring, strip injection, banner, badge
├── widget.css             # All styles scoped under #lumen-root and .lumen-*
├── nudges.js              # Nudge library + contextual nudge selector
├── sparkline.js           # Minimal inline SVG sparkline renderer
├── README.md
```

---

## CSS design tokens

```css
/* Lumen dark palette — scoped to #lumen-root and all .lumen-* elements */
--lm-bg:           #1a1a2e;
--lm-bg-dark:      #12122a;
--lm-border:       #2d2d4e;
--lm-text:         #e8e8f0;
--lm-muted:        #9090aa;
--lm-green:        #4caf50;
--lm-amber:        #ffc107;
--lm-red:          #f44336;
--lm-amber-bg:     #2a2000;
--lm-amber-border: #5a4000;
--lm-amber-text:   #c8a040;
--lm-red-bg:       #200000;
--lm-red-border:   #5a0000;
--lm-red-text:     #c04040;
--lm-red-muted:    #a06060;
--lm-radius:       10px;
--lm-radius-sm:    6px;
```

---

## DOM injection points

### Inline strip
Inject after each `.lumen-strip` target — a new `div.lumen-strip` inserted as the next sibling of each user message container. Use `data-lumen-msg-id` to track which strip belongs to which message.

Target: the outer wrapper of each user message (the element containing `[data-message-author-role="user"]`). Insert `.lumen-strip` as a child immediately after the message bubble element.

Alignment: flex row, justify-content: flex-end, to match right-aligned bubble.

### Red banner
Inject as the last child of the conversation thread container, above the input box. Use a dedicated `div#lumen-red-banner`. Remove and re-render on each new message evaluation.

### Session badge
Inject into `document.body` as a fixed-positioned `div#lumen-badge`. Not inside the ChatGPT DOM tree — appended to body to avoid style conflicts.

---

## Interaction spec

### Dismiss button (red banner)
Hides the banner (`display: none`). Increments a `dismissals` counter in session state. If dismissals > 3 in one session, the banner threshold raises to 85 (giving the user a break from repeated interventions).

### Send anyway button (red banner)
Hides the banner. Allows the message to proceed normally. Does not affect scoring. Logs the event to session state as `interventions_bypassed`.

### Reflection textarea (red banner)
- Placeholder rotates based on detected task type
- If user types > 20 words → apply -15 score credit to next message's score
- If user types > 40 words → apply -25 score credit
- On `Send anyway` click: if reflection has content, attach it as a metadata note (not sent to ChatGPT) and log `reflection_submitted: true` in session state

### Session badge click
Toggle `#lumen-popover` visibility. Popover is position absolute, anchored below the badge. Render sparkline SVG fresh on each open. Close on outside click (document mousedown listener).

### Reset session
Calls `chrome.storage.session.clear()`. Resets in-memory state. Removes all `.lumen-strip` elements from DOM. Hides banner if visible. Re-renders badge in green.

---

## Scoring adjustments for reflection credit

After computing the raw weighted score for a message, apply post-processing:

1. If session state contains `pending_reflection_credit` (set when user typed in the reflection box before sending): subtract the credit amount (15 or 25) from the raw score. Floor at 0. Clear the credit.
2. If the message contains a question mark: subtract 8 points (signals critical engagement).
3. If the message contains a quote from the prior AI response (>3 consecutive words matching): subtract 10 points (user engaged closely enough to reference the output).

---

## Session state schema (chrome.storage.session)

```json
{
  "messageScores": [33, 52, 61, 81],
  "sessionScore": 74,
  "messageCount": 8,
  "amberCount": 2,
  "redCount": 1,
  "dismissals": 0,
  "interventionsBypassed": 0,
  "reflectionsSubmitted": 1,
  "pendingReflectionCredit": 0,
  "redThreshold": 70
}
```

---

## Nudge library (expanded)

### Amber nudges — by dominant signal

**Short prompt:**
- "What do you already know about this?"
- "What's your starting point here?"
- "What would your first attempt look like?"

**Delegation framing:**
- "Could you draft a rough version yourself first?"
- "What's the part you could write, even badly?"
- "What direction are you thinking — before the AI answers?"

**Passive acceptance:**
- "What in that last answer surprised you?"
- "What would you push back on?"
- "Did that answer your actual question?"

**High velocity:**
- "What's the core question underneath these messages?"
- "Slow down — what are you actually trying to figure out?"
- "What do you know now that you didn't before?"

### Red nudge prefix
All red interventions use the pattern-derived explanation above (not the nudge library). The reflection box replaces the nudge text.

---

## What NOT to build in v2

- No LLM API calls from the extension (keep it purely local/heuristic)
- No data sent anywhere — everything stays in chrome.storage.session
- No user accounts, no sync
- No settings panel yet (v3)
- No support for other LLM platforms yet (v3)
- No gamification (streaks, scores shared, badges) — this would undermine the philosophy

---

## Definition of done (v2)

- Inline strip appears below every user message with correct colour and nudge text
- Green state is visually quiet — barely noticeable
- Amber state shows strip + contextual nudge, no banner
- Red state shows strip + red banner above input with reflection box and action buttons
- Session badge updates in real time
- Popover renders sparkline of last 10 scores
- Reflection credit system works (typing in box reduces next message score)
- Dismiss/bypass/reset all function correctly
- Session state persists across page refresh
- Works on both chat.openai.com and chatgpt.com
- No console errors on normal ChatGPT usage
- CSS is fully scoped — zero style leakage into ChatGPT's own elements
