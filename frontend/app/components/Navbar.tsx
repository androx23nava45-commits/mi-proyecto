export default function Navbar() {
  return (
    <nav style={{
      background: '#fff',
      borderBottom: '0.5px solid #e5e5e5',
      padding: '0 24px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '24px', height: '24px',
          border: '2px solid #1A6FE8',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ width: '8px', height: '8px', background: '#1A6FE8', borderRadius: '50%' }} />
        </div>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#1A6FE8', letterSpacing: '-0.5px' }}>
            TECNIO
          </div>
          <div style={{ fontSize: '10px', color: '#999', marginTop: '-2px' }}>
            by thePower
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <span style={{ fontSize: '13px', color: '#1A6FE8', fontWeight: 500 }}>Ejercicios</span>
        <span style={{ fontSize: '13px', color: '#888' }}>Material</span>
        <span style={{ fontSize: '13px', color: '#888' }}>Reservas</span>
        <span style={{ fontSize: '13px', color: '#888' }}>Mi avance</span>
        <div style={{
          width: '32px', height: '32px',
          borderRadius: '50%',
          background: '#E6F1FB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: 500, color: '#185FA5'
        }}>
          AL
        </div>
      </div>
    </nav>
  )
}