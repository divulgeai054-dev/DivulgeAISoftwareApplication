import { useState } from 'react'
import { useApp }   from '../context/AppContext'
import { useAuth }  from '../context/AuthContext'

const NAV = [
  { id:'dashboard', label:'Dashboard',    icon:'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z' },
  { id:'patients',  label:'Patients',     icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
]

export const AI_MODELS = [
  { id:'unet_resnet50', label:'UNet + ResNet50',    badge:'Active',     badgeColor:'#0d9488', desc:'Best overall accuracy' },
  { id:'unet_vgg16',    label:'UNet + VGG16',       badge:'Fast',       badgeColor:'#06b6d4', desc:'Faster, lower accuracy' },
  { id:'unet_densenet', label:'UNet + DenseNet121', badge:'Detail',     badgeColor:'#8b5cf6', desc:'High detail segmentation' },
  { id:'ensemble',      label:'Ensemble',           badge:'Enterprise', badgeColor:'#f59e0b', desc:'All models combined' },
]

const NavIcon = ({ d }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
)

export default function Sidebar() {
  const { page, navigate, reports }  = useApp()
  const { user, logout }             = useAuth()
  const [modelOpen, setModelOpen]    = useState(false)
  const [selModel,  setSelModel]     = useState(() => localStorage.getItem('divulgeai_model') || 'unet_resnet50')
  const [patientsOpen, setPatientsOpen] = useState(true)

  const active = page === 'dashboard' ? 'dashboard' : 'patients'
  const pending = reports.filter(r => r.status === 'AI Generated').length
  const activeModel = AI_MODELS.find(m => m.id === selModel) || AI_MODELS[0]

  const initials = user?.name
    ? user.name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s*/i,'').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
    : 'DR'

  const pickModel = id => { setSelModel(id); localStorage.setItem('divulgeai_model',id); setModelOpen(false) }

  return (
    <>
      <aside style={{ width:'var(--sidebar-w)', background:'var(--navy)', display:'flex', flexDirection:'column', flexShrink:0, borderRight:'1px solid rgba(255,255,255,.06)' }}>

        {/* Brand */}
        <div style={{ padding:'1.1rem 1rem', borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:30,height:30,background:'linear-gradient(135deg,#0d9488,#06b6d4)',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
          <div>
            <div style={{ fontFamily:'var(--font-head)', fontSize:'.95rem', fontWeight:800, color:'#fff', letterSpacing:'-.02em' }}>
              Divulge<span style={{ color:'#99f6e4' }}>AI</span>
            </div>
            <div style={{ fontSize:'.58rem', color:'rgba(255,255,255,.28)', fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase' }}>Clinical Platform</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding:'.6rem .5rem', flex:1 }}>
          {NAV.map(({ id, label, icon }) => (
            <div key={id} style={{ marginBottom: id==='patients' ? 0 : 2 }}>
              <button className={`nav-item${active===id?' active':''}`} onClick={() => {
                navigate(id)
                if (id === 'patients') setPatientsOpen(o => !o)
              }} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:2 }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                  <NavIcon d={icon} />
                  {label}
                </span>
                {id === 'patients' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: patientsOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )}
              </button>

              {id === 'patients' && patientsOpen && (
                <div style={{ display:'grid', gap:4, paddingLeft:16, marginBottom:8 }}>
                  {/* New Analysis — top of dropdown, prominent teal button */}
                  <button
                    onClick={() => navigate('analysis')}
                    style={{ display:'flex', alignItems:'center', gap:7, padding:'.42rem .7rem', borderRadius:8, background:'linear-gradient(135deg,rgba(13,148,136,.25),rgba(6,182,212,.15))', border:'1px solid rgba(13,148,136,.35)', cursor:'pointer', color:'#99f6e4', fontWeight:700, fontSize:'.73rem', transition:'all .15s', marginBottom:2 }}
                    onMouseEnter={e=>e.currentTarget.style.background='linear-gradient(135deg,rgba(13,148,136,.4),rgba(6,182,212,.25))'}
                    onMouseLeave={e=>e.currentTarget.style.background='linear-gradient(135deg,rgba(13,148,136,.25),rgba(6,182,212,.15))'}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    New Analysis
                  </button>
                  <button className="nav-subitem" onClick={() => navigate('patients')}>Patient History</button>
                  <button className="nav-subitem" onClick={() => navigate('reports')}>
                    Reports{pending > 0 ? ` (${pending})` : ''}
                  </button>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* AI Model selector */}
        <div style={{ margin:'0 .5rem .5rem' }}>
          <button onClick={()=>setModelOpen(o=>!o)} style={{ width:'100%', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:10, padding:'.7rem .85rem', cursor:'pointer', textAlign:'left', transition:'background .15s' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.07)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.04)'}>
            <div style={{ fontSize:'.6rem', fontWeight:700, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:5 }}>AI Model</div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'.78rem', fontWeight:700, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{activeModel.label}</div>
                <div style={{ fontSize:'.62rem', color:'rgba(255,255,255,.35)', marginTop:1 }}>{activeModel.desc}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                <span style={{ fontSize:'.58rem', fontWeight:700, padding:'2px 6px', borderRadius:100, background:activeModel.badgeColor+'28', color:activeModel.badgeColor }}>{activeModel.badge}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform:modelOpen?'rotate(180deg)':'none', transition:'transform .2s' }}><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          </button>
        </div>

        {/* Plan */}
        <div style={{ margin:'0 .5rem .5rem', background:'rgba(13,148,136,.08)', border:'1px solid rgba(13,148,136,.15)', borderRadius:10, padding:'.65rem .85rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
            <div style={{ fontSize:'.65rem', fontWeight:700, color:'var(--teal-light)' }}>{user?.plan||'Starter'} Plan</div>
            <div style={{ fontSize:'.6rem', color:'rgba(255,255,255,.3)' }}>482/500</div>
          </div>
          <div style={{ height:3, background:'rgba(255,255,255,.08)', borderRadius:2 }}>
            <div style={{ height:3, width:'96%', background:'var(--teal)', borderRadius:2 }}/>
          </div>
        </div>

        {/* Doctor profile */}
        <div style={{ padding:'.85rem .75rem', borderTop:'1px solid rgba(255,255,255,.06)' }}>
          {user?.hospitalName && (
            <div style={{ fontSize:'.62rem', color:'rgba(255,255,255,.28)', marginBottom:7, display:'flex', alignItems:'center', gap:5, overflow:'hidden' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.hospitalName}</span>
            </div>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,var(--teal),var(--accent))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.65rem',fontWeight:800,color:'#fff',flexShrink:0 }}>
              {initials}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'.78rem', fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name||'Doctor'}</div>
              <div style={{ fontSize:'.62rem', color:'rgba(255,255,255,.3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.specialization||user?.email||''}</div>
            </div>
            <button title="Sign out" onClick={logout}
              style={{ color:'rgba(255,255,255,.28)', padding:4, borderRadius:6, flexShrink:0, transition:'color .15s' }}
              onMouseEnter={e=>e.currentTarget.style.color='#ef4444'}
              onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,.28)'}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Model picker dropdown */}
      {modelOpen && (
        <>
          <div style={{ position:'fixed', inset:0, zIndex:998 }} onClick={()=>setModelOpen(false)}/>
          <div className="fade-up" style={{ position:'fixed', left:'var(--sidebar-w)', bottom:110, zIndex:999, width:310, background:'#fff', border:'1.5px solid var(--border)', borderRadius:14, boxShadow:'0 16px 48px rgba(0,0,0,.15)', overflow:'hidden' }}>
            <div style={{ padding:'.8rem 1rem', background:'var(--light)', borderBottom:'1px solid var(--border)' }}>
              <div style={{ fontWeight:800, fontSize:'.85rem', color:'var(--navy)' }}>Select AI Model</div>
              <div style={{ fontSize:'.72rem', color:'var(--muted)', marginTop:2 }}>Applied to all new analyses</div>
            </div>
            {AI_MODELS.map(m => (
              <div key={m.id} onClick={()=>pickModel(m.id)}
                style={{ padding:'.8rem 1rem', cursor:'pointer', background:selModel===m.id?'var(--teal-xlight)':'transparent', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10, transition:'background .12s' }}
                onMouseEnter={e=>{if(selModel!==m.id)e.currentTarget.style.background='var(--light)'}}
                onMouseLeave={e=>{if(selModel!==m.id)e.currentTarget.style.background='transparent'}}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                    <span style={{ fontWeight:700, fontSize:'.85rem', color:'var(--navy)' }}>{m.label}</span>
                    <span style={{ fontSize:'.6rem', fontWeight:700, padding:'2px 6px', borderRadius:100, background:m.badgeColor+'18', color:m.badgeColor }}>{m.badge}</span>
                  </div>
                  <div style={{ fontSize:'.73rem', color:'var(--muted)' }}>{m.desc}</div>
                </div>
                {selModel===m.id && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
