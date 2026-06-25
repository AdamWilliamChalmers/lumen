/* global globalThis */
const LumenGoals = (() => {
  const GOALS_KEY = "lumenUserGoals";
  const EXEMPTIONS_KEY = "lumenExemptions";

  const DEFAULTS = {
    protectedGoals: [],
    onboardingGoals: [],
  };

  let cache = { ...DEFAULTS };
  let exemptions = [];

  function load() {
    return new Promise((resolve) => {
      const keys = [GOALS_KEY, EXEMPTIONS_KEY];
      const finish = (data) => {
        cache = { ...DEFAULTS, ...(data?.[GOALS_KEY] || {}) };
        exemptions = data?.[EXEMPTIONS_KEY] || [];
        resolve({ goals: cache, exemptions });
      };

      if (!chrome?.storage?.sync?.get) {
        try {
          finish({
            [GOALS_KEY]: JSON.parse(localStorage.getItem(GOALS_KEY) || "null"),
            [EXEMPTIONS_KEY]: JSON.parse(localStorage.getItem(EXEMPTIONS_KEY) || "[]"),
          });
        } catch (_) {
          finish({});
        }
        return;
      }

      chrome.storage.sync.get(keys, (result) => {
        if (chrome.runtime?.lastError) {
          finish({});
          return;
        }
        finish(result);
      });
    });
  }

  function persistGoals() {
    const payload = { [GOALS_KEY]: cache };
    try {
      localStorage.setItem(GOALS_KEY, JSON.stringify(cache));
    } catch (_) {
      // ignore
    }
    if (chrome?.storage?.sync?.set) {
      chrome.storage.sync.set(payload, () => void chrome.runtime?.lastError);
    }
  }

  function persistExemptions() {
    const payload = { [EXEMPTIONS_KEY]: exemptions };
    try {
      localStorage.setItem(EXEMPTIONS_KEY, JSON.stringify(exemptions));
    } catch (_) {
      // ignore
    }
    if (chrome?.storage?.sync?.set) {
      chrome.storage.sync.set(payload, () => void chrome.runtime?.lastError);
    }
  }

  function getProtectedGoals() {
    return [...(cache.protectedGoals || []), ...(cache.onboardingGoals || [])];
  }

  function getExemptions() {
    return [...exemptions];
  }

  function addExemption(taskType) {
    if (!exemptions.includes(taskType)) {
      exemptions.push(taskType);
      persistExemptions();
    }
  }

  function removeExemption(taskType) {
    exemptions = exemptions.filter((t) => t !== taskType);
    persistExemptions();
  }

  function removeProtectedGoal(goal) {
    cache.protectedGoals = (cache.protectedGoals || []).filter((g) => g !== goal);
    cache.onboardingGoals = (cache.onboardingGoals || []).filter((g) => g !== goal);
    persistGoals();
  }

  function detectMismatch(text, goals) {
    const lower = text.toLowerCase();
    for (const goal of goals) {
      const g = goal.toLowerCase();
      if (g.includes("write myself") || g.includes("draft myself") || g.includes("my own")) {
        if (/write me|draft|create a|generate a|make me/.test(lower)) return goal;
      }
      if (g.includes("think first") || g.includes("understand")) {
        if (/write me|just do|do this for/.test(lower) && !/\?/.test(lower)) return goal;
      }
    }
    return null;
  }

  return {
    load,
    getProtectedGoals,
    getExemptions,
    addExemption,
    removeExemption,
    removeProtectedGoal,
    detectMismatch,
  };
})();

globalThis.LumenGoals = LumenGoals;
