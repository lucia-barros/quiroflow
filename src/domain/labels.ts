import type { CareStatus, EventType, FamilyStatus, PerioperativeEvent, RoomStatus, SimulationState } from './model'

export type Tone = 'gray' | 'red' | 'amber' | 'green' | 'blue'
export interface StatusStyle { label: string; tone: Tone }

export const FAMILY_LABELS: Record<FamilyStatus, StatusStyle> = {
  preparation: { label: 'En preparación', tone: 'gray' },
  in_progress: { label: 'En curso', tone: 'red' },
  finishing: { label: 'Finalizando / Saliendo', tone: 'amber' },
  recovery: { label: 'En recuperación', tone: 'green' },
}

export const ROOM_LABELS: Record<RoomStatus, StatusStyle> = {
  pending: { label: 'Preparación / Pendiente', tone: 'gray' },
  ready: { label: 'Preparado para siguiente paciente', tone: 'blue' },
  occupied: { label: 'Ocupado', tone: 'red' },
  finishing: { label: 'Finalizando', tone: 'amber' },
  clean_pending: { label: 'Vacío — Limpieza pendiente', tone: 'green' },
  cleaning: { label: 'Limpieza en curso', tone: 'blue' },
  cleaned: { label: 'Limpieza finalizada', tone: 'gray' },
}

export const CARE_LABELS: Record<CareStatus, StatusStyle> = {
  waiting: { label: 'Pendiente de llamada', tone: 'gray' },
  called: { label: 'Llamada a UMCA', tone: 'blue' },
  preparation: FAMILY_LABELS.preparation,
  in_room: { label: 'En quirófano', tone: 'red' },
  anesthesia: { label: 'Circuito anestésico registrado', tone: 'red' },
  surgery: { label: 'Intervención en curso', tone: 'red' },
  finishing_surgery: { label: 'Intervención finalizada', tone: 'amber' },
  transfer_prepared: { label: 'Traslado en preparación', tone: 'amber' },
  in_transit: { label: 'En traslado', tone: 'amber' },
  recovery: FAMILY_LABELS.recovery,
  completed: { label: 'Circuito finalizado', tone: 'blue' },
}

export const EVENT_LABELS: Record<EventType, string> = {
  call_patient: 'Llamar a UMCA',
  enter_preparation: 'Confirmar entrada en preparación',
  enter_room: 'Confirmar entrada en quirófano',
  start_induction: 'Registrar inicio de inducción',
  record_no_induction: 'Registrar circuito sin inducción',
  start_surgery: 'Registrar inicio de intervención',
  finish_surgery: 'Registrar fin de intervención',
  prepare_transfer: 'Confirmar fin de fase anestésica y preparar traslado',
  authorize_transfer: 'Autorizar acceso para el traslado',
  exit_room: 'Confirmar salida de quirófano',
  arrive_recovery: 'Confirmar llegada a recuperación',
  arrive_alternative: 'Confirmar llegada a destino alternativo',
  leave_recovery: 'Registrar alta o traslado',
  start_cleaning: 'Iniciar limpieza',
  finish_cleaning: 'Finalizar limpieza',
  room_ready: 'Confirmar sala preparada',
}

const HISTORY_LABELS: Record<EventType, string> = {
  call_patient: 'Llamada a UMCA',
  enter_preparation: 'Entrada en preparación',
  enter_room: 'Entrada en quirófano',
  start_induction: 'Inicio de inducción anestésica',
  record_no_induction: 'Circuito sin inducción',
  start_surgery: 'Inicio de intervención',
  finish_surgery: 'Fin de intervención',
  prepare_transfer: 'Fin de fase anestésica y preparación del traslado',
  authorize_transfer: 'Acceso para traslado autorizado',
  exit_room: 'Salida de quirófano confirmada',
  arrive_recovery: 'Llegada a recuperación confirmada',
  arrive_alternative: 'Llegada a destino alternativo confirmada',
  leave_recovery: 'Salida de recuperación',
  start_cleaning: 'Inicio de limpieza',
  finish_cleaning: 'Fin de limpieza',
  room_ready: 'Sala preparada',
}

export function eventLabel(event: PerioperativeEvent, state: SimulationState) {
  const detail = event.unit ?? event.destination ?? event.disposition
    ?? state.destinations.find(destination => destination.id === event.umcaId)?.label
  return detail ? `${HISTORY_LABELS[event.type]} · ${detail}` : HISTORY_LABELS[event.type]
}

const clock = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Madrid' })
const date = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' })

export const formatClock = (timestamp: number) => clock.format(timestamp)
export const formatDate = (timestamp: number) => date.format(timestamp)

export function formatElapsed(now: number, start: number) {
  const seconds = Math.max(0, Math.floor((now - start) / 1000))
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map(unit => String(unit).padStart(2, '0')).join(':')
}

export function formatDuration(milliseconds: number) {
  const seconds = Math.round(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  if (!minutes) return `${seconds} s`
  return remainder ? `${minutes} min ${remainder} s` : `${minutes} min`
}
