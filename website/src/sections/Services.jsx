import ServiceCard from '../components/ServiceCard'
const SERVICES = [
  { icon:'🦷', title:'Caries Detection',        description:'AI-powered detection of interproximal, occlusal and cervical caries with lesion severity grading and confidence scores on every finding.' },
  { icon:'📐', title:'Bone Loss Analysis',       description:'Automated alveolar bone level measurement to support periodontal diagnosis and track disease progression across visits.' },
  { icon:'🔬', title:'Root Canal Assessment',    description:'Precision evaluation of root canal morphology, periapical pathology, and post-treatment outcomes for endodontic planning.' },
  { icon:'📋', title:'Automated Reporting',      description:'Structured clinical reports with annotated images, FDI tooth numbering, and evidence-based treatment recommendations in seconds.' },
  { icon:'🔗', title:'Practice Integration',     description:'Seamless integration with Dentrix, Eaglesoft and Open Dental via HL7/FHIR-compliant APIs with zero workflow disruption.' },
  { icon:'📱', title:'Teledentistry Support',    description:'Enable remote consultations with AI pre-analysis, helping specialists review cases and advise patients from any location.' },
]
export default function Services() {
  return (
    <section id="services" className="section" style={{ background:'var(--teal-xlight)' }}>
      <div className="container">
        <div className="text-center" style={{ marginBottom:'3rem' }}>
          <span className="section-tag">Features</span>
          <h2 className="section-title" style={{ marginTop:'1rem' }}>Comprehensive AI Dental Solutions</h2>
          <p className="section-sub">From single-image analysis to enterprise integrations — a full suite of AI-powered dental diagnostic tools.</p>
        </div>
        <div className="services-grid">
          {SERVICES.map((s,i) => <ServiceCard key={s.title} {...s} delay={i*.07} />)}
        </div>
      </div>
    </section>
  )
}
