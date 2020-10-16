const electron = require("electron");
import { app, BrowserWindow, ipcMain, Tray, Menu } from "electron";
import url = require("url");
import path = require("path");
import { log } from "./logger";
import notifier = require("node-notifier");

var cron = require("node-cron");
const appFolder = path.dirname(process.execPath);
const updateExe = path.resolve(appFolder, "..", "electron.exe");
const exeName = path.basename(process.execPath);

app.setLoginItemSettings({
  openAtLogin: true,
  path: process.execPath,
  args: [
    "--processStart",
    `"${exeName}"`,
    "--process-start-args",
    `"--hidden"`,
  ],
});

const electronGoogleOauth = require("electron-google-oauth");

const clientId =
  "92416843926-p2j0m82ftus60c6fo0fv5ohvj5apt1el.apps.googleusercontent.com";

// retain a reference to the window, otherwise it gets gc-ed
let w: Electron.BrowserWindow | null = null;
let isQuiting;
let tray;

function createWindow(): Electron.BrowserWindow {
  // tray
  // tray = new Tray(path.join(__dirname, '/assets/icons/favicon.ico'));
  tray = new Tray(path.join(app.getAppPath(), "\\assets\\icons\\favicon.ico"));
  //tray doule click event
  tray.on("double-click", function (event) {
    event.preventDefault();
    w.show();
  });
  // tray context menu
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Show App",
        click: function () {
          w.show();
        },
      },
      {
        label: "Quit",
        click: function () {
          isQuiting = true;
          app.quit();
        },
      },
    ])
  );

  // log('Creating window.');
  let display = electron.screen.getPrimaryDisplay();
  let width = display.bounds.width;
  let height = display.bounds.height;
  let wWidth = 350;
  let wHeight = 480;
  // if (externalDisplay) {
  w = new BrowserWindow({
    width: wWidth,
    height: wHeight,
    x: width - wWidth,
    y: height - wHeight - 38,
    icon: app.getAppPath() + "\\assets\\icons\\favicon.ico",
    show: true,
    alwaysOnTop: true,
  });
  //TODO: chrome developer tool
  //w.webContents.openDevTools();
  //w.setMenu(null);
  // }

  w.loadURL(
    url.format({
      pathname: path.join(path.dirname(__dirname), "index.html"),
      protocol: "file:",
      slashes: true,
    })
  );

  w.on("minimize", function (event) {
    event.preventDefault();
    w.hide();
  });

  // w.on("close", (e) => {
  //   // allow window to be gc-ed
  //   // w = null;
  //   w.minimize();
  //   e.preventDefault();
  // });
  w.on("close", function (event) {
    if (!isQuiting) {
      event.preventDefault();
      w.hide();
      event.returnValue = false;
    }
  });

  ipcMain.on("app-focus", () => {
    app.focus();
  });
  notifier.notify(
    {
      title: "New Notification",
      message: "Hello User",
    },
    function (error, response) {
      // log("response", response);
    }
  );
  return w;
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (w) {
      if (w.isMinimized()) w.restore();
      w.focus();
    }
  });

  // Create myWindow, load the rest of the app, etc...
  app.on("ready", () => {});
}

ipcMain.on("btnclick", function (event, arg) {
  let display = electron.screen.getPrimaryDisplay();
  let width = display.bounds.width;
  let height = display.bounds.height;
  let wWidth = 350;
  let wHeight = 480;

  const browserWindowParams = {
    center: true,
    show: true,
    resizable: false,
    width: wWidth,
    height: wHeight,
    x: width - wWidth,
    y: height - wHeight - 38,
    webPreferences: {
      nodeIntegration: false,
    },
    alwaysOnTop: true,
    autoHideMenuBar: true,
    icon: app.getAppPath() + "\\assets\\icons\\favicon.ico",
  };

  // browserWindowParams.

  const googleOauth = electronGoogleOauth(browserWindowParams);
  googleOauth
    .getAccessToken(
      ["https://www.googleapis.com/auth/plus.me", "profile", "email"],
      clientId
    )
    .then((result) => {
      event.sender.send("btnclick_task_finished", result);
    });
});
app.on("ready", createWindow);
app.on("window-all-closed", (e) => {
  // log('All windows closed');
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    // app.quit()
    w.minimize();
    e.preventDefault();
  }
});

ipcMain.on("minimizeWindow", function (event, arg) {
  w.minimize();
  event.preventDefault();
});
app.on("activate", () => {
  if (w === null) {
    log("Creating a new window");
    w = createWindow();
  }
});

// before quit event
app.on("before-quit", function () {
  isQuiting = true;
});

//* 0 15 * * *
cron.schedule("0 0 15 * * *", () => {
  // app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) })
  w.restore();
  w.focus();
});
