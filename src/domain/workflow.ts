import { ALTERNATIVE_DESTINATIONS } from './config'
import type {
  CareStatus, Command, OperatingRoom, PatientCommand, PerioperativeEvent,
  RoomAction, RoomCommand, ServiceRequest, SimulationState,
} from './model'

const patientActions: Record<CareStatus, readonly PatientCommand['type'][]> = {
  waiting: ['call_patient'],
  called: ['enter_preparation'],
  preparation: ['enter_room'],
  in_room: ['start_induction', 'record_no_induction'],
  anesthesia: ['start_surgery'],
  surgery: ['finish_surgery'],
  finishing_surgery: ['prepare_transfer'],
  transfer_prepared: ['authorize_transfer'],
  in_transit: ['arrive_recovery', 'arrive_alternative'],
  recovery: ['leave_recovery'],
  completed: [],
}

export function roomRequest(state: SimulationState, room: OperatingRoom, kind: ServiceRequest['kind']) {
  const patientId = kind === 'transport' ? room.activePatientId : room.turnoverPatientId
  return state.requests.find(request =>
    request.kind === kind && request.roomId === room.id && request.patientId === patientId,
  )
}

export function availablePatientActions(state: SimulationState, patientId: string): readonly PatientCommand['type'][] {
  const patient = state.patients.find(item => item.id === patientId)
  if (!patient) return []
  if (patient.status === 'transfer_prepared') {
    const transfer = state.requests.find(request => request.kind === 'transport' && request.patientId === patientId)
    if (transfer?.authorizedAt !== undefined) return ['exit_room'] as const
  }
  return patientActions[patient.status]
}

export function availableRoomAction(state: SimulationState, room: OperatingRoom): RoomAction | undefined {
  switch (room.status) {
    case 'pending':
    case 'cleaned':
      return 'room_ready'
    case 'clean_pending':
      if (roomRequest(state, room, 'cleaning')?.authorizedAt !== undefined) return 'start_cleaning'
      return
    case 'cleaning':
      return 'finish_cleaning'
  }
}

function requireEvent(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function applyPatient(state: SimulationState, command: PatientCommand, event: PerioperativeEvent) {
  const patient = state.patients.find(item => item.id === command.patientId)
  requireEvent(patient, 'El código seleccionado no pertenece a esta simulación.')
  requireEvent(
    availablePatientActions(state, patient.id).includes(command.type),
    'El estado ha cambiado o falta confirmar un hito anterior. Revisa la acción disponible.',
  )
  event.patientId = patient.id
  event.roomId = patient.roomId
  const room = state.rooms.find(item => item.id === patient.roomId)
  const transfer = state.requests.find(request => request.kind === 'transport' && request.patientId === patient.id)

  switch (command.type) {
    case 'call_patient':
      requireEvent(state.destinations.some(item => item.id === command.umcaId), 'Selecciona un destino UMCA válido.')
      event.umcaId = command.umcaId
      patient.status = 'called'
      break
    case 'enter_preparation':
      patient.status = 'preparation'
      break
    case 'enter_room': {
      const selected = state.rooms.find(item => item.id === command.roomId)
      requireEvent(selected?.status === 'ready' && !selected.activePatientId, 'El quirófano necesita una confirmación de sala preparada.')
      patient.roomId = selected.id
      event.roomId = selected.id
      patient.status = 'in_room'
      selected.status = 'occupied'
      selected.activePatientId = patient.id
      break
    }
    case 'start_induction':
    case 'record_no_induction':
      patient.status = 'anesthesia'
      break
    case 'start_surgery':
      patient.status = 'surgery'
      break
    case 'finish_surgery':
      requireEvent(room?.activePatientId === patient.id, 'La ocupación del quirófano no coincide con este paciente.')
      patient.status = 'finishing_surgery'
      room.status = 'finishing'
      break
    case 'prepare_transfer':
      requireEvent(room?.activePatientId === patient.id, 'Confirma primero la ocupación del quirófano.')
      patient.status = 'transfer_prepared'
      state.requests.push({
        id: `transport-${event.id}`, kind: 'transport', status: 'requested',
        patientId: patient.id, roomId: room.id, createdAt: event.timestamp,
      })
      break
    case 'authorize_transfer':
      requireEvent(transfer?.status === 'requested', 'Hace falta una solicitud de traslado pendiente.')
      transfer.authorizedAt = event.timestamp
      break
    case 'exit_room':
      requireEvent(room?.activePatientId === patient.id, 'Confirma qué paciente ocupa el quirófano.')
      requireEvent(transfer?.authorizedAt !== undefined, 'Confirma primero la autorización de traslado.')
      patient.status = 'in_transit'
      transfer.status = 'in_progress'
      room.status = 'clean_pending'
      room.turnoverPatientId = patient.id
      delete room.activePatientId
      state.requests.push({
        id: `clean-${event.id}`, kind: 'cleaning', status: 'requested',
        patientId: patient.id, roomId: room.id, createdAt: event.timestamp, authorizedAt: event.timestamp,
      })
      break
    case 'arrive_recovery':
      requireEvent(command.unit === 'REA' || command.unit === 'URPA', 'Selecciona REA o URPA.')
      requireEvent(transfer?.status === 'in_progress', 'Hace falta confirmar la salida del quirófano.')
      patient.status = 'recovery'
      patient.recoveryUnit = command.unit
      event.unit = command.unit
      transfer.status = 'completed'
      break
    case 'arrive_alternative':
      requireEvent(ALTERNATIVE_DESTINATIONS.some(destination => destination === command.destination), 'Selecciona un destino alternativo válido.')
      requireEvent(transfer?.status === 'in_progress', 'Hace falta confirmar la salida del quirófano.')
      patient.status = 'completed'
      event.destination = command.destination
      transfer.status = 'completed'
      break
    case 'leave_recovery':
      requireEvent(command.disposition === 'alta' || command.disposition === 'traslado', 'Selecciona alta o traslado.')
      patient.status = 'completed'
      event.disposition = command.disposition
      break
  }
}

function applyRoom(state: SimulationState, command: RoomCommand, event: PerioperativeEvent) {
  const room = state.rooms.find(item => item.id === command.roomId)
  requireEvent(room, 'El quirófano seleccionado no existe.')
  requireEvent(
    !room.activePatientId && availableRoomAction(state, room) === command.type,
    'La sala ha cambiado de estado o falta una confirmación previa.',
  )
  event.roomId = room.id
  event.patientId = room.turnoverPatientId
  const cleaning = roomRequest(state, room, 'cleaning')

  switch (command.type) {
    case 'room_ready':
      room.status = 'ready'
      delete room.turnoverPatientId
      break
    case 'start_cleaning':
      requireEvent(cleaning?.status === 'requested' && cleaning.authorizedAt !== undefined, 'Confirma la salida antes de iniciar la limpieza.')
      cleaning.status = 'in_progress'
      room.status = 'cleaning'
      break
    case 'finish_cleaning':
      requireEvent(cleaning?.status === 'in_progress', 'Registra el inicio de limpieza antes de finalizarla.')
      cleaning.status = 'completed'
      room.status = 'cleaned'
      break
  }
}

/** Es la única vía de escritura para hitos. La validación precede a la persistencia. */
export function recordEvent(state: SimulationState, command: Command, now: number, id: string): SimulationState {
  const next = structuredClone(state)
  const lastTimestamp = next.events.at(-1)?.timestamp ?? now
  const event: PerioperativeEvent = { type: command.type, id, timestamp: Math.max(now, lastTimestamp) }
  if ('patientId' in command) applyPatient(next, command, event)
  else applyRoom(next, command, event)
  next.events.push(event)
  return next
}
