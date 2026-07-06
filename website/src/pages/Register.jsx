import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { registerUser } from '../services/authService'
import { validateRegister } from '../utils/helpers'
import Loader from '../components/Loader'

export default function Register() {
  const { login }    = useAuth()
  const navigate     = useNavigate()
  const location     = useLocation()
  const fromState    = location.state?.from
  const redirectTo   = fromState?.pathname || '/'
  const redirectHash = fromState?.hash     || '#download'

  const [form, setForm]     = useState({ name:'', doctorTitle:'Dr.', hospitalName:'', specialization:'', phone:'', email:'', password:'', confirm:'' })
  const [errors, setErrors] = useState({})
  const [apiErr, setApiErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)
  const [agreed, setAgreed]   = useState(false)

  const set = k => v => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); setApiErr('') }

  const validate = () => {
    const e = {}
    if (!form.name.trim())            e.name         = 'Full name is required.'
    if (!form.hospitalName.trim())    e.hospitalName  = 'Hospital / clinic name is required.'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required.'
    if (form.password.length < 6)     e.password      = 'Password must be at least 6 characters.'
    if (form.password !== form.confirm) e.confirm     = 'Passwords do not match.'
    return e
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!agreed) { setApiErr('Please accept the Terms of Service.'); return }
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const payload = {
        name:          `${form.doctorTitle} ${form.name}`.trim(),
        email:         form.email,
        password:      form.password,
        hospitalName:  form.hospitalName,
        specialization:form.specialization,
        phone:         form.phone,
        role:          'dentist',
      }
      const { user, token } = await registerUser(payload)
      login(user, token)
      navigate(redirectTo, { replace: true })
      if (redirectHash) {
        setTimeout(() => {
          document.getElementById(redirectHash.replace('#', ''))?.scrollIntoView({ behavior:'smooth', block:'start' })
        }, 200)
      }
    } catch (err) {
      setApiErr(err.message || 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  const TITLES   = ['Dr.', 'Prof.', 'Mr.', 'Ms.', 'Mrs.']
  const SPECS    = ['General Dentistry','Orthodontics','Periodontology','Endodontics','Oral Surgery','Prosthodontics','Pediatric Dentistry','Oral Radiology']

  return (
    <div className="auth-layout" style={{ paddingTop:'var(--nav-h)' }}>

      {/* Promo side */}
      <div className="auth-promo-side" style={{ background:'linear-gradient(135deg,var(--navy-mid),var(--teal-dark))' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)', backgroundSize:'40px 40px', pointerEvents:'none' }} />
        <div className="fade-up" style={{ color:'#fff', maxWidth:380, position:'relative', zIndex:1 }}>
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'2rem', textDecoration:'none' }}>
            <div style={{ width:36,height:36,background:'linear-gradient(135deg,var(--teal),var(--accent))',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center' }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            </div>
            <span style={{ fontFamily:'var(--font-head)', fontSize:'1.2rem', fontWeight:800 }}>DivulgeAI</span>
          </Link>
          <h2 style={{ fontFamily:'var(--font-head)', fontSize:'1.9rem', fontWeight:800, marginBottom:'1rem', lineHeight:1.2 }}>Join 1,200+ Dental Professionals</h2>
          <p style={{ color:'rgba(255,255,255,.62)', lineHeight:1.75, marginBottom:'2rem' }}>
            Your name and hospital appear on every AI-generated report — professional, branded, and ready to share with patients.
          </p>
          {[['🏥','Hospital name on every report'],['👨‍⚕️','Doctor profile in desktop app'],['📄','Branded PDF reports with your logo'],['🔒','HIPAA-compliant & encrypted'],['🚀','10 free analyses — no card needed']].map(([ic,txt]) => (
            <div key={txt} style={{ display:'flex', alignItems:'center', gap:'.85rem', background:'rgba(255,255,255,.07)', borderRadius:10, padding:'.75rem 1rem', marginBottom:'.5rem' }}>
              <span style={{ fontSize:18 }}>{ic}</span>
              <span style={{ fontSize:'.88rem', color:'rgba(255,255,255,.82)' }}>{txt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form side */}
      <div className="auth-form-side">
        <div className="auth-box" style={{ maxWidth:520 }}>
          <h2 style={{ fontFamily:'var(--font-head)', fontSize:'1.6rem', fontWeight:800, color:'var(--navy)', marginBottom:'.3rem' }}>Create your account</h2>
          <p style={{ color:'var(--slate)', fontSize:'.88rem', marginBottom:'1.5rem' }}>Your details will appear on all AI-generated dental reports.</p>

          {apiErr && <div className="alert alert-error" style={{ marginBottom:'1.25rem' }}>⚠ {apiErr}</div>}

          <form onSubmit={handleSubmit} noValidate>

            {/* Doctor name row */}
            <div className="form-group">
              <label className="form-label">Doctor Name *</label>
              <div style={{ display:'flex', gap:'.5rem' }}>
                <select className="form-input" value={form.doctorTitle} onChange={e => set('doctorTitle')(e.target.value)} style={{ width:90, flexShrink:0 }}>
                  {TITLES.map(t => <option key={t}>{t}</option>)}
                </select>
                <div style={{ flex:1 }}>
                  <input className={`form-input${errors.name?' error':''}`} value={form.name} onChange={e => set('name')(e.target.value)} placeholder="Priya Sharma" autoComplete="name" />
                </div>
              </div>
              {errors.name && <p className="form-error">⚠ {errors.name}</p>}
              <p style={{ fontSize:'.72rem', color:'var(--muted)', marginTop:4 }}>This name will appear on every report (e.g. "Attending: Dr. Priya Sharma")</p>
            </div>

            {/* Hospital */}
            <div className="form-group">
              <label className="form-label">Hospital / Clinic Name *</label>
              <input className={`form-input${errors.hospitalName?' error':''}`} value={form.hospitalName} onChange={e => set('hospitalName')(e.target.value)} placeholder="Apollo Dental Centre, Mumbai" />
              {errors.hospitalName && <p className="form-error">⚠ {errors.hospitalName}</p>}
              <p style={{ fontSize:'.72rem', color:'var(--muted)', marginTop:4 }}>Appears as the header on all PDF reports</p>
            </div>

            {/* Specialization + Phone row */}
            <div className="form-grid-2" style={{ marginBottom:'1rem' }}>
              <div>
                <label className="form-label">Specialization</label>
                <select className="form-input" value={form.specialization} onChange={e => set('specialization')(e.target.value)}>
                  <option value="">Select…</option>
                  {SPECS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Phone Number</label>
                <input className="form-input" value={form.phone} onChange={e => set('phone')(e.target.value)} placeholder="+91 98765 43210" />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input className={`form-input${errors.email?' error':''}`} type="email" value={form.email} onChange={e => set('email')(e.target.value)} placeholder="doctor@clinic.com" autoComplete="email" />
              {errors.email && <p className="form-error">⚠ {errors.email}</p>}
              <p style={{ fontSize:'.72rem', color:'var(--muted)', marginTop:4 }}>Use this to log in to the desktop application</p>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password * <span style={{ fontWeight:400, color:'var(--muted)' }}>(min. 6 chars)</span></label>
              <div style={{ position:'relative' }}>
                <input className={`form-input${errors.password?' error':''}`} type={showPw?'text':'password'} value={form.password} onChange={e => set('password')(e.target.value)} placeholder="Choose a strong password" style={{ paddingRight:'2.8rem' }} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw(s=>!s)} style={{ position:'absolute', right:'.85rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:17 }}>{showPw?'🙈':'👁'}</button>
              </div>
              {errors.password && <p className="form-error">⚠ {errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input className={`form-input${errors.confirm?' error':''}`} type="password" value={form.confirm} onChange={e => set('confirm')(e.target.value)} placeholder="Repeat your password" autoComplete="new-password" />
              {errors.confirm && <p className="form-error">⚠ {errors.confirm}</p>}
            </div>

            {/* Terms */}
            <div style={{ display:'flex', alignItems:'flex-start', gap:'.75rem', margin:'1rem 0 1.5rem' }}>
              <input type="checkbox" id="terms" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop:3, accentColor:'var(--teal)', width:16, height:16, flexShrink:0, cursor:'pointer' }} />
              <label htmlFor="terms" style={{ fontSize:'.82rem', color:'var(--slate)', lineHeight:1.55, cursor:'pointer' }}>
                I agree to the <span style={{ color:'var(--teal)', fontWeight:700 }}>Terms of Service</span> and <span style={{ color:'var(--teal)', fontWeight:700 }}>Privacy Policy</span>. Data processed per HIPAA guidelines.
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ fontSize:'.95rem' }}>
              {loading ? <Loader size="sm" color="#fff" /> : 'Create My Account →'}
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:'.85rem', color:'var(--slate)', marginTop:'1.25rem' }}>
            Already have an account? <Link to="/login" style={{ color:'var(--teal)', fontWeight:700 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
