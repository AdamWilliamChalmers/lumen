(() => {
  "use strict";

  const g = globalThis;

  function deps() {
    return {
      adapter: g.LumenAdapterChatGPT,
      session: g.LumenSession,
      goals: g.LumenGoals,
      engine: g.LumenEngine,
      widget: g.LumenWidget,
    };
  }

  function getAdapter() {
    const { adapter } = deps();
    if (adapter?.matches?.()) return adapter;
    return null;
  }

  function logMissingModules() {
    const d = deps();
    const missing = Object.entries(d)
      .filter(([, mod]) => !mod)
      .map(([name]) => name);
    if (missing.length) {
      console.warn(
        "[Lumen] Scripts failed to load:",
        missing.join(", "),
        "— remove and re-load unpacked extension from ~/Desktop/Lumen, then hard-refresh."
      );
    }
  }

  let adapter = null;
  let messages = [];
  let history = [];
  let debounceTimer = null;

  function syncMessagesFromDom() {
    const domMessages = adapter.buildMessageList();
    const existingById = new Map(messages.map((m) => [m.id, m]));
    const now = Date.now();
    const baseTime = now - domMessages.length * 1000;
    const isInitialBulk = domMessages.length > 1 && existingById.size === 0;

    messages = domMessages.map((msg, index) => {
      const prevByIndex = messages[index];
      const existing =
        existingById.get(msg.id) ||
        (prevByIndex?.role === msg.role && prevByIndex?.text === msg.text ? prevByIndex : null);
      if (existing) return { ...msg, id: existing.id, timestamp: existing.timestamp };
      return { ...msg, timestamp: isInitialBulk ? baseTime + msg.order * 1000 : now };
    });

    return messages;
  }

  function processMessages() {
    const { session: LumenSession, goals: LumenGoals, engine: LumenEngine, widget: LumenWidget } =
      deps();
    if (!LumenSession || !LumenGoals || !LumenEngine || !LumenWidget || !adapter) return;

    syncMessagesFromDom();
    const session = LumenSession.get();
    const currentMetrics = LumenSession.computeSessionMetrics(messages);

    if (LumenGoals.isGhost()) {
      LumenWidget.updateBadge();
      return;
    }

    messages.forEach((msg, index) => {
      if (msg.role !== "user") return;

      const evaluation = LumenEngine.evaluateMessage(msg, messages, index, {
        history,
        currentMetrics,
        scoredIds: session.scoredMessageIds,
        sessionMismatchCount: session.mismatchCount,
        priorLoopScores: session.loopScores,
        sessionSensitivity: LumenSession.getSessionSensitivity(),
        taskTypeExempt: LumenGoals.getTaskTypeExemptions(),
      });

      const alreadyScored = session.scoredMessageIds.includes(msg.id);
      if (!alreadyScored) {
        msg.timestamp = msg.timestamp || Date.now();
        LumenSession.recordMessage(msg.id, evaluation.loopScore, evaluation.primary);
      }

      LumenWidget.injectMessageUI(msg, evaluation, adapter, { isNewMessage: !alreadyScored });

      if (
        evaluation.confidence === "gray" &&
        LumenGoals.get().llmJudgeEnabled &&
        !alreadyScored
      ) {
        g.LumenJudge?.classify(msg.text, evaluation).then((verdict) => {
          if (!verdict) return;
          const merged = g.LumenJudge.mergeVerdict(evaluation, verdict);
          LumenSession.reviseMessageSignal(msg.id, evaluation.primary, merged.primary);
          LumenWidget.injectMessageUI(msg, merged, adapter, {
            isNewMessage: false,
            fromJudge: true,
          });
          LumenWidget.updateBadge();
        });
      }
    });

    LumenSession.saveSessionSnapshot(messages).then((updated) => {
      history = updated;
    });
    LumenWidget.updateBadge();
  }

  function debouncedProcess() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(processMessages, 150);
  }

  async function init() {
    if (window.__lumenInitialized) return;

    const { session: LumenSession, goals: LumenGoals, engine: LumenEngine, widget: LumenWidget } =
      deps();
    adapter = getAdapter();

    if (!adapter || !LumenSession || !LumenGoals || !LumenEngine || !LumenWidget) {
      logMissingModules();
      return;
    }

    window.__lumenInitialized = true;

    // Show badge + onboarding immediately — don't wait on storage
    LumenWidget.init();

    await LumenGoals.load();
    await LumenSession.load();
    history = await LumenSession.loadHistory();

    LumenWidget.updateBadge();
    adapter.onNewMessage(debouncedProcess);
    debouncedProcess();

    window.addEventListener("beforeunload", () => {
      LumenSession.saveSessionSnapshot(messages);
      LumenSession.postSessionSummary();
      LumenSession.triggerPostSessionSurvey();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
