# DivulgeAI Desktop

## Setup (run ONCE)

### Windows — double-click `setup.bat`
Or in PowerShell / Command Prompt:
```
cd divulgeai\desktop
npm install
npm run dev
```

### Mac / Linux
```
cd divulgeai/desktop
./setup.sh
```

## After first setup — just run:
```
npm run dev
```

## Build Windows Installer (.exe)
```
npm run dist:win
```
The installer will be in `release/`

---

## Requirements
- **Node.js 18+** — https://nodejs.org (download LTS)
- Internet connection for first `npm install` only

## What `npm install` downloads
- Electron binary ~130MB (from GitHub releases)
- React, Vite, and other JS packages ~50MB
- After install, app works fully offline

## If npm install fails on Electron download
Run this in PowerShell before `npm install`:
```
$env:ELECTRON_MIRROR="https://github.com/electron/electron/releases/download/"
npm install
```
