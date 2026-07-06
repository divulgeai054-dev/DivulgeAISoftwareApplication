export default function DoctorCard({ emoji, name, role, bio, gradientFrom, gradientTo, delay = 0 }) {
  return (
    <div
      className="card fade-up"
      style={{ padding: 0, overflow: 'hidden', animationDelay: `${delay}s` }}
    >
      {/* Avatar banner */}
      <div style={{
        height: 170,
        background: `linear-gradient(135deg, ${gradientFrom || 'var(--teal)'}, ${gradientTo || 'var(--navy)'})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '3.6rem',
        position: 'relative', overflow: 'hidden',
      }}>
        {emoji}
        {/* decorative circle */}
        <div style={{
          position: 'absolute', bottom: -30, right: -30,
          width: 90, height: 90,
          borderRadius: '50%',
          background: 'rgba(255,255,255,.06)',
        }} />
      </div>

      {/* Info */}
      <div style={{ padding: '1.25rem' }}>
        <h3 style={{
          fontFamily: 'var(--font-head)', fontWeight: 700,
          fontSize: '1rem', color: 'var(--navy)', marginBottom: 4,
        }}>
          {name}
        </h3>
        <p style={{
          fontSize: '.78rem', color: 'var(--teal-dark)',
          fontWeight: 700, marginBottom: '.5rem',
        }}>
          {role}
        </p>
        <p style={{ fontSize: '.82rem', color: 'var(--slate)', lineHeight: 1.55 }}>
          {bio}
        </p>
      </div>
    </div>
  )
}
