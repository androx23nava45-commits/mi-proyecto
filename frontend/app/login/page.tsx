'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [cargando, setCargando] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [modo, setModo] = useState<'login' | 'registro'>('login')
  const [nombre, setNombre] = useState<string>('')
  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) return
    setCargando(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email o contraseña incorrectos')
    } else {
      router.push('/')
    }
    setCargando(false)
  }

  const handleRegistro = async () => {
    if (!email || !password || !nombre) return
    setCargando(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
    } else if (data.user) {
      await supabase.from('perfiles').insert([{ id: data.user.id, nombre, email, rol: 'alumno' }])
      router.push('/')
    }
    setCargando(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg,#1A6FE8,#0D4FA8)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2">
                <circle cx="8" cy="8" r="3"/>
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2"/>
              </svg>
            </div>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#0D1117', letterSpacing: '-0.5px' }}>TECNIO</span>
          </div>
          <p style={{ fontSize: '13px', color: '#888' }}>by thePower</p>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', border: '0.5px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', padding: '28px' }}>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#F5F5F5', padding: '4px', borderRadius: '9px' }}>
            {[{ id: 'login', label: 'Entrar' }, { id: 'registro', label: 'Registrarse' }].map(m => (
              <button key={m.id} onClick={() => { setModo(m.id as 'login' | 'registro'); setError('') }} style={{ flex: 1, padding: '8px', borderRadius: '7px', border: 'none', background: modo === m.id ? '#fff' : 'transparent', color: modo === m.id ? '#0D1117' : '#888', fontSize: '13px', fontWeight: modo === m.id ? 600 : 400, cursor: 'pointer', boxShadow: modo === m.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all .15s' }}>
                {m.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {modo === 'registro' && (
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>Nombre completo</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #EAEAEA', fontSize: '13px', outline: 'none', color: '#0D1117' }} />
              </div>
            )}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@ejemplo.com" type="email" style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #EAEAEA', fontSize: '13px', outline: 'none', color: '#0D1117' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>Contraseña</label>
              <input value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" type="password" style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #EAEAEA', fontSize: '13px', outline: 'none', color: '#0D1117' }} />
            </div>

            {error && (
              <div style={{ background: '#FEF0F0', border: '1px solid #F7C1C1', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#A32D2D' }}>
                {error}
              </div>
            )}

            <button onClick={modo === 'login' ? handleLogin : handleRegistro} disabled={cargando} style={{ background: 'linear-gradient(135deg,#1A6FE8,#0D4FA8)', color: '#fff', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: 600, cursor: cargando ? 'not-allowed' : 'pointer', opacity: cargando ? 0.7 : 1, boxShadow: '0 2px 8px rgba(26,111,232,0.3)', marginTop: '4px' }}>
              {cargando ? '...' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </div>

          {modo === 'registro' && (
            <p style={{ fontSize: '11px', color: '#bbb', textAlign: 'center', marginTop: '16px', lineHeight: 1.6 }}>
              Solo puedes registrarte con un link de invitación proporcionado por la academia.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}