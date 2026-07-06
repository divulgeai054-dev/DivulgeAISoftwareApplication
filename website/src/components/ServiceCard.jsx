export default function ServiceCard({ icon, title, description, delay = 0 }) {
  return (
    <div
      className="card fade-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div style={{
        width: 52, height: 52,
        background: 'var(--teal-xlight)',
        borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26, marginBottom: '1.25rem',
        position: 'relative', overflow: 'hidden',
      }}>
        {icon}
        {/* Subtle shine */}
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: '50%', height: '100%',
          background: 'rgba(255,255,255,.35)',
          transform: 'skewX(-15deg)',
        }} />
      </div>

      <h3 style={{
        fontFamily: 'var(--font-head)',
        fontSize: '1.1rem', fontWeight: 700,
        color: 'var(--navy)', marginBottom: '.6rem',
      }}>
        {title}
      </h3>

      <p style={{ color: 'var(--slate)', fontSize: '.9rem', lineHeight: 1.65 }}>
        {description}
      </p>

      <div style={{
        display: 'flex', alignItems: 'center', gap: .5,
        marginTop: '1.25rem', color: 'var(--teal)',
        fontSize: '.82rem', fontWeight: 700, cursor: 'pointer',
      }}>
        Learn more
        <span style={{ marginLeft: 4 }}>→</span>
      </div>
    </div>
  )
}
