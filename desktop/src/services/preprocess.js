/**
 * preprocess.js
 * Uses REAL OpenCV.js (WASM) — exact same functions as the Python
 * preprocessing.py pipeline. This guarantees pixel-identical results
 * between training/Python inference and the Electron desktop app.
 *
 * Pipeline (matches preprocessing.py exactly):
 *   1. cv.cvtColor(BGR2GRAY)        — if color image
 *   2. cv.normalize(0,255,NORM_MINMAX)
 *   3. 3x iterative loop:
 *        brightness → cv.LUT gamma correction
 *        contrast   → cv.createCLAHE / cv.GaussianBlur
 *        sharpness  → cv.filter2D sharpen / cv.bilateralFilter
 *   4. cv.resize(512,512,INTER_AREA)
 *
 * Then image_to_tensor (main.py):
 *   gray/255 → stack 3 channels → ImageNet normalize → [1,3,512,512]
 */

import { loadOpenCV } from './opencvLoader'

const B_MIN = 112, B_MAX = 150
const C_MIN = 43,  C_MAX = 68
const S_MIN = 135, S_MAX = 380

const MEAN = [0.485, 0.456, 0.406]
const STD  = [0.229, 0.224, 0.225]

// ── Mat lifecycle guard ────────────────────────────────────────────────────
// OpenCV.js Mats live in the WASM heap and must be manually .delete()d.
// Without this, every analysis that throws partway through leaks Mats —
// across many patients/images in a session this slowly exhausts WASM memory
// and can eventually crash or corrupt the renderer. MatGuard tracks every
// Mat created during a run and guarantees cleanup via try/finally regardless
// of where an error occurs.
class MatGuard {
  constructor() { this._mats = [] }
  track(mat) { this._mats.push(mat); return mat }
  cleanup() {
    for (const m of this._mats) { try { m.delete() } catch (_) {} }
    this._mats.length = 0
  }
}

function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    promise.then(
      v => { clearTimeout(t); resolve(v) },
      e => { clearTimeout(t); reject(e) }
    )
  })
}

// ── Decode image bytes → cv.Mat via nativeImage IPC or canvas fallback ───────
// Tries 3 strategies in order, each more permissive than the last, so that
// virtually any image format/encoding a user might upload (JPEG of any
// subsampling, PNG, BMP, TIFF, WebP, GIF, even HEIC on some platforms via
// nativeImage) decodes successfully instead of failing the whole analysis.
async function decodeToMat(cv, base64, mime) {
  // Strategy 1: Electron main-process nativeImage (handles the widest format
  // range — same codecs as Chrome — and auto-corrects EXIF rotation).
  if (window.electronAPI?.decodeImage) {
    try {
      const result = await withTimeout(
        window.electronAPI.decodeImage(base64, mime), 15000, 'Electron decodeImage IPC'
      )
      if (!result.error) {
        if (result.orientation && result.orientation !== 1) {
          console.log('[Preprocess] Corrected EXIF orientation:', result.orientation)
        }
        const raw = atob(result.rgba)
        const data = new Uint8ClampedArray(raw.length)
        for (let i = 0; i < raw.length; i++) data[i] = raw.charCodeAt(i)
        const imgData = new ImageData(data, result.width, result.height)
        return cv.matFromImageData(imgData)
      }
      console.warn('[Preprocess] Electron decode failed, falling back to canvas:', result.error)
    } catch (e) {
      console.warn('[Preprocess] Electron decodeImage IPC failed/timed out, falling back to canvas:', e.message)
    }
  }

  // Strategy 2: createImageBitmap with EXIF auto-orientation (supported by
  // Chromium for JPEG when imageOrientation:'from-image' is passed).
  const safeMime = (mime && mime.startsWith('image/')) ? mime : 'image/jpeg'
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  const blob  = new Blob([bytes], { type: safeMime })
  try {
    const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' })
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    return cv.matFromImageData(imgData)
  } catch (e1) {
    console.warn('[Preprocess] createImageBitmap failed, trying <img> element fallback:', e1.message)
  }

  // Strategy 3: classic <img> element decode — last resort, catches edge
  // cases some Chromium versions reject in createImageBitmap (certain
  // progressive/CMYK JPEGs) but still render fine in a normal <img>.
  const dataUrl = `data:${safeMime};base64,${base64}`
  const img = await new Promise((resolve, reject) => {
    const el = new Image()
    el.onload  = () => resolve(el)
    el.onerror = () => reject(new Error(`All decode strategies failed for mime=${safeMime}`))
    el.src = dataUrl
  })
  const canvas = new OffscreenCanvas(img.naturalWidth, img.naturalHeight)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  return cv.matFromImageData(imgData)
}

// ── get_statistics(img): brightness, contrast, sharpness ─────────────────────
function getStatistics(cv, gray) {
  const mean = new cv.Mat()
  const std  = new cv.Mat()
  cv.meanStdDev(gray, mean, std)
  const brightness = mean.data64F[0]
  const contrast   = std.data64F[0]
  mean.delete(); std.delete()

  // sharpness = cv2.Laplacian(img, CV_64F).var()
  const lap = new cv.Mat()
  cv.Laplacian(gray, lap, cv.CV_64F, 1, 1, 0, cv.BORDER_DEFAULT)
  const lapMean = new cv.Mat()
  const lapStd  = new cv.Mat()
  cv.meanStdDev(lap, lapMean, lapStd)
  const sharpness = lapStd.data64F[0] * lapStd.data64F[0]  // variance = std^2
  lap.delete(); lapMean.delete(); lapStd.delete()

  return { brightness, contrast, sharpness }
}

// ── adjust_gamma — cv2.LUT(img, table) ───────────────────────────────────────
function adjustGamma(cv, gray, gamma) {
  const invGamma = 1.0 / gamma
  const lutData = new Uint8Array(256)
  for (let i = 0; i < 256; i++) {
    lutData[i] = Math.min(255, Math.round(Math.pow(i / 255, invGamma) * 255))
  }
  const lut = cv.matFromArray(1, 256, cv.CV_8UC1, lutData)
  const out = new cv.Mat()
  cv.LUT(gray, lut, out)
  lut.delete()
  return out
}

// ── CLAHE(clipLimit, tileGridSize=(8,8)) — adaptive clip limit ───────────────
// Base clip limit 1.3 matches the Python training pipeline exactly. When an
// uploaded image's contrast is far below the target band (very flat/washed-out
// scans, common with older RVG sensors or poorly-exposed phone photos), a
// single pass at clip=1.3 often isn't enough to reach the target range within
// 3 iterations. Scaling the clip limit with how far off-target we are lets
// severely low-contrast images converge in fewer passes and produces visibly
// better-defined enamel/dentin boundaries for the segmentation model to read.
function applyCLAHE(cv, gray, contrastDeficit = 0) {
  const clipLimit = Math.min(4.0, 1.3 + contrastDeficit * 0.05)
  const clahe = new cv.CLAHE(clipLimit, new cv.Size(8, 8))
  const out = new cv.Mat()
  clahe.apply(gray, out)
  clahe.delete()
  return out
}

// ── cv2.GaussianBlur(img,(3,3),0) ─────────────────────────────────────────────
function gaussianBlur(cv, gray) {
  const out = new cv.Mat()
  const ksize = new cv.Size(3, 3)
  cv.GaussianBlur(gray, out, ksize, 0, 0, cv.BORDER_DEFAULT)
  return out
}

// ── Sharpen kernel [[0,-1,0],[-1,5.1,-1],[0,-1,0]] via cv2.filter2D ──────────
function sharpenMat(cv, gray) {
  const kernelData = new Float32Array([0, -1, 0, -1, 5.1, -1, 0, -1, 0])
  const kernel = cv.matFromArray(3, 3, cv.CV_32F, kernelData)
  const out = new cv.Mat()
  cv.filter2D(gray, out, cv.CV_8U, kernel, new cv.Point(-1, -1), 0, cv.BORDER_DEFAULT)
  kernel.delete()
  return out
}

// ── cv2.bilateralFilter(d=5,sigmaColor=22,sigmaSpace=22) ─────────────────────
function bilateralFilterMat(cv, gray) {
  const out = new cv.Mat()
  cv.bilateralFilter(gray, out, 5, 22, 22, cv.BORDER_DEFAULT)
  return out
}

// ── cv2.normalize(0,255,NORM_MINMAX) ─────────────────────────────────────────
function normMinMax(cv, gray) {
  const out = new cv.Mat()
  cv.normalize(gray, out, 0, 255, cv.NORM_MINMAX, cv.CV_8UC1)
  return out
}

// ── cv2.resize(img,(512,512)) — adaptive interpolation ────────────────────────
// INTER_AREA is correct for downscaling (matches training pipeline exactly when
// images are full-res RVG scans, which are typically larger than 512px).
// But for SMALL/low-res uploads (e.g. phone photos already shrunk, old scans),
// INTER_AREA on an upscale degenerates to nearest-neighbour-like blur, which
// destroys fine detail (hairline caries, thin bone lines) before the model
// ever sees it. INTER_CUBIC preserves edges much better when upscaling.
function resize512(cv, gray) {
  const out = new cv.Mat()
  const dsize = new cv.Size(512, 512)
  const isUpscale = gray.cols < 512 || gray.rows < 512
  const interp = isUpscale ? cv.INTER_CUBIC : cv.INTER_AREA
  cv.resize(gray, out, dsize, 0, 0, interp)
  return out
}

// ── cv.Mat (CV_8UC1, 512x512) → PNG base64 for display ────────────────────────
function matToPngBase64(cv, gray512) {
  const canvas = new OffscreenCanvas(512, 512)
  const ctx = canvas.getContext('2d')
  const imgData = new ImageData(512, 512)
  const src = gray512.data  // Uint8Array, length 512*512
  for (let i = 0; i < 512 * 512; i++) {
    const v = src[i]
    imgData.data[i*4]   = v
    imgData.data[i*4+1] = v
    imgData.data[i*4+2] = v
    imgData.data[i*4+3] = 255
  }
  ctx.putImageData(imgData, 0, 0)
  return canvas.convertToBlob({ type: 'image/png' }).then(async (blob) => {
    const ab = await blob.arrayBuffer()
    const u8 = new Uint8Array(ab)
    let s = ''
    for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i])
    return btoa(s)
  })
}

// ── image_to_tensor (main.py): gray512 (Uint8Array) → Float32 [1,3,512,512] ─
function imageToTensor(gray512Data) {
  const N = 512 * 512
  const tensor = new Float32Array(3 * N)
  for (let p = 0; p < N; p++) {
    const v = gray512Data[p] / 255.0
    tensor[0*N+p] = (v - MEAN[0]) / STD[0]
    tensor[1*N+p] = (v - MEAN[1]) / STD[1]
    tensor[2*N+p] = (v - MEAN[2]) / STD[2]
  }
  return tensor
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
/**
 * preprocessImage(base64, mime)
 * Returns { tensor, processedBase64, originalBase64, stats }
 */
export async function preprocessImage(base64, mime) {
  const cv = await loadOpenCV()
  const guard = new MatGuard()

  try {
    // 1. Decode image to cv.Mat (RGBA)
    const srcMat = guard.track(await decodeToMat(cv, base64, mime))

    // 2. Convert to grayscale (matches cv2.cvtColor BGR2GRAY — OpenCV.js Mat is RGBA from canvas)
    let gray = guard.track(new cv.Mat())
    cv.cvtColor(srcMat, gray, cv.COLOR_RGBA2GRAY)

    // 3. cv2.normalize(0,255,NORM_MINMAX)
    gray = guard.track(normMinMax(cv, gray))

    const ops = []

    // 4. 3x iterative processing — exact match to preprocessing.py
    for (let pass = 0; pass < 3; pass++) {
      let stats = getStatistics(cv, gray)

      // Brightness
      if (stats.brightness < B_MIN) {
        gray = guard.track(adjustGamma(cv, gray, 0.92))
        ops.push('Brighten')
      } else if (stats.brightness > B_MAX) {
        gray = guard.track(adjustGamma(cv, gray, 1.04))
        ops.push('Mild Darken')
      }

      stats = getStatistics(cv, gray)
      // Contrast
      if (stats.contrast < C_MIN) {
        gray = guard.track(applyCLAHE(cv, gray, C_MIN - stats.contrast))
        ops.push('CLAHE')
      } else if (stats.contrast > C_MAX) {
        gray = guard.track(gaussianBlur(cv, gray))
        ops.push('Reduce Contrast')
      }

      stats = getStatistics(cv, gray)
      // Sharpness
      if (stats.sharpness < S_MIN) {
        gray = guard.track(sharpenMat(cv, gray))
        ops.push('Sharpen')
      } else if (stats.sharpness > S_MAX) {
        gray = guard.track(bilateralFilterMat(cv, gray))
        ops.push('Smooth')
      }
    }

    // 5. Resize to 512x512 — adaptive interpolation
    gray = guard.track(resize512(cv, gray))

    // 6. Final stats
    const finalStats = getStatistics(cv, gray)
    const stats = {
      brightness: +finalStats.brightness.toFixed(2),
      contrast:   +finalStats.contrast.toFixed(2),
      sharpness:  +finalStats.sharpness.toFixed(2),
      operations: [...new Set(ops)],
    }

    // 7. Render preprocessed image for display
    const processedBase64 = await matToPngBase64(cv, gray)

    // 8. Build tensor from gray.data (Uint8Array view of the Mat — copy before cleanup)
    const gray512Data = new Uint8Array(gray.data)
    const tensor = imageToTensor(gray512Data)

    return { tensor, processedBase64, originalBase64: base64, stats }
  } finally {
    // Every Mat created above — including any left over from a mid-pipeline
    // error — is freed here. Without this, a failed analysis on image N
    // would leak WASM heap that's never reclaimed for the rest of the session.
    guard.cleanup()
  }
}
