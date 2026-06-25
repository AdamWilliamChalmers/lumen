# Lumen v3.1

Cognitive fitness layer for AI — four signals, no red, no judgment.

## Setup

1. `chrome://extensions` → Developer mode → Load unpacked → this folder
2. Open [chatgpt.com](https://chatgpt.com)
3. Complete onboarding (optional — **Skip** → Ambient mode: Loop + Drift only)

## The four signals

| Signal | Colour | In-session |
|--------|--------|------------|
| **Loop** | Green | Strip + contextual nudge from dominant sub-signal |
| **Drift** | Amber | Strip label only (full analysis in popover digest) |
| **Mismatch** | Purple | Strip + card quoting *your* protected goals |
| **Depth** | Blue | Strip + invitation card (never blocks AI response) |

## Visibility modes

| Mode | Behaviour |
|------|-----------|
| **Ghost** | No in-session signals |
| **Ambient** | Loop + Drift strips |
| **Active** | All signals + Mismatch/Depth cards |
| **Focus** | Active + session goal calibrates Loop/Mismatch/Depth |

## Architecture

```
adapters/chatgpt.js   — platform adapter (standard interface)
engine.js             — Loop scoring + four-signal evaluation
goals.js              — onboarding, protected goals, modes
session.js            — lumen_session_{date} + drift history + digest log
nudges.js             — signal copy + weekly digest builder
sparkline.js          — badge popover chart
widget.js             — strips, cards, badge, onboarding
content.js            — adapter bootstrap
```

## v3.1 additions (from lumen_v3_design.md)

- Use-case Loop calibration (Research / Writing / Admin / etc.)
- Focus mode signal calibration via session goal
- Week-over-week Drift (+ passive acceptance trend)
- Loop contextual strip nudges by dominant sub-signal
- Mismatch high-frequency card copy; "My goal changed" removes goal
- Depth "Let me think first" dims AI responses; warm tone on high-stakes prompts
- Cross-platform session key: `lumen_session_{date}`
- "This week" digest section in badge popover (local Pro placeholder)

## Not yet built (spec)

- Pro weekly email digest
- Phase 2 adapters: Claude, Gemini, Grok
- Phase 3: Copilot, Perplexity
