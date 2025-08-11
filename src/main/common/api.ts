import { spawn } from 'child_process';
import { app, BrowserWindow, clipboard, dialog, ipcMain, Notification, nativeImage, screen, shell } from 'electron';
import fs from 'fs';
import ks from 'node-key-sender';
import path from 'path';
import plist from 'plist';
import { PLUGIN_INSTALL_DIR as baseDir, DECODE_KEY } from '@/common/constans/main';
import common from '@/common/utils/commonConst';
import commonConst from '@/common/utils/commonConst';
import getCopyFiles from '@/common/utils/getCopyFiles';
import { isEmpty } from '@/common/utils/use-type';
import { screenCapture } from '@/core';
import { detach, runner } from '../browsers';
import mainInstance from '../index';
import DBInstance from './db';
import getWinPosition from './getWinPosition';

const runnerInstance = runner();
const detachInstance = detach();

class API extends DBInstance {
  init(mainWindow: BrowserWindow) {
    // 响应 preload.js 事件
    ipcMain.on('msg-trigger', async (event, arg) => {
      const window = arg.winId ? BrowserWindow.fromId(arg.winId) : mainWindow;
      const data = await this[arg.type](arg, window, event);
      event.returnValue = data;
      // event.sender.send(`msg-back-${arg.type}`, data);
    });
    ipcMain.handle('msg-trigger', async (event, arg) => {
      const window = arg.winId ? BrowserWindow.fromId(arg.winId) : mainWindow;
      console.log(arg);
      return await this[arg.type](arg, window, event);
    });
    // 按 ESC 退出插件
    mainWindow.webContents.on('before-input-event', (event, input) => this.__EscapeKeyDown(event, input, mainWindow));
  }

  public getCurrentWindow = (window, e) => {
    let originWindow = BrowserWindow.fromWebContents(e.sender);
    if (originWindow !== window) originWindow = detachInstance.getWindow();
    return originWindow;
  };

  public __EscapeKeyDown = (event, input, window) => {
    if (input.type !== 'keyDown') return;
    if (!(input.meta || input.control || input.shift || input.alt)) {
      if (input.key === 'Escape') {
        if (this.currentPlugin) {
          this.removePlugin(null, window);
        } else {
          mainInstance.windowCreator.getWindow().hide();
        }
      }

      return;
    }
  };

  public windowMoving({ data: { mouseX, mouseY, width, height } }, window, e) {
    const { x, y } = screen.getCursorScreenPoint();
    const originWindow = this.getCurrentWindow(window, e);
    if (!originWindow) return;
    originWindow.setBounds({ x: x - mouseX, y: y - mouseY, width, height });
    getWinPosition.setPosition(x - mouseX, y - mouseY);
  }

  public loadPlugin({ data: plugin }, window) {
    window.webContents.executeJavaScript(`window.loadPlugin(${JSON.stringify(plugin)})`);
    this.openPlugin({ data: plugin }, window);
  }

  public async openPlugin({ data: plugin }, window) {
    if (plugin.platform && !plugin.platform.includes(process.platform)) {
      return new Notification({
        title: `插件不支持当前 ${process.platform} 系统`,
        body: `插件仅支持 ${plugin.platform.join(',')}`,
        icon: plugin.logo
      }).show();
    }
    window.setSize(window.getSize()[0], 60);
    await this.removePlugin(null, window);

    // 模板文件
    if (!plugin.main) {
      plugin.tplPath = common.dev() && plugin.enableDevelopment ? 'http://localhost:8083/#/' : `file://${__static}/tpl/index.html`;
    }
    if (plugin.name === 'rubick-system-feature') {
      plugin.logo = plugin.logo || `file://${__static}/logo.png`;
      plugin.indexPath = commonConst.dev() ? 'http://localhost:8081/#/' : `file://${__static}/feature/index.html`;
    } else if (!plugin.indexPath) {
      const pluginPath = path.resolve(baseDir, 'node_modules', plugin.name);
      plugin.indexPath = `file://${path.join(pluginPath, './', plugin.main || '')}`;
    }
    console.log(plugin);
    runnerInstance.init(plugin, window);
    this.currentPlugin = plugin;
    window.webContents.executeJavaScript(
      `window.setCurrentPlugin(${JSON.stringify({
        currentPlugin: this.currentPlugin
      })})`
    );
    let autoShow = true;
    if (plugin.ext) {
      autoShow = !isEmpty(plugin.ext.autoShow) ? !!plugin.ext.autoShow : autoShow;
      const code = plugin.ext.code || '';
      if (code.toLowerCase().includes('screenshot')) {
        autoShow = false;
      }
    }
    autoShow ? window.show() : window.hide();
    const view = runnerInstance.getView() as any;
    if (!view.inited) {
      view.webContents.on('before-input-event', (event, input) => this.__EscapeKeyDown(event, input, window));
    }
  }

  public async removePlugin(e, window) {
    await runnerInstance.removeView(window);
    this.currentPlugin = null;
  }

  public openPluginDevTools() {
    runnerInstance.getView()?.webContents.openDevTools({ mode: 'detach' });
  }

  public hideMainWindow(arg, window) {
    window.hide();
  }

  public showMainWindow(arg, window) {
    window.show();
  }

  public showOpenDialog({ data }, window) {
    return dialog.showOpenDialogSync(window, data);
  }

  public showSaveDialog({ data }, window) {
    return dialog.showSaveDialogSync(window, data);
  }

  public setExpendHeight({ data: height }, window: BrowserWindow, e) {
    const originWindow = this.getCurrentWindow(window, e);
    if (!originWindow) return;
    const targetHeight = height;
    originWindow.setSize(originWindow.getSize()[0], targetHeight);
    const screenPoint = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(screenPoint);
    const position = originWindow.getPosition()[1] + targetHeight > display.bounds.height ? height - 60 : 0;
    originWindow.webContents.executeJavaScript(`window.setPosition && typeof window.setPosition === "function" && window.setPosition(${position})`);
  }

  public setSubInput({ data }, window, e) {
    const originWindow = this.getCurrentWindow(window, e);
    if (!originWindow) return;
    originWindow.webContents.executeJavaScript(
      `window.setSubInput(${JSON.stringify({
        placeholder: data.placeholder
      })})`
    );
  }

  public subInputBlur() {
    runnerInstance.getView()?.webContents.focus();
  }

  public sendSubInputChangeEvent({ data }) {
    runnerInstance.executeHooks('SubInputChange', data);
  }

  public removeSubInput(data, window, e) {
    const originWindow = this.getCurrentWindow(window, e);
    if (!originWindow) return;
    originWindow.webContents.executeJavaScript(`window.removeSubInput()`);
  }

  public setSubInputValue({ data }, window, e) {
    const originWindow = this.getCurrentWindow(window, e);
    if (!originWindow) return;
    originWindow.webContents.executeJavaScript(
      `window.setSubInputValue(${JSON.stringify({
        value: data.text
      })})`
    );
    this.sendSubInputChangeEvent({ data });
  }

  public getPath({ data }) {
    return app.getPath(data.name);
  }

  public showNotification({ data: { body } }) {
    if (!Notification.isSupported()) return;
    if ('string' !== typeof body) body = String(body);
    const plugin = this.currentPlugin;
    const notify = new Notification({
      title: plugin ? plugin.pluginName : null,
      body,
      icon: plugin ? plugin.logo : null
    });
    notify.show();
  }

  public copyImage = ({ data }) => {
    const image = nativeImage.createFromDataURL(data.img);
    clipboard.writeImage(image);
  };

  public copyText({ data }) {
    clipboard.writeText(String(data.text));
    return true;
  }

  public copyFile({ data }) {
    if (data.file && fs.existsSync(data.file)) {
      clipboard.writeBuffer('NSFilenamesPboardType', Buffer.from(plist.build([data.file])));
      return true;
    }
    return false;
  }

  public getFeatures() {
    return this.currentPlugin?.features;
  }

  public setFeature({ data }, window) {
    this.currentPlugin = {
      ...this.currentPlugin,
      features: (() => {
        let has = false;
        this.currentPlugin.features.some(feature => {
          has = feature.code === data.feature.code;
          return has;
        });
        if (!has) {
          return [...this.currentPlugin.features, data.feature];
        }
        return this.currentPlugin.features;
      })()
    };
    window.webContents.executeJavaScript(
      `window.updatePlugin(${JSON.stringify({
        currentPlugin: this.currentPlugin
      })})`
    );
    return true;
  }

  public removeFeature({ data }, window) {
    this.currentPlugin = {
      ...this.currentPlugin,
      features: this.currentPlugin.features.filter(feature => {
        if (data.code.type) {
          return feature.code.type !== data.code.type;
        }
        return feature.code !== data.code;
      })
    };
    window.webContents.executeJavaScript(
      `window.updatePlugin(${JSON.stringify({
        currentPlugin: this.currentPlugin
      })})`
    );
    return true;
  }

  public sendPluginSomeKeyDownEvent({ data: { modifiers, keyCode } }) {
    const code = DECODE_KEY[keyCode];
    if (!code || !runnerInstance.getView()) return;
    if (modifiers.length > 0) {
      runnerInstance.getView()?.webContents.sendInputEvent({
        type: 'keyDown',
        modifiers,
        keyCode: code
      });
    } else {
      runnerInstance.getView()?.webContents.sendInputEvent({
        type: 'keyDown',
        keyCode: code
      });
    }
  }

  public detachPlugin(e, window) {
    if (!this.currentPlugin) return;
    const view = window.getBrowserView();
    window.setBrowserView(null);
    window.webContents.executeJavaScript(`window.getMainInputInfo()`).then(res => {
      detachInstance.init(
        {
          ...this.currentPlugin,
          subInput: res
        },
        window.getBounds(),
        view
      );
      window.webContents.executeJavaScript(`window.initRubick()`);
      window.setSize(window.getSize()[0], 60);
      this.currentPlugin = null;
    });
  }

  public detachInputChange({ data }) {
    this.sendSubInputChangeEvent({ data });
  }

  public getLocalId() {
    return encodeURIComponent(app.getPath('home'));
  }

  public shellShowItemInFolder({ data }) {
    shell.showItemInFolder(data.path);
    return true;
  }

  public async getFileIcon({ data }) {
    const nativeImage = await app.getFileIcon(data.path, { size: 'normal' });
    return nativeImage.toDataURL();
  }

  public shellBeep() {
    shell.beep();
    return true;
  }

  public screenCapture(arg, window) {
    screenCapture(window, img => {
      runnerInstance.executeHooks('ScreenCapture', {
        data: img
      });
    });
  }

  public getCopyFiles() {
    return getCopyFiles();
  }

  public simulateKeyboardTap({ data: { key, modifier } }) {
    let keys = [key.toLowerCase()];
    if (modifier && Array.isArray(modifier) && modifier.length > 0) {
      keys = modifier.concat(keys);
      ks.sendCombination(keys);
    } else {
      ks.sendKeys(keys);
    }
  }

  public addLocalStartPlugin({ data: { plugin } }, window) {
    window.webContents.executeJavaScript(
      `window.addLocalStartPlugin(${JSON.stringify({
        plugin
      })})`
    );
  }

  public removeLocalStartPlugin({ data: { plugin } }, window) {
    window.webContents.executeJavaScript(
      `window.removeLocalStartPlugin(${JSON.stringify({
        plugin
      })})`
    );
  }

  public installGlobalPackages({ data: { packages } }) {
    const process = spawn('volta', ['install', ...packages], {
      shell: true
    });
    let stdout = '';
    process.stdout.on('data', data => {
      stdout += data.toString();
    });
    process.stderr.on('data', data => {
      stdout += data.toString();
    });
    return new Promise(resolve => {
      process.on('close', () => {
        resolve(!stdout.includes('permission'));
      });
    });
  }

  public getPackageVersion({ data: { name } }) {
    const process = spawn(name, ['--version'], {
      shell: true
    });
    return new Promise(resolve => {
      let stdout = '';
      process.stdout.on('data', data => {
        stdout += data.toString();
      });
      process.on('close', () => {
        const reg = /\d+.\d+.\d+[^\s\n\t]*/;
        const version = stdout.trim().match(reg);
        resolve(version?.[0] || '未安装');
      });
    });
  }
}

export default new API();
