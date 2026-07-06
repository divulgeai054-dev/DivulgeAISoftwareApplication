/**
 * aiService.js — Production coordinator
 *
 * Full pipeline — pixel-for-pixel matches Python:
 *   1. preprocessImage()     → tensor + processedBase64
 *   2. runInferenceRaw()     → logits Float32Array [1,6,512,512]
 *   3. softmaxArgmax()       → Uint8Array mask [512*512]
 *   4. drawOverlay()         → annotated PNG base64
 *   5. extractFindings()     → findings[]
 */

import { preprocessImage }                          from './preprocess'
import { loadSession, runInferenceRaw, softmaxArgmax, warmup } from './inference'
import { extractFindings, drawOverlay }              from './postprocess'
import { loadOpenCV }                                from './opencvLoader'

export { savePDFFromBase64, createPdfFromReport } from './pdfService'

// Warm up ONNX model + OpenCV.js as soon as this module loads (non-blocking)
warmup()
loadOpenCV().catch(e => console.warn('[OpenCV] Preload failed:', e.message))

function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    promise.then(
      v => { clearTimeout(t); resolve(v) },
      e => { clearTimeout(t); reject(e) }
    )
  })
}

export async function runInference({ base64, mime, onProgress, patientInfo = {} }) {
  try {
    return await withTimeout(
      runInferenceInner({ base64, mime, onProgress, patientInfo }),
      90000,
      'AI analysis pipeline'
    )
  } catch (err) {
    console.error('[AI] Pipeline error:', err.message)
    console.error(err.stack)
    return fallback({ base64, mime, onProgress, errMsg: err.message })
  }
}

async function runInferenceInner({ base64, mime, onProgress, patientInfo = {} }) {
  // ── Step 1: Preprocess ──────────────────────────────────────────────
  onProgress(5, 'Preprocessing image…')
  const { tensor, processedBase64, stats } = await preprocessImage(base64, mime)
  console.log('[AI] Preprocessing done. Stats:', stats)

  // ── Step 2: Load + warm session ─────────────────────────────────────
  onProgress(15, 'Loading AI model…')
  await loadSession()

  // ── Step 3: Run ONNX ────────────────────────────────────────────────
  onProgress(35, 'Running neural network…')
  const logits = await runInferenceRaw(tensor)
  console.log('[AI] Inference done. Logit range:', logits[0].toFixed(3), '…', logits[logits.length-1].toFixed(3))

  // ── Step 4: Softmax + argmax ─────────────────────────────────────────
  onProgress(72, 'Decoding segmentation mask…')
  const mask = softmaxArgmax(logits)

  // Debug class distribution
  const dist = new Array(6).fill(0)
  for (let i = 0; i < mask.length; i++) dist[mask[i]]++
  const NAMES = ['BG','BoneLevel','Decayed','Healthy','Implant','Restoration']
  console.log('[AI] Mask dist:', dist.map((n,c)=>`${NAMES[c]}:${n}`).join(' | '))

  // ── Step 5: Draw overlay ─────────────────────────────────────────────
  onProgress(82, 'Rendering segmentation overlay…')
  const annotatedImageBase64 = await drawOverlay(processedBase64, mask)

  // ── Step 6: Extract findings ─────────────────────────────────────────
  onProgress(93, 'Extracting findings…')
  const findings = await extractFindings(mask)
  console.log('[AI] Findings:', findings.length, findings.map(f=>`FDI${f.fdiNumber}:${f.className}`).join(', '))

  const regionCounts = { total: findings.length }
  findings.forEach(f => { regionCounts[f.className] = (regionCounts[f.className]||0)+1 })

  onProgress(100, 'Analysis complete')
  return {
    findings,
    confidence:              findings.length ? findings[0].confidence : 0,
    processingTime:          0,
    statistics:              stats,
    regionCounts,
    originalImageBase64:     base64,
    preprocessedImageBase64: processedBase64,
    annotatedImageBase64,
    annotatedMime:           'image/png',
    pdfBase64:               null,
    pdfFilename:             'DivulgeAI_Report.pdf',
    reportId:                null,
    modelOffline:            false,
  }
}

// ── Fallback: show original image with error overlay ──────────────────────────
async function fallback({ base64, mime, onProgress, errMsg }) {
  for (const [p,m] of [[50,'Generating fallback view…'],[100,'Done (model error)']]) {
    await new Promise(r => setTimeout(r, 200))
    onProgress(p, m)
  }

  // Draw original image with error message overlaid
  const annotated = await drawErrOverlay(base64, mime, errMsg)

  return {
    findings: [],
    confidence: 0, processingTime: 0,
    statistics: { operations:['Error'] },
    regionCounts: { total:0 },
    originalImageBase64:     base64,
    preprocessedImageBase64: null,
    annotatedImageBase64:    annotated,
    annotatedMime:           'image/png',
    pdfBase64: null, pdfFilename:'DivulgeAI_Report.pdf', reportId:null,
    modelOffline: true,
    error: errMsg,
  }
}

async function drawErrOverlay(base64, mime, msg) {
  const canvas = new OffscreenCanvas(512, 512)
  const ctx    = canvas.getContext('2d')
  try {
    const safeMime = (mime&&mime.startsWith('image/')) ? mime : 'image/jpeg'
    const bytes  = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    const blob   = new Blob([bytes], { type: safeMime })
    const bitmap = await createImageBitmap(blob)
    ctx.drawImage(bitmap, 0, 0, 512, 512)
    bitmap.close()
  } catch (_) { ctx.fillStyle='#1a1a2e'; ctx.fillRect(0,0,512,512) }

  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.fillRect(0, 210, 512, 100)
  ctx.font = 'bold 14px Arial'
  ctx.fillStyle = '#ff6b6b'
  ctx.textAlign = 'center'
  ctx.fillText('⚠ Model Error — Check Console', 256, 250)
  ctx.font = '11px Arial'
  ctx.fillStyle = '#ffcdd2'
  const truncated = (msg||'Unknown error').slice(0, 60)
  ctx.fillText(truncated, 256, 272)
  ctx.textAlign = 'left'
  const blob2 = await canvas.convertToBlob({ type:'image/png' })
  const ab = await blob2.arrayBuffer()
  const u8 = new Uint8Array(ab)
  let s=''; for(let i=0;i<u8.length;i++) s+=String.fromCharCode(u8[i])
  return btoa(s)
}
