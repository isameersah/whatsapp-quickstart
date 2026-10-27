const { test } = require('node:test');
const assert = require('node:assert/strict');
const { allowedPage, externalURL, allowedPermission } = require('../src/policy');
const { detectReadiness } = require('../src/readiness');
test('navigation permits only exact HTTPS WhatsApp origin', () => {
  assert.equal(allowedPage('https://web.whatsapp.com/'), true);
  for (const url of ['https://web.whatsapp.com.evil.test','http://web.whatsapp.com','https://evil.test/?web.whatsapp.com','javascript:alert(1)','file:///etc/passwd','https://user@web.whatsapp.com','https://web.whatsapp.com:444']) assert.equal(allowedPage(url), false, url);
});
test('external protocols cannot launch arbitrary OS applications', () => {
  for (const url of ['file:///tmp/x','javascript:alert(1)','data:text/html,x','tel:123','https://user:pass@example.com']) assert.equal(externalURL(url), false);
  assert.equal(externalURL('https://example.com/path'), true);
});
test('sensitive permissions default to denied', () => {
  for (const p of ['geolocation','display-capture','clipboard-read','serial','usb','midi','unknown']) assert.equal(allowedPermission(p), false);
  assert.equal(allowedPermission('notifications'), true);
});
function doc(selectors, hidden = false) {
  return { querySelectorAll: selector => selectors.includes(selector) ? [{ getBoundingClientRect: () => ({ width: hidden ? 0 : 100, height: 50 }) }] : [], defaultView: { getComputedStyle: () => ({ visibility: 'visible', display: 'block' }) } };
}
test('loading and partial layouts never count as ready', () => {
  assert.equal(detectReadiness(doc([])), null);
  assert.equal(detectReadiness(doc(['#pane-side'])), null);
  assert.equal(detectReadiness(doc(['#pane-side','#side'], true)), null);
});
test('visible login is distinguished from chat UI', () => {
  assert.equal(detectReadiness(doc(['[data-ref] canvas'])), 'login');
  assert.equal(detectReadiness(doc(['#pane-side','#side'])), 'chats');
});
