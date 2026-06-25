window.LumenAdapters = window.LumenAdapters || {};
window.LumenAdapters["claude.ai"] = {
  hostname: "claude.ai",
  platform: "claude",
  getUserMessages() {
    try {
      return document.querySelectorAll('[data-is-author="true"], .font-user-message, [class*="UserMessage"]');
    } catch (_) {
      return [];
    }
  },
  getAssistantMessages() {
    try {
      return document.querySelectorAll('[data-is-author="false"], .font-claude-message, [class*="AssistantMessage"]');
    } catch (_) {
      return [];
    }
  },
  getMessageText(el) {
    try {
      return el?.innerText || "";
    } catch (_) {
      return "";
    }
  },
  getMessageContainer() {
    try {
      return document.querySelector("main") || document.body;
    } catch (_) {
      return document.body;
    }
  },
  isActive() {
    return window.location.hostname.includes("claude.ai");
  },
  getInputElement() {
    try {
      return document.querySelector('[contenteditable="true"], textarea');
    } catch (_) {
      return null;
    }
  },
};
