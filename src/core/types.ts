export type MapMode = 'national' | 'local'

export interface Region {
  readonly id: string
  readonly name: string
  readonly bounds: [[number, number], [number, number]]
  readonly center: [number, number]
  readonly zoom: number
}

export interface AppState {
  readonly mode: MapMode
  readonly regionId: string
  readonly layers: Readonly<Record<string, boolean>>
  readonly detailOpen: boolean
  readonly loading: boolean
}
