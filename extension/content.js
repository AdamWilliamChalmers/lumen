(() => {
  const ROOT_ID = "lumen-root";
  const PROCESSED = "data-lumen-processed";

  let adapter = null;
  let userTimestamps = [];
  let seedForNextPrompt = null;
  let goals = [];
  let exemptions = [];

  function pickAdapter() {
    const host = window.location.hostname;
    const adapters = window.LumenAdapters || {};
    if (adapters[host]?.isActive?.()) return adapters[host];
    for (const key of Object.keys(adapters)) {
      if (adapters[key].isActive?.()) return adapters[key];
    }
    return null;
  }

  function ensureRoot() {
    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement("div");
      root.id = ROOT_ID;
      document.body.appendChild(root);
    }
    return root;
  }

  function stripColor(type) {
    return type || "loop";
  }

  function createStrip(type, label) {
    const strip = document.createElement("div");
    strip.className = "lumen-strip";
    strip.innerHTML = `
      <span class="lumen-strip-wordmark">Lumen</span>
      <span class="lumen-dot lumen-dot--${stripColor(type)}"></span>
      <span class="lumen-strip-label">${label}</span>
    `;
    return strip;
  }

  function createCard(kind, ctx, onAction) {
    const copy = LumenNudges.cardCopy(kind, ctx);
    if (!copy) return null;

    const card = document.createElement("div");
    card.className = "lumen-card";

    const body = document.createElement("div");
    body.className = "lumen-card-body";
    body.textContent = copy.body;
    card.appendChild(body);

    if (kind === "stuck") {
      const textarea = document.createElement("textarea");
      textarea.className = "lumen-reflection";
      textarea.placeholder = "One thing you already know…";
      card.appendChild(textarea);
    }

    const actions = document.createElement("div");
    actions.className = "lumen-card-actions";

    const primary = document.createElement("button");
    primary.className = "lumen-btn lumen-btn--primary";
    primary.textContent = copy.primary;
    primary.addEventListener("click", () => onAction("primary", card));

    const secondary = document.createElement("button");
    secondary.className = "lumen-btn";
    secondary.textContent = copy.secondary;
    secondary.addEventListener("click", () => onAction("secondary", card));

    actions.append(primary, secondary);
    card.appendChild(actions);
    return card;
  }

  function hideAssistantAfter(el) {
    if (!adapter) return;
    const assistants = adapter.getAssistantMessages();
    const users = adapter.getUserMessages();
    let idx = -1;
    users.forEach((u, i) => {
      if (u === el) idx = i;
    });
    if (idx >= 0 && assistants[idx]) {
      assistants[idx].classList.add("lumen-ai-hidden");
    }
  }

  function prependSeedToInput(seed) {
    const input = adapter?.getInputElement?.();
    if (!input || !seed) return;
    if (input.tagName === "TEXTAREA" || input.tagName === "INPUT") {
      input.value = `${seed}\n\n${input.value}`.trim();
      input.dispatchEvent(new Event("input", { bubbles: true }));
    } else if (input.isContentEditable) {
      input.textContent = `${seed}\n\n${input.textContent}`.trim();
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    seedForNextPrompt = null;
  }

  function handleCardAction(kind, action, card, ctx) {
    if (action === "secondary") {
      LumenSession.recordIntervention(true, true);
      card.remove();
      return;
    }

    LumenSession.recordIntervention(true, false);

    if (kind === "overwhelmed") {
      card.remove();
      return;
    }

    if (kind === "stuck") {
      const ta = card.querySelector(".lumen-reflection");
      const text = ta?.value?.trim();
      if (text) {
        seedForNextPrompt = text;
        LumenSession.recordReflection();
        prependSeedToInput(text);
      }
      card.remove();
      return;
    }

    if (kind === "unaware") {
      card.remove();
      return;
    }

    if (kind === "intentional") {
      LumenGoals.addExemption(ctx.taskType);
      exemptions.push(ctx.taskType);
      LumenSession.recordConsciousDelegate();
      card.remove();
      return;
    }

    if (kind === "mismatch") {
      LumenSession.recordReflection();
      card.remove();
      return;
    }

    if (kind === "depth") {
      hideAssistantAfter(ctx.messageEl);
      LumenSession.recordReflection();
      card.remove();
      return;
    }

    card.remove();
  }

  function getPriorAiText(userEl) {
    if (!adapter) return "";
    const users = [...adapter.getUserMessages()];
    const assistants = [...adapter.getAssistantMessages()];
    const idx = users.indexOf(userEl);
    if (idx <= 0) return "";
    const ai = assistants[idx - 1];
    return ai ? adapter.getMessageText(ai) : "";
  }

  function processMessage(userEl) {
    if (userEl.getAttribute(PROCESSED)) return;
    userEl.setAttribute(PROCESSED, "1");

    const text = adapter.getMessageText(userEl);
    if (!text.trim()) return;

    userTimestamps.push(Date.now());
    const recent = LumenSession.recentUserCount(userTimestamps);
    const session = LumenSession.getSession();
    const mismatchGoal = LumenGoals.detectMismatch(text, goals);
    const taskType = LumenEngine.detectTaskType(text);

    const result = LumenEngine.evaluateMessage(text, {
      recentUserCount: recent,
      priorAiText: getPriorAiText(userEl),
      exemptions,
      mismatchGoal,
      reflectionWords: 0,
      sessionMeta: {
        durationMinutes: session ? Math.round((Date.now() - session.startedAt) / 60000) : 0,
        sessionsToday: session?.sessionsToday || 1,
        priorFlagsThisSession: session?.priorFlagsThisSession || false,
      },
      history: session || {},
    });

    LumenSession.recordMessage(result, text, { engaged: text.length > 80 });

    const label = LumenNudges.stripLabel(
      result.stripType,
      result.mismatch || mismatchGoal
    );
    const strip = createStrip(result.stripType, label);

    const parent = userEl.parentElement || userEl;
    if (userEl.nextSibling) {
      parent.insertBefore(strip, userEl.nextSibling);
    } else {
      parent.appendChild(strip);
    }

    updateBadge(result.composite, result.stripType);

    if (result.humanState === "intentional") {
      const intCard = createCard("intentional", { taskType }, (action, c) =>
        handleCardAction("intentional", action, c, { taskType })
      );
      if (intCard) strip.insertAdjacentElement("afterend", intCard);
      return;
    }

    if (result.composite < 60 && !mismatchGoal && !result.depth) return;

    let cardKind = null;
    let cardCtx = {};

    if (result.humanState === "overwhelmed") {
      cardKind = "overwhelmed";
    } else if (result.humanState === "stuck") {
      cardKind = "stuck";
      cardCtx = { taskType };
    } else if (result.humanState === "unaware") {
      cardKind = "unaware";
      cardCtx = { passiveCount: Math.min(recent, 5) };
    } else if (mismatchGoal) {
      cardKind = "mismatch";
      cardCtx = { goal: mismatchGoal };
    } else if (result.depth) {
      cardKind = "depth";
      cardCtx = { messageEl: userEl };
    }

    if (!cardKind) return;

    const card = createCard(cardKind, cardCtx, (action, c) => {
      if (cardKind === "mismatch" && action === "secondary") {
        LumenGoals.removeProtectedGoal(mismatchGoal);
        goals = LumenGoals.getProtectedGoals();
      }
      handleCardAction(cardKind, action, c, { ...cardCtx, taskType });
    });
    if (card) strip.insertAdjacentElement("afterend", card);

    if (seedForNextPrompt) {
      setTimeout(() => prependSeedToInput(seedForNextPrompt), 100);
    }
  }

  function updateBadge(composite, stripType) {
    const badge = document.querySelector("#lumen-root .lumen-badge");
    if (!badge) return;
    const dot = badge.querySelector(".lumen-dot");
    if (dot) {
      dot.className = `lumen-dot lumen-dot--${stripColor(stripType)}`;
    }
    const label = badge.querySelector(".lumen-session-label");
    if (label) {
      label.textContent = composite != null ? `${composite}` : "session";
    }
  }

  function createBadge() {
    ensureRoot();
    if (document.querySelector("#lumen-root .lumen-badge")) return;

    const badge = document.createElement("div");
    badge.className = "lumen-badge";
    badge.title = "Open Lumen popup";
    badge.innerHTML = `
      <span>Lumen</span>
      <span class="lumen-dot lumen-dot--idle"></span>
      <span class="lumen-session-label">session</span>
    `;
    badge.addEventListener("click", () => {
      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ type: "openPopup" });
      }
    });
    document.getElementById(ROOT_ID).appendChild(badge);
  }

  function scanMessages() {
    if (!adapter) return;
    const users = adapter.getUserMessages();
    users.forEach((el) => processMessage(el));
  }

  function observe() {
    const container = adapter?.getMessageContainer?.() || document.body;
    const observer = new MutationObserver(() => {
      scanMessages();
    });
    observer.observe(container, { childList: true, subtree: true });
    scanMessages();
  }

  async function init() {
    adapter = pickAdapter();
    if (!adapter) return;

    ensureRoot();
    createBadge();

    const loaded = await LumenGoals.load();
    goals = LumenGoals.getProtectedGoals();
    exemptions = loaded.exemptions || [];

    await LumenSession.init(adapter.platform || "unknown");
    LumenSession.bindUnload();
    observe();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
