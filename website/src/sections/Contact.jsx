import { useState } from 'react'
const INFO = [
  { icon:'📧', label:'Email',   value:'contact@divulgeai.com' },
  { icon:'📞', label:'Phone',   value:'+91 98765 43210' },
  { icon:'📍', label:'Address', value:'Chennai, Tamil Nadu, India — 600001' },
  { icon:'🕒', label:'Hours',   value:'Mon – Sat: 9:00 AM – 6:00 PM IST' },
]
export default function Contact() {
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', clinic:'', subject:'', message:'' })
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]:e.target.value }))
  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.email || !form.message) return
    setBusy(true)
    await new Promise(r => setTimeout(r, 900))
    setBusy(false); setSent(true)
  }
  return (
    <section id="contact" className="section" style={{ background:'var(--white)' }}>
      <div className="container">
        <div className="text-center" style={{ marginBottom:'3rem' }}>
          <span className="section-tag">Contact Us</span>
          <h2 className="section-title" style={{ marginTop:'1rem' }}>Get in Touch</h2>
          <p className="section-sub">Have questions about integration, pricing, or clinical validation? We're here to help.</p>
        </div>
        <div className="contact-grid">
          <div className="fade-up">
            <h3 style={{ fontFamily:'var(--font-head)', fontSize:'1.2rem', fontWeight:700, color:'var(--navy)', marginBottom:'1rem' }}>We'd love to hear from you</h3>
            <p style={{ color:'var(--slate)', lineHeight:1.75, marginBottom:'2rem' }}>Whether you're a solo practitioner or a hospital network, we offer personalised onboarding and dedicated support.</p>
            {INFO.map(({ icon, label, value }) => (
              <div key={label} style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'.85rem 1rem', background:'var(--teal-xlight)', border:'1px solid rgba(13,148,136,.12)', borderRadius:10, marginBottom:'.75rem' }}>
                <div style={{ width:36, height:36, background:'var(--teal)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize:'.68rem', fontWeight:700, color:'var(--teal-dark)', textTransform:'uppercase', letterSpacing:'.05em' }}>{label}</div>
                  <div style={{ fontSize:'.88rem', color:'var(--navy)', fontWeight:500 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="fade-up" style={{ animationDelay:'.12s' }}>
            {sent ? (
              <div style={{ background:'var(--teal-xlight)', borderRadius:16, padding:'3rem 2rem', textAlign:'center', border:'1px solid rgba(13,148,136,.2)' }}>
                <div style={{ fontSize:52, marginBottom:'1rem' }}>✅</div>
                <h3 style={{ fontFamily:'var(--font-head)', fontWeight:700, color:'var(--navy)', marginBottom:'.5rem' }}>Message Sent!</h3>
                <p style={{ color:'var(--slate)' }}>Our team will get back to you within 24 hours.</p>
                <button className="btn btn-primary" style={{ marginTop:'1.5rem' }} onClick={() => setSent(false)}>Send Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ background:'var(--white)', borderRadius:16, padding:'2rem', border:'1px solid var(--border)' }}>
                <div className="form-grid-2">
                  <div className="form-group"><label className="form-label">First Name</label><input className="form-input" value={form.firstName} onChange={set('firstName')} placeholder="Priya" /></div>
                  <div className="form-group"><label className="form-label">Last Name</label><input className="form-input" value={form.lastName} onChange={set('lastName')} placeholder="Sharma" /></div>
                </div>
                <div className="form-group"><label className="form-label">Email Address *</label><input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="doctor@clinic.com" required /></div>
                <div className="form-group"><label className="form-label">Clinic / Hospital</label><input className="form-input" value={form.clinic} onChange={set('clinic')} placeholder="Apollo Dental Centre" /></div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select className="form-select" value={form.subject} onChange={set('subject')}>
                    <option value="">Select a subject…</option>
                    {['Demo Request','Pricing Query','Technical Support','Partnership','General Question'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Message *</label><textarea className="form-textarea" value={form.message} onChange={set('message')} placeholder="Tell us how we can help…" required /></div>
                <button type="submit" className="btn btn-primary btn-full" disabled={busy}>{busy ? 'Sending…' : 'Send Message →'}</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
