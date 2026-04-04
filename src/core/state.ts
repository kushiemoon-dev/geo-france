import type { AppState } from './types'

type Listener = (state: AppState) => void

const initialState: AppState = {
  mode: 'national',
  regionId: 'normandie',
  layers: {
    'geology-fill': true,
    'geology-highlight': true,
    'geology-outline': true,
    'faults': true,
    'dip-points': true,
    'dip-labels': true,
    'surcharge': true,
  },
  detailOpen: false,
  loading: false,
}

let state: AppState = { ...initialState }
const listeners = new Set<Listener>()

export const store = {
  getState(): AppState {
    return state
  },

  setState(partial: Partial<AppState>): void {
    state = { ...state, ...partial }
    listeners.forEach((fn) => fn(state))
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  },
}
