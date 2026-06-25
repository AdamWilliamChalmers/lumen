# Lumen — Signal Validation Strategy

## The problem stated plainly

The current scoring model is built on four heuristics:
- Short prompt = offloading
- Fast messages = dependency
- Long AI response + short follow-up = passive acceptance
- "Write me" phrasing = delegation

These are reasonable starting assumptions. They are not validated. Each one is wrong in specific, predictable circumstances:

- A user sending "summarise this" to a 10,000-word document is being efficient, not passive
- A developer sending "fix line 42" is being precise, not disengaged
- A researcher sending rapid-fire short queries is doing synthesis, not consuming
- A writer sending "make this shorter" six times is crafting, not delegating

If Lumen fires the wrong signal 20–30% of the time and the user has no way to correct it, trust erodes silently. They stop reading the strip. Then they stop noticing the extension. Then they uninstall. The false positive problem is existential, not cosmetic.

---

## Three routes to fixing it — in order of timeline

### Route 1: The feedback flywheel (build now — weeks)

This is not just a fix. It is the core data moat mechanism. Every 👍 or 👎 on a signal is a labelled training example — prompt text, signal type, context, and a human judgement about whether the signal was correct. Aggregated across thousands of users, this is a continuously improving supervised learning dataset being built for free as a byproduct of normal use.

The analogy is Waze. Waze didn't build traffic data — its users did, as a byproduct of driving with the app open. Every report took one tap. The data became more valuable than the app. Lumen's feedback loop is structurally identical: users spend one second, the model gets smarter, every user benefits, more users install it, more feedback flows in.

Three things must be true for this to work as a flywheel rather than just a feedback form:

1. **Effortless** — one tap, hover-visible on the strip, no modal, no form. More than 0.5 seconds = participation collapses.
2. **Immediately visible effect** — after a 👎, sensitivity for that task type drops *in this session* instantly. The user sees it working. This is what keeps them tapping.
3. **Feeds back to everyone** — aggregate 👎 data updates the shared model. Every user's false positive correction benefits all users. The model compounds.

Every signal that fires gives the user a one-tap correction mechanism. This doesn't validate the model immediately, but it stops false positives compounding and begins building the training data needed for routes 2 and 3.

**What to build in `engine.js` and `content.js`:**

Every `.lumen-strip` gets a tiny feedback button, invisible until hover:

```js
// In content.js — append to every strip
function createFeedbackButton(messageId, signalType, score) {
  const btn = document.createElement('button');
  btn.className = 'lumen-fb-btn';
  btn.setAttribute('aria-label', 'This signal was wrong');
  btn.setAttribute('title', 'Wrong signal?');
  btn.innerHTML = '✕';  // or a small icon
  btn.addEventListener('click', () => {
    recordFeedback(messageId, signalType, score, 'wrong');
    btn.textContent = 'noted';
    btn.disabled = true;
    // Propose exemption if same task type appears 3+ times
    checkExemptionThreshold(signalType, messageId);
  });
  return btn;
}

function recordFeedback(messageId, signalType, score, verdict) {
  const session = getSessionState();
  session.feedback = session.feedback || [];
  session.feedback.push({
    messageId,
    signalType,
    score,
    verdict,
    taskType: detectTaskType(messageId),
    timestamp: Date.now()
  });
  saveSessionState(session);
}
```

**What happens with the feedback:**

1. Immediately: if the same task type gets 3 "wrong" taps in one session, Lumen proposes an exemption — "Should I stop flagging [task type] for you?" One tap to confirm. This is the intentional user state handled correctly.

2. On session POST to lumen.so: the `feedback` array is included in the payload. This becomes the ground truth training data for improving the model.

3. In lumen.so: a feedback dashboard shows aggregate false positive rates by signal type, task type, and platform. This tells you exactly where the heuristics are failing and for whom.

**CSS — add to `widget.css`:**

```css
.lumen-fb-btn {
  opacity: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 10px;
  color: #444;
  padding: 0 4px;
  transition: opacity 0.15s;
  font-family: inherit;
}

.lumen-strip:hover .lumen-fb-btn {
  opacity: 1;
}

.lumen-fb-btn:hover {
  color: #f44336;
}

.lumen-fb-btn:disabled {
  color: #4caf50;
  opacity: 0.6;
}
```

---

### Route 2: Richer behavioural signals (build next — months)

The current four signals are all based on what the user types. They ignore what the user *does with the AI's response* — which is actually the better proxy for cognitive engagement.

**New signals to add, grounded in published HCI research:**

**Signal 5: Response dwell time**
How long does the user spend reading the AI response before sending their next message? Very short dwell time on a long response (under 10 seconds for a 300-word reply) is a strong passive acceptance signal — the user almost certainly didn't read it. Long dwell time suggests engagement.

```js
// Track time between AI response appearing and next user input
function trackDwellTime(aiMessageEl) {
  const appearedAt = Date.now();
  const observer = new MutationObserver(() => {
    if (isUserTyping()) {
      const dwell = Date.now() - appearedAt;
      const wordCount = countWords(aiMessageEl.innerText);
      const expectedReadTime = wordCount * 250; // ms per word at comfortable reading speed
      const dwellRatio = dwell / expectedReadTime;
      // dwellRatio < 0.2 = almost certainly didn't read
      // dwellRatio > 0.8 = probably read carefully
      session.lastDwellRatio = dwellRatio;
    }
  });
  observer.observe(document.querySelector('textarea'), { attributes: true });
}
```

Weight: add to passive acceptance signal. dwellRatio < 0.2 adds 20 points to passive acceptance score.

**Signal 6: Response edit rate**
If the user copies AI output and pastes it somewhere, that's delegation. If the user takes a small piece and types around it, that's collaboration. The extension can't measure paste destinations, but it can measure whether the user's next prompt references specific content from the AI response (quoting, correcting, building on).

```js
function scoreResponseEngagement(userMessage, priorAIMessage) {
  const aiText = priorAIMessage.innerText.toLowerCase();
  const userText = userMessage.toLowerCase();

  // Does the user quote or reference specific content from the AI response?
  const aiSentences = aiText.split('.').map(s => s.trim()).filter(s => s.length > 20);
  const referencesAI = aiSentences.some(sentence => {
    const words = sentence.split(' ').slice(0, 5).join(' ');
    return userText.includes(words);
  });

  // Does the user push back, question, or modify?
  const engagementPhrases = ['but', 'however', 'actually', 'i think', 'what about', 'why did you', 'that\'s not'];
  const pushesBack = engagementPhrases.some(p => userText.includes(p));

  if (referencesAI || pushesBack) return -15; // Score credit for engagement
  return 0;
}
```

**Signal 7: Question specificity**
Not just whether a message contains a question mark, but whether the question is specific (names a concept, references context) vs generic (open-ended delegation). "What is the best way to do this?" is a question mark but low specificity. "Why did you use a recursive approach rather than iterative here?" is high specificity and genuine engagement.

```js
function scoreQuestionSpecificity(message) {
  if (!message.includes('?')) return 0;

  const specificityMarkers = [
    /why (did|does|would|is)/i,
    /what (causes|happens|makes|determines)/i,
    /how (does|would|could) .{10,}/i,
    /\b(this|that|here|above|instead|rather than)\b/i
  ];

  const score = specificityMarkers.reduce((acc, pattern) =>
    acc + (pattern.test(message) ? 1 : 0), 0);

  return score >= 2 ? -12 : score === 1 ? -6 : 0;
}
```

---

### Route 3: Calibration study (plan now, run in months 2–4)

This is the only route that produces *validated* ground truth rather than proxies. It's also the one that generates publishable research — which is the data moat strategy made real.

**The study design:**

Recruit 25–40 willing participants (Edinburgh students, colleagues, or Lumen beta users who opt in). Run for 4 weeks. Each participant:

1. Uses Lumen normally during their AI sessions
2. At the end of each session, completes a 5-item self-report scale (2 minutes max):

```
After this session, how much would you say you...
1. Actively evaluated the AI's responses critically? (1–7)
2. Contributed your own thinking before asking AI? (1–7)
3. Understood the reasoning behind the AI's answers? (1–7)
4. Would have been able to produce a similar result yourself? (1–7)
5. Feel like you did the thinking, with AI assisting? (1–7)
```

This is adapted from the "Critical Thinking in AI Use Scale" published in ScienceDirect (May 2026) — it's academically grounded, not invented.

3. Lumen records its own session scores for the same sessions

**The analysis:**

Correlate Lumen's composite score against participants' self-reported cognitive engagement score for the same sessions. This tells you:

- Which signals are genuinely predictive (high correlation with self-report)
- Which signals are noise (no correlation)
- Which task types the model gets wrong systematically
- What weight adjustments would improve accuracy

**The output:**

- Revised signal weights, grounded in empirical data
- A published finding: "Lumen's heuristic model correlates with self-reported cognitive engagement at r = X" — this is the claim that makes the product credible to academics, employers, and education institutions
- The first step toward a peer-reviewed paper

**Where to run it:**

Edinburgh is the natural home. The School of Education, the Business School, or the informatics department all have potential participants and IRB (ethics board) frameworks. The study is low-risk (no deception, no sensitive data) so ethics approval should be straightforward.

**What to build for the study:**

A simple post-session survey trigger in the extension. After the `beforeunload` event fires (session end), instead of or in addition to the API POST, open a small survey prompt — either a popup or a new tab to a 5-question Typeform/Google Form. Participation is voluntary. Survey responses are stored alongside session data in lumen.so.

```js
// In session.js — trigger after session end for study participants
function triggerPostSessionSurvey() {
  const isStudyParticipant = chrome.storage.sync.get('studyParticipant');
  if (!isStudyParticipant) return;

  const surveyUrl = `https://lumen.so/survey?sessionId=${session.id}&platform=${session.platform}`;
  chrome.tabs.create({ url: surveyUrl, active: false });
}
```

---

## Immediate changes to the scoring model — before any validation data

While routes 1–3 are being built, apply these defensive changes to the existing model. Each reduces obvious false positives without requiring empirical validation:

**Change 1: Context-aware prompt length scoring**

The current model scores any message under 15 words as high offloading. This is wrong for code tasks and document tasks.

```js
function scorePromptLength(text, context) {
  const wordCount = text.split(' ').length;

  // If user appears to be working with code, calibrate differently
  const isCodeContext = context.platform === 'chatgpt' &&
    (text.includes('```') || /\b(function|const|def|class|import)\b/.test(text));

  // If prior AI response was very long (>500 words), short follow-up is more expected
  const priorResponseWasLong = context.priorAIWordCount > 500;

  if (isCodeContext) {
    // Short code prompts are surgical, not passive
    return wordCount < 5 ? 40 : wordCount < 15 ? 20 : 0;
  }

  if (priorResponseWasLong) {
    // After a very long response, even a short follow-up takes effort to formulate
    return wordCount < 5 ? 60 : wordCount < 15 ? 35 : 0;
  }

  // Default scoring
  return wordCount < 8 ? 100 : wordCount < 15 ? 80 : wordCount < 40 ? 50 : 0;
}
```

**Change 2: Task type calibration table**

Different task types have completely different offloading profiles. Admin tasks should be almost entirely exempt. Learning tasks should be scored more sensitively.

```js
const TASK_TYPE_MODIFIERS = {
  // Admin — high delegation is expected and fine
  email_drafting:      { scoreMultiplier: 0.2, autoExemptAfter: 2 },
  scheduling:          { scoreMultiplier: 0.1, autoExemptAfter: 1 },
  formatting:          { scoreMultiplier: 0.2, autoExemptAfter: 2 },

  // Research — rapid queries are synthesis, not passivity
  literature_search:   { scoreMultiplier: 0.4, autoExemptAfter: null },
  fact_checking:       { scoreMultiplier: 0.3, autoExemptAfter: null },
  summarisation:       { scoreMultiplier: 0.5, autoExemptAfter: null },

  // Creative / learning — score at full sensitivity
  essay_writing:       { scoreMultiplier: 1.0, autoExemptAfter: null },
  argument_building:   { scoreMultiplier: 1.0, autoExemptAfter: null },
  learning_concept:    { scoreMultiplier: 1.2, autoExemptAfter: null }, // Higher sensitivity

  // Code — depends on whether they're learning or just shipping
  code_generation:     { scoreMultiplier: 0.7, autoExemptAfter: null },
  debugging:           { scoreMultiplier: 0.5, autoExemptAfter: null },
  code_explanation:    { scoreMultiplier: 0.9, autoExemptAfter: null }
};

function detectTaskType(message, context) {
  // Keyword-based detection — replace with ML classifier in v4
  if (/write.*email|draft.*message|reply to/i.test(message)) return 'email_drafting';
  if (/summaris|tldr|key points|bullet/i.test(message)) return 'summarisation';
  if (/explain|how does|why does|help me understand/i.test(message)) return 'learning_concept';
  if (/write.*essay|draft.*paper|argument/i.test(message)) return 'essay_writing';
  if (/function|class|bug|error|code/i.test(message)) return 'code_generation';
  return 'general';
}
```

**Change 3: Conversation arc awareness**

A user who starts a conversation with deep questions and later shifts to short follow-ups is probably in a normal flow — they did their thinking up front. The current model penalises them for the follow-ups without crediting the opening.

```js
function computeConversationArc(messageHistory) {
  if (messageHistory.length < 3) return 'early';

  const firstThirdScores = messageHistory
    .slice(0, Math.floor(messageHistory.length / 3))
    .map(m => m.score);

  const avgEarlyScore = firstThirdScores.reduce((a, b) => a + b, 0) / firstThirdScores.length;

  // If the user engaged well early in the conversation, credit them later
  if (avgEarlyScore < 35) return 'strong_opener'; // discount later passive signals by 20%
  if (avgEarlyScore > 70) return 'passive_from_start'; // no discount
  return 'mixed';
}
```

---

## What the roadmap looks like

| Timeline | What | Effect |
|----------|------|--------|
| This week | Add feedback button to every strip | False positives get surfaced, not silently tolerated |
| This week | Context-aware prompt length scoring | Obvious false positives (code, doc tasks) eliminated |
| This week | Task type calibration table | Admin and research tasks calibrated correctly |
| This week | Conversation arc awareness | Users who think up front not penalised for later efficiency |
| Month 1 | Dwell time signal (Signal 5) | Passive acceptance scored from behaviour not just prompt |
| Month 1 | Response engagement signal (Signal 6) | Critical engagement rewarded from actual content |
| Month 1 | Question specificity signal (Signal 7) | Generic questions distinguished from specific ones |
| Month 2 | Calibration study (25–40 participants) | First empirically validated signal weights |
| Month 3 | Revised model weights from study data | False positive rate drops from ~25% to target <10% |
| Month 4 | First publishable finding | "Lumen's model correlates with self-reported cognitive engagement at r = X" |

---

## The claim that becomes possible

Once route 3 is complete, Lumen can say something no competitor can:

> "Our signal model is validated against self-reported cognitive engagement in a study of N participants. Signals correlate with actual critical thinking behaviour at r = 0.XX."

That sentence is worth more than any feature. It makes Lumen credible to universities, employers, and government bodies in a way that no amount of good design can replicate. It also makes the product defensible — if a competitor appears, they start at zero validation. You start at peer review.

The study is not expensive. It costs time and a small ethics submission. It is the highest-leverage investment available at this stage of the product.
