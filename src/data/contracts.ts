import type { Command, DisplaySettings, PublicProjection, SimulationState } from '../domain/model'

export interface Revision {
  sessionId: string
  lastEventId?: string
}

interface ReadStore<T> {
  getSnapshot(): T
  subscribe(listener: () => void): () => void
}

export type PublicDataAdapter = ReadStore<PublicProjection>

/** Contrato que un backend autenticado podría implementar por HTTP y SSE o WebSocket. */
export interface RealtimeDataAdapter extends ReadStore<SimulationState> {
  open(): Promise<void>
  record(command: Command, revision: Revision): Promise<void>
  updateSettings(patch: Partial<DisplaySettings>, sessionId: string): Promise<void>
  reset(): Promise<void>
}

/** Frontera de servidor a estudiar con el equipo hospitalario. */
export interface HospitalIntegrationAdapter {
  normalize(message: unknown): Promise<{ externalEventId: string; occurredAt: number; command: Command } | null>
}
