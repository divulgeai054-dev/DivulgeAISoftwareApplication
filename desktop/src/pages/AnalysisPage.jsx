// FDI tooth name reference
const FDI_NAMES = {
  11:'UR Central Incisor',12:'UR Lateral Incisor',13:'UR Canine',14:'UR 1st Premolar',15:'UR 2nd Premolar',16:'UR 1st Molar',17:'UR 2nd Molar',18:'UR Wisdom',
  21:'UL Central Incisor',22:'UL Lateral Incisor',23:'UL Canine',24:'UL 1st Premolar',25:'UL 2nd Premolar',26:'UL 1st Molar',27:'UL 2nd Molar',28:'UL Wisdom',
  31:'LL Central Incisor',32:'LL Lateral Incisor',33:'LL Canine',34:'LL 1st Premolar',35:'LL 2nd Premolar',36:'LL 1st Molar',37:'LL 2nd Molar',38:'LL Wisdom',
  41:'LR Central Incisor',42:'LR Lateral Incisor',43:'LR Canine',44:'LR 1st Premolar',45:'LR 2nd Premolar',46:'LR 1st Molar',47:'LR 2nd Molar',48:'LR Wisdom',
}

import { useState, useEffect, useMemo } from 'react'
import { useApp }              from '../context/AppContext'
import { useAuth }             from '../context/AuthContext'
import { runInference }        from '../services/aiService'

const IC = ({ d, c='currentColor', s=2, size=16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
)


// Safe image component: renders via Blob URL — avoids all Electron data: URL issues
function BlobImg({ base64, mime, style, alt }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    if (!base64) return
    let objectUrl = null
    const safeMime = (mime && mime.startsWith('image/')) ? mime : 'image/jpeg'
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    const blob  = new Blob([bytes], { type: safeMime })
    // Use createObjectURL — reliable for <img> display in Electron renderer
    objectUrl = URL.createObjectURL(blob)
    setSrc(objectUrl)
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [base64, mime])
  if (!src) return null
  return <img src={src} style={style} alt={alt || ''}
    onError={(e) => {
      // If blob URL fails, try data URL as fallback
      if (base64 && mime && !e.target.src.startsWith('data:')) {
        e.target.src = `data:${mime};base64,${base64}`
      }
    }}
  />
}

export default function AnalysisPage() {
  const { patients, addReport, navigate, openReport, analysisPatient, setAnalysisPatient } = useApp()
  const { token, user } = useAuth()

  const [step,       setStep]       = useState('select')   // select | processing | done
  const [selPat,     setSelPat]     = useState(null)
  const [search,     setSearch]     = useState('')
  // Multiple images: array of { name, path, base64, mime, size, label }
  const [images,     setImages]     = useState([])
  const [toothFDI,   setToothFDI]   = useState('')
  const [dragOver,   setDragOver]   = useState(false)
  const [dragIdx,    setDragIdx]    = useState(null)     // which slot is being dragged over

  // Processing state
  const [procIdx,    setProcIdx]    = useState(0)        // which image is being processed
  const [progress,   setProgress]   = useState(0)
  const [statusMsg,  setStatusMsg]  = useState('')
  const [results,    setResults]    = useState([])       // one per image
  const [error,      setError]      = useState('')

  useEffect(() => {
    if (analysisPatient) { setSelPat(analysisPatient); setAnalysisPatient(null) }
  }, [analysisPatient])

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  )

  // ── File reading ────────────────────────────────────────────────────
  const mimeFromExt = (name) => {
    const ext = (name || '').split('.').pop().toLowerCase()
    return {jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',bmp:'image/bmp',
            tiff:'image/tiff',tif:'image/tiff',gif:'image/gif',webp:'image/webp'}[ext] || 'image/jpeg'
  }

  const readFile = (file) => new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const mime = (file.type && file.type.startsWith('image/')) ? file.type : mimeFromExt(file.name)
      res({ name:file.name, path:file.path||file.name, size:file.size,
            base64:ev.target.result.split(',')[1], mime, label:'' })
    }
    reader.onerror = () => rej(new Error('Cannot read ' + file.name))
    reader.readAsDataURL(file)
  })

  const addImages = async (files) => {
    const newImgs = await Promise.all(Array.from(files).map(readFile))
    setImages(prev => [...prev, ...newImgs].slice(0, 8)) // max 8 images
  }

  const handlePickFiles = async () => {
    if (window.electronAPI?.openImage) {
      // Returns array of {name,base64,mime,size,path} — read by main process, always works
      const files = await window.electronAPI.openImage(true)
      if (files && files.length) {
        setImages(prev => [...prev, ...files.map(f=>({...f,label:''}))].slice(0, 8))
      }
    } else {
      const inp    = document.createElement('input')
      inp.type     = 'file'
      inp.multiple = true
      inp.accept   = '.png,.jpg,.jpeg,.bmp,.tiff,.tif,.webp'
      inp.onchange = (e) => addImages(e.target.files)
      inp.click()
    }
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false); setDragIdx(null)
    if (e.dataTransfer.files.length) addImages(e.dataTransfer.files)
  }

  const removeImage  = (idx) => setImages(prev => prev.filter((_,i) => i !== idx))
  const updateLabel  = (idx, label) => setImages(prev => prev.map((img,i) => i===idx ? {...img, label} : img))

  // ── Run all images ──────────────────────────────────────────────────
  const handleRun = async () => {
    if (!selPat)          { setError('Please select a patient.'); return }
    if (images.length===0){ setError('Please upload at least one RVG image.'); return }
    const unlabelled = images.filter(img => !img.label.trim())
    if (unlabelled.length > 0) {
      setError(`Please enter a tooth label (e.g. "FDI 36") for ${unlabelled.length === 1 ? 'image 1' : `${unlabelled.length} images`} before running analysis.`)
      return
    }
    setError(''); setStep('processing'); setProgress(0); setResults([])

    const allResults = []
    for (let i = 0; i < images.length; i++) {
      setProcIdx(i)
      const img = images[i]
      try {
        const res = await runInference({
          filePath: img.path,
          base64:   img.base64,
          mime:     img.mime,
          token,
          onProgress: (pct, msg) => {
            // Overall progress across all images
            const overall = Math.round((i / images.length) * 100 + pct / images.length)
            setProgress(overall)
            setStatusMsg(`Image ${i+1}/${images.length}: ${msg}`)
          },
          patientInfo: {
            name:           selPat.name,
            age:            selPat.age,
            phone:          selPat.phone,
            notes:          selPat.notes || toothFDI || 'Routine Dental Checkup',
            docName:        user?.name           || 'Dr. Attending Physician',
            hospitalName:   user?.hospitalName   || 'DivulgeAI Dental Hospital',
            specialization: user?.specialization || 'Dental Surgeon',
            imageLabel:     img.label            || `Image ${i + 1}`,
            imageIndex:     i + 1,
            totalImages:    images.length,
          },
        })

        const report = addReport({
          patientId:               selPat.id,
          patientName:             selPat.name,
          imageFile:               img.name,
          imageLabel:              img.label || `Image ${i+1}`,
          imageIndex:              i + 1,
          totalImages:             images.length,
          originalImageBase64:     res.originalImageBase64  || img.base64,
          originalMime:            img.mime,
          preprocessedImageBase64: res.preprocessedImageBase64 || null,
          annotatedImageBase64:    res.annotatedImageBase64  || null,
          annotatedMime:           res.annotatedMime || 'image/png',
          pdfBase64:               null,
          pdfFilename:             res.pdfFilename  || null,
          findings:                res.findings,
          confidence:              res.confidence,
          processingTime:          res.processingTime,
          statistics:              res.statistics   || {},
          regionCounts:            res.regionCounts || {},
          modelOffline:            res.modelOffline || false,
          complaint:   'Radiographic examination' + (img.label ? ` — ${img.label}` : '') + (toothFDI ? ` (${toothFDI})` : ''),
          summary:     res.findings.filter(f=>f.severity!=='None').length === 0
            ? 'No significant pathology detected. All evaluated structures appear normal.'
            : `AI analysis detected: ${res.findings.filter(f=>f.severity!=='None').map(f=>`${f.tooth} — ${f.type}`).join('; ')}. Clinical correlation recommended.`,
          teeth:       res.findings.filter(f=>f.severity!=='None').map(f=>f.tooth).join(', ') || 'N/A',
          severity:    res.findings.find(f=>f.severity==='High')?.severity || res.findings.find(f=>f.severity==='Low')?.severity || 'None',
          treatment:   res.findings.filter(f=>f.severity!=='None').map(f=>f.recommendation).filter((v,i,a)=>a.indexOf(v)===i).join(' ') || 'Continue routine dental hygiene. Review in 12 months.',
          doctorNotes: '',
        })
        allResults.push({ report, img, success: true })
      } catch (err) {
        allResults.push({ img, success: false, error: err.message })
      }
    }

    setResults(allResults)
    setProgress(100)
    setStatusMsg('Analysis complete — opening report…')

    // Auto-open the last report and navigate directly to the report page
    const lastResult = allResults[allResults.length - 1]
    if (lastResult?.report) {
      setTimeout(() => {
        openReport(lastResult.report)
        navigate('reports')
      }, 600)
    } else {
      setTimeout(() => setStep('done'), 400)
    }
  }

  const reset = () => {
    setStep('select'); setSelPat(null); setImages([])
    setToothFDI(''); setProgress(0); setStatusMsg('')
    setResults([]); setError(''); setSearch(''); setProcIdx(0)
  }

  const fmtSize = b => b > 1048576 ? `${(b/1048576).toFixed(1)} MB` : `${(b/1024).toFixed(0)} KB`

  // ── Processing screen ────────────────────────────────────────────────
  if (step === 'processing') return (
    <div className="fade-in" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem', background:'var(--light)' }}>
      <div style={{ textAlign:'center', maxWidth:460 }}>
        {/* Spinner with current image preview */}
        <div style={{ width:120, height:120, margin:'0 auto 2rem', position:'relative' }}>
          <div style={{ position:'absolute', inset:0, border:'3px solid rgba(13,148,136,.15)', borderTop:'3px solid var(--teal)', borderRadius:'50%', animation:'spin .9s linear infinite' }} />
          <div style={{ position:'absolute', inset:10, background:'var(--teal-xlight)', borderRadius:'50%', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {images[procIdx]?.base64 && images[procIdx]?.mime !== 'application/dicom'
              ? <BlobImg base64={images[procIdx].base64} mime={images[procIdx].mime} style={{ width:'100%', height:'100%', objectFit:'cover', opacity:.75 }} />
              : <span style={{ fontSize:36 }}>🦷</span>
            }
          </div>
        </div>

        <h2 style={{ fontFamily:'var(--font-head)', fontSize:'1.3rem', fontWeight:800, color:'var(--navy)', marginBottom:'.35rem' }}>
          Processing {images.length > 1 ? `Image ${procIdx+1} of ${images.length}` : 'RVG Image'}
        </h2>
        <p style={{ color:'var(--slate)', fontSize:'.88rem', marginBottom:'2rem', minHeight:22 }}>{statusMsg}</p>

        <div className="progress-track" style={{ marginBottom:'.6rem' }}>
          <div className="progress-fill" style={{ width:`${progress}%` }} />
        </div>
        <div style={{ fontSize:'.8rem', color:'var(--muted)', fontWeight:700, marginBottom:'1.5rem' }}>{progress}%</div>

        {/* Image queue thumbnails */}
        {images.length > 1 && (
          <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap' }}>
            {images.map((img, i) => (
              <div key={i} style={{ width:44, height:44, borderRadius:8, overflow:'hidden', border:`2px solid ${i===procIdx ? 'var(--teal)' : i < procIdx ? '#10b981' : 'var(--border)'}`, opacity: i > procIdx ? .4 : 1, position:'relative', flexShrink:0 }}>
                {img.base64 && img.mime !== 'application/dicom'
                  ? <BlobImg base64={img.base64} mime={img.mime} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <div style={{ width:'100%', height:'100%', background:'#0a0e18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🦷</div>
                }
                {i < procIdx && (
                  <div style={{ position:'absolute', inset:0, background:'rgba(16,185,129,.5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop:'1.25rem', fontSize:'.78rem', color:'var(--muted)' }}>
          Patient: <strong style={{ color:'var(--navy)' }}>{selPat?.name}</strong>
        </div>
      </div>
    </div>
  )

  // ── Done screen ──────────────────────────────────────────────────────
  if (step === 'done') return (
    <div className="fade-up" style={{ flex:1, padding:'1.5rem', overflowY:'auto' }}>
      <div style={{ maxWidth:1000, margin:'0 auto' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem', flexWrap:'wrap', gap:'.75rem' }}>
          <div>
            <h1 className="page-title">
              {results.length > 1 ? `${results.filter(r=>r.success).length}/${results.length} Analyses Complete` : 'Analysis Complete'}
            </h1>
            <p className="page-sub">{selPat?.name} · {results.length} image{results.length>1?'s':''} processed</p>
          </div>
          <div style={{ display:'flex', gap:'.6rem' }}>
            <button className="btn btn-primary" onClick={() => navigate('reports')}>
              View Reports →
            </button>
            <button className="btn btn-ghost" onClick={() => {
              // Add more images for same patient (follow-up)
              setStep('select')
              setImages([])
              setResults([])
              setProgress(0)
            }}>
              + Add More Images
            </button>
            <button className="btn btn-ghost" onClick={reset}>New Patient</button>
          </div>
        </div>

        {/* Results grid — one card per image */}
        <div style={{ display:'grid', gridTemplateColumns: results.length === 1 ? '1fr' : 'repeat(auto-fit,minmax(440px,1fr))', gap:'1rem' }}>
          {results.map((r, idx) => (
            <div key={idx} className="card" style={{ padding:'1.25rem', borderColor: r.success ? 'var(--border)' : 'var(--danger)' }}>
              {/* Image header */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:32, height:32, borderRadius:8, background: r.success ? 'var(--teal-xlight)' : '#fef2f2', border:`1.5px solid ${r.success ? 'var(--teal-light)' : '#fecaca'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.72rem', fontWeight:800, color: r.success ? 'var(--teal)' : 'var(--danger)' }}>
                    {idx+1}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'.9rem', color:'var(--navy)' }}>{r.img.name}</div>
                    <div style={{ fontSize:'.72rem', color:'var(--muted)' }}>
                      {r.success ? `${r.report?.processingTime}s · ${r.report?.confidence}% confidence` : 'Failed'}
                    </div>
                  </div>
                </div>
                {r.success && (
                  <button className="btn btn-sm btn-primary" onClick={() => {
                    navigate('report-detail')
                    // openReport is called via navigate — activeReport already set in addReport
                  }}>
                    View Report
                  </button>
                )}
              </div>

              {!r.success ? (
                <div className="alert alert-error" style={{ fontSize:'.82rem' }}>
                  <IC d={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}/>
                  {r.error}
                </div>
              ) : (
                <>
                  {/* 3 images */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:'1rem' }}>
                    {[
                      { label:'Original',       b64: r.report?.originalImageBase64,     mime: r.img.mime },
                      { label:'Preprocessed',   b64: r.report?.preprocessedImageBase64,  mime:'image/png' },
                      { label:'Segmentation',   b64: r.report?.annotatedImageBase64,     mime:'image/png' },
                    ].map(({ label, b64, mime }) => (
                      <div key={label}>
                        <div style={{ fontSize:'.6rem', fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4, textAlign:'center' }}>{label}</div>
                        <div style={{ background:'#0a0e18', borderRadius:6, overflow:'hidden', minHeight:90, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {b64
                            ? <BlobImg base64={b64} mime={mime} style={{ width:'100%', display:'block', maxHeight:110, objectFit:'contain' }} />
                            : <span style={{ color:'rgba(255,255,255,.25)', fontSize:'.68rem' }}>N/A</span>
                          }
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Findings summary */}
                  {r.report?.findings?.length === 0 ? (
                    <div className="alert alert-success" style={{ fontSize:'.8rem' }}>
                      <IC d={<polyline points="20 6 9 17 4 12"/>}/> No pathology detected
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                      {r.report.findings.filter(f=>f.severity!=='None').map((f,i) => {
                        const c = f.severity==='High'?'#ef4444':f.severity==='Low'?'#f59e0b':'#10b981'
                        return (
                          <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:4, background:c+'18', border:`1px solid ${c}30`, borderRadius:100, padding:'2px 9px 2px 6px', fontSize:'.72rem', fontWeight:700, color:c }}>
                            <span style={{ background:c, color:'#fff', borderRadius:4, padding:'1px 5px', fontSize:'.65rem', fontWeight:800 }}>
                              {f.fdiNumber ? `FDI ${f.fdiNumber}` : f.tooth}
                            </span>
                            {f.className || f.type}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Select + Upload screen ───────────────────────────────────────────
  return (
    <div className="fade-up" style={{ padding:'1.5rem', overflowY:'auto', flex:1 }}>
      <div style={{ marginBottom:'1.25rem' }}>
        <button onClick={() => navigate('dashboard')} style={{ display:'flex',alignItems:'center',gap:5,padding:'.35rem .7rem',background:'transparent',border:'1.5px solid var(--border)',borderRadius:8,cursor:'pointer',color:'var(--slate)',fontSize:'.78rem',fontWeight:600,marginBottom:'.75rem',transition:'all .15s',width:'fit-content' }} onMouseEnter={e=>{e.currentTarget.style.background='var(--light)';e.currentTarget.style.borderColor='var(--teal)';e.currentTarget.style.color='var(--teal)'}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--slate)'}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Dashboard
        </button>
        <h1 className="page-title">New RVG Analysis</h1>
        <p className="page-sub">Select a patient, upload one or more RVG images, then run AI segmentation</p>
      </div>

      {error && (
        <div className="alert alert-error fade-in" style={{ marginBottom:'1rem' }}>
          <IC d={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}/>
          {error}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:'1rem', marginBottom:'1rem' }}>

        {/* ── Patient selector ────────────────────────────────── */}
        <div className="card" style={{ padding:'1.25rem' }}>
          <div style={{ fontWeight:700, fontSize:'.95rem', color:'var(--navy)', marginBottom:'1rem', display:'flex', alignItems:'center', gap:8 }}>
            <IC d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></>} c="var(--teal)"/>
            1. Select Patient
          </div>
          <div style={{ position:'relative', marginBottom:'.75rem' }}>
            <IC d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} c="var(--muted)"/>
            <input className="form-input" style={{ paddingLeft:32 }} placeholder="Search patient…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <div style={{ maxHeight:220, overflowY:'auto', border:'1.5px solid var(--border)', borderRadius:8, marginBottom:'.85rem' }}>
            {filtered.map(p => (
              <div key={p.id} onClick={() => setSelPat(p)}
                style={{ display:'flex', alignItems:'center', gap:9, padding:'.6rem .85rem', cursor:'pointer', background: selPat?.id===p.id ? 'var(--teal-xlight)' : 'transparent', borderBottom:'1px solid var(--border)', transition:'background .15s' }}
                onMouseEnter={e=>{ if(selPat?.id!==p.id) e.currentTarget.style.background='var(--light)' }}
                onMouseLeave={e=>{ if(selPat?.id!==p.id) e.currentTarget.style.background='transparent' }}>
                <div style={{ width:28,height:28,borderRadius:'50%',background:'var(--teal-xlight)',border:'1.5px solid var(--teal-light)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.6rem',fontWeight:800,color:'var(--teal)',flexShrink:0 }}>
                  {p.name.split(' ').map(x=>x[0]).join('')}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'.85rem', fontWeight:selPat?.id===p.id?700:600, color:'var(--navy)' }}>{p.name}</div>
                  <div style={{ fontSize:'.7rem', color:'var(--muted)' }}>{p.id} · {p.age}y · {p.gender}</div>
                </div>
                {selPat?.id===p.id && <IC d={<polyline points="20 6 9 17 4 12"/>} c="var(--teal)" s={2.5}/>}
              </div>
            ))}
          </div>

          {selPat && (
            <div className="alert alert-info">
              <IC d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}/>
              <div>
                <div style={{ fontWeight:700, fontSize:'.82rem' }}>{selPat.name}</div>
                <div style={{ fontSize:'.72rem' }}>{selPat.id} · {selPat.age}y · {selPat.gender}</div>
              </div>
            </div>
          )}

          {/* Add Patient — prominent teal button */}
          <button
            onClick={() => navigate('patients')}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, width:'100%', padding:'.6rem .75rem', marginTop:'.75rem', background:'linear-gradient(135deg,#0d9488,#0891b2)', border:'none', borderRadius:9, cursor:'pointer', color:'white', fontSize:'.8rem', fontWeight:700, transition:'all .18s', boxShadow:'0 2px 8px rgba(13,148,136,.3)' }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 4px 14px rgba(13,148,136,.4)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 8px rgba(13,148,136,.3)'}}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            + Add New Patient
          </button>

          <div className="form-group" style={{ marginTop:'.85rem', marginBottom:0 }}>
            <label className="form-label">Region / Notes (optional)</label>
            <input className="form-input" placeholder="e.g. FDI 36, Mandibular Left" value={toothFDI} onChange={e=>setToothFDI(e.target.value)} />
          </div>
        </div>

        {/* ── Image upload — multiple ──────────────────────────── */}
        <div className="card" style={{ padding:'1.25rem' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
            <div style={{ fontWeight:700, fontSize:'.95rem', color:'var(--navy)', display:'flex', alignItems:'center', gap:8 }}>
              <IC d={<><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>} c="var(--teal)"/>
              2. Upload RVG Images
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:'.75rem', color:'var(--muted)' }}>{images.length}/8 images</span>
              {images.length > 0 && (
                <button className="btn btn-sm btn-primary" onClick={handlePickFiles}>
                  <IC d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} c="white" s={2.5}/>
                  Add Image
                </button>
              )}
            </div>
          </div>

          {/* Drop zone — only shown when no images */}
          {images.length === 0 && (
            <div
              className={`drop-zone${dragOver?' drag-over':''}`}
              onClick={handlePickFiles}
              onDragOver={e=>{e.preventDefault();setDragOver(true)}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={handleDrop}
              style={{ minHeight:160 }}>
              <IC d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>} c="var(--muted)" size={36}/>
              <div style={{ fontWeight:700, fontSize:'.9rem', color:'var(--slate)', margin:'.75rem 0 .3rem' }}>Click to upload or drag & drop</div>
              <div style={{ fontSize:'.78rem', color:'var(--muted)' }}>DICOM, JPEG, PNG · Select multiple · Max 8 images</div>
            </div>
          )}

          {/* Image grid */}
          {images.length > 0 && (
            <div
              style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:8 }}
              onDragOver={e=>{e.preventDefault();setDragOver(true)}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={handleDrop}>
              {images.map((img, idx) => (
                <div key={idx} style={{ border:'1.5px solid var(--border)', borderRadius:10, overflow:'hidden', background:'var(--light)', position:'relative' }}>
                  {/* Preview */}
                  <div style={{ background:'#0a0e18', height:100, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                    {img.base64 && img.mime !== 'application/dicom'
                      ? <BlobImg base64={img.base64} mime={img.mime} style={{ width:'100%', height:'100%', objectFit:'contain' }} />
                      : <div style={{ color:'rgba(255,255,255,.4)', fontSize:'.72rem', textAlign:'center' }}><div style={{ fontSize:24, marginBottom:4 }}>🦷</div>DICOM</div>
                    }
                    {/* Index badge */}
                    <div style={{ position:'absolute', top:5, left:5, background:'var(--teal)', color:'#fff', fontSize:'.6rem', fontWeight:800, padding:'2px 6px', borderRadius:4 }}>#{idx+1}</div>
                    {/* Remove button */}
                    <button onClick={() => removeImage(idx)} style={{ position:'absolute', top:5, right:5, width:20, height:20, borderRadius:'50%', background:'rgba(239,68,68,.85)', border:'none', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700 }}>✕</button>
                  </div>
                  {/* Label input — REQUIRED */}
                  <div style={{ padding:'5px 6px' }}>
                    <div style={{ fontSize:'.62rem', color:'var(--muted)', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{img.name}</div>
                    <input
                      className="form-input"
                      style={{ fontSize:'.68rem', padding:'3px 7px', height:26, borderColor: img.label.trim() ? 'var(--border)' : 'rgba(239,68,68,.5)', outline: img.label.trim() ? '' : 'none' }}
                      placeholder="Tooth label — required ✱"
                      value={img.label}
                      onChange={e => updateLabel(idx, e.target.value)}
                      required
                    />
                  </div>
                </div>
              ))}

              {/* Add more slot */}
              {images.length < 8 && (
                <div onClick={handlePickFiles} style={{ border:'2px dashed var(--border)', borderRadius:10, height:150, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, cursor:'pointer', color:'var(--muted)', fontSize:'.78rem', transition:'all .2s' }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor='var(--teal)'; e.currentTarget.style.color='var(--teal)' }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--muted)' }}>
                  <IC d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} size={24}/>
                  Add Image
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end', gap:'.75rem' }}>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
        <button
          className="btn btn-primary"
          style={{ padding:'10px 28px', fontSize:'.92rem' }}
          onClick={handleRun}
          disabled={!selPat || images.length === 0 || images.some(img => !img.label.trim())}>
          <IC d={<polygon points="5 3 19 12 5 21 5 3"/>} c="white"/>
          {images.length > 1 ? `Run AI Analysis (${images.length} images)` : 'Run AI Analysis'}
        </button>
      </div>
    </div>
  )
}
