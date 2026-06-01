'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'
import { supabase } from '../../lib/supabase'

interface ProgresoItem {
  id: string
  categoria: string
  clave: string
  total: number
  aciertos: number
}

interface Perfil {
  nombre: string
  email: string
  rol: string
}

export default function Avance() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [progreso, setProgreso] = useState<ProgresoItem[]>([])
  const [cargando, setCargando] = useState<boolean>(true)
  const router = useRouter()

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setCargando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    const { data: perfilData } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
    if (perfilData) setPerfil(perfilData)
    const { data: progresoData } = await supabase.from('progreso_usuario').select('*').eq('user_id', user.id).order('aciertos', { ascending: false })
    if (progresoData) setProgreso(progresoData)
    setCargando(false)
  }

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const totalPreguntas = progreso.reduce((acc, p) => acc + p.total, 0)
  const totalAciertos = progreso.reduce((acc, p) => acc + p.aciertos, 0)
  const pctGlobal = totalPreguntas > 0 ? Math.round((totalAciertos / totalPreguntas) * 100) : 0
  const progresoTest = progreso.filter(p => p.categoria === 'test')
  const progresoMat = progreso.filter(p => p.categoria === 'matematicas')

  if (cargando) {
    return (
      <>
        <Navbar />
        <main style={{ padding: '80px 24px', textAlign: 'center', color: '#888' }}>Cargando tu progreso...</main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main style={{ padding: '28px 24px', maxWidth: '960px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0D1117', letterSpacing: '-0.3px', marginBottom: '3px' }}>
              {perfil ? `Hola, ${perfil.nombre.split(' ')[0]} 👋` : 'Mi avance'}
            </h1>
            <p style={{ fontSize: '13px', color: '#888' }}>Tu progreso en la academia TECNIO</p>
          </div>
          <button onClick={cerrarSesion} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #EAEAEA', background: '#fff', fontSize: '12px', color: '#666', cursor: 'pointer' }}>
            Cerrar sesión
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '24px' }}>
          {[
            { label: 'Preguntas respondidas', value: totalPreguntas.toString(), sub: 'en total' },
            { label: 'Aciertos globales', value: totalPreguntas > 0 ? `${pctGlobal}%` : '—', sub: 'promedio' },
            { label: 'Instrucciones trabajadas', value: progresoTest.length.toString(), sub: 'del REBT' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '0.5px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '11px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>{s.label}</div>
              <div style={{ fontSize: '22px', fontWeight: 600, color: '#0D1117', letterSpacing: '-0.5px' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#bbb', marginTop: '2px' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { titulo: 'Tests REBT', datos: progresoTest, vacio: 'Aún no has respondido tests del REBT', formatClave: (k: string) => k },
            { titulo: 'Matemáticas eléctricas', datos: progresoMat, vacio: 'Aún no has respondido ejercicios de matemáticas', formatClave: (k: string) => k.replace('MAT-', '') },
          ].map((seccion, si) => (
            <div key={si} style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{seccion.titulo}</span>
              </div>
              <div style={{ padding: '16px 20px' }}>
                {seccion.datos.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#bbb', textAlign: 'center', padding: '24px 0' }}>{seccion.vacio}</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {seccion.datos.map(p => {
                      const pct = Math.round((p.aciertos / p.total) * 100)
                      const color = pct >= 70 ? '#1D9E75' : pct >= 40 ? '#1A6FE8' : '#E24B4A'
                      return (
                        <div key={p.id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 500, color: '#0D1117' }}>{seccion.formatClave(p.clave)}</span>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ fontSize: '11px', color: '#999' }}>{p.total} preguntas</span>
                              <span style={{ fontSize: '13px', fontWeight: 600, color }}>{pct}%</span>
                            </div>
                          </div>
                          <div style={{ height: '6px', background: '#F0F0F0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: '3px', background: color, width: `${pct}%`, transition: 'width 0.4s ease' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {totalPreguntas === 0 && (
          <div style={{ marginTop: '24px', background: 'linear-gradient(135deg,#1A6FE8,#0D4FA8)', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>¡Empieza a practicar!</p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Responde ejercicios para ver tu progreso aquí</p>
            </div>
            <a href="/" style={{ padding: '10px 18px', borderRadius: '9px', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '13px', fontWeight: 500, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.3)' }}>
              Ir a ejercicios →
            </a>
          </div>
        )}
      </main>
    </>
  )
}