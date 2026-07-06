/**
 * Loader.jsx
 * Props:
 *   fullPage  – boolean, centres in viewport
 *   size      – 'sm' | 'md' | 'lg'
 *   message   – optional text below the spinner
 *   color     – override spinner colour
 */
export default function Loader({
  fullPage = false,
  size     = 'md',
  message  = '',
  color    = 'var(--teal)',
}) {
  const sizeMap = { sm: 20, md: 40, lg: 60 }
  const px      = sizeMap[size] || 40
  const border  = px < 30 ? '3px' : '4px'

  const spinner = (
    <div style={{
      width:          px,
      height:         px,
      borderRadius:   '50%',
      border:         `${border} solid var(--border)`,
      borderTopColor: color,
      animation:      'spin .85s linear infinite',
      flexShrink:     0,
    }} />
  )

  if (fullPage) {
    return (
      <div style={{
        position:       'fixed',
        inset:          0,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '1rem',
        background:     'var(--light)',
        zIndex:         9999,
      }}>
        {/* Logo mark */}
        <div style={{
          width:        52,
          height:       52,
          background:   'linear-gradient(135deg, var(--teal), var(--accent))',
          borderRadius: 12,
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          marginBottom: '.25rem',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        {spinner}
        {message && (
          <p style={{ color: 'var(--slate)', fontSize: '.9rem', fontWeight: 500 }}>
            {message}
          </p>
        )}
      </div>
    )
  }

  if (message) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
        {spinner}
        <span style={{ color: 'var(--slate)', fontSize: '.9rem' }}>{message}</span>
      </div>
    )
  }

  return spinner
}
