/* global globalThis */
const LumenSession = (() => {
  const USER_ID_KEY = "lumenUserId";
  const QUEUE_KEY = "lumenSessionQueue";
  const SESSION_PREFIX = "lumen_session_";
  const API_URL = "http://localhost:3000/api/session";
  const INACTIVITY_MS = 30 * 60 * 1000;

  let sessionData = null;
  let lastActivity = Date.now();
  let inactivityTimer = null;

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function storageGet(key) {
    return new Promise((resolve) => {
      const trySession = () => {
        if (chrome?.storage?.session?.get) {
          chrome.storage.session.get(key, (r) => {
            if (!chrome.runtime?.lastError && r?.[key] != null) {
              resolve(r[key]);
              return;
            }
            try {
              resolve(JSON.parse(sessionStorage.getItem(key) || "null"));
            } catch (_) {
              resolve(null);
            }
          });
          return;
        }
        try {
          resolve(JSON.parse(sessionStorage.getItem(key) || "null"));
        } catch (_) {
          resolve(null);
        }
      };
      trySession();
    });
  }

  function storageSet(key, value) {
    return new Promise((resolve) => {
      if (chrome?.storage?.session?.set) {
        chrome.storage.session.set({ [key]: value }, () => {
          if (!chrome.runtime?.lastError) {
            resolve();
            return;
          }
          try {
            sessionStorage.setItem(key, JSON.stringify(value));
          } catch (_) {
            // ignore
          }
          resolve();
        });
        return;
      }
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
      } catch (_) {
        // ignore
      }
      resolve();
    });
  }

  function getUserId() {
    return new Promise((resolve) => {
      if (chrome?.storage?.sync?.get) {
        chrome.storage.sync.get(USER_ID_KEY, (r) => {
          if (r?.[USER_ID_KEY]) {
            resolve(r[USER_ID_KEY]);
            return;
          }
          const id = crypto.randomUUID();
          chrome.storage.sync.set({ [USER_ID_KEY]: id }, () => resolve(id));
        });
        return;
      }
      let id = localStorage.getItem(USER_ID_KEY);
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(USER_ID_KEY, id);
      }
      resolve(id);
    });
  }

  function defaultSession() {
    return {
      startedAt: Date.now(),
      messageCount: 0,
      scores: [],
      signalTotals: { loop: 0, drift: 0, passiveAcceptance: 0, taskFraming: 0 },
      compositeTotal: 0,
      humanState: null,
      depthMoments: 0,
      questionsAsked: 0,
      consciousDelegates: 0,
      loopBreaksTaken: 0,
      interventionsFired: 0,
      interventionsBypassed: 0,
      reflectionsSubmitted: 0,
      priorFlagsThisSession: false,
      taskTypeEngaged: {},
      taskTypeFlagged: {},
      intentionalCandidates: {},
      sessionsToday: 1,
      lastHumanState: null,
    };
  }

  async function init(platform) {
    const key = SESSION_PREFIX + todayKey();
    const existing = await storageGet(key);
    sessionData = existing || defaultSession();
    sessionData.platform = platform;
    await storageSet(key, sessionData);
    await flushQueue();
    resetInactivityTimer();
    return sessionData;
  }

  function getSession() {
    return sessionData;
  }

  function touchActivity() {
    lastActivity = Date.now();
    resetInactivityTimer();
  }

  function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      postSessionSummary();
    }, INACTIVITY_MS);
  }

  function recentUserCount(timestamps, windowMs = 3 * 60 * 1000) {
    const cutoff = Date.now() - windowMs;
    return timestamps.filter((t) => t >= cutoff).length;
  }

  async function recordMessage(result, text, meta) {
    if (!sessionData) return;
    touchActivity();

    sessionData.messageCount += 1;
    sessionData.scores.push(result.composite);
    if (sessionData.scores.length > 50) sessionData.scores.shift();

    for (const k of Object.keys(result.signals)) {
      sessionData.signalTotals[k] =
        (sessionData.signalTotals[k] || 0) + result.signals[k];
    }
    sessionData.compositeTotal += result.composite;

    if (text.includes("?")) sessionData.questionsAsked += 1;
    if (result.depth) sessionData.depthMoments += 1;
    if (result.humanState) {
      sessionData.priorFlagsThisSession = true;
      sessionData.lastHumanState = result.humanState;
    }

    const tt = result.taskType;
    if (meta.engaged) sessionData.taskTypeEngaged[tt] = true;
    if (result.composite >= 60) {
      sessionData.taskTypeFlagged[tt] = (sessionData.taskTypeFlagged[tt] || 0) + 1;
      if (sessionData.taskTypeFlagged[tt] >= 3) {
        sessionData.intentionalCandidates[tt] =
          (sessionData.intentionalCandidates[tt] || 0) + 1;
      }
    }

    await storageSet(SESSION_PREFIX + todayKey(), sessionData);
    return sessionData;
  }

  function recordIntervention(fired, bypassed) {
    if (!sessionData) return;
    if (fired) sessionData.interventionsFired += 1;
    if (bypassed) sessionData.interventionsBypassed += 1;
    if (bypassed) sessionData.loopBreaksTaken += 1;
    storageSet(SESSION_PREFIX + todayKey(), sessionData);
  }

  function recordReflection() {
    if (!sessionData) return;
    sessionData.reflectionsSubmitted += 1;
    storageSet(SESSION_PREFIX + todayKey(), sessionData);
  }

  function recordConsciousDelegate() {
    if (!sessionData) return;
    sessionData.consciousDelegates += 1;
    storageSet(SESSION_PREFIX + todayKey(), sessionData);
  }

  function avgSignals() {
    const n = Math.max(sessionData?.messageCount || 1, 1);
    const t = sessionData?.signalTotals || {};
    return {
      loop: Math.round((t.loop || 0) / n),
      drift: Math.round((t.drift || 0) / n),
      passiveAcceptance: Math.round((t.passiveAcceptance || 0) / n),
      taskFraming: Math.round((t.taskFraming || 0) / n),
    };
  }

  async function buildPayload() {
    if (!sessionData) return null;
    const userId = await getUserId();
    const durationMinutes = Math.round((Date.now() - sessionData.startedAt) / 60000);
    const n = Math.max(sessionData.messageCount, 1);
    return {
      userId,
      sessionDate: todayKey(),
      platform: sessionData.platform || "unknown",
      durationMinutes,
      messageCount: sessionData.messageCount,
      signals: avgSignals(),
      compositeScore: Math.round(sessionData.compositeTotal / n),
      humanState: sessionData.lastHumanState || "none",
      depthMoments: sessionData.depthMoments,
      questionsAsked: sessionData.questionsAsked,
      consciousDelegates: sessionData.consciousDelegates,
      loopBreaksTaken: sessionData.loopBreaksTaken,
      interventionsFired: sessionData.interventionsFired,
      interventionsBypassed: sessionData.interventionsBypassed,
      reflectionsSubmitted: sessionData.reflectionsSubmitted,
    };
  }

  async function postSessionSummary() {
    const payload = await buildPayload();
    if (!payload || payload.messageCount === 0) return;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });
      if (!res.ok) throw new Error("API error");
    } catch (_) {
      await enqueue(payload);
    }
  }

  function enqueue(payload) {
    return new Promise((resolve) => {
      const store = (queue) => {
        if (chrome?.storage?.local?.set) {
          chrome.storage.local.set({ [QUEUE_KEY]: queue }, () => resolve());
        } else {
          try {
            localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
          } catch (_) {
            // ignore
          }
          resolve();
        }
      };

      if (chrome?.storage?.local?.get) {
        chrome.storage.local.get(QUEUE_KEY, (r) => {
          const queue = r?.[QUEUE_KEY] || [];
          queue.push({ ...payload, queuedAt: Date.now() });
          store(queue);
        });
        return;
      }
      try {
        const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
        queue.push({ ...payload, queuedAt: Date.now() });
        store(queue);
      } catch (_) {
        store([payload]);
      }
    });
  }

  async function flushQueue() {
    return new Promise((resolve) => {
      const process = async (queue) => {
        if (!queue?.length) {
          resolve();
          return;
        }
        const remaining = [];
        for (const item of queue) {
          try {
            const res = await fetch(API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(item),
            });
            if (!res.ok) remaining.push(item);
          } catch (_) {
            remaining.push(item);
          }
        }
        if (chrome?.storage?.local?.set) {
          chrome.storage.local.set({ [QUEUE_KEY]: remaining }, () => resolve());
        } else {
          localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
          resolve();
        }
      };

      if (chrome?.storage?.local?.get) {
        chrome.storage.local.get(QUEUE_KEY, (r) => process(r?.[QUEUE_KEY] || []));
      } else {
        try {
          process(JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"));
        } catch (_) {
          resolve();
        }
      }
    });
  }

  function bindUnload() {
    window.addEventListener("beforeunload", () => {
      postSessionSummary();
    });
  }

  return {
    init,
    getSession,
    recordMessage,
    recordIntervention,
    recordReflection,
    recordConsciousDelegate,
    recentUserCount,
    postSessionSummary,
    bindUnload,
    buildPayload,
  };
})();

globalThis.LumenSession = LumenSession;
