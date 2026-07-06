# DivulgeAI — Monorepo

```
divulgeai/
├── website/        ← Marketing site     (React + Vite, port 5173)
├── desktop/        ← Desktop app        (Electron + React + Vite, port 5174)
├── model/          ← AI model API       (FastAPI + PyTorch, port 8000)
├── backend/        ← Auth/data API      (add later)
└── package.json
```

---

## Quick Start

```bash
# 1. Install website + desktop
npm run install:all

# 2. Start model (in its own terminal)
cd model
python -m venv venv && venv\Scripts\activate   # Windows
pip install -r requirements.txt
python main.py        # → http://localhost:8000

# 3. Website (Terminal 2)
npm run website       # → http://localhost:5173

# 4. Desktop (Terminal 3)
npm run desktop       # → Electron window
```

---

## How it all connects

```
website (5173) ──┐
                 ├── shared backend (VITE_API_URL) — auth, patients, reports
desktop (5174) ──┘
     │
     └── model API (VITE_MODEL_URL = http://localhost:8000)
              POST /predict  → returns original + preprocessed + segmented images (base64)
                             → returns findings list
                             → returns PDF base64 (real report from fpdf)
```

## Build

```bash
npm run build:website    # → website/dist/
npm run build:win        # → desktop/release/*.exe
npm run build:mac        # → desktop/release/*.dmg
npm run build:linux      # → desktop/release/*.AppImage
```

## Offline / Dev mode

Leave `VITE_API_URL` and `VITE_MODEL_URL` empty in `desktop/.env`.
The desktop app will simulate the full inference flow with canvas-drawn overlays.

## Model API — POST /predict response

```json
{
  "findings": [
    { "tooth": "Decayed Teeth", "severity": "High", "confidence": 97.4,
      "description": "Detected 2 region(s).", "recommendation": "Restorative treatment." }
  ],
  "original_image":      "<base64 PNG>",
  "preprocessed_image":  "<base64 PNG>",
  "segmentation_image":  "<base64 PNG>",
  "pdfBase64":           "<base64 PDF>",
  "pdfFilename":         "DivulgeAI_A1B2C3D4.pdf",
  "statistics":          { "brightness": 128, "contrast": 55, "sharpness": 210 },
  "confidence":          97.4,
  "processingTime":      0.84
}
```
