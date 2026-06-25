# Lumen — Signal Taxonomy Fix (post v3.3.0)

## What Cursor found

v3.3.0 correctly implemented the full-screen overlay for Tier 1 delegation prompts. But the label shown was "loop · draft a version first?" — which is semantically wrong on message 1 of a conversation.

"Loop" implies a consumption spiral already in progress. On message 1, there is no loop. There is a first-message full-delegation request. These are different behaviours and need different signals.

---

## The root cause

The current four-signal taxonomy (Loop, Drift, Mismatch, Depth) does not have a signal for first-message conscious delegation. The task framing sub-score was grouped under Loop because it's an in-the-moment signal — but "in the moment" covers two very different situations:

- **Message 1:** User is about to hand over an entire task they haven't started
- **Message 5+:** User has been passively consuming AI output without engagement

These should look and feel different to the user. Calling both "loop" conflates them.

---

## The fix: five signals, not four

Add a fifth signal: **Hand-off**

| Signal | Colour | When it fires | What it means |
|--------|--------|---------------|---------------|
| Hand-off | Amber | Message 1–2 only, Tier 1 prompt, no exemption | You're delegating entirely before starting |
| Loop | Green→Amber | Messages 3+, passive pattern developing | You're in a consumption cycle |
| Drift | Amber | Weekly digest only | Your pattern is shifting over time |
| Mismatch | Violet | Any message, matches stated goal | This conflicts with what you said you wanted |
| Depth | Blue | Any message, high-stakes personal/reflective | Worth thinking before you read the answer |

---

## Hand-off signal — full spec

### When it fires

All three conditions must be true:
1. Message number is 1 or 2 in this conversation
2. Prompt matches Tier 1 task framing (write me, just do, complete/entire, do this for me)
3. Task type is NOT in user's exemption list

### What it shows

**Strip label:** `hand-off · start with your own draft?`

**Overlay (for strongest Tier 1 phrases):** Full-screen dark overlay with amber-bordered panel:

```
Start with your own version?
You're asking for [detected task type] in one go.
Even a rough paragraph changes how you use the answer.

[ I'll draft something first ]    [ Continue — show AI answer ]
```

The overlay hides the AI response until the user chooses. The AI has already generated the response — it is revealed or replaced, not cancelled.

### What it does NOT show

- The word "loop" — not in the strip, not in the overlay
- Any implication the user has been passive before (they haven't — it's message 1)
- Any alarm language — amber, not red

### When it does NOT fire

- Task type is in the user's exemption list → no signal at all
- Message number is 3+ → Loop signal takes over
- Prompt is Tier 2 or lower → no overlay, just the strip (amber)
- Prompt is a learning question or debugging question → green, no overlay

---

## Loop signal — revised scope

Loop now fires only from message 3 onwards. It reflects a pattern in the conversation, not a single act.

### When it fires

- Messages 3+ in a conversation
- Composite score crosses amber threshold (40+)
- Driven primarily by: velocity + passive acceptance + repeated Tier 2 framing

### What it shows

Strip label on amber: `loop · still with it?`
Strip label on high amber: `loop · what do you already know about this?`
Card (at red threshold): the four human-state responses (overwhelmed / stuck / unaware / intentional)

### Key difference from Hand-off

Loop is about a pattern. Hand-off is about a single moment. The user should feel them differently:

- Hand-off: "before you hand this over entirely — pause"
- Loop: "you've been in a passive cycle for a few messages — check in"

---

## Label changes required in nudges.js

```js
// BEFORE
taskFraming: "loop · draft a version first?",

// AFTER — message 1-2
handOff: "hand-off · start with your own draft?",

// AFTER — message 3+
loop: "loop · still with it?",
loopMid: "loop · what do you already know about this?",
loopHigh: "loop · what would you change about that answer?",
```

---

## Overlay trigger logic — revised

The full-screen overlay fires when:

```js
function shouldShowOverlay(message, conversationState, userSettings) {
  const { messageIndex, taskType, tier } = message;
  const { exemptions, mode } = userSettings;

  // Never show overlay for exempt task types
  if (exemptions.includes(taskType)) return false;

  // Never show overlay in Ghost mode
  if (mode === 'ghost') return false;

  // Hand-off overlay: message 1-2, Tier 1 only
  if (messageIndex <= 2 && tier === 1) return 'handoff';

  // Loop overlay: message 3+, score above red threshold (70+)
  if (messageIndex > 2 && compositeScore >= 70) return 'loop';

  return false;
}
```

---

## The "Continue anyway" button

When the user clicks "Continue — show AI answer":

1. The overlay dismisses
2. The AI response reveals (it was already generated, just hidden)
3. The strip shows the appropriate signal label
4. The event is logged: `overlayBypassed: true`

When the user clicks "I'll draft something first":

1. The overlay dismisses
2. The AI response is **replaced** with a reflection textarea
3. Placeholder: "Your rough draft — even one sentence..."
4. A "Submit my draft + ask AI" button appears — sends both the user's draft and the original prompt together
5. This rewards engagement: the user's draft becomes seed material, AI builds on it

The "Submit my draft + ask AI" combined prompt behaviour:

```js
function buildCombinedPrompt(userDraft, originalPrompt) {
  return `Here's my starting point:\n\n"${userDraft}"\n\n${originalPrompt}`;
}
```

This is the most important UX detail. The user who drafts first doesn't lose the AI's help — they get better AI help because the AI builds from their thinking rather than replacing it.

---

## Changes needed in the extension

### content.js
- Add `messageIndex` tracking to conversation state
- Change overlay trigger condition from `tier === 1` to `tier === 1 && messageIndex <= 2`
- Add Loop overlay trigger for `messageIndex > 2 && score >= 70`

### nudges.js
- Add `handOff` key with correct label
- Revise `taskFraming` key to `loop` for message 3+
- Remove "loop · " prefix from first-message nudges

### engine.js
- Track `conversationMessageCount` (reset on new conversation)
- Pass `messageIndex` to signal scoring functions
- Apply Hand-off signal only when `messageIndex <= 2`
- Apply Loop signal only when `messageIndex > 2`

### widget.css
- Add `.lumen-signal-handoff` class — same amber colour as Loop but distinct label
- No new colours needed — Hand-off uses `--lm-drift` (amber) same as Loop amber

---

## What this fixes

| Issue | Before | After |
|-------|--------|-------|
| "loop" label on message 1 | Confusing — implies a spiral before one exists | "hand-off" — accurate, no baggage |
| Overlay on exempted task types | May fire on admin emails | Never fires on exempted types |
| Loop firing too early | Fires on message 1 task framing | Fires only from message 3+ |
| No distinction between delegation and spiral | Both called "loop" | Clearly separate signals with different labels, different UX |

---

## What this does NOT change

- The overlay behaviour itself (hide response, two buttons) — this is correct
- The composite score calculation — unchanged
- The four human states (overwhelmed, stuck, unaware, intentional) — unchanged
- The Mismatch and Depth signals — unchanged
- The weekly card and social layer — unchanged
