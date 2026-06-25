/* global globalThis */
const LumenNudges = (() => {
  const STRIP = {
    loop: "loop · still with it?",
    drift: "drift · fewer questions",
    mismatch: (goal) => `mismatch · you said you'd ${goal}`,
    depth: "depth · worth thinking first?",
  };

  const STATES = {
    overwhelmed: {
      body: "You've been at this a while. That's fine — just checking in. Good place to take 5 if you need one.",
      primary: "Keep going",
      secondary: "Take a break",
    },
    stuck: {
      body: "What's one thing about this you already know, even roughly? You can hand it to AI to build from there.",
      primary: "Type something first →",
      secondary: "Skip, just write it",
    },
    unaware: {
      body: (n) =>
        `Last ${n} messages: all under 8 words, all asking for full outputs. Just showing you what I'm seeing — no judgment.`,
      primary: "Got it",
      secondary: "Tell me more",
    },
    intentional: {
      body: (task) => `This looks like ${task}. Should I stop flagging this for you?`,
      primary: (task) => `Yes — ${task} is fine to delegate`,
      secondary: "No, keep flagging",
    },
    mismatch: {
      body: (goal) => `When you set up Lumen, you said: "${goal}"`,
      primary: "Pause and draft myself",
      secondary: "My goal changed — continue",
    },
    depth: {
      body: "Before you read what the AI says — what's already true for you here?",
      primary: "Let me think first",
      secondary: "Skip — just ask",
    },
  };

  function stripLabel(type, goal) {
    if (type === "mismatch" && goal) {
      const short = goal.length > 28 ? goal.slice(0, 25) + "…" : goal;
      return STRIP.mismatch(short.toLowerCase().replace(/^i want to /i, ""));
    }
    return STRIP[type] || STRIP.loop;
  }

  function cardCopy(kind, ctx) {
    const t = STATES[kind];
    if (!t) return null;
    if (kind === "unaware") {
      return { ...t, body: t.body(ctx.passiveCount || 3) };
    }
    if (kind === "intentional") {
      return {
        body: t.body(ctx.taskType || "this"),
        primary: t.primary(ctx.taskType || "this"),
        secondary: t.secondary,
      };
    }
    if (kind === "mismatch") {
      return { ...t, body: t.body(ctx.goal) };
    }
    return { ...t };
  }

  function sessionShape(scores) {
    if (!scores.length) return "—";
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg < 35) return "Engaged";
    if (avg < 55) return "Mixed";
    if (avg < 75) return "Passive";
    return "Heavy offload";
  }

  return { stripLabel, cardCopy, sessionShape };
})();

globalThis.LumenNudges = LumenNudges;
