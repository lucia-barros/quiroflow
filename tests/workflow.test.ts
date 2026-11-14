import assert from 'node:assert/strict'
import test from 'node:test'
import { DEMO_CASE } from '../src/domain/config'
import { GUIDE, guideProgress } from '../src/domain/guide'
import { calculateMetrics } from '../src/domain/metrics'
import type { Command, SimulationState } from '../src/domain/model'
import { projectPublic } from '../src/domain/projection'
import { createInitialState } from '../src/domain/seed'
import { recordEvent } from '../src/domain/workflow'

const now = Date.UTC(2026, 10, 7, 16)
const { patientId, roomId } = DEMO_CASE

function advance(steps: number, seed = createInitialState(now, 'test')) {
  return GUIDE.slice(0, steps).reduce(
    (state, step, index) => recordEvent(state, step.command, now + index * 1_000, `test-${index}`),
    seed,
  )
}

function family(state: SimulationState) {
  return projectPublic(state).families.find(row => row.code === 'C15')
}

function write(state: SimulationState, command: Command) {
  return recordEvent(state, command, now + 40_000, `test-write-${state.events.length}`)
}

test('la salida de sala y la llegada a recuperación producen estados independientes', () => {
  const beforeExit = advance(9)
  assert.equal(beforeExit.rooms.find(room => room.id === roomId)?.status, 'finishing')
  assert.equal(family(beforeExit)?.status, 'finishing')
  assert.throws(() => write(beforeExit, { type: 'start_cleaning', roomId }), /confirmación previa/)

  const afterExit = advance(10)
  const room = afterExit.rooms.find(item => item.id === roomId)
  const cleaning = afterExit.requests.find(request => request.kind === 'cleaning' && request.patientId === patientId)
  assert.equal(room?.status, 'clean_pending')
  assert.equal(room?.activePatientId, undefined)
  assert.equal(family(afterExit)?.status, 'finishing')
  assert.equal(cleaning?.authorizedAt, afterExit.events.at(-1)?.timestamp)
  assert.equal(family(advance(11))?.status, 'recovery')
})

test('el dominio rechaza duplicados, saltos y entradas sin confirmación', () => {
  const seed = advance(0)
  assert.throws(() => write(seed, { type: 'call_patient', patientId, umcaId: 'inexistente' }), /UMCA válido/)
  assert.throws(() => write(advance(1), { type: 'call_patient', patientId, umcaId: DEMO_CASE.umcaId }), /hito anterior/)
  assert.throws(() => write(advance(2), { type: 'enter_room', patientId, roomId }), /sala preparada/)
  assert.throws(() => write(advance(8), { type: 'exit_room', patientId }), /hito anterior/)
  assert.throws(() => write(advance(9), { type: 'arrive_recovery', patientId, unit: 'REA' }), /hito anterior/)
  assert.throws(() => write(advance(11), { type: 'room_ready', roomId }), /confirmación previa/)
  assert.throws(() => write(advance(11), { type: 'finish_cleaning', roomId }), /confirmación previa/)
  assert.equal(seed.events.length, advance(0).events.length)
})

test('el circuito alternativo queda registrado sin publicar recuperación', () => {
  const withoutInduction = write(advance(4), { type: 'record_no_induction', patientId })
  const surgery = write(withoutInduction, { type: 'start_surgery', patientId })
  assert.equal(surgery.patients.find(patient => patient.id === patientId)?.status, 'surgery')
  assert.ok(surgery.events.some(event => event.type === 'record_no_induction' && event.patientId === patientId))

  const direct = write(advance(10), { type: 'arrive_alternative', patientId, destination: 'Unidad de hospitalización' })
  assert.equal(family(direct), undefined)
  assert.equal(direct.events.at(-1)?.destination, 'Unidad de hospitalización')
  assert.equal(direct.requests.find(request => request.kind === 'transport' && request.patientId === patientId)?.status, 'completed')
})

test('la proyección de sala de espera contiene campos públicos y respeta el cronómetro', () => {
  const called = projectPublic(advance(1))
  assert.deepEqual(called.calls[0], { code: 'C15', destination: 'UMCA 1', calledAt: now, active: true })

  const occupied = advance(4)
  assert.deepEqual(family(occupied), { code: 'C15', status: 'in_progress', elapsedSince: now + 3_000 })
  const hiddenClock = { ...occupied, settings: { ...occupied.settings, familyElapsed: false } }
  assert.deepEqual(family(hiddenClock), { code: 'C15', status: 'in_progress' })
  assert.doesNotMatch(JSON.stringify(projectPublic(occupied)), /patientId|roomId|sessionId|URPA|case-01|or-01/)
})

test('los 15 hitos generan métricas solo con intervalos completos del mismo caso', () => {
  assert.equal(guideProgress(advance(0)), 0)
  assert.equal(guideProgress(advance(10)), 10)
  const finished = advance(15)
  assert.equal(guideProgress(finished), 15)
  assert.equal(family(finished), undefined)

  const metrics = calculateMetrics(finished)
  assert.equal(metrics.started, 4)
  assert.equal(metrics.finished, 3)
  for (const [id, milliseconds] of [['exit', 3_000], ['transfer', 1_000], ['cleanWait', 2_000], ['cleaning', 1_000], ['roomPrep', 1_000]] as const) {
    const observations = metrics.durations.find(metric => metric.id === id)?.observations
    assert.equal(observations?.find(observation => observation.code === 'C15')?.milliseconds, milliseconds)
  }
  assert.equal(calculateMetrics(advance(11)).durations.find(metric => metric.id === 'cleaning')?.mean, null)
})
