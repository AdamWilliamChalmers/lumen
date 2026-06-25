const LumenNudges = (() => {
  const HANDOFF_LABEL = "hand-off · start with your own draft?";

  const LOOP_NUDGES = {
    default: "loop · still with it?",
    mid: "loop · what do you already know about this?",
    high: "loop · what would you change about that answer?",
    passive: (count) => `loop · ${count} messages, mostly passive`,
    promptLength: "loop · what do you already know?",
    velocity: "loop · what's the core question?",
    passiveAcceptance: "loop · what surprised you?",
  };

  const DEPTH_PLACEHOLDERS = {
    decision: "What's your instinct before the AI answers?",
    learning: "What do you already know that's relevant here?",
    authorship: "What would you write differently here, even in rough notes?",
    default: "What's worth sitting with before you ask?",
  };

  const TASK_TYPE_PHRASES = {
    essay_writing: "an essay",
    argument_building: "an argument",
    literature_search: "research with citations",
    code_generation: "code",
    email_drafting: "an email",
    general: "this task",
  };

  const DIGEST_PROMPTS = [
    "What did you figure out yourself this week, without AI?",
    "Was there a moment where you surprised yourself?",
    "What would you do differently if AI disappeared tomorrow?",
    "When did you engage most critically with an answer this week?",
  ];

  function truncate(text, max = 40) {
    if (text.length <= max) return text;
    return text.slice(0, max - 1) + "…";
  }

  function pickRandom(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function taskTypePhrase(taskType) {
    return TASK_TYPE_PHRASES[taskType] || TASK_TYPE_PHRASES.general;
  }

  function getHandOffLabel() {
    return truncate(HANDOFF_LABEL);
  }

  function getLoopLabel(signals, loopScore, passiveCount) {
    if (loopScore >= 70) return truncate(LOOP_NUDGES.high);
    if (loopScore >= 40) return truncate(LOOP_NUDGES.mid);
    if (passiveCount >= 3) return truncate(LOOP_NUDGES.passive(passiveCount));

    let dominant = "promptLength";
    let max = signals.promptLength;
    for (const key of ["velocity", "passiveAcceptance", "taskFraming"]) {
      if (signals[key] > max) {
        max = signals[key];
        dominant = key;
      }
    }
    if (max >= 60 && LOOP_NUDGES[dominant]) return truncate(LOOP_NUDGES[dominant]);
    return truncate(LOOP_NUDGES.default);
  }

  function getHandOffOverlayCopy(taskType) {
    return {
      kicker: "Lumen · hand-off",
      title: "Start with your own version?",
      body: `You're asking for ${taskTypePhrase(taskType)} in one go. Even a rough paragraph changes how you use the answer.`,
      draftLabel: "I'll draft something first",
      continueLabel: "Continue — show AI answer",
      draftPlaceholder: "Your rough draft — even one sentence…",
      submitLabel: "Submit my draft + ask AI",
    };
  }

  function getLoopOverlayCopy() {
    return {
      kicker: "Lumen · loop",
      title: "Still with it?",
      body: "You've been in a mostly passive pattern for a few messages. Worth checking in before you continue.",
      draftLabel: "Let me engage first",
      continueLabel: "Continue — show AI answer",
      draftPlaceholder: "What's your take so far — even one sentence…",
      submitLabel: "Submit my thoughts + continue",
    };
  }

  function buildCombinedPrompt(userDraft, originalPrompt) {
    return `Here's my starting point:\n\n"${userDraft}"\n\n${originalPrompt}`;
  }

  function getMismatchLabel(goal) {
    const short = goal.length > 22 ? goal.slice(0, 19) + "…" : goal;
    return truncate(`mismatch · you said you'd ${short.toLowerCase().replace(/^i want to /i, "")}`);
  }

  function getMismatchCardCopy(goal, mismatchCount) {
    if (mismatchCount >= 3) {
      return {
        title: "When you set up Lumen, you said:",
        body: `"${goal}" — you've checked this intention ${mismatchCount} times today.`,
        pauseLabel: "Pause and draft myself",
        continueLabel: "My goal changed — continue",
      };
    }
    return {
      title: "When you set up Lumen, you said:",
      body: `"${goal}"`,
      pauseLabel: "Pause and draft myself",
      continueLabel: "My goal changed — continue",
    };
  }

  function getDepthCardCopy(taskType, warm) {
    if (warm) {
      return {
        title: "This one matters to you",
        body: "Before you read what the AI says — what's already true for you here?",
        placeholder: DEPTH_PLACEHOLDERS[taskType] || DEPTH_PLACEHOLDERS.default,
        thinkLabel: "Let me think first",
        skipLabel: "Skip — just ask",
      };
    }
    return {
      title: "Worth thinking first?",
      body: "This looks like a moment where the thinking is the point. A beat before you read the answer can help.",
      placeholder: DEPTH_PLACEHOLDERS[taskType] || DEPTH_PLACEHOLDERS.default,
      thinkLabel: "Let me think first",
      skipLabel: "Skip — just ask",
    };
  }

  function detectDepthTaskType(text) {
    if (/should i|how do i decide|is it worth|what career/i.test(text)) return "decision";
    if (/i want to understand|help me learn/i.test(text)) return "learning";
    if (/write my|create my/i.test(text)) return "authorship";
    return "default";
  }

  function isHighStakesDepth(text) {
    return /should i|what career|how do i decide|write my|create my/i.test(text);
  }

  function buildDigest({ history, session, digestLog }) {
    const week = history.slice(-7);
    const avgQuestion =
      week.length ? week.reduce((s, e) => s + e.questionRatio, 0) / week.length : 0;
    const prior = history.slice(-14, -7);
    const priorQuestion =
      prior.length ? prior.reduce((s, e) => s + e.questionRatio, 0) / prior.length : avgQuestion;

    let headline = "Mostly steady engagement this week.";
    if (avgQuestion < priorQuestion - 0.08) headline = "Slightly more passive than last week.";
    if (avgQuestion > priorQuestion + 0.08) headline = "More questioning and critical engagement this week.";

    const loopTrend = session.loopScores.slice(-7);
    const driftLines = week.length
      ? [
          `Questions: ${Math.round(avgQuestion * 100)}% of messages`,
          `Avg prompt length: ${Math.round(week.reduce((s, e) => s + e.avgPromptLength, 0) / week.length)} words`,
          `Passive replies: ${Math.round(week.reduce((s, e) => s + e.passiveRate, 0) / week.length * 100)}%`,
        ]
      : ["Not enough data yet — keep chatting with Lumen active."];

    return {
      headline,
      loopTrend,
      driftLines,
      depthMoments: (digestLog.depthMoments || []).slice(-3),
      mismatchSummary: `${session.mismatchCount || 0} intention checks this session`,
      prompt: pickRandom(DIGEST_PROMPTS),
    };
  }

  return {
    truncate,
    getHandOffLabel,
    getLoopLabel,
    getHandOffOverlayCopy,
    getLoopOverlayCopy,
    buildCombinedPrompt,
    getMismatchLabel,
    getMismatchCardCopy,
    getDepthCardCopy,
    detectDepthTaskType,
    isHighStakesDepth,
    buildDigest,
  };
})();

globalThis.LumenNudges = LumenNudges;
