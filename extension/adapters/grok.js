window.LumenAdapters = window.LumenAdapters || {};
window.LumenAdapters["x.com"] = {
  hostname: "x.com",
  platform: "grok",
  getUserMessages() {
    try {
      return document.querySelectorAll('[data-testid="tweetText"], .message-user, [class*="UserMessage"]');
    } catch (_) {
      return [];
    }
  },
  getAssistantMessages() {
    try {
      return document.querySelectorAll('.message-assistant, [class*="GrokMessage"], [data-testid="GrokMessage"]');
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
    return window.location.hostname.includes("x.com") && window.location.pathname.includes("/i/grok");
  },
  getInputElement() {
    try {
      return document.querySelector('[contenteditable="true"], textarea');
    } catch (_) {
      return null;
    }
  },
};
