export default function Navbar() {
  return (
    <nav style={{
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '0.5px solid rgba(0,0,0,0.06)',
      padding: '0 24px',
      height: '58px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '30px', height: '30px',
          background: 'linear-gradient(135deg,#1A6FE8,#0D4FA8)',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2">
            <circle cx="8" cy="8" r="3"/>
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: '17px', fontWeight: 600, color: '#0D1117', letterSpacing: '-0.5px' }}>TECNIO</div>
          <div style={{ fontSize: '10px', color: '#999', marginTop: '-2px', letterSpacing: '0.02em' }}>by thePower</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {['Ejercicios', 'Material', 'Reservas', 'Mi avance'].map((item, i) => (
          <div key={i} style={{
            fontSize: '13px',
            color: i === 0 ? '#1A6FE8' : '#666',
            background: i === 0 ? '#EEF5FF' : 'transparent',
            padding: '6px 12px',
            borderRadius: '7px',
            fontWeight: i === 0 ? 500 : 400,
            cursor: 'pointer'
          }}>
            {item}
          </div>
        ))}
        <div style={{
          width: '32px', height: '32px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#1A6FE8,#0D4FA8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: 600, color: '#fff',
          marginLeft: '8px',
          boxShadow: '0 2px 8px rgba(26,111,232,0.3)'
        }}>
          AL
        </div>
      </div>
    </nav>
  )
}