import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.jsx'
import './index.css'

Sentry.init({
  dsn: 'https://db18c4a1c614f399b8b2219374ac8461@o4511130676232192.ingest.us.sentry.io/4511130681147392',
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
  sendDefaultPii: false,
})

createRoot(document.getElementById('root')).render(
  <StrictMode><App /></StrictMode>
)