import {
  Activity, ArrowDown, ArrowRight, ArrowUpRight, BarChart3, BedDouble, Check,
  CirclePlay, ClipboardList, Clock3, ListChecks, Monitor, RotateCcw, Users,
} from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import HeroDiagram from '../components/HeroDiagram'
import { Feedback, StatusBadge, useAction } from '../components/ui'
import { useSimulation } from '../data/mockDataAdapter'
import { DEMO_CASE } from '../domain/config'
import { GUIDE, guideProgress } from '../domain/guide'
import { FAMILY_LABELS, ROOM_LABELS } from '../domain/labels'
import { projectPublic } from '../domain/projection'
import { recordEvent } from '../domain/workflow'

const links = [
  { to: '/espera/turnos', title: 'Llamadas UMCA', detail: 'Monitor 01 · Sala de espera', icon: Monitor },
  { to: '/espera/estado', title: 'Estado del paciente', detail: 'Monitor 02 · Sala de espera', icon: Users },
  { to: '/quirofanos', title: 'Quirófanos', detail: 'Monitor 03 · Coordinación', icon: BedDouble },
  { to: '/control', title: 'Panel de control', detail: 'Registro de hitos', icon: ClipboardList },
  { to: '/estadisticas', title: 'Estadísticas', detail: 'Tiempos observados', icon: BarChart3 },
]

export default function DemoPage() {
  const { state, record, reset, updateSettings, initializationError } = useSimulation()
  const { busy, feedback, perform } = useAction()
  const dialog = useRef<HTMLDialogElement>(null)
  const patient = state.patients.find(item => item.id === DEMO_CASE.patientId)!
  const room = state.rooms.find(item => item.id === DEMO_CASE.roomId)!
  const progress = guideProgress(state)
  const step = GUIDE[progress]
  const complete = progress === GUIDE.length
  let blocked = false
  if (step) {
    try {
      recordEvent(state, step.command, Date.now(), 'guide-check')
    } catch {
      blocked = true
    }
  }
  const preview = projectPublic(state)
  const family = preview.families.find(row => row.code === patient.code)
  const call = preview.calls.find(row => row.code === patient.code && row.active)
  const disabled = busy || Boolean(initializationError)

  return <>
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <div className="hero-kicker"><span /> PROTOTIPO ACADÉMICO · ANESTESIOLOGÍA</div>
        <h1 id="hero-title">QUIRO<span>FLOW</span></h1>
        <p className="hero-lead">Coordinación perioperatoria</p>
        <p className="hero-context">Hospital do Meixoeiro · Caso de estudio<br />Prácticas de Tecnología Hospitalaria · UVigo</p>
      </div>
      <HeroDiagram />
    </section>

    <div className="demo-workbench">
      <section className="card guide-card" aria-labelledby="guide-title">
        <div className="section-head guide-head">
          <div className="section-heading"><span className="feature-icon"><CirclePlay size={21} aria-hidden="true" /></span>
            <div><h2 id="guide-title">Simulación guiada</h2><p>Paciente {patient.code} · {room.label}</p></div>
          </div>
          <span className="step-counter">{progress} / {GUIDE.length} hitos</span>
        </div>

        <div className="step-progress" role="progressbar" aria-label="Hitos registrados" aria-valuemin={0} aria-valuemax={GUIDE.length} aria-valuenow={progress}>
          {GUIDE.map(({ title }, index) => <span key={title} data-state={index < progress ? 'done' : index === progress ? 'next' : 'pending'} />)}
        </div>

        <div className="next-step" data-complete={complete} aria-live="polite">
          <div className="step-index">{complete ? <Check size={25} aria-hidden="true" /> : String(progress + 1).padStart(2, '0')}</div>
          <div className="next-step-text">
            <div className="eyebrow">{complete ? 'DEMOSTRACIÓN COMPLETADA' : `SIGUIENTE HITO · ${step.stage.toUpperCase()}`}</div>
            <h3>{complete ? 'Recorrido completo' : step.title}</h3>
            <p>{complete ? 'Consulta los tiempos registrados o reinicia el caso para volver a presentarlo.' : step.detail}</p>
          </div>
        </div>
        <div className="guide-actions">
          {complete
            ? <Link className="btn btn-primary" to="/estadisticas">Ver estadísticas <ArrowRight size={18} aria-hidden="true" /></Link>
            : <button className="btn btn-primary" type="button" disabled={disabled || blocked}
              onClick={() => void perform(() => record(step.command), 'Hito registrado.')}>
              Registrar hito y avanzar <ArrowRight size={18} aria-hidden="true" />
            </button>}
          <button className="btn btn-outline" type="button" disabled={disabled} onClick={() => dialog.current?.showModal()}>
            <RotateCcw size={16} aria-hidden="true" /> Reiniciar
          </button>
        </div>
        <Feedback text={initializationError} />
        <Feedback text={blocked ? 'Este caso siguió otro circuito. Reinicia para recuperar el recorrido guiado.' : undefined} />
        {feedback?.kind === 'error' && <Feedback {...feedback} />}
        <details className="guide-itinerary">
          <summary><ListChecks size={17} aria-hidden="true" /> Ver los {GUIDE.length} hitos <ArrowDown size={14} aria-hidden="true" /></summary>
          <ol>
            {GUIDE.map(({ title }, index) => <li key={title} data-state={index < progress ? 'done' : index === progress ? 'next' : 'pending'}>
              <span>{index < progress ? <Check size={15} aria-hidden="true" /> : String(index + 1).padStart(2, '0')}</span>{title}
              {index === progress && <small>Siguiente</small>}
            </li>)}
          </ol>
        </details>
      </section>

      <section className="card live-card" aria-labelledby="live-title">
        <div className="section-head live-head"><h2 id="live-title"><Activity size={20} aria-hidden="true" /> Vista en directo</h2>
          <span className="live-chip"><i aria-hidden="true" /> EN VIVO</span>
        </div>
        <p className="live-description">Así se refleja cada hito en los monitores.</p>
        <div className="live-rows">
          <div className="live-row"><span className="live-icon"><Monitor size={19} aria-hidden="true" /></span><div><strong>Llamadas UMCA</strong>
            <span className="live-state" aria-live="polite">{call ? <StatusBadge status={{ label: `${patient.code} → ${call.destination}`, tone: 'blue' }} /> : <span className="muted">Sin llamada activa para {patient.code}</span>}</span></div></div>
          <div className="live-row"><span className="live-icon"><Users size={19} aria-hidden="true" /></span><div><strong>Familiares</strong>
            <span className="live-state" aria-live="polite">{family ? <StatusBadge status={FAMILY_LABELS[family.status]} /> : <span className="muted">{patient.status === 'completed' ? 'Seguimiento cerrado' : 'Visible al entrar en preparación'}</span>}</span></div></div>
          <div className="live-row"><span className="live-icon"><BedDouble size={19} aria-hidden="true" /></span><div><strong>{room.label}</strong>
            <span className="live-state" aria-live="polite"><StatusBadge status={ROOM_LABELS[room.status]} pulse={room.status === 'finishing'} /></span></div></div>
        </div>
      </section>
    </div>

    <section className="demo-section" aria-labelledby="views-title">
      <div className="section-head"><div><h2 id="views-title">Pantallas de la demostración</h2><p>Ábrelas en pestañas del mismo navegador para seguir los cambios en directo.</p></div></div>
      <div className="demo-links">
        {links.map(({ to, title, detail, icon: Icon }) => <Link className="view-link card" key={to} to={to} target="_blank" rel="noopener"
          aria-label={`Abrir ${title} en otra pestaña`}>
          <span className="feature-icon"><Icon size={21} aria-hidden="true" /></span>
          <ArrowUpRight className="external-icon" size={17} aria-hidden="true" />
          <strong>{title}</strong><small>{detail}</small>
        </Link>)}
      </div>
    </section>

    <section className="demo-section" aria-labelledby="comparison-title">
      <div className="section-head"><div><h2 id="comparison-title">Del aviso manual al hito registrado</h2><p>Comparación conceptual para la exposición.</p></div></div>
      <div className="card table-wrap">
        <table>
          <thead><tr><th scope="col">Momento</th><th scope="col">Circuito manual ilustrativo</th><th scope="col">Circuito propuesto</th></tr></thead>
          <tbody>
            <tr><th scope="row">Preparación</th><td>Llamada y confirmación verbal.</td><td>El código aparece con su destino en el monitor UMCA.</td></tr>
            <tr><th scope="row">Traslado</th><td>Aviso directo al personal y comprobación en sala.</td><td>El aviso anticipa el traslado y el equipo registra la autorización de acceso.</td></tr>
            <tr><th scope="row">Recuperación</th><td>Consulta del estado al personal.</td><td>La unidad receptora confirma la llegada y se actualiza el monitor de familiares.</td></tr>
            <tr><th scope="row">Limpieza</th><td>Comunicación entre equipos al quedar la sala vacía.</td><td>La salida confirmada habilita el acceso de limpieza y deja un registro horario.</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <details className="card display-settings">
      <summary><Clock3 size={18} aria-hidden="true" /> Ajustes de los cronómetros</summary>
      <div className="settings-fields">
        <label><input type="checkbox" checked={state.settings.familyElapsed} disabled={disabled}
          onChange={event => { const checked = event.target.checked; void perform(() => updateSettings({ familyElapsed: checked }), 'Ajuste guardado.') }} /> Mostrar tiempo transcurrido a familiares</label>
        <label><input type="checkbox" checked={state.settings.roomElapsed} disabled={disabled}
          onChange={event => { const checked = event.target.checked; void perform(() => updateSettings({ roomElapsed: checked }), 'Ajuste guardado.') }} /> Mostrar ocupación en el monitor de quirófanos</label>
      </div>
    </details>

    <dialog ref={dialog} className="reset-dialog" aria-labelledby="reset-title">
      <div className="dialog-icon"><RotateCcw size={24} aria-hidden="true" /></div>
      <h2 id="reset-title">Reiniciar la simulación</h2>
      <p>Se borrarán los hitos registrados durante la sesión y se restaurarán los casos ficticios de inicio en todas las pestañas.</p>
      <div className="dialog-actions">
        <button className="btn btn-outline" type="button" autoFocus onClick={() => dialog.current?.close()}>Cancelar</button>
        <button className="btn btn-primary" type="button" disabled={disabled} onClick={async () => {
          if (await perform(reset, 'Simulación reiniciada.')) dialog.current?.close()
        }}>Restablecer datos</button>
      </div>
      {feedback?.kind === 'error' && <Feedback {...feedback} />}
    </dialog>
  </>
}
