# WhatsApp QuickStart

A dedicated Ubuntu desktop window for WhatsApp Web.

QuickStart opens the official WhatsApp Web interface with a persistent login session, a controlled startup screen, and optional tray support. It keeps the project small: Electron, JavaScript, HTML and CSS, with no application backend.

**Version 0.1.1 · Linux x86_64 · MIT license**

> This is an independent project. It is not affiliated with, endorsed by, or maintained by WhatsApp or Meta.

## Features

- Official WhatsApp Web in a dedicated desktop window.
- Persistent login through a separate local browser profile.
- Startup screen with retry and manual reveal controls.
- Optional keep-running mode for reopening an existing session.
- Ubuntu launcher and application icon.
- Permission prompts for notifications, camera and microphone.
- Local performance-report export without message contents or contact names.
- Browser identification fix that preserves the actual bundled Chromium version.

This release does **not** include saved chat screenshots or the experimental cached-preview feature.

## Install on Ubuntu

Download `WhatsApp-QuickStart-0.1.1-amd64.deb` from this repository's **Releases** page. In the folder containing that file:

```bash
sudo apt install ./WhatsApp-QuickStart-0.1.1-amd64.deb
```

Open **WhatsApp QuickStart** from Applications, or run:

```bash
whatsapp-quickstart
```

Run the application as your normal user, without `sudo`.

On first use, open WhatsApp on your phone and choose **Linked devices → Link a device**, then scan the QR code. If the startup screen remains visible, click **Show WhatsApp**. Existing Firefox or Chrome sessions are not imported.

To upgrade, quit the old app completely with **Ctrl+Q**, then install the new `.deb` over it. Valid login data is retained.

## Using the app

| Action | How |
|---|---|
| Reveal WhatsApp manually | **Show WhatsApp** or **Ctrl+Shift+W** |
| Retry a failed connection | **Retry connection** or **Ctrl+R** |
| Keep the app running after closing its window | **QuickStart → Keep running when window closes** |
| Quit all app processes | **Ctrl+Q** or **QuickStart → Quit completely** |
| Remove this app's login data | **QuickStart → Clear local session** |
| Save startup timings and memory measurements | **QuickStart → Export performance report** |

Keep-running mode is optional and off by default in this release. Tray icons depend on your Ubuntu desktop configuration. If the tray is unavailable, reopen the app using its launcher.

## What QuickStart can improve

The app can reuse a valid login, cached website resources and—when kept running—the existing WhatsApp window. Its startup screen can cover WhatsApp's initial loading interface.

It cannot skip WhatsApp authentication, synchronization or network initialization. Hiding a loading screen does not make chats usable sooner. Readiness detection is experimental and may need updates when WhatsApp changes its interface; manual reveal remains available.

No universal startup-time claim is made. Voice/video calls and other features depend on WhatsApp Web's browser support and should be tested on your system.

## Privacy and security

QuickStart has no backend and does not export conversations, collect authentication cookies or log message contents. WhatsApp Web stores its own browser data locally and communicates with WhatsApp's services.

The application's profile normally lives at:

```text
~/.config/whatsapp-quickstart/
```

Treat this directory as sensitive: it contains browser session data. It is not a project folder and must not be uploaded to GitHub. Clear local session removes this app's login and browser cache; it does not delete chats from your phone. Use your phone's Linked devices settings to revoke access remotely.

Remote content runs with Node.js integration disabled, context isolation enabled and Chromium sandboxing enabled. Navigation is restricted to the WhatsApp Web origin. External HTTP(S) links require confirmation before opening in the default browser. Unrelated permissions and protocols are denied by default. These controls are not a substitute for updating Electron and your operating system.

## Run from source

Use Node.js 24 with npm. If you use nvm, `nvm use` selects the version from `.nvmrc`.

```bash
npm ci
npm run check
npm test
npm start
```

Internet access is required to install dependencies and download Electron.

## Build installers

```bash
npm run dist
```

The build produces an amd64 `.deb` and an x86_64 AppImage in `dist/`. The `.deb` provides Ubuntu launcher integration. Build and run as a regular user; do not work around Chromium sandbox errors using `--no-sandbox`.

Runtime dependencies are kept minimal; Electron and the packaging tool are pinned in `package-lock.json`. Update and retest them regularly.

## Troubleshooting

**The startup screen stays visible:** click Show WhatsApp. If the live website works, automatic detection may need updating. You can disable automatic reveal from the QuickStart menu.

**WhatsApp asks for a newer browser:** this release removes Electron/wrapper tokens from the browser identification while retaining the actual Chromium version. If WhatsApp still rejects it, use the browser fallback and report your app and Ubuntu versions. Updating your separately installed Chrome does not update the bundled browser.

**The installer is waiting for a package lock:** allow any App Center installation or system update to finish. Do not delete package-manager lock files.

**Notifications do not appear:** allow the permission prompt and check Ubuntu notification/Do Not Disturb settings. The app must be running.

**Login is requested again:** WhatsApp may expire or revoke linked sessions. Link your phone again.

**The app fails to launch:** run `whatsapp-quickstart` from a terminal and report the error after removing private information. Do not publish your profile folder or session data.

## Development and releases

The source includes eight automated tests covering browser identification, navigation policy, permissions, startup detection and controller lifecycle. They use mocks for Electron and do not replace live Ubuntu testing.

GitHub Actions checks changes on pushes and pull requests. Pushing a matching version tag builds installers and creates a **draft release** for the maintainer to review and publish. See [Publishing on GitHub](docs/PUBLISHING.md).

For development guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Uninstall

Quit the application, then run:

```bash
sudo apt remove whatsapp-quickstart
```

Uninstalling does not automatically delete the profile. Use Clear local session before uninstalling if you want to remove the saved login.

## License

The wrapper's code and original icon are available under the [MIT License](LICENSE). WhatsApp's website, services and trademarks belong to their respective owners; the MIT license does not grant rights to those assets.
