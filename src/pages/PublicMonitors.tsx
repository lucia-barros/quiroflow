import { ArrowDownRight, ArrowRight, Clock3, Expand, Info, MapPin, Minimize, Monitor, Users } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Brand, Elapsed, StatusBadge, useClock } from '../components/ui'
import { usePublicProjection } from '../data/publicDataAdapter'
import { FAMILY_LABELS, formatClock, formatDate } from '../domain/labels'

function MonitorShell({ children, mode, now }: { children: ReactNode; mode: 'turns' | 'families'; now: number }) {
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement))
  const [error, setError] = useState('')
  const turns = mode === 'turns'
  useEffect(() => {
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => document.removeEventListener('fullscreenchange', onFullscreen)
  }, [])
  async function toggleFullscreen() {
    setError('')
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch {
      setError('Puedes ampliar la pantalla con el modo de pantalla completa del navegador.')
    }
  }
  const Icon = fullscreen ? Minimize : Expand
  return <div className="public-monitor">
    <header className="monitor-top">
      <div className="monitor-top-inner">
        <div className="monitor-brand"><Brand /><span>SALA DE ESPERA</span></div>
        <div className="monitor-tools">
          <span className="monitor-simulation"><i aria-hidden="true" /> SIMULACIÓN</span>
          <div className="monitor-clock" aria-label="Hora de Vigo">
            <strong>{formatClock(now)}</strong><span>{formatDate(now)}</span>
          </div>
          <button className="icon-button" type="button" onClick={() => void toggleFullscreen()}
            aria-label={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            title={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}>
            <Icon size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
    <main className="monitor-content">
      {error && <p className="monitor-error" role="status">{error}</p>}
      {children}
    </main>
    <footer className="monitor-footer">
      <span>QUIROFLOW · Demostración académica</span>
      <Link to={turns ? '/espera/estado' : '/espera/turnos'}>
        {turns ? <Users size={18} aria-hidden="true" /> : <Monitor size={18} aria-hidden="true" />}
        {turns ? 'Estado del paciente' : 'Llamada de pacientes'} <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </footer>
  </div>
}

export function TurnsPage() {
  const { calls } = usePublicProjection()
  const now = useClock()
  const active = calls.find(call => call.active)
  const otherCalls = calls.filter(call => call !== active).slice(0, 4)
  return <MonitorShell mode="turns" now={now}>
    <div className="monitor-title">
      <div className="eyebrow"><Monitor size={19} aria-hidden="true" /> MONITOR 01 · LLAMADAS UMCA</div>
      <h1>LLAMADA DE PACIENTES</h1>
      <p>Espere a ser avisado</p>
    </div>
    <div className="turn-grid">
      <section className="active-call" aria-labelledby="active-call-title" aria-live="polite">
        <div className="active-call-top">
          <h2 id="active-call-title"><span aria-hidden="true" /> {active ? 'LLAMADA ACTIVA' : 'EN ESPERA'}</h2>
          <ArrowDownRight size={30} aria-hidden="true" />
        </div>
        {active ? <div className="call-main">
          <div><span>CÓDIGO</span><strong>{active.code}</strong></div>
          <ArrowRight className="call-arrow" size={38} aria-hidden="true" />
          <div className="call-destination"><span>DIRÍJASE A</span><strong>{active.destination}</strong></div>
        </div> : <p className="call-empty">La próxima llamada aparecerá aquí.</p>}
        <div className="active-call-note"><MapPin size={20} aria-hidden="true" /> {active ? 'Acuda a la unidad indicada.' : 'Permanezca en la sala de espera.'}</div>
      </section>
      <section className="recent-calls card" aria-labelledby="recent-call-title">
        <h2 id="recent-call-title"><Clock3 size={20} aria-hidden="true" /> Otras llamadas recientes</h2>
        {otherCalls.length ? <ul>
          {otherCalls.map(call => <li key={call.code}>
            <strong>{call.code}</strong><ArrowRight size={19} aria-hidden="true" /><span>{call.destination}</span>
            {call.active ? <small className="call-tag">Activa</small> : <time dateTime={new Date(call.calledAt).toISOString()}>{formatClock(call.calledAt)}</time>}
          </li>)}
        </ul> : <p className="muted">Las próximas llamadas se mostrarán en orden de llegada.</p>}
      </section>
    </div>
    <div className="monitor-help"><Info size={20} aria-hidden="true" /> Consulte su código de seguimiento para identificar la llamada.</div>
  </MonitorShell>
}

export function FamiliesPage() {
  const { families, showFamilyElapsed } = usePublicProjection()
  const now = useClock()
  return <MonitorShell mode="families" now={now}>
    <div className="monitor-title">
      <div className="eyebrow"><Users size={19} aria-hidden="true" /> MONITOR 02 · INFORMACIÓN A FAMILIARES</div>
      <h1>Estado del paciente</h1>
      <p>Consulte el estado general con su código de seguimiento.</p>
    </div>
    <div className="family-grid">
      {families.map(row => {
        const status = FAMILY_LABELS[row.status]
        return <article className="family-card card" key={row.code} data-tone={status.tone}>
          <div><span className="family-label">CÓDIGO DE SEGUIMIENTO</span><h2>{row.code}</h2></div>
          <div className="family-status">
            <span aria-live="polite"><StatusBadge status={status} /></span>
            {row.elapsedSince !== undefined && <div className="family-timer"><Elapsed now={now} since={row.elapsedSince} /><small>Tiempo transcurrido</small></div>}
          </div>
        </article>
      })}
      {!families.length && <div className="card monitor-empty">Los códigos aparecerán al confirmar la entrada en preparación.</div>}
    </div>
    <div className="monitor-help"><Info size={20} aria-hidden="true" />
      <span>«En recuperación» indica llegada confirmada a la unidad de recuperación.{showFamilyElapsed && ' El cronómetro muestra el tiempo transcurrido desde la entrada en quirófano.'}</span>
    </div>
  </MonitorShell>
}
