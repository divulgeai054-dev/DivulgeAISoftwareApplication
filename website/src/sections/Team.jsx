import DoctorCard from '../components/DoctorCard'
const TEAM = [
  { emoji:'👨‍⚕️', name:'Dr. Arjun Mehta',  role:'CEO & Chief Dental Officer', bio:'MDS Prosthodontics, 15 yrs clinical practice. Co-inventor of the DivulgeAI detection engine.', gradientFrom:'#0d9488', gradientTo:'#0c1a2e' },
  { emoji:'👩‍💻', name:'Dr. Priya Nair',   role:'Head of AI Research',         bio:'PhD Computer Vision, IISc Bangalore. Led CNN model development on 2M+ annotated radiographs.', gradientFrom:'#0ea5e9', gradientTo:'#0c1a2e' },
  { emoji:'👨‍🔬', name:'Dr. Sandeep Rao',  role:'Chief Radiologist',           bio:'Oral & Maxillofacial Radiologist validating AI outputs against gold-standard clinical criteria.', gradientFrom:'#7c3aed', gradientTo:'#0c1a2e' },
  { emoji:'👩‍⚕️', name:'Dr. Meera Iyer',   role:'Clinical Integration Lead',   bio:'BDS, MBA Healthcare. Manages 1,200+ clinic partnerships and leads clinical onboarding programmes.', gradientFrom:'#059669', gradientTo:'#0c1a2e' },
]
export default function Team() {
  return (
    <section id="team" className="section" style={{ background:'var(--white)' }}>
      <div className="container">
        <div className="text-center" style={{ marginBottom:'3rem' }}>
          <span className="section-tag">Our Team</span>
          <h2 className="section-title" style={{ marginTop:'1rem' }}>Experts in AI &amp; Dentistry</h2>
          <p className="section-sub">A multidisciplinary team united by a mission to transform oral healthcare.</p>
        </div>
        <div className="team-grid">
          {TEAM.map((m,i) => <DoctorCard key={m.name} {...m} delay={i*.08} />)}
        </div>
      </div>
    </section>
  )
}
