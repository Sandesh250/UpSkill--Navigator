import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Ensure .env variables are available on the server process
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    plugins: [
      react(),
      {
        name: 'dev-gemini-proxy',
        configureServer(server) {
          server.middlewares.use('/api/chat', async (req, res) => {
            try {
              if (req.method !== 'POST') {
                res.statusCode = 405
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Method Not Allowed' }))
                return
              }

              const apiKey = process.env.GOOGLE_API_KEY
              if (!apiKey) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Missing GOOGLE_API_KEY in .env (server-side)' }))
                return
              }

              const chunks = []
              await new Promise((resolve, reject) => {
                req.on('data', (c) => chunks.push(c))
                req.on('end', resolve)
                req.on('error', reject)
              })
              const raw = Buffer.concat(chunks).toString('utf8')
              const body = raw ? JSON.parse(raw) : {}
              const prompt = body?.prompt || ''
              const model = body?.model || 'gemini-2.5-flash'
              if (!prompt) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Missing prompt' }))
                return
              }

              const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`
              const fetchFn = globalThis.fetch || (await import('node-fetch')).default
              const gResp = await fetchFn(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [
                    {
                      role: 'user',
                      parts: [{ text: prompt }],
                    },
                  ],
                }),
              })

              const gData = await gResp.json()
              if (!gResp.ok) {
                res.statusCode = gResp.status || 500
                res.setHeader('Content-Type', 'application/json')
                res.end(
                  JSON.stringify({
                    error: gData?.error?.message || 'Gemini API error',
                    details: gData,
                  })
                )
                return
              }

              const text =
                gData?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ||
                gData?.candidates?.[0]?.content?.parts?.[0]?.text ||
                ''

              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ text }))
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Server error', message: String(err) }))
            }
          })
        },
      },
    ],
  }
})
