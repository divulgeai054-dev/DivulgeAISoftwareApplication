import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { getInitials } from '../utils/helpers'

export default function Navbar({ solid = false }) {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [scrolled,     setScrolled]     = useState(false)
  const [menuOpen,     setMenuOpen]     = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { setMenuOpen(false); setDropdownOpen(false) }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const bg = solid ? 'rgba(12,26,46,1)' : scrolled ? 'rgba(12,26,46,.98)' : 'rgba(12,26,46,.86)'

  const goTo = (id) => {
    setMenuOpen(false)
    if (location.pathname !== '/') { navigate('/'); setTimeout(() => scrollEl(id), 120) }
    else scrollEl(id)
  }
  const scrollEl = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const handleLogout = () => { logout(); setDropdownOpen(false); navigate('/') }

  const LINKS = [
    { label: 'Features', id: 'services'  },
    { label: 'Pricing',  id: 'pricing'   },
    { label: 'Download', id: 'download'  },
    { label: 'Contact',  id: 'contact'   },
  ]

  return (
    <>
      <nav className="navbar" style={{ background: bg }}>
        <div className="navbar-inner">

          {/* Logo */}
          <Link to="/" className="nav-logo">
            <div style={{ width:36, height:36, flexShrink:0, background:'linear-gradient(135deg,var(--teal),var(--accent))', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            </div>
            <span style={{ fontFamily:'var(--font-head)', fontSize:'1.18rem', fontWeight:800, color:'#fff', letterSpacing:'-.02em', whiteSpace:'nowrap' }}>
              Divulge<span style={{ color:'var(--teal-light)' }}>AI</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="nav-links">
            {LINKS.map(({ label, id }) => (
              <button key={id} onClick={() => goTo(id)} className="nav-link-btn">{label}</button>
            ))}
          </div>

          {/* Right actions */}
          <div className="nav-actions">
            {isAuthenticated ? (
              <div style={{ position:'relative' }}>
                {/* Avatar + name + dropdown */}
                <button onClick={() => setDropdownOpen(o => !o)} style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(255,255,255,.09)', border:'1px solid rgba(255,255,255,.15)', borderRadius:100, padding:'4px 10px 4px 4px', cursor:'pointer' }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--teal)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.66rem', fontWeight:700, color:'#fff', flexShrink:0 }}>
                    {getInitials(user?.name)}
                  </div>
                  <span style={{ color:'#fff', fontSize:'.8rem', fontWeight:600, whiteSpace:'nowrap', maxWidth:80, overflow:'hidden', textOverflow:'ellipsis' }}>
                    {user?.name?.split(' ')[0]}
                  </span>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ flexShrink:0, transition:'transform .2s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }}>
                    <path d="M1 1l4 4 4-4" stroke="rgba(255,255,255,.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {dropdownOpen && <div style={{ position:'fixed', inset:0, zIndex:148 }} onClick={() => setDropdownOpen(false)} />}
                {dropdownOpen && (
                  <div style={{ position:'absolute', top:'calc(100% + 10px)', right:0, background:'#fff', borderRadius:14, border:'1px solid var(--border)', boxShadow:'0 16px 48px rgba(0,0,0,.15)', minWidth:210, zIndex:200, overflow:'hidden' }}>
                    {/* User info header */}
                    <div style={{ padding:'.9rem 1.1rem', background:'var(--teal-xlight)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--teal)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.78rem', fontWeight:700, color:'#fff', flexShrink:0 }}>{getInitials(user?.name)}</div>
                      <div style={{ overflow:'hidden' }}>
                        <p style={{ fontWeight:700, fontSize:'.88rem', color:'var(--navy)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</p>
                        <p style={{ fontSize:'.73rem', color:'var(--slate)', marginTop:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.email}</p>
                      </div>
                    </div>
                    {/* Sign out */}
                    <div style={{ padding:'.4rem' }}>
                      <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'.65rem .75rem', background:'none', border:'none', borderRadius:8, fontSize:'.88rem', color:'var(--danger)', fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)', transition:'background .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <span style={{ width:20, textAlign:'center' }}>🚪</span> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" style={{ color:'rgba(255,255,255,.82)', fontSize:'.88rem', fontWeight:600, whiteSpace:'nowrap' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.82)'}>
                  Sign In
                </Link>
                <button onClick={() => goTo('download')} className="btn btn-primary btn-sm" style={{ fontSize:'.8rem' }}>
                  ⬇ Download
                </button>
              </>
            )}

            <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div className={`mobile-drawer${menuOpen ? ' open' : ''}`}>
        {LINKS.map(({ label, id }) => (
          <button key={id} onClick={() => goTo(id)} className="mobile-nav-link">{label}</button>
        ))}
        <div className="mobile-actions">
          {isAuthenticated ? (
            <>
              <div style={{ padding:'.75rem 1rem', background:'rgba(13,148,136,.1)', borderRadius:10, marginBottom:'.5rem', fontSize:'.85rem', color:'rgba(255,255,255,.7)' }}>
                Signed in as <strong style={{ color:'#fff' }}>{user?.name?.split(' ')[0]}</strong>
              </div>
              <button onClick={() => { goTo('download'); setMenuOpen(false) }} className="btn btn-primary btn-full">⬇ Download App</button>
              <button onClick={handleLogout} className="btn btn-danger btn-full" style={{ marginTop:'.5rem' }}>🚪 Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login"    className="btn btn-ghost   btn-full" style={{ color:'#fff', borderColor:'rgba(255,255,255,.2)' }} onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-full" onClick={() => setMenuOpen(false)}>Create Account</Link>
            </>
          )}
        </div>
      </div>

      {menuOpen && <div style={{ position:'fixed', inset:0, zIndex:997, background:'rgba(0,0,0,.4)' }} onClick={() => setMenuOpen(false)} />}
    </>
  )
}
