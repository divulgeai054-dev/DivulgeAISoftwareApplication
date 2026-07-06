import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Custom plugin: serve the entire /ort/ directory (ONNX Runtime Web's WASM +
// dynamically-imported .mjs loader files) and other large binaries directly
// from disk via fs.createReadStream, completely bypassing Vite's module
// transform pipeline. ONNX Runtime Web dynamically import()s files like
// ort-wasm-simd-threaded.jsep.mjs at runtime based on wasmPaths — Vite's dev
// server intercepts that and tries to treat it as a source module, which
// throws "should not be imported from source code" since it lives in public/.
function largeFileStreamPlugin() {
  return {
    name: 'large-file-stream',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next()
        const url = req.url.split('?')[0]

        const isOrtFile = url.startsWith('/ort/')
        const isOther    = url.endsWith('.onnx') || url === '/opencv/opencv.js'
        if (!isOrtFile && !isOther) return next()

        const filePath = path.join(server.config.publicDir, decodeURIComponent(url))
        if (!fs.existsSync(filePath)) return next()

        const stat = fs.statSync(filePath)
        const ext  = path.extname(filePath)
        const mimeMap = {
          '.onnx': 'application/octet-stream',
          '.wasm': 'application/wasm',
          '.mjs':  'application/javascript',
          '.js':   'application/javascript',
        }

        res.writeHead(200, {
          'Content-Type':   mimeMap[ext] || 'application/octet-stream',
          'Content-Length': stat.size,
          'Cache-Control':  'no-cache',
        })

        const stream = fs.createReadStream(filePath)
        stream.on('error', (err) => {
          console.error('[large-file-stream] Error streaming', filePath, err.message)
          if (!res.headersSent) res.writeHead(500)
          res.end()
        })
        stream.pipe(res)
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), largeFileStreamPlugin()],
  base: './',

  build: {
    outDir:     'dist',
    emptyOutDir: true,
    target:     'es2020',
    rollupOptions: {
      external: [],
    },
  },

  esbuild: { target: 'es2020' },

  server: {
    port: 5174,
    strictPort: true,
    fs: {
      strict: false,
      allow: ['..'],
    },
    hmr: {
      overlay: false,
    },
  },

  assetsInclude: ['**/*.wasm', '**/*.onnx'],

  optimizeDeps: {
    exclude: ['onnxruntime-web'],
    esbuildOptions: { target: 'es2020' },
  },
})
