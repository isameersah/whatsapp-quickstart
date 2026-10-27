'use strict';
const started = performance.now();
setInterval(() => { document.querySelector('#elapsed').textContent = `${((performance.now() - started) / 1000).toFixed(1)}s`; }, 100);
for (const action of ['retry', 'reveal', 'browser', 'settings']) document.getElementById(action).addEventListener('click', () => window.quickstart.action(action));
window.quickstart.onStatus(state => {
  document.querySelector('#status').textContent = state.status;
  if (state.detail) document.querySelector('#detail').textContent = state.detail;
});
