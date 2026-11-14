import { ArrowRight, BedDouble, CheckCircle2, ClipboardList, History, ListChecks, MapPin, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RoomGrid } from '../components/Rooms'
import { Feedback, PageTitle, StatusBadge, useAction } from '../components/ui'
import { useSimulation } from '../data/mockDataAdapter'
import { ALTERNATIVE_DESTINATIONS, DEMO_CASE } from '../domain/config'
import { CARE_LABELS, EVENT_LABELS, eventLabel, formatClock } from '../domain/labels'
import type { Command, Disposition, PatientCommand, RecoveryUnit, SimulatedPatient, SimulationState } from '../domain/model'
import { availablePatientActions } from '../domain/workflow'

export default function ControlPage() {
  const { state, record, initializationError } = useSimulation()
  const { busy, feedback, perform } = useAction()
  const [selectedId, setSelectedId] = useState(DEMO_CASE.patientId)
  const patient = state.patients.find(item => item.id === selectedId) ?? state.patients[0]
  const events = state.events.filter(event => event.patientId === patient.id).slice().reverse()
  const room = state.rooms.find(item => item.id === patient.roomId)
  const onAction = (command: Command) => { void perform(() => record(command), 'Hito registrado y pantallas actualizadas.') }

  return <>
    <PageTitle title="Panel de control sanitario" eyebrow="PANTALLA INTERNA" icon={ClipboardList}
      description="Selecciona un código ficticio y confirma el siguiente hito del recorrido."
      action={<Link className="btn btn-outline" to="/demo">Ir a la demo <ArrowRight size={16} aria-hidden="true" /></Link>} />
    <Feedback text={initializationError} />
    <div className="control-grid">
      <section className="card patient-list" aria-labelledby="cases-title">
        <div className="section-head"><h2 id="cases-title">Pacientes simulados</h2><span className="number-chip">{state.patients.length}</span></div>
        {state.patients.map(item => <button
          className="patient-button" key={item.id} type="button" aria-pressed={item.id === patient.id}
          onClick={() => setSelectedId(item.id)}>
          <span className="patient-icon"><UserRound size={19} aria-hidden="true" /></span>
          <span><strong>{item.code}</strong><small>{CARE_LABELS[item.status].label}</small></span>
          {item.id === patient.id && <ChevronIndicator />}
        </button>)}
      </section>
      <div className="control-detail">
        <section className="card patient-detail" aria-labelledby="patient-title">
          <header className="patient-detail-head">
            <div><div className="eyebrow">CÓDIGO DE SEGUIMIENTO</div><h2 id="patient-title">{patient.code}</h2></div>
            <StatusBadge status={CARE_LABELS[patient.status]} />
          </header>
          {room && <p className="room-location"><MapPin size={16} aria-hidden="true" /> {room.label} {patient.recoveryUnit && `· Llegada a ${patient.recoveryUnit} confirmada`}</p>}
          <PatientActions key={`${state.sessionId}-${patient.id}-${patient.status}`} patient={patient} state={state}
            busy={busy || Boolean(initializationError)} onAction={onAction} />
          <Feedback {...feedback} />
        </section>
        <section className="card history-card" aria-labelledby="history-title">
          <div className="section-head"><h2 id="history-title"><History size={18} aria-hidden="true" /> Registro temporal</h2><span className="number-chip">{events.length}</span></div>
          {events.length ? <ol className="history-list">
            {events.map(event => <li key={event.id}>
              <span className="history-marker" aria-hidden="true" />
              <span>{eventLabel(event, state)}</span>
              <time dateTime={new Date(event.timestamp).toISOString()}>{formatClock(event.timestamp)}</time>
            </li>)}
          </ol> : <p className="muted">El primer hito será la llamada a UMCA.</p>}
        </section>
      </div>
    </div>
    <section className="control-rooms" aria-labelledby="control-rooms-title">
      <div className="section-head">
        <h2 id="control-rooms-title"><BedDouble size={21} aria-hidden="true" /> Tareas de quirófano</h2>
        <Link className="text-link" to="/quirofanos">Abrir monitor <ArrowRight size={15} aria-hidden="true" /></Link>
      </div>
      <RoomGrid state={state} busy={busy || Boolean(initializationError)} onAction={onAction} compact />
    </section>
  </>
}

function ChevronIndicator() {
  return <ArrowRight className="patient-arrow" size={17} aria-hidden="true" />
}

function PatientActions({ patient, state, busy, onAction }: {
  patient: SimulatedPatient; state: SimulationState; busy: boolean; onAction(command: PatientCommand): void
}) {
  const actions = availablePatientActions(state, patient.id)
  const ready = state.rooms.filter(room => room.status === 'ready')
  const [umcaId, setUmca] = useState(state.destinations[0]?.id)
  const [roomId, setRoom] = useState(ready[0]?.id)
  const [unit, setUnit] = useState<RecoveryUnit>('URPA')
  const [disposition, setDisposition] = useState<Disposition>('alta')
  const [destination, setDestination] = useState<string>(ALTERNATIVE_DESTINATIONS[0])
  const selectedRoom = ready.find(room => room.id === roomId) ?? ready[0]
  const patientId = patient.id

  if (!actions.length) return <div className="completed-note"><CheckCircle2 size={22} aria-hidden="true" /> Recorrido registrado. Consulta los hitos en el registro temporal.</div>

  return <div className="patient-actions">
    <h3><ListChecks size={17} aria-hidden="true" /> Siguiente hito</h3>
    {actions.map((action, index) => {
      const variant = index === 0 ? 'btn-primary' : 'btn-outline'
      switch (action) {
        case 'call_patient':
          return <div className="action-row" key={action}>
            <label>Destino UMCA<select value={umcaId} onChange={event => setUmca(event.target.value)}>
              {state.destinations.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select></label>
            <button className={`btn ${variant}`} type="button" disabled={busy || !umcaId}
              onClick={() => onAction({ type: action, patientId, umcaId })}>{EVENT_LABELS[action]}</button>
          </div>
        case 'enter_room':
          return <div key={action}>
            {selectedRoom ? <div className="action-row">
              <label>Quirófano preparado<select value={selectedRoom.id} onChange={event => setRoom(event.target.value)}>
                {ready.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select></label>
              <button className={`btn ${variant}`} type="button" disabled={busy}
                onClick={() => onAction({ type: action, patientId, roomId: selectedRoom.id })}>{EVENT_LABELS[action]}</button>
            </div> : <p className="muted">Confirma una sala preparada en <a className="inline-link" href="#control-rooms-title">Tareas de quirófano</a> para habilitar la entrada.</p>}
          </div>
        case 'arrive_recovery':
          return <div className="action-row" key={action}>
            <label>Unidad receptora<select value={unit} onChange={event => setUnit(event.target.value as RecoveryUnit)}>
              <option value="URPA">URPA</option><option value="REA">REA</option>
            </select></label>
            <button className={`btn ${variant}`} type="button" disabled={busy}
              onClick={() => onAction({ type: action, patientId, unit })}>{EVENT_LABELS[action]}</button>
          </div>
        case 'arrive_alternative':
          return <details className="alternative-path" key={action}>
            <summary>Circuito alternativo</summary>
            <div className="action-row">
              <label>Destino alternativo<select value={destination} onChange={event => setDestination(event.target.value)}>
                {ALTERNATIVE_DESTINATIONS.map(item => <option key={item}>{item}</option>)}
              </select></label>
              <button className={`btn ${variant}`} type="button" disabled={busy}
                onClick={() => onAction({ type: action, patientId, destination })}>{EVENT_LABELS[action]}</button>
            </div>
          </details>
        case 'leave_recovery':
          return <div className="action-row" key={action}>
            <label>Salida desde recuperación<select value={disposition} onChange={event => setDisposition(event.target.value as Disposition)}>
              <option value="alta">Alta</option><option value="traslado">Traslado</option>
            </select></label>
            <button className={`btn ${variant}`} type="button" disabled={busy}
              onClick={() => onAction({ type: action, patientId, disposition })}>{EVENT_LABELS[action]}</button>
          </div>
        default:
          return <button className={`btn ${variant}`} type="button" key={action} disabled={busy}
            onClick={() => onAction({ type: action, patientId })}>{EVENT_LABELS[action]}</button>
      }
    })}
  </div>
}
