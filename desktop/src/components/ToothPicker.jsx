import { useState } from 'react'

/**
 * ToothPicker — FDI 4-quadrant interactive dental chart.
 *
 * Props:
 *   selected   : Set of FDI numbers (as strings) that are selected
 *   onChange   : (newSet) => void
 *   aiDetected : Set of FDI numbers the model already flagged (shown differently)
 */

const QUADRANTS = [
  {
    id: 'UR', label: 'Upper Right', color: '#0d9488',
    teeth: [18,17,16,15,14,13,12,11],
    names: ['Wisdom','2nd Molar','1st Molar','2nd PM','1st PM','Canine','Lat Inc','Cen Inc'],
    side: 'right', jaw: 'upper',
  },
  {
    id: 'UL', label: 'Upper Left', color: '#06b6d4',
    teeth: [21,22,23,24,25,26,27,28],
    names: ['Cen Inc','Lat Inc','Canine','1st PM','2nd PM','1st Molar','2nd Molar','Wisdom'],
    side: 'left', jaw: 'upper',
  },
  {
    id: 'LL', label: 'Lower Left', color: '#8b5cf6',
    teeth: [31,32,33,34,35,36,37,38],
    names: ['Cen Inc','Lat Inc','Canine','1st PM','2nd PM','1st Molar','2nd Molar','Wisdom'],
    side: 'left', jaw: 'lower',
  },
  {
    id: 'LR', label: 'Lower Right', color: '#f59e0b',
    teeth: [41,42,43,44,45,46,47,48],
    names: ['Wisdom','2nd Molar','1st Molar','2nd PM','1st PM','Canine','Lat Inc','Cen Inc'],
    side: 'right', jaw: 'lower',
  },
]

// Tooth width by type (wider molars, narrower incisors)
const TOOTH_WIDTH = [42, 40, 38, 34, 32, 30, 28, 26]  // index 0 = most distal

// Simple SVG tooth shape by position
function ToothShape({ width, height, jaw, isIncisor, isCanine }) {
  const w = width - 4
  const h = height
  const rx = isIncisor ? 4 : isCanine ? 5 : 6

  if (jaw === 'upper') {
    // Crown on top, root pointing down
    const crownH = h * 0.55
    const rootH  = h * 0.45
    return (
      <g>
        {/* Crown */}
        <rect x={2} y={0} width={w} height={crownH} rx={rx} ry={rx}/>
        {/* Root(s) */}
        {isIncisor ? (
          <rect x={w*0.3} y={crownH - 2} width={w*0.4} height={rootH + 2} rx={3}/>
        ) : (
          <>
            <rect x={w*0.1}  y={crownH - 2} width={w*0.3} height={rootH + 2} rx={3}/>
            <rect x={w*0.55} y={crownH - 2} width={w*0.3} height={rootH + 2} rx={3}/>
          </>
        )}
      </g>
    )
  } else {
    // Crown on bottom, root pointing up
    const crownH = h * 0.55
    const rootH  = h * 0.45
    return (
      <g>
        {/* Root(s) */}
        {isIncisor ? (
          <rect x={w*0.3} y={0} width={w*0.4} height={rootH + 2} rx={3}/>
        ) : (
          <>
            <rect x={w*0.1}  y={0} width={w*0.3} height={rootH + 2} rx={3}/>
            <rect x={w*0.55} y={0} width={w*0.3} height={rootH + 2} rx={3}/>
          </>
        )}
        {/* Crown */}
        <rect x={2} y={rootH - 2} width={w} height={crownH} rx={rx} ry={rx}/>
      </g>
    )
  }
}

function QuadrantRow({ quadrant, selected, aiDetected, onToggle }) {
  const { teeth, names, color, jaw, side } = quadrant
  const isRight = side === 'right'

  return (
    <div style={{ display:'flex', flexDirection: isRight ? 'row-reverse' : 'row', alignItems: jaw==='upper' ? 'flex-end' : 'flex-start', gap:2 }}>
      {teeth.map((num, idx) => {
        const strNum     = String(num)
        const isSelected = selected.has(strNum)
        const isAI       = aiDetected.has(strNum)
        const toothIdx   = isRight ? idx : (7 - idx)  // anatomical width order
        const w          = TOOTH_WIDTH[toothIdx]
        const h          = 64
        const isIncisor  = [1,2,4,5].includes(num % 10) && (num % 10) < 3 || num % 10 === 1 || num % 10 === 2
        const isCanine   = num % 10 === 3

        const bgColor  = isSelected ? color : isAI ? '#fff3cd' : '#f8fafc'
        const stroke   = isSelected ? color : isAI ? '#f59e0b' : '#cbd5e1'
        const fillOp   = isSelected ? 0.9 : isAI ? 0.6 : 0.3

        return (
          <div key={num} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3,
            cursor:'pointer', userSelect:'none' }}
            onClick={() => onToggle(strNum)}
            title={`FDI ${num} — ${names[idx]}`}>

            <svg
              width={w} height={h}
              style={{ overflow:'visible', filter: isSelected ? `drop-shadow(0 0 4px ${color}88)` : 'none', transition:'filter .15s' }}>
              <g fill={bgColor} fillOpacity={fillOp} stroke={stroke} strokeWidth={isSelected ? 2 : 1.5}>
                <ToothShape width={w} height={h} jaw={jaw} isIncisor={isIncisor} isCanine={isCanine}/>
              </g>
              {/* AI detected dot */}
              {isAI && !isSelected && (
                <circle cx={w/2} cy={jaw==='upper' ? 8 : h-8} r={4} fill="#f59e0b" stroke="#fff" strokeWidth={1.5}/>
              )}
              {/* Selected check */}
              {isSelected && (
                <circle cx={w/2} cy={jaw==='upper' ? 8 : h-8} r={5} fill={color} stroke="#fff" strokeWidth={1.5}/>
              )}
            </svg>

            {/* FDI number */}
            <div style={{ fontSize:'.6rem', fontWeight: isSelected ? 800 : 600, color: isSelected ? color : '#94a3b8', lineHeight:1, minWidth:20, textAlign:'center', transition:'color .15s' }}>
              {num}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ToothPicker({ selected, onChange, aiDetected = new Set() }) {
  const [showPicker, setShowPicker] = useState(false)

  const toggle = (num) => {
    const next = new Set(selected)
    next.has(num) ? next.delete(num) : next.add(num)
    onChange(next)
  }

  const clearAll  = () => onChange(new Set())
  const selectAI  = () => onChange(new Set([...aiDetected]))

  const selectedList = [...selected].sort((a,b) => parseInt(a) - parseInt(b))

  return (
    <div>
      {/* Trigger row */}
      <div style={{ display:'flex', alignItems:'center', gap:'.5rem', flexWrap:'wrap' }}>
        <button type="button" onClick={() => setShowPicker(s=>!s)}
          className="btn btn-sm btn-ghost"
          style={{ gap:6, borderColor: showPicker ? 'var(--teal)' : 'var(--border)', color: showPicker ? 'var(--teal)' : 'var(--slate)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a7 7 0 0 0-7 7c0 4 3 7 5 10 .5.8 1 1.5 2 1.5s1.5-.7 2-1.5c2-3 5-6 5-10a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/>
          </svg>
          {showPicker ? 'Close Tooth Chart' : 'Select Teeth'}
        </button>

        {/* Selected chips */}
        {selectedList.length > 0 && (
          <div style={{ display:'flex', gap:4, flexWrap:'wrap', alignItems:'center' }}>
            {selectedList.map(n => {
              const q = QUADRANTS.find(q => q.teeth.includes(parseInt(n)))
              return (
                <span key={n} style={{ display:'inline-flex', alignItems:'center', gap:4, background: q ? q.color+'18' : 'var(--teal-xlight)', color: q ? q.color : 'var(--teal)', border:`1px solid ${q ? q.color+'30' : 'var(--teal-light)'}`, borderRadius:100, padding:'2px 8px 2px 6px', fontSize:'.7rem', fontWeight:700 }}>
                  🦷 FDI {n}
                  <button onClick={() => toggle(n)} style={{ background:'none', border:'none', cursor:'pointer', color:'inherit', padding:0, lineHeight:1, fontSize:12, marginLeft:1 }}>✕</button>
                </span>
              )
            })}
            <button onClick={clearAll} style={{ fontSize:'.68rem', color:'var(--muted)', background:'none', border:'none', cursor:'pointer', padding:'2px 4px' }}>Clear all</button>
          </div>
        )}

        {selected.size === 0 && (
          <span style={{ fontSize:'.75rem', color:'var(--muted)' }}>No teeth selected</span>
        )}
      </div>

      {/* Picker panel */}
      {showPicker && (
        <div className="fade-up" style={{ marginTop:'.75rem', background:'#fff', border:'1.5px solid var(--border)', borderRadius:14, padding:'1.1rem', boxShadow:'0 8px 32px rgba(0,0,0,.1)' }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
            <div>
              <div style={{ fontWeight:800, fontSize:'.88rem', color:'var(--navy)' }}>FDI Tooth Chart</div>
              <div style={{ fontSize:'.7rem', color:'var(--muted)', marginTop:1 }}>Click a tooth to select / deselect · Hover for name</div>
            </div>
            <div style={{ display:'flex', gap:'.4rem' }}>
              {aiDetected.size > 0 && (
                <button type="button" onClick={selectAI} className="btn btn-sm btn-ghost" style={{ fontSize:'.72rem', color:'#f59e0b', borderColor:'#f59e0b44' }}>
                  ⚠ Select AI findings ({aiDetected.size})
                </button>
              )}
              <button type="button" onClick={clearAll} className="btn btn-sm btn-ghost" style={{ fontSize:'.72rem' }}>Clear</button>
            </div>
          </div>

          {/* Quadrant legend */}
          <div style={{ display:'flex', gap:'.65rem', marginBottom:'1rem', flexWrap:'wrap' }}>
            {QUADRANTS.map(q => (
              <div key={q.id} style={{ display:'flex', alignItems:'center', gap:5, fontSize:'.7rem', color:'var(--slate)' }}>
                <div style={{ width:10, height:10, borderRadius:2, background:q.color, flexShrink:0 }}/>
                {q.label}
              </div>
            ))}
            {aiDetected.size > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:'.7rem', color:'var(--slate)' }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:'#f59e0b', flexShrink:0 }}/>
                AI Detected
              </div>
            )}
          </div>

          {/* ── Dental arch ─────────────────────────────────────────── */}

          {/* UPPER arch label */}
          <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.4rem' }}>
            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
            <span style={{ fontSize:'.65rem', fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', whiteSpace:'nowrap' }}>Upper Jaw</span>
            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
          </div>

          {/* Upper quadrants side by side */}
          <div style={{ display:'flex', justifyContent:'center', gap:0, marginBottom:4 }}>
            {/* Upper Right — teeth point toward midline (right side) */}
            <div style={{ borderRight:'2px dashed #e2e8f0', paddingRight:6, display:'flex', flexDirection:'column', alignItems:'flex-end' }}>
              <div style={{ fontSize:'.6rem', fontWeight:700, color:QUADRANTS[0].color, marginBottom:4, textAlign:'right' }}>Upper Right (UR)</div>
              <QuadrantRow quadrant={QUADRANTS[0]} selected={selected} aiDetected={aiDetected} onToggle={toggle}/>
            </div>
            {/* Upper Left */}
            <div style={{ borderLeft:'2px dashed #e2e8f0', paddingLeft:6, display:'flex', flexDirection:'column', alignItems:'flex-start' }}>
              <div style={{ fontSize:'.6rem', fontWeight:700, color:QUADRANTS[1].color, marginBottom:4 }}>Upper Left (UL)</div>
              <QuadrantRow quadrant={QUADRANTS[1]} selected={selected} aiDetected={aiDetected} onToggle={toggle}/>
            </div>
          </div>

          {/* Midline divider */}
          <div style={{ display:'flex', alignItems:'center', gap:'.5rem', margin:'.5rem 0' }}>
            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
            <span style={{ fontSize:'.62rem', fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', whiteSpace:'nowrap' }}>— Midline —</span>
            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
          </div>

          {/* Lower quadrants */}
          <div style={{ display:'flex', justifyContent:'center', gap:0, marginTop:4 }}>
            {/* Lower Left */}
            <div style={{ borderRight:'2px dashed #e2e8f0', paddingRight:6, display:'flex', flexDirection:'column', alignItems:'flex-end' }}>
              <QuadrantRow quadrant={QUADRANTS[2]} selected={selected} aiDetected={aiDetected} onToggle={toggle}/>
              <div style={{ fontSize:'.6rem', fontWeight:700, color:QUADRANTS[2].color, marginTop:4, textAlign:'right' }}>Lower Left (LL)</div>
            </div>
            {/* Lower Right */}
            <div style={{ borderLeft:'2px dashed #e2e8f0', paddingLeft:6, display:'flex', flexDirection:'column', alignItems:'flex-start' }}>
              <QuadrantRow quadrant={QUADRANTS[3]} selected={selected} aiDetected={aiDetected} onToggle={toggle}/>
              <div style={{ fontSize:'.6rem', fontWeight:700, color:QUADRANTS[3].color, marginTop:4 }}>Lower Right (LR)</div>
            </div>
          </div>

          {/* LOWER arch label */}
          <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginTop:'.4rem' }}>
            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
            <span style={{ fontSize:'.65rem', fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', whiteSpace:'nowrap' }}>Lower Jaw</span>
            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
          </div>

          {/* Summary */}
          {selected.size > 0 && (
            <div style={{ marginTop:'1rem', padding:'.65rem .85rem', background:'var(--teal-xlight)', border:'1px solid var(--teal-light)', borderRadius:8 }}>
              <div style={{ fontSize:'.68rem', fontWeight:700, color:'var(--teal-dark)', marginBottom:3 }}>Selected — will appear in report:</div>
              <div style={{ fontSize:'.78rem', color:'var(--teal-dark)', fontWeight:600 }}>
                {selectedList.map(n => `FDI ${n}`).join(' · ')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
