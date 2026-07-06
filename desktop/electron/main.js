const { app, BrowserWindow, ipcMain, dialog, shell, Menu, nativeImage } = require('electron')
const path = require('path')
const fs   = require('fs')

const isDev = !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width:     1280,
    height:    820,
    minWidth:  1024,
    minHeight: 680,
    backgroundColor: '#0c1a2e',
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      webSecurity:      false,   // Required: allows loading local ONNX+WASM files
    },
  })

  // ── Inject resource path for ONNX model + WASM ──────────────────────────
  // In dev: served by Vite from /public → use http://localhost:5174
  // In prod (packaged): files are in app.asar.unpacked/public
  const resourcesForRenderer = isDev
    ? 'http://localhost:5174'                                              // Vite serves /public
    : 'file://' + path.join(process.resourcesPath, 'app.asar.unpacked')  // Packaged

  win.webContents.on('did-finish-load', () => {
    win.webContents.executeJavaScript(`
      window.__ONNX_PATH__ = ${JSON.stringify(resourcesForRenderer)};
      window.__IS_DEV__    = ${isDev};
      console.log('[Electron] __ONNX_PATH__ =', window.__ONNX_PATH__);
    `).catch(err => console.error('executeJavaScript error:', err))
  })

  if (isDev) {
    win.loadURL('http://localhost:5174')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // ── Application Menu ─────────────────────────────────────────────────────
  const isMac = process.platform === 'darwin'
  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [{ role:'about' },{ type:'separator' },{ role:'services' },{ type:'separator' },
                { role:'hide' },{ role:'hideOthers' },{ role:'unhide' },{ type:'separator' },{ role:'quit' }],
    }] : []),
    {
      label: 'File',
      submenu: [
        { label:'New Analysis', accelerator:'CmdOrCtrl+N', click:()=> win.webContents.send('menu:new-analysis') },
        { label:'Add Patient',  accelerator:'CmdOrCtrl+P', click:()=> win.webContents.send('menu:add-patient') },
        { type:'separator' },
        isMac ? { role:'close' } : { role:'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [{ role:'undo' },{ role:'redo' },{ type:'separator' },
                { role:'cut' },{ role:'copy' },{ role:'paste' },{ role:'selectAll' }],
    },
    {
      label: 'View',
      submenu: [
        { role:'reload' },{ role:'forceReload' },{ type:'separator' },
        { role:'resetZoom' },{ role:'zoomIn' },{ role:'zoomOut' },
        { type:'separator' },{ role:'togglefullscreen' },
        ...(isDev ? [{ type:'separator' },{ role:'toggleDevTools' }] : []),
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label:'DivulgeAI Website', click:()=> shell.openExternal('https://divulgeai.com') },
        { label:`Version ${app.getVersion()}`, enabled:false },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length===0) createWindow() })
})
app.on('window-all-closed', () => { if (process.platform!=='darwin') app.quit() })

// ── IPC Handlers ─────────────────────────────────────────────────────────────

// Open image — reads file to base64 in main process (avoids Electron renderer mime issues)
ipcMain.handle('dialog:openImage', async (_e, multiple) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title:      'Select RVG / X-ray Image',
    filters:    [
      { name:'Medical Images', extensions:['png','jpg','jpeg','bmp','tiff','tif','webp'] },
      { name:'All Files',      extensions:['*'] },
    ],
    properties: ['openFile', ...(multiple ? ['multiSelections'] : [])],
  })
  if (canceled || !filePaths.length) return []

  const mimes = {
    jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png',
    bmp:'image/bmp',  tiff:'image/tiff', tif:'image/tiff',
    webp:'image/webp', gif:'image/gif',
  }
  return filePaths.map(fp => {
    const buf  = fs.readFileSync(fp)
    const ext  = path.extname(fp).toLowerCase().replace('.','')
    const mime = mimes[ext] || 'image/jpeg'
    return { path:fp, name:path.basename(fp), size:buf.length, base64:buf.toString('base64'), mime }
  })
})

// Save PDF
ipcMain.handle('dialog:savePDF', async (_e, defaultName, pdfBase64) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title:       'Save Dental Report',
    defaultPath: defaultName || 'DivulgeAI_Report.pdf',
    filters:     [{ name:'PDF Files', extensions:['pdf'] }],
  })
  if (canceled || !filePath) return null
  if (pdfBase64) {
    fs.writeFileSync(filePath, Buffer.from(pdfBase64, 'base64'))
  } else {
    fs.writeFileSync(filePath, `DivulgeAI Report\nDate: ${new Date().toLocaleString()}\n`, 'utf8')
  }
  return filePath
})

ipcMain.handle('app:version', () => app.getVersion())

// Decode image to raw RGBA pixels using nativeImage (supports ALL formats Chromium supports)
// Auto-rotates by EXIF orientation tag — critical for phone-camera photos of
// printed/film radiographs, which are very commonly saved sideways or upside down.
// A rotated X-ray fed into the segmentation model produces wrong/garbage findings,
// so this correction has a direct, large impact on accuracy.
ipcMain.handle('image:decodeToRGBA', async (_e, base64, mime) => {
  try {
    const buf    = Buffer.from(base64, 'base64')
    let native   = nativeImage.createFromBuffer(buf)
    if (native.isEmpty()) return { error: 'nativeImage returned empty — unsupported format' }

    // nativeImage doesn't read EXIF orientation natively for JPEG, so we
    // parse the EXIF Orientation tag (bytes) ourselves and rotate accordingly.
    const orientation = readJpegExifOrientation(buf)
    if (orientation && orientation !== 1) {
      native = applyExifOrientation(native, orientation)
    }

    const size = native.getSize()
    const bgra = native.getBitmap()
    const rgba = Buffer.alloc(bgra.length)
    for (let i = 0; i < bgra.length; i += 4) {
      rgba[i]   = bgra[i+2]
      rgba[i+1] = bgra[i+1]
      rgba[i+2] = bgra[i]
      rgba[i+3] = bgra[i+3]
    }
    return { rgba: rgba.toString('base64'), width: size.width, height: size.height, orientation: orientation || 1 }
  } catch (err) {
    return { error: err.message }
  }
})

// Minimal EXIF Orientation tag reader for JPEG (APP1 segment, tag 0x0112)
function readJpegExifOrientation(buf) {
  try {
    if (buf.length < 4 || buf[0] !== 0xFF || buf[1] !== 0xD8) return null  // not JPEG
    let offset = 2
    while (offset < buf.length - 1) {
      if (buf[offset] !== 0xFF) break
      const marker = buf[offset + 1]
      if (marker === 0xE1) {  // APP1 (EXIF)
        const segLen = buf.readUInt16BE(offset + 2)
        const segStart = offset + 4
        if (buf.toString('ascii', segStart, segStart + 4) !== 'Exif') { offset += 2 + segLen; continue }
        const tiffStart = segStart + 6
        const little = buf.toString('ascii', tiffStart, tiffStart + 2) === 'II'
        const readU16 = (p) => little ? buf.readUInt16LE(p) : buf.readUInt16BE(p)
        const readU32 = (p) => little ? buf.readUInt32LE(p) : buf.readUInt32BE(p)
        const ifd0Offset = tiffStart + readU32(tiffStart + 4)
        const numEntries = readU16(ifd0Offset)
        for (let i = 0; i < numEntries; i++) {
          const entryOffset = ifd0Offset + 2 + i * 12
          const tag = readU16(entryOffset)
          if (tag === 0x0112) return readU16(entryOffset + 8)  // Orientation value
        }
        return null
      }
      if (marker === 0xD8 || marker === 0xD9) { offset += 2; continue }
      const segLen = buf.readUInt16BE(offset + 2)
      offset += 2 + segLen
    }
    return null
  } catch (_) {
    return null  // malformed EXIF — proceed without rotation rather than failing the whole decode
  }
}

// Apply EXIF orientation (1-8) to a nativeImage by transforming the raw bitmap.
// Covers the cases that actually occur from phones/scanners: 3 (180°),
// 6 (90° CW), 8 (90° CCW). Mirror cases (2,4,5,7) are rare for camera photos
// of radiographs and are left as-is rather than risking a bad transform.
function applyExifOrientation(native, orientation) {
  if (orientation === 3) return rotateNativeImage(native, 180)
  if (orientation === 6) return rotateNativeImage(native, 90)
  if (orientation === 8) return rotateNativeImage(native, 270)
  return native
}

// Rotate a nativeImage's raw BGRA bitmap by 90/180/270 degrees.
function rotateNativeImage(native, degrees) {
  const { width, height } = native.getSize()
  const srcBGRA = native.getBitmap()
  const rotated90or270 = (degrees === 90 || degrees === 270)
  const dstW = rotated90or270 ? height : width
  const dstH = rotated90or270 ? width  : height
  const dst  = Buffer.alloc(srcBGRA.length)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4
      let dx, dy
      if (degrees === 90)       { dx = height - 1 - y; dy = x }
      else if (degrees === 270) { dx = y; dy = width - 1 - x }
      else /* 180 */            { dx = width - 1 - x; dy = height - 1 - y }
      const dstIdx = (dy * dstW + dx) * 4
      srcBGRA.copy(dst, dstIdx, srcIdx, srcIdx + 4)
    }
  }
  return nativeImage.createFromBitmap(dst, { width: dstW, height: dstH })
}
