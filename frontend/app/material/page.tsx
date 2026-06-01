'use client'
import { useState } from 'react'
import Navbar from '../components/Navbar'

const VIDEOS = [
  { id: 1, titulo: 'Cómo leer un esquema unifilar', itc: 'ITC-BT-19', duracion: '12:34', vistas: '1.2k', url: 'https://youtube.com' },
  { id: 2, titulo: 'Instalación de un cuadro eléctrico', itc: 'ITC-BT-17', duracion: '8:20', vistas: '890', url: 'https://youtube.com' },
  { id: 3, titulo: 'Cálculo de sección de cable paso a paso', itc: 'Matemáticas', duracion: '15:10', vistas: '2.1k', url: 'https://youtube.com' },
  { id: 4, titulo: 'Simbología eléctrica básica', itc: 'Simbología', duracion: '6:45', vistas: '670', url: 'https://youtube.com' },
  { id: 5, titulo: 'Protecciones eléctricas — diferenciales e interruptores', itc: 'ITC-BT-22', duracion: '18:05', vistas: '3.4k', url: 'https://youtube.com' },
  { id: 6, titulo: 'Instalaciones de baja tensión en viviendas', itc: 'ITC-BT-25', duracion: '22:30', vistas: '1.8k', url: 'https://youtube.com' },
]

const PRESENTACIONES = [
  { id: 1, nombre: 'Introducción al REBT — ITC-BT-01', tipo: 'PDF', size: '2.4 MB', fecha: '12 may 2026', url: '#' },
  { id: 2, nombre: 'Instalaciones de enlace — ITC-BT-11', tipo: 'PPTX', size: '8.1 MB', fecha: '15 may 2026', url: '#' },
  { id: 3, nombre: 'Protecciones eléctricas — ITC-BT-22', tipo: 'PDF', size: '3.7 MB', fecha: '18 may 2026', url: '#' },
  { id: 4, nombre: 'Instalaciones interiores — ITC-BT-19', tipo: 'PPTX', size: '6.2 MB', fecha: '20 may 2026', url: '#' },
  { id: 5, nombre: 'Puesta a tierra — ITC-BT-18', tipo: 'PDF', size: '1.9 MB', fecha: '22 may 2026', url: '#' },
]

const TEMAS = [
  'Ley de Ohm', 'Efecto Joule', 'Caída de tensión', 'Sección de cable',
  'Triángulo de potencias', 'Circuitos RLC', 'Test REBT — ITC-BT-01',
  'Test REBT — ITC-BT-10', 'Test REBT — ITC-BT-19', 'Test REBT — ITC-BT-22',
]

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
  borderRadius: '10px',
  padding: '12px 20px',
  fontSize: '13px',
  fontWeight: 500,
  width: '100%',
  boxShadow: '0 2px 8px rgba(26,111,232,0.25)',
  cursor: 'pointer'
}

export default function Material() {
  const [pestana, setPestana] = useState<string>('presentaciones')
  const [busqueda, setBusqueda] = useState<string>('')
  const [tema, setTema] = useState<string>('Ley de Ohm')
  const [dificultad, setDificultad] = useState<string>('basico')
  const [numEjercicios, setNumEjercicios] = useState<string>('10')
  const [formato, setFormato] = useState<string>('con-soluciones')
  const [generando, setGenerando] = useState<boolean>(false)
  const [ejerciciosGenerados, setEjerciciosGenerados] = useState<any[]>([])
  const [buscadorVideo, setBuscadorVideo] = useState<string>('')

  const presentacionesFiltradas = PRESENTACIONES.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const videosFiltrados = VIDEOS.filter(v =>
    v.titulo.toLowerCase().includes(buscadorVideo.toLowerCase()) ||
    v.itc.toLowerCase().includes(buscadorVideo.toLowerCase())
  )

  const generarEjercicios = async () => {
    setGenerando(true)
    setEjerciciosGenerados([])
    try {
      const promesas = Array.from({ length: Number(numEjercicios) }, () =>
        fetch('/api/ejercicios/generar-matematicas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipo: tema.toLowerCase().replace(/ /g, '_'), dificultad })
        }).then(r => r.json())
      )
      const resultados = await Promise.all(promesas)
      const validos = resultados.filter(r => r.opciones)
      setEjerciciosGenerados(validos)
    } catch (err) {
      console.error(err)
    }
    setGenerando(false)
  }

  const imprimirEjercicios = () => {
    const contenido = ejerciciosGenerados.map((e, i) => `
      <div style="margin-bottom:32px;page-break-inside:avoid">
        <p style="font-weight:bold;margin-bottom:8px">${i + 1}. ${e.pregunta}</p>
        ${e.opciones.map((o: string, j: number) => `<p style="margin:4px 0;padding-left:16px">${['A','B','C','D'][j]}) ${o}</p>`).join('')}
        ${formato !== 'sin-soluciones' ? `<p style="margin-top:8px;color:#1A6FE8"><strong>Respuesta:</strong> ${e.respuesta_correcta}</p>` : ''}
        ${formato === 'con-soluciones' ? `<p style="color:#555;font-size:13px;margin-top:4px">${e.explicacion}</p>` : ''}
      </div>
    `).join('')

    const ventana = window.open('', '_blank')
    if (!ventana) return
    ventana.document.write(`
      <html>
        <head>
          <title>Ejercicios TECNIO — ${tema}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 20px; margin-bottom: 8px; }
            h2 { font-size: 14px; color: #666; font-weight: normal; margin-bottom: 32px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <h1>Ejercicios — ${tema}</h1>
          <h2>Dificultad: ${dificultad} · ${ejerciciosGenerados.length} ejercicios · TECNIO by thePower</h2>
          ${contenido}
        </body>
      </html>
    `)
    ventana.document.close()
    ventana.print()
  }

  const pestanas = [
    { id: 'presentaciones', label: 'Presentaciones', icono: '📚' },
    { id: 'ejercicios', label: 'Ejercicios para imprimir', icono: '🖨️' },
    { id: 'videos', label: 'Videoteca', icono: '🎬' },
  ]

  return (
    <>
      <Navbar />
      <main style={{ padding: '28px 24px', maxWidth: '960px', margin: '0 auto' }}>

        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0D1117', letterSpacing: '-0.3px', marginBottom: '3px' }}>Material didáctico</h1>
          <p style={{ fontSize: '13px', color: '#888' }}>Presentaciones, ejercicios y vídeos de la academia</p>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', background: '#fff', padding: '4px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.06)', width: 'fit-content', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {pestanas.map(p => (
            <button key={p.id} onClick={() => setPestana(p.id)} style={{
              padding: '7px 16px', borderRadius: '7px', border: 'none',
              background: pestana === p.id ? '#1A6FE8' : 'transparent',
              color: pestana === p.id ? '#fff' : '#666',
              fontSize: '13px', fontWeight: pestana === p.id ? 500 : 400,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: pestana === p.id ? '0 2px 8px rgba(26,111,232,0.3)' : 'none',
              transition: 'all .15s'
            }}>
              {p.icono} {p.label}
            </button>
          ))}
        </div>

        {pestana === 'presentaciones' && (
          <div style={cardStyle}>
            <div style={{ padding: '14px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar presentación..."
                style={{ padding: '8px 12px', borderRadius: '9px', border: '1.5px solid #EAEAEA', fontSize: '13px', outline: 'none', width: '280px' }}
              />
              <span style={{ fontSize: '12px', color: '#999' }}>{presentacionesFiltradas.length} archivos</span>
            </div>
            <div style={{ padding: '8px 20px' }}>
              {presentacionesFiltradas.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: p.tipo === 'PDF' ? '#FEF0F0' : '#EEF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                    {p.tipo === 'PDF' ? '📄' : '📊'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#0D1117', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</div>
                    <div style={{ fontSize: '11px', color: '#999' }}>{p.tipo} · {p.size} · {p.fecha}</div>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px', background: p.tipo === 'PDF' ? '#FEF0F0' : '#EEF5FF', color: p.tipo === 'PDF' ? '#A32D2D' : '#1A6FE8', marginRight: '8px' }}>{p.tipo}</span>
                  <button style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #EAEAEA', background: '#fff', fontSize: '12px', color: '#666', cursor: 'pointer' }}>
                    ⬇ Descargar
                  </button>
                </div>
              ))}
              {presentacionesFiltradas.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#bbb', fontSize: '13px' }}>
                  No se encontraron presentaciones
                </div>
              )}
            </div>
          </div>
        )}

        {pestana === 'ejercicios' && (
          <div>
            <div style={cardStyle}>
              <div style={{ padding: '14px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Generar ejercicios con IA</span>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ background: '#F8F9FA', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>Tema</label>
                      <select value={tema} onChange={e => setTema(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '9px', border: '1.5px solid #EAEAEA', fontSize: '13px', background: '#fff', color: '#0D1117', outline: 'none' }}>
                        {TEMAS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>Dificultad</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {[
                          { id: 'basico', label: '🟢 Fácil', color: '#1D9E75', bg: '#E8F8F2', border: '#9FE1CB' },
                          { id: 'intermedio', label: '🟠 Medio', color: '#BA7517', bg: '#FAEEDA', border: '#FAC775' },
                          { id: 'avanzado', label: '🔴 Difícil', color: '#A32D2D', bg: '#FEF0F0', border: '#F7C1C1' },
                        ].map(d => (
                          <button key={d.id} onClick={() => setDificultad(d.id)} style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', border: `1.5px solid ${dificultad === d.id ? d.border : '#EAEAEA'}`, background: dificultad === d.id ? d.bg : '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: dificultad === d.id ? d.color : '#666' }}>
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>Nº de ejercicios</label>
                      <select value={numEjercicios} onChange={e => setNumEjercicios(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '9px', border: '1.5px solid #EAEAEA', fontSize: '13px', background: '#fff', color: '#0D1117', outline: 'none' }}>
                        <option value="5">5 ejercicios</option>
                        <option value="10">10 ejercicios</option>
                        <option value="20">20 ejercicios</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>Formato</label>
                      <select value={formato} onChange={e => setFormato(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '9px', border: '1.5px solid #EAEAEA', fontSize: '13px', background: '#fff', color: '#0D1117', outline: 'none' }}>
                        <option value="con-soluciones">Con soluciones</option>
                        <option value="sin-soluciones">Sin soluciones</option>
                        <option value="soluciones-aparte">Soluciones aparte</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={generarEjercicios} disabled={generando} style={{ ...btnPrimary, opacity: generando ? 0.7 : 1 }}>
                    {generando ? `Generando ${numEjercicios} ejercicios...` : '⚡ Generar ejercicios con IA'}
                  </button>
                </div>

                {ejerciciosGenerados.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#0D1117' }}>
                        {ejerciciosGenerados.length} ejercicios generados
                      </span>
                      <button onClick={imprimirEjercicios} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#1D9E75,#0F6E56)', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer', boxShadow: '0 2px 8px rgba(29,158,117,0.3)' }}>
                        🖨️ Imprimir / Descargar PDF
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {ejerciciosGenerados.map((e, i) => (
                        <div key={i} style={{ background: '#F8F9FA', borderRadius: '10px', padding: '14px 16px' }}>
                          <p style={{ fontSize: '13px', fontWeight: 500, color: '#0D1117', marginBottom: '8px' }}>{i + 1}. {e.pregunta}</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {e.opciones.map((o: string, j: number) => (
                              <p key={j} style={{ fontSize: '12px', color: o === e.respuesta_correcta && formato !== 'sin-soluciones' ? '#085041' : '#555', paddingLeft: '12px' }}>
                                {['A','B','C','D'][j]}) {o} {o === e.respuesta_correcta && formato !== 'sin-soluciones' ? '✓' : ''}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {pestana === 'videos' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <input
                value={buscadorVideo}
                onChange={e => setBuscadorVideo(e.target.value)}
                placeholder="Buscar vídeo por título o instrucción..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #EAEAEA', fontSize: '13px', outline: 'none', background: '#fff' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {videosFiltrados.map(v => (
                <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid rgba(0,0,0,0.06)', overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow .15s', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ height: '90px', background: 'linear-gradient(135deg,#0D1117,#1a2332)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(26,111,232,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#fff' }}>▶</div>
                      <div style={{ position: 'absolute', bottom: '6px', right: '8px', fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>{v.duracion}</div>
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#0D1117', marginBottom: '4px', lineHeight: 1.4 }}>{v.titulo}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 7px', borderRadius: '4px', background: '#EEF5FF', color: '#1A6FE8' }}>{v.itc}</span>
                        <span style={{ fontSize: '11px', color: '#999' }}>{v.vistas} vistas</span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
              {videosFiltrados.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '32px', color: '#bbb', fontSize: '13px' }}>
                  No se encontraron vídeos
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  )
}