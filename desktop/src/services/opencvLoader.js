/**
 * opencvLoader.js
 * Loads OpenCV.js (WASM) once and exposes the global `cv` object.
 *
 * opencv.js ships as a UMD bundle:
 *   (function(root, factory) {
 *     if (define.amd) ...
 *     else if (typeof module === 'object' && module.exports) module.exports = factory()
 *     else if (typeof window === 'object') root.cv = factory()
 *   })(this, function() { ... })
 *
 * PROBLEM: in some Electron/Vite renderer contexts a stub `module` object
 * can be present even with nodeIntegration:false (Vite's dev client, or
 * Electron's preload bridge), so the UMD wrapper takes the CommonJS branch
 * and calls module.exports instead of setting window.cv — leaving
 * window.cv permanently undefined with no error thrown.
 *
 * FIX: fetch the script as raw text and execute it with `new Function(...)`,
 * a clean scope with NO `module`/`define`/`exports` in its closure chain.
 * This guarantees the UMD wrapper always takes the `window` branch,
 * regardless of what globals exist in the page.
 */

let _cvPromise = null

function scriptSrc() {
  if (typeof window !== 'undefined' && window.__ONNX_PATH__) {
    const base = window.__ONNX_PATH__
    if (base.startsWith('http')) return `${base}/opencv/opencv.js`
    if (base.startsWith('file')) return `${base}/public/opencv/opencv.js`
  }
  return '/opencv/opencv.js'
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

function pollForReady(timeoutMs, resolve, reject) {
  let waited = 0
  const step = 100
  const iv = setInterval(() => {
    waited += step
    if (window.cv && window.cv.Mat) {
      clearInterval(iv)
      console.log('[OpenCV] Ready (poll detected)')
      resolve(window.cv)
    } else if (waited >= timeoutMs) {
      clearInterval(iv)
      reject(new Error('OpenCV.js did not become ready (polling timed out)'))
    }
  }, step)
}

export function loadOpenCV() {
  if (_cvPromise) return _cvPromise

  const inner = (async () => {
    // Already loaded and ready?
    if (window.cv && window.cv.Mat) return window.cv

    const src = scriptSrc()
    console.log('[OpenCV] Fetching from:', src)

    // Fetch raw source — works for both http:// (dev) and file:// (packaged) URLs
    const res = await fetch(src)
    if (!res.ok) throw new Error(`Failed to fetch opencv.js: HTTP ${res.status} from ${src}`)
    const code = await res.text()
    console.log(`[OpenCV] Fetched ${(code.length/1e6).toFixed(1)}MB, executing in clean scope…`)

    // Execute with module/define/exports explicitly shadowed as parameters.
    // This is critical: `new Function` bodies run in global scope, so if
    // `module`/`define` exist as ambient globals on window (which they can,
    // injected by Vite's dev client or Electron's preload context even with
    // nodeIntegration:false), the UMD wrapper's `typeof module === 'object'`
    // check would still see them and take the wrong (CommonJS) branch.
    // Declaring them as named parameters shadows any ambient global of the
    // same name, forcing `typeof module === 'undefined'` inside this scope
    // and guaranteeing the UMD wrapper takes the `window` branch.
    // eslint-disable-next-line no-new-func
    const runner = new Function(
      'window', 'self', 'globalThis', 'module', 'define', 'exports', 'require',
      code + '\n//# sourceURL=opencv.js'
    )
    runner(window, window, window, undefined, undefined, undefined, undefined)

    // IMPORTANT: in this build, the UMD factory's return value
    // (window.cv right after execution) is a PROMISE, not the module itself.
    // The factory's internal `cv` is an Emscripten async module function:
    //   var cv = (() => { return async function(moduleArg={}) {...} })()
    //   ...
    //   return cv(Module)   // <- this call returns a Promise<ModuleObject>
    // So `root.cv = factory()` assigns that Promise to window.cv.
    // We must detect this and await it to get the real, ready module.
    let assigned = window.cv

    if (!assigned) {
      throw new Error('OpenCV.js executed but window.cv was never assigned')
    }

    if (typeof assigned.then === 'function') {
      console.log('[OpenCV] window.cv is a Promise — awaiting WASM module resolution…')
      const resolvedModule = await assigned
      // Some builds resolve to the module directly; overwrite window.cv with
      // the resolved, ready object so future calls and other code see the
      // real thing instead of the spent Promise.
      window.cv = resolvedModule
      if (resolvedModule && resolvedModule.Mat) {
        console.log('[OpenCV] Ready (Promise resolved to module)')
        return resolvedModule
      }
      throw new Error('OpenCV.js Promise resolved but result has no .Mat — unexpected module shape')
    }

    // Not a Promise — could be the module directly (sync init) or still
    // initializing via the classic Emscripten onRuntimeInitialized pattern.
    if (assigned.Mat) {
      console.log('[OpenCV] Ready (sync init immediately after exec)')
      return assigned
    }

    // Classic pattern: cv exists, has no .Mat yet, fires onRuntimeInitialized later
    return new Promise((resolve, reject) => {
      assigned['onRuntimeInitialized'] = () => {
        console.log('[OpenCV] Ready (onRuntimeInitialized callback)')
        resolve(window.cv)
      }
      pollForReady(30000, resolve, reject)
    })
  })()

  _cvPromise = withTimeout(inner, 60000, 'OpenCV.js load').catch(err => {
    _cvPromise = null  // allow retry on next call
    console.error('[OpenCV] Load failed:', err.message)
    throw err
  })

  return _cvPromise
}

/** Reset the cached promise — useful for retrying after a load failure */
export function resetOpenCVLoader() {
  _cvPromise = null
}
