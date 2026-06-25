# Lumen — Cursor Agent Prompt

## Instructions for Cursor
Read this entire document before writing a single line of code.
After reading, output a numbered implementation plan and STOP.
Do not begin coding until the plan has been confirmed.

---

## Project overview

Build a Chrome extension called **Lumen**.

It injects a small floating widget into `chat.openai.com` that monitors the user's conversation behaviour in real time and warns them when they appear to be cognitively offloading — passively delegating thinking to the AI rather than engaging critically.

This is a proof-of-concept. Prioritise working functionality over polish.

---

## What the extension does

### Signal detection
A content script watches the ChatGPT conversation DOM using a `MutationObserver`. Every time a new user message or assistant response appears, it extracts and scores four signals:

1. **Prompt length** — very short user messages (under ~15 words) score high on the offloading scale. The user put in minimal effort.
2. **Message velocity** — more than 4 user messages in a 3-minute window scores high. Rapid-fire usage suggests dependency.
3. **Passive acceptance** — a long AI response (>200 words) followed by a user message of under 15 words (or no follow-up within 60 seconds before the next prompt) suggests the user accepted the output without critical engagement.
4. **Task-framing** — user messages containing task-delegation patterns score high. Patterns include: "write me", "do this", "create a", "generate a", "make me", "fix this for me", "just do", "can you do". Question-asking patterns ("how do I", "why does", "what is", "help me understand") score low.

### Scoring engine
Each signal contributes a weighted sub-score (0–100). Combine with these weights:
- Prompt length: 20%
- Message velocity: 25%
- Passive acceptance: 30%
- Task-framing: 25%

Produce two composite scores:
- **Conversation score** — rolling average of the last 5 messages in this chat
- **Session score** — cumulative average across all messages since the extension was activated (persisted in `chrome.storage.session`)

Map both scores to traffic light states:
- 0–39 → GREEN
- 40–69 → AMBER
- 70–100 → RED

### Widget UI
Inject a small floating panel fixed to the top-right of the `chat.openai.com` viewport.

Structure:
```
[ Lumen ]
  This chat   ●  (green/amber/red dot + label)
  Session     ●  (green/amber/red dot + label)
  ──────────────
  [nudge text — only shown when amber or red]
```

The widget is draggable by its header. It starts collapsed to just the two traffic lights and expands on hover or click to show the nudge.

**Nudge library** — contextual suggestions shown at amber/red. Rotate through these and pick one semi-randomly when the score changes state:

- "Before submitting, could you draft a rough version yourself first?"
- "Try explaining what you already know about this, then ask for what's missing."
- "What would your answer be if you had to guess? Start there."
- "Break this into one specific question rather than asking for the whole thing."
- "What part of this could you look up yourself in 2 minutes?"
- "Write out your thinking first, then ask Claude to check it."

At RED, prefix the nudge with: "⚠ High offloading detected — "

---

## File structure to create

```
lumen/
├── manifest.json          # Manifest V3
├── content.js             # MutationObserver, signal detection, scoring, widget injection
├── widget.css             # Widget styles only (injected via manifest)
├── nudges.js              # Nudge library array, exported
├── README.md              # Setup and load instructions
```

No build step. No frameworks. Vanilla JS + CSS only. The extension must load directly in Chrome via "Load unpacked".

---

## Technical constraints

- Manifest V3 only
- No external network requests
- No background service worker needed for POC — all logic in content script
- Use `chrome.storage.session` for session score persistence
- Widget must not interfere with ChatGPT's own UI interactions (clicks, keyboard, textarea focus)
- Widget z-index must be above ChatGPT's modals (use z-index: 2147483647)
- DOM selectors: ChatGPT's message structure uses `[data-message-author-role="user"]` and `[data-message-author-role="assistant"]` — use these, but write a fallback in case they change
- The widget CSS must be scoped to avoid style leakage into ChatGPT's own elements (use a `#lumen-root` wrapper with CSS custom properties)

---

## Colour tokens for the widget

Use these exact values. Do not use any ChatGPT colours.

```css
--lm-bg: #1a1a2e;
--lm-border: #2d2d4e;
--lm-text: #e8e8f0;
--lm-text-muted: #9090aa;
--lm-green: #4caf50;
--lm-amber: #ffc107;
--lm-red: #f44336;
--lm-header: #12122a;
--lm-radius: 10px;
--lm-shadow: 0 4px 24px rgba(0,0,0,0.4);
```

---

## Plan before building

Before writing any code, output:

1. A numbered list of every file you will create
2. For each file, a bullet list of every function or section it will contain
3. The exact DOM selectors you plan to use to detect user and assistant messages
4. How you will handle the case where the ChatGPT DOM selectors change or are not found
5. The MutationObserver strategy (what node to observe, what config)
6. Any open questions or ambiguities you want to flag before proceeding

**Stop after outputting the plan. Do not write code yet.**
Wait for confirmation, then proceed to build all files completely in agent mode.

---

## Definition of done (POC)

- Extension loads in Chrome without errors
- Widget appears at top-right of chat.openai.com
- Traffic lights update in real time as the user chats
- Nudge text appears when amber or red
- Session score persists across page refreshes within the same browser session
- No console errors on normal ChatGPT usage
