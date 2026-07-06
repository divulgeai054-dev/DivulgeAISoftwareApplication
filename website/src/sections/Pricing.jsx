import { useEffect } from 'react'
import PricingCard, { preloadRazorpay } from '../components/PricingCard'

const PLANS = [
  {
    name:     'Starter',
    price:    '0',
    period:   '/month',
    featured: false,
    cta:      'Get Started Free',
    features: ['10 RVG analyses / month', 'Basic caries detection', 'PDF report download', 'Email support', '1 user account'],
  },
  {
    name:     'Professional',
    price:    '2,499',
    period:   '/month',
    featured: true,
    cta:      'Buy Professional Plan',
    features: ['500 RVG analyses / month', 'Full multi-pathology detection', 'Annotated PDF reports', 'Bone loss analysis', 'Priority 24/7 support', '5 user accounts', 'Practice management API'],
  },
  {
    name:     'Enterprise',
    price:    'Custom',
    period:   '',
    featured: false,
    cta:      'Contact Sales',
    features: ['Unlimited analyses', 'Full pathology suite', 'Custom AI model training', 'DICOM / HL7 integration', 'Dedicated account manager', 'Unlimited users', 'SLA guarantee & audit logs'],
  },
]

export default function Pricing() {
  // Pre-load Razorpay SDK when pricing section is visible
  useEffect(() => { preloadRazorpay() }, [])

  return (
    <section id="pricing" className="section" style={{ background:'var(--teal-xlight)' }}>
      <div className="container">
        <div className="text-center" style={{ marginBottom:'3rem' }}>
          <span className="section-tag">Pricing</span>
          <h2 className="section-title" style={{ marginTop:'1rem' }}>Transparent, Flexible Plans</h2>
          <p className="section-sub">Start free, scale as you grow. All plans include AI analysis capabilities.</p>
        </div>

        <div className="pricing-grid">
          {PLANS.map((p, i) => <PricingCard key={p.name} {...p} delay={i * .08} />)}
        </div>

        {/* Payment trust badges */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'1.5rem', marginTop:'2rem', flexWrap:'wrap' }}>
          {[
            ['🔒', 'SSL Encrypted'],
            ['💳', 'Powered by Razorpay'],
            ['🏦', 'UPI · Cards · Net Banking'],
            ['↩',  'Cancel anytime'],
          ].map(([ic, txt]) => (
            <div key={txt} style={{ display:'flex', alignItems:'center', gap:6, fontSize:'.78rem', color:'var(--slate)' }}>
              <span>{ic}</span>{txt}
            </div>
          ))}
        </div>

        <p style={{ textAlign:'center', marginTop:'1rem', color:'var(--slate)', fontSize:'.82rem' }}>
          All plans include a 14-day free trial · No credit card required for Starter
        </p>
      </div>
    </section>
  )
}
