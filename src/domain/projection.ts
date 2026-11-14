import type { CareStatus, FamilyStatus, PublicProjection, SimulationState } from './model'

const familyStatus: Partial<Record<CareStatus, FamilyStatus>> = {
  preparation: 'preparation',
  in_room: 'in_progress',
  anesthesia: 'in_progress',
  surgery: 'in_progress',
  finishing_surgery: 'finishing',
  transfer_prepared: 'finishing',
  in_transit: 'finishing',
  recovery: 'recovery',
}

export function projectPublic(state: SimulationState): PublicProjection {
  const recentCalls = state.events.filter(event => event.type === 'call_patient').slice().reverse()
  return {
    schema: 1,
    showFamilyElapsed: state.settings.familyElapsed,
    calls: recentCalls.flatMap(event => {
      const patient = state.patients.find(item => item.id === event.patientId)
      const destination = state.destinations.find(item => item.id === event.umcaId)
      if (!patient || !destination || (patient.status !== 'called' && patient.status !== 'preparation')) return []
      return [{
        code: patient.code, destination: destination.label,
        calledAt: event.timestamp, active: patient.status === 'called',
      }]
    }),
    families: state.patients.flatMap(patient => {
      const status = familyStatus[patient.status]
      if (!status) return []
      const elapsedSince = status === 'in_progress' && state.settings.familyElapsed
        ? state.events.find(event => event.patientId === patient.id && event.type === 'enter_room')?.timestamp
        : undefined
      return [{ code: patient.code, status, ...(elapsedSince !== undefined && { elapsedSince }) }]
    }),
  }
}
