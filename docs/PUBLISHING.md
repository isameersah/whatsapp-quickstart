# Publish this repository

This package restores the 0.1.1 behavior: the original desktop wrapper plus its browser-identification fix. It excludes all later saved-preview code. The original installer is not embedded in the source archive. Rebuilt installers are not claimed to be byte-identical to the earlier download.

## 1. Create an empty GitHub repository

Use the name `whatsapp-quickstart`. Choose Public if you want everyone to see the source. Leave GitHub's initial README, license and .gitignore options unchecked because these files are already included.

Extract this archive. Open a terminal **inside `whatsapp-quickstart-github`**, where `package.json` and `README.md` are located. Replace `YOUR_USERNAME` below with your GitHub username or organization:

```bash
git init -b main
git add .
git commit -m "Release WhatsApp QuickStart v0.1.1"
git remote add origin https://github.com/YOUR_USERNAME/whatsapp-quickstart.git
git push -u origin main
```

Authenticate using your existing GitHub CLI, credential manager or SSH setup. GitHub account passwords are not Git HTTPS credentials. Do not put access tokens into files or remote URLs.

If Git asks for your identity, configure your name and preferred GitHub email before committing. No identity is preset in this archive.

## 2. Choose a release route

### Use the installer you already tested

First open **Actions → Build Linux release → ⋯ → Disable workflow** to prevent a second build from competing with your manual release. Then open your repository's **Releases → Draft a new release**. Create tag `v0.1.1` targeting `main`, use the title `WhatsApp QuickStart v0.1.1`, paste `docs/RELEASE_NOTES.md`, and attach your existing `WhatsApp-QuickStart-0.1.1-amd64.deb`. Publish after checking the attached filename and version.

Do not commit the installer into the source repository. It belongs in Release assets.

If you choose this manual route, do not also push the tag from a local machine to run the automated release workflow for the same release. Choose one route for the first release.

### Build installers with GitHub Actions

After pushing `main`, run:

```bash
git tag -a v0.1.1 -m "WhatsApp QuickStart v0.1.1"
git push origin v0.1.1
```

Watch **Actions → Build Linux release**. The workflow checks that the tag matches `package.json`, installs dependencies, runs tests, builds `.deb` and AppImage packages, and creates checksums. It uploads these as a workflow artifact and creates a **draft GitHub Release** using the built-in `GITHUB_TOKEN`.

Review the draft under Releases, test the installer on Ubuntu, then click **Publish release**. No personal access token is required by this workflow. Repository/organization policy must allow GitHub Actions and a workflow job with `contents: write` permission.

The workflow deliberately does not overwrite an existing release. If an attempt stops after creating a draft, inspect that draft before rerunning; complete it manually rather than overwriting assets you have already published.

## 3. Repository description

Suggested About description:

> An independent Ubuntu desktop wrapper for WhatsApp Web, with persistent login, startup controls and optional tray support. Built with Electron.

Suggested topics: `electron`, `ubuntu`, `linux`, `whatsapp-web`, `desktop-app`, `javascript`.

Keep the independent-project statement in the README. Do not describe the app as an official WhatsApp release or guarantee instant startup.

## 4. Future releases

Update the version in `package.json`, run `npm install --package-lock-only`, update the release notes, test, commit and push. The tag must match the version exactly, for example `v0.1.2` for version `0.1.2`.

Source, tests, assets and documentation belong in Git. Build output, `node_modules`, local profiles, chat data and access tokens do not.

## References

- GitHub CLI release creation: https://cli.github.com/manual/gh_release_create
- Official checkout action: https://github.com/actions/checkout
- Official Node setup action: https://github.com/actions/setup-node
- Official artifact upload action: https://github.com/actions/upload-artifact
