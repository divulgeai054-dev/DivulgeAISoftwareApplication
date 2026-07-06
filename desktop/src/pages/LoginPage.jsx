import { useState } from 'react'
import { useAuth }   from '../context/AuthContext'
import { loginUser, devLogin, registerDesktopUser } from '../services/authService'

const SPECS  = ['General Dentistry','Orthodontics','Periodontology','Endodontics','Oral Surgery','Prosthodontics','Pediatric Dentistry','Oral Radiology']
const TITLES = ['Dr.','Prof.','Mr.','Ms.','Mrs.']

const Logo = () => (
  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
    <div style={{ width:36,height:36,background:'linear-gradient(135deg,#0d9488,#06b6d4)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 4px 12px rgba(13,148,136,.35)' }}>
      <svg width="19" height="19" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
    </div>
    <div>
      <div style={{ fontFamily:'var(--font-head)', fontSize:'1.15rem', fontWeight:800, color:'#fff', letterSpacing:'-.02em' }}>
        Divulge<span style={{ color:'#99f6e4' }}>AI</span>
      </div>
      <div style={{ fontSize:'.6rem', color:'rgba(255,255,255,.35)', fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase' }}>Clinical Platform</div>
    </div>
  </div>
)

const EyeIcon = ({ show }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {show ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
  </svg>
)

export default function LoginPage() {
  const { login } = useAuth()
  const [view,    setView]    = useState('signin')   // 'signin' | 'register'
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [showPw,  setShowPw]  = useState(false)

  const [lf, setLf] = useState({ email:'', password:'' })
  const sl = k => e => { setLf(f=>({...f,[k]:e.target.value})); setError('') }

  const [rf, setRf] = useState({ title:'Dr.', name:'', hospital:'', spec:'', phone:'', email:'', password:'', confirm:'' })
  const sr = k => e => { setRf(f=>({...f,[k]:e.target.value})); setError('') }

  const handleSignIn = async e => {
    e?.preventDefault()
    if (!lf.email || !lf.password) { setError('Please fill in all fields.'); return }
    setError(''); setLoading(true)
    try {
      const { user, token } = await loginUser(lf)
      login(user, token)
    } catch(err) {
      if (err.message === 'invalid_credentials') {
        setError('No profile found on this device. Please register first.')
      } else {
        setError(err.message || 'Sign in failed.')
      }
    } finally { setLoading(false) }
  }

  const handleRegister = async e => {
    e?.preventDefault()
    if (!rf.name.trim() || !rf.hospital.trim() || !rf.email.trim()) { setError('Name, hospital and email are required.'); return }
    if (rf.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (rf.password !== rf.confirm) { setError('Passwords do not match.'); return }
    setError(''); setLoading(true)
    try {
      const { user, token } = registerDesktopUser({
        name: `${rf.title} ${rf.name}`.trim(),
        email: rf.email, password: rf.password,
        hospitalName: rf.hospital, specialization: rf.spec, phone: rf.phone,
      })
      login(user, token)
    } catch(err) {
      if (err.message?.includes('already exists')) {
        try {
          const { user, token } = await loginUser({ email: rf.email, password: rf.password })
          login(user, token)
        } catch {
          setError('Profile exists. Use Sign In with your password.')
        }
      } else { setError(err.message || 'Registration failed.') }
    } finally { setLoading(false) }
  }

  return (
    <div style={{ flex:1, display:'flex', overflow:'hidden', background:'#0c1a2e' }}>

      {/* ── Left panel — branding ─────────────────────────────── */}
      <div style={{ width:380, flexShrink:0, background:'linear-gradient(160deg,#0c1a2e 0%,#1e3a5f 50%,#0c2a1e 100%)', padding:'2.5rem', display:'flex', flexDirection:'column', justifyContent:'space-between', position:'relative', overflow:'hidden' }}>
        {/* Grid bg */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)', backgroundSize:'40px 40px', pointerEvents:'none' }} />
        {/* Glow */}
        <div style={{ position:'absolute', top:-80, left:-80, width:320, height:320, background:'radial-gradient(circle,rgba(13,148,136,.25),transparent 70%)', pointerEvents:'none' }} />

        <div style={{ position:'relative', zIndex:1 }}>
          <Logo />
          <div style={{ marginTop:'3rem' }}>
            <h1 style={{ fontFamily:'var(--font-head)', fontSize:'1.8rem', fontWeight:800, color:'#fff', lineHeight:1.2, marginBottom:'1rem', letterSpacing:'-.03em' }}>
              AI-Powered<br/>Dental Diagnostics
            </h1>
            <p style={{ color:'rgba(255,255,255,.5)', fontSize:'.88rem', lineHeight:1.75, marginBottom:'2rem' }}>
              Detect caries, bone loss, and pathologies from RVG images with clinical-grade AI confidence.
            </p>
            {[
              ['97.4%', 'Detection accuracy'],
              ['0.8s',  'Average inference time'],
              ['1,200+','Active clinics worldwide'],
            ].map(([v,l]) => (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'.85rem' }}>
                <div style={{ fontFamily:'var(--font-head)', fontSize:'1.1rem', fontWeight:800, color:'#99f6e4', minWidth:58 }}>{v}</div>
                <div style={{ fontSize:'.82rem', color:'rgba(255,255,255,.45)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ height:1, background:'rgba(255,255,255,.08)', marginBottom:'1rem' }} />
          <p style={{ fontSize:'.72rem', color:'rgba(255,255,255,.25)', lineHeight:1.6 }}>
            HIPAA compliant · End-to-end encrypted · ISO 27001
          </p>
        </div>
      </div>

      {/* ── Right panel — form ────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem', background:'#f8fafc', overflow:'auto' }}>
        <div className="fade-up" style={{ width:'100%', maxWidth: view==='register' ? 500 : 420 }}>

          {/* Header */}
          <div style={{ marginBottom:'2rem' }}>
            <h2 style={{ fontFamily:'var(--font-head)', fontSize:'1.5rem', fontWeight:800, color:'var(--navy)', marginBottom:'.3rem', letterSpacing:'-.02em' }}>
              {view === 'signin' ? 'Sign in to your account' : 'Create your profile'}
            </h2>
            <p style={{ color:'var(--muted)', fontSize:'.85rem' }}>
              {view === 'signin'
                ? 'Enter your credentials to access the clinical platform'
                : 'Set up your doctor profile — appears on all generated reports'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom:'1.25rem' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {/* ── SIGN IN ──────────────────────────────────────── */}
          {view === 'signin' && (
            <form onSubmit={handleSignIn} style={{ background:'#fff', borderRadius:16, border:'1.5px solid var(--border)', padding:'1.75rem', boxShadow:'0 2px 16px rgba(0,0,0,.06)' }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" placeholder="doctor@clinic.com" value={lf.email} onChange={sl('email')} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position:'relative' }}>
                  <input className="form-input" type={showPw?'text':'password'} placeholder="••••••••" value={lf.password} onChange={sl('password')} style={{ paddingRight:'2.75rem' }} />
                  <button type="button" onClick={()=>setShowPw(s=>!s)} style={{ position:'absolute', right:'.85rem', top:'50%', transform:'translateY(-50%)', color:'var(--muted)', padding:0 }}>
                    <EyeIcon show={showPw} />
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop:'.25rem' }} disabled={loading}>
                {loading ? <><span className="spinner spinner-sm"/>Signing in…</> : 'Sign In →'}
              </button>

              <div style={{ display:'flex', alignItems:'center', gap:'1rem', margin:'1.25rem 0' }}>
                <div style={{ flex:1, height:1, background:'var(--border)' }}/>
                <span style={{ fontSize:'.72rem', color:'var(--muted)', fontWeight:600 }}>OR</span>
                <div style={{ flex:1, height:1, background:'var(--border)' }}/>
              </div>

              <button type="button" onClick={()=>{ const r=devLogin(); login(r.user,r.token) }} className="btn btn-subtle btn-full" style={{ fontSize:'.82rem' }}>
                ⚡ Continue with Demo Account
              </button>
            </form>
          )}

          {/* ── REGISTER ─────────────────────────────────────── */}
          {view === 'register' && (
            <form onSubmit={handleRegister} style={{ background:'#fff', borderRadius:16, border:'1.5px solid var(--border)', padding:'1.75rem', boxShadow:'0 2px 16px rgba(0,0,0,.06)' }}>

              <div className="form-group">
                <label className="form-label">Doctor Name *</label>
                <div style={{ display:'flex', gap:'.5rem' }}>
                  <select className="form-select" value={rf.title} onChange={sr('title')} style={{ width:82, flexShrink:0 }}>
                    {TITLES.map(t=><option key={t}>{t}</option>)}
                  </select>
                  <input className="form-input" placeholder="Full name" value={rf.name} onChange={sr('name')} style={{ flex:1 }} autoFocus />
                </div>
                <p className="form-hint">Appears on every AI-generated report</p>
              </div>

              <div className="form-group">
                <label className="form-label">Hospital / Clinic *</label>
                <input className="form-input" placeholder="e.g. Apollo Dental Centre, Mumbai" value={rf.hospital} onChange={sr('hospital')} />
                <p className="form-hint">Shown as header on PDF reports</p>
              </div>

              <div className="form-grid-2" style={{ marginBottom:'.9rem' }}>
                <div>
                  <label className="form-label">Specialization</label>
                  <select className="form-select" value={rf.spec} onChange={sr('spec')}>
                    <option value="">Select…</option>
                    {SPECS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input className="form-input" placeholder="+91 98765 43210" value={rf.phone} onChange={sr('phone')} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address * <span style={{ fontWeight:400, textTransform:'none', color:'var(--muted)' }}>(same as website)</span></label>
                <input className="form-input" type="email" placeholder="doctor@clinic.com" value={rf.email} onChange={sr('email')} />
              </div>

              <div className="form-grid-2" style={{ marginBottom:'.5rem' }}>
                <div>
                  <label className="form-label">Password *</label>
                  <div style={{ position:'relative' }}>
                    <input className="form-input" type={showPw?'text':'password'} placeholder="Min. 6 chars" value={rf.password} onChange={sr('password')} style={{ paddingRight:'2.75rem' }} />
                    <button type="button" onClick={()=>setShowPw(s=>!s)} style={{ position:'absolute', right:'.85rem', top:'50%', transform:'translateY(-50%)', color:'var(--muted)', padding:0 }}>
                      <EyeIcon show={showPw} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="form-label">Confirm Password *</label>
                  <input className="form-input" type="password" placeholder="Repeat password" value={rf.confirm} onChange={sr('confirm')} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop:'1rem' }} disabled={loading}>
                {loading ? <><span className="spinner spinner-sm"/>Creating profile…</> : 'Create Profile & Enter App →'}
              </button>
            </form>
          )}

          {/* Toggle */}
          <p style={{ textAlign:'center', fontSize:'.84rem', color:'var(--muted)', marginTop:'1.25rem' }}>
            {view === 'signin' ? (
              <>First time on this device?{' '}
                <button onClick={()=>{setView('register');setError('')}} style={{ color:'var(--teal)', fontWeight:700, fontSize:'.84rem', background:'none', border:'none', cursor:'pointer', padding:0 }}>
                  Create your profile
                </button>
              </>
            ) : (
              <>Already set up?{' '}
                <button onClick={()=>{setView('signin');setError('')}} style={{ color:'var(--teal)', fontWeight:700, fontSize:'.84rem', background:'none', border:'none', cursor:'pointer', padding:0 }}>
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
