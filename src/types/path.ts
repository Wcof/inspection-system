import { Coordinate } from './common'

export interface PathSegment {
  id: string
  pathId: string
  fromInspectionPointId: string
  toInspectionPointId: string
  order: number
  waypoints: Coordinate[]
  distance: number
  estimatedTime: number
  isAvoidable: boolean
  alternativePath?: PathSegment
  createdAt: Date
  updatedAt: Date
}

export interface InspectionPath {
  id: string
  name: string
  taskId: string
  inspectionPointIds: string[]
  segments: PathSegment[]
  totalDistance: number
  estimatedDuration: number
  isOptimized: boolean
  createdAt: Date
  updatedAt: Date
}