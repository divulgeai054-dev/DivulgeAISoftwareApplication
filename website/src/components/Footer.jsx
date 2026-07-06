import { Link, useNavigate, useLocation } from 'react-router-dom'

export default function Footer() {
  const navigate = useNavigate()
  const location = useLocation()
  const go = id => {
    if (location.pathname !== '/') { navigate('/'); setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior:'smooth' }), 100) }
    else document.getElementById(id)?.scrollIntoView({ behavior:'smooth' })
  }

  return (
    <footer style={{ background:'var(--navy)', color:'#fff', padding:'4rem 1.5rem 2rem' }}>
      <div className="container">
        <div className="footer-grid">

          {/* Brand */}
          <div>
            <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'1rem', textDecoration:'none' }}>
              <div style={{ width:36, height:36, background:'linear-gradient(135deg,var(--teal),var(--accent))', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              </div>
              <span style={{ fontFamily:'var(--font-head)', fontSize:'1.2rem', fontWeight:800 }}>Divulge<span style={{ color:'var(--teal-light)' }}>AI</span></span>
            </Link>
            <p style={{ color:'rgba(255,255,255,.45)', fontSize:'.85rem', lineHeight:1.75, maxWidth:270 }}>
              AI-powered dental caries detection trusted by 1,200+ practices worldwide.
            </p>
            <div style={{ display:'flex', gap:'.65rem', marginTop:'1.25rem' }}>
              {['𝕏','in','f'].map(s => (
                <div key={s} style={{ width:34, height:34, borderRadius:8, background:'rgba(255,255,255,.08)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'.88rem', color:'rgba(255,255,255,.6)', transition:'background .2s' }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--teal)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,.08)'}>{s}</div>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 style={{ fontFamily:'var(--font-head)', fontSize:'.78rem', fontWeight:700, marginBottom:'1rem', color:'rgba(255,255,255,.6)', textTransform:'uppercase', letterSpacing:'.07em' }}>Product</h4>
            {[
              { l:'Features',  a: () => go('services')  },
              { l:'Pricing',   a: () => go('pricing')   },
              { l:'Download',  a: () => go('download')  },
            ].map(({ l, a }) => (
              <button key={l} onClick={a} style={{ display:'block', background:'none', border:'none', color:'rgba(255,255,255,.45)', fontSize:'.85rem', marginBottom:'.55rem', cursor:'pointer', fontFamily:'var(--font-body)', textAlign:'left', padding:0, transition:'color .2s' }}
                onMouseEnter={e => e.target.style.color='var(--teal-light)'}
                onMouseLeave={e => e.target.style.color='rgba(255,255,255,.45)'}>{l}</button>
            ))}
          </div>

          {/* Company */}
          <div>
            <h4 style={{ fontFamily:'var(--font-head)', fontSize:'.78rem', fontWeight:700, marginBottom:'1rem', color:'rgba(255,255,255,.6)', textTransform:'uppercase', letterSpacing:'.07em' }}>Company</h4>
            {[
              { l:'About',   a: () => go('about')   },
              { l:'Contact', a: () => go('contact') },
              { l:'Blog',    a: () => {}             },
            ].map(({ l, a }) => (
              <button key={l} onClick={a} style={{ display:'block', background:'none', border:'none', color:'rgba(255,255,255,.45)', fontSize:'.85rem', marginBottom:'.55rem', cursor:'pointer', fontFamily:'var(--font-body)', textAlign:'left', padding:0, transition:'color .2s' }}
                onMouseEnter={e => e.target.style.color='var(--teal-light)'}
                onMouseLeave={e => e.target.style.color='rgba(255,255,255,.45)'}>{l}</button>
            ))}
          </div>

          {/* Account */}
          <div>
            <h4 style={{ fontFamily:'var(--font-head)', fontSize:'.78rem', fontWeight:700, marginBottom:'1rem', color:'rgba(255,255,255,.6)', textTransform:'uppercase', letterSpacing:'.07em' }}>Account</h4>
            {[
              { l:'Sign In',         a: () => navigate('/login')    },
              { l:'Register',        a: () => navigate('/register') },
              { l:'Privacy Policy',  a: () => {}                    },
              { l:'Terms of Service',a: () => {}                    },
            ].map(({ l, a }) => (
              <button key={l} onClick={a} style={{ display:'block', background:'none', border:'none', color:'rgba(255,255,255,.45)', fontSize:'.85rem', marginBottom:'.55rem', cursor:'pointer', fontFamily:'var(--font-body)', textAlign:'left', padding:0, transition:'color .2s' }}
                onMouseEnter={e => e.target.style.color='var(--teal-light)'}
                onMouseLeave={e => e.target.style.color='rgba(255,255,255,.45)'}>{l}</button>
            ))}
          </div>

        </div>

        <div style={{ borderTop:'1px solid rgba(255,255,255,.08)', paddingTop:'1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem' }}>
          <p style={{ color:'rgba(255,255,255,.28)', fontSize:'.8rem' }}>© {new Date().getFullYear()} DivulgeAI Technologies Pvt. Ltd. All rights reserved.</p>
          <p style={{ color:'rgba(255,255,255,.2)', fontSize:'.75rem' }}>For clinical support only · Not a substitute for professional diagnosis.</p>
        </div>
      </div>
    </footer>
  )
}
