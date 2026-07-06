export default function Hero() {
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <section style={{ minHeight:'100vh', background:'var(--navy)', position:'relative', display:'flex', alignItems:'center', paddingTop:'var(--nav-h)', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 25% 55%,rgba(13,148,136,.18) 0%,transparent 55%),radial-gradient(ellipse at 80% 20%,rgba(6,182,212,.12) 0%,transparent 50%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)', backgroundSize:'56px 56px', pointerEvents:'none' }} />

      <div className="container" style={{ position:'relative', zIndex:1, padding:'4rem 1.5rem', width:'100%' }}>
        <div className="hero-grid">

          {/* Left copy */}
          <div className="fade-up">
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(13,148,136,.15)', border:'1px solid rgba(13,148,136,.3)', borderRadius:100, padding:'5px 14px', marginBottom:'1.5rem' }}>
              <span style={{ width:6, height:6, background:'var(--teal)', borderRadius:'50%', display:'inline-block', animation:'pulse 2s infinite' }} />
              <span style={{ color:'var(--teal-light)', fontSize:'.72rem', fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase' }}>AI-Powered Dental Diagnostics</span>
            </div>

            <h1 style={{ fontFamily:'var(--font-head)', fontSize:'clamp(2rem,5vw,3.5rem)', fontWeight:800, color:'#fff', lineHeight:1.1, letterSpacing:'-.03em', marginBottom:'1.25rem' }}>
              Detect Caries{' '}
              <span style={{ color:'transparent', background:'linear-gradient(135deg,var(--teal-light),var(--accent))', WebkitBackgroundClip:'text', backgroundClip:'text' }}>Earlier,</span>
              <br />Treat Smarter
            </h1>

            <p style={{ color:'rgba(255,255,255,.62)', fontSize:'clamp(.9rem,2vw,1.08rem)', lineHeight:1.78, marginBottom:'2.5rem', maxWidth:480 }}>
              DivulgeAI combines deep learning with radiology to detect dental caries in RVG images with{' '}
              <strong style={{ color:'var(--teal-light)' }}>97.4% precision</strong> — empowering clinicians and improving patient outcomes.
            </p>

            <div className="hero-btns">
              <button onClick={() => scrollTo('download')} className="btn btn-primary btn-lg">
                <svg width="17" height="17" fill="white" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5v-2z"/></svg>
                Download App
              </button>
              <button onClick={() => scrollTo('services')} className="btn btn-outline btn-lg">
                <svg width="17" height="17" fill="white" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                See Features
              </button>
            </div>

            <div className="hero-stats">
              {[['1,200+','Clinics'],['2M+','Scans'],['97.4%','Accuracy']].map(([v,l]) => (
                <div key={l} style={{ textAlign:'center' }}>
                  <div style={{ fontFamily:'var(--font-head)', fontSize:'clamp(1.1rem,3vw,1.4rem)', fontWeight:800, color:'var(--teal-light)' }}>{v}</div>
                  <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.4)', marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right visual card */}
          <div className="fade-up" style={{ animationDelay:'.18s', position:'relative' }}>
            <div className="float" style={{ position:'absolute', top:-16, right:-8, zIndex:2, background:'rgba(12,26,46,.92)', border:'1px solid rgba(245,158,11,.4)', borderRadius:10, padding:'6px 12px', color:'var(--warn)', fontSize:'.72rem', fontWeight:700 }}>
              ⚠ Cavity Detected — FDI 45
            </div>
            <div className="float" style={{ position:'absolute', bottom:-16, left:-8, zIndex:2, background:'rgba(12,26,46,.92)', border:'1px solid rgba(16,185,129,.4)', borderRadius:10, padding:'6px 12px', color:'var(--success)', fontSize:'.72rem', fontWeight:700, animationDelay:'.8s' }}>
              ✓ Report Ready · 0.8 s
            </div>

            <div style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:20, padding:'1.5rem', backdropFilter:'blur(10px)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', flexWrap:'wrap', gap:8 }}>
                <span style={{ color:'#fff', fontWeight:600, fontSize:'.85rem' }}>Patient RVG — ID #2847</span>
                <span style={{ display:'flex', alignItems:'center', gap:6, color:'var(--teal-light)', fontSize:'.75rem', fontWeight:700 }}>
                  <span style={{ width:6, height:6, background:'var(--success)', borderRadius:'50%', display:'inline-block', animation:'pulse 2s infinite' }} />
                  Analyzing
                </span>
              </div>

              <div style={{ width:'100%', height:200, background:'linear-gradient(135deg,#060e1a,#0a1f35)', borderRadius:12, position:'relative', overflow:'hidden', marginBottom:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ position:'absolute', left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,var(--teal),transparent)', animation:'scanLine 2.5s ease-in-out infinite', top:'5%' }} />
                <svg width="100%" height="140" viewBox="0 0 230 140" opacity=".65" preserveAspectRatio="xMidYMid meet">
                  <ellipse cx="55" cy="70" rx="28" ry="60" fill="none" stroke="#60a5fa" strokeWidth="1.5"/>
                  <ellipse cx="115" cy="65" rx="26" ry="63" fill="none" stroke="#60a5fa" strokeWidth="1.5"/>
                  <ellipse cx="175" cy="70" rx="28" ry="58" fill="none" stroke="#60a5fa" strokeWidth="1.5"/>
                  <circle cx="110" cy="42" r="11" fill="#ef444428" stroke="#ef4444" strokeWidth="1.8"/>
                  <rect x="158" y="51" width="20" height="14" rx="2" fill="#f59e0b18" stroke="#f59e0b" strokeWidth="1.5"/>
                  <ellipse cx="55" cy="78" rx="14" ry="8" fill="#10b98118" stroke="#10b981" strokeWidth="1.2"/>
                </svg>
              </div>

              <div className="hero-card-metrics">
                {[['97.4%','Confidence'],['2','Findings'],['0.8s','Scan Time']].map(([v,l]) => (
                  <div key={l} style={{ background:'rgba(13,148,136,.12)', border:'1px solid rgba(13,148,136,.25)', borderRadius:8, padding:'.6rem .4rem', textAlign:'center' }}>
                    <div style={{ fontFamily:'var(--font-head)', fontSize:'clamp(.9rem,2vw,1.2rem)', fontWeight:800, color:'var(--teal-light)' }}>{v}</div>
                    <div style={{ fontSize:'.65rem', color:'rgba(255,255,255,.42)', marginTop:2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
