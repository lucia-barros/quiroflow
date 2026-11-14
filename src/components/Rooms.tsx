import { BedDouble, CheckCircle2, DoorOpen, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { EVENT_LABELS, formatClock, ROOM_LABELS } from '../domain/labels'
import type { OperatingRoom, RoomCommand, SimulationState } from '../domain/model'
import { availableRoomAction, roomRequest } from '../domain/workflow'
import { Elapsed, StatusBadge, useClock } from './ui'

export function RoomGrid({ state, busy, onAction, compact = false }: {
  state: SimulationState
  busy: boolean
  onAction(command: RoomCommand): void
  compact?: boolean
}) {
  const now = useClock()
  return <div className={compact ? 'room-grid compact' : 'room-grid'}>
    {state.rooms.map(room => <RoomCard key={room.id} {...{ room, state, busy, onAction, now }} />)}
  </div>
}

function RoomCard({ room, state, busy, onAction, now }: {
  room: OperatingRoom; state: SimulationState; busy: boolean; now: number
  onAction(command: RoomCommand): void
}) {
  const status = ROOM_LABELS[room.status]
  const action = availableRoomAction(state, room)
  const transfer = roomRequest(state, room, 'transport')
  const cleaning = roomRequest(state, room, 'cleaning')
  const occupiedSince = room.activePatientId
    ? state.events.find(event => event.type === 'enter_room' && event.patientId === room.activePatientId)?.timestamp
    : undefined
  const ActionIcon = action === 'room_ready' ? CheckCircle2 : Sparkles
  return <article className="room-card card" data-tone={status.tone}>
    <div className="room-card-head">
      <div className="room-icon"><BedDouble size={25} aria-hidden="true" /></div>
      {state.settings.roomElapsed && occupiedSince !== undefined && <Elapsed now={now} since={occupiedSince} />}
    </div>
    <h2>{room.label}</h2>
    <StatusBadge status={status} pulse={room.status === 'finishing'} />
    <div className="room-detail">
      {room.status === 'pending' && <><DoorOpen size={18} aria-hidden="true" /><span>Pendiente de confirmar la preparación.</span></>}
      {room.status === 'ready' && <><ShieldCheck size={18} aria-hidden="true" /><span>Preparación confirmada por el equipo.</span></>}
      {room.status === 'occupied' && <><BedDouble size={18} aria-hidden="true" /><span>Entrada de paciente registrada.</span></>}
      {room.status === 'finishing' && <><Truck size={18} aria-hidden="true" /><span>{
        transfer?.authorizedAt !== undefined ? `Acceso para traslado confirmado · ${formatClock(transfer.authorizedAt)}`
          : transfer ? 'Traslado solicitado · Pendiente de autorizar acceso'
          : 'Aviso a celadores · Pendiente de solicitud de traslado'
      }</span></>}
      {room.status === 'clean_pending' && <><DoorOpen size={18} aria-hidden="true" /><span>{cleaning?.authorizedAt !== undefined
        ? `Salida confirmada · ${formatClock(cleaning.authorizedAt)}. Acceso de limpieza autorizado.`
        : 'Pendiente de confirmar la salida.'}</span></>}
      {room.status === 'cleaning' && <><Sparkles size={18} aria-hidden="true" /><span>El equipo de limpieza ha registrado el inicio.</span></>}
      {room.status === 'cleaned' && <><CheckCircle2 size={18} aria-hidden="true" /><span>La preparación para el siguiente paciente está pendiente.</span></>}
    </div>
    {action && <button className="btn btn-outline room-action" type="button" disabled={busy} onClick={() => onAction({ type: action, roomId: room.id })}>
      <ActionIcon size={17} aria-hidden="true" /> {EVENT_LABELS[action]}
    </button>}
  </article>
}
