export type CareStatus =
  | 'waiting' | 'called' | 'preparation' | 'in_room' | 'anesthesia' | 'surgery'
  | 'finishing_surgery' | 'transfer_prepared' | 'in_transit' | 'recovery' | 'completed'

export type RoomStatus = 'pending' | 'ready' | 'occupied' | 'finishing' | 'clean_pending' | 'cleaning' | 'cleaned'
export type RecoveryUnit = 'REA' | 'URPA'
export type Disposition = 'alta' | 'traslado'

export interface SimulatedPatient {
  id: string
  code: string
  status: CareStatus
  roomId?: string
  recoveryUnit?: RecoveryUnit
}

export interface OperatingRoom {
  id: string
  label: string
  status: RoomStatus
  activePatientId?: string
  turnoverPatientId?: string
}

export interface UmcaDestination {
  id: string
  label: string
}

export type PatientCommand =
  | { type: 'call_patient'; patientId: string; umcaId: string }
  | { type: 'enter_room'; patientId: string; roomId: string }
  | { type: 'arrive_recovery'; patientId: string; unit: RecoveryUnit }
  | { type: 'leave_recovery'; patientId: string; disposition: Disposition }
  | { type: 'arrive_alternative'; patientId: string; destination: string }
  | {
      type: 'enter_preparation' | 'start_induction' | 'record_no_induction' | 'start_surgery'
        | 'finish_surgery' | 'prepare_transfer' | 'authorize_transfer' | 'exit_room'
      patientId: string
    }

export type RoomAction = 'room_ready' | 'start_cleaning' | 'finish_cleaning'
export type RoomCommand = { type: RoomAction; roomId: string }
export type Command = PatientCommand | RoomCommand
export type EventType = Command['type']

export interface PerioperativeEvent {
  id: string
  type: EventType
  /** Milisegundos desde el epoch UTC. */
  timestamp: number
  patientId?: string
  roomId?: string
  umcaId?: string
  unit?: RecoveryUnit
  disposition?: Disposition
  destination?: string
}

export interface ServiceRequest {
  id: string
  kind: 'transport' | 'cleaning'
  patientId: string
  roomId: string
  status: 'requested' | 'in_progress' | 'completed'
  createdAt: number
  authorizedAt?: number
}

export interface DisplaySettings {
  familyElapsed: boolean
  roomElapsed: boolean
}

export interface SimulationState {
  schema: 1
  sessionId: string
  patients: SimulatedPatient[]
  rooms: OperatingRoom[]
  destinations: UmcaDestination[]
  events: PerioperativeEvent[]
  requests: ServiceRequest[]
  settings: DisplaySettings
}

export type FamilyStatus = 'preparation' | 'in_progress' | 'finishing' | 'recovery'

export interface FamilyRow {
  code: string
  status: FamilyStatus
  elapsedSince?: number
}

export interface CallRow {
  code: string
  destination: string
  calledAt: number
  active: boolean
}

/** Único contrato de datos que consumen los dos monitores de sala de espera. */
export interface PublicProjection {
  schema: 1
  calls: CallRow[]
  families: FamilyRow[]
  showFamilyElapsed: boolean
}
