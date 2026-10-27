'use strict';
// Preserve the actual Chromium version and OS; remove wrapper product tokens.
function chromiumUserAgent(userAgent) {
  return userAgent.replace(/\s(?:Electron|whatsapp-quickstart|WhatsAppQuickStart)\/[^\s]+/gi, '').trim();
}
module.exports = { chromiumUserAgent };
