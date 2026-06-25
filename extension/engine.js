/* global globalThis */
const LumenEngine = (() => {
  const WEIGHTS = { loop: 0.2, drift: 0.25, passiveAcceptance: 0.3, taskFraming: 0.25 };

  const DELEGATION = [
    /write me/i, /do this/i, /create a/i, /generate a/i, /make me/i, /just do/i,
    /fix this for me/i, /draft a/i, /build me/i, /give me a/i, /complete this/i,
  ];
  const EDITING = [/improve this/i, /rewrite this/i, /fix this/i, /polish this/i, /clean up this/i];
  const QUESTION = [
    /how do i/i, /why does/i, /what is/i, /help me understand/i, /explain/i,
    /what would you change/i, /does this make sense/i,
  ];

  const DEPTH_TRIGGERS = [
    /should i\b/i, /what career/i, /how do i decide/i, /is it worth/i,
    /i want to understand/i, /help me learn/i, /what do i really want/i,
  ];
  const DEPTH_EXEMPT = [/debug/i, /error/i, /summarize/i, /translate/i, /regex/i, /api endpoint/i];

  function wordCount(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  function containsQuoteFromAi(userText, aiText) {
    if (!aiText) return false;
    const aiWords = aiText.toLowerCase().split(/\s+/).filter(Boolean);
    for (let i = 0; i <= aiWords.length - 4; i += 1) {
      const phrase = aiWords.slice(i, i + 4).join(" ");
      if (userText.toLowerCase().includes(phrase)) return true;
    }
    return false;
  }

  function scoreLoop(text) {
    const words = wordCount(text);
    if (words > 40) return 0;
    if (words >= 15) return 50;
    if (words >= 8) return 80;
    return 100;
  }

  function scoreDrift(recentUserCount) {
    if (recentUserCount > 5) return 100;
    if (recentUserCount >= 4) return 70;
    if (recentUserCount >= 2) return 40;
    return 0;
  }

  function scorePassiveAcceptance(userText, priorAi) {
    if (!priorAi) return 0;
    const aiWords = wordCount(priorAi);
    const userWords = wordCount(userText);
    const hasQuestion = userText.includes("?");
    const quoted = containsQuoteFromAi(userText, priorAi);
    if (aiWords > 300 && userWords < 8 && !hasQuestion && !quoted) return 100;
    if (aiWords > 200 && userWords < 15 && !hasQuestion) return 60;
    if (aiWords > 150 && userWords < 12) return 40;
    return 0;
  }

  function scoreTaskFraming(text) {
    if (DELEGATION.some((p) => p.test(text))) return 90;
    if (EDITING.some((p) => p.test(text))) return 50;
    if (QUESTION.some((p) => p.test(text))) return 10;
    return 30;
  }

  function detectTaskType(text) {
    const t = text.toLowerCase();
    if (/write|draft|essay|email|letter|copy/.test(t)) return "writing";
    if (/code|debug|function|script|api|bug/.test(t)) return "coding";
    if (/research|summarize|explain|learn|study/.test(t)) return "research";
    if (/list|schedule|plan|organize|todo/.test(t)) return "admin";
    return "general";
  }

  function isDepthWorthy(text) {
    if (DEPTH_EXEMPT.some((p) => p.test(text))) return false;
    return DEPTH_TRIGGERS.some((p) => p.test(text));
  }

  function applyCredits(signals, ctx) {
    let composite =
      signals.loop * WEIGHTS.loop +
      signals.drift * WEIGHTS.drift +
      signals.passiveAcceptance * WEIGHTS.passiveAcceptance +
      signals.taskFraming * WEIGHTS.taskFraming;

    if (ctx.reflectionWords > 40) composite -= 25;
    else if (ctx.reflectionWords > 20) composite -= 15;
    if (ctx.hasQuestion) composite -= 8;
    if (ctx.quotesAi) composite -= 10;
    if (ctx.exempt) composite = Math.min(composite, 20);

    return Math.max(0, Math.min(100, Math.round(composite)));
  }

  function pickStripType(composite, signals, ctx) {
    if (ctx.mismatch) return "mismatch";
    if (ctx.depth) return "depth";
    if (composite >= 60 && signals.drift >= 60) return "drift";
    return "loop";
  }

  /**
   * Priority: exempt → Overwhelmed → Stuck → Intentional → Unaware
   */
  function detectHumanState(ctx) {
    if (ctx.exempt) return null;

    const { composite, signals, sessionMeta, taskType, history } = ctx;

    if (
      (signals.drift >= 70 && sessionMeta.sessionsToday >= 3) ||
      sessionMeta.durationMinutes > 45
    ) {
      return "overwhelmed";
    }

    if (
      signals.taskFraming >= 80 &&
      !history.taskTypeEngaged[taskType] &&
      !history.taskTypeFlagged[taskType]
    ) {
      return "stuck";
    }

    if (history.intentionalCandidates[taskType] >= 3) {
      return "intentional";
    }

    if (composite >= 60 && !sessionMeta.priorFlagsThisSession) {
      return "unaware";
    }

    return composite >= 60 ? "unaware" : null;
  }

  function evaluateMessage(text, ctx) {
    const signals = {
      loop: scoreLoop(text),
      drift: scoreDrift(ctx.recentUserCount || 0),
      passiveAcceptance: scorePassiveAcceptance(text, ctx.priorAiText),
      taskFraming: scoreTaskFraming(text),
    };

    const taskType = detectTaskType(text);
    const exempt = (ctx.exemptions || []).includes(taskType);
    const depth = isDepthWorthy(text);
    const mismatch = ctx.mismatchGoal != null;

    const composite = applyCredits(signals, {
      reflectionWords: ctx.reflectionWords || 0,
      hasQuestion: text.includes("?"),
      quotesAi: containsQuoteFromAi(text, ctx.priorAiText || ""),
      exempt,
    });

    const stripType = pickStripType(composite, signals, { mismatch, depth });
    const humanState = detectHumanState({
      composite,
      signals,
      sessionMeta: ctx.sessionMeta || {},
      taskType,
      history: ctx.history || { taskTypeEngaged: {}, taskTypeFlagged: {}, intentionalCandidates: {} },
      exempt,
    });

    return {
      signals,
      composite,
      stripType,
      humanState,
      taskType,
      depth,
      mismatch: mismatch ? ctx.mismatchGoal : null,
      showCard:
        humanState === "overwhelmed" ||
        humanState === "stuck" ||
        humanState === "unaware" ||
        (mismatch && ctx.mismatchGoal) ||
        depth,
    };
  }

  return {
    evaluateMessage,
    detectTaskType,
    isDepthWorthy,
    wordCount,
  };
})();

globalThis.LumenEngine = LumenEngine;
