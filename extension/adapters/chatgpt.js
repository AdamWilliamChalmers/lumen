window.LumenAdapters = window.LumenAdapters || {};
window.LumenAdapters["chatgpt.com"] = {
  hostname: "chatgpt.com",
  platform: "chatgpt",
  getUserMessages() {
    try {
      return document.querySelectorAll('[data-message-author-role="user"]');
    } catch (_) {
      return [];
    }
  },
  getAssistantMessages() {
    try {
      return document.querySelectorAll('[data-message-author-role="assistant"]');
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
    const h = window.location.hostname;
    return h.includes("openai.com") || h.includes("chatgpt.com");
  },
  getInputElement() {
    try {
      return document.querySelector("#prompt-textarea, textarea[data-id='root'], div[contenteditable='true']");
    } catch (_) {
      return null;
    }
  },
};
window.LumenAdapters["chat.openai.com"] = window.LumenAdapters["chatgpt.com"];
