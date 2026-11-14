import type { EventType, PerioperativeEvent, SimulationState } from './model'

const definitions = [
  { id: 'preparation', label: 'Preparación del paciente', from: 'enter_preparation', to: 'enter_room' },
  { id: 'induction', label: 'Inducción → Inicio de intervención', from: 'start_induction', to: 'start_surgery' },
  { id: 'surgery', label: 'Duración de intervención', from: 'start_surgery', to: 'finish_surgery' },
  { id: 'occupancy', label: 'Ocupación de quirófano', from: 'enter_room', to: 'exit_room' },
  { id: 'exit', label: 'Fin de intervención → Salida', from: 'finish_surgery', to: 'exit_room' },
  { id: 'transfer', label: 'Salida → Llegada a recuperación', from: 'exit_room', to: 'arrive_recovery' },
  { id: 'cleanWait', label: 'Salida → Inicio de limpieza', from: 'exit_room', to: 'start_cleaning' },
  { id: 'cleaning', label: 'Duración de limpieza', from: 'start_cleaning', to: 'finish_cleaning' },
  { id: 'roomPrep', label: 'Fin de limpieza → Sala preparada', from: 'finish_cleaning', to: 'room_ready' },
] as const satisfies readonly { id: string; label: string; from: EventType; to: EventType }[]

export function calculateMetrics(state: SimulationState) {
  const eventsByPatient = new Map<string, Map<EventType, PerioperativeEvent>>()
  for (const event of state.events) {
    if (!event.patientId) continue
    const patientEvents = eventsByPatient.get(event.patientId) ?? new Map<EventType, PerioperativeEvent>()
    patientEvents.set(event.type, event)
    eventsByPatient.set(event.patientId, patientEvents)
  }

  const durations = definitions.map(definition => {
    const observations = state.patients.flatMap(patient => {
      const events = eventsByPatient.get(patient.id)
      const from = events?.get(definition.from)
      const to = events?.get(definition.to)
      if (!from || !to || to.timestamp < from.timestamp) return []
      return [{ code: patient.code, milliseconds: to.timestamp - from.timestamp }]
    })
    const mean = observations.length
      ? observations.reduce((sum, observation) => sum + observation.milliseconds, 0) / observations.length
      : null
    return { ...definition, observations, mean }
  })

  const started = state.events.filter(event => event.type === 'start_surgery').length
  const finished = state.events.filter(event => event.type === 'finish_surgery').length
  return { started, finished, durations }
}
