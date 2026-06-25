const SESSION_PREFIX = "lumen_session_";
const EXEMPTIONS_KEY = "lumenExemptions";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getSessionData(cb) {
  const key = SESSION_PREFIX + todayKey();
  if (chrome?.storage?.session?.get) {
    chrome.storage.session.get(key, (r) => {
      if (!chrome.runtime?.lastError && r?.[key]) {
        cb(r[key]);
        return;
      }
      cb(null);
    });
    return;
  }
  cb(null);
}

function renderSparkline(scores) {
  const el = document.getElementById("sparkline");
  el.innerHTML = "";
  const last10 = (scores || []).slice(-10);
  if (!last10.length) {
    el.innerHTML = '<span class="empty" style="font-size:12px;color:#9ca3af">No messages yet</span>';
    return;
  }
  const max = Math.max(...last10, 1);
  last10.forEach((score) => {
    const bar = document.createElement("div");
    bar.className = "sparkline-bar";
    bar.style.height = `${Math.max(4, (score / max) * 48)}px`;
    if (score >= 60) bar.style.background = "#ffc107";
    if (score >= 75) bar.style.background = "#ef4444";
    el.appendChild(bar);
  });
}

function renderExemptions(exemptions) {
  const list = document.getElementById("exemptions-list");
  list.innerHTML = "";
  if (!exemptions?.length) {
    list.innerHTML = '<li class="empty">No active exemptions</li>';
    return;
  }
  exemptions.forEach((task) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${task}</span>`;
    const btn = document.createElement("button");
    btn.textContent = "Remove";
    btn.addEventListener("click", () => {
      const next = exemptions.filter((t) => t !== task);
      chrome.storage.sync.set({ [EXEMPTIONS_KEY]: next }, () => {
        renderExemptions(next);
      });
    });
    li.appendChild(btn);
    list.appendChild(li);
  });
}

function init() {
  getSessionData((session) => {
    const scores = session?.scores || [];
    renderSparkline(scores);

    const shape = globalThis.LumenNudges?.sessionShape?.(scores) ||
      (scores.length
        ? scores.reduce((a, b) => a + b, 0) / scores.length < 50
          ? "Engaged"
          : "Mixed"
        : "—");
    document.getElementById("session-shape").textContent = shape;

    const mins = session
      ? Math.round((Date.now() - session.startedAt) / 60000)
      : 0;
    document.getElementById("session-duration").textContent = `${mins} min`;
  });

  chrome.storage.sync.get(EXEMPTIONS_KEY, (r) => {
    renderExemptions(r?.[EXEMPTIONS_KEY] || []);
  });
}

document.addEventListener("DOMContentLoaded", init);
