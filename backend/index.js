const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { createClient } = require('@supabase/supabase-js')
const Anthropic = require('@anthropic-ai/sdk')

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

const parsearJSON = (texto) => {
  let limpio = texto.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const inicio = limpio.indexOf('{')
  const fin = limpio.lastIndexOf('}')
  if (inicio === -1 || fin === -1) throw new Error('Respuesta no contiene JSON válido')
  limpio = limpio.slice(inicio, fin + 1)
  return JSON.parse(limpio)
}

app.get('/', (req, res) => {
  res.json({ mensaje: 'Servidor TECNIO funcionando' })
})

app.get('/ejercicios', async (req, res) => {
  const { tipo, dificultad } = req.query
  let query = supabase.from('ejercicios').select('*')
  if (tipo) query = query.eq('tipo', tipo)
  if (dificultad) query = query.eq('dificultad', dificultad)
  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.get('/ejercicios/:id', async (req, res) => {
  const { id } = req.params
  const { data, error } = await supabase
    .from('ejercicios')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return res.status(404).json({ error: 'Ejercicio no encontrado' })
  res.json(data)
})

app.post('/ejercicios/generar', async (req, res) => {
  const { instruccion_rebt, dificultad } = req.body
  const prompt = `Eres un experto en el Reglamento Electrotécnico de Baja Tensión (REBT) de España.
Genera una pregunta de test sobre la instrucción ${instruccion_rebt || 'ITC-BT-01'} con dificultad ${dificultad || 'básico'}.
Responde ÚNICAMENTE con un objeto JSON con esta estructura exacta, sin texto extra:
{
  "tipo": "test",
  "pregunta": "texto de la pregunta",
  "opciones": ["opción A", "opción B", "opción C", "opción D"],
  "respuesta_correcta": "opción correcta exacta",
  "explicacion": "explicación detallada de por qué es correcta",
  "instruccion_rebt": "${instruccion_rebt || 'ITC-BT-01'}",
  "dificultad": "${dificultad || 'básico'}"
}`
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })
    const ejercicio = parsearJSON(message.content[0].text)
    const { data, error } = await supabase.from('ejercicios').insert([ejercicio]).select().single()
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/ejercicios/generar-matematicas', async (req, res) => {
  const { tipo, dificultad } = req.body
  const tipos = {
    ohm: 'Ley de Ohm (V=I·R). Incluye variantes con resistencias en serie, paralelo y mixto.',
    joule: 'Efecto Joule (Q=I²·R·t). Calor disipado en resistencias.',
    potencia: 'Triángulo de potencias (P, Q, S) y factor de potencia.',
    caida: 'Caída de tensión en cables eléctricos según el REBT.',
    seccion: 'Cálculo de sección de cable según intensidad y longitud.',
    rlc: 'Circuitos RLC: impedancia, reactancia inductiva y capacitiva.'
  }
  const tipoSeleccionado = tipo || 'ohm'
  const descripcion = tipos[tipoSeleccionado] || tipos.ohm
  const prompt = `Eres un profesor experto en electricidad y matemáticas eléctricas.
Genera un problema de cálculo eléctrico sobre: ${descripcion}
Dificultad: ${dificultad || 'basico'}
Responde ÚNICAMENTE con un objeto JSON con esta estructura exacta, sin texto extra ni markdown:
{
  "tipo": "matematicas",
  "subtipo": "${tipoSeleccionado}",
  "pregunta": "enunciado del problema con datos numéricos",
  "opciones": ["resultado A con unidades", "resultado B con unidades", "resultado C con unidades", "resultado D con unidades"],
  "respuesta_correcta": "resultado correcto exacto con unidades",
  "explicacion": "resolución paso a paso con fórmulas y cálculos",
  "instruccion_rebt": "N/A",
  "dificultad": "${dificultad || 'basico'}"
}`
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })
    const ejercicio = parsearJSON(message.content[0].text)
    const { data, error } = await supabase.from('ejercicios').insert([ejercicio]).select().single()
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/examen/generar', async (req, res) => {
  const { num_preguntas, categorias, dificultad } = req.body
  const total = num_preguntas || 10
  const cats = categorias || ['test', 'matematicas']
  const preguntas = []
  const porCategoria = Math.ceil(total / cats.length)

  for (const cat of cats) {
    for (let i = 0; i < porCategoria && preguntas.length < total; i++) {
      try {
        let prompt = ''
        if (cat === 'test') {
          const itc = `ITC-BT-${String(Math.floor(Math.random() * 52) + 1).padStart(2, '0')}`
          prompt = `Eres un experto en el REBT de España. Genera una pregunta de examen sobre ${itc} con dificultad ${dificultad || 'intermedio'}.
Responde ÚNICAMENTE con JSON:
{
  "tipo": "test",
  "categoria": "test",
  "pregunta": "texto",
  "opciones": ["A","B","C","D"],
  "respuesta_correcta": "opción correcta",
  "explicacion": "explicación",
  "instruccion_rebt": "${itc}",
  "dificultad": "${dificultad || 'intermedio'}"
}`
        } else if (cat === 'matematicas') {
          const tipos = ['ohm', 'joule', 'potencia', 'caida', 'seccion']
          const tipo = tipos[Math.floor(Math.random() * tipos.length)]
          prompt = `Eres un profesor experto en electricidad. Genera un problema de cálculo eléctrico de tipo ${tipo} con dificultad ${dificultad || 'intermedio'}.
Responde ÚNICAMENTE con JSON:
{
  "tipo": "matematicas",
  "categoria": "matematicas",
  "subtipo": "${tipo}",
  "pregunta": "enunciado con datos numéricos",
  "opciones": ["A","B","C","D"],
  "respuesta_correcta": "opción correcta",
  "explicacion": "resolución paso a paso",
  "instruccion_rebt": "N/A",
  "dificultad": "${dificultad || 'intermedio'}"
}`
        }
        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }]
        })
        const pregunta = parsearJSON(message.content[0].text)
        preguntas.push(pregunta)
      } catch (err) {
        console.error('Error generando pregunta:', err.message)
      }
    }
  }
  res.json({ preguntas, total: preguntas.length })
})

app.get('/sesiones', async (req, res) => {
  const { fecha } = req.query
  let query = supabase.from('sesiones').select('*').order('fecha').order('hora')
  if (fecha) query = query.eq('fecha', fecha)
  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.post('/reservas', async (req, res) => {
  const { sesion_id, alumno_nombre, alumno_email } = req.body
  if (!sesion_id || !alumno_nombre || !alumno_email) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' })
  }

  const { data: sesion, error: sesionError } = await supabase
    .from('sesiones')
    .select('*')
    .eq('id', sesion_id)
    .single()

  if (sesionError || !sesion) return res.status(404).json({ error: 'Sesión no encontrada' })
  if (sesion.plazas_disponibles <= 0) return res.status(400).json({ error: 'No quedan plazas disponibles' })

  const { data: reserva, error: reservaError } = await supabase
    .from('reservas')
    .insert([{ sesion_id, alumno_nombre, alumno_email, estado: 'confirmada' }])
    .select()
    .single()

  if (reservaError) return res.status(500).json({ error: reservaError.message })

  await supabase
    .from('sesiones')
    .update({ plazas_disponibles: sesion.plazas_disponibles - 1 })
    .eq('id', sesion_id)

  res.json({ reserva, mensaje: 'Reserva confirmada correctamente' })
})

app.get('/reservas', async (req, res) => {
  const { email } = req.query
  if (!email) return res.status(400).json({ error: 'Email requerido' })
  const { data, error } = await supabase
    .from('reservas')
    .select('*, sesiones(*)')
    .eq('alumno_email', email)
    .order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.delete('/reservas/:id', async (req, res) => {
  const { id } = req.params
  const { data: reserva } = await supabase.from('reservas').select('*, sesiones(*)').eq('id', id).single()
  if (reserva) {
    await supabase.from('sesiones').update({ plazas_disponibles: reserva.sesiones.plazas_disponibles + 1 }).eq('id', reserva.sesion_id)
  }
  const { error } = await supabase.from('reservas').delete().eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ mensaje: 'Reserva cancelada' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor TECNIO corriendo en puerto ${PORT}`)
})