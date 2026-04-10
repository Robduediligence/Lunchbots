export const config = { maxDuration: 60 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'URL required' })

 const fetchWithRetry = async (attempts = 3) => {
    for (let i = 0; i < attempts; i++) {
      if (i > 0) await new Promise(r => setTimeout(r, 3000))
      try {
        const jinaUrl = `https://r.jina.ai/${url}`
        const response = await fetch(jinaUrl, {
          headers: {
            'Accept': 'text/plain',
          },
          signal: AbortSignal.timeout(10000),
        })
        if (response.ok) return response
      } catch(e) {
        if (i === attempts - 1) throw e
      }
    }
  }
  try {
    const response = await fetchWithRetry()
    if (!response) throw new Error('Failed to fetch after 3 attempts')

    const html = await response.text()

    // Strip HTML tags and clean up whitespace
    const text = html.trim().slice(0, 15000)

    res.status(200).json({ text })
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to scrape URL' })
  }
}