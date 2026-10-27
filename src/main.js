'use strict';
const { app, BrowserWindow, WebContentsView, session, ipcMain, Menu, Tray, dialog, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { ORIGIN, allowedPage, externalURL, allowedPermission } = require('./policy');
const { detectReadiness } = require('./readiness');
const { chromiumUserAgent } = require('./browser-identity');
const started = performance.now();
process.umask(0o077);
app.setName('whatsapp-quickstart');
let win, view, tray, quitting = false, timer, timeout, generation = 0;
let settings = { keepRunning: false, autoReveal: true };
let events = [], currentStatus = { status: 'Opening your workspace' };
const shellURL = pathToFileURL(path.join(__dirname, 'index.html')).href;
const icon = path.join(__dirname, '../assets/icon.png');
const mark = name => { events.push({ event: name, elapsedMs: Math.round(performance.now() - started) }); events = events.slice(-100); };
const prefsPath = () => path.join(app.getPath('userData'), 'settings.json');
function savePrefs() { fs.writeFileSync(prefsPath(), JSON.stringify(settings), { mode: 0o600 }); }
function status(message, detail) {
  currentStatus = { status: message, detail };
  if (win && !win.isDestroyed()) win.webContents.send('status', currentStatus);
}
function stopWatch() { clearInterval(timer); clearTimeout(timeout); }
function reveal(reason) {
  if (!view || view.webContents.isDestroyed()) return;
  view.setVisible(true); view.webContents.focus(); mark(reason);
  if (reason !== 'manual_reveal') stopWatch();
}
function showShell() { if (view) view.setVisible(false); win.webContents.focus(); }
function fit() { if (view && win) { const [width, height] = win.getContentSize(); view.setBounds({ x: 0, y: 0, width, height }); } }
async function external(url) {
  if (!externalURL(url)) return;
  const { response } = await dialog.showMessageBox(win, { type: 'question', title: 'Open external link?', message: 'Open this link in your default browser?', detail: url, buttons: ['Cancel', 'Open browser'], defaultId: 0, cancelId: 0 });
  if (response === 1) await shell.openExternal(url).catch(() => status('Browser could not be opened'));
}
function protect(wc) {
  wc.setWindowOpenHandler(({ url }) => { void external(url); return { action: 'deny' }; });
  const guard = (event, url) => { if (!allowedPage(url)) { event.preventDefault(); void external(url); } };
  wc.on('will-navigate', guard);
  wc.on('will-redirect', (event, url) => { if (!allowedPage(url)) event.preventDefault(); });
  wc.on('will-attach-webview', event => event.preventDefault());
}
function watch(wc, token) {
  let busy = false, last = null, consecutive = 0;
  stopWatch();
  timer = setInterval(async () => {
    if (busy || wc.isDestroyed() || token !== generation || !allowedPage(wc.getURL())) return;
    busy = true;
    try {
      const signal = await wc.executeJavaScript(`(${detectReadiness.toString()})(document)`);
      if (token !== generation) return;
      consecutive = signal && signal === last ? consecutive + 1 : 1; last = signal;
      if (signal && consecutive >= 2) {
        mark(signal === 'chats' ? 'chat_interface_detected' : 'login_interface_detected');
        if (settings.autoReveal) reveal('auto_reveal');
        else stopWatch();
      }
    } catch { /* Navigation may replace the document. Retry next observation. */ }
    finally { busy = false; }
  }, 400);
  timeout = setTimeout(() => {
    stopWatch(); mark('detection_timeout');
    status('Taking longer than expected', 'Choose Show WhatsApp to sign in or inspect loading. If you are offline, reconnect and retry.');
  }, 25000);
}
function loadWhatsApp() {
  generation++; stopWatch();
  if (view) { win.contentView.removeChildView(view); view.webContents.close(); }
  status('Connecting to WhatsApp Web', 'Your login is saved on this device. First time here? Scan the QR code when it appears.');
  const token = generation;
  view = new WebContentsView({ webPreferences: { partition: 'persist:whatsapp', nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true, allowRunningInsecureContent: false } });
  win.contentView.addChildView(view); view.setVisible(false); fit();
  const wc = view.webContents;
  wc.setUserAgent(chromiumUserAgent(wc.session.getUserAgent()));
  protect(wc);
  wc.on('did-start-navigation', (_e, _url, inPlace, main) => {
    if (main && !inPlace && token === generation) { view.setVisible(false); mark('navigation_started'); watch(wc, token); }
  });
  wc.on('dom-ready', () => mark('document_ready'));
  wc.on('did-finish-load', () => mark('page_loaded'));
  wc.on('did-fail-load', (_e, code, _desc, _url, main) => {
    if (main && code !== -3 && token === generation) { stopWatch(); showShell(); mark('navigation_failed'); status('Unable to connect', `Check your internet connection and choose Retry connection. Network error ${code}.`); }
  });
  wc.on('render-process-gone', () => { if (token === generation) { stopWatch(); showShell(); status('WhatsApp stopped responding', 'Choose Retry connection to reopen WhatsApp. Your saved login is retained.'); mark('renderer_failed'); } });
  wc.loadURL(ORIGIN).catch(() => {});
}
async function clearSession() {
  const { response } = await dialog.showMessageBox(win, { type: 'warning', message: 'Clear this app’s WhatsApp login?', detail: 'This removes local browser storage and cache. You will need to link your phone again. Your phone’s chats are not deleted.', buttons: ['Cancel', 'Clear local session'], defaultId: 0, cancelId: 0 });
  if (response !== 1) return;
  generation++; stopWatch();
  if (view) { win.contentView.removeChildView(view); view.webContents.close(); view = null; }
  try { const s = session.fromPartition('persist:whatsapp'); await s.clearStorageData(); await s.clearCache(); loadWhatsApp(); }
  catch { status('Could not clear local storage', 'Quit the app and try again.'); }
}
async function exportMetrics() {
  const { filePath } = await dialog.showSaveDialog(win, { defaultPath: 'quickstart-performance.json', filters: [{ name: 'JSON', extensions: ['json'] }] });
  if (!filePath) return;
  const data = { version: app.getVersion(), electron: process.versions.electron, events, memory: app.getAppMetrics().map(m => ({ type: m.type, memory: m.memory })), note: 'DOM detection is a heuristic, not proof of usability. No message text or contact names collected.' };
  try { fs.writeFileSync(filePath, JSON.stringify(data, null, 2), { mode: 0o600 }); }
  catch { await dialog.showMessageBox(win, { type: 'error', message: 'Could not save the performance report.' }); }
}
function restore() { if (win.isMinimized()) win.restore(); win.show(); win.focus(); mark('window_restored'); }
function configureTray() {
  if (tray) { tray.destroy(); tray = null; }
  if (!settings.keepRunning) return;
  try { tray = new Tray(icon); tray.setToolTip('WhatsApp QuickStart'); tray.setContextMenu(Menu.buildFromTemplate([{ label: 'Open WhatsApp', click: restore }, { label: 'Quit completely', click: () => app.quit() }])); tray.on('click', restore); }
  catch { settings.keepRunning = false; savePrefs(); }
}
function buildMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'QuickStart', submenu: [
      { label: 'Show WhatsApp', accelerator: 'CmdOrCtrl+Shift+W', click: () => reveal('manual_reveal') },
      { label: 'Startup screen', click: showShell },
      { label: 'Reconnect', accelerator: 'CmdOrCtrl+R', click: loadWhatsApp },
      { label: 'Open in browser', click: () => shell.openExternal(ORIGIN).catch(() => {}) },
      { type: 'separator' },
      { label: 'Automatically reveal detected login or chats', type: 'checkbox', checked: settings.autoReveal, click: item => { settings.autoReveal = item.checked; savePrefs(); } },
      { label: 'Keep running when window closes', type: 'checkbox', checked: settings.keepRunning, click: item => { settings.keepRunning = item.checked; savePrefs(); configureTray(); buildMenu(); } },
      { label: 'Clear local session…', click: clearSession },
      { label: 'Export performance report…', click: exportMetrics },
      { type: 'separator' }, { label: 'Quit completely', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
    ]},
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: 'View', submenu: [{ role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'togglefullscreen' }] }
  ]));
}
async function init() {
  fs.mkdirSync(app.getPath('userData'), { recursive: true, mode: 0o700 }); fs.chmodSync(app.getPath('userData'), 0o700);
  try { const saved = JSON.parse(fs.readFileSync(prefsPath(), 'utf8')); settings.keepRunning = saved.keepRunning === true; settings.autoReveal = saved.autoReveal !== false; } catch {}
  const s = session.fromPartition('persist:whatsapp');
  s.setUserAgent(chromiumUserAgent(s.getUserAgent()));
  const grants = new Set();
  s.setPermissionCheckHandler((wc, permission, origin) => !!wc && wc === view?.webContents && allowedPage(origin) && allowedPermission(permission) && (['fullscreen', 'clipboard-sanitized-write'].includes(permission) || grants.has(permission)));
  s.setPermissionRequestHandler(async (wc, permission, callback, details) => {
    if (!wc || wc !== view?.webContents || !allowedPage(wc.getURL()) || !allowedPage(details.requestingUrl || wc.getURL()) || !allowedPermission(permission) || details.isMainFrame === false) return callback(false);
    if (['fullscreen', 'clipboard-sanitized-write'].includes(permission) || grants.has(permission)) return callback(true);
    try {
      const { response } = await dialog.showMessageBox(win, { type: 'question', message: permission === 'media' ? 'Allow WhatsApp to use your camera and microphone?' : 'Allow WhatsApp notifications?', buttons: ['Deny', 'Allow for this run'], defaultId: 0, cancelId: 0 });
      if (response === 1) grants.add(permission);
      callback(response === 1);
    } catch { callback(false); }
  });
  s.on('will-download', async (_event, item) => {
    // Chromium's native save dialog prompts for destination before writing.
    item.setSaveDialogOptions({ title: 'Save WhatsApp attachment' });
  });
  win = new BrowserWindow({ width: 1120, height: 800, minWidth: 540, minHeight: 620, title: 'WhatsApp QuickStart', icon, show: false, backgroundColor: '#101b1a', webPreferences: { preload: path.join(__dirname, 'preload.js'), nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true } });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', e => e.preventDefault());
  win.webContents.on('did-finish-load', () => win.webContents.send('status', currentStatus));
  win.on('resize', fit);
  win.on('close', e => { if (!quitting && settings.keepRunning && tray) { e.preventDefault(); win.hide(); } });
  win.on('closed', () => { stopWatch(); if (view && !view.webContents.isDestroyed()) view.webContents.close(); win = null; });
  ipcMain.on('shell-action', (event, action) => {
    if (event.sender !== win?.webContents || event.senderFrame !== win.webContents.mainFrame || event.senderFrame.url !== shellURL) return;
    if (action === 'retry') loadWhatsApp();
    if (action === 'reveal') reveal('manual_reveal');
    if (action === 'browser') shell.openExternal(ORIGIN).catch(() => {});
    if (action === 'settings') Menu.getApplicationMenu().items[0].submenu.popup({ window: win });
  });
  buildMenu(); configureTray();
  await win.loadFile(path.join(__dirname, 'index.html')); win.show(); mark('window_visible'); loadWhatsApp();
}
mark('main_process_started');
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (win) restore(); });
  app.on('before-quit', () => { quitting = true; stopWatch(); });
  app.on('window-all-closed', () => app.quit());
  app.whenReady().then(init).catch(() => { dialog.showErrorBox('QuickStart could not start', 'Try restarting the application. Check that your user data folder is writable.'); app.quit(); });
}
