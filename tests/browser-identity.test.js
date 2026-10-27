const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromiumUserAgent } = require('../src/browser-identity');
test('preserves actual Chromium and OS while removing wrapper tokens', () => {
  const clean = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.8123.1 Safari/537.36';
  const input = clean.replace(' Chrome/', ' whatsapp-quickstart/0.1.1 Chrome/').replace(' Safari/', ' Electron/45.0.0 Safari/');
  assert.equal(chromiumUserAgent(input), clean);
  assert.equal(chromiumUserAgent(clean), clean);
});
test('never fabricates browser versions or changes unrelated tokens', () => {
  assert.equal(chromiumUserAgent('Mozilla/5.0 Chrome/99.0.1.2 Electron/18.0.0 Safari/537.36'), 'Mozilla/5.0 Chrome/99.0.1.2 Safari/537.36');
  assert.equal(chromiumUserAgent('Mozilla/5.0 Other/1.0'), 'Mozilla/5.0 Other/1.0');
});
