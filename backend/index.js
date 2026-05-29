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

app.get('/', (req, res) => {
  res.json({ mensaje: 'Servidor del asistente funcionando correctamente' })
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

    const texto = message.content[0].text
    const limpio = texto.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const ejercicio = JSON.parse(limpio)

    const { data, error } = await supabase
      .from('ejercicios')
      .insert([ejercicio])
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    res.json(data)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})