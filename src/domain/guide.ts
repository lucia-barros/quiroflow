import { DEMO_CASE } from './config'
import type { Command, PerioperativeEvent, SimulationState } from './model'

const { patientId, roomId, umcaId } = DEMO_CASE

type Stage = 'Admisión' | 'Quirófano' | 'Traslado' | 'Recuperación' | 'Limpieza'
interface GuideStep {
  stage: Stage
  title: string
  detail: string
  command: Command
}

export const GUIDE: readonly GuideStep[] = [
  { stage: 'Admisión', title: 'Llamada del paciente', detail: 'El código y su destino aparecen en el monitor de turnos.', command: { type: 'call_patient', patientId, umcaId } },
  { stage: 'Admisión', title: 'Entrada en preparación', detail: 'Familiares ya pueden seguir el código. La llamada deja de estar activa.', command: { type: 'enter_preparation', patientId } },
  { stage: 'Quirófano', title: 'Confirmación de sala preparada', detail: 'El equipo confirma que el quirófano está preparado para recibir al paciente.', command: { type: 'room_ready', roomId } },
  { stage: 'Quirófano', title: 'Entrada en quirófano', detail: 'Empiezan los cronómetros. La familia ve «En curso» y el personal ve la sala ocupada.', command: { type: 'enter_room', patientId, roomId } },
  { stage: 'Quirófano', title: 'Inicio de inducción', detail: 'En este caso se registra inducción anestésica. El panel permite registrar el circuito alternativo.', command: { type: 'start_induction', patientId } },
  { stage: 'Quirófano', title: 'Inicio de intervención', detail: 'Queda registrada la hora de comienzo para calcular la duración observada.', command: { type: 'start_surgery', patientId } },
  { stage: 'Quirófano', title: 'Fin de intervención', detail: 'La sala pasa a ámbar y sigue ocupada. El aviso anticipa el traslado.', command: { type: 'finish_surgery', patientId } },
  { stage: 'Traslado', title: 'Fin de fase anestésica', detail: 'El equipo prepara el traslado y crea la solicitud para celadores.', command: { type: 'prepare_transfer', patientId } },
  { stage: 'Traslado', title: 'Acceso para traslado', detail: 'Una confirmación expresa habilita el acceso para el traslado.', command: { type: 'authorize_transfer', patientId } },
  { stage: 'Traslado', title: 'Salida de quirófano', detail: 'La sala vacía genera un aviso autorizado para limpieza. El paciente sigue en traslado.', command: { type: 'exit_room', patientId } },
  { stage: 'Recuperación', title: 'Llegada a URPA', detail: 'Tras confirmar la llegada, el monitor de familiares muestra «En recuperación».', command: { type: 'arrive_recovery', patientId, unit: 'URPA' } },
  { stage: 'Limpieza', title: 'Inicio de limpieza', detail: 'Limpieza acepta el aviso generado al confirmar que la sala estaba vacía.', command: { type: 'start_cleaning', roomId } },
  { stage: 'Limpieza', title: 'Fin de limpieza', detail: 'La sala queda limpia y pendiente de confirmar su preparación.', command: { type: 'finish_cleaning', roomId } },
  { stage: 'Limpieza', title: 'Sala lista para el siguiente paciente', detail: 'Se registra la preparación del quirófano y se cierra el ciclo de la sala.', command: { type: 'room_ready', roomId } },
  { stage: 'Recuperación', title: 'Alta de recuperación', detail: 'Se registra el alta y el código deja de mostrarse en la pantalla de familiares.', command: { type: 'leave_recovery', patientId, disposition: 'alta' } },
]

function matches({ command, stage }: GuideStep, event: PerioperativeEvent) {
  const expectedPatient = 'patientId' in command ? command.patientId : stage === 'Limpieza' ? patientId : undefined
  return event.type === command.type
    && event.patientId === expectedPatient
    && (!('roomId' in command) || event.roomId === command.roomId)
    && (!('umcaId' in command) || event.umcaId === command.umcaId)
    && (!('unit' in command) || event.unit === command.unit)
    && (!('disposition' in command) || event.disposition === command.disposition)
}

export function guideProgress(state: SimulationState) {
  let index = 0
  for (const event of state.events) {
    const step = GUIDE[index]
    if (step && matches(step, event)) index += 1
  }
  return index
}
