'use client'
import { useState } from 'react'
import Navbar from './components/Navbar'

interface Ejercicio {
  id: number
  tipo: string
  pregunta: string
  opciones: string[]
  respuesta_correcta: string
  explicacion: string
  instruccion_rebt: string
  dificultad: string
}

interface ProgresoItem {
  total: number
  aciertos: number
}

export default function Home() {
  const [ejercicio, setEjercicio] = useState<Ejercicio | null>(null)
  const [cargando, setCargando] = useState<boolean>(false)
  const [respuesta, setRespuesta] = useState<string | null>(null)
  const [resultado, setResultado] = useState<boolean | null>(null)
  const [instruccion, setInstruccion] = useState<string>('ITC-BT-01')
  const [dificultad, setDificultad] = useState<string>('basico')
  const [stats, setStats] = useState<{ total: number; aciertos: number }>({ total: 0, aciertos: 0 })
  const [progreso, setProgreso] = useState<Record<string, ProgresoItem>>({})

  const instrucciones = [
    'ITC-BT-01', 'ITC-BT-02', 'ITC-BT-03', 'ITC-BT-04', 'ITC-BT-05',
    'ITC-BT-06', 'ITC-BT-07', 'ITC-BT-08', 'ITC-BT-09', 'ITC-BT-10',
    'ITC-BT-19', 'ITC-BT-20', 'ITC-BT-21', 'ITC-BT-22', 'ITC-BT-23',
    'ITC-BT-24', 'ITC-BT-25', 'ITC-BT-26', 'ITC-BT-27', 'ITC-BT-28'
  ]

  const generarEjercicio = async () => {
    setCargando(true)
    setRespuesta(null)
    setResultado(null)
    try {
      const res = await fetch('/api/ejercicios/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruccion_rebt: instruccion, dificultad })
      })
      const data = await res.json()
      setEjercicio(data)
    } catch (err) {
      console.error(err)
    }
    setCargando(false)
  }

  const responder = (opcion: string) => {
    if (!ejercicio) return
    setRespuesta(opcion)
    const correcto = opcion === ejercicio.respuesta_correcta
    setResultado(correcto)
    setStats(prev => ({
      total: prev.total + 1,
      aciertos: correcto ? prev.aciertos + 1 : prev.aciertos
    }))
    setProgreso(prev => {
      const actual = prev[instruccion] || { total: 0, aciertos: 0 }
      return {
        ...prev,
        [instruccion]: {
          total: actual.total + 1,
          aciertos: correcto ? actual.aciertos + 1 : actual.aciertos
        }
      }
    })
  }

  const letras = ['A', 'B', 'C', 'D']

  const Selectores = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
      <div>
        <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>
          Instrucción del REBT
        </label>
        <select
          value={instruccion}
          onChange={e => setInstruccion(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e5e5e5', fontSize: '13px', background: '#fff', color: '#1a1a1a' }}
        >
          {instrucciones.map(i => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>
          Dificultad
        </label>
        <select
          value={dificultad}
          onChange={e => setDificultad(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e5e5e5', fontSize: '13px', background: '#fff', color: '#1a1a1a' }}
        >
          <option value="basico">Básico</option>
          <option value="intermedio">Intermedio</option>
          <option value="avanzado">Avanzado</option>
        </select>
      </div>
    </div>
  )

  return (
    <>
      <Navbar />
      <main style={{ padding: '32px 24px', maxWidth: '960px', margin: '0 auto' }}>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 500, color: '#1a1a1a', marginBottom: '4px' }}>
            Tests del REBT
          </h1>
          <p style={{ fontSize: '14px', color: '#888' }}>
            Practica por instrucción o genera un test global para evaluar tu nivel
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '28px' }}>
          {[
            { label: 'Preguntas respondidas', value: stats.total.toString(), sub: 'esta sesión' },
            { label: 'Aciertos', value: stats.total > 0 ? `${Math.round((stats.aciertos / stats.total) * 100)}%` : '—', sub: 'promedio' },
            { label: 'Instrucción activa', value: instruccion, sub: 'REBT' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '6px' }}>{s.label}</div>
              <div style={{ fontSize: '22px', fontWeight: 500, color: '#1a1a1a' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#bbb', marginTop: '2px' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '20px' }}>

          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#aaa', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Pregunta activa
            </div>
            <div style={{ background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: '12px', padding: '20px' }}>

              {!ejercicio && !cargando && (
                <div style={{ padding: '8px 0' }}>
                  <Selectores />
                  <button onClick={generarEjercicio} style={{ background: '#1A6FE8', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '13px', fontWeight: 500, width: '100%' }}>
                    Generar pregunta
                  </button>
                </div>
              )}

              {cargando && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa', fontSize: '14px' }}>
                  Generando pregunta...
                </div>
              )}

              {ejercicio && !cargando && (
                <>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '4px', background: '#E6F1FB', color: '#185FA5' }}>
                      {ejercicio.instruccion_rebt}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '4px', background: '#f5f5f5', color: '#888' }}>
                      {ejercicio.dificultad}
                    </span>
                  </div>

                  <p style={{ fontSize: '15px', fontWeight: 500, color: '#1a1a1a', lineHeight: 1.5, marginBottom: '20px' }}>
                    {ejercicio.pregunta}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {ejercicio.opciones.map((opcion: string, i: number) => {
                      let borderColor = '#e5e5e5'
                      let bg = '#fff'
                      let color = '#1a1a1a'
                      if (respuesta) {
                        if (opcion === ejercicio.respuesta_correcta) {
                          borderColor = '#1D9E75'; bg = '#E1F5EE'; color = '#085041'
                        } else if (opcion === respuesta) {
                          borderColor = '#E24B4A'; bg = '#FCEBEB'; color = '#501313'
                        }
                      }
                      return (
                        <button key={i} onClick={() => !respuesta && responder(opcion)} style={{ border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '12px 16px', background: bg, color, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', transition: 'all .15s', width: '100%' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 500, flexShrink: 0, color: '#888' }}>
                            {letras[i]}
                          </div>
                          {opcion}
                        </button>
                      )
                    })}
                  </div>

                  {respuesta && (
                    <div style={{ marginTop: '16px', padding: '14px 16px', borderRadius: '8px', border: `0.5px solid ${resultado ? '#9FE1CB' : '#F7C1C1'}`, background: resultado ? '#E1F5EE' : '#FCEBEB' }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: resultado ? '#085041' : '#501313', marginBottom: '4px' }}>
                        {resultado ? '✓ Correcto' : '✗ Incorrecto'}
                      </p>
                      <p style={{ fontSize: '12px', color: resultado ? '#0F6E56' : '#A32D2D', lineHeight: 1.6 }}>
                        {ejercicio.explicacion}
                      </p>
                    </div>
                  )}

                  {respuesta && (
                    <div style={{ marginTop: '16px', borderTop: '0.5px solid #e5e5e5', paddingTop: '16px' }}>
                      <Selectores />
                      <button onClick={generarEjercicio} style={{ background: '#1A6FE8', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 500, width: '100%' }}>
                        Nueva pregunta
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#aaa', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Mi progreso
            </div>
            <div style={{ background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Nivel general</span>
                <span style={{ fontWeight: 500, color: '#1A6FE8' }}>
                  {stats.total > 0 ? `${Math.round((stats.aciertos / stats.total) * 100)}%` : '—'}
                </span>
              </div>
              <div style={{ height: '6px', background: '#f5f5f5', borderRadius: '3px', marginBottom: '16px' }}>
                <div style={{ height: '100%', background: '#1A6FE8', borderRadius: '3px', width: stats.total > 0 ? `${Math.round((stats.aciertos / stats.total) * 100)}%` : '0%', transition: 'width 0.4s ease' }} />
              </div>

              {Object.keys(progreso).length === 0 ? (
                <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', padding: '12px 0' }}>
                  Responde preguntas para ver tu progreso
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {Object.entries(progreso).map(([itc, data]) => {
                    const pct = Math.round((data.aciertos / data.total) * 100)
                    return (
                      <div key={itc} style={{ borderBottom: '0.5px solid #f0f0f0', paddingBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', color: '#1a1a1a' }}>{itc}</span>
                          <span style={{ fontSize: '12px', fontWeight: 500, color: '#1A6FE8' }}>{pct}%</span>
                        </div>
                        <div style={{ height: '4px', background: '#f5f5f5', borderRadius: '2px' }}>
                          <div style={{ height: '100%', borderRadius: '2px', background: pct >= 70 ? '#1D9E75' : pct >= 40 ? '#1A6FE8' : '#E24B4A', width: `${pct}%`, transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </>
  )
}