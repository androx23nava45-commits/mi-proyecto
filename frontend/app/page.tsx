'use client'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import { supabase } from '../lib/supabase'

interface Ejercicio {
  id?: number
  tipo: string
  subtipo?: string
  categoria?: string
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

interface ExamenResultado {
  pregunta: string
  respuesta_usuario: string
  respuesta_correcta: string
  correcto: boolean
  explicacion: string
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

const INSTRUCCIONES = [
  'ITC-BT-01','ITC-BT-02','ITC-BT-03','ITC-BT-04','ITC-BT-05',
  'ITC-BT-06','ITC-BT-07','ITC-BT-08','ITC-BT-09','ITC-BT-10',
  'ITC-BT-11','ITC-BT-12','ITC-BT-13','ITC-BT-14','ITC-BT-15',
  'ITC-BT-16','ITC-BT-17','ITC-BT-18','ITC-BT-19','ITC-BT-20',
  'ITC-BT-21','ITC-BT-22','ITC-BT-23','ITC-BT-24','ITC-BT-25',
  'ITC-BT-26','ITC-BT-27','ITC-BT-28','ITC-BT-29','ITC-BT-30',
  'ITC-BT-31','ITC-BT-32','ITC-BT-33','ITC-BT-34','ITC-BT-35',
  'ITC-BT-36','ITC-BT-37','ITC-BT-38','ITC-BT-39','ITC-BT-40',
  'ITC-BT-41','ITC-BT-42','ITC-BT-43','ITC-BT-44','ITC-BT-45',
  'ITC-BT-46','ITC-BT-47','ITC-BT-48','ITC-BT-49','ITC-BT-50',
  'ITC-BT-51','ITC-BT-52'
]

const DIFICULTADES = [
  { id: 'basico', label: 'Fácil', emoji: '🟢', desc: 'Conceptos básicos', color: '#1D9E75', bg: '#E8F8F2', border: '#9FE1CB' },
  { id: 'intermedio', label: 'Medio', emoji: '🟠', desc: 'Aplicación práctica', color: '#BA7517', bg: '#FAEEDA', border: '#FAC775' },
  { id: 'avanzado', label: 'Difícil', emoji: '🔴', desc: 'Nivel profesional', color: '#A32D2D', bg: '#FEF0F0', border: '#F7C1C1' },
]

const UMBRAL_DESBLOQUEO = 70

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: '14px',
  border: '0.5px solid rgba(0,0,0,0.06)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  overflow: 'hidden'
}

const btnPrimary: React.CSSProperties = {
  background: 'linear-gradient(135deg,#1A6FE8,#0D4FA8)',
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  padding: '12px 20px',
  fontSize: '13px',
  fontWeight: 500,
  width: '100%',
  marginTop: '16px',
  boxShadow: '0 2px 8px rgba(26,111,232,0.25)',
  cursor: 'pointer'
}

export default function Home() {
  const [categoria, setCategoria] = useState<string>('test')
  const [ejercicio, setEjercicio] = useState<Ejercicio | null>(null)
  const [cargando, setCargando] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
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

  const [modoExamen, setModoExamen] = useState<boolean>(false)
  const [examenConfig, setExamenConfig] = useState({ num: 10, cats: ['test', 'matematicas'], dificultad: 'intermedio' })
  const [examenPreguntas, setExamenPreguntas] = useState<Ejercicio[]>([])
  const [examenIndex, setExamenIndex] = useState<number>(0)
  const [examenRespuesta, setExamenRespuesta] = useState<string | null>(null)
  const [examenResultados, setExamenResultados] = useState<ExamenResultado[]>([])
  const [examenTerminado, setExamenTerminado] = useState<boolean>(false)
  const [cargandoExamen, setCargandoExamen] = useState<boolean>(false)

  useEffect(() => {
    setMontado(true)
    setIncentivo('⚡ Un electricista profesional conoce el REBT de memoria. ¿Cuánto sabes tú?')
  }, [])

  const pctTest = (() => {
    const claves = Object.keys(progreso).filter(k => k.startsWith('ITC'))
    if (claves.length === 0) return 0
    const total = claves.reduce((acc, k) => acc + progreso[k].total, 0)
    const aciertos = claves.reduce((acc, k) => acc + progreso[k].aciertos, 0)
    return total > 0 ? Math.round((aciertos / total) * 100) : 0
  })()

  const pctMat = (() => {
    const claves = Object.keys(progreso).filter(k => k.startsWith('MAT'))
    if (claves.length === 0) return 0
    const total = claves.reduce((acc, k) => acc + progreso[k].total, 0)
    const aciertos = claves.reduce((acc, k) => acc + progreso[k].aciertos, 0)
    return total > 0 ? Math.round((aciertos / total) * 100) : 0
  })()

  const totalRespondidas = stats.total
  const requisitos = [
    { label: 'Tests REBT', icono: '📋', pct: pctTest, ok: pctTest >= UMBRAL_DESBLOQUEO, color: '#1A6FE8', bg: '#EEF5FF' },
    { label: 'Matemáticas', icono: '➗', pct: pctMat, ok: pctMat >= UMBRAL_DESBLOQUEO, color: '#1D9E75', bg: '#E8F8F2' },
    { label: 'Preguntas respondidas', icono: '📝', pct: Math.min(Math.round((totalRespondidas / 30) * 100), 100), ok: totalRespondidas >= 30, color: '#888', bg: '#F5F5F5' },
  ]

  const progresoExamen = Math.round(requisitos.reduce((acc, r) => acc + Math.min(r.pct, 100), 0) / requisitos.length)
  const examenDesbloqueado = requisitos.every(r => r.ok)

  const pistas = requisitos
    .filter(r => !r.ok)
    .map(r => {
      if (r.label === 'Tests REBT') return `Sube tu media en Tests REBT al ${UMBRAL_DESBLOQUEO}% — llevas ${r.pct}%`
      if (r.label === 'Matemáticas') return r.pct === 0 ? 'Practica matemáticas eléctricas — aún no has respondido ninguna' : `Mejora tu media en Matemáticas al ${UMBRAL_DESBLOQUEO}% — llevas ${r.pct}%`
      if (r.label === 'Preguntas respondidas') return `Responde ${30 - totalRespondidas} preguntas más de cualquier categoría`
      return ''
    }).filter(Boolean)

  const generarEjercicio = async () => {
    setCargando(true)
    setError(null)
    setRespuesta(null)
    setResultado(null)
    setEjercicio(null)
    try {
      const url = categoria === 'matematicas' ? '/api/ejercicios/generar-matematicas' : '/api/ejercicios/generar'
      const body = categoria === 'matematicas'
        ? { tipo: tipoMat, dificultad }
        : { instruccion_rebt: instruccion, dificultad }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (data.error || !data.opciones) {
        setError(data.error || 'Error al generar el ejercicio. Inténtalo de nuevo.')
        setCargando(false)
        return
      }
      setEjercicio(data)
    } catch (err) {
      setError('Error de conexión.')
      console.error(err)
    }
    setCargando(false)
  }

  const guardarProgresoDB = async (clave: string, cat: string, correcto: boolean) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: existente } = await supabase
      .from('progreso_usuario')
      .select('*')
      .eq('user_id', user.id)
      .eq('clave', clave)
      .maybeSingle()
    if (existente) {
      await supabase.from('progreso_usuario').update({
        total: existente.total + 1,
        aciertos: correcto ? existente.aciertos + 1 : existente.aciertos
      }).eq('id', existente.id)
    } else {
      await supabase.from('progreso_usuario').insert([{
        user_id: user.id,
        categoria: cat,
        clave,
        total: 1,
        aciertos: correcto ? 1 : 0
      }])
    }
  }

  const responder = (opcion: string) => {
    if (!ejercicio) return
    setRespuesta(opcion)
    const correcto = opcion === ejercicio.respuesta_correcta
    setResultado(correcto)
    const nuevaRacha = correcto ? racha + 1 : 0
    setRacha(nuevaRacha)
    const nuevasStats = { total: stats.total + 1, aciertos: correcto ? stats.aciertos + 1 : stats.aciertos }
    setStats(nuevasStats)
    const clave = categoria === 'matematicas' ? `MAT-${tipoMat}` : instruccion
    const cat = categoria === 'matematicas' ? 'matematicas' : 'test'
    setProgreso(prev => {
      const actual = prev[clave] || { total: 0, aciertos: 0 }
      return { ...prev, [clave]: { total: actual.total + 1, aciertos: correcto ? actual.aciertos + 1 : actual.aciertos } }
    })
    guardarProgresoDB(clave, cat, correcto)
    if (correcto && INCENTIVOS_RACHA[nuevaRacha]) setIncentivo(INCENTIVOS_RACHA[nuevaRacha])
    else if (!correcto) setIncentivo(INCENTIVOS_FALLO[nuevasStats.total % INCENTIVOS_FALLO.length])
    else if (nuevasStats.total >= 3) {
      const pct = Math.round((nuevasStats.aciertos / nuevasStats.total) * 100)
      const msg = INCENTIVOS_PORCENTAJE.find(i => pct >= i.min && pct <= i.max)
      if (msg) setIncentivo(msg.msg)
    }
  }

  const iniciarExamen = async () => {
    setCargandoExamen(true)
    setExamenResultados([])
    setExamenIndex(0)
    setExamenRespuesta(null)
    setExamenTerminado(false)
    try {
      const res = await fetch('/api/examen/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_preguntas: examenConfig.num, categorias: examenConfig.cats, dificultad: examenConfig.dificultad })
      })
      const data = await res.json()
      setExamenPreguntas(data.preguntas)
      setModoExamen(true)
    } catch (err) {
      console.error(err)
    }
    setCargandoExamen(false)
  }

  const responderExamen = (opcion: string) => {
    if (examenRespuesta) return
    setExamenRespuesta(opcion)
    const pregunta = examenPreguntas[examenIndex]
    const correcto = opcion === pregunta.respuesta_correcta
    setExamenResultados(prev => [...prev, {
      pregunta: pregunta.pregunta,
      respuesta_usuario: opcion,
      respuesta_correcta: pregunta.respuesta_correcta,
      correcto,
      explicacion: pregunta.explicacion
    }])
  }

  const siguientePreguntaExamen = () => {
    if (examenIndex + 1 >= examenPreguntas.length) setExamenTerminado(true)
    else { setExamenIndex(prev => prev + 1); setExamenRespuesta(null) }
  }

  const letras = ['A', 'B', 'C', 'D']

  const BotonesDificultad = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div>
      <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Dificultad</label>
      <div style={{ display: 'flex', gap: '8px' }}>
        {DIFICULTADES.map(d => (
          <button key={d.id} onClick={() => onChange(d.id)} style={{ flex: 1, padding: '10px 8px', borderRadius: '10px', border: `1.5px solid ${value === d.id ? d.border : '#EAEAEA'}`, background: value === d.id ? d.bg : '#fff', cursor: 'pointer', transition: 'all .15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <span style={{ fontSize: '16px' }}>{d.emoji}</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: value === d.id ? d.color : '#666' }}>{d.label}</span>
            <span style={{ fontSize: '10px', color: '#aaa', textAlign: 'center', lineHeight: 1.3 }}>{d.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )

  const OpcionesEjercicio = ({ ej, resp, onResponder }: { ej: Ejercicio; resp: string | null; onResponder: (o: string) => void }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {ej.opciones.map((opcion: string, i: number) => {
        let borderColor = '#EAEAEA'
        let bg = '#fff'
        let color = '#333'
        if (resp) {
          if (opcion === ej.respuesta_correcta) { borderColor = '#1D9E75'; bg = '#E8F8F2'; color = '#085041' }
          else if (opcion === resp) { borderColor = '#E24B4A'; bg = '#FEF0F0'; color = '#501313' }
        }
        return (
          <button key={i} onClick={() => !resp && onResponder(opcion)} style={{ border: `1.5px solid ${borderColor}`, borderRadius: '10px', padding: '12px 16px', background: bg, color, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', transition: 'all .15s', width: '100%', cursor: resp ? 'default' : 'pointer' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, flexShrink: 0, color: '#888' }}>{letras[i]}</div>
            {opcion}
          </button>
        )
      })}
    </div>
  )

  const categorias = [
    { id: 'test', label: 'Test REBT', icono: '📋' },
    { id: 'matematicas', label: 'Matemáticas', icono: '➗' },
    { id: 'simbologia', label: 'Simbología', icono: '⚡' },
  ]

  if (modoExamen && !examenTerminado) {
    const pregActual = examenPreguntas[examenIndex]
    if (!pregActual) return <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Cargando examen...</div>
    return (
      <>
        <Navbar />
        <main style={{ padding: '28px 24px', maxWidth: '760px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0D1117', letterSpacing: '-0.3px' }}>Examen Final REBT</h1>
              <p style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>Pregunta {examenIndex + 1} de {examenPreguntas.length}</p>
            </div>
            <button onClick={() => setModoExamen(false)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #EAEAEA', background: '#fff', fontSize: '13px', color: '#666', cursor: 'pointer' }}>Salir</button>
          </div>
          <div style={{ height: '6px', background: '#F0F0F0', borderRadius: '3px', marginBottom: '24px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#1A6FE8,#0D4FA8)', borderRadius: '3px', width: `${((examenIndex) / examenPreguntas.length) * 100}%`, transition: 'width 0.4s ease' }} />
          </div>
          <div style={cardStyle}>
            <div style={{ padding: '14px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', display: 'flex', gap: '6px' }}>
              {pregActual.instruccion_rebt && pregActual.instruccion_rebt !== 'N/A' && <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '5px', background: '#EEF5FF', color: '#1A6FE8' }}>{pregActual.instruccion_rebt}</span>}
              {pregActual.subtipo && <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '5px', background: '#E8F8F2', color: '#085041' }}>{TIPOS_MATEMATICAS.find(t => t.id === pregActual.subtipo)?.label || pregActual.subtipo}</span>}
              <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '5px', background: '#F5F5F5', color: '#666' }}>{pregActual.dificultad}</span>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '15px', fontWeight: 500, color: '#0D1117', lineHeight: 1.55, marginBottom: '20px' }}>{pregActual.pregunta}</p>
              <OpcionesEjercicio ej={pregActual} resp={examenRespuesta} onResponder={responderExamen} />
              {examenRespuesta && (
                <>
                  <div style={{ marginTop: '16px', padding: '14px 16px', borderRadius: '10px', border: `1px solid ${examenRespuesta === pregActual.respuesta_correcta ? '#9FE1CB' : '#F7C1C1'}`, background: examenRespuesta === pregActual.respuesta_correcta ? '#E8F8F2' : '#FEF0F0' }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: examenRespuesta === pregActual.respuesta_correcta ? '#085041' : '#501313', marginBottom: '4px' }}>{examenRespuesta === pregActual.respuesta_correcta ? '✓ Correcto' : '✗ Incorrecto'}</p>
                    <p style={{ fontSize: '12px', color: examenRespuesta === pregActual.respuesta_correcta ? '#0F6E56' : '#A32D2D', lineHeight: 1.6 }}>{pregActual.explicacion}</p>
                  </div>
                  <button onClick={siguientePreguntaExamen} style={btnPrimary}>
                    {examenIndex + 1 >= examenPreguntas.length ? 'Ver resultado final' : 'Siguiente pregunta →'}
                  </button>
                </>
              )}
            </div>
          </div>
        </main>
      </>
    )
  }

  if (modoExamen && examenTerminado) {
    const aciertos = examenResultados.filter(r => r.correcto).length
    const pctFinal = Math.round((aciertos / examenResultados.length) * 100)
    const nota = pctFinal >= 90 ? 'Sobresaliente' : pctFinal >= 70 ? 'Aprobado' : 'Suspenso'
    const notaColor = pctFinal >= 90 ? '#1D9E75' : pctFinal >= 70 ? '#1A6FE8' : '#E24B4A'
    const notaBg = pctFinal >= 90 ? '#E8F8F2' : pctFinal >= 70 ? '#EEF5FF' : '#FEF0F0'
    return (
      <>
        <Navbar />
        <main style={{ padding: '28px 24px', maxWidth: '760px', margin: '0 auto' }}>
          <div style={{ ...cardStyle, marginBottom: '20px' }}>
            <div style={{ padding: '32px 24px', textAlign: 'center', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>{pctFinal >= 70 ? '🎯' : '📚'}</div>
              <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#0D1117', marginBottom: '8px' }}>Resultado del Examen</h1>
              <div style={{ display: 'inline-block', background: notaBg, color: notaColor, fontSize: '14px', fontWeight: 600, padding: '6px 16px', borderRadius: '8px', marginBottom: '16px' }}>{nota}</div>
              <div style={{ fontSize: '48px', fontWeight: 700, color: notaColor, letterSpacing: '-2px', marginBottom: '4px' }}>{pctFinal}%</div>
              <div style={{ fontSize: '14px', color: '#888' }}>{aciertos} correctas de {examenResultados.length} preguntas</div>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <button onClick={() => { setModoExamen(false); setExamenTerminado(false) }} style={btnPrimary}>Volver a ejercicios</button>
            </div>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Detalle pregunta por pregunta</div>
          {examenResultados.map((r, i) => (
            <div key={i} style={{ ...cardStyle, marginBottom: '10px' }}>
              <div style={{ padding: '14px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: r.correcto ? '#E8F8F2' : '#FEF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>{r.correcto ? '✓' : '✗'}</div>
                <span style={{ fontSize: '13px', color: '#0D1117', fontWeight: 500, lineHeight: 1.4 }}>{r.pregunta}</span>
              </div>
              <div style={{ padding: '12px 16px', fontSize: '12px' }}>
                {!r.correcto && <p style={{ color: '#A32D2D', marginBottom: '4px' }}>Tu respuesta: {r.respuesta_usuario}</p>}
                <p style={{ color: '#085041', marginBottom: '6px' }}>Respuesta correcta: {r.respuesta_correcta}</p>
                <p style={{ color: '#666', lineHeight: 1.6 }}>{r.explicacion}</p>
              </div>
            </div>
          ))}
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main style={{ padding: '28px 24px', maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0D1117', letterSpacing: '-0.3px', marginBottom: '3px' }}>Ejercicios</h1>
          <p style={{ fontSize: '13px', color: '#888' }}>Practica y mejora tu nivel como electricista profesional</p>
        </div>

        {montado && (
          <div style={{ background: 'linear-gradient(135deg,#1A6FE8,#0D4FA8)', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>⚡</span>
            <span style={{ fontSize: '13px', color: '#fff', fontWeight: 500, lineHeight: 1.4 }}>{incentivo}</span>
          </div>
        )}

        <div style={{
          background: '#fff', borderRadius: '16px',
          border: examenDesbloqueado ? '2px solid #1A6FE8' : '0.5px solid rgba(0,0,0,0.06)',
          boxShadow: examenDesbloqueado ? '0 4px 20px rgba(26,111,232,0.15)' : '0 2px 8px rgba(0,0,0,0.05)',
          padding: '24px', marginBottom: '24px', position: 'relative', overflow: 'hidden'
        }}>
          {!examenDesbloqueado && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg,rgba(26,111,232,0.02),rgba(13,79,168,0.04))', pointerEvents: 'none' }} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0, background: examenDesbloqueado ? 'linear-gradient(135deg,#1A6FE8,#0D4FA8)' : 'linear-gradient(135deg,#e0e0e0,#c8c8c8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: examenDesbloqueado ? '0 4px 12px rgba(26,111,232,0.35)' : 'none' }}>
              {examenDesbloqueado ? '🎯' : '🔒'}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#0D1117', letterSpacing: '-0.3px', marginBottom: '3px' }}>Examen Final REBT</div>
              <div style={{ fontSize: '13px', color: '#888' }}>{examenDesbloqueado ? '¡Estás listo! Todos los requisitos completados' : 'Completa los requisitos para desbloquear el examen'}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
            {requisitos.map((r, i) => (
              <div key={i} style={{ background: '#F8F9FA', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>{r.icono}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>{r.label}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: r.ok ? r.color : '#666' }}>
                    {r.label === 'Preguntas respondidas' ? `${totalRespondidas}/30` : `${r.pct}%`} {r.ok ? '✓' : `/ ${UMBRAL_DESBLOQUEO}%`}
                  </div>
                  <div style={{ height: '3px', background: '#E5E7EB', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '2px', background: r.ok ? r.color : '#1A6FE8', width: `${Math.min(r.pct, 100)}%`, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!examenDesbloqueado && pistas.length > 0 && (
            <div style={{ background: '#F8F9FA', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '10px' }}>💡 Para desbloquear el examen</div>
              {pistas.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: i < pistas.length - 1 ? '8px' : 0, fontSize: '12px', color: '#666' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1A6FE8', flexShrink: 0, marginTop: '5px' }} />
                  {p}
                </div>
              ))}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ color: '#555', fontWeight: 500 }}>Progreso hacia el examen</span>
              <span style={{ color: examenDesbloqueado ? '#1D9E75' : '#1A6FE8', fontWeight: 600 }}>{progresoExamen}%{examenDesbloqueado ? ' ✓' : ''}</span>
            </div>
            <div style={{ height: '10px', background: '#F0F0F0', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '5px', background: examenDesbloqueado ? 'linear-gradient(90deg,#1D9E75,#0F6E56)' : 'linear-gradient(90deg,#1A6FE8,#0D4FA8)', width: `${progresoExamen}%`, transition: 'width 0.6s ease' }} />
            </div>
          </div>

          {examenDesbloqueado ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nº de preguntas</label>
                  <select value={examenConfig.num} onChange={e => setExamenConfig(prev => ({ ...prev, num: Number(e.target.value) }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #EAEAEA', fontSize: '13px', background: '#fff', color: '#0D1117', outline: 'none' }}>
                    <option value={5}>5 preguntas</option>
                    <option value={10}>10 preguntas</option>
                    <option value={20}>20 preguntas</option>
                  </select>
                </div>
                <BotonesDificultad value={examenConfig.dificultad} onChange={v => setExamenConfig(prev => ({ ...prev, dificultad: v }))} />
              </div>
              <button onClick={iniciarExamen} disabled={cargandoExamen} style={{ ...btnPrimary, marginTop: 0, padding: '14px 20px', fontSize: '14px', opacity: cargandoExamen ? 0.7 : 1 }}>
                {cargandoExamen ? 'Preparando examen...' : '🎯 Comenzar Examen Final'}
              </button>
            </div>
          ) : (
            <button disabled style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#E5E7EB', color: '#9CA3AF', fontSize: '14px', fontWeight: 600, cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              🔒 Completa los requisitos para acceder
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', background: '#fff', padding: '4px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.06)', width: 'fit-content', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {categorias.map(c => (
            <button key={c.id} onClick={() => { setCategoria(c.id); setEjercicio(null); setRespuesta(null); setResultado(null); setError(null) }} style={{ padding: '7px 16px', borderRadius: '7px', border: 'none', background: categoria === c.id ? '#1A6FE8' : 'transparent', color: categoria === c.id ? '#fff' : '#666', fontSize: '13px', fontWeight: categoria === c.id ? 500 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: categoria === c.id ? '0 2px 8px rgba(26,111,232,0.3)' : 'none', transition: 'all .15s' }}>
              {c.icono} {c.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '24px' }}>
          {[
            { label: 'Respondidas', value: stats.total.toString(), sub: 'esta sesión' },
            { label: 'Aciertos', value: stats.total > 0 ? `${Math.round((stats.aciertos / stats.total) * 100)}%` : '—', sub: 'promedio' },
            { label: 'Racha', value: racha > 0 ? `${racha} 🔥` : '—', sub: 'correctas seguidas' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '0.5px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '11px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>{s.label}</div>
              <div style={{ fontSize: '22px', fontWeight: 600, color: '#0D1117', letterSpacing: '-0.5px' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#bbb', marginTop: '2px' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '16px' }}>
          <div style={cardStyle}>
            <div style={{ padding: '14px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {categoria === 'test' ? 'Test REBT' : categoria === 'matematicas' ? 'Matemáticas eléctricas' : 'Simbología técnica'}
              </span>
              {ejercicio && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  {ejercicio.subtipo && <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '5px', background: '#E8F8F2', color: '#085041' }}>{TIPOS_MATEMATICAS.find(t => t.id === ejercicio.subtipo)?.label}</span>}
                  {ejercicio.instruccion_rebt && ejercicio.instruccion_rebt !== 'N/A' && <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '5px', background: '#EEF5FF', color: '#1A6FE8' }}>{ejercicio.instruccion_rebt}</span>}
                  <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '5px', background: '#F5F5F5', color: '#666' }}>{ejercicio.dificultad}</span>
                </div>
              )}
            </div>
            <div style={{ padding: '20px' }}>
              {categoria === 'simbologia' && !ejercicio && !cargando && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚡</div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: '#0D1117', marginBottom: '6px' }}>Simbología técnica</p>
                  <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>Próximamente: identifica símbolos, interpreta esquemas reales</p>
                  <span style={{ background: '#FAEEDA', color: '#633806', fontSize: '12px', padding: '4px 12px', borderRadius: '6px', fontWeight: 500 }}>En desarrollo</span>
                </div>
              )}
              {(categoria === 'test' || categoria === 'matematicas') && !ejercicio && !cargando && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {categoria === 'test' ? (
                    <>
                      <div>
                        <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Instrucción del REBT</label>
                        <select value={instruccion} onChange={e => setInstruccion(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #EAEAEA', fontSize: '13px', background: '#fff', color: '#0D1117', outline: 'none' }}>
                          {INSTRUCCIONES.map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                      </div>
                      <BotonesDificultad value={dificultad} onChange={setDificultad} />
                    </>
                  ) : (
                    <>
                      <div>
                        <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tipo de cálculo</label>
                        <select value={tipoMat} onChange={e => setTipoMat(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #EAEAEA', fontSize: '13px', background: '#fff', color: '#0D1117', outline: 'none' }}>
                          {TIPOS_MATEMATICAS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                        </select>
                      </div>
                      <BotonesDificultad value={dificultad} onChange={setDificultad} />
                    </>
                  )}
                  {error && (
                    <div style={{ padding: '10px 14px', background: '#FEF0F0', border: '1px solid #F7C1C1', borderRadius: '8px', fontSize: '12px', color: '#A32D2D' }}>{error}</div>
                  )}
                  <button onClick={generarEjercicio} style={{ ...btnPrimary, marginTop: 0 }}>Generar ejercicio</button>
                </div>
              )}
              {cargando && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa', fontSize: '14px' }}>Generando ejercicio...</div>
              )}
              {ejercicio && !cargando && (
                <>
                  <p style={{ fontSize: '15px', fontWeight: 500, color: '#0D1117', lineHeight: 1.55, marginBottom: '20px' }}>{ejercicio.pregunta}</p>
                  <OpcionesEjercicio ej={ejercicio} resp={respuesta} onResponder={responder} />
                  {respuesta && (
                    <div style={{ marginTop: '16px', padding: '14px 16px', borderRadius: '10px', border: `1px solid ${resultado ? '#9FE1CB' : '#F7C1C1'}`, background: resultado ? '#E8F8F2' : '#FEF0F0' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: resultado ? '#085041' : '#501313', marginBottom: '4px' }}>{resultado ? '✓ Correcto' : '✗ Incorrecto'}</p>
                      <p style={{ fontSize: '12px', color: resultado ? '#0F6E56' : '#A32D2D', lineHeight: 1.6 }}>{ejercicio.explicacion}</p>
                    </div>
                  )}
                  {respuesta && (
                    <div style={{ marginTop: '16px', borderTop: '0.5px solid rgba(0,0,0,0.06)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {categoria === 'test' ? (
                        <>
                          <div>
                            <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Instrucción del REBT</label>
                            <select value={instruccion} onChange={e => setInstruccion(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #EAEAEA', fontSize: '13px', background: '#fff', color: '#0D1117', outline: 'none' }}>
                              {INSTRUCCIONES.map(i => <option key={i} value={i}>{i}</option>)}
                            </select>
                          </div>
                          <BotonesDificultad value={dificultad} onChange={setDificultad} />
                        </>
                      ) : (
                        <>
                          <div>
                            <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tipo de cálculo</label>
                            <select value={tipoMat} onChange={e => setTipoMat(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #EAEAEA', fontSize: '13px', background: '#fff', color: '#0D1117', outline: 'none' }}>
                              {TIPOS_MATEMATICAS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                          </div>
                          <BotonesDificultad value={dificultad} onChange={setDificultad} />
                        </>
                      )}
                      <button onClick={generarEjercicio} style={{ ...btnPrimary, marginTop: 0 }}>Siguiente ejercicio</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Mi progreso</div>
            <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#555', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 500 }}>
                <span>Nivel general</span>
                <span style={{ color: '#1A6FE8', fontWeight: 600 }}>{stats.total > 0 ? `${Math.round((stats.aciertos / stats.total) * 100)}%` : '—'}</span>
              </div>
              <div style={{ height: '6px', background: '#F0F0F0', borderRadius: '3px', marginBottom: '16px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg,#1A6FE8,#0D4FA8)', borderRadius: '3px', width: stats.total > 0 ? `${Math.round((stats.aciertos / stats.total) * 100)}%` : '0%', transition: 'width 0.4s ease' }} />
              </div>
              {Object.keys(progreso).length === 0 ? (
                <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', padding: '12px 0' }}>Responde ejercicios para ver tu progreso</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(progreso).map(([clave, data]) => {
                    const pct = Math.round((data.aciertos / data.total) * 100)
                    const color = pct >= 70 ? '#1D9E75' : pct >= 40 ? '#1A6FE8' : '#E24B4A'
                    return (
                      <div key={clave}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', color: '#333', fontWeight: 500 }}>{clave}</span>
                          <span style={{ fontSize: '12px', fontWeight: 600, color }}>{pct}%</span>
                        </div>
                        <div style={{ height: '4px', background: '#F0F0F0', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: '2px', background: color, width: `${pct}%`, transition: 'width 0.4s ease' }} />
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