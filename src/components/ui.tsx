import { Activity, Check, CircleAlert, Clock3, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { formatElapsed, type StatusStyle } from '../domain/labels'

export function Brand() {
  return <span className="brand">
    <span className="brand-mark"><Activity size={21} strokeWidth={2.4} aria-hidden="true" /></span>
    <span>QUIRO<span className="brand-accent">FLOW</span></span>
  </span>
}

export function StatusBadge({ status, pulse = false }: { status: StatusStyle; pulse?: boolean }) {
  return <span className="status-badge" data-tone={status.tone}>
    <span className={pulse ? 'status-dot status-pulse' : 'status-dot'} aria-hidden="true" />
    {status.label}
  </span>
}

export function PageTitle({ title, description, eyebrow, icon: Icon, action }: {
  title: string; description: string; eyebrow: string; icon: LucideIcon; action?: ReactNode
}) {
  return <header className="page-title">
    <div>
      <div className="eyebrow"><Icon size={15} aria-hidden="true" /> {eyebrow}</div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
    {action}
  </header>
}

export function useClock() {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  return now
}

export function Elapsed({ now, since }: { now: number; since: number }) {
  return <span className="elapsed"><Clock3 size={16} aria-hidden="true" /> {formatElapsed(now, since)}</span>
}

export function useAction() {
  const pending = useRef(false)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string }>()
  async function perform(action: () => Promise<void>, success: string) {
    if (pending.current) return false
    pending.current = true
    setBusy(true)
    setFeedback(undefined)
    try {
      await action()
      setFeedback({ kind: 'success', text: success })
      return true
    } catch (error) {
      setFeedback({ kind: 'error', text: error instanceof Error ? error.message : 'No se pudo registrar el hito.' })
      return false
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  return { busy, feedback, perform }
}

export function Feedback({ text, kind = 'error' }: { text?: string; kind?: 'error' | 'success' }) {
  if (!text) return null
  const Icon = kind === 'error' ? CircleAlert : Check
  return <p className="feedback" data-kind={kind} role={kind === 'error' ? 'alert' : 'status'}>
    <Icon size={17} aria-hidden="true" /> {text}
  </p>
}
