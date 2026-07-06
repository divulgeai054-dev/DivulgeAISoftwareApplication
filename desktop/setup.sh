#!/bin/bash
echo "============================================"
echo " DivulgeAI Desktop - First Time Setup"
echo "============================================"
export ELECTRON_MIRROR="https://github.com/electron/electron/releases/download/"
npm install
if [ $? -ne 0 ]; then echo "ERROR: npm install failed."; exit 1; fi
echo "Setup complete! Starting..."
npm run dev
