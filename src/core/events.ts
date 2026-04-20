import type { MapMode } from './types'

type EventMap = {
  'mode:change': { mode: MapMode }
  'region:change': { regionId: string }
  'region:loaded': { regionId: string }
  'layer:toggle': { layerId: string; visible: boolean }
  'detail:open': { feature: unknown }
  'detail:close': void
}

type Handler<T> = T extends void ? () => void : (data: T) => void

function createEventBus() {
  const listeners = new Map<string, Set<Handler<unknown>>>()

  return {
    on<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>) {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event)!.add(handler as Handler<unknown>)
    },

    off<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>) {
      listeners.get(event)?.delete(handler as Handler<unknown>)
    },

    emit<K extends keyof EventMap>(
      ...args: EventMap[K] extends void ? [event: K] : [event: K, data: EventMap[K]]
    ) {
      const [event, data] = args
      listeners.get(event)?.forEach((fn) => (fn as (...a: unknown[]) => void)(data))
    },
  }
}

export const bus = createEventBus()
