const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  openImage:   (multiple)      => ipcRenderer.invoke('dialog:openImage', multiple || false),
  savePDF:     (name, b64)     => ipcRenderer.invoke('dialog:savePDF', name, b64),
  decodeImage: (b64, mime)    => ipcRenderer.invoke('image:decodeToRGBA', b64, mime),
  getVersion:  ()              => ipcRenderer.invoke('app:version'),
  loadOnnxModel: ()            => ipcRenderer.invoke('model:loadOnnx'),
  onMenuAction: (cb) => {
    ipcRenderer.on('menu:new-analysis', () => cb('new-analysis'))
    ipcRenderer.on('menu:add-patient',  () => cb('add-patient')  )
  },
  removeMenuListeners: () => {
    ipcRenderer.removeAllListeners('menu:new-analysis')
    ipcRenderer.removeAllListeners('menu:add-patient')
  },
})
