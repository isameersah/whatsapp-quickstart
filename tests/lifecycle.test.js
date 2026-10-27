const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

test('controller wires isolated views, guards IPC, retains partition on retry and clears only after confirmation', async () => {
  const windows = [], views = [], writes = [];
  let requestPermission, checkPermission, clears = 0, response = 0;
  class WC extends EventEmitter {
    constructor() { super(); this.mainFrame = {}; this.url = 'https://web.whatsapp.com/'; }
    get session() { return s; }
    setUserAgent(value) { this.userAgent = value; }
    setWindowOpenHandler(fn) { this.open = fn; }
    getURL() { return this.url; }
    isDestroyed() { return !!this.closed; }
    close() { this.closed = true; }
    focus() {}
    send() {}
    async loadURL(url) { this.url = url; }
  }
  class Window extends EventEmitter {
    constructor(options) { super(); this.options = options; this.webContents = new WC(); this.contentView = { addChildView() {}, removeChildView() {} }; windows.push(this); }
    async loadFile() {}
    show() { this.shown = true; }
    isDestroyed() { return false; }
    getContentSize() { return [1120,800]; }
  }
  class View {
    constructor(options) { this.options = options; this.webContents = new WC(); views.push(this); }
    setVisible(value) { this.visible = value; }
    setBounds() {}
  }
  const app = new EventEmitter();
  Object.assign(app, { setName() {}, getPath: () => '/mock', requestSingleInstanceLock: () => true, whenReady: () => Promise.resolve(), quit() {}, getVersion: () => '0.1.0' });
  const ipcMain = new EventEmitter();
  let ua = 'Mozilla/5.0 Chrome/154.0.0.0 whatsapp-quickstart/0.1.1 Electron/45.0.0 Safari/537.36';
  const s = { getUserAgent() { return ua; }, setUserAgent(value) { ua = value; }, setPermissionCheckHandler(fn) { checkPermission = fn; }, setPermissionRequestHandler(fn) { requestPermission = fn; }, on() {}, async clearStorageData() { clears++; }, async clearCache() { clears++; } };
  let menu;
  const electron = { app, BrowserWindow: Window, WebContentsView: View, ipcMain, session: { fromPartition(name) { assert.equal(name,'persist:whatsapp'); return s; } }, Menu: { buildFromTemplate: t => t, setApplicationMenu: t => { menu = t; } }, dialog: { async showMessageBox() { return { response }; }, showErrorBox(_t,msg) { throw Error(msg); } }, shell: { async openExternal() {} } };
  const dirname = path.resolve(__dirname,'../src');
  vm.runInNewContext(fs.readFileSync(path.join(dirname,'main.js'),'utf8'), {
    require: name => name === 'electron' ? electron : name === 'node:fs' ? { mkdirSync() {}, chmodSync() {}, readFileSync() { throw Error('new user'); }, writeFileSync(...args) { writes.push(args); } } : name.startsWith('./') ? require(path.join(dirname,name)) : require(name),
    __dirname: dirname, URL, performance, process: { umask() {}, versions: { electron: 'test' } }, setTimeout, clearTimeout, setInterval, clearInterval
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(windows[0].shown, true);
  assert.equal(views.length, 1);
  assert.equal(views[0].webContents.userAgent, 'Mozilla/5.0 Chrome/154.0.0.0 Safari/537.36');
  const prefs = views[0].options.webPreferences;
  assert.equal(prefs.sandbox, true); assert.equal(prefs.contextIsolation, true); assert.equal(prefs.nodeIntegration, false);
  assert.equal(prefs.preload, undefined);
  assert.equal(views[0].visible, false);
  ipcMain.emit('shell-action',{ sender: views[0].webContents },'retry');
  assert.equal(views.length,1,'remote content cannot invoke shell actions');
  const wc = windows[0].webContents;
  wc.mainFrame.url = require('node:url').pathToFileURL(path.join(dirname,'index.html')).href;
  ipcMain.emit('shell-action',{ sender:wc, senderFrame:wc.mainFrame },'retry');
  assert.equal(views[1].webContents.userAgent, 'Mozilla/5.0 Chrome/154.0.0.0 Safari/537.36');
  assert.equal(views.length,2); assert.equal(views[0].webContents.closed,true);
  assert.equal(checkPermission(views[1].webContents,'notifications','https://evil.test'), false);
  let granted;
  await requestPermission(views[1].webContents,'geolocation', value => { granted=value; },{requestingUrl:'https://web.whatsapp.com/'});
  assert.equal(granted,false);
  const clear = menu[0].submenu.find(item => item.label === 'Clear local session…').click;
  await clear(); assert.equal(clears,0,'cancel preserves session');
  response=1; await clear(); assert.equal(clears,2); assert.equal(views.length,3);
  windows[0].emit('closed'); assert.equal(views[2].webContents.closed,true);
});
