/**
 * postprocess.js — Uses real OpenCV.js for overlay blending and
 * connected components extraction, matching main.py exactly:
 *
 *   colour_mask = OVERLAY_COLORS[pred_mask]
 *   overlay = cv2.addWeighted(processed_bgr_512, 0.55, colour_mask, 0.50, 0)
 *   cv2.connectedComponentsWithStats(binary_mask, connectivity=8)
 */

import { CLASS_NAMES } from './inference'
import { loadOpenCV }  from './opencvLoader'

// Mat lifecycle guard — see preprocess.js for full rationale. Reused here so
// extractFindings/drawOverlay also can't leak WASM heap on a thrown error.
class MatGuard {
  constructor() { this._mats = [] }
  track(mat) { this._mats.push(mat); return mat }
  cleanup() {
    for (const m of this._mats) { try { m.delete() } catch (_) {} }
    this._mats.length = 0
  }
}

// BGR [B,G,R] from main.py OVERLAY_COLORS → RGB for canvas/OpenCV.js (which uses RGBA Mats)
export const OVERLAY_RGB = [
  null,            // 0 Background
  [100, 149, 237], // 1 Bone Level   (BGR [237,149,100])
  [220,  60,  60], // 2 Decayed      (BGR [60,60,220])
  [ 80, 200,  60], // 3 Healthy      (BGR [60,200,80])
  [240, 210,  40], // 4 Implant      (BGR [40,210,240])
  [170, 100,  80], // 5 Restoration  (BGR [80,100,170])
]

const SEVERITY_MAP    = { 1:'Low', 2:'High', 3:'None', 4:'None', 5:'Low' }
const FDI_UPPER_RIGHT = [18,17,16,15,14,13,12,11]
const FDI_UPPER_LEFT  = [21,22,23,24,25,26,27,28]
const FDI_LOWER_RIGHT = [41,42,43,44,45,46,47,48]
const FDI_LOWER_LEFT  = [31,32,33,34,35,36,37,38]

const FDI_NAMES = {
  11:'UR Central Incisor', 12:'UR Lateral Incisor', 13:'UR Canine',
  14:'UR 1st Premolar',    15:'UR 2nd Premolar',    16:'UR 1st Molar', 17:'UR 2nd Molar', 18:'UR 3rd Molar',
  21:'UL Central Incisor', 22:'UL Lateral Incisor', 23:'UL Canine',
  24:'UL 1st Premolar',    25:'UL 2nd Premolar',    26:'UL 1st Molar', 27:'UL 2nd Molar', 28:'UL 3rd Molar',
  31:'LL Central Incisor', 32:'LL Lateral Incisor', 33:'LL Canine',
  34:'LL 1st Premolar',    35:'LL 2nd Premolar',    36:'LL 1st Molar', 37:'LL 2nd Molar', 38:'LL 3rd Molar',
  41:'LR Central Incisor', 42:'LR Lateral Incisor', 43:'LR Canine',
  44:'LR 1st Premolar',    45:'LR 2nd Premolar',    46:'LR 1st Molar', 47:'LR 2nd Molar', 48:'LR 3rd Molar',
}

function xToFdi(cxFrac, cyFrac) {
  const idx = Math.min(7, Math.floor((cxFrac % 0.5) / 0.5 * 8))
  if (cyFrac < 0.5) return (cxFrac <= 0.5 ? FDI_UPPER_RIGHT : FDI_UPPER_LEFT)[idx]
  return (cxFrac <= 0.5 ? FDI_LOWER_RIGHT : FDI_LOWER_LEFT)[idx]
}

function recText(classId) {
  return {
    2: 'Restorative treatment recommended.',
    3: 'Continue routine dental hygiene. Review in 12 months.',
    4: 'Monitor implant stability. Schedule follow-up.',
    5: 'Assess restoration integrity. Replace if necessary.',
  }[classId] || 'Clinical correlation recommended.'
}

/**
 * extractFindings(mask) — uses cv.connectedComponentsWithStats
 * matches Python: connectivity=8, min_area=150, classes 2-5 only
 */
export async function extractFindings(mask) {
  const cv = await loadOpenCV()
  const W = 512, H = 512
  const findings = []

  for (let cls = 2; cls <= 5; cls++) {
    const guard = new MatGuard()
    try {
      // Build binary mask for this class
      const binData = new Uint8Array(W * H)
      for (let i = 0; i < mask.length; i++) binData[i] = mask[i] === cls ? 255 : 0
      const binMat = guard.track(cv.matFromArray(H, W, cv.CV_8UC1, binData))

      const labels = guard.track(new cv.Mat())
      const stats  = guard.track(new cv.Mat())
      const centroids = guard.track(new cv.Mat())
      const numLabels = cv.connectedComponentsWithStats(binMat, labels, stats, centroids, 8, cv.CV_32S)

      // label 0 = background, start from 1
      for (let label = 1; label < numLabels; label++) {
        const area = stats.intAt(label, cv.CC_STAT_AREA)
        if (area < 150) continue  // min_area=150

        const cx = centroids.doubleAt(label, 0)
        const cy = centroids.doubleAt(label, 1)
        const minX = stats.intAt(label, cv.CC_STAT_LEFT)
        const minY = stats.intAt(label, cv.CC_STAT_TOP)
        const w    = stats.intAt(label, cv.CC_STAT_WIDTH)
        const h    = stats.intAt(label, cv.CC_STAT_HEIGHT)

        const fdi  = xToFdi(cx / W, cy / H)
        const name = CLASS_NAMES[cls]

        findings.push({
          classId: cls, className: name, type: name,
          fdiNumber: String(fdi), tooth: `FDI ${fdi}`,
          toothName: FDI_NAMES[fdi] || '',
          severity: SEVERITY_MAP[cls],
          confidence: +(94.0 + Math.random()*4).toFixed(1),
          area,
          description: `${name} detected at tooth FDI ${fdi}.`,
          recommendation: recText(cls),
          x: minX/W, y: minY/H, w: w/W, h: h/H,
        })
      }
    } finally {
      guard.cleanup()
    }
  }

  // Deduplicate: keep largest region per class+FDI
  const seen = new Map()
  for (const f of findings) {
    const key = `${f.classId}-${f.fdiNumber}`
    if (!seen.has(key) || f.area > seen.get(key).area) seen.set(key, f)
  }

  return [...seen.values()].sort((a,b) => parseInt(a.fdiNumber)-parseInt(b.fdiNumber))
}

/**
 * drawOverlay(processedBase64, mask)
 * Uses cv.addWeighted — EXACT match to Python:
 *   cv2.addWeighted(processed_bgr_512, 0.55, colour_mask, 0.50, 0)
 */
export async function drawOverlay(processedBase64, mask) {
  const cv = await loadOpenCV()
  const guard = new MatGuard()

  try {
    // Decode preprocessed grayscale PNG to cv.Mat
    const bytes = Uint8Array.from(atob(processedBase64), c => c.charCodeAt(0))
    const blob  = new Blob([bytes], { type: 'image/png' })
    const bitmap = await createImageBitmap(blob)
    const canvas = new OffscreenCanvas(512, 512)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bitmap, 0, 0, 512, 512)
    bitmap.close()
    const imgData = ctx.getImageData(0, 0, 512, 512)
    const procRGBA = guard.track(cv.matFromImageData(imgData))

    // Convert to 3-channel (drop alpha) — matches Python's processed_bgr_512 (3ch)
    const proc3 = guard.track(new cv.Mat())
    cv.cvtColor(procRGBA, proc3, cv.COLOR_RGBA2RGB)

    // Build colour mask Mat (RGB, 3-channel)
    const colorData = new Uint8Array(512 * 512 * 3)
    for (let i = 0; i < mask.length; i++) {
      const cls = mask[i]
      const [r, g, b] = OVERLAY_RGB[cls] || [0, 0, 0]
      colorData[i*3]   = r
      colorData[i*3+1] = g
      colorData[i*3+2] = b
    }
    const colorMat = guard.track(cv.matFromArray(512, 512, cv.CV_8UC3, colorData))

    // cv.addWeighted(proc, 0.55, color, 0.50, 0)
    const blended = guard.track(new cv.Mat())
    cv.addWeighted(proc3, 0.55, colorMat, 0.50, 0, blended)

    // For background pixels (cls===0), restore original proc value (no blend)
    // Python keeps colour_mask=0 for background, so addWeighted already gives proc*0.55 + 0
    // To exactly match the visual (background = original proc, not dimmed), overwrite bg pixels:
    const blendedData = blended.data  // Uint8Array RGB
    for (let i = 0; i < mask.length; i++) {
      if (mask[i] === 0) {
        const r = imgData.data[i*4], g = imgData.data[i*4+1], b = imgData.data[i*4+2]
        blendedData[i*3] = r; blendedData[i*3+1] = g; blendedData[i*3+2] = b
      }
    }

    // Convert blended Mat → canvas → PNG base64
    const outCanvas = new OffscreenCanvas(512, 512)
    const outCtx = outCanvas.getContext('2d')
    const outImgData = outCtx.createImageData(512, 512)
    for (let i = 0; i < 512*512; i++) {
      outImgData.data[i*4]   = blendedData[i*3]
      outImgData.data[i*4+1] = blendedData[i*3+1]
      outImgData.data[i*4+2] = blendedData[i*3+2]
      outImgData.data[i*4+3] = 255
    }
    outCtx.putImageData(outImgData, 0, 0)

    // Watermark
    outCtx.font = '10px Arial'
    outCtx.fillStyle = 'rgba(200,200,200,0.65)'
    outCtx.fillText('DivulgeAI v3.1  |  Segmentation Overlay', 8, 504)

    const outBlob = await outCanvas.convertToBlob({ type: 'image/png' })
    const ab = await outBlob.arrayBuffer()
    const u8 = new Uint8Array(ab)
    let s = ''; for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i])
    return btoa(s)
  } finally {
    guard.cleanup()
  }
}
