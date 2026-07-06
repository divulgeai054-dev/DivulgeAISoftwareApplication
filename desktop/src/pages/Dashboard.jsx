import { useAuth } from '../context/AuthContext'
import { useApp }  from '../context/AppContext'

const StatCard = ({ label, value, sub, color, icon }) => (
  <div className="stat-card">
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'.75rem' }}>
      <div style={{ width:36, height:36, borderRadius:9, background:color+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
      </div>
      <span style={{ fontSize:'.68rem', fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.05em' }}>{label}</span>
    </div>
    <div style={{ fontFamily:'var(--font-head)', fontSize:'1.75rem', fontWeight:800, color:'var(--navy)', letterSpacing:'-.03em', lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:'.72rem', color:'var(--muted)', marginTop:4 }}>{sub}</div>}
  </div>
)

export default function Dashboard() {
  const { user }                         = useAuth()
  const { patients, reports, navigate, openReport } = useApp()

  const pending  = reports.filter(r => r.status === 'AI Generated').length
  const analysed = patients.filter(p => p.status === 'Analysed').length
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="fade-up" style={{ padding:'1.5rem', overflowY:'auto', flex:1 }}>

      {/* Greeting */}
      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontFamily:'var(--font-head)', fontSize:'1.3rem', fontWeight:800, color:'var(--navy)', marginBottom:'.2rem', letterSpacing:'-.02em' }}>
          {greeting}, {user?.name?.replace(/^(Dr\.|Prof\.)\s*/i,'Dr. ') || 'Doctor'} 👋
        </h1>
        <p style={{ color:'var(--muted)', fontSize:'.85rem' }}>
          {user?.hospitalName ? `${user.hospitalName} · ` : ''}Here's your clinic overview
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1.25rem' }}>
        <StatCard label="Total Patients"   value={patients.length} color="#0d9488"
          icon={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}
          sub={`${analysed} analysed`} />
        <StatCard label="Total Reports"    value={reports.length}  color="#06b6d4"
          icon={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>}
          sub="all time" />
        <StatCard label="Pending Review"   value={pending}         color="#f59e0b"
          icon={<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}
          sub={pending > 0 ? 'needs attention' : 'all clear'} />
        <StatCard label="AI Accuracy"      value="97.4%"           color="#10b981"
          icon={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>}
          sub="DivulgeAI v3.1" />
      </div>

      {/* Main grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:'1rem' }}>

        {/* Recent patients */}
        <div className="card" style={{ padding:'1.25rem' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
            <div style={{ fontWeight:800, fontSize:'.92rem', color:'var(--navy)' }}>Recent Patients</div>
            <button className="btn btn-sm btn-ghost" onClick={() => navigate('patients')}>View all</button>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Patient</th><th>Last Visit</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {patients.slice(0, 5).map(p => (
                <tr key={p.id} className="clickable" onClick={() => navigate('patients')}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                      <div style={{ width:30,height:30,borderRadius:'50%',background:'var(--teal-xlight)',border:'1.5px solid var(--teal-light)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.6rem',fontWeight:800,color:'var(--teal)',flexShrink:0 }}>
                        {p.name.split(' ').map(x=>x[0]).join('').slice(0,2)}
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:'.85rem' }}>{p.name}</div>
                        <div style={{ fontSize:'.7rem', color:'var(--muted)' }}>{p.id} · {p.age}y</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize:'.82rem', color:'var(--slate)' }}>{p.lastVisit}</td>
                  <td><span className={`badge ${p.status==='Analysed'?'badge-green':'badge-warn'}`}>{p.status}</span></td>
                  <td>
                    <button className="btn btn-sm btn-primary" onClick={e => { e.stopPropagation(); navigate('analysis',{patient:p}) }}>
                      Analyse
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

          {/* Quick actions */}
          <div className="card" style={{ padding:'1.1rem' }}>
            <div style={{ fontWeight:800, fontSize:'.88rem', color:'var(--navy)', marginBottom:'.85rem' }}>Quick Actions</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'.45rem' }}>
              {[
                { label:'New Analysis', page:'analysis', primary:true,  emoji:'⚡' },
                { label:'Add Patient',  page:'patients', primary:false, emoji:'👤' },
                { label:'All Reports',  page:'reports',  primary:false, emoji:'📋' },
              ].map(({ label, page, primary, emoji }) => (
                <button key={label} className={`btn ${primary?'btn-primary':'btn-ghost'} btn-full`}
                  style={{ justifyContent:'flex-start', gap:9 }} onClick={() => navigate(page)}>
                  <span style={{ fontSize:14 }}>{emoji}</span>{label}
                </button>
              ))}
            </div>
          </div>

          {/* AI status */}
          <div className="card" style={{ padding:'1.1rem' }}>
            <div style={{ fontWeight:800, fontSize:'.88rem', color:'var(--navy)', marginBottom:'.85rem' }}>AI Model Status</div>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:'.75rem' }}>
              <div style={{ width:7,height:7,background:'var(--success)',borderRadius:'50%',animation:'pulse 2s infinite',flexShrink:0 }}/>
              <span style={{ fontSize:'.8rem', fontWeight:600, color:'var(--success)' }}>DivulgeAI v3.1 — Online</span>
            </div>
            {[['Caries Detection','97.4%'],['Periapical Lesion','95.2%'],['Bone Loss','93.8%']].map(([l,v]) => (
              <div key={l} style={{ marginBottom:'.5rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.72rem', color:'var(--slate)', marginBottom:3 }}>
                  <span>{l}</span>
                  <span style={{ fontWeight:700, color:'var(--teal)' }}>{v}</span>
                </div>
                <div className="progress-track" style={{ height:4 }}>
                  <div className="progress-fill" style={{ width:v }}/>
                </div>
              </div>
            ))}
          </div>

          {/* Pending alert */}
          {pending > 0 && (
            <div className="alert alert-warn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <div>
                <div style={{ fontWeight:700, fontSize:'.83rem' }}>{pending} report{pending>1?'s':''} need review</div>
                <button className="btn btn-sm btn-ghost" style={{ marginTop:5 }} onClick={() => navigate('reports')}>
                  Review now →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
