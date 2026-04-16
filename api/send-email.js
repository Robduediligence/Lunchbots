export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { to, question, answer, botName } = req.body
  if (!to || !answer) return res.status(400).json({ error: 'Missing fields' })

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'hello@botbrunch.com',
      to,
      subject: `Your question has been answered — ${botName}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#2C1810">
          <h2 style="font-size:20px;margin-bottom:8px">Your question has been answered ✅</h2>
          <p style="color:#7A5C3E;margin-bottom:24px">The team at <strong>${botName}</strong> got back to you.</p>
          <div style="background:#F6F1E7;border-radius:8px;padding:16px 20px;margin-bottom:16px">
            <div style="font-size:12px;font-weight:600;color:#9A8070;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.06em">Your question</div>
            <div style="font-size:14px;color:#2C1810;line-height:1.6">${question}</div>
          </div>
          <div style="background:#fff;border:1px solid #E8DDD0;border-radius:8px;padding:16px 20px;margin-bottom:24px">
            <div style="font-size:12px;font-weight:600;color:#9A8070;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.06em">Answer</div>
            <div style="font-size:14px;color:#2C1810;line-height:1.6">${answer}</div>
          </div>
          <p style="font-size:12px;color:#B0A090">Powered by Bot Brunch</p>
        </div>
      `,
    }),
  })

  if (!response.ok) {
    const err = await response.json()
    return res.status(500).json({ error: err.message })
  }

  return res.status(200).json({ ok: true })
}