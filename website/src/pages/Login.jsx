import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { loginUser } from '../services/authService'
import { validateLogin } from '../utils/helpers'
import Loader from '../components/Loader'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const fromState    = location.state?.from
  const redirectTo   = fromState?.pathname || '/'
  const redirectHash = fromState?.hash || '#download'
  const [form, setForm]     = useState({ email:'', password:'' })
  const [errors, setErrors] = useState({})
  const [apiErr, setApiErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)
  const set = k => v => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:''})); setApiErr('') }
  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validateLogin(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const { user, token } = await loginUser(form)
      login(user, token)
      navigate(redirectTo, { replace: true })
      if (redirectHash) {
        setTimeout(() => {
          const id = redirectHash.replace('#', '')
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 200)
      }
    }
    catch (err) { setApiErr(err.message||'Sign-in failed. Please try again.') }
    finally { setLoading(false) }
  }
  return (
    <div className="auth-layout" style={{ paddingTop:'var(--nav-h)' }}>
      <div className="auth-form-side">
        <div className="auth-box">
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'2rem', textDecoration:'none' }}>
            <div style={{ width:36, height:36, background:'linear-gradient(135deg,var(--teal),var(--accent))', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            </div>
            <span style={{ fontFamily:'var(--font-head)', fontSize:'1.2rem', fontWeight:800, color:'var(--navy)' }}>DivulgeAI</span>
          </Link>
          <h2 style={{ fontFamily:'var(--font-head)', fontSize:'clamp(1.4rem,4vw,1.75rem)', fontWeight:800, color:'var(--navy)', marginBottom:'.4rem' }}>Welcome back</h2>
          <p style={{ color:'var(--slate)', fontSize:'.88rem', marginBottom:'1.75rem' }}>Sign in to download the desktop application</p>
          {apiErr && <div className="alert alert-error" style={{ marginBottom:'1.25rem' }}>⚠ {apiErr}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className={`form-input${errors.email?' error':''}`} type="email" value={form.email} onChange={e=>set('email')(e.target.value)} placeholder="doctor@clinic.com" autoComplete="email" />
              {errors.email && <p className="form-error">⚠ {errors.email}</p>}
            </div>
            <div className="form-group">
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'.45rem' }}>
                <label className="form-label" style={{ margin:0 }}>Password</label>
                <button type="button" style={{ background:'none', border:'none', color:'var(--teal)', fontSize:'.78rem', fontWeight:700, cursor:'pointer' }}>Forgot password?</button>
              </div>
              <div style={{ position:'relative' }}>
                <input className={`form-input${errors.password?' error':''}`} type={showPw?'text':'password'} value={form.password} onChange={e=>set('password')(e.target.value)} placeholder="Min. 6 characters" style={{ paddingRight:'2.8rem' }} autoComplete="current-password" />
                <button type="button" onClick={()=>setShowPw(s=>!s)} style={{ position:'absolute', right:'.85rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:17, lineHeight:1 }} aria-label="Toggle password">{showPw?'🙈':'👁'}</button>
              </div>
              {errors.password && <p className="form-error">⚠ {errors.password}</p>}
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop:'.5rem', fontSize:'.95rem' }}>
              {loading ? <Loader size="sm" color="#fff" /> : 'Sign In to DivulgeAI →'}
            </button>
          </form>
          <div className="divider">or continue with</div>
          {[['🔵','Google'],['⬛','Microsoft']].map(([ico,name])=>(
            <button key={name} type="button" className="btn btn-ghost btn-full" style={{ marginBottom:'.65rem', fontWeight:600 }} onClick={handleSubmit}>{ico} Continue with {name}</button>
          ))}
          <p style={{ textAlign:'center', fontSize:'.85rem', color:'var(--slate)', marginTop:'1.25rem' }}>
            Don't have an account? <Link to="/register" style={{ color:'var(--teal)', fontWeight:700 }}>Create one free</Link>
          </p>
        </div>
      </div>
      {/* Promo side – hidden on mobile via CSS */}
      <div className="auth-promo-side" style={{ background:'linear-gradient(135deg,var(--teal-dark),var(--navy-mid))' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)', backgroundSize:'40px 40px', pointerEvents:'none' }} />
        <div className="fade-up" style={{ color:'#fff', textAlign:'center', maxWidth:380, position:'relative', zIndex:1 }}>
          <div style={{ fontSize:56, marginBottom:'1.25rem' }}>🦷</div>
          <h2 style={{ fontFamily:'var(--font-head)', fontSize:'1.9rem', fontWeight:800, marginBottom:'1rem', lineHeight:1.2 }}>Smarter Diagnostics Start Here</h2>
          <p style={{ color:'rgba(255,255,255,.62)', lineHeight:1.75, marginBottom:'2rem' }}>Join 1,200+ dental professionals using AI to catch caries earlier and improve patient outcomes.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:'.75rem', textAlign:'left' }}>
            {[['🎯','97.4% detection accuracy on periapical RVGs'],['⚡','AI-generated report in under 2 seconds'],['📋','Downloadable PDF with FDI notation'],['🔒','HIPAA-compliant, end-to-end encrypted'],['📊','Track patient history across all visits']].map(([icon,text])=>(
              <div key={text} style={{ display:'flex', alignItems:'center', gap:'.85rem', background:'rgba(255,255,255,.08)', borderRadius:10, padding:'.85rem 1rem' }}>
                <span style={{ fontSize:18 }}>{icon}</span>
                <span style={{ fontSize:'.88rem', color:'rgba(255,255,255,.85)', lineHeight:1.4 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
