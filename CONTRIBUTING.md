# Contributing

Use Node.js 24, run `npm ci`, then `npm run check` and `npm test` before submitting changes.

Keep changes focused on the desktop wrapper. Preserve sandboxing, context isolation, disabled Node integration for remote content, the navigation allowlist and strict IPC sender validation. Do not add message scraping, authentication bypasses or server-side session collection.

For bugs, include the app version, Ubuntu version, steps to reproduce, expected result and relevant terminal errors. Remove names, phone numbers, messages and other private information. Never attach the app's profile directory.

Live checks should cover first-time QR login, session persistence, manual reveal, offline/retry recovery, external links, permission prompts, downloads, optional tray mode and complete shutdown. Mock tests alone do not prove live WhatsApp compatibility.

For security-sensitive reports, use the repository's private vulnerability reporting feature if the maintainer has enabled it; do not expose credentials or exploit details in a public issue.
