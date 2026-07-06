import { useState, useEffect, useMemo } from 'react'
import { useApp }   from '../context/AppContext'
import { useAuth }  from '../context/AuthContext'
import { savePDFFromBase64, createPdfFromReport } from '../services/aiService'

const FDI_NAMES = {
  11:'UR Central Incisor',12:'UR Lateral Incisor',13:'UR Canine',14:'UR 1st Premolar',15:'UR 2nd Premolar',16:'UR 1st Molar',17:'UR 2nd Molar',18:'UR Wisdom',
  21:'UL Central Incisor',22:'UL Lateral Incisor',23:'UL Canine',24:'UL 1st Premolar',25:'UL 2nd Premolar',26:'UL 1st Molar',27:'UL 2nd Molar',28:'UL Wisdom',
  31:'LL Central Incisor',32:'LL Lateral Incisor',33:'LL Canine',34:'LL 1st Premolar',35:'LL 2nd Premolar',36:'LL 1st Molar',37:'LL 2nd Molar',38:'LL Wisdom',
  41:'LR Central Incisor',42:'LR Lateral Incisor',43:'LR Canine',44:'LR 1st Premolar',45:'LR 2nd Premolar',46:'LR 1st Molar',47:'LR 2nd Molar',48:'LR Wisdom',
}

function safeName(name) {
  return (name || 'Patient')
    .replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s*/i, '')
    .trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')
}

const IC = ({ d, c='currentColor', s=2, size=15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d)
      ? d.map((p,i) => typeof p === 'string' ? <path key={i} d={p}/> : null)
      : typeof d === 'string' ? <path d={d}/> : d}
  </svg>
)

import ToothPicker from '../components/ToothPicker'

// BlobImg — renders any base64 image via Blob URL (Electron-safe)
function BlobImg({ base64, mime, style, alt }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    if (!base64) return
    const safeMime = (mime && mime.startsWith('image/')) ? mime : 'image/png'
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    const blob  = new Blob([bytes], { type: safeMime })
    const url   = URL.createObjectURL(blob)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [base64, mime])
  return src ? <img src={src} style={style} alt={alt||''} /> : null
}



export default function ReportsPage() {
  const { reports, activeReport, openReport, updateReport, markDownloaded, navigate, selectedPatient, closeReport } = useApp()
  const { user, token } = useAuth()

  if (activeReport) return (
    <ReportDetail
      report={activeReport}
      allReports={reports}
      updateReport={updateReport}
      markDownloaded={markDownloaded}
      onBack={() => { closeReport(); navigate('reports') }}
      onFollowUp={(patient) => navigate('analysis', { patient })}
      user={user} token={token}
    />
  )
  return <ReportList reports={reports} openReport={openReport} navigate={navigate} selectedPatient={selectedPatient} />
}

/* ── Report List ──────────────────────────────────────────────────────── */
function ReportList({ reports, openReport, navigate, selectedPatient }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  const filtered = reports
    .filter(r => !selectedPatient || r.patientId === selectedPatient.id)
    .filter(r => {
      const matchText   = r.patientName.toLowerCase().includes(search.toLowerCase()) ||
                          r.id.toLowerCase().includes(search.toLowerCase())
      const matchFilter = filter === 'All' || r.status === filter
      return matchText && matchFilter
    })

  const sBadge = s => s==='Downloaded'?'badge-green':s==='Edited'?'badge-teal':'badge-warn'

  return (
    <div className="fade-up" style={{ padding:'1.5rem', overflowY:'auto', flex:1 }}>
      <button onClick={() => navigate('dashboard')} style={{ display:'flex',alignItems:'center',gap:5,padding:'.35rem .7rem',background:'transparent',border:'1.5px solid var(--border)',borderRadius:8,cursor:'pointer',color:'var(--slate)',fontSize:'.78rem',fontWeight:600,marginBottom:'1rem',transition:'all .15s',width:'fit-content' }} onMouseEnter={e=>{e.currentTarget.style.background='var(--light)';e.currentTarget.style.borderColor='var(--teal)';e.currentTarget.style.color='var(--teal)'}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--slate)'}}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Dashboard
      </button>
      <div style={{ marginBottom:'1.25rem' }}>
        <h1 className="page-title">
          {selectedPatient ? `${selectedPatient.name}'s Reports` : 'Reports'}
        </h1>
        <p className="page-sub">
          {selectedPatient
            ? `Showing reports for ${selectedPatient.name}.`
            : 'Select a patient from the Patients section to view their reports.'}
        </p>
      </div>

      <div style={{ display:'flex', gap:'.65rem', marginBottom:'1rem', flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className="form-input" style={{ paddingLeft:32 }} placeholder="Search by patient or report ID…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        {['All','AI Generated','Edited','Downloaded'].map(f => (
          <button key={f} className={`btn btn-sm ${filter===f?'btn-primary':'btn-ghost'}`} onClick={()=>setFilter(f)}>{f}</button>
        ))}
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Report ID</th>
              <th>Image</th>
              <th>Date</th>
              <th>Findings</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign:'center', padding:'2.5rem', color:'var(--muted)' }}>
                  {selectedPatient
                    ? 'No reports found for this patient yet.'
                    : (
                      <div>
                        <div style={{ marginBottom:'.75rem' }}>No patient selected. Reports are shown only for the current patient.</div>
                        <button className="btn btn-sm btn-primary" onClick={() => navigate('patients')}>
                          Select a Patient
                        </button>
                      </div>
                    )}
                </td>
              </tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="clickable" onClick={()=>openReport(r)}>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                    <div style={{ width:30,height:30,borderRadius:'50%',background:'var(--teal-xlight)',border:'1.5px solid var(--teal-light)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.62rem',fontWeight:800,color:'var(--teal)',flexShrink:0 }}>
                      {r.patientName.split(' ').map(x=>x[0]).join('').slice(0,2)}
                    </div>
                    <div style={{ fontWeight:700, fontSize:'.88rem' }}>{r.patientName}</div>
                  </div>
                </td>
                <td style={{ color:'var(--muted)', fontSize:'.8rem' }}>{r.id}</td>
                <td style={{ fontSize:'.78rem', color:'var(--slate)', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {r.imageLabel || r.imageFile || '—'}
                </td>
                <td style={{ color:'var(--slate)', fontSize:'.82rem', whiteSpace:'nowrap' }}>{r.date}</td>
                <td style={{ fontSize:'.82rem', color:'var(--slate)', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {!r.findings?.length ? 'No pathology' : r.findings.filter(f=>f.severity!=='None').map(f => f.fdiNumber ? `FDI ${f.fdiNumber}` : f.tooth).join(', ') || 'Healthy'}
                </td>
                <td><span className={`badge ${sBadge(r.status)}`}>{r.status}</span></td>
                <td>
                  <button className="btn btn-sm btn-ghost" onClick={e=>{e.stopPropagation();openReport(r)}}>Open</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Report Detail ─────────────────────────────────────────────────────── */
function ReportDetail({ report, allReports, updateReport, markDownloaded, onBack, onFollowUp, user }) {

  // All reports for same patient — for history/follow-up display
  const patientReports = useMemo(() =>
    allReports.filter(r => r.patientId === report.patientId).sort((a,b) => b.id.localeCompare(a.id)),
    [allReports, report.patientId]
  )

  const [form, setForm] = useState({
    complaint:   report.complaint   || '',
    summary:     report.summary     || '',
    teeth:       report.teeth       || '',
    severity:    report.severity    || 'None',
    treatment:   report.treatment   || '',
    doctorNotes: report.doctorNotes || '',
    aiSummary:   report.aiSummary   || {},
  })

  // Keep form in sync if report changes (e.g. navigating between patient reports)
  const [lastReportId, setLastReportId] = useState(report.id)
  if (report.id !== lastReportId) {
    setLastReportId(report.id)
    setForm({
      complaint:   report.complaint   || '',
      summary:     report.summary     || '',
      teeth:       report.teeth       || '',
      severity:    report.severity    || 'None',
      treatment:   report.treatment   || '',
      doctorNotes: report.doctorNotes || '',
      aiSummary:   report.aiSummary   || {},
    })
  }

  const [saved,       setSaved]       = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [activeImg,   setActiveImg]   = useState('annotated')
  const [showFDI,     setShowFDI]     = useState(true)

  // ToothPicker state
  const initTeeth = useMemo(() => {
    const nums = (report.teeth || '').match(/\d{2}/g) || []
    return new Set()   // doctor selects teeth manually — no AI pre-population
  }, [report.id])
  const [selectedTeeth, setSelectedTeeth] = useState(initTeeth)

  const handleTeethChange = (newSet) => {
    setSelectedTeeth(newSet)
    const sorted = [...newSet].sort((a,b)=>parseInt(a)-parseInt(b))
    setForm(f => ({ ...f, teeth: sorted.map(n=>`FDI ${n}`).join(', ') }))
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  // Save — write all form fields to report
  const handleSave = () => {
    updateReport(report.id, { ...form })
    setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  // Download — use all current form fields (saved or not)
  const handleDownload = async () => {
    setDownloading(true)
    try {
      // First save latest edits
      updateReport(report.id, { ...form })

      const filename = `${safeName(report.patientName)}_${report.id}.pdf`
      const pdfReport = { ...report, ...form }

      let pdfBase64 = null
      try {
        pdfBase64 = await createPdfFromReport(pdfReport)
      } catch (err) {
        console.warn('Failed to generate PDF in renderer:', err)
        pdfBase64 = report.pdfBase64 || null
      }

      if (pdfBase64) {
        await savePDFFromBase64(pdfBase64, filename)
        markDownloaded(report.id)
      } else if (window.electronAPI?.savePDF) {
        const saved = await window.electronAPI.savePDF(filename, null)
        if (saved) markDownloaded(report.id)
      } else {
        // Full formatted text report with all doctor edits
        const date  = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })
        const bar   = '='.repeat(60)
        const dash  = '-'.repeat(40)
        const lines = [
          'DIVULGEAI — AI-ASSISTED DENTAL RADIOGRAPHIC REPORT',
          bar, '',
          `  Report ID         : ${report.id}`,
          `  Patient Name      : ${report.patientName}`,
          `  Report Date       : ${date}`,
          `  Attending Doctor  : ${user?.name || '—'}`,
          `  Specialization    : ${user?.specialization || '—'}`,
          `  Hospital/Clinic   : ${user?.hospitalName || '—'}`,
          `  AI Model          : ${report.modelUsed || '—'}`,
          `  Image File        : ${report.imageFile || '—'}`,
          `  Image Label       : ${report.imageLabel || '—'}`,
          '', bar,
          'AI DIAGNOSTIC FINDINGS',
          dash,
          ...(!report.findings?.filter(f=>f.severity!=='None').length
            ? ['  No significant pathology detected.']
            : report.findings.filter(f=>f.severity!=='None').map(f => [
                `  * ${f.fdiNumber ? `FDI ${f.fdiNumber}` : f.tooth} — ${f.className||f.type}`,
                `    Severity   : ${f.severity}`,
                `    Confidence : ${f.confidence}%`,
                `    Details    : ${f.description}`,
                `    Action     : ${f.recommendation}`,
                `    Tooth Name : ${FDI_NAMES[parseInt(f.fdiNumber)] || '—'}`,
              ].join('\n'))
          ),
          '', bar,
          "DOCTOR'S CLINICAL ASSESSMENT",
          dash,
          `  Chief Complaint   : ${form.complaint || '—'}`,
          '',
          `  Findings Summary`,
          ...(form.summary||'—').split('\n').map(l=>`    ${l}`),
          '',
          `  Affected Teeth    : ${form.teeth || '—'}`,
          `  Overall Severity  : ${form.severity || '—'}`,
          '',
          `  Treatment Plan`,
          ...(form.treatment||'—').split('\n').map(l=>`    ${l}`),
          '',
          `  Doctor's Notes    : ${form.doctorNotes || '—'}`,
          '', bar, '',
          `  Signed by : ${user?.name || '—'}`,
          `  Date      : ${date}`,
          '', bar,
          'DivulgeAI Clinical Platform | AI-Assisted Dental Diagnostics',
          'DISCLAIMER: AI-assisted report. Does not replace professional clinical judgment.',
          bar,
        ]
        const blob = new Blob([lines.join('\n')], { type:'text/plain' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href = url; a.download = filename.replace('.pdf','.txt'); a.click()
        URL.revokeObjectURL(url)
        markDownloaded(report.id)
      }
    } finally { setDownloading(false) }
  }

  const noFindings = !report.findings?.filter(f=>f.severity!=='None').length
  const sBadge     = s => s==='Downloaded'?'badge-green':s==='Edited'?'badge-teal':'badge-warn'

  const IMAGE_TABS = [
    { key:'original',     label:'Original RVG',   b64: report.originalImageBase64,    mime: report.originalMime||'image/png' },
    { key:'preprocessed', label:'Preprocessed',   b64: report.preprocessedImageBase64, mime:'image/png' },
    { key:'annotated',    label:'AI Segmentation', b64: report.annotatedImageBase64,   mime: report.annotatedMime||'image/png' },
  ]
  const currentImg  = IMAGE_TABS.find(t=>t.key===activeImg)
  const displayB64  = activeImg==='annotated' && !showFDI
    ? (report.originalImageBase64 || currentImg?.b64)
    : currentImg?.b64

  return (
    <div className="fade-up" style={{ padding:'1.5rem', overflowY:'auto', flex:1 }}>

      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'1.25rem', flexWrap:'wrap' }}>
        <button className="btn btn-sm btn-ghost" onClick={onBack}>
          <IC d="M15 18l-6-6 6-6"/> Back
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'var(--font-head)', fontSize:'1.05rem', fontWeight:800, color:'var(--navy)' }}>
            {report.patientName} — {report.id}
            {report.imageLabel && <span style={{ fontSize:'.75rem', fontWeight:500, color:'var(--muted)', marginLeft:8 }}>({report.imageLabel})</span>}
          </div>
          <div style={{ fontSize:'.75rem', color:'var(--muted)' }}>
            {report.date} · {report.imageFile}{report.modelUsed ? ` · ${report.modelUsed}` : ''}
          </div>
        </div>
        <span className={`badge ${sBadge(report.status)}`}>{report.status}</span>

        {/* Follow-up button */}
        <button className="btn btn-sm btn-ghost" onClick={() => {
          const patient = { id: report.patientId, name: report.patientName }
          onFollowUp(patient)
        }} style={{ gap:6 }}>
          <IC d={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></>} c="var(--teal)"/>
          Follow-up Analysis
        </button>

        <button className="btn btn-ghost btn-sm" onClick={handleSave}>
          <IC d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z M17 21v-8H7v8 M7 3v5h8"/> Save
        </button>
        <button className="btn btn-primary btn-sm" onClick={handleDownload} disabled={downloading}>
          {downloading
            ? <><span className="spinner spinner-sm"/> Generating…</>
            : <><IC d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3" c="white"/>
                Download PDF</>
          }
        </button>
      </div>

      {saved && (
        <div className="alert alert-success fade-in" style={{ marginBottom:'1rem' }}>
          <IC d="M20 6L9 17l-5-5"/> Report saved. All changes will be included in the downloaded report.
        </div>
      )}

      {/* Patient report history bar */}
      {patientReports.length > 1 && (
        <div style={{ background:'var(--white)', border:'1.5px solid var(--border)', borderRadius:12, padding:'.75rem 1rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'.75rem', flexWrap:'wrap' }}>
          <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.05em', flexShrink:0 }}>
            Patient History ({patientReports.length} reports)
          </div>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap', flex:1 }}>
            {patientReports.map(r => (
              <button key={r.id}
                className={`btn btn-sm ${r.id===report.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize:'.7rem', gap:4 }}
                onClick={() => {
                  if (r.id !== report.id) {
                    // Navigate to this report
                    updateReport(report.id, form) // save current edits first
                    import('../context/AppContext').then(({ useApp: _ }) => {})
                    // Use context's openReport
                    window.__divulgeOpenReport?.(r)
                  }
                }}>
                {r.id}
                <span style={{ opacity:.7 }}>{r.date?.split(',')[0] || ''}</span>
                <span className={`badge ${sBadge(r.status)}`} style={{ fontSize:'.55rem', padding:'1px 5px' }}>{r.status}</span>
              </button>
            ))}
          </div>
          <button className="btn btn-sm btn-ghost" style={{ gap:5, color:'var(--teal)', borderColor:'var(--teal)', fontSize:'.75rem', flexShrink:0 }}
            onClick={() => onFollowUp({ id: report.patientId, name: report.patientName })}>
            <IC d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} c="var(--teal)" size={13}/>
            New Follow-up
          </button>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:'1rem', alignItems:'start' }}>

        {/* ── Left: image viewer + findings ─────────────────────── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

          {/* Image viewer */}
          <div className="card" style={{ padding:'1rem' }}>
            <div style={{ display:'flex', gap:3, marginBottom:'.75rem' }}>
              {IMAGE_TABS.map(t => (
                <button key={t.key} onClick={()=>setActiveImg(t.key)}
                  className={`btn btn-sm ${activeImg===t.key?'btn-primary':'btn-ghost'}`}
                  style={{ flex:1, fontSize:'.62rem', padding:'4px 3px' }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ background:'#0a0e18', borderRadius:8, overflow:'hidden', marginBottom:'.75rem', minHeight:170, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {displayB64 ? (
                <BlobImg base64={displayB64} mime={currentImg?.mime||'image/png'} style={{ width:'100%', height:'100%', objectFit:'contain', borderRadius:6 }} />
              ) : (
                <div style={{ textAlign:'center', color:'rgba(255,255,255,.3)', padding:'2rem' }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>🦷</div>
                  <div style={{ fontSize:'.72rem' }}>
                    {activeImg==='preprocessed' ? 'Available when model is running' : 'Run analysis to see image'}
                  </div>
                </div>
              )}
            </div>

            {/* FDI toggle — segmentation tab only */}
            {activeImg === 'annotated' && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'.5rem .7rem', background:showFDI?'var(--teal-xlight)':'var(--light)', border:`1.5px solid ${showFDI?'var(--teal-light)':'var(--border)'}`, borderRadius:8, marginBottom:'.75rem', transition:'all .2s' }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={showFDI?'var(--teal)':'var(--muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                  <span style={{ fontSize:'.74rem', fontWeight:700, color:showFDI?'var(--teal-dark)':'var(--slate)' }}>AI Segmentation Overlay</span>
                </div>
                <button onClick={()=>setShowFDI(s=>!s)} style={{ width:36, height:19, borderRadius:100, background:showFDI?'var(--teal)':'var(--border)', border:'none', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
                  <div style={{ position:'absolute', top:2.5, left:showFDI?'calc(100% - 15px)':2.5, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.2)' }}/>
                </button>
              </div>
            )}

            {/* Metrics */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:4 }}>
              {[
                [noFindings?'0':String(report.findings?.filter(f=>f.severity!=='None').length||0),'Findings'],
                [`${report.confidence||'—'}%`,'Confidence'],
                [`${report.processingTime||'—'}s`,'Time'],
              ].map(([v,l])=>(
                <div key={l} style={{ background:'var(--teal-xlight)', border:'1px solid var(--teal-light)', borderRadius:6, padding:'5px 4px', textAlign:'center' }}>
                  <div style={{ fontFamily:'var(--font-head)', fontSize:'.9rem', fontWeight:800, color:'var(--teal)' }}>{v}</div>
                  <div style={{ fontSize:'.6rem', color:'var(--muted)' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── Right: editable report form ───────────────────────── */}
        <div className="card" style={{ padding:'1.25rem' }}>

          {/* Doctor + Hospital + Model */}
          <div style={{ background:'var(--teal-xlight)', border:'1px solid rgba(13,148,136,.2)', borderRadius:10, padding:'.75rem 1rem', marginBottom:'1.1rem', display:'flex', gap:'1.5rem', flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:'.6rem', fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.05em' }}>Attending Doctor</div>
              <div style={{ fontSize:'.85rem', fontWeight:700, color:'var(--navy)', marginTop:2 }}>{user?.name||'—'}</div>
              {user?.specialization && <div style={{ fontSize:'.7rem', color:'var(--slate)' }}>{user.specialization}</div>}
            </div>
            {user?.hospitalName && (
              <div>
                <div style={{ fontSize:'.6rem', fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.05em' }}>Hospital / Clinic</div>
                <div style={{ fontSize:'.85rem', fontWeight:700, color:'var(--navy)', marginTop:2 }}>{user.hospitalName}</div>
              </div>
            )}
            {report.modelUsed && (
              <div>
                <div style={{ fontSize:'.6rem', fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.05em' }}>AI Model</div>
                <div style={{ fontSize:'.85rem', fontWeight:700, color:'var(--teal)', marginTop:2 }}>{report.modelUsed}</div>
              </div>
            )}
          </div>

          {/* ── Report header matching template ─────────────────── */}
          <div style={{ fontWeight:800, fontSize:'.95rem', color:'var(--navy)', marginBottom:'1.1rem', display:'flex', alignItems:'center', gap:7 }}>
            <IC d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" c="var(--teal)" size={16}/>
            AI-Assisted Dental Radiographic Interpretation Report
          </div>

          <div style={{ background:'var(--light)', border:'1px solid var(--border)', borderRadius:8, padding:'.6rem .85rem', marginBottom:'1rem', fontSize:'.75rem', color:'var(--slate)' }}>
            💡 All fields below are included in the downloaded PDF report. Fill in, then click <strong>Save</strong> or <strong>Download</strong>.
          </div>

          {/* ── Section 1: Patient Details ─────────────────────────── */}
          <div style={{ borderBottom:'2px solid var(--teal)', paddingBottom:'.3rem', marginBottom:'.8rem', fontWeight:700, fontSize:'.8rem', color:'var(--teal)', textTransform:'uppercase', letterSpacing:'.06em' }}>
            1. Patient Details
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.65rem', marginBottom:'.9rem' }}>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Patient Name</label>
              <input className="form-input" value={report.patientName || ''} readOnly style={{ background:'var(--light)', color:'var(--slate)' }} />
            </div>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Patient ID</label>
              <input className="form-input" value={report.patientId || ''} readOnly style={{ background:'var(--light)', color:'var(--slate)' }} />
            </div>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Age / Gender</label>
              <input className="form-input" value={`${report.patientAge || '—'}${report.patientGender ? ` / ${report.patientGender}` : ''}`} readOnly style={{ background:'var(--light)', color:'var(--slate)' }} />
            </div>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Examination Date</label>
              <input className="form-input" value={report.date || new Date().toLocaleDateString('en-IN')} readOnly style={{ background:'var(--light)', color:'var(--slate)' }} />
            </div>
          </div>

          {/* ── Section 2: Radiographic Examination Details ─────────── */}
          <div style={{ borderBottom:'2px solid var(--teal)', paddingBottom:'.3rem', marginBottom:'.8rem', fontWeight:700, fontSize:'.8rem', color:'var(--teal)', textTransform:'uppercase', letterSpacing:'.06em' }}>
            2. Radiographic Examination Details
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.65rem', marginBottom:'.6rem' }}>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Imaging Modality</label>
              <input className="form-input" value="Intraoral Radiograph (RVG)" readOnly style={{ background:'var(--light)', color:'var(--slate)' }} />
            </div>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Radiograph Type</label>
              <input className="form-input" value="IOPA" readOnly style={{ background:'var(--light)', color:'var(--slate)' }} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Region Examined</label>
            <input className="form-input" value={form.complaint} onChange={set('complaint')} placeholder="e.g. Mandibular Left / Maxillary Right / Mandibular Anterior" />
          </div>
          <div className="form-group">
            <label className="form-label">Technical Limitations</label>
            <select className="form-select" value={form.severity} onChange={set('severity')}>
              <option value="None">☑ No significant technical limitations detected</option>
              <option value="Low">☐ Mild limitation (most findings remain interpretable)</option>
              <option value="Moderate">☐ Moderate limitation (some regions difficult to assess)</option>
              <option value="High">☐ Severe limitation (repeat imaging recommended)</option>
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.65rem', marginBottom:'.9rem' }}>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">AI Model Version</label>
              <input className="form-input" value={report.modelUsed || 'DivulgeAI UNet+ResNet50 v3.1'} readOnly style={{ background:'var(--light)', color:'var(--slate)' }} />
            </div>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Analysis Date & Time</label>
              <input className="form-input" value={report.date || new Date().toLocaleString('en-IN')} readOnly style={{ background:'var(--light)', color:'var(--slate)' }} />
            </div>
          </div>

          {/* ── Section 4: AI Analysis Summary ─────────────────────── */}
          <div style={{ borderBottom:'2px solid var(--teal)', paddingBottom:'.3rem', marginBottom:'.8rem', fontWeight:700, fontSize:'.8rem', color:'var(--teal)', textTransform:'uppercase', letterSpacing:'.06em' }}>
            4. AI Analysis Summary
          </div>
          <div style={{ border:'1.5px solid var(--border)', borderRadius:8, overflow:'hidden', marginBottom:'.9rem' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.78rem' }}>
              <thead>
                <tr style={{ background:'var(--navy)', color:'white' }}>
                  <th style={{ padding:'.5rem .75rem', textAlign:'left', fontWeight:700 }}>Finding</th>
                  <th style={{ padding:'.5rem .75rem', textAlign:'center', fontWeight:700, width:90 }}>Count</th>
                  <th style={{ padding:'.5rem .75rem', textAlign:'center', fontWeight:700, width:110 }}>AI Confidence</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key:'Decayed Teeth',  label:'Dental Caries' },
                  { key:'Restoration',    label:'Restorations' },
                  { key:'Implant',        label:'Dental Implants' },
                  { key:'Bone Level',     label:'Bone Level Changes' },
                  { key:'Healthy Teeth',  label:'Healthy Teeth' },
                ].map(({ key, label }, i) => (
                  <tr key={key} style={{ background: i%2===0 ? 'white' : 'var(--light)' }}>
                    <td style={{ padding:'.4rem .75rem', color:'var(--navy)', fontWeight:600 }}>{label}</td>
                    <td style={{ padding:'.3rem .5rem', textAlign:'center' }}>
                      <input
                        type="text"
                        value={form.aiSummary?.[key]?.count ?? ''}
                        onChange={e => setForm(f => ({
                          ...f,
                          aiSummary: { ...(f.aiSummary||{}), [key]: { ...(f.aiSummary?.[key]||{}), count: e.target.value } }
                        }))}
                        placeholder="—"
                        style={{ width:64, textAlign:'center', padding:'.25rem .4rem', border:'1px solid var(--border)', borderRadius:5, fontSize:'.78rem', background:'transparent', color:'var(--navy)', fontWeight:600 }}
                      />
                    </td>
                    <td style={{ padding:'.3rem .5rem', textAlign:'center' }}>
                      <input
                        type="text"
                        value={form.aiSummary?.[key]?.confidence ?? ''}
                        onChange={e => setForm(f => ({
                          ...f,
                          aiSummary: { ...(f.aiSummary||{}), [key]: { ...(f.aiSummary?.[key]||{}), confidence: e.target.value } }
                        }))}
                        placeholder="—"
                        style={{ width:80, textAlign:'center', padding:'.25rem .4rem', border:'1px solid var(--border)', borderRadius:5, fontSize:'.78rem', background:'transparent', color:'var(--slate)' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Section 5: Patient Information ─────────────────────── */}
          <div style={{ borderBottom:'2px solid var(--teal)', paddingBottom:'.3rem', marginBottom:'.8rem', fontWeight:700, fontSize:'.8rem', color:'var(--teal)', textTransform:'uppercase', letterSpacing:'.06em' }}>
            5. Patient Information
          </div>
          <div className="form-group">
            <label className="form-label">a. What did AI find? <span style={{ fontWeight:400, color:'var(--muted)', textTransform:'none' }}>(edit as needed)</span></label>
            <textarea className="form-textarea" rows={3} value={form.summary} onChange={set('summary')} placeholder="Describe what the AI detected in plain language for the patient…" style={{ minHeight:70 }}/>
          </div>
          <div className="form-group">
            <label className="form-label">b. Why does it matter?</label>
            <textarea className="form-textarea" rows={2} value={form.treatment} onChange={set('treatment')} placeholder="Explain clinical significance and recommended next steps…" style={{ minHeight:60 }}/>
          </div>

          {/* ── Doctor's Teeth Selection ────────────────────────────── */}
          <div style={{ borderBottom:'2px solid var(--teal)', paddingBottom:'.3rem', marginBottom:'.8rem', fontWeight:700, fontSize:'.8rem', color:'var(--teal)', textTransform:'uppercase', letterSpacing:'.06em' }}>
            Affected Teeth (Doctor Selected)
          </div>
          <div className="form-group">
            <label className="form-label">
              Select teeth on the chart below
              {selectedTeeth.size > 0 && (
                <span style={{ marginLeft:8, fontWeight:600, color:'var(--teal)', textTransform:'none', letterSpacing:0, fontSize:'.72rem' }}>
                  {selectedTeeth.size} selected
                </span>
              )}
            </label>
            <ToothPicker selected={selectedTeeth} onChange={handleTeethChange} />
            {selectedTeeth.size > 0 && (
              <div style={{ marginTop:'.5rem', padding:'.5rem .75rem', background:'var(--light)', border:'1.5px solid var(--border)', borderRadius:8, fontSize:'.8rem', color:'var(--slate)', fontWeight:600 }}>
                {form.teeth || '—'}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Doctor's Clinical Notes <span style={{ fontWeight:400, color:'var(--muted)', textTransform:'none', letterSpacing:0 }}>(included in report)</span></label>
            <textarea className="form-textarea" rows={3} value={form.doctorNotes} onChange={set('doctorNotes')} placeholder="Additional clinical observations, correlations with examination, follow-up instructions…" style={{ minHeight:75 }}/>
          </div>

          {/* Image stats */}
          {report.statistics && Object.keys(report.statistics).length > 0 && (
            <div style={{ background:'var(--light)', border:'1.5px solid var(--border)', borderRadius:10, padding:'.85rem', marginBottom:'1rem' }}>
              <div style={{ fontSize:'.65rem', fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'.5rem' }}>Image Statistics</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
                {[['Brightness',report.statistics.brightness],['Contrast',report.statistics.contrast],['Sharpness',report.statistics.sharpness]].map(([l,v])=> v!=null && (
                  <div key={l} style={{ textAlign:'center' }}>
                    <div style={{ fontWeight:700, fontSize:'.88rem', color:'var(--navy)' }}>{v}</div>
                    <div style={{ fontSize:'.62rem', color:'var(--muted)' }}>{l}</div>
                  </div>
                ))}
              </div>
              {report.statistics.operations?.length > 0 && (
                <div style={{ fontSize:'.7rem', color:'var(--slate)', marginTop:'.5rem' }}>
                  Preprocessing: {report.statistics.operations.join(' → ')}
                </div>
              )}
            </div>
          )}

          <div style={{ display:'flex', gap:'.65rem' }}>
            <button className="btn btn-primary" onClick={handleSave}>
              <IC d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z M17 21v-8H7v8 M7 3v5h8" c="white" size={14}/> Save Changes
            </button>
            <button className="btn btn-ghost" onClick={handleDownload} disabled={downloading}>
              {downloading
                ? <><span className="spinner spinner-sm"/> Generating…</>
                : <><IC d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3" size={14}/>
                    Download PDF</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
