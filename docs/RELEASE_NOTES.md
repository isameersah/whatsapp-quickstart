## WhatsApp QuickStart v0.1.1

A dedicated Ubuntu desktop wrapper for official WhatsApp Web.

### Included

- Persistent local login session.
- Startup interface with retry and manual reveal.
- Optional tray and keep-running mode.
- Ubuntu application launcher and icon.
- Notification and media permission prompts.
- Local startup-performance report export.
- Browser compatibility adjustment that removes wrapper identifiers while preserving the actual Chromium version and platform.

This release does not include saved chat previews.

### Install

Download the amd64 `.deb`, then run from its folder:

```bash
sudo apt install ./WhatsApp-QuickStart-0.1.1-amd64.deb
whatsapp-quickstart
```

Quit an older running version with Ctrl+Q before upgrading. Your valid login session should be retained.

### Notes

This is an independent project, not an official WhatsApp or Meta application. Startup detection is experimental; use Show WhatsApp if the startup screen remains visible. Network synchronization and authentication are controlled by WhatsApp. No fixed startup-time improvement is guaranteed. Packages are unsigned.
