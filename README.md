# DivulgeAI — AI-Powered Dental Radiograph Analysis Platform

<p align="center">
  <img src="https://img.shields.io/badge/Electron-31.x-47848F?style=for-the-badge&logo=electron&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/ONNX_Runtime_Web-1.27-FF6F00?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/OpenCV.js-5.0-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white"/>
  <img src="https://img.shields.io/badge/License-GPL--3.0-blue?style=for-the-badge"/>
</p>

<p align="center">
  A fully offline, cross-platform desktop application for AI-assisted dental radiograph (RVG / X-ray) analysis — built for dental professionals.
</p>

---

## Overview

DivulgeAI is a production-ready Electron desktop application that integrates a custom-trained **UNet + ResNet50** deep learning model to automatically analyse dental radiographs. It detects caries, bone level changes, restorations, implants, and healthy teeth — then generates a structured clinical PDF report following the standard dental radiograph reporting template.

Everything runs **100% offline** on the doctor's machine. No cloud, no backend server, no internet required after install.

---

## Screenshots

| Dashboard | Analysis | Segmentation Result | Report |
|-----------|----------|-------------------|--------|
| Patient list, stats, quick actions | Upload RVG images, run AI | Original · Preprocessed · Segmented | Editable structured PDF report |

---

## Key Features

### AI & Model
- **UNet + ResNet50** segmentation model — 6 classes: Background, Bone Level, Decayed Teeth, Healthy Teeth, Implant, Restoration
- **ONNX Runtime Web (WASM)** — model runs entirely in the Electron renderer, no Python server required
- **FDI tooth numbering** — automatic lesion localization to standard dental notation (FDI 11–48)
- **Connected-component analysis** using OpenCV.js for precise region detection with 8-connectivity
- Pixel-identical preprocessing to the Python training pipeline

### Preprocessing Pipeline (OpenCV.js WASM)
Exact JavaScript port of the Python `preprocessing.py` pipeline:
1. `cv.cvtColor` → Grayscale conversion (OpenCV formula)
2. `cv.normalize` → NORM_MINMAX 0–255
3. **3× iterative loop:**
   - Brightness check → `cv.LUT` gamma correction (γ = 0.92 or 1.04)
   - Contrast check → `cv.CLAHE` (adaptive clip limit) or `cv.GaussianBlur`
   - Sharpness check → `cv.filter2D` sharpen or `cv.bilateralFilter`
4. `cv.resize` → 512×512 (INTER_AREA for downscale, INTER_CUBIC for upscale)
5. ImageNet normalization → `[1, 3, 512, 512]` float32 tensor

### Image Handling
- **Any format** — JPEG (all variants including progressive/CMYK), PNG, BMP, TIFF, WebP
- **EXIF auto-rotation** — phone-camera photos of films auto-corrected (orientations 3, 6, 8)
- 3-strategy decode fallback: Electron `nativeImage` IPC → `createImageBitmap` → `<img>` element
- `MatGuard` pattern for guaranteed OpenCV WASM heap cleanup (no memory leaks across sessions)

### Clinical Workflow
- Patient management with full CRUD (add, edit, delete)
- Multi-image analysis per session (up to 8 RVG images)
- Tooth label required before analysis (enforced)
- Auto-redirect to report after analysis completes
- Follow-up analysis tracking per patient
- Report history with status tracking (Generated / Edited / Downloaded)

### PDF Report (matching clinical template)
Generated with `pdf-lib` — sections:
1. Patient Details
2. Radiographic Examination Details
3. Radiographic Images (3-image strip: Original · Preprocessed · AI Segmented)
4. AI Analysis Summary (editable by doctor — count + confidence)
5. Patient Information (plain-language findings + clinical significance)
6. Affected Teeth (doctor-selected via FDI tooth chart)
7. Doctor's Clinical Notes
8. Disclaimer + Signature

---

## Architecture

```
divulgeai/
├── desktop/                        ← Electron + React application
│   ├── electron/
│   │   ├── main.js                 ← Main process, IPC, EXIF rotation, file dialogs
│   │   └── preload.js              ← Secure context bridge
│   ├── public/
│   │   ├── dental_unet_resnet50_merged.onnx   ← 130MB self-contained model
│   │   ├── ort/                    ← ORT WASM binaries
│   │   └── opencv/
│   │       └── opencv.js           ← OpenCV.js WASM (13MB, inline WASM)
│   └── src/
│       ├── services/
│       │   ├── preprocess.js       ← OpenCV.js preprocessing pipeline
│       │   ├── inference.js        ← ONNX session management + softmax argmax
│       │   ├── postprocess.js      ← cv.addWeighted overlay + cv.connectedComponentsWithStats
│       │   ├── opencvLoader.js     ← OpenCV.js loader (fetch + new Function scope fix)
│       │   ├── aiService.js        ← Pipeline coordinator with timeout safety nets
│       │   └── pdfService.js       ← pdf-lib report generator
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── AnalysisPage.jsx    ← Upload, label, run, auto-redirect to report
│       │   ├── ReportsPage.jsx     ← Structured report editor + download
│       │   └── PatientsPage.jsx    ← Patient CRUD
│       ├── components/
│       │   ├── Sidebar.jsx         ← 2-item nav: Dashboard + Patients dropdown
│       │   └── ToothPicker.jsx     ← Interactive FDI dental chart
│       └── context/
│           ├── AppContext.jsx      ← Global state (patients, reports, navigation)
│           └── AuthContext.jsx     ← Doctor profile + auth
├── website/                        ← Marketing landing page (React + Vite)
└── model/                          ← Python training/inference reference (FastAPI)
```

---

## AI Model Details

| Property | Value |
|----------|-------|
| Architecture | UNet + ResNet50 encoder |
| Input | `[1, 3, 512, 512]` float32, ImageNet normalized |
| Output | `[1, 6, 512, 512]` float32 logits |
| Inference | `torch.softmax` + `torch.argmax` (dim=1) |
| Format | ONNX (self-contained, external data merged) |
| Runtime | ONNX Runtime Web 1.27 (WASM, single-threaded) |

### Class Definitions

| ID | Class | Overlay Colour |
|----|-------|---------------|
| 0 | Background | — (not rendered) |
| 1 | Bone Level | Cyan |
| 2 | Decayed Teeth | Red |
| 3 | Healthy Teeth | Green |
| 4 | Implant | Orange |
| 5 | Restoration | Purple |

Overlay blend: `cv2.addWeighted(processed, 0.55, colour_mask, 0.50, 0)` — pixel-identical to Python output.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Electron 31.x |
| UI Framework | React 18 + Vite 5 |
| AI Inference | ONNX Runtime Web 1.27 (WASM) |
| Image Processing | OpenCV.js 5.0 (WASM, `@techstark/opencv-js`) |
| PDF Generation | pdf-lib |
| Styling | Custom CSS design system (CSS variables) |
| Build/Package | electron-builder (NSIS installer / AppImage) |
| Model Training | PyTorch, UNet, ResNet50 |
| Model Serving (dev) | FastAPI + Python |

---

## Getting Started

### Prerequisites
- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- Git

### Install & Run

```bash
# Clone the repository
git clone https://github.com/your-username/divulgeai.git
cd divulgeai/desktop

# Install dependencies (downloads Electron ~130MB on first run)
npm install

# Start in development mode
npm run dev
```

The app opens on `http://localhost:5174` with Electron DevTools attached.

### First Login
On first launch, use the **"Create Desktop Profile"** tab to set up your doctor profile (name, hospital, specialization). These appear in every generated report.

---

## Build Installers

### Windows (.exe — NSIS installer)
```bash
cd desktop
npm run dist:win
# Output: release/DivulgeAI Setup 2.0.0.exe
```

### Linux (AppImage) — must build on Linux or WSL2
```bash
# On Linux / WSL2
cd desktop
npm run dist:linux
# Output: release/DivulgeAI-2.0.0.AppImage
```

Run the AppImage:
```bash
chmod +x DivulgeAI-2.0.0.AppImage
./DivulgeAI-2.0.0.AppImage
```

### macOS (.dmg)
```bash
cd desktop
npm run dist:mac
# Output: release/DivulgeAI-2.0.0.dmg
```

---

## Clinical Workflow

```
Doctor opens app
       │
       ▼
Select / Add Patient
       │
       ▼
Upload RVG image(s) — any format (JPEG/PNG/BMP/TIFF)
       │
       ▼
Enter tooth label (required — e.g. "FDI 36")
       │
       ▼
Run AI Analysis
  ├── Preprocess (OpenCV.js WASM)
  │     CLAHE · Gamma · Sharpen · Bilateral · Resize 512×512
  ├── Inference (ONNX Runtime Web)
  │     UNet+ResNet50 → 6-class segmentation mask
  └── Postprocess (OpenCV.js + canvas)
        Overlay · Connected Components · FDI Mapping
       │
       ▼
Auto-redirect to Report
  ├── View: Original · Preprocessed · Segmented (with FDI toggle)
  ├── Fill: AI Analysis Summary (count + confidence)
  ├── Select: Affected teeth on FDI chart
  ├── Write: Clinical notes, treatment plan
  └── Download PDF (matches clinical reporting template)
```

---

## Project Structure Notes

### Why No Backend?
The original design used a Python FastAPI backend for model inference. This was eliminated entirely — the ONNX model runs directly in Electron's renderer process via ONNX Runtime Web (WASM). Benefits:
- Zero installation complexity for end users
- Fully offline after first install
- No port conflicts, no server management
- Single distributable installer

### OpenCV.js Loading Fix
The `@techstark/opencv-js` v5.0 build ships as a UMD module with an async Emscripten factory. In Electron's renderer, ambient `module`/`define` globals from Vite's dev client cause the UMD wrapper to take the CommonJS branch instead of setting `window.cv`. Fixed by fetching the script as raw text and executing via `new Function(..., code)` with `module`/`define`/`exports` explicitly shadowed as `undefined` parameters.

### ONNX External Data Merge
The original model shipped as two files (`dental_unet_resnet50.onnx` + `.onnx.data`). ORT WASM cannot load external data files via HTTP. Fixed by merging into a single self-contained `dental_unet_resnet50_merged.onnx` using the ONNX Python library.

---

## Roadmap

- [ ] AWS S3 integration for report cloud backup
- [ ] AWS Cognito for real authentication
- [ ] Razorpay subscription billing
- [ ] Multi-doctor / clinic support
- [ ] DICOM format support
- [ ] OpenVINO model optimization
- [ ] Mobile companion app

---

## License

This project is licensed under the **GNU General Public License v3.0** — see [LICENSE](LICENSE) for details.

---

## Author

Built by 
**[Mayur Gotmare]**
**[Rushikesh Raghatate]**
**[Anuja Harne]**
**[Khushi Sambharkar]**


---

<p align="center">
  Built with ❤️ for dental professionals — making AI accessible at the point of care.
</p>
