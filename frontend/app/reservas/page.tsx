'use client'
import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'

interface Sesion {
  id: string
  titulo: string
  tipo: string
  profesor: string
  fecha: string
  hora: string
  duracion: string
  modalidad: string
  ubicacion: string | null
  plazas_total: number
  plazas_disponibles: number
  descripcion: string
}

interface Reserva {
  id: string
  sesion_id: string
  alumno_nombre: string
  alumno_email: string
  estado: string
  sesiones: Sesion
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: '14px',
  border: '0.5px solid rgba(0,0,0,0.06)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  overflow: 'hidden',
  marginBottom: '16px'
}

const btnPrimary: React.CSSProperties = {
  background: 'linear-gradient(135deg,#1A6FE8,#0D4FA8)',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '7px 14px',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  whiteSpace: 'nowrap' as const,
  boxShadow: '0 2px 6px rgba(26,111,232,0.25)'
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS = ['L','M','X','J','V','S','D']

export default function Reservas() {
  const [sesiones, setSesiones] = useState<Sesion[]>([])
  const [misReservas, setMisReservas] = useState<Reserva[]>([])
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [mes, setMes] = useState<number>(new Date().getMonth())
  const [anio, setAnio] = useState<number>(new Date().getFullYear())
  const [cargando, setCargando] = useState<boolean>(true)
  const [modalReserva, setModalReserva] = useState<Sesion | null>(null)
  const [nombre, setNombre] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [reservando, setReservando] = useState<boolean>(false)
  const [mensajeExito, setMensajeExito] = useState<string>('')
  const [emailConsulta, setEmailConsulta] = useState<string>('')

  useEffect(() => {
    cargarSesiones()
  }, [])

  const cargarSesiones = async () => {
    setCargando(true)
    try {
      const res = await fetch('/api/sesiones')
      const data = await res.json()
      setSesiones(data)
      if (data.length > 0) setFechaSeleccionada(data[0].fecha)
    } catch (err) {
      console.error(err)
    }
    setCargando(false)
  }

  const cargarMisReservas = async () => {
    if (!emailConsulta) return
    try {
      const res = await fetch(`/api/reservas?email=${emailConsulta}`)
      const data = await res.json()
      setMisReservas(data)
    } catch (err) {
      console.error(err)
    }
  }

  const hacerReserva = async () => {
    if (!modalReserva || !nombre || !email) return
    setReservando(true)
    try {
      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sesion_id: modalReserva.id, alumno_nombre: nombre, alumno_email: email })
      })
      const data = await res.json()
      if (data.error) {
        alert(data.error)
      } else {
        setMensajeExito(`¡Reserva confirmada! Recibirás un email en ${email} con los detalles.`)
        setModalReserva(null)
        setNombre('')
        setEmail('')
        cargarSesiones()
      }
    } catch (err) {
      console.error(err)
    }
    setReservando(false)
  }

  const cancelarReserva = async (id: string) => {
    if (!confirm('¿Seguro que quieres cancelar esta reserva?')) return
    try {
      await fetch(`/api/reservas/${id}`, { method: 'DELETE' })
      setMisReservas(prev => prev.filter(r => r.id !== id))
      cargarSesiones()
    } catch (err) {
      console.error(err)
    }
  }

  const getDiasDelMes = (m: number, a: number) => {
    const primerDia = new Date(a, m, 1).getDay()
    const diasMes = new Date(a, m + 1, 0).getDate()
    const offset = primerDia === 0 ? 6 : primerDia - 1
    return { diasMes, offset }
  }

  const { diasMes, offset } = getDiasDelMes(mes, anio)

  const fechasConSesiones = new Set(
    sesiones.map(s => s.fecha)
  )

  const sesionesDia = sesiones.filter(s => s.fecha === fechaSeleccionada && (filtroTipo === 'todos' || s.tipo === filtroTipo))

  const formatearFecha = (fecha: string) => {
    const d = new Date(fecha + 'T00:00:00')
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const formatearHora = (hora: string) => hora.slice(0, 5)

  return (
    <>
      <Navbar />
      <main style={{ padding: '28px 24px', maxWidth: '960px', margin: '0 auto' }}>

        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0D1117', letterSpacing: '-0.3px', marginBottom: '3px' }}>Reservas</h1>
          <p style={{ fontSize: '13px', color: '#888' }}>Reserva tutorías individuales y clases grupales</p>
        </div>

        {mensajeExito && (
          <div style={{ background: '#E8F8F2', border: '1px solid #9FE1CB', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px', fontSize: '13px', color: '#085041', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>✓</span>
            <span>{mensajeExito}</span>
            <button onClick={() => setMensajeExito('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#085041', fontSize: '16px' }}>×</button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px' }}>
          <div>
            <div style={cardStyle}>
              <div style={{ padding: '14px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={() => { if (mes === 0) { setMes(11); setAnio(a => a - 1) } else setMes(m => m - 1) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#666' }}>←</button>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#0D1117', minWidth: '140px', textAlign: 'center' }}>{MESES[mes]} {anio}</span>
                  <button onClick={() => { if (mes === 11) { setMes(0); setAnio(a => a + 1) } else setMes(m => m + 1) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#666' }}>→</button>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { id: 'todos', label: 'Todos' },
                    { id: 'tutoria', label: 'Tutorías' },
                    { id: 'grupal', label: 'Grupales' },
                  ].map(f => (
                    <button key={f.id} onClick={() => setFiltroTipo(f.id)} style={{ padding: '5px 10px', borderRadius: '7px', border: 'none', background: filtroTipo === f.id ? '#1A6FE8' : '#F5F5F5', color: filtroTipo === f.id ? '#fff' : '#666', fontSize: '12px', fontWeight: filtroTipo === f.id ? 500 : 400, cursor: 'pointer' }}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px', marginBottom: '16px' }}>
                  {DIAS.map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#999', padding: '4px 0', textTransform: 'uppercase' }}>{d}</div>
                  ))}
                  {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: diasMes }).map((_, i) => {
                    const dia = i + 1
                    const fechaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
                    const tieneSesiones = fechasConSesiones.has(fechaStr)
                    const seleccionado = fechaStr === fechaSeleccionada
                    const hoy = new Date()
                    const esPasado = new Date(fechaStr) < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
                    return (
                      <div key={dia} onClick={() => { if (tieneSesiones) setFechaSeleccionada(fechaStr) }} style={{
                        textAlign: 'center', padding: '8px 4px', borderRadius: '8px', fontSize: '13px',
                        cursor: tieneSesiones ? 'pointer' : 'default',
                        background: seleccionado ? 'linear-gradient(135deg,#1A6FE8,#0D4FA8)' : tieneSesiones ? '#EEF5FF' : 'transparent',
                        color: seleccionado ? '#fff' : tieneSesiones ? '#1A6FE8' : esPasado ? '#ccc' : '#555',
                        fontWeight: seleccionado || tieneSesiones ? 600 : 400,
                        transition: 'all .15s'
                      }}>
                        {dia}
                      </div>
                    )
                  })}
                </div>

                {fechaSeleccionada && (
                  <>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                      {formatearFecha(fechaSeleccionada)}
                    </div>
                    {sesionesDia.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px', color: '#bbb', fontSize: '13px' }}>
                        No hay sesiones disponibles para este día
                      </div>
                    ) : (
                      sesionesDia.map(s => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#0D1117', width: '52px', flexShrink: 0 }}>{formatearHora(s.hora)}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: '#0D1117', marginBottom: '2px' }}>{s.titulo}</div>
                            <div style={{ fontSize: '11px', color: '#999' }}>{s.profesor} · {s.duracion} · {s.modalidad === 'online' ? '🌐 Online' : `📍 ${s.ubicacion}`}</div>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '5px', background: s.plazas_disponibles === 0 ? '#F5F5F5' : s.tipo === 'tutoria' ? '#E8F8F2' : '#EEF5FF', color: s.plazas_disponibles === 0 ? '#bbb' : s.tipo === 'tutoria' ? '#085041' : '#1A6FE8', marginRight: '8px', whiteSpace: 'nowrap' }}>
                            {s.plazas_disponibles === 0 ? 'Completo' : `${s.plazas_disponibles} plaza${s.plazas_disponibles > 1 ? 's' : ''}`}
                          </span>
                          {s.plazas_disponibles > 0 ? (
                            <button onClick={() => setModalReserva(s)} style={btnPrimary}>Reservar</button>
                          ) : (
                            <button disabled style={{ ...btnPrimary, background: '#E5E7EB', color: '#9CA3AF', boxShadow: 'none', cursor: 'not-allowed' }}>Completo</button>
                          )}
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Mis reservas</div>
            <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '16px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                <input value={emailConsulta} onChange={e => setEmailConsulta(e.target.value)} placeholder="Tu email" style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1.5px solid #EAEAEA', fontSize: '12px', outline: 'none' }} />
                <button onClick={cargarMisReservas} style={{ ...btnPrimary, padding: '8px 10px' }}>Ver</button>
              </div>
              {misReservas.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', padding: '12px 0' }}>Introduce tu email para ver tus reservas</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {misReservas.map(r => (
                    <div key={r.id} style={{ background: '#F8F9FA', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: r.sesiones?.tipo === 'tutoria' ? '#EEF5FF' : '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                          {r.sesiones?.tipo === 'tutoria' ? '📅' : '👥'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 500, color: '#0D1117', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.sesiones?.titulo}</div>
                          <div style={{ fontSize: '11px', color: '#999' }}>{r.sesiones?.fecha} · {formatearHora(r.sesiones?.hora || '')}</div>
                          <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: r.estado === 'confirmada' ? '#E8F8F2' : '#FAEEDA', color: r.estado === 'confirmada' ? '#085041' : '#633806', display: 'inline-block', marginTop: '4px' }}>
                            {r.estado === 'confirmada' ? '✓ Confirmada' : 'Pendiente'}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => cancelarReserva(r.id)} style={{ width: '100%', marginTop: '8px', padding: '6px', borderRadius: '7px', border: '1px solid #F7C1C1', background: '#FEF0F0', color: '#A32D2D', fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}>
                        Cancelar reserva
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: '#EEF5FF', borderRadius: '12px', padding: '14px 16px', fontSize: '12px', color: '#185FA5', lineHeight: 1.6 }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>📧 Confirmación por email</div>
              Al reservar recibirás un email con los detalles de la sesión y el enlace de acceso si es online.
            </div>
          </div>
        </div>

        {modalReserva && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0D1117', marginBottom: '4px' }}>Confirmar reserva</h2>
              <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>{modalReserva.titulo}</p>

              <div style={{ background: '#F8F9FA', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', fontSize: '12px', color: '#555' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Fecha</span><span style={{ fontWeight: 500, color: '#0D1117' }}>{formatearFecha(modalReserva.fecha)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Hora</span><span style={{ fontWeight: 500, color: '#0D1117' }}>{formatearHora(modalReserva.hora)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Duración</span><span style={{ fontWeight: 500, color: '#0D1117' }}>{modalReserva.duracion}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Modalidad</span><span style={{ fontWeight: 500, color: '#0D1117' }}>{modalReserva.modalidad === 'online' ? '🌐 Online' : `📍 ${modalReserva.ubicacion}`}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>Tu nombre</label>
                  <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre completo" style={{ width: '100%', padding: '10px 12px', borderRadius: '9px', border: '1.5px solid #EAEAEA', fontSize: '13px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>Tu email</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@ejemplo.com" type="email" style={{ width: '100%', padding: '10px 12px', borderRadius: '9px', border: '1.5px solid #EAEAEA', fontSize: '13px', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setModalReserva(null)} style={{ flex: 1, padding: '11px', borderRadius: '9px', border: '1px solid #EAEAEA', background: '#fff', fontSize: '13px', color: '#666', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={hacerReserva} disabled={!nombre || !email || reservando} style={{ flex: 2, padding: '11px', borderRadius: '9px', border: 'none', background: !nombre || !email ? '#E5E7EB' : 'linear-gradient(135deg,#1A6FE8,#0D4FA8)', color: !nombre || !email ? '#9CA3AF' : '#fff', fontSize: '13px', fontWeight: 500, cursor: !nombre || !email ? 'not-allowed' : 'pointer', boxShadow: !nombre || !email ? 'none' : '0 2px 8px rgba(26,111,232,0.25)' }}>
                  {reservando ? 'Reservando...' : '✓ Confirmar reserva'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}