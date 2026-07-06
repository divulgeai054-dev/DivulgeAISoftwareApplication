# DivulgeAI — AI Model (FastAPI)

UNet + ResNet50 dental segmentation model served via FastAPI.

## Setup

```bash
cd model

# Create virtual environment
python -m venv venv

# Activate
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Run

```bash
python main.py
# → http://localhost:8000
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET  | `/` | Health check |
| POST | `/predict` | Run inference on uploaded image |

## POST /predict — Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | File | ✅ | RVG image (JPEG/PNG) |
| `pat_name` | string | optional | Patient name |
| `pat_age` | string | optional | Patient age |
| `pat_phone` | string | optional | Patient phone |
| `pat_notes` | string | optional | Clinical notes |
| `doc_name` | string | optional | Doctor name |

## Response

```json
{
  "message": "Prediction successful",
  "reportId": "A1B2C3D4",
  "findings": [...],
  "confidence": 97.4,
  "processingTime": 0.84,
  "original_image": "<base64>",
  "preprocessed_image": "<base64>",
  "segmentation_image": "<base64>",
  "pdfBase64": "<base64>",
  "pdfFilename": "DivulgeAI_A1B2C3D4.pdf"
}
```

## Classes detected

| ID | Class | Color |
|---|---|---|
| 1 | Bone Level | Blue |
| 2 | Decayed Teeth | Red |
| 3 | Healthy Teeth | Green |
| 4 | Implant | Gold |
| 5 | Restoration | Brown |

## Docker

```bash
docker build -t divulgeai-model .
docker run -p 8000:8000 divulgeai-model
```
