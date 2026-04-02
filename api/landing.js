const fs = require('fs')
const path = require('path')

module.exports = function handler(req, res) {
  try {
    const html = fs.readFileSync(path.join(process.cwd(), 'public/landing.html'), 'utf8')
    res.setHeader('Content-Type', 'text/html')
    res.end(html)
  } catch (e) {
    res.status(500).end('Landing page not found')
  }
}