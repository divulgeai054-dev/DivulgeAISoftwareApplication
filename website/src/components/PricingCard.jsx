import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

// ── Razorpay plan config ─────────────────────────────────────────────────────
// Replace these with your actual Razorpay Plan IDs from the dashboard
const RAZORPAY_KEY   = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_REPLACE_ME'
const PLAN_IDS = {
  Starter:      null,                   // free — no payment needed
  Professional: 'plan_REPLACE_PROF',    // ← your Razorpay plan ID
  Enterprise:   null,                   // contact sales
}
const PLAN_AMOUNTS = {
  Professional: 249900,                 // amount in paise (₹2,499 × 100)
}

export default function PricingCard({ name, price, period, features, cta, featured = false, delay = 0 }) {
  const navigate             = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const handleCta = () => {
    if (name === 'Enterprise') {
      document.getElementById('contact')?.scrollIntoView({ behavior:'smooth' })
      return
    }
    if (name === 'Starter') {
      // Free plan — just go to download
      document.getElementById('download')?.scrollIntoView({ behavior:'smooth' })
      return
    }
    // Paid plan — open Razorpay
    if (!isAuthenticated) {
      // Must be logged in first so we have user details
      navigate('/login', { state: { from: { pathname:'/', hash:'#pricing' } } })
      return
    }
    openRazorpay()
  }

  const openRazorpay = () => {
    if (typeof window.Razorpay === 'undefined') {
      alert('Payment gateway loading… Please try again in a moment.')
      loadRazorpayScript().then(openRazorpay)
      return
    }

    const options = {
      key:         RAZORPAY_KEY,
      amount:      PLAN_AMOUNTS[name],    // in paise
      currency:    'INR',
      name:        'DivulgeAI',
      description: `${name} Plan — Monthly Subscription`,
      image:       '/icon.png',
      prefill: {
        name:  user?.name  || '',
        email: user?.email || '',
        contact: user?.phone || '',
      },
      notes: {
        plan:   name,
        userId: user?.id || '',
      },
      theme: { color: '#0d9488' },
      handler: (response) => {
        // Payment successful — redirect to download with plan activated
        console.log('Razorpay payment success:', response)
        alert(`✅ Payment successful!\nYour ${name} plan is now active.\n\nPayment ID: ${response.razorpay_payment_id}`)
        document.getElementById('download')?.scrollIntoView({ behavior:'smooth' })
        // TODO: call your backend to verify payment & activate plan
        // POST /api/payments/verify { razorpay_payment_id, razorpay_order_id, razorpay_signature }
      },
      modal: {
        ondismiss: () => console.log('Razorpay modal dismissed'),
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', (response) => {
      alert(`❌ Payment failed.\nReason: ${response.error.description}`)
    })
    rzp.open()
  }

  return (
    <div
      className="fade-up"
      style={{
        background:    featured ? 'var(--navy)' : 'var(--white)',
        borderRadius:  20,
        border:        `${featured?'2px':'1.5px'} solid ${featured?'var(--teal)':'var(--border)'}`,
        padding:       '2rem',
        position:      'relative',
        transform:     featured ? 'scale(1.04)' : 'none',
        boxShadow:     featured ? '0 20px 60px rgba(13,148,136,.2)' : 'none',
        animationDelay:`${delay}s`,
        transition:    'transform .3s, box-shadow .3s',
      }}
    >
      {featured && (
        <div style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', background:'var(--teal)', color:'#fff', fontSize:'.68rem', fontWeight:800, padding:'4px 18px', borderRadius:100, letterSpacing:'.06em', textTransform:'uppercase', whiteSpace:'nowrap' }}>
          Most Popular
        </div>
      )}

      <p style={{ fontSize:'.78rem', fontWeight:700, color:featured?'rgba(255,255,255,.45)':'var(--slate)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.75rem' }}>
        {name}
      </p>

      <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:'1.5rem' }}>
        {price !== 'Custom' && (
          <span style={{ fontSize:'1.1rem', fontWeight:700, color:featured?'#fff':'var(--navy)' }}>₹</span>
        )}
        <span style={{ fontFamily:'var(--font-head)', fontSize:'2.8rem', fontWeight:800, color:featured?'#fff':'var(--navy)', lineHeight:1 }}>
          {price}
        </span>
        <span style={{ fontSize:'.82rem', color:featured?'rgba(255,255,255,.38)':'var(--muted)' }}>
          {period}
        </span>
      </div>

      <ul style={{ marginBottom:'2rem' }}>
        {features.map(f => (
          <li key={f} style={{ display:'flex', alignItems:'flex-start', gap:'.6rem', padding:'.48rem 0', borderBottom:`1px solid ${featured?'rgba(255,255,255,.08)':'var(--border)'}`, fontSize:'.88rem', color:featured?'rgba(255,255,255,.72)':'var(--slate)' }}>
            <span style={{ color:'var(--teal)', fontWeight:700, flexShrink:0, marginTop:1 }}>✓</span>
            {f}
          </li>
        ))}
      </ul>

      {/* Payment badge for paid plans */}
      {name === 'Professional' && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:'.75rem', fontSize:'.72rem', color:'rgba(255,255,255,.5)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          Secure payment via Razorpay
        </div>
      )}

      <button
        onClick={handleCta}
        className={featured ? 'btn btn-primary btn-full' : 'btn btn-ghost btn-full'}
        style={!featured ? { fontWeight:700 } : {}}
      >
        {name === 'Professional' ? '💳 ' : ''}{cta}
      </button>
    </div>
  )
}

// Lazy-load Razorpay SDK
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) { resolve(); return }
    const s   = document.createElement('script')
    s.id      = 'razorpay-script'
    s.src     = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload  = resolve
    document.head.appendChild(s)
  })
}

// Pre-load SDK when the component mounts (called from Pricing section)
export function preloadRazorpay() { loadRazorpayScript() }
