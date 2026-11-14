import { useEffect, useState, useSyncExternalStore } from 'react'
import type { Command, DisplaySettings, SimulationState } from '../domain/model'
import { projectPublic } from '../domain/projection'
import { createInitialState } from '../domain/seed'
import { recordEvent } from '../domain/workflow'
import { createId, INTERNAL_KEY, parseSchema, PUBLIC_KEY, publish, readStored, subscribe } from './browserBus'
import type { RealtimeDataAdapter, Revision } from './contracts'

function withWriteLock<T>(update: () => T): Promise<T> {
  if (!navigator.locks) {
    return Promise.reject(new Error('Para registrar hitos, abre la demo en un navegador actualizado mediante HTTPS o localhost.'))
  }
  return navigator.locks.request(INTERNAL_KEY, () => update())
}

function storageForWriting() {
  try {
    return window.localStorage
  } catch {
    throw new Error('El navegador ha bloqueado el almacenamiento local. Habilítalo para guardar la simulación.')
  }
}

export class MockDataAdapter implements RealtimeDataAdapter {
  private seed = createInitialState(Date.now(), createId())
  private raw?: string | null
  private snapshot = this.seed

  getSnapshot = () => {
    const raw = readStored(INTERNAL_KEY)
    if (raw !== this.raw) {
      this.raw = raw
      this.snapshot = parseSchema<SimulationState>(raw) ?? this.seed
    }
    return this.snapshot
  }

  subscribe = (listener: () => void) => subscribe(INTERNAL_KEY, listener)

  private commit(storage: Storage, state: SimulationState) {
    const previousProjection = storage.getItem(PUBLIC_KEY)
    const nextProjection = JSON.stringify(projectPublic(state))
    const nextSnapshot = JSON.stringify(state)

    // Si falla la segunda escritura, se restaura la proyección anterior.
    storage.setItem(PUBLIC_KEY, nextProjection)
    try {
      storage.setItem(INTERNAL_KEY, nextSnapshot)
    } catch (error) {
      if (previousProjection === null) storage.removeItem(PUBLIC_KEY)
      else storage.setItem(PUBLIC_KEY, previousProjection)
      throw error
    }
    publish()
  }

  open = () => withWriteLock(() => {
    const storage = storageForWriting()
    const state = parseSchema<SimulationState>(storage.getItem(INTERNAL_KEY))
    if (!state) {
      this.commit(storage, this.seed)
      return
    }
    const projection = JSON.stringify(projectPublic(state))
    if (storage.getItem(PUBLIC_KEY) !== projection) {
      storage.setItem(PUBLIC_KEY, projection)
      publish()
    }
  })

  record = (command: Command, revision: Revision) => withWriteLock(() => {
    const storage = storageForWriting()
    const state = this.getSnapshot()
    if (state.sessionId !== revision.sessionId || state.events.at(-1)?.id !== revision.lastEventId) {
      throw new Error('Otra pantalla ha actualizado la simulación. Revisa el estado actual y vuelve a confirmar.')
    }
    this.commit(storage, recordEvent(state, command, Date.now(), createId()))
  })

  updateSettings = (patch: Partial<DisplaySettings>, sessionId: string) => withWriteLock(() => {
    const storage = storageForWriting()
    const state = this.getSnapshot()
    if (state.sessionId !== sessionId) throw new Error('Se ha reiniciado la simulación. Vuelve a aplicar el ajuste.')
    this.commit(storage, { ...state, settings: { ...state.settings, ...patch } })
  })

  reset = () => withWriteLock(() => this.commit(storageForWriting(), createInitialState(Date.now(), createId())))
}

const adapter: RealtimeDataAdapter = new MockDataAdapter()

export function useSimulation() {
  const state = useSyncExternalStore(adapter.subscribe, adapter.getSnapshot)
  const [initializationError, setInitializationError] = useState('')
  useEffect(() => {
    let active = true
    adapter.open().catch(error => {
      if (active) setInitializationError(error instanceof Error ? error.message : 'No se pudo iniciar el almacenamiento local.')
    })
    return () => { active = false }
  }, [])
  return {
    state, initializationError,
    record: (command: Command) => adapter.record(command, { sessionId: state.sessionId, lastEventId: state.events.at(-1)?.id }),
    updateSettings: (patch: Partial<DisplaySettings>) => adapter.updateSettings(patch, state.sessionId),
    reset: adapter.reset,
  }
}
