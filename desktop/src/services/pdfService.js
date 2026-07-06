/**
 * pdfService.js
 * Generates PDF matching the Dental_Radiograph_Report_Template.docx
 *
 * Sections:
 *   Title
 *   1. Patient Details
 *   2. Radiographic Examination Details
 *   3. Radiographic Images (Original · Preprocessed · AI Segmented)
 *   4. AI Analysis Summary (table)
 *   5. Patient Information (a. What did AI find? b. Why does it matter?)
 *   6. Disclaimer
 */
import { PDFDocument, StandardFonts, rgb, PDFName } from 'pdf-lib'

const NAVY  = rgb(0.067, 0.20, 0.38)
const TEAL  = rgb(0.051, 0.58, 0.533)
const WHITE = rgb(1, 1, 1)
const LIGHT = rgb(0.957, 0.961, 0.973)
const GRAY  = rgb(0.4, 0.4, 0.4)
const BLACK = rgb(0.1, 0.1, 0.1)

function safe(v) {
  if (v == null) return '—'
  return String(v).replace(/[^\x20-\x7E]/g, ' ')
}

async function embedImage(pdfDoc, b64) {
  if (!b64) return null
  try {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
    // Try PNG first, then JPEG
    try { return await pdfDoc.embedPng(bytes) }
    catch (_) { return await pdfDoc.embedJpg(bytes) }
  } catch (_) { return null }
}

function bytesToB64(bytes) {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s)
}

export async function createPdfFromReport(report) {
  const pdfDoc  = await PDFDocument.create()
  const font    = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const W = 595.28, H = 841.89  // A4
  const ML = 42, MR = 42, CW = W - ML - MR

  let page = pdfDoc.addPage([W, H])
  let y    = H - 40

  const addPage = () => {
    page = pdfDoc.addPage([W, H])
    y = H - 40
  }

  const checkY = (needed) => { if (y - needed < 50) addPage() }

  // ── Title ──────────────────────────────────────────────────────────────
  page.drawRectangle({ x:0, y:y-28, width:W, height:36, color:NAVY })
  page.drawText('AI-Assisted Comprehensive Dental Radiographic Interpretation Report', {
    x: ML, y: y-20, size: 11, font: bold, color: WHITE,
    maxWidth: CW
  })
  y -= 44

  // Doctor / Hospital strip
  page.drawRectangle({ x:0, y:y-22, width:W, height:28, color:TEAL })
  const docLine = [
    report.docName && `Dr. ${safe(report.docName)}`,
    report.docSpec  && safe(report.docSpec),
    report.hospital && safe(report.hospital),
  ].filter(Boolean).join('  |  ')
  page.drawText(docLine, { x:ML, y:y-15, size:8.5, font, color:WHITE })
  y -= 34

  // ── Section 1: Patient Details ─────────────────────────────────────────
  const sectionHeader = (title) => {
    checkY(24)
    page.drawRectangle({ x:ML, y:y-16, width:CW, height:20, color:NAVY })
    page.drawText(title, { x:ML+6, y:y-11, size:9, font:bold, color:WHITE })
    y -= 24
  }

  const fieldRow = (label, value, x2offset = CW/2) => {
    checkY(16)
    page.drawText(safe(label) + ':', { x:ML+4, y:y, size:8.5, font:bold, color:NAVY })
    page.drawText(safe(value),       { x:ML+4+x2offset, y:y, size:8.5, font, color:BLACK })
    y -= 14
  }

  const twoColRow = (l1, v1, l2, v2) => {
    checkY(16)
    page.drawText(safe(l1)+':',  { x:ML+4,          y:y, size:8.5, font:bold, color:NAVY })
    page.drawText(safe(v1),      { x:ML+4+CW*0.25,  y:y, size:8.5, font, color:BLACK })
    page.drawText(safe(l2)+':',  { x:ML+4+CW*0.5,   y:y, size:8.5, font:bold, color:NAVY })
    page.drawText(safe(v2),      { x:ML+4+CW*0.75,  y:y, size:8.5, font, color:BLACK })
    y -= 14
  }

  sectionHeader('1. Patient Details')
  twoColRow('Patient Name',     report.patientName, 'Patient ID', report.patientId)
  twoColRow('Age / Gender',     `${report.patientAge||'—'} / ${report.patientGender||'—'}`,
            'Date of Birth',    report.dob || '—')
  twoColRow('Examination Date', report.date || new Date().toLocaleDateString('en-IN'),
            'Report ID',        report.id || '—')
  y -= 6

  // ── Section 2: Radiographic Examination Details ────────────────────────
  sectionHeader('2. Radiographic Examination Details')
  twoColRow('Imaging Modality', 'Intraoral Radiograph (RVG)', 'Radiograph Type', 'IOPA')
  fieldRow('Region Examined',   report.complaint || '—',  CW * 0.4)
  fieldRow('Technical Limitations', (() => {
    const s = report.severity
    if (!s || s === 'None') return '☑ No significant technical limitations detected'
    if (s === 'Low')        return '☐ Mild limitation (most findings remain interpretable)'
    if (s === 'Moderate')   return '☐ Moderate limitation (some regions difficult to assess)'
    return '☐ Severe limitation (repeat imaging recommended)'
  })(), CW * 0.4)
  twoColRow('AI Model Version', report.modelUsed || 'DivulgeAI UNet+ResNet50 v3.1',
            'Analysis Date',   report.date || new Date().toLocaleString('en-IN'))
  y -= 6

  // ── Section 3: Radiographic Images ────────────────────────────────────
  sectionHeader('3. Radiographic Images')
  const imgLabels  = ['Original RVG', 'AI-Augmented (Preprocessed)', 'AI Segmented']
  const imgB64s    = [report.originalImageBase64, report.preprocessedImageBase64, report.annotatedImageBase64]
  const imgW = (CW - 12) / 3
  const imgH = 85

  // Draw image label boxes
  for (let i = 0; i < 3; i++) {
    const ix = ML + i * (imgW + 6)
    page.drawRectangle({ x:ix, y:y-14, width:imgW, height:16, color:LIGHT })
    page.drawText(imgLabels[i], { x:ix + imgW/2 - font.widthOfTextAtSize(imgLabels[i],7)/2, y:y-10, size:7, font:bold, color:NAVY })
  }
  y -= 14

  // Embed images
  for (let i = 0; i < 3; i++) {
    const ix = ML + i * (imgW + 6)
    page.drawRectangle({ x:ix, y:y-imgH, width:imgW, height:imgH, color:LIGHT,
      borderColor:rgb(0.8,0.8,0.85), borderWidth:0.5 })
    const img = await embedImage(pdfDoc, imgB64s[i])
    if (img) {
      const scale = Math.min(imgW / img.width, imgH / img.height)
      const dw = img.width * scale, dh = img.height * scale
      page.drawImage(img, { x: ix + (imgW-dw)/2, y: y-imgH+(imgH-dh)/2, width:dw, height:dh })
    } else {
      page.drawText('Not available', { x:ix+10, y:y-imgH/2, size:7, font, color:GRAY })
    }
  }
  y -= imgH + 8

  // ── Section 4: AI Analysis Summary ────────────────────────────────────
  checkY(120)
  sectionHeader('4. AI Analysis Summary')

  // Table header
  const tCols = [CW*0.45, CW*0.25, CW*0.3]
  const tHdrs = ['Finding', 'Count', 'AI Confidence']
  let tx = ML
  page.drawRectangle({ x:ML, y:y-14, width:CW, height:16, color:NAVY })
  for (let i = 0; i < 3; i++) {
    page.drawText(tHdrs[i], { x:tx+4, y:y-10, size:8, font:bold, color:WHITE })
    tx += tCols[i]
  }
  y -= 14

  const findings = report.findings || []
  const rows = [
    { label:'Dental Caries',       key:'Decayed Teeth'  },
    { label:'Restorations',        key:'Restoration'    },
    { label:'Dental Implants',     key:'Implant'        },
    { label:'Bone Level Changes',  key:'Bone Level'     },
    { label:'Healthy Teeth',       key:'Healthy Teeth'  },
  ]
  rows.forEach(({ label, key }, ri) => {
    checkY(14)
    const entry = (report.aiSummary || {})[key] || {}
    const count = entry.count      || '—'
    const conf  = entry.confidence || '—'
    page.drawRectangle({ x:ML, y:y-13, width:CW, height:15,
      color: ri%2===0 ? rgb(0.97,0.97,0.98) : WHITE,
      borderColor: rgb(0.85,0.85,0.9), borderWidth:0.3 })
    let tx2 = ML
    const vals = [label, count, conf]
    for (let i = 0; i < 3; i++) {
      page.drawText(String(vals[i]), { x:tx2+4, y:y-9, size:8, font: i===0 ? bold : font,
        color: i===0 ? NAVY : GRAY })
      tx2 += tCols[i]
    }
    y -= 14
  })
  y -= 6

  // ── Section 5: Patient Information ────────────────────────────────────
  sectionHeader('5. Patient Information')

  const textBlock = (heading, text) => {
    checkY(30)
    page.drawText(safe(heading), { x:ML+4, y:y, size:8.5, font:bold, color:NAVY })
    y -= 13
    const lines = font.encodeText ? [] : (text||'—').match(/.{1,90}/g) || ['—']
    const wrapped = pdfDoc.context ? lines : [safe(text||'—')]
    // Word-wrap manually
    const words = safe(text||'—').split(' ')
    const wLines = []
    let cur = ''
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w
      if (font.widthOfTextAtSize(test, 8.5) < CW - 16) { cur = test }
      else { if (cur) wLines.push(cur); cur = w }
    }
    if (cur) wLines.push(cur)
    for (const line of wLines.slice(0, 6)) {
      checkY(13)
      page.drawText(line, { x:ML+10, y:y, size:8.5, font, color:BLACK })
      y -= 12
    }
    y -= 4
  }

  textBlock('a. What did the AI find?',   report.summary     || 'No summary provided.')
  textBlock('b. Why does it matter?',     report.treatment   || 'Consult your treating dentist for clinical correlation.')

  // Doctor notes
  if (report.doctorNotes) {
    checkY(30)
    page.drawText('Doctor\'s Clinical Notes:', { x:ML+4, y:y, size:8.5, font:bold, color:NAVY })
    y -= 13
    const words = safe(report.doctorNotes).split(' ')
    const wLines = []
    let cur = ''
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w
      if (font.widthOfTextAtSize(test, 8.5) < CW - 16) cur = test
      else { if (cur) wLines.push(cur); cur = w }
    }
    if (cur) wLines.push(cur)
    for (const line of wLines.slice(0, 8)) {
      checkY(13)
      page.drawText(line, { x:ML+10, y:y, size:8.5, font, color:BLACK })
      y -= 12
    }
    y -= 4
  }

  // Affected teeth
  if (report.teeth) {
    checkY(20)
    page.drawText('Affected Teeth (Doctor Selected):', { x:ML+4, y:y, size:8.5, font:bold, color:NAVY })
    y -= 13
    page.drawText(safe(report.teeth), { x:ML+10, y:y, size:8.5, font, color:TEAL })
    y -= 16
  }

  y -= 4

  // ── Section 6: Disclaimer ──────────────────────────────────────────────
  checkY(60)
  sectionHeader('6. Disclaimer')
  page.drawRectangle({ x:ML, y:y-48, width:CW, height:52, color:rgb(1,0.98,0.92),
    borderColor:rgb(0.85,0.65,0.1), borderWidth:0.8 })
  const disclaimer = 'This report is generated by an artificial intelligence-based radiographic analysis system and is intended to assist dental professionals. Radiographic findings should always be correlated with clinical examination, patient history, and professional judgment. Final diagnosis and treatment decisions remain the responsibility of the treating dental practitioner.'
  const dWords = disclaimer.split(' ')
  const dLines = []; let dc = ''
  for (const w of dWords) {
    const test = dc ? dc + ' ' + w : w
    if (font.widthOfTextAtSize(test, 7.5) < CW - 16) dc = test
    else { dLines.push(dc); dc = w }
  }
  if (dc) dLines.push(dc)
  let dy = y - 10
  for (const line of dLines) {
    page.drawText(line, { x:ML+6, y:dy, size:7.5, font, color:rgb(0.5,0.35,0.0) })
    dy -= 11
  }
  y -= 56

  // ── Footer: signature line ─────────────────────────────────────────────
  checkY(40)
  page.drawLine({ start:{x:ML+CW-140, y:y-4}, end:{x:ML+CW, y:y-4}, thickness:0.7, color:NAVY })
  page.drawText(`Dr. ${safe(report.docName||'—')}`, { x:ML+CW-136, y:y-16, size:8, font:bold, color:NAVY })
  page.drawText(safe(report.docSpec||''), { x:ML+CW-136, y:y-27, size:7.5, font, color:GRAY })
  page.drawText(`Date: ${new Date().toLocaleDateString('en-IN')}`, { x:ML+CW-136, y:y-38, size:7.5, font, color:GRAY })

  // Page numbers on all pages
  const pages = pdfDoc.getPages()
  for (let i = 0; i < pages.length; i++) {
    pages[i].drawText(`Page ${i+1} of ${pages.length}  |  DivulgeAI Clinical Platform`, {
      x: ML, y: 20, size: 7, font, color: GRAY
    })
    pages[i].drawText(safe(report.hospital || 'DivulgeAI Dental'), {
      x: W - MR - 120, y: 20, size: 7, font, color: GRAY
    })
  }

  const bytes = await pdfDoc.save()
  return bytesToB64(new Uint8Array(bytes))
}

export async function savePDFFromBase64(pdfBase64, filename) {
  if (!pdfBase64) throw new Error('No PDF content to save.')
  if (window.electronAPI?.savePDF) return window.electronAPI.savePDF(filename, pdfBase64)
  const bytes = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0))
  const blob  = new Blob([bytes], { type:'application/pdf' })
  const url   = URL.createObjectURL(blob)
  const a     = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
  return true
}
