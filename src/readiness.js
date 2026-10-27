'use strict';
// Experimental visual heuristics only. No text, names or messages are read.
// A user-controlled reveal remains available if WhatsApp changes these selectors.
function detectReadiness(doc) {
  const visible = selector => Array.from(doc.querySelectorAll(selector)).some(el => {
    const box = el.getBoundingClientRect();
    const style = doc.defaultView.getComputedStyle(el);
    return box.width > 0 && box.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
  });
  if (visible('#pane-side') && visible('#side')) return 'chats';
  if (visible('[data-ref] canvas') || visible('canvas[aria-label*="QR"]')) return 'login';
  return null;
}
module.exports = { detectReadiness };
