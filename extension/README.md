# Lumen Extension v3

Fresh v3 rebuild per `lumen_cursor_v3.md`. Load this folder as an unpacked extension in Chrome.

## Load

1. Open `chrome://extensions`
2. Enable Developer mode
3. **Load unpacked** → select this `extension/` folder
4. Visit ChatGPT, Claude, Gemini, or Grok

## Signals

Four weighted sub-signals compose the composite score (0–100):

- **Loop** — prompt length (20%)
- **Drift** — message velocity (25%)
- **Passive acceptance** — short follow-ups after long AI replies (30%)
- **Task framing** — delegation vs inquiry (25%)

Human states (Overwhelmed, Stuck, Unaware, Intentional) drive intervention cards.

## API

Session summaries POST to `http://localhost:3000/api/session` on tab close or 30 min inactivity. Failed posts queue in `chrome.storage.local`.

## Popup

Click the session badge or extension icon for sparkline, exemptions, and dashboard link.
