'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('quickstart', Object.freeze({
  action: action => { if (['retry', 'reveal', 'browser', 'settings'].includes(action)) ipcRenderer.send('shell-action', action); },
  onStatus: callback => ipcRenderer.on('status', (_event, state) => callback(state))
}));
