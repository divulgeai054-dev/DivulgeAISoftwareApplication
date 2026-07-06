import { useState } from 'react'
import { useApp }   from '../context/AppContext'

const EMPTY = { name:'', age:'', gender:'Female', phone:'', blood:'B+', notes:'' }
const BLOODS = ['A+','A-','B+','B-','O+','O-','AB+','AB-']

const IC = ({ d, c='currentColor', s=2, size=16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">
    {d.split('|').map((seg,i) => <path key={i} d={seg}/>)}
  </svg>
)

export default function PatientsPage() {
  const { patients, addPatient, updatePatient, deletePatient, navigate } = useApp()

  const [search,    setSearch]    = useState('')
  const [mode,      setMode]      = useState(null)   // null | 'add' | 'edit'
  const [editId,    setEditId]    = useState(null)
  const [form,      setForm]      = useState(EMPTY)
  const [errors,    setErrors]    = useState({})
  const [toast,     setToast]     = useState(null)   // { type, msg }
  const [deleteConf,setDeleteConf]= useState(null)   // patient to confirm delete

  const set = k => e => { setForm(f=>({...f,[k]:e.target.value})); setErrors(e2=>({...e2,[k]:''})) }

  const validate = () => {
    const e = {}
    if (!form.name.trim())                        e.name = 'Name is required.'
    if (!form.age || isNaN(form.age) || form.age < 1 || form.age > 120) e.age = 'Enter a valid age (1–120).'
    return e
  }

  const showToast = (type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  const openAdd = () => {
    setForm(EMPTY); setErrors({}); setMode('add'); setEditId(null)
  }

  const openEdit = (p, e) => {
    e.stopPropagation()
    setForm({
      name:   p.name || '',
      age:    String(p.age || ''),
      gender: p.gender || 'Female',
      phone:  p.phone  || '',
      blood:  p.blood  || 'B+',
      notes:  p.notes  || '',
    })
    setErrors({})
    setMode('edit')
    setEditId(p.id)
    // Scroll form into view after state update
    setTimeout(() => document.getElementById('patient-form')?.scrollIntoView({ behavior:'smooth', block:'start' }), 50)
  }

  const closeForm = () => { setMode(null); setEditId(null); setErrors({}) }

  const handleSave = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    const data = {
      name:   form.name.trim(),
      age:    form.age,
      gender: form.gender,
      phone:  form.phone.trim(),
      blood:  form.blood,
      notes:  form.notes.trim(),
    }

    if (mode === 'add') {
      addPatient(data)
      showToast('success', `Patient "${data.name}" added successfully.`)
    } else {
      updatePatient(editId, data)
      showToast('success', 'Patient record updated successfully.')
    }
    closeForm()
  }

  const handleDelete = () => {
    if (!deleteConf) return
    deletePatient(deleteConf.id)
    showToast('warn', `Patient "${deleteConf.name}" removed.`)
    setDeleteConf(null)
  }

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())   ||
    (p.phone||'').includes(search)
  )

  return (
    <div className="fade-up" style={{ padding:'1.5rem', overflowY:'auto', flex:1 }}>

      {/* Header */}
      <button onClick={() => navigate('dashboard')} style={{ display:'flex',alignItems:'center',gap:5,padding:'.35rem .7rem',background:'transparent',border:'1.5px solid var(--border)',borderRadius:8,cursor:'pointer',color:'var(--slate)',fontSize:'.78rem',fontWeight:600,marginBottom:'1rem',transition:'all .15s',width:'fit-content' }} onMouseEnter={e=>{e.currentTarget.style.background='var(--light)';e.currentTarget.style.borderColor='var(--teal)';e.currentTarget.style.color='var(--teal)'}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--slate)'}}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Dashboard
      </button>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
        <div>
          <h1 className="page-title">Patient Records</h1>
          <p className="page-sub">{patients.length} patients · Manage records and start analyses</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Patient
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`alert alert-${toast.type==='warn'?'warn':'success'} fade-in`} style={{ marginBottom:'1rem' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polyline points="20 6 9 17 4 12"/></svg>
          {toast.msg}
        </div>
      )}

      {/* Add / Edit form */}
      {mode && (
        <div id="patient-form" className="card fade-up" style={{ padding:'1.5rem', marginBottom:'1.25rem', borderColor:'var(--teal)', borderWidth:2 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.1rem' }}>
            <div style={{ fontWeight:800, fontSize:'.95rem', color:'var(--navy)', display:'flex', alignItems:'center', gap:8 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {mode==='add'
                  ? <><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></>
                  : <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>
                }
              </svg>
              {mode==='add' ? 'New Patient' : 'Edit Patient'}
            </div>
            <button onClick={closeForm} style={{ color:'var(--muted)', fontSize:18, padding:'2px 6px', borderRadius:6, transition:'color .15s' }}
              onMouseEnter={e=>e.currentTarget.style.color='var(--danger)'}
              onMouseLeave={e=>e.currentTarget.style.color='var(--muted)'}>✕</button>
          </div>

          <div className="form-grid-2" style={{ gap:'.75rem', marginBottom:'.75rem' }}>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Full Name *</label>
              <input className={`form-input${errors.name?' error':''}`} placeholder="Priya Sharma" value={form.name} onChange={set('name')} />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Patient ID</label>
              <input className="form-input" value={mode==='edit' ? editId : `DVG-${String(patients.length+1).padStart(3,'0')}`} readOnly />
            </div>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Age *</label>
              <input className={`form-input${errors.age?' error':''}`} type="number" placeholder="35" min="1" max="120" value={form.age} onChange={set('age')} />
              {errors.age && <div className="form-error">{errors.age}</div>}
            </div>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Gender</label>
              <select className="form-select" value={form.gender} onChange={set('gender')}>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Phone</label>
              <input className="form-input" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
            </div>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Blood Group</label>
              <select className="form-select" value={form.blood} onChange={set('blood')}>
                {BLOODS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Medical Notes</label>
            <textarea className="form-textarea" rows={2} placeholder="Allergies, medications, previous dental history…" value={form.notes} onChange={set('notes')} />
          </div>

          <div style={{ display:'flex', gap:'.6rem' }}>
            <button className="btn btn-primary" onClick={handleSave}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {mode==='add' ? 'Save Patient' : 'Update Patient'}
            </button>
            <button className="btn btn-ghost" onClick={closeForm}>Cancel</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ position:'relative', marginBottom:'1rem' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input className="form-input" style={{ paddingLeft:34 }} placeholder="Search by name, ID, or phone…" value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Age</th>
              <th>Blood</th>
              <th>Phone</th>
              <th>Last Visit</th>
              <th>Status</th>
              <th style={{ textAlign:'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign:'center', padding:'3rem', color:'var(--muted)' }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>🦷</div>
                  {search ? 'No patients match your search.' : 'No patients yet. Click "Add Patient" to get started.'}
                </td>
              </tr>
            ) : filtered.map(p => (
              <tr key={p.id} className="clickable" onClick={() => navigate('analysis', { patient:p })}>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                    <div style={{ width:32,height:32,borderRadius:'50%',background:'var(--teal-xlight)',border:'1.5px solid var(--teal-light)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.62rem',fontWeight:800,color:'var(--teal)',flexShrink:0 }}>
                      {p.name.split(' ').map(x=>x[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:'.88rem' }}>{p.name}</div>
                      <div style={{ fontSize:'.7rem', color:'var(--muted)' }}>{p.id}</div>
                    </div>
                  </div>
                </td>
                <td style={{ color:'var(--slate)', fontSize:'.85rem' }}>{p.age}</td>
                <td><span className="badge badge-navy">{p.blood||'—'}</span></td>
                <td style={{ color:'var(--slate)', fontSize:'.83rem' }}>{p.phone||'—'}</td>
                <td style={{ color:'var(--slate)', fontSize:'.83rem' }}>{p.lastVisit}</td>
                <td>
                  <span className={`badge ${p.status==='Analysed'?'badge-green':'badge-warn'}`}>
                    {p.status}
                  </span>
                </td>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:4, justifyContent:'flex-end' }}>
                    <button className="btn btn-sm btn-ghost" title="View Reports"
                      onClick={e=>{ e.stopPropagation(); navigate('reports',{patient:p}) }}>
                      Reports
                    </button>
                    <button className="btn btn-sm btn-primary" title="Run Analysis"
                      onClick={e=>{ e.stopPropagation(); navigate('analysis',{patient:p}) }}>
                      Analyse
                    </button>
                    <button className="btn btn-sm btn-subtle btn-icon" title="Edit patient"
                      onClick={e=>openEdit(p,e)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className="btn btn-sm btn-icon" title="Delete patient"
                      style={{ background:'rgba(239,68,68,.08)', color:'var(--danger)', border:'1.5px solid rgba(239,68,68,.15)' }}
                      onClick={e=>{ e.stopPropagation(); setDeleteConf(p) }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation modal */}
      {deleteConf && (
        <>
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:1000, backdropFilter:'blur(2px)' }} onClick={()=>setDeleteConf(null)} />
          <div className="fade-up" style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:1001, background:'#fff', borderRadius:16, padding:'1.75rem', width:380, boxShadow:'0 24px 64px rgba(0,0,0,.2)', border:'1.5px solid var(--border)' }}>
            <div style={{ width:44,height:44,background:'#fef2f2',border:'1.5px solid #fecaca',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1rem' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
            <h3 style={{ fontFamily:'var(--font-head)', fontSize:'1.1rem', fontWeight:800, color:'var(--navy)', textAlign:'center', marginBottom:'.5rem' }}>Delete Patient?</h3>
            <p style={{ color:'var(--slate)', fontSize:'.85rem', textAlign:'center', lineHeight:1.65, marginBottom:'1.5rem' }}>
              This will permanently remove <strong>{deleteConf.name}</strong> and all their records. This action cannot be undone.
            </p>
            <div style={{ display:'flex', gap:'.6rem' }}>
              <button className="btn btn-ghost btn-full" onClick={()=>setDeleteConf(null)}>Cancel</button>
              <button className="btn btn-danger btn-full" onClick={handleDelete}>Delete Patient</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
