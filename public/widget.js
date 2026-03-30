(function () {
  const scriptTag = document.currentScript
  const botId = scriptTag?.getAttribute('data-bot-id')
  if (!botId) return

  const BASE = 'https://botbrunch.com'

  // Fetch bot config to get branding
  fetch(`https://vklbfvfrfcncpsslnivm.supabase.co/rest/v1/bots?id=eq.${botId}&select=primary_color,name,avatar_url`, {
    headers: {
      apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbGJmdmZyZmNuY3Bzc2xuaXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4NzQwNjMsImV4cCI6MjA1ODQ1MDA2M30.yWkOrJcYMbZNSBflPJGkqJQFsJ51DSOWTLqBEPAFpfc',
        'Content-Type': 'application/json',
    }
  })
  .then(r => r.json())
  .then(([bot]) => {
    if (!bot) return
    const color = bot.primary_color || '#3B2B23'

    // Styles
    const style = document.createElement('style')
    style.textContent = `
      #bb-widget-bubble {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: ${color};
        cursor: pointer;
        z-index: 99999;
        box-shadow: 0 4px 16px rgba(0,0,0,0.18);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, box-shadow 0.2s;
        border: none;
        outline: none;
      }
      #bb-widget-bubble:hover {
        transform: scale(1.08);
        box-shadow: 0 6px 20px rgba(0,0,0,0.22);
      }
      #bb-widget-bubble svg {
        width: 26px;
        height: 26px;
        fill: white;
      }
      #bb-widget-frame {
        position: fixed;
        bottom: 92px;
        right: 24px;
        width: 380px;
        height: 580px;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.18);
        border: none;
        z-index: 99998;
        opacity: 0;
        pointer-events: none;
        transform: translateY(16px) scale(0.97);
        transition: opacity 0.22s ease, transform 0.22s ease;
        background: white;
      }
      #bb-widget-frame.bb-open {
        opacity: 1;
        pointer-events: all;
        transform: translateY(0) scale(1);
      }
      @media (max-width: 480px) {
        #bb-widget-frame {
          width: calc(100vw - 16px);
          height: 70vh;
          right: 8px;
          bottom: 80px;
          border-radius: 12px;
        }
      }
    `
    document.head.appendChild(style)

    // Bubble button
    const bubble = document.createElement('button')
    bubble.id = 'bb-widget-bubble'
    bubble.setAttribute('aria-label', 'Open chat')
    bubble.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
      </svg>
    `
    document.body.appendChild(bubble)

    // iFrame
    const frame = document.createElement('iframe')
    frame.id = 'bb-widget-frame'
    frame.src = `${BASE}?bot=${botId}&widget=true`
    frame.allow = 'microphone'
    document.body.appendChild(frame)

    // Toggle
    let open = false
    bubble.addEventListener('click', () => {
      open = !open
      frame.classList.toggle('bb-open', open)
      bubble.setAttribute('aria-expanded', open)
      bubble.innerHTML = open
        ? `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6l12 12" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>`
        : `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>`
    })
  })
  .catch(console.error)
})()