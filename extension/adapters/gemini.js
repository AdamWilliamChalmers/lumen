window.LumenAdapters = window.LumenAdapters || {};
window.LumenAdapters["gemini.google.com"] = {
  hostname: "gemini.google.com",
  platform: "gemini",
  getUserMessages() {
    try {
      return document.querySelectorAll('.query-content, [data-message-author="user"], user-query');
    } catch (_) {
      return [];
    }
  },
  getAssistantMessages() {
    try {
      return document.querySelectorAll('.model-response-text, [data-message-author="model"], model-response');
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
    return window.location.hostname.includes("gemini.google.com");
  },
  getInputElement() {
    try {
      return document.querySelector('[contenteditable="true"], textarea, .ql-editor');
    } catch (_) {
      return null;
    }
  },
};
