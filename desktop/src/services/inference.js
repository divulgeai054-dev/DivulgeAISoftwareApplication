/**
 * inference.js — ORT 1.27 production session management
 *
 * Path resolution:
 *   Dev:  window.__ONNX_PATH__ = 'http://localhost:5174'
 *         model = http://localhost:5174/dental_unet_resnet50_merged.onnx
 *         wasm  = http://localhost:5174/ort/
 *
 *   Prod: window.__ONNX_PATH__ = 'file:///path/app.asar.unpacked'
 *         model = file:///path/app.asar.unpacked/public/dental_unet_resnet50_merged.onnx
 *         wasm  = file:///path/app.asar.unpacked/public/ort/
 */

export const CLASS_NAMES = [
  'Background', 'Bone Level', 'Decayed Teeth',
  'Healthy Teeth', 'Implant', 'Restoration',
]

let _session = null
let _promise = null

function getBase() {
  // Injected by main.js after did-finish-load
  return (typeof window !== 'undefined' && window.__ONNX_PATH__) || ''
}

function modelURL() {
  const base = getBase()
  // Dev: Vite serves /public → model at root
  // Prod: file:// path includes /public
  if (base.startsWith('http')) return `${base}/dental_unet_resnet50_merged.onnx`
  if (base.startsWith('file')) return `${base}/public/dental_unet_resnet50_merged.onnx`
  return '/dental_unet_resnet50_merged.onnx'  // fallback
}

function wasmRoot() {
  const base = getBase()
  if (base.startsWith('http')) return `${base}/ort/`
  if (base.startsWith('file')) return `${base}/public/ort/`
  return '/ort/'
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

export async function loadSession() {
  if (_session) return _session
  if (_promise)  return _promise

  const inner = (async () => {
    const ort = await import('onnxruntime-web')

    ort.env.wasm.wasmPaths = wasmRoot()
    ort.env.wasm.numThreads = 1   // most stable in Electron
    ort.env.wasm.simd       = true

    const mUrl = modelURL()
    console.log('[ONNX] Model URL:', mUrl)
    console.log('[ONNX] WASM root:', wasmRoot())

    const session = await ort.InferenceSession.create(mUrl, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    })

    console.log('[ONNX] Session ready | in:', session.inputNames, '| out:', session.outputNames)
    _session = session
    return session
  })()

  // Hard ceiling — 130MB model load should never take this long, but if the
  // dev-server stream stalls, fail loudly instead of hanging the UI forever.
  _promise = withTimeout(inner, 60000, 'ONNX model load').catch(err => {
    _promise = null  // allow retry on next call
    throw err
  })
  _promise.then(() => { _promise = null })

  return _promise
}

export async function runInferenceRaw(float32_1x3x512x512) {
  const session = await loadSession()
  const ort     = await import('onnxruntime-web')
  const tensor  = new ort.Tensor('float32', float32_1x3x512x512, [1, 3, 512, 512])
  const output  = await session.run({ [session.inputNames[0]]: tensor })
  return output[session.outputNames[0]].data  // Float32Array [1,6,512,512]
}

/**
 * softmaxArgmax — matches Python:
 *   torch.argmax(torch.softmax(logits, dim=1), dim=1)
 */
export function softmaxArgmax(logits) {
  const N = 512*512, C = 6
  const mask = new Uint8Array(N)
  for (let p = 0; p < N; p++) {
    // Numerically stable softmax argmax
    let mx = logits[p]
    for (let c=1;c<C;c++) { const v=logits[c*N+p]; if(v>mx) mx=v }
    let best=0, bestE=Math.exp(logits[p]-mx)
    for (let c=1;c<C;c++) {
      const e=Math.exp(logits[c*N+p]-mx)
      if(e>bestE) { bestE=e; best=c }
    }
    mask[p]=best
  }
  return mask
}

export async function warmup() {
  try { await loadSession() }
  catch(e) { console.warn('[ONNX] Warmup failed:', e.message) }
}
