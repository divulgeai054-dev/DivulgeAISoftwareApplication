import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function Download() {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  const handleDownload = () => {
    if (!isAuthenticated) {
      // Send them to login, and bring them back to #download after
      navigate('/login', { state: { from: { pathname: '/', hash: '#download' } } })
      return
    }
    // Replace with your actual .exe download URL
    alert('Download starting… (replace this with your actual .exe download link)')
  }

  const STEPS = [
    { num:'01', icon:'🌐', title:'Visit Website',          desc:'Browse to divulgeai.com to view product details and plans.' },
    { num:'02', icon:'👤', title:'Create / Sign In',       desc:'Register a free account or sign in with your existing credentials.' },
    { num:'03', icon:'⬇',  title:'Download EXE',           desc:'Click the Download button — available instantly after login.' },
    { num:'04', icon:'⚙',  title:'Install & Open',         desc:'Run the installer and launch the DivulgeAI desktop application.' },
    { num:'05', icon:'🔐', title:'Login with Same Credentials', desc:'Use your website email and password to log in to the desktop app.' },
    { num:'06', icon:'🦷', title:'Upload RVG & Get Report', desc:'Select a patient, upload their X-ray, and receive an AI report in seconds.' },
  ]

  return (
    <section id="download" className="section" style={{ background:'var(--navy)', position:'relative', overflow:'hidden' }}>
      {/* Background accent */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 70% 50%,rgba(13,148,136,.13) 0%,transparent 60%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px)', backgroundSize:'48px 48px', pointerEvents:'none' }} />

      <div className="container" style={{ position:'relative', zIndex:1 }}>
        <div className="text-center" style={{ marginBottom:'3.5rem' }}>
          <span className="section-tag" style={{ background:'rgba(13,148,136,.2)', color:'var(--teal-light)', border:'1px solid rgba(13,148,136,.3)' }}>Download</span>
          <h2 className="section-title" style={{ marginTop:'1rem', color:'#fff' }}>Get DivulgeAI Desktop</h2>
          <p className="section-sub" style={{ color:'rgba(255,255,255,.55)' }}>
            A dedicated Windows desktop application — optimised for clinic workflows, no browser needed.
          </p>
        </div>

        {/* Download card */}
        <div style={{ maxWidth:580, margin:'0 auto 4rem', background:'rgba(255,255,255,.05)', border:`1px solid ${isAuthenticated ? 'rgba(13,148,136,.45)' : 'rgba(255,255,255,.12)'}`, borderRadius:24, padding:'2.5rem', textAlign:'center', backdropFilter:'blur(12px)' }}>

          <div style={{ width:72, height:72, background:'linear-gradient(135deg,var(--teal),var(--accent))', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem', fontSize:32 }}>
            💻
          </div>

          <h3 style={{ fontFamily:'var(--font-head)', fontSize:'1.5rem', fontWeight:800, color:'#fff', marginBottom:'.5rem' }}>DivulgeAI for Windows</h3>
          <p style={{ color:'rgba(255,255,255,.5)', fontSize:'.88rem', marginBottom:'1.75rem' }}>
            Version 2.4.1 · Windows 10 / 11 · 64-bit · ~85 MB
          </p>

          {/* Logged-in: show user info + active download */}
          {isAuthenticated ? (
            <>
              <div style={{ background:'rgba(13,148,136,.12)', border:'1px solid rgba(13,148,136,.25)', borderRadius:12, padding:'.85rem 1.2rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'.75rem' }}>
                <span style={{ fontSize:20 }}>✅</span>
                <div style={{ textAlign:'left' }}>
                  <div style={{ color:'var(--teal-light)', fontWeight:700, fontSize:'.88rem' }}>Signed in as {user?.name}</div>
                  <div style={{ color:'rgba(255,255,255,.45)', fontSize:'.76rem', marginTop:2 }}>Use <strong style={{ color:'rgba(255,255,255,.7)' }}>{user?.email}</strong> to log in to the desktop app</div>
                </div>
              </div>

              <button onClick={handleDownload} className="btn btn-primary btn-lg" style={{ width:'100%', justifyContent:'center', fontSize:'1rem', padding:'1rem', marginBottom:'1rem' }}>
                <svg width="20" height="20" fill="white" viewBox="0 0 24 24" style={{ flexShrink:0 }}><path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5v-2z"/></svg>
                Download for Windows (.exe)
              </button>
            </>
          ) : (
            /* Logged-out: locked state */
            <>
              {/* Locked overlay hint */}
              <div style={{ background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.25)', borderRadius:12, padding:'.85rem 1.2rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'.75rem' }}>
                <span style={{ fontSize:20 }}>🔒</span>
                <div style={{ textAlign:'left' }}>
                  <div style={{ color:'#f59e0b', fontWeight:700, fontSize:'.88rem' }}>Sign in to download</div>
                  <div style={{ color:'rgba(255,255,255,.45)', fontSize:'.76rem', marginTop:2 }}>A free account is required — you'll use the same credentials in the desktop app</div>
                </div>
              </div>

              {/* Two CTAs side by side */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem', marginBottom:'1rem' }}>
                <button
                  onClick={() => navigate('/login', { state: { from: { pathname: '/', hash: '#download' } } })}
                  className="btn btn-primary btn-lg"
                  style={{ justifyContent:'center', fontSize:'.9rem', padding:'.85rem' }}>
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/register', { state: { from: { pathname: '/', hash: '#download' } } })}
                  className="btn btn-outline btn-lg"
                  style={{ justifyContent:'center', fontSize:'.9rem', padding:'.85rem', color:'#fff', borderColor:'rgba(255,255,255,.25)' }}>
                  Create Account
                </button>
              </div>

              {/* Greyed-out disabled download button */}
              <button disabled style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'1rem', borderRadius:10, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)', color:'rgba(255,255,255,.25)', fontSize:'.95rem', cursor:'not-allowed', fontFamily:'var(--font-body)', fontWeight:600 }}>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5v-2z"/></svg>
                Download for Windows (.exe)
              </button>
            </>
          )}

          <div style={{ display:'flex', justifyContent:'center', gap:'1.5rem', flexWrap:'wrap', marginTop:'1rem' }}>
            {[['🔒','Secure & verified'],['🆓','Free trial included'],['🖥','Windows 10 / 11']].map(([icon,text]) => (
              <span key={text} style={{ fontSize:'.75rem', color:'rgba(255,255,255,.35)', display:'flex', alignItems:'center', gap:4 }}>
                {icon} {text}
              </span>
            ))}
          </div>
        </div>

        {/* How it works steps */}
        <div style={{ marginBottom:'1rem' }}>
          <h3 style={{ fontFamily:'var(--font-head)', fontSize:'1.2rem', fontWeight:700, color:'#fff', textAlign:'center', marginBottom:'2.5rem' }}>
            How It Works
          </h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'1.25rem' }}>
            {STEPS.map(({ num, icon, title, desc }) => (
              <div key={num} className="fade-up" style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:16, padding:'1.5rem', display:'flex', gap:'1rem', alignItems:'flex-start' }}>
                <div style={{ minWidth:44, height:44, background:'rgba(13,148,136,.18)', border:'1px solid rgba(13,148,136,.3)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontSize:'.65rem', fontWeight:700, color:'var(--teal-light)', letterSpacing:'.08em', marginBottom:4 }}>STEP {num}</div>
                  <div style={{ fontWeight:700, color:'#fff', fontSize:'.95rem', marginBottom:4 }}>{title}</div>
                  <div style={{ color:'rgba(255,255,255,.45)', fontSize:'.82rem', lineHeight:1.65 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ textAlign:'center', color:'rgba(255,255,255,.25)', fontSize:'.78rem', marginTop:'2rem' }}>
          Requires Windows 10 or later · 4 GB RAM minimum · Internet connection for AI inference
        </p>
      </div>
    </section>
  )
}
