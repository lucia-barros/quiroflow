import { BarChart3, ChartNoAxesColumn, CheckCircle2, Clock3, Timer, Truck } from 'lucide-react'
import { PageTitle } from '../components/ui'
import { useSimulation } from '../data/mockDataAdapter'
import { formatDuration } from '../domain/labels'
import { calculateMetrics } from '../domain/metrics'

export default function StatsPage() {
  const { state } = useSimulation()
  const { started, finished, durations } = calculateMetrics(state)
  const transfer = durations.find(metric => metric.id === 'transfer')!
  const surgery = durations.find(metric => metric.id === 'surgery')!
  const maxDuration = Math.max(1, ...durations.map(metric => metric.mean ?? 0))
  const summaries = [
    { label: 'Intervenciones registradas', value: started, sub: `${started - finished} en curso`, icon: ChartNoAxesColumn },
    { label: 'Intervenciones finalizadas', value: finished, sub: 'Con hito de fin registrado', icon: CheckCircle2 },
    { label: 'Duración media de intervención', value: surgery.mean === null ? '—' : formatDuration(surgery.mean), sub: sampleLabel(surgery.observations.length), icon: Timer },
    { label: 'Traslado medio a recuperación', value: transfer.mean === null ? '—' : formatDuration(transfer.mean), sub: sampleLabel(transfer.observations.length), icon: Truck },
  ]
  return <>
    <PageTitle title="Estadísticas de la simulación" eyebrow="INDICADORES" icon={BarChart3}
      description="Intervalos observados entre hitos con hora registrada en el escenario ficticio." />
    <div className="stats-summary">
      {summaries.map(({ label, value, sub, icon: Icon }) => <article className="card stat-card" key={label}>
        <span className="feature-icon"><Icon size={20} aria-hidden="true" /></span><h2>{label}</h2><strong>{value}</strong><small>{sub}</small>
      </article>)}
    </div>
    <section className="card duration-card" aria-labelledby="duration-title">
      <div className="section-head"><div><h2 id="duration-title"><Clock3 size={19} aria-hidden="true" /> Duraciones medias por hito</h2><p>Cada media incluye únicamente intervalos completos.</p></div><span className="summary-chip">min y s</span></div>
      <ul className="duration-chart">
        {durations.map(metric => <li key={metric.id}>
          <span className="duration-label">{metric.label}</span>
          <div className="bar-track" aria-hidden="true">
            {metric.mean !== null && <div className="bar-fill" style={{ width: `${Math.max(1, (metric.mean / maxDuration) * 100)}%` }} />}
          </div>
          <strong>{metric.mean === null ? '—' : formatDuration(metric.mean)}</strong>
          <small>{sampleLabel(metric.observations.length)}</small>
        </li>)}
      </ul>
    </section>
    <section className="card observations-card" aria-labelledby="observations-title">
      <div className="section-head"><div><h2 id="observations-title">Observaciones por código</h2><p>Abre un intervalo para ver los valores que entran en su media.</p></div></div>
      {durations.map(metric => <details key={metric.id}>
        <summary><span>{metric.label}</span><small>{sampleLabel(metric.observations.length)}</small></summary>
        {metric.observations.length ? <dl className="observation-list">
          {metric.observations.map(observation => <div key={observation.code}><dt>{observation.code}</dt><dd>{formatDuration(observation.milliseconds)}</dd></div>)}
        </dl> : <p className="muted">Registra ambos hitos para calcular el intervalo.</p>}
      </details>)}
    </section>
  </>
}

function sampleLabel(count: number) {
  if (!count) return 'Sin observaciones'
  return count === 1 ? '1 observación' : `${count} observaciones`
}
