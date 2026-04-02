const fs = require('fs')
const path = require('path')

module.exports = (req, res) => {
  const html = fs.readFileSync(path.join(process.cwd(), 'public', 'landing.html'), 'utf8')
  res.setHeader('Content-Type', 'text/html')
  res.end(html)
}