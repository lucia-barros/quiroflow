const scope = `quiroflow:v1:${import.meta.env.BASE_URL}`
export const INTERNAL_KEY = `${scope}:internal`
export const PUBLIC_KEY = `${scope}:public`

const localEvent = `${scope}:change`
const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel(localEvent) : undefined

export function publish() {
  window.dispatchEvent(new Event(localEvent))
  channel?.postMessage('changed')
}

export function subscribe(key: string, listener: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === key || event.key === null) listener()
  }

  window.addEventListener('storage', onStorage)
  window.addEventListener(localEvent, listener)
  channel?.addEventListener('message', listener)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(localEvent, listener)
    channel?.removeEventListener('message', listener)
  }
}

export function readStored(key: string) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function parseSchema<T extends { schema: 1 }>(raw: string | null): T | null {
  if (!raw) return null
  try {
    const parsed: T = JSON.parse(raw)
    return parsed?.schema === 1 ? parsed : null
  } catch {
    return null
  }
}

export function createId() {
  return Array.from(crypto.getRandomValues(new Uint32Array(4)), part => part.toString(16).padStart(8, '0')).join('')
}
