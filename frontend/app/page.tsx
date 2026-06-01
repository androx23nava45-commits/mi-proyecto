'use client'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'

interface Ejercicio {
  id: number
  tipo: string
  subtipo?: string
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

const INCENTIVOS_RACHA: Record<number, string> = {
  3: '🔥 ¡Racha de 3! Los mejores electricistas no paran aquí...',
  5: '⚡ ¡5 seguidas! Estás en modo profesional.',
  10: '🏆 ¡10 correctas! El REBT no tiene secretos para ti.',
}

const INCENTIVOS_FALLO = [
  '💪 Los errores son parte del aprendizaje. Vamos otra vez.',
  '😅 Casi. Repasa la explicación y lo clavarás la próxima.',
  '🔄 Un buen electricista repasa hasta que lo domina. Tú puedes.',
]

const INCENTIVOS_PORCENTAJE: { min: number; max: number; msg: string }[] = [
  { min: 80, max: 100, msg: '🏆 Nivel experto detectado. ¿Te atreves con dificultad avanzada?' },
  { min: 60, max: 79, msg: '⚡ Buen nivel. Sigue así y serás un referente del REBT.' },
  { min: 40, max: 59, msg: '📚 Vas por buen camino. Un poco más de práctica y lo tienes.' },
  { min: 0, max: 39, msg: '😤 Hoy no es tu día, pero mañana repasamos juntos.' },
]

const TIPOS_MATEMATICAS = [
  { id: 'ohm', label: 'Ley de Ohm' },
  { id: 'joule', label: 'Efecto Joule' },
  { id: 'potencia', label: 'Triángulo de potencias' },
  { id: 'caida', label: 'Caída de tensión' },
  { id: 'seccion', label: 'Sección de cable' },
  { id: 'rlc', label: 'Circuitos RLC' },
]

export default function Home() {
  const [categoria, setCategoria] = useState<string>('test')
  const [ejercicio, setEjercicio] = useState<Ejercicio | null>(null)
  const [cargando, setCargando] = useState<boolean>(false)
  const [respuesta, setRespuesta] = useState<string | null>(null)
  const [resultado, setResultado] = useState<boolean | null>(null)
  const [instruccion, setInstruccion] = useState<string>('ITC-BT-01')
  const [dificultad, setDificultad] = useState<string>('basico')
  const [tipoMat, setTipoMat] = useState<string>('ohm')
  const [stats, setStats] = useState<{ total: number; aciertos: number }>({ total: 0, aciertos: 0 })
  const [progreso, setProgreso] = useState<Record<string, ProgresoItem>>({})
  const [racha, setRacha] = useState<number>(0)
  const [incentivo, setIncentivo] = useState<string>('')
  const [montado, setMontado] = useState<boolean>(false)

  useEffect(() => {
    setMontado(true)
    setIncentivo('⚡ Un electricista profesional conoce el REBT de memoria. ¿Cuánto sabes tú?')
  }, [])

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
    setEjercicio(null)
    try {
      let url = '/api/ejercicios/generar'
      let body: Record<string, string> = { instruccion_rebt: instruccion, dificultad }

      if (categoria === 'matematicas') {
        url = '/api/ejercicios/generar-matematicas'
        body = { tipo: tipoMat, dificultad }
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
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

    const nuevaRacha = correcto ? racha + 1 : 0
    setRacha(nuevaRacha)

    const nuevasStats = {
      total: stats.total + 1,
      aciertos: correcto ? stats.aciertos + 1 : stats.aciertos
    }
    setStats(nuevasStats)

    const clave = categoria === 'matematicas' ? `MAT-${tipoMat}` : instruccion
    setProgreso(prev => {
      const actual = prev[clave] || { total: 0, aciertos: 0 }
      return {
        ...prev,
        [clave]: {
          total: actual.total + 1,
          aciertos: correcto ? actual.aciertos + 1 : actual.aciertos
        }
      }
    })

    if (correcto && INCENTIVOS_RACHA[nuevaRacha]) {
      setIncentivo(INCENTIVOS_RACHA[nuevaRacha])
    } else if (!correcto) {
      const idx = nuevasStats.total % INCENTIVOS_FALLO.length
      setIncentivo(INCENTIVOS_FALLO[idx])
    } else if (nuevasStats.total >= 3) {
      const pct = Math.round((nuevasStats.aciertos / nuevasStats.total) * 100)
      const msg = INCENTIVOS_PORCENTAJE.find(i => pct >= i.min && pct <= i.max)
      if (msg) setIncentivo(msg.msg)
    }
  }

  const letras = ['A', 'B', 'C', 'D']

  const SelectoresTest = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
      <div>
        <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>Instrucción del REBT</label>
        <select value={instruccion} onChange={e => setInstruccion(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e5e5e5', fontSize: '13px', background: '#fff', color: '#1a1a1a' }}>
          {instrucciones.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>Dificultad</label>
        <select value={dificultad} onChange={e => setDificultad(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e5e5e5', fontSize: '13px', background: '#fff', color: '#1a1a1a' }}>
          <option value="basico">Básico</option>
          <option value="intermedio">Intermedio</option>
          <option value="avanzado">Avanzado</option>
        </select>
      </div>
    </div>
  )

  const SelectoresMatematicas = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
      <div>
        <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>Tipo de cálculo</label>
        <select value={tipoMat} onChange={e => setTipoMat(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e5e5e5', fontSize: '13px', background: '#fff', color: '#1a1a1a' }}>
          {TIPOS_MATEMATICAS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>Dificultad</label>
        <select value={dificultad} onChange={e => setDificultad(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e5e5e5', fontSize: '13px', background: '#fff', color: '#1a1a1a' }}>
          <option value="basico">Básico</option>
          <option value="intermedio">Intermedio</option>
          <option value="avanzado">Avanzado</option>
        </select>
      </div>
    </div>
  )

  const categorias = [
    { id: 'test', label: 'Test REBT', icono: '📋' },
    { id: 'matematicas', label: 'Matemáticas', icono: '➗' },
    { id: 'simbologia', label: 'Simbología', icono: '⚡' },
  ]

  return (
    <>
      <Navbar />
      <main style={{ padding: '32px 24px', maxWidth: '960px', margin: '0 auto' }}>

        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 500, color: '#1a1a1a', marginBottom: '4px' }}>Ejercicios</h1>
          <p style={{ fontSize: '14px', color: '#888' }}>Practica y mejora tu nivel como electricista profesional</p>
        </div>

        {montado && (
          <div style={{ background: '#E6F1FB', border: '0.5px solid #B5D4F4', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', fontSize: '13px', color: '#185FA5', fontWeight: 500 }}>
            {incentivo}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {categorias.map(c => (
            <button key={c.id} onClick={() => { setCategoria(c.id); setEjercicio(null); setRespuesta(null); setResultado(null) }} style={{ padding: '8px 18px', borderRadius: '8px', border: categoria === c.id ? '1.5px solid #1A6FE8' : '0.5px solid #e5e5e5', background: categoria === c.id ? '#E6F1FB' : '#fff', color: categoria === c.id ? '#185FA5' : '#888', fontSize: '13px', fontWeight: categoria === c.id ? 500 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {c.icono} {c.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '28px' }}>
          {[
            { label: 'Preguntas respondidas', value: stats.total.toString(), sub: 'esta sesión' },
            { label: 'Aciertos', value: stats.total > 0 ? `${Math.round((stats.aciertos / stats.total) * 100)}%` : '—', sub: 'promedio' },
            { label: 'Racha actual', value: racha > 0 ? `${racha} 🔥` : '—', sub: 'correctas seguidas' },
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
              {categoria === 'test' ? 'Test REBT' : categoria === 'matematicas' ? 'Matemáticas eléctricas' : 'Simbología técnica'}
            </div>
            <div style={{ background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: '12px', padding: '20px' }}>

              {categoria === 'simbologia' && !ejercicio && !cargando && (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚡</div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a1a', marginBottom: '6px' }}>Simbología técnica</p>
                  <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>Próximamente: identifica símbolos, interpreta esquemas reales</p>
                  <span style={{ background: '#FAEEDA', color: '#633806', fontSize: '12px', padding: '4px 12px', borderRadius: '6px' }}>En desarrollo</span>
                </div>
              )}

              {(categoria === 'test' || categoria === 'matematicas') && !ejercicio && !cargando && (
                <div style={{ padding: '8px 0' }}>
                  {categoria === 'test' ? <SelectoresTest /> : <SelectoresMatematicas />}
                  <button onClick={generarEjercicio} style={{ background: '#1A6FE8', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '13px', fontWeight: 500, width: '100%' }}>
                    Generar ejercicio
                  </button>
                </div>
              )}

              {cargando && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa', fontSize: '14px' }}>
                  Generando ejercicio...
                </div>
              )}

              {ejercicio && !cargando && (
                <>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                    {ejercicio.subtipo && (
                      <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '4px', background: '#E1F5EE', color: '#085041' }}>
                        {TIPOS_MATEMATICAS.find(t => t.id === ejercicio.subtipo)?.label || ejercicio.subtipo}
                      </span>
                    )}
                    {ejercicio.instruccion_rebt && ejercicio.instruccion_rebt !== 'N/A' && (
                      <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '4px', background: '#E6F1FB', color: '#185FA5' }}>
                        {ejercicio.instruccion_rebt}
                      </span>
                    )}
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
                        if (opcion === ejercicio.respuesta_correcta) { borderColor = '#1D9E75'; bg = '#E1F5EE'; color = '#085041' }
                        else if (opcion === respuesta) { borderColor = '#E24B4A'; bg = '#FCEBEB'; color = '#501313' }
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
                      {categoria === 'test' ? <SelectoresTest /> : <SelectoresMatematicas />}
                      <button onClick={generarEjercicio} style={{ background: '#1A6FE8', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 500, width: '100%' }}>
                        Siguiente ejercicio
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
                  Responde ejercicios para ver tu progreso
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {Object.entries(progreso).map(([clave, data]) => {
                    const pct = Math.round((data.aciertos / data.total) * 100)
                    return (
                      <div key={clave} style={{ borderBottom: '0.5px solid #f0f0f0', paddingBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', color: '#1a1a1a' }}>{clave}</span>
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