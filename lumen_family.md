# Lumen — Family & Parental Visibility

## What this is not

Lumen is not a parental control tool. It does not block AI usage, set time limits, filter topics, or enforce rules. Those products exist (Google Family Link, Apple Screen Time, Circle) and compete in a crowded, well-funded market. Lumen would lose that fight, and more importantly, it would destroy the product philosophy in the attempt.

The "mirror not nanny" principle applies to children as much as adults. A teenager who feels surveilled will disable the extension. A teenager who feels seen will share voluntarily.

---

## The actual problem worth solving

Parents who are thoughtful enough to worry about AI and cognitive development — the exact people drawn to Lumen's philosophy — are not looking for a kill switch. They want:

1. A shared language for talking about AI use without it becoming a fight
2. A window into how their child is actually thinking, not just how much they're using AI
3. A positive intervention they can point their child toward, instead of a punitive one

Lumen can serve all three without compromising its identity. The mechanism is visibility by consent, not control by enforcement.

---

## Age segmentation — different ages need different things

| Age | What they need | Lumen's role |
|-----|---------------|--------------|
| Under 13 | Genuine protection. Not yet developed self-regulatory capacity. Parent is the appropriate decision-maker. | Wrong product. This is a content filter / screen time market. Do not build for this age group. |
| 13–15 | Developing autonomy. Blunt control causes rebellion and hiding. Needs scaffolding, not gates. | Works if parent and child both see the same data by mutual agreement. Shared visibility, not surveillance. |
| 16–18 | Approaching adult autonomy. Parental control is increasingly counterproductive. Self-awareness and conversation works better. | Standard Lumen. Optional child-initiated sharing. No enforcement mechanism. |
| 18+ students | University context. Academic integrity concern. No parental role — institutional role. | Lumen for Education (B2B). Separate product motion entirely. |

**Hard rule: Lumen does not build features for under-13s.** That is a regulated, liability-heavy, philosophically incompatible market. The minimum age for Lumen is 13, with explicit parental consent required at account creation for 13–17.

---

## The product model: child-led sharing

The child owns their Lumen data entirely. The parent has no access unless the child explicitly grants it.

### How it works

1. The child uses Lumen normally. Their session data, weekly card, and shape history are theirs.
2. In the lumen.so dashboard, the child sees a **"Share with family"** option — same mechanic as sharing a card publicly, but directed to a specific person.
3. The child enters a parent's email. The parent receives an invitation to view their child's weekly card.
4. **The parent sees exactly what the child chooses to share** — the weekly card only, by default. Nothing else. No session logs, no message content, no raw scores.
5. The child can revoke sharing at any time, instantly, from their own dashboard.

### What the parent receives

A weekly email containing the child's Lumen card:
- Their thinking shape for the week (Explorer, Thinker, Maker, etc.)
- The four counts: depth moments, questions asked, conscious delegates, loop breaks taken
- The intentional use percentage
- The auto-generated one-line insight
- A single conversation-starter question (see below)

No session-by-session data. No message content. No raw scores. No comparison to other children. No judgement language.

### The conversation-starter question

The most important element of the parent email is not the data — it is the question at the bottom that gives parents something to say that isn't "how much were you on AI this week?"

The question is curated, not generated. It changes weekly and is derived from the child's dominant shape:

**Explorer week:**
"What's the most interesting thing you found out this week — something you looked up or asked about?"

**Thinker week:**
"Was there a moment this week where you figured something out yourself before asking AI? What was it?"

**Maker week:**
"You delegated a lot this week — what was the most important thing you kept doing yourself?"

**Delegator week:**
"What would you have done differently if AI hadn't been available for one of those tasks?"

**Balanced week:**
"Looking back at your AI conversations this week — which one felt most like a collaboration?"

These questions accomplish something parental controls never can: they make the teenager the expert in the conversation. They have the data. They know what happened. The parent is asking to understand, not to judge. That dynamic is worth more than any enforcement mechanism.

---

## What the parent cannot do

This is as important as what they can do.

- **Cannot see message content.** No prompts, no AI responses, no conversation logs. Never.
- **Cannot set rules or limits.** No time caps, no topic blocks, no session limits. Lumen does not enforce anything.
- **Cannot see other people's data** for comparison. No "your child vs average" metrics.
- **Cannot receive data without child's knowledge.** The child always knows sharing is on. There is no hidden mode.
- **Cannot override the child's signals.** If the child turns off sharing, it turns off immediately. No override.

---

## Family Pro tier

The sharing mechanic unlocks a new household billing unit.

### Lumen Family (£12/month)

Includes:
- One child account (13–17, requires parental consent at signup)
- Standard Lumen extension features for the child
- Weekly card shared with up to 2 parent/guardian email addresses
- Parent receives the weekly digest email with conversation-starter question
- Child's full historical card archive (vs 4-week limit on free)
- Parent dashboard on lumen.so: view-only access to child's weekly cards, no other data

**The child must initiate sharing.** The parent cannot add themselves without the child's approval. This is enforced at the product level, not just stated in terms of service.

### Why this is a viable revenue motion

- Parents who care about their child's cognitive development in the AI era are willing to pay for a positive intervention
- Schools can recommend Lumen Family to parents as an alternative to AI detection tools — this is a B2C channel that doesn't require school procurement
- The emotional resonance is high: "help your child think well alongside AI" is a message parents respond to
- Natural gifting moment: parents buying for teenagers at the start of a school year or exam period

---

## What to say to parents who want more control

Some parents will want enforcement. They will ask for time limits, content blocking, AI usage caps. The answer is honest and direct:

> "Lumen is designed to build your child's own self-awareness about how they use AI — not to control their behaviour from the outside. Experience shows that teenagers route around enforcement tools quickly, but a child who genuinely understands their own patterns makes better choices. If you need hard controls, Apple Screen Time and Google Family Link are designed for that. Lumen is designed for the next step: once your child is using AI, helping them use it well."

This is not a failure to serve the market. It is a clear positioning statement that protects the product's integrity and targets the right customer — parents who are thoughtful enough to want a developmental tool, not a surveillance one.

---

## Safeguarding considerations

Building any product used by 13–17 year olds requires careful attention to safeguarding obligations.

### Data minimisation
Lumen already collects minimal data by design. For under-18 accounts:
- No conversation content is ever stored — only behavioural signals (prompt length, velocity, etc.)
- No personally identifiable information beyond email and display name
- Session data is anonymised at the database level — no way to reconstruct what a child was asking AI

### Consent chain
- Under-18 account creation requires a parent/guardian email at signup
- Parent receives a confirmation email explaining what Lumen collects and does not collect
- Explicit confirmation required before the child's account activates
- Clear privacy policy written in plain language, not legal boilerplate

### GDPR and COPPA
- GDPR Article 8: processing of children's data requires parental consent for under-16s in the EU (under-13 in the US under COPPA)
- Lumen's minimum age of 13 with parental consent at signup satisfies both frameworks
- Right to erasure: child or parent can delete all data at any time, immediately
- Data residency: EU user data stored in EU region (Supabase supports this)

### What to get legal advice on
Before launching the family product, get specific legal advice on:
1. Age verification obligations (how to verify a user is actually 13+)
2. Parental consent verification (email confirmation is weak — is that sufficient in target markets?)
3. GDPR Article 8 compliance in specific EU member states (age of consent for data processing varies: 13 in some countries, 16 in others)

Do not launch the family product without this advice. The data minimisation approach makes the legal risk low, but it needs to be confirmed.

---

## What not to build

These are tempting additions that would compromise the product or create unacceptable liability:

- **A parent dashboard showing session-by-session data.** Too granular. Feels like surveillance. The weekly card is the right level of visibility.
- **AI usage time tracking.** This is screen time territory — different product, different liability.
- **Content filtering or topic blocking.** Not Lumen's job. Philosophically incompatible.
- **Comparison to peers.** "Your child uses AI more/less than average" creates shame and competition. Not the dynamic Lumen wants.
- **Alerts or notifications to parents when scores are high.** The child is the primary user. The parent does not get real-time alerts. That's surveillance.
- **A separate "parent mode" that changes how the extension behaves.** The extension always behaves the same way, for every user. No hidden modes.

---

## Positioning

The one-sentence pitch to parents:

> "Instead of trying to stop your teenager using AI, help them use it well."

The one-sentence pitch that differentiates from parental controls:

> "Lumen builds your child's self-awareness. Screen time tools build compliance. Self-awareness lasts."

The school channel pitch:

> "Rather than catching students using AI, show them how they're using it — and help them make better choices themselves."

---

## Build order

This is not a v1 or v2 feature. Build it after:
1. The core extension is stable on at least two platforms
2. lumen.so has working auth, session storage, and weekly card generation
3. The social sharing mechanic (share card via link) is built and tested
4. Legal advice on under-18 data handling is obtained

Estimated build complexity once the above is in place: medium. The family feature reuses the weekly card component and the share mechanic. The new elements are: parental consent flow at signup, the family sharing toggle in the child's dashboard, the parent view-only dashboard, and the parent weekly email template with conversation-starter questions.

The conversation-starter questions are the most important thing to get right. Write them carefully. Test them with real parents and teenagers. They are the product.
