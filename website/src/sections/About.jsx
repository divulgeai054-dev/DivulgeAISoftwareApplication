export default function About() {
  const steps = [
    { icon:'📤', title:'Upload RVG Image',  desc:'Clinician uploads periapical or bitewing radiograph in JPEG / PNG / DICOM format.' },
    { icon:'🧠', title:'AI Processing',     desc:'CNN model segments teeth and identifies carious lesions with bounding box localisation.' },
    { icon:'📊', title:'Clinical Report',   desc:'Severity scores, FDI tooth numbering, and treatment recommendations generated instantly.' },
    { icon:'⬇️', title:'Download & Share',  desc:'Export PDF report for patient records, referrals, or insurance documentation.' },
  ]
  return (
    <section id="about" className="section" style={{ background:'var(--white)' }}>
      <div className="container">
        <div className="about-grid">
          <div className="fade-up">
            <span className="section-tag">About DivulgeAI</span>
            <h2 className="section-title" style={{ marginTop:'1rem' }}>Revolutionising Dental Diagnostics with AI</h2>
            <p style={{ color:'var(--slate)', lineHeight:1.8, marginBottom:'.85rem' }}>DivulgeAI is a clinical intelligence platform built for dental professionals. Our proprietary AI model is trained on over <strong>2 million annotated RVG radiographs</strong>, detecting carious lesions at every stage.</p>
            <p style={{ color:'var(--slate)', lineHeight:1.8, marginBottom:'2rem' }}>We partner with dental clinics, hospitals, and dental schools to integrate seamless AI-assisted diagnostics into existing workflows, reducing diagnostic errors and improving treatment planning accuracy.</p>
            <div className="about-stats">
              {[['97.4%','Detection Accuracy'],['2M+','RVGs Analyzed'],['1,200+','Clinics Worldwide']].map(([n,l]) => (
                <div key={l} style={{ background:'var(--teal-xlight)', border:'1px solid rgba(13,148,136,.15)', borderRadius:12, padding:'1rem .75rem', textAlign:'center' }}>
                  <div style={{ fontFamily:'var(--font-head)', fontSize:'clamp(1.3rem,3vw,1.9rem)', fontWeight:800, color:'var(--teal-dark)' }}>{n}</div>
                  <div style={{ fontSize:'.72rem', color:'var(--slate)', marginTop:4 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="fade-up" style={{ background:'linear-gradient(135deg,var(--navy),var(--navy-mid))', borderRadius:20, padding:'2rem', color:'#fff', animationDelay:'.15s' }}>
            <h3 style={{ fontFamily:'var(--font-head)', fontSize:'1.1rem', fontWeight:700, marginBottom:'1.5rem' }}>How Our AI Works</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
              {steps.map(({ icon, title, desc }) => (
                <div key={title} style={{ display:'flex', alignItems:'flex-start', gap:'1rem', background:'rgba(255,255,255,.05)', borderRadius:10, padding:'1rem', borderLeft:'3px solid var(--teal)' }}>
                  <span style={{ fontSize:20, flexShrink:0 }}>{icon}</span>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'.9rem', marginBottom:3 }}>{title}</div>
                    <div style={{ fontSize:'.8rem', color:'rgba(255,255,255,.52)', lineHeight:1.55 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
