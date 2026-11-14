import { useSyncExternalStore } from 'react'
import type { PublicProjection } from '../domain/model'
import { projectPublic } from '../domain/projection'
import { createInitialState } from '../domain/seed'
import { parseSchema, PUBLIC_KEY, readStored, subscribe } from './browserBus'
import type { PublicDataAdapter } from './contracts'

const initialProjection = projectPublic(createInitialState(Date.now(), 'public-preview'))
let cachedRaw: string | null = null
let cachedProjection = initialProjection

const publicAdapter: PublicDataAdapter = {
  getSnapshot() {
    const raw = readStored(PUBLIC_KEY)
    if (cachedRaw !== raw) {
      cachedRaw = raw
      cachedProjection = parseSchema<PublicProjection>(raw) ?? initialProjection
    }
    return cachedProjection
  },
  subscribe: listener => subscribe(PUBLIC_KEY, listener),
}

export const usePublicProjection = () => useSyncExternalStore(publicAdapter.subscribe, publicAdapter.getSnapshot)
