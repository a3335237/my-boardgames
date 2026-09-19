export default async function handler(req, res) {
  // 設定允許跨域與回應格式
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { id } = req.query
  if (!id) {
    return res.status(400).json({ error: 'Missing id parameter' })
  }

  try {
    const bggUrl = `https://boardgamegeek.com/xmlapi2/thing?id=${id}&stats=1`
    
    // 由伺服器端代為發出請求，加上合法的 User-Agent 避免被阻擋
    const response = await fetch(bggUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      return res.status(response.status).json({ error: 'BGG API response error' })
    }

    const xmlData = await response.text()
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    return res.status(200).send(xmlData)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}