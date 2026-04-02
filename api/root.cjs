export default (req, res) => {
  res.setHeader('Location', '/landing.html')
  res.statusCode = 302
  res.end()
}