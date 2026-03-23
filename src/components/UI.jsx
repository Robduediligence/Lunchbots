export function Spinner({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation: 'spin 0.7s linear infinite', flexShrink: 0 }}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.5" strokeOpacity="0.2" />
      <path d="M12 3a9 9 0 0 1 9 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

const s = { width: 15, height: 15, flexShrink: 0 }

export const I = {
  Home:    p => <svg {...s} {...p} viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 0 0-1.414 0l-7 7a1 1 0 0 0 1.414 1.414L4 10.414V17a1 1 0 0 0 1 1h4v-4h2v4h4a1 1 0 0 0 1-1v-6.586l.293.293a1 1 0 0 0 1.414-1.414l-7-7z"/></svg>,
  Inbox:   p => <svg {...s} {...p} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5zm0 2h10v7h-2.101a2 2 0 0 1-1.899 1.357H8a2 2 0 0 1-1.899-1.357H4V5z" clipRule="evenodd"/></svg>,
  Bot:     p => <svg {...s} {...p} viewBox="0 0 20 20" fill="currentColor"><path d="M2 10a8 8 0 1 1 16 0A8 8 0 0 1 2 10zm5-1a1 1 0 0 1 2 0v2a1 1 0 0 1-2 0V9zm5 0a1 1 0 1 1 2 0v2a1 1 0 1 1-2 0V9z"/></svg>,
  Chart:   p => <svg {...s} {...p} viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-5zm6-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V7zm6-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V4z"/></svg>,
  Cog:     p => <svg {...s} {...p} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 0 1-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 0 1 .947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 0 1 2.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 0 1 2.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 0 1 .947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 0 1-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 0 1-2.287-.947zM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" clipRule="evenodd"/></svg>,
  Users:   p => <svg {...s} {...p} viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm8 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM9.06 13.23A5.988 5.988 0 0 0 7 13c-1.37 0-2.64.46-3.67 1.23A3 3 0 0 0 1 17h12a3 3 0 0 0-3.94-3.77zM17 17a3 3 0 0 0-2.29-2.91A5.988 5.988 0 0 1 13 13c-.78 0-1.52.15-2.2.43A4.997 4.997 0 0 1 13 17h4z"/></svg>,
  Send:    p => <svg {...s} {...p} viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 0 0-1.788 0l-7 14a1 1 0 0 0 1.169 1.409l5-1.429A1 1 0 0 0 9 15.571V11a1 1 0 1 1 2 0v4.571a1 1 0 0 0 .725.962l5 1.428a1 1 0 0 0 1.17-1.408l-7-14z"/></svg>,
  Plus:    p => <svg {...s} {...p} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H4a1 1 0 1 1 0-2h5V4a1 1 0 0 1 1-1z" clipRule="evenodd"/></svg>,
  X:       p => <svg {...s} {...p} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414z" clipRule="evenodd"/></svg>,
  Check:   p => <svg {...s} {...p} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z" clipRule="evenodd"/></svg>,
  Rocket:  p => <svg {...s} {...p} viewBox="0 0 20 20" fill="currentColor"><path d="M9.504 1.132a1 1 0 0 1 .992 0l1.75 1a1 1 0 1 1-.992 1.736L10 3.152l-1.254.716a1 1 0 1 1-.992-1.736l1.75-1zM5.618 4.504a1 1 0 0 1-.372 1.364L5.016 6l.23.132a1 1 0 1 1-.992 1.736L4 7.723V8a1 1 0 0 1-2 0V6a.996.996 0 0 1 .52-.878l1.734-.99a1 1 0 0 1 1.364.372zm8.764 0a1 1 0 0 1 1.364-.372l1.733.99A1.002 1.002 0 0 1 18 6v2a1 1 0 0 1-2 0v-.277l-.254.145a1 1 0 0 1-.992-1.736l.23-.132-.23-.132a1 1 0 0 1-.372-1.364zm-7 4a1 1 0 0 1 1.364-.372L10 8.848l1.254-.716a1 1 0 1 1 .992 1.736L11 10.58V12a1 1 0 0 1-2 0v-1.42l-1.246-.712a1 1 0 0 1-.372-1.364zM3 11a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2H3zm10 0a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2H13z"/></svg>,
  Copy:    p => <svg {...s} {...p} viewBox="0 0 20 20" fill="currentColor"><path d="M8 2a1 1 0 0 0 0 2h2a1 1 0 1 0 0-2H8z"/><path d="M3 5a2 2 0 0 1 2-2 3 3 0 0 0 3 3h4a3 3 0 0 0 3-3 2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z"/></svg>,
  Eye:     p => <svg {...s} {...p} viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" clipRule="evenodd"/></svg>,
  Logout:  p => <svg {...s} {...p} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3zm11 4.414-3.293 3.293a1 1 0 0 1-1.414-1.414L11.586 7H7a1 1 0 1 1 0-2h7a1 1 0 0 1 1 1v7a1 1 0 1 1-2 0V8.414z" clipRule="evenodd"/></svg>,
  Search:  p => <svg {...s} {...p} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM2 8a6 6 0 1 1 10.89 3.476l4.817 4.817a1 1 0 0 1-1.414 1.414l-4.816-4.816A6 6 0 0 1 2 8z" clipRule="evenodd"/></svg>,
  ChevR:   p => <svg {...s} {...p} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 0 1 0-1.414L10.586 10 7.293 6.707a1 1 0 0 1 1.414-1.414l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414 0z" clipRule="evenodd"/></svg>,
  Pencil:  p => <svg {...s} {...p} viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>,
  Alert:   p => <svg {...s} {...p} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-1-8a1 1 0 0 0-1 1v3a1 1 0 0 0 2 0V6a1 1 0 0 0-1-1z" clipRule="evenodd"/></svg>,
}
