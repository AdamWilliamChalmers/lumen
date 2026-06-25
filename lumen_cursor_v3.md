# Lumen — Full Product Architecture & Cursor Build Instructions

## Read this entire document before writing a single line of code.
## Output a numbered implementation plan and STOP. Do not begin coding until confirmed.

---

## What Lumen is

A two-part product:

1. **A Chrome extension** — the sensor and in-session mirror. Watches conversations on ChatGPT, Claude, Gemini and Grok in real time. Detects cognitive offloading patterns. Shows a small inline signal under each message. Never blocks the user. Never judges. Just reflects.

2. **lumen.so — a companion web app** — the memory and social layer. Receives a session summary from the extension on close. Builds a weekly card. Hosts historical trends. Enables sharing. This is where the gamification and social layer live. This is what makes the extension worth paying for.

They are two separate codebases that need each other. The extension is the data collector. The web app is the memory and reflection surface.

---

## The data flow

```
User chats on ChatGPT / Claude / Gemini / Grok
        ↓
Extension detects signals in real time
        ↓
Extension stores session data in chrome.storage.session
        ↓
On browser close / session end → extension POSTs lightweight
session summary JSON to lumen.so API
        ↓
lumen.so stores summary in database (one row per session)
        ↓
lumen.so aggregates weekly → generates card → enables sharing
        ↓
User opens lumen.so → sees their history, card, community feed
```

---

## Project 1: The Chrome Extension (v3 rebuild)

### Location
`~/Desktop/Lumen/extension/`

### What changes from the existing v1/v2 build

The existing extension in `~/Desktop/Lumen/` is the v1/v2 POC. This is a full rebuild with the v3 signal system. Keep the old files for reference but build fresh in the `extension/` subfolder.

### File structure

```
extension/
├── manifest.json
├── content.js          # All injection logic, observer, widget rendering
├── engine.js           # Signal scoring, state management — platform agnostic
├── adapters/
│   ├── chatgpt.js      # DOM selectors and message extraction for ChatGPT
│   ├── claude.js       # DOM selectors for Claude.ai
│   ├── gemini.js       # DOM selectors for Gemini
│   └── grok.js         # DOM selectors for Grok
├── nudges.js           # Signal-to-message library
├── goals.js            # User intentions store, Mismatch detection
├── session.js          # chrome.storage.session + .sync management + API POST
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── widget.css          # All injected styles, scoped to #lumen-root
└── README.md
```

### Manifest V3

```json
{
  "manifest_version": 3,
  "name": "Lumen",
  "version": "3.0.0",
  "description": "Stay conscious of how you think alongside AI.",
  "permissions": ["storage", "alarms"],
  "host_permissions": [
    "https://chat.openai.com/*",
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*",
    "https://x.com/*"
  ],
  "content_scripts": [
    {
      "matches": [
        "https://chat.openai.com/*",
        "https://chatgpt.com/*",
        "https://claude.ai/*",
        "https://gemini.google.com/*",
        "https://x.com/i/grok*"
      ],
      "js": ["goals.js", "nudges.js", "engine.js", "adapters/chatgpt.js",
             "adapters/claude.js", "adapters/gemini.js", "adapters/grok.js",
             "session.js", "content.js"],
      "css": ["widget.css"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup/popup.html"
  }
}
```

### Platform adapter interface

Each adapter must export a standard object. `content.js` calls only this interface — never platform-specific DOM queries directly.

```js
// Example: adapters/chatgpt.js
window.LumenAdapters = window.LumenAdapters || {};
window.LumenAdapters['chat.openai.com'] = {
  hostname: 'chat.openai.com',
  getUserMessages: () => document.querySelectorAll('[data-message-author-role="user"]'),
  getAssistantMessages: () => document.querySelectorAll('[data-message-author-role="assistant"]'),
  getMessageText: (el) => el.innerText || '',
  getMessageContainer: () => document.querySelector('main') || document.body,
  isActive: () => window.location.hostname.includes('openai.com') ||
                  window.location.hostname.includes('chatgpt.com')
};
```

Build equivalent adapters for Claude.ai, Gemini, and Grok. Each must implement the same five properties. If selectors break, the adapter degrades gracefully — returns empty NodeList, never throws.

### The four signals (engine.js)

**Signal 1: Loop** (weight 20%)
Scores 0–100 based on prompt length. Under 8 words = 100. 8–14 words = 80. 15–40 words = 50. Over 40 words = 0.

**Signal 2: Drift** (weight 25%)
Message velocity. Over 5 messages in 3 minutes = 100. 4–5 = 70. 2–3 = 40. Under 2 = 0.

**Signal 3: Passive acceptance** (weight 30%)
Prior AI response over 300 words + user follow-up under 8 words + no question mark + no quote from prior response = 100. Prior AI over 200 words + user under 15 words + no question mark = 60. Otherwise scales down to 0.

**Signal 4: Task framing** (weight 25%)
Delegation phrases (write me, do this, create a, generate a, make me, just do, fix this for me) = 80–100. Editing phrases (improve this, rewrite this, fix this) = 40–60. Question phrases (how do I, why does, what is, help me understand, explain) = 0–20. Neutral = 30.

**Composite score = weighted sum of four signals (0–100)**

**Post-processing credits:**
- User typed in reflection textarea (>20 words): −15
- User typed in reflection textarea (>40 words): −25
- Message contains question mark: −8
- Message quotes prior AI response (>3 words): −10
- Task type is in user's exemption list: score reduced to max 20

### The four human states — what fires based on state detection

The composite score alone is not enough. Lumen also detects *why* the score is high and responds differently for each state:

**Overwhelmed** (high velocity + many sessions today OR user has been in session >45 minutes)
Response: "You've been at this a while. That's fine — just checking in. Good place to take 5 if you need one."
Buttons: "Keep going" / "Take a break"
Do NOT show a reflection prompt. Do NOT suggest they do it themselves.

**Stuck** (first occurrence of high task-framing score on a task type, low prior engagement on this topic)
Response: "What's one thing about this you already know, even roughly? You can hand it to AI to build from there."
Buttons: "Type something first →" / "Skip, just write it"
If user types something, prepend it silently to the next prompt as seed content.

**Unaware** (gradual drift into loop, no previous flags this session, no prior exemptions on this task type)
Response: "Last [N] messages: all under 8 words, all asking for full outputs. Just showing you what I'm seeing — no judgment."
Buttons: "Got it" / "Tell me more"

**Intentional** (repeated high offload on same task category across multiple sessions)
Response: "This looks like [detected task type]. Should I stop flagging this for you?"
Buttons: "Yes — [task type] is fine to delegate" / "No, keep flagging"
"Yes" writes a task-type exemption to chrome.storage.sync.

**Detection priority:** Check for exemption first (if exempt → no signal at all). Then check Overwhelmed. Then Stuck. Then Intentional. Default to Unaware.

### The inline strip

Injected as a `div.lumen-strip` immediately after each user message bubble, right-aligned.

```
Lumen  ●  loop · still with it?           (green #4caf50)
Lumen  ●  drift · fewer questions         (amber #ffc107)
Lumen  ●  mismatch · you said you'd...    (purple #b06aed)
Lumen  ●  depth · worth thinking first?  (blue #4a9fd4)
```

Height: 20px. Font: 11px. Dot: 7px. Right-aligned to match bubble. Appears on every user message regardless of score — green at low scores, escalating colours as score rises.

### Intervention cards

Cards appear below the strip (not as banners above the input) when state is detected. They are small, non-blocking, and always have a "Skip / Continue" path as prominent as the reflective path.

Cards for: Overwhelmed, Stuck, Mismatch (user's own stated goal), Depth (task worth thinking about).

Never a card for: Intentional (just the task-type learning prompt in the strip). Never for Loop when score is below 60.

### Session badge

Fixed top-right of viewport. Small pill: `Lumen` wordmark + coloured dot + "session" label. Clicking opens the popup. Updates in real time as session score changes.

### Session end — the API POST

When `window.beforeunload` fires (or after 30 minutes of inactivity), `session.js` POSTs to `https://api.lumen.so/v1/session`:

```json
{
  "userId": "uuid-from-sync-storage",
  "sessionDate": "2026-06-24",
  "platform": "chatgpt",
  "durationMinutes": 22,
  "messageCount": 14,
  "signals": {
    "loop": 44,
    "drift": 61,
    "passiveAcceptance": 38,
    "taskFraming": 52
  },
  "compositeScore": 49,
  "humanState": "unaware",
  "depthMoments": 3,
  "questionsAsked": 8,
  "consciousDelegates": 2,
  "loopBreaksTaken": 1,
  "interventionsFired": 2,
  "interventionsBypassed": 1,
  "reflectionsSubmitted": 1
}
```

If the API is unreachable, store in `chrome.storage.local` as a queue and retry on next session start.

### Popup (popup/popup.html)

A clean 400×500px popup. Three sections:

1. **This session** — sparkline of message scores (last 10), session shape label, duration
2. **My preferences** — list of active exemptions with delete buttons, link to edit goals
3. **My week** — "Open dashboard →" deep link to lumen.so/dashboard

No settings panel yet. No complex UI. Just the three sections and the deep link.

---

## Project 2: lumen.so — The Companion Web App

### Location
`~/Desktop/Lumen/web/`

### Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (Postgres + Auth)
- **Styling:** Tailwind CSS
- **Email:** Resend (for weekly digest)
- **Deployment:** Vercel

### File structure

```
web/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── dashboard/
│   │   └── page.tsx              # Main user dashboard
│   ├── card/
│   │   └── [userId]/
│   │       └── page.tsx          # Public shareable card
│   ├── community/
│   │   └── page.tsx              # Community feed
│   └── api/
│       ├── session/
│       │   └── route.ts          # POST endpoint — receives from extension
│       ├── card/
│       │   └── route.ts          # GET weekly card data
│       └── digest/
│           └── route.ts          # POST trigger for weekly email
├── components/
│   ├── WeeklyCard.tsx            # The shareable card component
│   ├── SparklineChart.tsx        # Mini bar chart for score history
│   ├── ShapeBadge.tsx            # Explorer / Thinker / Maker etc.
│   ├── SelfComparison.tsx        # This week vs last week
│   └── CommunityFeed.tsx         # Shapes not rankings
├── lib/
│   ├── supabase.ts
│   ├── scoring.ts                # Weekly aggregation logic
│   └── shapes.ts                 # Shape classification from weekly data
└── supabase/
    └── schema.sql                # Database schema
```

### Database schema (supabase/schema.sql)

```sql
-- Users
create table users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  email text unique,
  display_name text,
  share_card_public boolean default false,
  onboarding_goals jsonb,
  exemptions jsonb default '[]'
);

-- Sessions — one row per extension session POST
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  session_date date not null,
  platform text not null,
  duration_minutes integer,
  message_count integer,
  composite_score integer,
  human_state text,
  depth_moments integer default 0,
  questions_asked integer default 0,
  conscious_delegates integer default 0,
  loop_breaks_taken integer default 0,
  interventions_fired integer default 0,
  interventions_bypassed integer default 0,
  reflections_submitted integer default 0,
  signals jsonb,
  created_at timestamptz default now()
);

-- Weekly summaries — generated every Monday from sessions
create table weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  week_start date not null,
  shape text,
  intentional_pct integer,
  questions_asked integer,
  depth_moments integer,
  conscious_delegates integer,
  loop_breaks_taken integer,
  session_count integer,
  total_messages integer,
  insight_line text,
  card_shared boolean default false,
  created_at timestamptz default now(),
  unique(user_id, week_start)
);
```

### The weekly card (components/WeeklyCard.tsx)

Rendered as a React component. Also rendered as an OG image for social sharing (use `@vercel/og`).

Contents:
- Lumen wordmark + week label
- User's display name
- Four shape counts: depth moments, questions asked, conscious delegates, loop breaks
- Three bars: intentional use %, questions vs commands ratio, depth rate vs last week delta
- Auto-generated insight line (see insight line logic below)
- Share button → copies `lumen.so/card/[userId]?week=YYYY-MM-DD` to clipboard

The public card page (`app/card/[userId]/page.tsx`) shows the card read-only. No login required to view a shared card. This is the viral growth surface.

### Shape classification (lib/shapes.ts)

Takes a weekly summary and returns one of five shapes:

```ts
function classifyShape(summary: WeeklySummary): Shape {
  const { intentional_pct, questions_asked, depth_moments,
          conscious_delegates, total_messages } = summary;

  const questionRate = questions_asked / total_messages;
  const depthRate = depth_moments / total_messages;
  const delegateRate = conscious_delegates / total_messages;

  if (questionRate > 0.5) return 'Explorer';
  if (depthRate > 0.25) return 'Thinker';
  if (delegateRate > 0.3 && intentional_pct > 70) return 'Maker';
  if (intentional_pct < 50) return 'Delegator';
  return 'Balanced';
}
```

### Insight line logic (lib/scoring.ts)

The auto-generated one-liner on the card. Match the dominant pattern to a template. No LLM call — pure template substitution:

```ts
const INSIGHT_TEMPLATES = {
  thinker_high: "Mostly a thinker week — more depth moments than usual.",
  explorer_high: "Explorer mode all week. More questions than any week this month.",
  maker: "Maker week — high conscious delegation. Intentionality held steady.",
  overwhelmed: "Heavy session mid-week flagged as overwhelmed. You kept going.",
  ordinary: "Consistent with your baseline. A steady week.",
  recovery: "Strong depth recovery after a passive start.",
  mixed: "Mixed signals this week — passive early, more engaged by end."
};
```

Pick the template by comparing this week's dominant signal against last week and the baseline. If no clear pattern, use `ordinary`. Ordinary is not failure.

### The community feed (components/CommunityFeed.tsx)

Shows users who have opted in to public sharing (`share_card_public = true`) for the current week.

Each row shows:
- Avatar initials
- Display name
- Shape type + one-line description
- Shape badge icon(s)

No scores from other users. No ranking. No numbers except the count of cards shared this week. Order: most recent share first. No leaderboard, ever.

### The self-comparison (components/SelfComparison.tsx)

This week vs last week, side by side. Deltas shown neutrally:
- `+9% vs last week` not "great improvement"
- `−13% vs last week` not "you slipped"
- `same as last week` for flat

After four weeks of data, also show vs personal baseline (rolling 4-week average). This prevents a single outlier week distorting the user's sense of their normal.

### The API endpoint (app/api/session/route.ts)

Receives POST from extension. Validates the payload. Upserts user by userId (create if first session). Inserts session row. Returns 200.

Must handle: missing fields (default to 0), duplicate session posts (idempotent on session_date + platform + user_id + created_at within 5 minutes), requests from extension when user not yet signed up (store anonymously, link on first login).

### The weekly digest (app/api/digest/route.ts)

Triggered by a Vercel cron job every Monday at 8am UTC. For each Pro user:

1. Generate weekly summary from last 7 days of sessions
2. Classify shape
3. Generate insight line
4. Send email via Resend with the card rendered inline
5. Include one reflection question (curated, not generated — hardcoded list of 52, one per week of the year)

Free users get the in-app card only, no email digest.

### Landing page (app/page.tsx)

Simple. Three sections:

1. Hero: "Stay sharp while using AI." + install button (links to Chrome Web Store)
2. How it works: extension watches → signals appear inline → weekly card shows your shape
3. Community: sample cards from real users (with permission), shapes not scores

No pricing page yet — free extension, Pro waitlist.

---

## What goes where — the definitive answer

| Feature | Lives in | Why |
|---------|----------|-----|
| Inline signal strip | Extension | Needs to be inside ChatGPT/Claude/etc |
| Intervention cards | Extension | In-context, in the moment |
| Session badge | Extension | Real-time, injected into host page |
| Exemption store | Extension (chrome.storage.sync) | Needs to work offline |
| This-session sparkline | Extension popup | Quick glance, no login needed |
| Weekly card | lumen.so | Needs persistence, sharing, OG image |
| Historical trends | lumen.so | Needs database, cross-session data |
| Self-comparison | lumen.so | Needs multiple weeks of data |
| Community feed | lumen.so | Needs server, other users |
| Weekly digest email | lumen.so | Needs email service, scheduling |
| Onboarding / goals | lumen.so (primary) + popup (edit) | Better UX on web, accessible in popup |

---

## Build order — what to do first

### Phase 1: Extension v3 (build this first)
1. Scaffold the new `extension/` folder structure
2. Build `engine.js` with the four signals + four human states
3. Build `adapters/chatgpt.js` (primary platform)
4. Build `content.js` — observer, strip injection, card rendering
5. Build `widget.css` — all scoped styles
6. Build `goals.js` and `nudges.js`
7. Build `session.js` — storage + API POST stub (POST to localhost:3000 for now)
8. Build `popup/` — three sections, deep link
9. Test on ChatGPT — verify strip, cards, badge, popup
10. Add remaining adapters: claude.js, gemini.js, grok.js

### Phase 2: lumen.so (build second)
1. Scaffold Next.js app in `web/`
2. Set up Supabase project, run schema.sql
3. Build the API endpoint (`/api/session`) — verify extension can POST successfully
4. Build WeeklyCard component
5. Build dashboard page with SelfComparison and SparklineChart
6. Build public card page (`/card/[userId]`)
7. Build community feed
8. Build weekly digest trigger + Resend integration
9. Build landing page
10. Deploy to Vercel, point extension POST to production URL

---

## Open questions to answer before building Phase 2

1. **Auth:** How does a user connect their extension to their lumen.so account? Options: (a) user logs in on lumen.so, gets a token, pastes it into extension popup. (b) extension opens lumen.so OAuth flow. (b) is better UX, (a) is faster to build. Recommend (a) for POC.

2. **Anonymous sessions:** Should sessions be stored before a user creates an account? If yes, they can be retrospectively linked on signup (store a device UUID in chrome.storage.sync and pass it with each POST). Recommend yes — don't lose data.

3. **Pro tier:** When does paywall land? Recommend: everything free until 1,000 users, then introduce Pro with the digest and full history. Don't gate the card or community feed — they're the growth engine.

4. **Card sharing:** Should the shareable URL require login to view? No. Public card pages are the viral mechanic. Anyone should be able to see a shared card without signing up.

---

## Definition of done

### Extension v3
- Inline strip appears on all four platforms with correct signal and colour
- Four human states fire with correct cards and correct copy
- Exemption learning works — tap "yes" once, never flagged again for that task type
- Session summary POSTs to API on session end
- Popup shows session sparkline, exemptions, deep link
- Zero console errors on all four platforms

### lumen.so
- Extension can POST session data and it lands in Supabase
- Dashboard shows weekly card with correct shape, bars, insight line
- Public card page renders and is shareable
- Community feed shows opted-in users, shapes only, no scores
- Weekly digest sends on Monday with card + reflection question
- Landing page live with Chrome Web Store install link
