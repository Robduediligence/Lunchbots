const fs = require('fs')
const path = require('path')

export default function handler(req, res) {
  const html = fs.readFileSync(path.join(process.cwd(), 'public/landing.html'), 'utf8')
  res.setHeader('Content-Type', 'text/html')
  res.send(html)
}