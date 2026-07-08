export type MapMode = 'national' | 'local'

export interface AppState {
  readonly mode: MapMode
  readonly regionId: string
  readonly layers: Readonly<Record<string, boolean>>
  readonly detailOpen: boolean
  readonly loading: boolean
}
