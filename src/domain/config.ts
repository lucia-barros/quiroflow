import type { DisplaySettings, OperatingRoom, SimulatedPatient, UmcaDestination } from './model'

// Identificadores estables para la historia de ejemplo y códigos distintos para las pantallas.
export const PATIENTS = [
  { id: 'case-01', code: 'C15' },
  { id: 'case-02', code: 'X34' },
  { id: 'case-03', code: 'Q21' },
  { id: 'case-04', code: 'M08' },
  { id: 'case-05', code: 'P16' },
  { id: 'case-06', code: 'B07' },
] satisfies Pick<SimulatedPatient, 'id' | 'code'>[]

export const ROOMS = [
  { id: 'or-01', label: 'Quirófano 01' },
  { id: 'or-02', label: 'Quirófano 02' },
  { id: 'or-03', label: 'Quirófano 03' },
  { id: 'or-04', label: 'Quirófano 04' },
] satisfies Pick<OperatingRoom, 'id' | 'label'>[]

export const DESTINATIONS = [
  { id: 'umca-1', label: 'UMCA 1' },
  { id: 'umca-2', label: 'UMCA 2' },
] satisfies UmcaDestination[]

export const ALTERNATIVE_DESTINATIONS = ['Unidad de hospitalización'] as const

export const DEFAULT_DISPLAYS: DisplaySettings = {
  familyElapsed: true,
  roomElapsed: true,
}

export const DEMO_CASE = { patientId: 'case-01', roomId: 'or-01', umcaId: 'umca-1' }
