"""
Standalone test — run BEFORE starting main.py to verify all steps work.

Usage:
    python debug_test.py                    # uses a synthetic image
    python debug_test.py path/to/image.jpg  # uses a real image
"""
import sys, os, traceback
import numpy as np
import cv2
import torch

def step(n, msg):
    print(f"\n[Step {n}] {msg}")

step(1, "Creating test image...")
if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
    img_bgr = cv2.imread(sys.argv[1])
    print(f"  Loaded: {sys.argv[1]}  shape={img_bgr.shape}")
else:
    img_bgr = (np.random.rand(480, 640, 3) * 255).astype(np.uint8)
    print(f"  Synthetic BGR image: {img_bgr.shape}")

step(2, "preprocess_image()...")
from model.preprocessing import preprocess_image
orig_gray, processed_gray, stats = preprocess_image(img_bgr)
print(f"  orig_gray shape      = {np.array(orig_gray).shape}")
print(f"  processed_gray shape = {np.array(processed_gray).shape}  dtype={np.array(processed_gray).dtype}")
print(f"  stats                = {stats}")

step(3, "load_model() + inference...")
from model import load_model, DEVICE
mdl = load_model()
print(f"  Device: {DEVICE}")

arr = processed_gray.astype(np.float32) / 255.0
arr = np.stack([arr]*3, axis=-1)
arr = (arr - [0.485,0.456,0.406]) / [0.229,0.224,0.225]
arr = np.transpose(arr,(2,0,1))
tensor = torch.tensor(arr, dtype=torch.float32).unsqueeze(0).to(DEVICE)
print(f"  Input tensor: {tensor.shape}")
with torch.no_grad():
    logits    = mdl(tensor)
    pred_mask = torch.argmax(torch.softmax(logits,dim=1),dim=1).squeeze().cpu().numpy().astype(np.uint8)
print(f"  pred_mask: {pred_mask.shape}  unique={np.unique(pred_mask)}")

step(4, "make_overlay()...")
COLORS = np.array([
    [0,0,0],[237,149,100],[60,60,220],[60,200,80],[40,210,240],[80,100,170]
], dtype=np.uint8)
proc_bgr   = cv2.cvtColor(processed_gray, cv2.COLOR_GRAY2BGR)
colour_mask = COLORS[pred_mask]
overlay     = cv2.addWeighted(proc_bgr, 0.55, colour_mask, 0.50, 0)
print(f"  overlay shape: {overlay.shape}  dtype={overlay.dtype}")

step(5, "create_pdf_report()...")
from model.pdf_generator import create_pdf_report
orig_bgr_512  = cv2.resize(img_bgr,       (512,512))
proc_bgr_512  = cv2.cvtColor(processed_gray, cv2.COLOR_GRAY2BGR)
over_bgr_512  = overlay

import tempfile
out = os.path.join(tempfile.gettempdir(), "divulgeai_test.pdf")
create_pdf_report(
    hosp_name="Test Hospital", doc_name="Dr. Test Doctor",
    doc_specialization="General Dentistry",
    hosp_phone="+91 00000 00000", hosp_email="test@clinic.com",
    pat_name="Test Patient", pat_age="35", pat_phone="+91 00000 00000", pat_notes="Test run",
    conf_score=97.4, region_counts={}, class_names={},
    findings_list=[{
        "fdiNumber":"36","tooth":"FDI 36","className":"Decayed Teeth",
        "type":"Decayed Teeth","severity":"High","confidence":97.1,
        "description":"Test finding.","recommendation":"Test recommendation.",
    }],
    original_image=orig_bgr_512,
    preprocessed_image=proc_bgr_512,
    overlay_image=over_bgr_512,
    doc_complaint="Test complaint", doc_summary="Test summary",
    doc_teeth="FDI 36", doc_severity="High",
    doc_treatment="Test treatment", doc_notes="Test notes",
    comp_phone="+91 00000 00000", comp_email="support@divulgeai.com",
    output_path=out,
)
size = os.path.getsize(out)
print(f"  PDF written: {out}  ({size} bytes)")
assert size > 1000, "PDF too small — something went wrong"

print("\n" + "="*50)
print("ALL STEPS PASSED — main.py should work correctly.")
print("="*50)
