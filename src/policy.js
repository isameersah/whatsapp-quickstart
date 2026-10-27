'use strict';
const ORIGIN = 'https://web.whatsapp.com';
function allowedPage(value) {
  try { const u = new URL(value); return u.origin === ORIGIN && !u.username && !u.password; }
  catch { return false; }
}
function externalURL(value) {
  try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password; }
  catch { return false; }
}
function allowedPermission(permission) { return ['notifications', 'media', 'fullscreen', 'clipboard-sanitized-write'].includes(permission); }
module.exports = { ORIGIN, allowedPage, externalURL, allowedPermission };
