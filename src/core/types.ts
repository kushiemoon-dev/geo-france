export type MapMode = 'national' | 'local'

export interface LayerGroup {
  readonly id: string
  readonly label: string
  readonly layerIds: readonly string[]
  visible: boolean
}

export interface Region {
  readonly id: string
  readonly name: string
  readonly bounds: [[number, number], [number, number]]
  readonly center: [number, number]
  readonly zoom: number
}

export interface GeologyFeatureProperties {
  readonly OBJECTID?: number
  readonly NOTATION?: string
  readonly DESCR?: string
  readonly TYPE?: string
  readonly AGE?: string
  readonly PENDAGE?: number
  readonly AZIMUT?: number
  readonly ATTR?: string
  readonly [key: string]: string | number | undefined
}

export interface AppState {
  readonly mode: MapMode
  readonly regionId: string
  readonly layers: Readonly<Record<string, boolean>>
  readonly detailOpen: boolean
  readonly loading: boolean
}
