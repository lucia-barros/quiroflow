import { DEFAULT_DISPLAYS, DESTINATIONS, PATIENTS, ROOMS } from './config'
import type { Command, SimulationState } from './model'
import { recordEvent } from './workflow'

const history: [minutesAgo: number, command: Command][] = [
  [82, { type: 'room_ready', roomId: 'or-02' }],
  [80, { type: 'room_ready', roomId: 'or-03' }],
  [78, { type: 'room_ready', roomId: 'or-04' }],
  [76, { type: 'call_patient', patientId: 'case-04', umcaId: 'umca-1' }],
  [75, { type: 'enter_preparation', patientId: 'case-04' }],
  [74, { type: 'call_patient', patientId: 'case-05', umcaId: 'umca-2' }],
  [72, { type: 'enter_preparation', patientId: 'case-05' }],
  [66, { type: 'enter_room', patientId: 'case-04', roomId: 'or-03' }],
  [65, { type: 'enter_room', patientId: 'case-05', roomId: 'or-04' }],
  [64, { type: 'record_no_induction', patientId: 'case-05' }],
  [63, { type: 'call_patient', patientId: 'case-03', umcaId: 'umca-2' }],
  [62, { type: 'start_induction', patientId: 'case-04' }],
  [61, { type: 'enter_preparation', patientId: 'case-03' }],
  [60, { type: 'start_surgery', patientId: 'case-05' }],
  [56, { type: 'start_surgery', patientId: 'case-04' }],
  [47, { type: 'enter_room', patientId: 'case-03', roomId: 'or-02' }],
  [45, { type: 'start_induction', patientId: 'case-03' }],
  [39, { type: 'start_surgery', patientId: 'case-03' }],
  [19, { type: 'finish_surgery', patientId: 'case-05' }],
  [16, { type: 'prepare_transfer', patientId: 'case-05' }],
  [14, { type: 'authorize_transfer', patientId: 'case-05' }],
  [12, { type: 'exit_room', patientId: 'case-05' }],
  [9, { type: 'call_patient', patientId: 'case-02', umcaId: 'umca-1' }],
  [8, { type: 'arrive_recovery', patientId: 'case-05', unit: 'URPA' }],
  [6, { type: 'enter_preparation', patientId: 'case-02' }],
  [4, { type: 'finish_surgery', patientId: 'case-04' }],
  [3, { type: 'prepare_transfer', patientId: 'case-04' }],
  [1, { type: 'call_patient', patientId: 'case-06', umcaId: 'umca-2' }],
]

export function createInitialState(now: number, sessionId: string): SimulationState {
  const initial: SimulationState = {
    schema: 1,
    sessionId,
    patients: PATIENTS.map(patient => ({ ...patient, status: 'waiting' })),
    rooms: ROOMS.map(room => ({ ...room, status: 'pending' })),
    destinations: DESTINATIONS.map(destination => ({ ...destination })),
    events: [],
    requests: [],
    settings: { ...DEFAULT_DISPLAYS },
  }
  return history.reduce(
    (state, [minutesAgo, command], index) => recordEvent(state, command, now - minutesAgo * 60_000, `seed-${index}`),
    initial,
  )
}
